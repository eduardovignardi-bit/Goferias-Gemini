import React from 'react';
import { Search, Users, MapPin, SlidersHorizontal } from 'lucide-react';

interface FiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  selectedCity: string;
  setSelectedCity: (value: string) => void;
  guestCount: number;
  setGuestCount: (value: number) => void;
  maxPrice: number;
  setMaxPrice: (value: number) => void;
  availableCities: string[];
  onReset: () => void;
}

export const Filters: React.FC<FiltersProps> = ({
  searchTerm,
  setSearchTerm,
  selectedCity,
  setSelectedCity,
  guestCount,
  setGuestCount,
  maxPrice,
  setMaxPrice,
  availableCities,
  onReset,
}) => {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2 text-slate-800 font-extrabold text-sm">
          <SlidersHorizontal className="w-4 h-4 text-teal-600" />
          <span>Filtros de Busca Avançados</span>
        </div>
        <button 
          onClick={onReset}
          className="text-xs text-teal-600 hover:text-teal-700 font-bold"
        >
          Limpar Filtros
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
        {/* Busca por Nome / Palavra-chave */}
        <div className="space-y-1.5">
          <label className="font-bold text-slate-600">Pesquisar</label>
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Nome do imóvel..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-600"
            />
          </div>
        </div>

        {/* Filtro por Cidade */}
        <div className="space-y-1.5">
          <label className="font-bold text-slate-600">Cidade</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <select
              value={selectedCity}
              onChange={e => setSelectedCity(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-600 appearance-none"
            >
              <option value="">Todas as cidades</option>
              {availableCities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Filtro por Hóspedes */}
        <div className="space-y-1.5">
          <label className="font-bold text-slate-600">Mín. Hóspedes</label>
          <div className="relative">
            <Users className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input 
              type="number" 
              min="0"
              placeholder="Qtd. hóspedes" 
              value={guestCount === 0 ? '' : guestCount}
              onChange={e => setGuestCount(Number(e.target.value))}
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-600"
            />
          </div>
        </div>

        {/* Filtro por Faixa de Preço */}
        <div className="space-y-1.5">
          <div className="flex justify-between font-bold text-slate-600">
            <span>Preço Máximo</span>
            <span className="text-teal-700">R$ {maxPrice}</span>
          </div>
          <div className="pt-2">
            <input 
              type="range" 
              min="100" 
              max="5000" 
              step="50"
              value={maxPrice}
              onChange={e => setMaxPrice(Number(e.target.value))}
              className="w-full accent-teal-600 cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};