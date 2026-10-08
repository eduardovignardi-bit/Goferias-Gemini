import React, { Suspense, lazy, useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { MapPin, Users, X, CheckCircle2, AlertTriangle, Building2, ChevronLeft, ChevronRight, SlidersHorizontal, Search, CalendarDays, Bath, BedDouble, Sparkles } from 'lucide-react';

const PropertyMap = lazy(() => import('./PropertyMap'));

interface Property {
  id: string;
  title: string;
  property_type: string;
  city: string;
  state: string;
  neighborhood: string;
  full_address: string;
  location: string;
  description: string;
  latitude: number | null;
  longitude: number | null;
  bedrooms: number;
  bathrooms: number;
  max_guests: number;
  price: number;
  cleaning_fee: number;
  images: string[];
  smart_pricing_active: boolean;
}

interface Reservation {
  property_id: string;
  check_in: string;
  check_out: string;
  status: string;
}

interface MarketplaceProps {
  onOpenProperty?: (propertyId: string) => void;
}

type DatabaseProperty = Record<string, unknown>;
type MapCoordinates = [number, number];

function isReservationBlocking(status: string) {
  return !['cancelada', 'cancelado', 'cancelled', 'canceled'].includes(status.trim().toLocaleLowerCase('pt-BR'));
}

function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getNextDate(dateString: string) {
  const [year, month, day] = dateString.split('-').map(Number);
  return formatLocalDate(new Date(year, month - 1, day + 1));
}

const initialMapCenter: MapCoordinates = [-14.2, -51.9];
const regionCenters: Record<string, MapCoordinates> = {
  norte: [-3.5, -62],
  nordeste: [-9.5, -40],
  'centro oeste': [-15.5, -55],
  sudeste: [-20.5, -44],
  sul: [-27, -51],
};

function normalizeDestination(value: string) {
  return value
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const regionByState: Record<string, string> = {
  AC: 'Norte', AP: 'Norte', AM: 'Norte', PA: 'Norte', RO: 'Norte', RR: 'Norte', TO: 'Norte',
  AL: 'Nordeste', BA: 'Nordeste', CE: 'Nordeste', MA: 'Nordeste', PB: 'Nordeste', PE: 'Nordeste',
  PI: 'Nordeste', RN: 'Nordeste', SE: 'Nordeste',
  DF: 'Centro-Oeste', GO: 'Centro-Oeste', MT: 'Centro-Oeste', MS: 'Centro-Oeste',
  ES: 'Sudeste', MG: 'Sudeste', RJ: 'Sudeste', SP: 'Sudeste',
  PR: 'Sul', RS: 'Sul', SC: 'Sul',
};

function normalizeProperty(row: DatabaseProperty): Property {
  const imageValue = row.images;
  const images = Array.isArray(imageValue)
    ? imageValue.filter((image): image is string =>
      typeof image === 'string' && image.length > 0 && !image.startsWith('blob:'),
    )
    : [];

  return {
    id: String(row.id || ''),
    title: String(row.title || 'Imóvel para temporada'),
    property_type: String(row.property_type || 'Temporada'),
    city: String(row.city || ''),
    state: String(row.state || ''),
    neighborhood: String(row.neighborhood || ''),
    full_address: String(row.full_address || ''),
    location: String(row.location || ''),
    description: String(row.description || ''),
    latitude: row.latitude == null ? null : Number(row.latitude),
    longitude: row.longitude == null ? null : Number(row.longitude),
    bedrooms: Number(row.quartos ?? row.bedrooms ?? 0),
    bathrooms: Number(row.banheiros ?? row.bathrooms ?? 0),
    max_guests: Number(row.max_guests || 0),
    price: Number(row.price || 0),
    cleaning_fee: Number(row.cleaning_fee || 0),
    images,
    smart_pricing_active: row.preco_inteligente_ativo === true,
  };
}

function hasMapCoordinates(property: Property) {
  return typeof property.latitude === 'number' && Number.isFinite(property.latitude) &&
    typeof property.longitude === 'number' && Number.isFinite(property.longitude);
}

function getNightsBetween(checkIn: string, checkOut: string) {
  if (!checkIn || !checkOut) return 0;
  const [checkInYear, checkInMonth, checkInDay] = checkIn.split('-').map(Number);
  const [checkOutYear, checkOutMonth, checkOutDay] = checkOut.split('-').map(Number);
  return (Date.UTC(checkOutYear, checkOutMonth - 1, checkOutDay) -
    Date.UTC(checkInYear, checkInMonth - 1, checkInDay)) / 86400000;
}

interface MarketplacePropertyCardProps {
  property: Property;
  onReserve: () => void;
  onViewAvailability: () => void;
  onOpenDetails: () => void;
  isReserving: boolean;
}

const fallbackPropertyImage = 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1000&q=85';

function MarketplacePropertyCard({ property, onReserve, onViewAvailability, onOpenDetails, isReserving }: MarketplacePropertyCardProps) {
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const images = property.images.length > 0 ? property.images : [fallbackPropertyImage];
  const activeImageIndex = currentImgIndex % images.length;
  const location = [property.neighborhood, property.city, property.state].filter(Boolean).join(', ');
  const formattedPrice = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(property.price);

  return (
    <article
      tabIndex={0}
      aria-label={`Ver detalhes de ${property.title}`}
      onClick={onOpenDetails}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpenDetails();
        }
      }}
      className="cursor-pointer overflow-hidden rounded-lg border border-slate-200 bg-white transition hover:border-slate-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
    >
      <div className="group relative aspect-[4/3] overflow-hidden bg-slate-100">
        <img
          src={images[activeImageIndex]}
          alt={`${property.title} - foto ${activeImageIndex + 1}`}
          loading="lazy"
          className="size-full object-cover transition duration-300 group-hover:scale-[1.02]"
        />
        <span className="absolute left-3 top-3 rounded-md bg-white/95 px-2.5 py-1 text-xs font-semibold text-slate-800 shadow-sm">
          {property.property_type || 'Temporada'}
        </span>
        {property.smart_pricing_active && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-md bg-emerald-50/95 px-2.5 py-1 text-xs font-semibold text-emerald-800 shadow-sm">
            <Sparkles className="size-3.5" /> Preço IA ativo
          </span>
        )}
        {images.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Foto anterior"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setCurrentImgIndex((index) => (index - 1 + images.length) % images.length);
              }}
              className="absolute left-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-800 opacity-0 shadow transition hover:bg-white group-hover:opacity-100 focus-visible:opacity-100"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              aria-label="Próxima foto"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setCurrentImgIndex((index) => (index + 1) % images.length);
              }}
              className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-800 opacity-0 shadow transition hover:bg-white group-hover:opacity-100 focus-visible:opacity-100"
            >
              <ChevronRight className="size-4" />
            </button>
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-slate-950/40 px-2 py-1.5">
              {images.map((_, index) => (
                <button
                  key={`${property.id}-image-${index}`}
                  type="button"
                  aria-label={`Ver foto ${index + 1}`}
                  aria-current={activeImageIndex === index ? 'true' : undefined}
                  onClick={(event) => {
                    event.stopPropagation();
                    setCurrentImgIndex(index);
                  }}
                  className={`size-1.5 rounded-full transition ${
                    activeImageIndex === index ? 'bg-white' : 'bg-white/50 hover:bg-white/80'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="space-y-3 p-4">
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold text-slate-900">{property.title}</h2>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
            <MapPin className="size-4 shrink-0 text-teal-700" />
            <span className="truncate">{location || 'Brasil'}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 pt-3 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1.5"><BedDouble className="size-4 text-slate-400" /> {property.bedrooms} quartos</span>
          <span className="inline-flex items-center gap-1.5"><Bath className="size-4 text-slate-400" /> {property.bathrooms} banheiros</span>
          <span className="inline-flex items-center gap-1.5"><Users className="size-4 text-slate-400" /> Até {property.max_guests} hóspedes</span>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-3 border-t border-slate-100 pt-3">
          <p className="text-sm font-bold text-slate-900">
            {formattedPrice} <span className="font-normal text-slate-500">/ diária</span>
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onViewAvailability();
              }}
              className="rounded-md border border-teal-700 px-3 py-2 text-xs font-semibold text-teal-800 transition hover:bg-teal-50"
            >
              Ver disponibilidade
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onReserve();
              }}
              disabled={isReserving}
              className="rounded-md bg-teal-700 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-teal-800 disabled:cursor-wait disabled:opacity-60"
            >
              {isReserving ? 'Solicitando...' : 'Reservar'}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

export const Marketplace: React.FC<MarketplaceProps> = ({ onOpenProperty }) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [reservingPropertyId, setReservingPropertyId] = useState<string | null>(null);
  const [isResModalOpen, setIsResModalOpen] = useState(false);
  const [activePropertyDetail, setActivePropertyDetail] = useState<Property | null>(null);
  const [detailImageIndex, setDetailImageIndex] = useState(0);
  
  // Estados dos Filtros Avançados
  const [destination, setDestination] = useState('');
  const [guestCount, setGuestCount] = useState<number>(0);
  const [searchCheckIn, setSearchCheckIn] = useState('');
  const [searchCheckOut, setSearchCheckOut] = useState('');
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(5000);
  const [minBedrooms, setMinBedrooms] = useState<number>(0);
  const [minBathrooms, setMinBathrooms] = useState<number>(0);
  const [mapCenter, setMapCenter] = useState<MapCoordinates>(initialMapCenter);
  const [mapZoom, setMapZoom] = useState(4);
  const [isLocatingDestination, setIsLocatingDestination] = useState(false);
  const [mapNotice, setMapNotice] = useState<string | null>(null);

  // Estados do Modal de Reserva
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const nightsCount = getNightsBetween(checkIn, checkOut);
  const totalPrice = selectedProperty && nightsCount > 0
    ? (Number(selectedProperty.price) * nightsCount) + Number(selectedProperty.cleaning_fee)
    : 0;
  const detailImages = activePropertyDetail?.images.length
    ? activePropertyDetail.images
    : [fallbackPropertyImage];
  const activeDetailImageIndex = detailImageIndex % detailImages.length;

  // Toast flutuante
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchMarketplaceData();
  }, []);

  // Lógica de Filtragem em Tempo Real
  useEffect(() => {
    let result = properties;

    if (destination.trim()) {
      const term = normalizeDestination(destination);
      result = result.filter((property) => {
        const searchableText = normalizeDestination([
          property.city,
          property.state,
          regionByState[property.state.trim().toLocaleUpperCase('pt-BR')] || '',
          property.neighborhood,
          property.full_address,
          property.location,
          property.title,
        ].join(' '));
        return searchableText.includes(term);
      });
    }

    if (guestCount > 0) result = result.filter((property) => property.max_guests >= guestCount);
    if (minPrice > 0) result = result.filter((property) => property.price >= minPrice);
    if (maxPrice > 0 && maxPrice !== 5000) {
      result = result.filter((property) => property.price <= maxPrice);
    }
    if (minBedrooms > 0) result = result.filter((property) => property.bedrooms >= minBedrooms);
    if (minBathrooms > 0) result = result.filter((property) => property.bathrooms >= minBathrooms);

    if (searchCheckIn && searchCheckOut) {
      result = result.filter((property) => !reservations.some((reservation) => {
        return isReservationBlocking(reservation.status) &&
          reservation.property_id === property.id &&
          reservation.check_in < searchCheckOut &&
          reservation.check_out > searchCheckIn;
      }));
    }

    setFilteredProperties(result);
  }, [destination, guestCount, maxPrice, minBathrooms, minBedrooms, minPrice, properties, reservations, searchCheckIn, searchCheckOut]);

  const fetchMarketplaceData = async () => {
    try {
      setLoading(true);
      const [propertyResponse, reservationResponse] = await Promise.all([
        supabase.from('Properties').select('*').order('created_at', { ascending: false }),
        supabase.from('reservations').select('property_id, check_in, check_out, status')
      ]);

      if (propertyResponse.error) {
        console.error('Erro ao carregar imóveis do marketplace:', propertyResponse.error);
        setProperties([]);
      } else {
        const propertyRows = propertyResponse.data as DatabaseProperty[] | null;
        setProperties((propertyRows || []).map(normalizeProperty));
      }

      if (reservationResponse.data) setReservations(reservationResponse.data);
    } catch (err) {
      console.error('Erro ao carregar marketplace:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void fetchMarketplaceData();

    const query = destination.trim();
    if (!query) {
      setMapCenter(initialMapCenter);
      setMapZoom(4);
      setMapNotice(null);
      return;
    }

    setIsLocatingDestination(true);
    setMapNotice(null);
    try {
      const regionCenter = regionCenters[normalizeDestination(query)];
      if (regionCenter) {
        setMapCenter(regionCenter);
        setMapZoom(5);
        return;
      }

      const geocodingUrl = new URL('https://nominatim.openstreetmap.org/search');
      geocodingUrl.searchParams.set('format', 'jsonv2');
      geocodingUrl.searchParams.set('limit', '1');
      geocodingUrl.searchParams.set('countrycodes', 'br');
      geocodingUrl.searchParams.set('q', `${query}, Brasil`);
      const response = await fetch(geocodingUrl, { headers: { 'Accept-Language': 'pt-BR' } });
      if (!response.ok) throw new Error('Falha na geocodificação');
      const results = await response.json() as Array<{ lat: string; lon: string }>;

      if (!results[0]) {
        setMapNotice('Não encontramos esse destino no mapa.');
        return;
      }

      setMapCenter([Number(results[0].lat), Number(results[0].lon)]);
      setMapZoom(12);
    } catch {
      setMapNotice('Não foi possível localizar o destino no mapa agora.');
    } finally {
      setIsLocatingDestination(false);
    }
  };

  const handleResetFilters = () => {
    setDestination('');
    setGuestCount(0);
    setSearchCheckIn('');
    setSearchCheckOut('');
    setMinPrice(0);
    setMaxPrice(5000);
    setMinBedrooms(0);
    setMinBathrooms(0);
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const closeReservationModal = () => {
    setIsResModalOpen(false);
    setSelectedProperty(null);
    setCheckIn('');
    setCheckOut('');
    setGuestName('');
    setGuestEmail('');
  };

  const handleCreateReservation = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedProperty || !checkIn || !checkOut || !guestName.trim() || !guestEmail.trim()) {
      showToast('Preencha seus dados e selecione as datas da estadia.', 'error');
      return;
    }

    const nights = getNightsBetween(checkIn, checkOut);
    if (nights <= 0 || checkIn < formatLocalDate(new Date())) {
      showToast('Informe datas válidas, com check-in a partir de hoje e check-out posterior.', 'error');
      return;
    }

    try {
      setReservingPropertyId(selectedProperty.id);
      const { data: existingReservations, error: reservationsError } = await supabase
        .from('reservations')
        .select('check_in, check_out, status')
        .eq('property_id', selectedProperty.id)
        .neq('status', 'Cancelada');

      if (reservationsError) throw reservationsError;

      const hasDateConflict = (existingReservations || []).some((reservation) =>
        isReservationBlocking(reservation.status) &&
        reservation.check_in < checkOut &&
        reservation.check_out > checkIn,
      );
      if (hasDateConflict) {
        showToast('Este período já está reservado. Por favor, escolha outras datas.', 'error');
        return;
      }

      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;

      const user = authData.user;
      if (!user) {
        alert('Faça login para solicitar uma reserva.');
        return;
      }

      const metadataName = user.user_metadata?.full_name ?? user.user_metadata?.name;
      const reservation = {
        property_id: selectedProperty.id,
        guest_name: guestName.trim() || (typeof metadataName === 'string' ? metadataName : user.email || ''),
        guest_email: user.email || guestEmail.trim(),
        check_in: checkIn,
        check_out: checkOut,
        total_price: totalPrice,
        status: 'Pendente',
      };

      if (!reservation.guest_email) {
        showToast('Não foi possível obter um e-mail para a reserva.', 'error');
        return;
      }

      const { error } = await supabase.from('reservations').insert([reservation]);
      if (error) throw error;

      setReservations((currentReservations) => [
        ...currentReservations,
        {
          property_id: reservation.property_id,
          check_in: reservation.check_in,
          check_out: reservation.check_out,
          status: reservation.status,
        },
      ]);
      showToast('Reserva solicitada com sucesso!', 'success');
      closeReservationModal();
    } catch (err: unknown) {
      console.error('Erro ao solicitar reserva:', err);
      const message = err instanceof Error ? err.message : 'Erro desconhecido ao solicitar reserva.';
      showToast(message, 'error');
    } finally {
      setReservingPropertyId(null);
    }
  };

  const handleOpenBookingModal = (property: Property) => {
    setSelectedProperty(property);
    setGuestName('');
    setGuestEmail('');
    setCheckIn('');
    setCheckOut('');
    setIsResModalOpen(true);
  };

  return (
    <div className="space-y-8 relative">
      
      {/* Toast Flutuante */}
      {toast && (
        <div className={`fixed bottom-8 right-8 z-50 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 text-sm font-bold text-white transition-all transform animate-bounce ${
          toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          <span>{toast.message}</span>
        </div>
      )}

      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase text-teal-800">GoFérias · estadias no Brasil</p>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-950">Encontre sua próxima estadia</h1>
            <p className="mt-1 text-sm text-slate-600">Casas e apartamentos para sua próxima viagem.</p>
          </div>
          <p className="text-sm font-medium text-slate-500">{filteredProperties.length} imóveis</p>
        </div>
      </header>

      <form
        onSubmit={handleSearch}
        className="grid gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:grid-cols-2 lg:grid-cols-[minmax(220px,1.5fr)_minmax(145px,1fr)_minmax(145px,1fr)_minmax(130px,0.8fr)_auto] lg:items-end"
      >
        <label>
          <span className="mb-1 block text-xs font-semibold text-slate-700">Destino</span>
          <span className="relative block">
            <MapPin className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-teal-700" />
            <input
              type="search"
              value={destination}
              onChange={(event) => setDestination(event.target.value)}
              placeholder="Cidade, estado ou região"
              className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
            />
          </span>
        </label>
        <label>
          <span className="mb-1 block text-xs font-semibold text-slate-700">Check-in</span>
          <span className="relative block">
            <CalendarDays className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              type="date"
              min={new Date().toISOString().slice(0, 10)}
              value={searchCheckIn}
              onChange={(event) => setSearchCheckIn(event.target.value)}
              className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-2 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
            />
          </span>
        </label>
        <label>
          <span className="mb-1 block text-xs font-semibold text-slate-700">Check-out</span>
          <span className="relative block">
            <CalendarDays className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              type="date"
              min={searchCheckIn || new Date().toISOString().slice(0, 10)}
              value={searchCheckOut}
              onChange={(event) => setSearchCheckOut(event.target.value)}
              className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-2 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
            />
          </span>
        </label>
        <label>
          <span className="mb-1 block text-xs font-semibold text-slate-700">Hóspedes</span>
          <span className="relative block">
            <Users className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              type="number"
              min="1"
              max="30"
              value={guestCount || ''}
              onChange={(event) => setGuestCount(Number(event.target.value))}
              placeholder="Qualquer"
              className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
            />
          </span>
        </label>
        <button type="submit" disabled={isLocatingDestination} className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-800 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-900 disabled:cursor-wait disabled:opacity-70">
          <Search className="size-4" /> {isLocatingDestination ? 'Localizando...' : 'Buscar'}
        </button>
      </form>

      <details className="group rounded-xl border border-slate-200 bg-white px-4 shadow-sm">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-3">
          <span className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <SlidersHorizontal className="size-4 text-teal-700" /> Filtros
          </span>
          <span className="text-xs font-medium text-teal-800 group-open:hidden">Mostrar</span>
          <span className="hidden text-xs font-medium text-teal-800 group-open:inline">Ocultar</span>
        </summary>
        <div className="grid gap-4 border-t border-slate-100 py-4 sm:grid-cols-2 lg:grid-cols-5">
          <label>
            <span className="mb-1 block text-xs font-semibold text-slate-700">Preço mínimo / diária</span>
            <input type="number" min="0" value={minPrice} onChange={(event) => setMinPrice(Number(event.target.value))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </label>
          <label>
            <span className="mb-1 block text-xs font-semibold text-slate-700">Preço máximo / diária</span>
            <input type="number" min={minPrice} value={maxPrice} onChange={(event) => setMaxPrice(Number(event.target.value))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </label>
          <label>
            <span className="mb-1 block text-xs font-semibold text-slate-700">Mínimo de quartos</span>
            <select value={minBedrooms} onChange={(event) => setMinBedrooms(Number(event.target.value))} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
              <option value={0}>Qualquer</option>
              {[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{value}+</option>)}
            </select>
          </label>
          <label>
            <span className="mb-1 block text-xs font-semibold text-slate-700">Mínimo de banheiros</span>
            <select value={minBathrooms} onChange={(event) => setMinBathrooms(Number(event.target.value))} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
              <option value={0}>Qualquer</option>
              {[1, 2, 3, 4].map((value) => <option key={value} value={value}>{value}+</option>)}
            </select>
          </label>
          <div className="flex items-end">
            <button type="button" onClick={handleResetFilters} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
              Limpar filtros
            </button>
          </div>
        </div>
      </details>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(320px,2fr)]">
        <section aria-label="Imóveis disponíveis">
          {loading ? (
            <div className="py-16 text-center text-sm font-medium text-slate-500">Carregando imóveis disponíveis...</div>
          ) : filteredProperties.length === 0 ? (
            <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-8 text-center">
              <Building2 className="mx-auto size-10 text-teal-700" />
              <h2 className="font-semibold text-slate-900">Nenhum imóvel encontrado</h2>
              <p className="text-sm text-slate-500">Tente mudar o destino ou remover alguns filtros.</p>
              <button type="button" onClick={handleResetFilters} className="rounded-lg bg-teal-800 px-4 py-2 text-sm font-semibold text-white">
                Limpar filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {filteredProperties.map((property) => (
                <MarketplacePropertyCard
                  key={property.id}
                  property={property}
                  onReserve={() => handleOpenBookingModal(property)}
                  onViewAvailability={() => onOpenProperty ? onOpenProperty(property.id) : handleOpenBookingModal(property)}
                  onOpenDetails={() => {
                    setActivePropertyDetail(property);
                    setDetailImageIndex(0);
                  }}
                  isReserving={reservingPropertyId === property.id}
                />
              ))}
            </div>
          )}
        </section>

        <aside className="relative z-0 h-[440px] min-h-[440px] overflow-hidden rounded-xl border border-slate-200 bg-slate-100 lg:sticky lg:top-24 lg:h-[calc(100vh-7.5rem)]">
          <Suspense fallback={<div className="flex h-full items-center justify-center text-sm text-slate-500">Carregando mapa...</div>}>
            <PropertyMap
              center={mapCenter}
              zoom={mapZoom}
              properties={filteredProperties}
              notice={mapNotice}
              showMissingCoordinates={!loading && !filteredProperties.some(hasMapCoordinates)}
              onOpenProperty={onOpenProperty}
            />
          </Suspense>
        </aside>
      </div>

      {activePropertyDetail && (
        <div className="fixed inset-0 z-40 overflow-y-auto bg-slate-50">
          <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
              <div className="min-w-0">
                <h2 className="truncate text-lg font-bold text-slate-900">{activePropertyDetail.title}</h2>
                <p className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-500">
                  <MapPin className="size-4 text-teal-700" />
                  {[activePropertyDetail.neighborhood, activePropertyDetail.city, activePropertyDetail.state]
                    .filter(Boolean)
                    .join(', ') || 'Brasil'}
                </p>
              </div>
              <button
                type="button"
                aria-label="Fechar detalhes do imóvel"
                onClick={() => setActivePropertyDetail(null)}
                className="ml-4 inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
              >
                <X className="size-5" />
              </button>
            </div>
          </header>

          <main className="mx-auto grid max-w-7xl gap-8 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8 lg:py-10">
            <div className="min-w-0 space-y-8">
              <section aria-label="Fotos do imóvel" className="space-y-3">
                <div className="group relative h-[min(65vh,620px)] min-h-72 overflow-hidden rounded-2xl bg-slate-200 shadow-sm">
                  <img
                    src={detailImages[activeDetailImageIndex]}
                    alt={`${activePropertyDetail.title} - foto ${activeDetailImageIndex + 1}`}
                    className="size-full object-cover"
                  />
                  {detailImages.length > 1 && (
                    <>
                      <button
                        type="button"
                        aria-label="Foto anterior"
                        onClick={() => setDetailImageIndex((index) => (index - 1 + detailImages.length) % detailImages.length)}
                        className="absolute left-4 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-slate-800 shadow-lg transition hover:scale-105"
                      >
                        <ChevronLeft className="size-6" />
                      </button>
                      <button
                        type="button"
                        aria-label="Próxima foto"
                        onClick={() => setDetailImageIndex((index) => (index + 1) % detailImages.length)}
                        className="absolute right-4 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-slate-800 shadow-lg transition hover:scale-105"
                      >
                        <ChevronRight className="size-6" />
                      </button>
                      <span className="absolute bottom-4 right-4 rounded-full bg-slate-950/70 px-3 py-1.5 text-xs font-semibold text-white">
                        {activeDetailImageIndex + 1} / {detailImages.length}
                      </span>
                    </>
                  )}
                </div>
                {detailImages.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {detailImages.map((image, index) => (
                      <button
                        key={`${activePropertyDetail.id}-detail-${index}`}
                        type="button"
                        aria-label={`Mostrar foto ${index + 1}`}
                        aria-current={index === activeDetailImageIndex ? 'true' : undefined}
                        onClick={() => setDetailImageIndex(index)}
                        className={`size-16 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                          index === activeDetailImageIndex ? 'border-teal-600' : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={image} alt="" className="size-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </section>

              <section className="space-y-4">
                <div className="border-b border-slate-200 pb-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
                    {activePropertyDetail.property_type || 'Imóvel para temporada'}
                  </p>
                  <h1 className="mt-1 text-2xl font-bold text-slate-950 sm:text-3xl">{activePropertyDetail.title}</h1>
                  <p className="mt-2 flex items-center gap-1.5 text-slate-600">
                    <MapPin className="size-4 text-teal-700" />
                    {[activePropertyDetail.neighborhood, activePropertyDetail.city, activePropertyDetail.state]
                      .filter(Boolean)
                      .join(', ') || 'Localização no Brasil'}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3 border-b border-slate-200 pb-5">
                  <div className="rounded-xl bg-white p-4 text-center shadow-sm">
                    <BedDouble className="mx-auto size-5 text-teal-700" />
                    <span className="mt-2 block text-lg font-bold text-slate-900">{activePropertyDetail.bedrooms}</span>
                    <span className="text-xs text-slate-500">quartos</span>
                  </div>
                  <div className="rounded-xl bg-white p-4 text-center shadow-sm">
                    <Bath className="mx-auto size-5 text-teal-700" />
                    <span className="mt-2 block text-lg font-bold text-slate-900">{activePropertyDetail.bathrooms}</span>
                    <span className="text-xs text-slate-500">banheiros</span>
                  </div>
                  <div className="rounded-xl bg-white p-4 text-center shadow-sm">
                    <Users className="mx-auto size-5 text-teal-700" />
                    <span className="mt-2 block text-lg font-bold text-slate-900">{activePropertyDetail.max_guests}</span>
                    <span className="text-xs text-slate-500">hóspedes</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-slate-900">Sobre este imóvel</h3>
                  <p className="whitespace-pre-line text-sm leading-7 text-slate-600">
                    {activePropertyDetail.description.trim() || `Aproveite sua estadia neste ${activePropertyDetail.property_type.toLocaleLowerCase('pt-BR')} em ${activePropertyDetail.city || 'uma ótima localização'}. O imóvel acomoda até ${activePropertyDetail.max_guests} hóspedes e conta com ${activePropertyDetail.bedrooms} quartos e ${activePropertyDetail.bathrooms} banheiros.`}
                  </p>
                </div>
              </section>
            </div>

            <aside className="lg:sticky lg:top-24 lg:self-start">
              <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
                <div>
                  <p className="text-sm text-slate-500">Diária a partir de</p>
                  <p className="mt-1 text-3xl font-extrabold text-slate-950">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(activePropertyDetail.price)}
                    <span className="ml-1 text-sm font-normal text-slate-500">/ noite</span>
                  </p>
                </div>
                <div className="space-y-3 border-y border-slate-100 py-4 text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>Preço por noite</span>
                    <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(activePropertyDetail.price)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Taxa de limpeza</span>
                    <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(activePropertyDetail.cleaning_fee)}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenBookingModal(activePropertyDetail)}
                  className="w-full rounded-xl bg-teal-700 px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
                >
                  Reservar
                </button>
                <p className="text-center text-xs text-slate-500">As datas e o valor final serão confirmados antes do envio.</p>
              </section>
            </aside>
          </main>
        </div>
      )}

      {isResModalOpen && selectedProperty && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm"
          onClick={(event) => {
            if (event.target === event.currentTarget && !reservingPropertyId) closeReservationModal();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="reservation-modal-title"
            className="my-8 w-full max-w-lg space-y-5 rounded-3xl bg-white p-6 shadow-2xl"
          >
            <header className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase text-teal-600">Solicitar reserva</span>
                <h2 id="reservation-modal-title" className="mt-0.5 text-lg font-extrabold text-slate-800">
                  {selectedProperty.title}
                </h2>
                <p className="text-xs text-slate-500">{selectedProperty.city} - {selectedProperty.state}</p>
              </div>
              <button
                type="button"
                aria-label="Fechar modal"
                onClick={closeReservationModal}
                disabled={Boolean(reservingPropertyId)}
                className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 disabled:opacity-50"
              >
                <X className="size-5" />
              </button>
            </header>

            <form onSubmit={handleCreateReservation} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Nome
                  <input
                    type="text"
                    required
                    autoComplete="name"
                    value={guestName}
                    onChange={(event) => setGuestName(event.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                  />
                </label>
                <label className="block text-xs font-semibold text-slate-700">
                  E-mail
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={guestEmail}
                    onChange={(event) => setGuestEmail(event.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                  />
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Check-in
                  <input
                    type="date"
                    required
                    min={formatLocalDate(new Date())}
                    value={checkIn}
                    onChange={(event) => {
                      setCheckIn(event.target.value);
                      if (checkOut && event.target.value >= checkOut) setCheckOut('');
                    }}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                  />
                </label>
                <label className="block text-xs font-semibold text-slate-700">
                  Check-out
                  <input
                    type="date"
                    required
                    min={checkIn ? getNextDate(checkIn) : formatLocalDate(new Date())}
                    value={checkOut}
                    onChange={(event) => setCheckOut(event.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                  />
                </label>
              </div>

              <div className="space-y-2 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Diária ({nightsCount} {nightsCount === 1 ? 'noite' : 'noites'})</span>
                  <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(nightsCount * selectedProperty.price)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Taxa de limpeza</span>
                  <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedProperty.cleaning_fee)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-slate-900">
                  <span>Total</span>
                  <span className="text-teal-700">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPrice)}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={closeReservationModal}
                  disabled={Boolean(reservingPropertyId)}
                  className="flex-1 rounded-xl bg-slate-100 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-200 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!checkIn || !checkOut || nightsCount <= 0 || Boolean(reservingPropertyId)}
                  className="flex-1 rounded-xl bg-teal-700 py-3 text-sm font-bold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {reservingPropertyId ? 'Verificando disponibilidade...' : 'Solicitar reserva'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

    </div>
  );
};