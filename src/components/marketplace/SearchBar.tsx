import { Search, MapPin, Calendar, Users } from 'lucide-react';
import type { SearchFilters } from '@/lib/types';

interface SearchBarProps {
  filters: SearchFilters;
  onFilterChange: (filters: SearchFilters) => void;
  onSearch: () => void;
}

export default function SearchBar({ filters, onFilterChange, onSearch }: SearchBarProps) {
  return (
    <div className="mx-auto mt-8 max-w-4xl rounded-2xl border border-slate-200 bg-white p-4 shadow-lg shadow-slate-200/50 sm:p-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <MapPin className="h-3.5 w-3.5" /> Destino
          </label>
          <input
            type="text"
            value={filters.destination}
            onChange={(e) => onFilterChange({ ...filters, destination: e.target.value })}
            placeholder="Para onde?"
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>
        <div>
          <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <Calendar className="h-3.5 w-3.5" /> Check-in
          </label>
          <input
            type="date"
            value={filters.checkIn}
            onChange={(e) => onFilterChange({ ...filters, checkIn: e.target.value })}
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>
        <div>
          <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <Calendar className="h-3.5 w-3.5" /> Check-out
          </label>
          <input
            type="date"
            value={filters.checkOut}
            onChange={(e) => onFilterChange({ ...filters, checkOut: e.target.value })}
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>
        <div>
          <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <Users className="h-3.5 w-3.5" /> Hóspedes
          </label>
          <select
            value={filters.guests}
            onChange={(e) => onFilterChange({ ...filters, guests: Number(e.target.value) })}
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? 'hóspede' : 'hóspedes'}
              </option>
            ))}
          </select>
        </div>
      </div>
      <button
        onClick={onSearch}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-teal-700"
      >
        <Search className="h-4 w-4" />
        Buscar imóveis
      </button>
    </div>
  );
}
