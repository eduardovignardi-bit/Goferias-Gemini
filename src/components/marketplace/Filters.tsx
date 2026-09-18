import { SlidersHorizontal, X } from 'lucide-react';
import type { SearchFilters } from '@/lib/types';

interface FiltersProps {
  filters: SearchFilters;
  onFilterChange: (filters: SearchFilters) => void;
  onReset: () => void;
}

export default function Filters({ filters, onFilterChange, onReset }: FiltersProps) {
  return (
    <aside className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
          <SlidersHorizontal className="h-4 w-4 text-teal-600" />
          Filtros
        </h3>
        <button
          onClick={onReset}
          className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700"
        >
          <X className="h-3.5 w-3.5" />
          Limpar
        </button>
      </div>

      <div className="space-y-5">
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Quartos (mínimo)
          </label>
          <div className="flex flex-wrap gap-2">
            {[0, 1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => onFilterChange({ ...filters, bedrooms: n })}
                className={`min-w-[2.5rem] rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                  filters.bedrooms === n
                    ? 'border-teal-600 bg-teal-600 text-white'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                {n === 0 ? 'Todos' : `${n}+`}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Banheiros (mínimo)
          </label>
          <div className="flex flex-wrap gap-2">
            {[0, 1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => onFilterChange({ ...filters, bathrooms: n })}
                className={`min-w-[2.5rem] rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                  filters.bathrooms === n
                    ? 'border-teal-600 bg-teal-600 text-white'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                {n === 0 ? 'Todos' : `${n}+`}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Raio de proximidade: {filters.radiusKm} km
          </label>
          <input
            type="range"
            min={1}
            max={50}
            value={filters.radiusKm}
            onChange={(e) => onFilterChange({ ...filters, radiusKm: Number(e.target.value) })}
            className="w-full accent-teal-600"
          />
          <div className="flex justify-between text-xs text-slate-400">
            <span>1 km</span>
            <span>50 km</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
