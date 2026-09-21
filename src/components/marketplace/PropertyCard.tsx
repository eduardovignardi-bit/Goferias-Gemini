import React from 'react';
import type { AnuncioExterno } from '@/lib/types';
import { MapPin, Bed, Bath, Users, Star } from 'lucide-react';

interface PropertyCardProps {
  anuncio: AnuncioExterno;
  onClick: () => void;
}

export default function PropertyCard({ anuncio, onClick }: PropertyCardProps) {
  const safePrice = Number(anuncio?.price) || 0;
  const safeRating = Number(anuncio?.rating) || 5.0;
  const safeBedrooms = Number(anuncio?.bedrooms) || 1;
  const safeBathrooms = Number(anuncio?.bathrooms) || 1;
  const safeGuests = Number(anuncio?.maxGuests) || 2;
  const sourceName = anuncio?.source || 'GoFérias Direto';

  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col justify-between"
    >
      <div>
        <div className="relative h-48 bg-slate-100">
          <img 
            src={anuncio?.images?.[0] || 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80'} 
            alt={anuncio?.title || 'Imóvel'} 
            className="w-full h-full object-cover"
          />
          <div className="absolute top-3 left-3 flex gap-2">
            <span className="bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-slate-800 shadow-sm">
              {anuncio?.propertyType || 'Imóvel'}
            </span>
          </div>
          
          {/* Etiqueta de Origem da Plataforma */}
          <span className="absolute top-3 right-3 bg-teal-900/80 backdrop-blur-md text-white px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider shadow-sm">
            {sourceName}
          </span>
        </div>

        <div className="p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-800 line-clamp-1">{anuncio?.title || 'Título indisponível'}</h3>
            <div className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              <span>{safeRating.toFixed(1)}</span>
            </div>
          </div>
          
          <p className="text-xs text-slate-500 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
            {anuncio?.location || `${anuncio?.city || ''} - ${anuncio?.state || ''}`}
          </p>
          
          <div className="flex items-center gap-4 text-xs font-medium text-slate-600 pt-2 border-t border-slate-50">
            <span className="flex items-center gap-1"><Bed className="w-3.5 h-3.5 text-slate-400" /> {safeBedrooms} Quartos</span>
            <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5 text-slate-400" /> {safeBathrooms} Banheiros</span>
            <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5 text-slate-400" /> Até {safeGuests} hóspedes</span>
          </div>
        </div>
      </div>

      <div className="p-6 pt-0 flex items-center justify-between border-t border-slate-50 mt-4">
        <div>
          <span className="text-[10px] text-slate-400 uppercase font-bold block">Diária</span>
          <span className="text-lg font-extrabold text-teal-700">
            R$ {safePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>
        
        <span className="text-xs font-bold text-teal-600 hover:underline">
          Ver detalhes →
        </span>
      </div>
    </div>
  );
}