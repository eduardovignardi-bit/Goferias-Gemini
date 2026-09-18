import type { Property, CompetitorData, PricingSuggestion } from './types';
import { haversineKm } from './geo';

const RADIUS_METERS = 500;
const RADIUS_KM = RADIUS_METERS / 1000;

export function computePricingSuggestion(
  property: Property,
  allProperties: Property[]
): PricingSuggestion {
  const competitors: CompetitorData[] = allProperties
    .filter((p) => p.id !== property.id)
    .map((p) => ({
      id: p.id,
      title: p.title,
      pricePerNight: p.pricePerNight,
      distance: haversineKm(property.lat, property.lng, p.lat, p.lng),
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
    }))
    .filter(
      (c) =>
        c.distance <= RADIUS_KM &&
        c.bedrooms >= property.bedrooms - 1 &&
        c.bedrooms <= property.bedrooms + 1
    )
    .sort((a, b) => a.distance - b.distance);

  if (competitors.length === 0) {
    return {
      currentPrice: property.pricePerNight,
      suggestedPrice: property.pricePerNight,
      avgCompetitorPrice: property.pricePerNight,
      minCompetitorPrice: property.pricePerNight,
      maxCompetitorPrice: property.pricePerNight,
      competitorCount: 0,
      competitors: [],
      priceChangePercent: 0,
    };
  }

  const prices = competitors.map((c) => c.pricePerNight);
  const avgCompetitorPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
  const minCompetitorPrice = Math.min(...prices);
  const maxCompetitorPrice = Math.max(...prices);

  const suggestedPrice = Math.round(avgCompetitorPrice);
  const priceChangePercent =
    ((suggestedPrice - property.pricePerNight) / property.pricePerNight) * 100;

  return {
    currentPrice: property.pricePerNight,
    suggestedPrice,
    avgCompetitorPrice,
    minCompetitorPrice,
    maxCompetitorPrice,
    competitorCount: competitors.length,
    competitors,
    priceChangePercent,
  };
}
