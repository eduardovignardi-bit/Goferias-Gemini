/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { Bath, BedDouble, ChevronLeft, ChevronRight, MapPin, Sparkles, Users } from 'lucide-react';

type MarketplaceProperty = {
  id: string;
  title: string;
  property_type: string;
  city: string;
  state: string;
  neighborhood: string;
  bedrooms: number;
  bathrooms: number;
  max_guests: number;
  price: number;
  images: string[];
  smart_pricing_active: boolean;
};

interface MarketplacePropertyCardProps {
  property: MarketplaceProperty;
  onReserve: () => void;
}

const fallbackImage = 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1000&q=85';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function MarketplacePropertyCard({ property, onReserve }: MarketplacePropertyCardProps) {
  const [imageIndex, setImageIndex] = useState(0);
  const images = property.images.length > 0 ? property.images : [fallbackImage];
  const currentImageIndex = imageIndex % images.length;
  const location = [property.neighborhood, property.city, property.state].filter(Boolean).join(', ');

  return (
    <article className="overflow-hidden rounded-lg border border-slate-200 bg-white transition hover:border-slate-300 hover:shadow-md">
      <div className="group relative aspect-[4/3] overflow-hidden bg-slate-100">
        <img
          src={images[currentImageIndex]}
          alt={property.title}
          loading="lazy"
          className="size-full object-cover transition duration-300 group-hover:scale-[1.02]"
        />
        <span className="absolute left-3 top-3 rounded-md bg-white/95 px-2.5 py-1 text-xs font-semibold text-slate-800 shadow-sm">
          {property.property_type || 'Temporada'}
        </span>
        {property.smart_pricing_active && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-md bg-emerald-50/95 px-2.5 py-1 text-xs font-semibold text-emerald-800 shadow-sm">
            <Sparkles className="size-3.5" /> Preço IA ativo
          </span>
        )}
        {images.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Foto anterior"
              onClick={(event) => {
                event.stopPropagation();
                setImageIndex((index) => (index - 1 + images.length) % images.length);
              }}
              className="absolute left-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-800 opacity-0 shadow transition hover:bg-white group-hover:opacity-100 focus-visible:opacity-100"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              aria-label="Próxima foto"
              onClick={(event) => {
                event.stopPropagation();
                setImageIndex((index) => (index + 1) % images.length);
              }}
              className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-800 opacity-0 shadow transition hover:bg-white group-hover:opacity-100 focus-visible:opacity-100"
            >
              <ChevronRight className="size-4" />
            </button>
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-slate-950/40 px-2 py-1.5">
              {images.map((_, index) => (
                <button
                  key={`${property.id}-image-${index}`}
                  type="button"
                  aria-label={`Ver foto ${index + 1}`}
                  aria-current={currentImageIndex === index ? 'true' : undefined}
                  onClick={(event) => {
                    event.stopPropagation();
                    setImageIndex(index);
                  }}
                  className={`size-1.5 rounded-full transition ${
                    currentImageIndex === index ? 'bg-white' : 'bg-white/50 hover:bg-white/80'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="space-y-3 p-4">
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold text-slate-900">{property.title}</h2>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
            <MapPin className="size-4 shrink-0 text-teal-700" />
            <span className="truncate">{location || 'Brasil'}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 pt-3 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1.5"><BedDouble className="size-4 text-slate-400" /> {property.bedrooms} quartos</span>
          <span className="inline-flex items-center gap-1.5"><Bath className="size-4 text-slate-400" /> {property.bathrooms} banheiros</span>
          <span className="inline-flex items-center gap-1.5"><Users className="size-4 text-slate-400" /> Até {property.max_guests} hóspedes</span>
        </div>

        <div className="flex items-end justify-between gap-3 border-t border-slate-100 pt-3">
          <p className="text-sm font-bold text-slate-900">
            {formatCurrency(property.price)} <span className="font-normal text-slate-500">/ diária</span>
          </p>
          <button
            type="button"
            onClick={onReserve}
            className="rounded-md bg-teal-700 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-teal-800"
          >
            Ver disponibilidade
          </button>
        </div>
      </div>
    </article>
  );
}
