import type { Property, AnuncioExterno } from './types';

export const anunciosExternos: AnuncioExterno[] = [
  {
    id: 'ext-1',
    title: 'Casa de Praia com Piscina — Maragogi',
    description:
      'Villa à beira-mar com piscina infinita, 4 suítes e área gourmet completa. Perfeita para famílias e grupos.',
    location: 'Maragogi, AL',
    city: 'Maragogi',
    lat: -8.9167,
    lng: -35.2167,
    pricePerNight: 1200,
    bedrooms: 4,
    bathrooms: 4,
    maxGuests: 10,
    imageUrl:
      'https://images.pexels.com/photos/28586234/pexels-photo-28586234.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    rating: 4.9,
    reviews: 187,
    source: 'Airbnb',
  },
  {
    id: 'ext-2',
    title: 'Apartamento Moderno no Centro — Recife',
    description:
      'Apartamento totalmente reformado no coração do Recife, próximo a restaurantes e centros culturais.',
    location: 'Recife, PE',
    city: 'Recife',
    lat: -8.0476,
    lng: -34.877,
    pricePerNight: 450,
    bedrooms: 2,
    bathrooms: 2,
    maxGuests: 5,
    imageUrl:
      'https://images.pexels.com/photos/8135492/pexels-photo-8135492.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    rating: 4.7,
    reviews: 94,
    source: 'Booking.com',
  },
  {
    id: 'ext-3',
    title: 'Cabana Aconchegante na Serra — Campos do Jordão',
    description:
      'Cabana de madeira estilo alpino, lareira e vista para as montanhas. Ideal para casais.',
    location: 'Campos do Jordão, SP',
    city: 'Campos do Jordão',
    lat: -22.7298,
    lng: -45.5914,
    pricePerNight: 680,
    bedrooms: 1,
    bathrooms: 1,
    maxGuests: 3,
    imageUrl:
      'https://images.pexels.com/photos/29277637/pexels-photo-29277637.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    rating: 4.8,
    reviews: 156,
    source: 'Airbnb',
  },
  {
    id: 'ext-4',
    title: 'Loft de Luxo com Vista Mar — Balneário Camboriú',
    description:
      'Loft contemporâneo com vista panorâmica para o mar, finamente decorado e equipado.',
    location: 'Balneário Camboriú, SC',
    city: 'Balneário Camboriú',
    lat: -26.4912,
    lng: -48.6456,
    pricePerNight: 890,
    bedrooms: 2,
    bathrooms: 2,
    maxGuests: 6,
    imageUrl:
      'https://images.pexels.com/photos/8135496/pexels-photo-8135496.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    rating: 4.9,
    reviews: 212,
    source: 'Vrbo',
  },
  {
    id: 'ext-5',
    title: 'Casa Tropical com Piscina — Florianópolis',
    description:
      'Ampla casa tropical com piscina, churrasqueira e jardim. A 5 min da praia.',
    location: 'Florianópolis, SC',
    city: 'Florianópolis',
    lat: -27.5949,
    lng: -48.5482,
    pricePerNight: 750,
    bedrooms: 3,
    bathrooms: 2,
    maxGuests: 8,
    imageUrl:
      'https://images.pexels.com/photos/1488267/pexels-photo-1488267.png?auto=compress&cs=tinysrgb&h=650&w=940',
    rating: 4.6,
    reviews: 78,
    source: 'Airbnb',
  },
  {
    id: 'ext-6',
    title: 'Studio Minimalista — São Paulo',
    description:
      'Studio moderno e minimalista no centro de São Paulo, perfeito para viagens a negócios.',
    location: 'São Paulo, SP',
    city: 'São Paulo',
    lat: -23.5505,
    lng: -46.6333,
    pricePerNight: 320,
    bedrooms: 1,
    bathrooms: 1,
    maxGuests: 2,
    imageUrl:
      'https://images.pexels.com/photos/6920439/pexels-photo-6920439.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    rating: 4.5,
    reviews: 64,
    source: 'Booking.com',
  },
  {
    id: 'ext-7',
    title: 'Villa Beira-Mar com Piscina — Búzios',
    description:
      'Villa luxuosa de frente para o mar com piscina privada, 5 suítes e deck gourmet.',
    location: 'Búzios, RJ',
    city: 'Búzios',
    lat: -22.7467,
    lng: -41.8819,
    pricePerNight: 1850,
    bedrooms: 5,
    bathrooms: 5,
    maxGuests: 12,
    imageUrl:
      'https://images.pexels.com/photos/28586227/pexels-photo-28586227.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    rating: 5.0,
    reviews: 143,
    source: 'Vrbo',
  },
  {
    id: 'ext-8',
    title: 'Apartamento Compacto — Porto Alegre',
    description:
      'Apartamento acolhedor e funcional, bem localizado perto do centro histórico.',
    location: 'Porto Alegre, RS',
    city: 'Porto Alegre',
    lat: -30.0346,
    lng: -51.2177,
    pricePerNight: 280,
    bedrooms: 2,
    bathrooms: 1,
    maxGuests: 4,
    imageUrl:
      'https://images.pexels.com/photos/7174113/pexels-photo-7174113.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    rating: 4.4,
    reviews: 51,
    source: 'Airbnb',
  },
  {
    id: 'ext-9',
    title: 'Casa de Campo com Lareira — Gramado',
    description:
      'Casa rústica de campo com lareira, rodeada pela natureza. Acolhedor para o inverno.',
    location: 'Gramado, RS',
    city: 'Gramado',
    lat: -29.3794,
    lng: -50.8747,
    pricePerNight: 620,
    bedrooms: 3,
    bathrooms: 2,
    maxGuests: 7,
    imageUrl:
      'https://images.pexels.com/photos/3075938/pexels-photo-3075938.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    rating: 4.8,
    reviews: 119,
    source: 'Booking.com',
  },
  {
    id: 'ext-10',
    title: 'Penthouse com Vista — Rio de Janeiro',
    description:
      'Penthouse de alto padrão com vista para o Pão de Açúcar e acesso à piscina do prédio.',
    location: 'Rio de Janeiro, RJ',
    city: 'Rio de Janeiro',
    lat: -22.9068,
    lng: -43.1729,
    pricePerNight: 1100,
    bedrooms: 3,
    bathrooms: 3,
    maxGuests: 7,
    imageUrl:
      'https://images.pexels.com/photos/7546323/pexels-photo-7546323.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    rating: 4.9,
    reviews: 198,
    source: 'Airbnb',
  },
  {
    id: 'ext-11',
    title: 'Casa Moderna com Jardim — Bondi',
    description:
      'Casa contemporânea com jardim exuberante, ideal para famílias que buscam tranquilidade.',
    location: 'Bondi, AU',
    city: 'Bondi',
    lat: -33.8914,
    lng: 151.2767,
    pricePerNight: 950,
    bedrooms: 3,
    bathrooms: 2,
    maxGuests: 6,
    imageUrl:
      'https://images.pexels.com/photos/4131025/pexels-photo-4131025.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    rating: 4.7,
    reviews: 87,
    source: 'Vrbo',
  },
  {
    id: 'ext-12',
    title: 'Chalé à Beira do Lago — Montana',
    description:
      'Chalé aconchegante à beira de um lago cercado por pinheiros e montanhas.',
    location: 'Montana, US',
    city: 'Montana',
    lat: 46.8797,
    lng: -110.3626,
    pricePerNight: 540,
    bedrooms: 2,
    bathrooms: 1,
    maxGuests: 4,
    imageUrl:
      'https://images.pexels.com/photos/14569262/pexels-photo-14569262.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    rating: 4.6,
    reviews: 72,
    source: 'Airbnb',
  },
];

