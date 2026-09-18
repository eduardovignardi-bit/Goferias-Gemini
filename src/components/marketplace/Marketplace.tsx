import { useMemo, useState } from 'react';
import { anunciosExternos } from '@/lib/mockData';
import type { AnuncioExterno, SearchFilters } from '@/lib/types';
import { haversineKm } from '@/lib/geo';
import SearchBar from './SearchBar';
import Filters from './Filters';
import PropertyCard from './PropertyCard';
import PropertyDetailModal from './PropertyDetailModal';

const defaultFilters: SearchFilters = {
  destination: '',
  checkIn: '',
  checkOut: '',
  guests: 1,
  bedrooms: 0,
  bathrooms: 0,
  radiusKm: 50,
};

export default function Marketplace() {
  const [filters, setFilters] = useState<SearchFilters>(defaultFilters);
  const [searched, setSearched] = useState(false);
  const [selected, setSelected] = useState<AnuncioExterno | null>(null);

  const filtered = useMemo(() => {
    return anunciosExternos.filter((a) => {
      if (filters.destination) {
        const dest = filters.destination.toLowerCase();
        if (
          !a.city.toLowerCase().includes(dest) &&
          !a.location.toLowerCase().includes(dest)
        )
          return false;
      }
      if (filters.bedrooms > 0 && a.bedrooms < filters.bedrooms) return false;
      if (filters.bathrooms > 0 && a.bathrooms < filters.bathrooms) return false;
      if (filters.guests > 1 && a.maxGuests < filters.guests) return false;
      if (searched && filters.radiusKm < 50) {
        const ref = anunciosExternos[0];
        if (haversineKm(ref.lat, ref.lng, a.lat, a.lng) > filters.radiusKm) return false;
      }
      return true;
    });
  }, [filters, searched]);

  return (
    <div>
      <section className="relative bg-gradient-to-b from-teal-50 to-white">
        <div className="mx-auto max-w-7xl px-4 pb-12 pt-8 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Encontre o lugar perfeito para suas férias
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Imóveis selecionados de diversas plataformas em um só lugar
            </p>
          </div>
          <SearchBar
            filters={filters}
            onFilterChange={setFilters}
            onSearch={() => setSearched(true)}
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
          <Filters
            filters={filters}
            onFilterChange={setFilters}
            onReset={() => {
              setFilters(defaultFilters);
              setSearched(false);
            }}
          />
          <div>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-slate-600">
                <span className="font-semibold text-slate-900">{filtered.length}</span> imóveis
                encontrados
              </p>
            </div>
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 py-20 text-center">
                <p className="text-sm font-medium text-slate-500">
                  Nenhum imóvel encontrado com esses filtros.
                </p>
                <button
                  onClick={() => {
                    setFilters(defaultFilters);
                    setSearched(false);
                  }}
                  className="mt-3 text-sm font-semibold text-teal-600 hover:text-teal-700"
                >
                  Limpar filtros
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((a) => (
                  <PropertyCard key={a.id} anuncio={a} onClick={() => setSelected(a)} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <PropertyDetailModal anuncio={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
