export interface PricingSuggestion {
  justification: string;
  currentDailyPrice: number;
  suggestedDailyPrice: number;
  estimatedMonthlyExtraGain: number;
  occupiedNightsAssumption: number;
  competitorCount: number;
  competitorMedianDailyPrice: number;
  comparables: Array<{
    title: string;
    source: string;
    bedrooms: number;
    bathrooms: number;
    dailyPrice: number;
    distanceMeters: number;
  }>;
  currency: 'BRL';
}

export async function getPricingSuggestion(
  propertyId: string,
  accessToken: string,
): Promise<PricingSuggestion> {
  const response = await fetch('/api/pricing-suggestion', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ propertyId }),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || 'Não foi possível analisar os preços concorrentes.');
  }

  return result as PricingSuggestion;
}