export const ownerProperties: Property[] = [
  {
    id: 'prop-1',
    title: 'Casa de Praia Premium — Maragogi',
    description:
      'Casa premium a 200m da praia, com 4 quartos, piscina e churrasqueira. Excelente localização.',
    location: 'Maragogi, AL',
    city: 'Maragogi',
    lat: -8.9167,
    lng: -35.2167,
    pricePerNight: 980,
    bedrooms: 4,
    bathrooms: 3,
    maxGuests: 10,
    imageUrl:
      'https://images.pexels.com/photos/8407007/pexels-photo-8407007.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    status: 'ativo',
    ownerName: 'Você',
    rating: 4.8,
    reviews: 92,
  },
  {
    id: 'prop-2',
    title: 'Apartamento Beira-Mar — Maragogi',
    description:
      'Apartamento 2 quartos a 100m da praia, totalmente equipado e reformado.',
    location: 'Maragogi, AL',
    city: 'Maragogi',
    lat: -8.9175,
    lng: -35.2155,
    pricePerNight: 520,
    bedrooms: 2,
    bathrooms: 2,
    maxGuests: 5,
    imageUrl:
      'https://images.pexels.com/photos/7167073/pexels-photo-7167073.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    status: 'alugado',
    ownerName: 'Você',
    rating: 4.6,
    reviews: 47,
  },
  {
    id: 'prop-3',
    title: 'Studio Compacto — Maragogi Centro',
    description:
      'Studio funcional no centro de Maragogi, ideal para casais. Em reforma para nova temporada.',
    location: 'Maragogi, AL',
    city: 'Maragogi',
    lat: -8.918,
    lng: -35.214,
    pricePerNight: 310,
    bedrooms: 1,
    bathrooms: 1,
    maxGuests: 2,
    imageUrl:
      'https://images.pexels.com/photos/8089172/pexels-photo-8089172.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    status: 'manutencao',
    ownerName: 'Você',
    rating: 4.3,
    reviews: 28,
  },
  {
    id: 'prop-4',
    title: 'Vila com Piscina — Maragogi',
    description:
      'Vila espaçosa com piscina, 5 quartos e área gourmet. A 300m da praia.',
    location: 'Maragogi, AL',
    city: 'Maragogi',
    lat: -8.916,
    lng: -35.2175,
    pricePerNight: 1450,
    bedrooms: 5,
    bathrooms: 4,
    maxGuests: 12,
    imageUrl:
      'https://images.pexels.com/photos/19075389/pexels-photo-19075389.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    status: 'ativo',
    ownerName: 'Você',
    rating: 4.9,
    reviews: 64,
  },
  {
    id: 'prop-5',
    title: 'Casa de Campo Aconchegante — Maragogi',
    description:
      'Casa de campo a 400m do centro, com 3 quartos e jardim amplo.',
    location: 'Maragogi, AL',
    city: 'Maragogi',
    lat: -8.915,
    lng: -35.2185,
    pricePerNight: 670,
    bedrooms: 3,
    bathrooms: 2,
    maxGuests: 8,
    imageUrl:
      'https://images.pexels.com/photos/6585598/pexels-photo-6585598.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    status: 'ativo',
    ownerName: 'Você',
    rating: 4.7,
    reviews: 39,
  },
];

export function getDashboardStats(properties: Property[]) {
  const totalProperties = properties.length;
  const activeProperties = properties.filter((p) => p.status === 'ativo').length;
  const rentedProperties = properties.filter((p) => p.status === 'alugado').length;
  const occupancyRate = totalProperties > 0
    ? Math.round((rentedProperties / totalProperties) * 100)
    : 0;
  const estimatedRevenue = properties
    .filter((p) => p.status !== 'manutencao')
    .reduce((sum, p) => sum + p.pricePerNight * 20, 0);

  return { totalProperties, activeProperties, occupancyRate, estimatedRevenue };
}
