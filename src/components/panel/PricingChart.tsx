import type { PricingSuggestion } from '@/lib/types';

interface PricingChartProps {
  suggestion: PricingSuggestion;
}

export default function PricingChart({ suggestion }: PricingChartProps) {
  const { competitors, currentPrice, suggestedPrice, avgCompetitorPrice } = suggestion;
  const allPrices = [...competitors.map((c) => c.pricePerNight), currentPrice, suggestedPrice];
  const maxPrice = Math.max(...allPrices) * 1.15;
  const minPrice = Math.min(...allPrices) * 0.85;
  const range = maxPrice - minPrice || 1;

  const barHeight = (price: number) =>
    `${Math.max(8, ((price - minPrice) / range) * 100)}%`;

  return (
    <div className="mt-4">
      <div className="flex items-end gap-2 overflow-x-auto pb-2" style={{ minHeight: '160px' }}>
        {competitors.map((c) => (
          <div key={c.id} className="flex min-w-[48px] flex-1 flex-col items-center gap-1">
            <span className="text-[10px] font-medium text-slate-400">
              R${c.pricePerNight}
            </span>
            <div className="flex w-full items-end" style={{ height: '120px' }}>
              <div
                className="w-full rounded-t-md bg-slate-200 transition-all duration-500"
                style={{ height: barHeight(c.pricePerNight) }}
              />
            </div>
            <span className="truncate text-[10px] text-slate-400" title={c.title}>
              {c.distance.toFixed(0)}m
            </span>
          </div>
        ))}
        <div className="flex min-w-[48px] flex-1 flex-col items-center gap-1">
          <span className="text-[10px] font-semibold text-slate-600">
            R${currentPrice}
          </span>
          <div className="flex w-full items-end" style={{ height: '120px' }}>
            <div
              className="w-full rounded-t-md bg-amber-400 transition-all duration-500"
              style={{ height: barHeight(currentPrice) }}
            />
          </div>
          <span className="text-[10px] font-semibold text-amber-600">Atual</span>
        </div>
        <div className="flex min-w-[48px] flex-1 flex-col items-center gap-1">
          <span className="text-[10px] font-semibold text-teal-600">
            R${suggestedPrice}
          </span>
          <div className="flex w-full items-end" style={{ height: '120px' }}>
            <div
              className="w-full rounded-t-md bg-teal-500 transition-all duration-500"
              style={{ height: barHeight(suggestedPrice) }}
            />
          </div>
          <span className="text-[10px] font-semibold text-teal-600">Sugerido</span>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between rounded-lg bg-slate-50 px-4 py-2.5">
        <span className="text-xs text-slate-500">Média dos concorrentes</span>
        <span className="text-sm font-bold text-slate-900">
          R$ {avgCompetitorPrice.toFixed(0)}
        </span>
      </div>
    </div>
  );
}
