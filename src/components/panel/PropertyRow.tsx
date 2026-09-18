import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Building, MapPin, DollarSign, Edit2, Trash2, X, Check } from 'lucide-react';

interface Property {
  id: string;
  title: string;
  location: string;
  current_price: number;
  suggested_price: number;
  occupancy_rate: number;
  monthly_revenue: number;
  status: 'active' | 'maintenance';
  image_url?: string;
  price?: number;
}

interface PropertyRowProps {
  property: Property;
  onUpdated?: () => void;
}

export const PropertyRow: React.FC<PropertyRowProps> = ({ property, onUpdated }) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [title, setTitle] = useState(property.title);
  const [location, setLocation] = useState(property.location);
  const [price, setPrice] = useState(property.price || property.current_price || 350);
  const [status, setStatus] = useState<'active' | 'maintenance'>(property.status || 'active');
  const [loading, setLoading] = useState(false);

  // Função para salvar alterações do imóvel
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from('properties')
      .update({
        title,
        location,
        price: Number(price),
        status,
      })
      .eq('id', property.id);

    setLoading(false);

    if (error) {
      alert('Erro ao atualizar imóvel: ' + error.message);
    } else {
      setIsEditModalOpen(false);
      if (onUpdated) onUpdated();
    }
  };

  // Função para excluir imóvel
  const handleDelete = async () => {
    if (!confirm(`Tem certeza que deseja excluir o imóvel "${property.title}"?`)) return;

    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', property.id);

    if (error) {
      alert('Erro ao excluir imóvel: ' + error.message);
    } else {
      if (onUpdated) onUpdated();
    }
  };

  const displayPrice = property.price || property.current_price || 350;

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between py-4 gap-4 hover:bg-slate-50/80 px-4 rounded-xl transition">
        <div className="flex items-center gap-4">
          <img
            src={property.image_url || 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=200&q=80'}
            alt={property.title}
            className="w-16 h-16 rounded-xl object-cover shadow-sm border border-slate-100 flex-shrink-0"
          />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-slate-800 text-base">{property.title}</h4>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                property.status === 'active' 
                  ? 'bg-emerald-100 text-emerald-700' 
                  : 'bg-amber-100 text-amber-700'
              }`}>
                {property.status === 'active' ? 'Ativo' : 'Manutenção'}
              </span>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" /> {property.location}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
          <div className="text-left sm:text-right">
            <p className="text-xs text-slate-400 uppercase font-medium">Diária</p>
            <p className="text-sm font-bold text-slate-800">R$ {displayPrice.toLocaleString('pt-BR')}</p>
          </div>

          <div className="text-left sm:text-right">
            <p className="text-xs text-slate-400 uppercase font-medium">Ocupação</p>
            <p className="text-sm font-bold text-teal-600">{property.occupancy_rate || 85}%</p>
          </div>

          <div className="flex items-center gap-1.5 border-l border-slate-200 pl-4">
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition"
              title="Editar Imóvel"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleDelete}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
              title="Excluir Imóvel"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Edição */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative my-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-800">Editar Imóvel</h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Título / Descrição</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Endereço / Localização</label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Valor da Diária (R$)</label>
                  <input
                    type="number"
                    required
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'active' | 'maintenance')}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800 bg-white text-sm"
                  >
                    <option value="active">Ativo</option>
                    <option value="maintenance">Manutenção</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl font-medium transition text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-2.5 rounded-xl font-medium transition shadow-md shadow-teal-600/20 text-sm disabled:opacity-50"
                >
                  {loading ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};