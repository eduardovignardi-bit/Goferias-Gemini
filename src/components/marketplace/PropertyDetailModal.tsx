import React from 'react';
import type { AnuncioExterno } from '@/lib/types';
import { X, MapPin, Bed, Bath, Users, Star, CheckCircle } from 'lucide-react';

interface PropertyDetailModalProps {
  anuncio: AnuncioExterno | null;
  onClose: () => void;
}

export default function PropertyDetailModal({ anuncio, onClose }: PropertyDetailModalProps) {
  if (!anuncio) return null;

  // Proteções contra valores nulos/indefinidos
  const safePrice = Number(anuncio.price) || 0;
  const safeRating = Number(anuncio.rating) || 5.0;
  const safeBedrooms = Number(anuncio.bedrooms) || 1;
  const safeBathrooms = Number(anuncio.bathrooms) || 1;
  const safeGuests = Number(anuncio.maxGuests) || (safeBedrooms * 2);
  const imagesList = Array.isArray(anuncio.images) && anuncio.images.length > 0 
    ? anuncio.images 
    : ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80'];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full transition z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-6">
          {/* Imagens */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 h-64 rounded-2xl overflow-hidden bg-slate-100">
            <img src={imagesList[0]} alt={anuncio.title} className="w-full h-full object-cover" />
            <img src={imagesList[1] || imagesList[0]} alt={anuncio.title} className="w-full h-full object-cover hidden md:block" />
          </div>

          {/* Título e Localização */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="bg-teal-50 text-teal-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                {anuncio.propertyType || 'Imóvel'}
              </span>
              <div className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span>{safeRating.toFixed(1)}</span>
              </div>
            </div>

            <h2 className="text-2xl font-extrabold text-slate-800">{anuncio.title}</h2>
            
            <p className="text-sm text-slate-500 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-teal-600 flex-shrink-0" />
              {anuncio.location || `${anuncio.city || ''} - ${anuncio.state || ''}`}
            </p>
          </div>

          {/* Atributos principais */}
          <div className="grid grid-cols-3 gap-4 py-4 border-y border-slate-100 text-center">
            <div className="bg-slate-50 p-3 rounded-2xl">
              <Bed className="w-5 h-5 text-teal-600 mx-auto mb-1" />
              <span className="text-xs text-slate-400 block uppercase font-bold">Quartos</span>
              <span className="text-sm font-extrabold text-slate-800">{safeBedrooms}</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl">
              <Bath className="w-5 h-5 text-teal-600 mx-auto mb-1" />
              <span className="text-xs text-slate-400 block uppercase font-bold">Banheiros</span>
              <span className="text-sm font-extrabold text-slate-800">{safeBathrooms}</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl">
              <Users className="w-5 h-5 text-teal-600 mx-auto mb-1" />
              <span className="text-xs text-slate-400 block uppercase font-bold">Capacidade</span>
              <span className="text-sm font-extrabold text-slate-800">Até {safeGuests} hóspedes</span>
            </div>
          </div>

          {/* Rodapé com Preço e Ação */}
          <div className="flex items-center justify-between pt-2">
            <div>
              <span className="text-xs text-slate-400 uppercase font-bold block">Valor da Diária</span>
              <span className="text-2xl font-extrabold text-teal-700">
                R$ {safePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <button
              onClick={() => {
                alert(`Reserva simulada com sucesso para o imóvel: ${anuncio.title}! Entre em contato para confirmar.`);
                onClose();
              }}
              className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3.5 rounded-2xl font-bold transition shadow-lg text-sm flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" /> Reservar Imóvel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}