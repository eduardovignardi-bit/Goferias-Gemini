import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

type PropertyForPricing = {
  id: string;
  title: string;
  city: string;
  state: string;
  quartos: number;
  banheiros: number;
  latitude: number;
  longitude: number;
  price: number;
};

type ComparableListing = {
  title: string;
  source: string;
  quartos: number;
  banheiros: number;
  daily_price: number;
  currency: string;
  latitude: number;
  longitude: number;
};

const MONTHLY_OCCUPIED_NIGHTS_ASSUMPTION = 15;
const MAX_DISTANCE_METERS = 500;

function getAccessToken(req: VercelRequest) {
  const authorization = req.headers.authorization;
  return typeof authorization === 'string' && authorization.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length)
    : null;
}

function isValidCoordinate(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
}

function median(values: number[]) {
  const sorted = [...values].sort((first, second) => first - second);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function haversineMeters(latitude1: number, longitude1: number, latitude2: number, longitude2: number) {
  const earthRadiusMeters = 6_371_000;
  const toRadians = (degrees: number) => degrees * (Math.PI / 180);
  const latitudeDelta = toRadians(latitude2 - latitude1);
  const longitudeDelta = toRadians(longitude2 - longitude1);
  const haversine = Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(toRadians(latitude1)) *
    Math.cos(toRadians(latitude2)) *
    Math.sin(longitudeDelta / 2) ** 2;

  return 2 * earthRadiusMeters * Math.asin(Math.sqrt(Math.min(1, haversine)));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  const accessToken = getAccessToken(req);
  if (!accessToken) {
    return res.status(401).json({ error: 'Entre na sua conta para analisar os preços.' });
  }

  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey =
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return res.status(503).json({ error: 'A autenticação do Supabase não está configurada no servidor.' });
  }

  const authClient = createClient(supabaseUrl, supabaseAnonKey);
  const { data: { user }, error: authError } = await authClient.auth.getUser(accessToken);
  if (authError || !user) {
    return res.status(401).json({ error: 'Sua sessão expirou. Entre novamente.' });
  }

  const propertyId = req.body?.propertyId;
  if (typeof propertyId !== 'string' || propertyId.length > 100) {
    return res.status(400).json({ error: 'Selecione um imóvel válido.' });
  }

  const ownerClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: propertyData, error: propertyError } = await ownerClient
    .from('properties')
    .select('id, title, city, state, quartos, banheiros, latitude, longitude, price')
    .eq('id', propertyId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (propertyError) {
    console.error('Erro ao buscar imóvel para precificação:', propertyError);
    return res.status(500).json({ error: 'Não foi possível carregar os dados do imóvel.' });
  }
  if (!propertyData) {
    return res.status(404).json({ error: 'Imóvel não encontrado para esta conta.' });
  }

  const property = propertyData as PropertyForPricing;
  if (
    !Number.isInteger(property.quartos) ||
    !Number.isFinite(property.banheiros) ||
    property.banheiros < 0 ||
    !isValidCoordinate(property.latitude, -90, 90) ||
    !isValidCoordinate(property.longitude, -180, 180)
  ) {
    return res.status(422).json({
      error: 'Cadastre quartos, banheiros e as coordenadas do imóvel para buscar concorrentes com precisão.',
    });
  }

  const currentPrice = Number(property.price);
  if (!Number.isFinite(currentPrice) || currentPrice <= 0) {
    return res.status(422).json({ error: 'Cadastre um preço por noite válido antes de pedir a análise.' });
  }

  const latitudeOffset = MAX_DISTANCE_METERS / 111_320;
  const latitudeCosine = Math.cos((property.latitude * Math.PI) / 180);
  const longitudeOffset = Math.min(
    180,
    MAX_DISTANCE_METERS / (111_320 * Math.max(Math.abs(latitudeCosine), 0.000001)),
  );
  const minLongitude = property.longitude - longitudeOffset;
  const maxLongitude = property.longitude + longitudeOffset;

  let comparableQuery = ownerClient
    .from('anuncios_externos')
    .select('title, source, quartos, banheiros, daily_price, currency, latitude, longitude')
    .eq('banheiros', property.banheiros)
    .gte('quartos', Math.max(0, property.quartos - 1))
    .lte('quartos', property.quartos + 1)
    .gte('latitude', Math.max(-90, property.latitude - latitudeOffset))
    .lte('latitude', Math.min(90, property.latitude + latitudeOffset));

  if (longitudeOffset < 180) {
    if (minLongitude < -180) {
      comparableQuery = comparableQuery.or(`longitude.gte.${minLongitude + 360},longitude.lte.${maxLongitude}`);
    } else if (maxLongitude > 180) {
      comparableQuery = comparableQuery.or(`longitude.gte.${minLongitude},longitude.lte.${maxLongitude - 360}`);
    } else {
      comparableQuery = comparableQuery
        .gte('longitude', minLongitude)
        .lte('longitude', maxLongitude);
    }
  }

  const { data: comparableRows, error: comparableError } = await comparableQuery;

  if (comparableError) {
    console.error('Erro ao buscar imóveis concorrentes:', comparableError);
    return res.status(500).json({ error: 'Não foi possível consultar os imóveis concorrentes.' });
  }

  const comparables = ((comparableRows || []) as ComparableListing[])
    .filter((listing) =>
      Math.abs(Number(listing.quartos) - property.quartos) <= 1 &&
      Number(listing.banheiros) === property.banheiros &&
      isValidCoordinate(Number(listing.latitude), -90, 90) &&
      isValidCoordinate(Number(listing.longitude), -180, 180) &&
      listing.currency === 'BRL' &&
      Number.isFinite(Number(listing.daily_price)) &&
      Number(listing.daily_price) > 0,
    )
    .map((listing) => ({
      ...listing,
      distanceMeters: haversineMeters(
        property.latitude,
        property.longitude,
        Number(listing.latitude),
        Number(listing.longitude),
      ),
    }))
    .filter((listing) => listing.distanceMeters <= MAX_DISTANCE_METERS)
    .sort((first, second) => first.distanceMeters - second.distanceMeters)
    .map((listing) => ({
      title: listing.title,
      source: listing.source,
      bedrooms: Number(listing.quartos),
      bathrooms: Number(listing.banheiros),
      dailyPrice: Number(listing.daily_price),
      distanceMeters: Math.round(listing.distanceMeters),
    }));

  if (comparables.length === 0) {
    return res.status(422).json({
      error: 'Nenhum concorrente em BRL com o mesmo número de banheiros e até um quarto de diferença foi encontrado em até 500 m.',
    });
  }

  const competitorPrices = comparables.map((listing) => listing.dailyPrice);
  const averageCompetitorPrice = competitorPrices.reduce((total, price) => total + price, 0) / competitorPrices.length;
  const suggestedDailyPrice = Number(averageCompetitorPrice.toFixed(2));
  const estimatedMonthlyExtraGain = Number(
    ((suggestedDailyPrice - currentPrice) * MONTHLY_OCCUPIED_NIGHTS_ASSUMPTION).toFixed(2),
  );

  return res.status(200).json({
    justification: `Preço sugerido calculado pela média de ${comparables.length} anúncios comparáveis em até 500 metros, com o mesmo número de banheiros e até um quarto de diferença.`,
    currentDailyPrice: currentPrice,
    suggestedDailyPrice,
    estimatedMonthlyExtraGain,
    occupiedNightsAssumption: MONTHLY_OCCUPIED_NIGHTS_ASSUMPTION,
    competitorCount: comparables.length,
    competitorMedianDailyPrice: Number(median(competitorPrices).toFixed(2)),
    comparables,
    currency: 'BRL',
  });
}
