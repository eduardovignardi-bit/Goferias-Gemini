export type PropertyStatus = 'ativo' | 'alugado' | 'manutencao';

export interface Property {
  id: string;
  title: string;
  description: string;
  location: string;
  city: string;
  lat: number;
  lng: number;
  pricePerNight: number;
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  imageUrl: string;
  status: PropertyStatus;
  ownerName: string;
  rating: number;
  reviews: number;
}

export interface AnuncioExterno {
  id: string;
  title: string;
  description: string;
  location: string;
  city: string;
  lat: number;
  lng: number;
  pricePerNight: number;
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  imageUrl: string;
  rating: number;
  reviews: number;
  source: string;
}

export interface CompetitorData {
  id: string;
  title: string;
  pricePerNight: number;
  distance: number;
  bedrooms: number;
  bathrooms: number;
}

export interface PricingSuggestion {
  currentPrice: number;
  suggestedPrice: number;
  avgCompetitorPrice: number;
  minCompetitorPrice: number;
  maxCompetitorPrice: number;
  competitorCount: number;
  competitors: CompetitorData[];
  priceChangePercent: number;
}

export interface SearchFilters {
  destination: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  bedrooms: number;
  bathrooms: number;
  radiusKm: number;
}

export interface DashboardStats {
  estimatedRevenue: number;
  occupancyRate: number;
  totalProperties: number;
  activeProperties: number;
}
