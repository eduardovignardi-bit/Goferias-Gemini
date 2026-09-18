import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Sparkles, TrendingUp, CheckCircle2 } from 'lucide-react';

interface Property {
  id: string;
  title: string;
  location: string;
  price: number; // Alterado para refletir o campo real
  suggested_price: number;
  occupancy_rate: number;
  monthly_revenue: number;
}

interface PricingCardProps {
  property: Property;
  onPriceUpdated?: () => void;
}

export const PricingCard: React.FC<PricingCardProps> = ({ property, onPriceUpdated }) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const currentPrice = property.price || 350;
  const suggestedPrice = property.suggested_price || Math.round(currentPrice * 1.2);

  // Aplica o preço sugerido pela IA atualizando a coluna correta (price)
  const handleApplySuggestedPrice = async () => {
    setLoading(true);
    setSuccess(false);

    const { error } = await supabase
      .from('properties')
      .update({ price: suggestedPrice }) // Utiliza 'price' em vez de 'current_price'
      .eq('id', property.id);

    setLoading(false);

    if (error) {
      alert('Erro ao atualizar preço: ' + error.message);
    } else {
      setSuccess(true);
      if (onPriceUpdated) {
        onPriceUpdated();
      }
      setTimeout(() => setSuccess(false), 3000);
    }
  };

  return (
    <div className="bg-gradient-to-br from-teal-900 via-slate-900 to-teal-950 rounded-2xl p-6 text-white shadow-lg space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" /> Recomendação de IA para: {property.title}
          </div>
          <h3 className="text-xl font-bold">{property.location}</h3>
        </div>

        <div className="flex items-center gap-4 bg-white/10 px-4 py-3 rounded-xl backdrop-blur-sm">
          <div>
            <p className="text-xs text-teal-200 uppercase font-medium">Preço Atual</p>
            <p className="text-lg font-bold">R$ {currentPrice.toLocaleString('pt-BR')}</p>
          </div>
          <div className="h-8 w-px bg-white/20" />
          <div>
            <p className="text-xs text-teal-200 uppercase font-medium">Preço Sugerido IA</p>
            <p className="text-xl font-extrabold text-teal-300">R$ {suggestedPrice.toLocaleString('pt-BR')}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-white/10">
        <div className="flex items-center gap-2 text-sm text-teal-100">
          <TrendingUp className="w-4 h-4 text-teal-400" />
          <span>Aumentar o valor pode elevar sua receita mensal estimada em até 15%.</span>
        </div>

        <button
          onClick={handleApplySuggestedPrice}
          disabled={loading}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-6 py-3 rounded-xl transition shadow-lg disabled:opacity-50 text-sm"
        >
          {success ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-slate-950" /> Preço Aplicado!
            </>
          ) : loading ? (
            'Aplicando...'
          ) : (
            <>
              <Sparkles className="w-4 h-4" /> Aplicar Preço Sugerido
            </>
          )}
        </button>
      </div>
    </div>
  );
};