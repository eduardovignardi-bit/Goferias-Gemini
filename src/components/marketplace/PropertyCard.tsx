import { Star, MapPin, BedDouble, Bath, Users } from 'lucide-react';
import type { AnuncioExterno } from '@/lib/types';

interface PropertyCardProps {
  anuncio: AnuncioExterno;
  onClick: () => void;
}

export default function PropertyCard({ anuncio, onClick }: PropertyCardProps) {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition-all hover:shadow-lg hover:shadow-slate-200/60 hover:-translate-y-0.5"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={anuncio.imageUrl}
          alt={anuncio.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-slate-700 backdrop-blur-sm">
          {anuncio.source}
        </span>
        <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-slate-900/80 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
          {anuncio.rating.toFixed(1)}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-1 text-xs font-medium text-slate-500">
          <MapPin className="h-3.5 w-3.5" />
          {anuncio.location}
        </div>
        <h3 className="mt-1 line-clamp-1 text-sm font-bold text-slate-900">{anuncio.title}</h3>
        <p className="mt-1 line-clamp-2 text-xs text-slate-500">{anuncio.description}</p>
        <div className="mt-3 flex items-center gap-3 text-xs text-slate-600">
          <span className="flex items-center gap-1">
            <BedDouble className="h-3.5 w-3.5 text-slate-400" />
            {anuncio.bedrooms} quartos
          </span>
          <span className="flex items-center gap-1">
            <Bath className="h-3.5 w-3.5 text-slate-400" />
            {anuncio.bathrooms} ban.
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5 text-slate-400" />
            {anuncio.maxGuests}
          </span>
        </div>
        <div className="mt-3 flex items-baseline justify-between border-t border-slate-100 pt-3">
          <span className="text-lg font-bold text-slate-900">
            R$ {anuncio.pricePerNight.toLocaleString('pt-BR')}
            <span className="text-xs font-normal text-slate-400"> /noite</span>
          </span>
          <span className="text-xs text-slate-400">{anuncio.reviews} avaliações</span>
        </div>
      </div>
    </button>
  );
}
