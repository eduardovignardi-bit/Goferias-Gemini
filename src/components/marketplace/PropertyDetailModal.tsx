import { X, Star, MapPin, BedDouble, Bath, Users, Calendar } from 'lucide-react';
import type { AnuncioExterno } from '@/lib/types';

interface PropertyDetailModalProps {
  anuncio: AnuncioExterno | null;
  onClose: () => void;
}

export default function PropertyDetailModal({ anuncio, onClose }: PropertyDetailModalProps) {
  if (!anuncio) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full bg-white/90 p-2 text-slate-700 shadow-md transition-colors hover:bg-white"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="aspect-[16/10] w-full overflow-hidden rounded-t-2xl">
          <img src={anuncio.imageUrl} alt={anuncio.title} className="h-full w-full object-cover" />
        </div>
        <div className="p-6">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
              {anuncio.source}
            </span>
            <span className="flex items-center gap-1 text-sm font-medium text-slate-700">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              {anuncio.rating.toFixed(1)} ({anuncio.reviews} avaliações)
            </span>
          </div>
          <h2 className="mt-3 text-2xl font-bold text-slate-900">{anuncio.title}</h2>
          <div className="mt-1 flex items-center gap-1 text-sm text-slate-500">
            <MapPin className="h-4 w-4" />
            {anuncio.location}
          </div>
          <p className="mt-4 text-sm leading-relaxed text-slate-600">{anuncio.description}</p>

          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="rounded-xl border border-slate-200 p-4 text-center">
              <BedDouble className="mx-auto h-5 w-5 text-teal-600" />
              <p className="mt-2 text-lg font-bold text-slate-900">{anuncio.bedrooms}</p>
              <p className="text-xs text-slate-500">Quartos</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-4 text-center">
              <Bath className="mx-auto h-5 w-5 text-teal-600" />
              <p className="mt-2 text-lg font-bold text-slate-900">{anuncio.bathrooms}</p>
              <p className="text-xs text-slate-500">Banheiros</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-4 text-center">
              <Users className="mx-auto h-5 w-5 text-teal-600" />
              <p className="mt-2 text-lg font-bold text-slate-900">{anuncio.maxGuests}</p>
              <p className="text-xs text-slate-500">Hóspedes</p>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between rounded-xl bg-slate-50 p-4">
            <div>
              <p className="text-2xl font-bold text-slate-900">
                R$ {anuncio.pricePerNight.toLocaleString('pt-BR')}
                <span className="text-sm font-normal text-slate-400"> /noite</span>
              </p>
            </div>
            <button className="flex items-center gap-2 rounded-xl bg-teal-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-teal-700">
              <Calendar className="h-4 w-4" />
              Reservar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
