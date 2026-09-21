import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Building2, Calendar, DollarSign, Plus, Trash2, CheckCircle2, AlertTriangle, MapPin, X } from 'lucide-react';

interface Property {
  id: string;
  title: string;
  property_type: string;
  city: string;
  state: string;
  max_guests: number;
  bedrooms: number;
  price: number;
  cleaning_fee: number;
  images: string[];
}

interface ReservationWithProperty {
  id: string;
  property_id: string;
  guest_name: string;
  guest_email: string;
  check_in: string;
  check_out: string;
  total_price: number;
  status: string;
  properties?: {
    title: string;
    city: string;
  } | null;
}

export const OwnerDashboard: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [reservations, setReservations] = useState<ReservationWithProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);

  // Estados do Modal de Novo Imóvel
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState('Casa');
  const [newCity, setNewCity] = useState('Florianópolis');
  const [newState, setNewState] = useState('SC');
  const [newMaxGuests, setNewMaxGuests] = useState(4);
  const [newBedrooms, setNewBedrooms] = useState(2);
  const [newPrice, setNewPrice] = useState(350);
  const [newCleaningFee, setNewCleaningFee] = useState(100);
  const [newImageUrl, setNewImageUrl] = useState('');

  // Toast flutuante
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchOwnerData();
  }, []);

  const fetchOwnerData = async () => {
    try {
      setLoading(true);
      setDbError(null);

      // Buscar Imóveis
      const propRes = await supabase.from('properties').select('*').order('created_at', { ascending: false });
      if (propRes.error) throw propRes.error;
      if (propRes.data) setProperties(propRes.data);

      // Buscar Reservas com join nas propriedades
      let resQuery = await supabase
        .from('reservations')
        .select('*, properties(title, city)')
        .order('check_in', { ascending: false });

      if (resQuery.error) {
        console.warn('Erro ao buscar com join, tentando busca simples em reservations:', resQuery.error);
        resQuery = await supabase.from('reservations').select('*').order('check_in', { ascending: false });
      }

      if (resQuery.error) throw resQuery.error;

      if (resQuery.data) {
        // Se a reserva vier sem status ou se quisermos forçar novas do marketplace como Pendente caso venham em branco, tratamos aqui:
        const formattedReservations = resQuery.data.map(res => ({
          ...res,
          status: res.status || 'Pendente'
        }));
        setReservations(formattedReservations);
      }
    } catch (err: any) {
      console.error('Erro ao carregar dados do painel:', err);
      setDbError(err.message || 'Erro desconhecido ao carregar dados.');
      showToast('Erro ao carregar dados do painel.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleCreateProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const propertyData = {
        title: newTitle,
        property_type: newType,
        city: newCity,
        state: newState,
        max_guests: Number(newMaxGuests),
        bedrooms: Number(newBedrooms),
        price: Number(newPrice),
        cleaning_fee: Number(newCleaningFee),
        images: [newImageUrl || 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688']
      };

      const { error } = await supabase.from('properties').insert([propertyData]);
      if (error) throw error;

      showToast('Imóvel cadastrado com sucesso!', 'success');
      setIsModalOpen(false);
      setNewTitle('');
      setNewImageUrl('');
      fetchOwnerData();
    } catch (err) {
      console.error('Erro ao cadastrar imóvel:', err);
      showToast('Erro ao cadastrar imóvel.', 'error');
    }
  };

  const handleDeleteProperty = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este imóvel?')) return;
    try {
      const { error } = await supabase.from('properties').delete().eq('id', id);
      if (error) throw error;
      showToast('Imóvel excluído com sucesso.', 'success');
      fetchOwnerData();
    } catch (err) {
      console.error('Erro ao excluir imóvel:', err);
      showToast('Erro ao excluir imóvel. Verifique se há reservas atreladas.', 'error');
    }
  };

  const handleUpdateReservationStatus = async (reservationId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('reservations')
        .update({ status: newStatus })
        .eq('id', reservationId);

      if (error) throw error;
      showToast(`Reserva marcada como "${newStatus}"`, 'success');
      fetchOwnerData();
    } catch (err) {
      console.error('Erro ao atualizar status da reserva:', err);
      showToast('Erro ao atualizar status da reserva.', 'error');
    }
  };

  const totalRevenue = reservations
    .filter(r => r.status === 'Confirmada')
    .reduce((acc, curr) => acc + (Number(curr.total_price) || 0), 0);

  const activeReservationsCount = reservations.filter(r => r.status === 'Confirmada').length;

  return (
    <div className="space-y-8 relative">

      {/* Toast Flutuante */}
      {toast && (
        <div className={`fixed bottom-8 right-8 z-50 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 text-sm font-bold text-white transition-all transform animate-bounce ${
          toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header do Painel */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-8 rounded-3xl text-white shadow-xl flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <span className="bg-slate-700 text-teal-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            Painel do Proprietário
          </span>
          <h1 className="text-3xl font-extrabold mt-2">Gestão de Imóveis & Reservas</h1>
          <p className="text-slate-300 text-sm mt-1">Acompanhe seu desempenho, gerencie sua carteira e controle o fluxo de hóspedes.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 shadow-lg transition"
        >
          <Plus className="w-4 h-4" /> Cadastrar Novo Imóvel
        </button>
      </div>

      {dbError && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-2xl text-xs flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div>
            <span className="font-bold block">Aviso sobre a tabela de reservas:</span>
            <span>{dbError}. Certifique-se de que a tabela <code className="bg-amber-100 px-1 py-0.5 rounded">reservations</code> foi criada no Supabase.</span>
          </div>
        </div>
      )}

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="bg-teal-50 text-teal-600 p-4 rounded-2xl">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase block">Imóveis Cadastrados</span>
            <span className="text-2xl font-extrabold text-slate-800">{properties.length}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="bg-indigo-50 text-indigo-600 p-4 rounded-2xl">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase block">Reservas Ativas</span>
            <span className="text-2xl font-extrabold text-slate-800">{activeReservationsCount}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="bg-emerald-50 text-emerald-600 p-4 rounded-2xl">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase block">Receita Confirmada</span>
            <span className="text-2xl font-extrabold text-emerald-700">R$ {totalRevenue.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Seção de Controle de Reservas (Com Status e Ações de Confirmação) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-extrabold text-slate-800">Controle de Reservas</h3>
          <span className="text-xs text-slate-400 font-bold">{reservations.length} total</span>
        </div>

        {loading ? (
          <div className="text-center py-8 text-slate-400 text-xs font-medium">A carregar reservas...</div>
        ) : reservations.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs font-medium bg-slate-50 rounded-2xl">
            Nenhuma reserva registrada até o momento.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-3 px-4">Hóspede</th>
                  <th className="py-3 px-4">Imóvel</th>
                  <th className="py-3 px-4">Período</th>
                  <th className="py-3 px-4">Valor Total</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {reservations.map((res) => {
                  const currentStatus = res.status || 'Pendente';
                  return (
                    <tr key={res.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        {res.guest_name || 'Hóspede'}
                        <span className="block text-[10px] text-slate-400 font-normal">{res.guest_email || ''}</span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-700">
                        {res.properties?.title || 'Imóvel'}
                        <span className="block text-[10px] text-slate-400">{res.properties?.city || ''}</span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-600">
                        📅 {res.check_in?.split('-').reverse().join('/')} ➔ {res.check_out?.split('-').reverse().join('/')}
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-teal-700">
                        R$ {Number(res.total_price).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          currentStatus === 'Confirmada' ? 'bg-emerald-100 text-emerald-700' :
                          currentStatus === 'Cancelada' ? 'bg-rose-100 text-rose-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {currentStatus}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        {currentStatus !== 'Confirmada' && (
                          <button
                            onClick={() => handleUpdateReservationStatus(res.id, 'Confirmada')}
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 px-3 py-1.5 rounded-xl font-bold transition"
                          >
                            Confirmar
                          </button>
                        )}
                        {currentStatus !== 'Cancelada' && (
                          <button
                            onClick={() => handleUpdateReservationStatus(res.id, 'Cancelada')}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-600 px-3 py-1.5 rounded-xl font-bold transition"
                          >
                            Cancelar
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Seção de Meus Imóveis */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-extrabold text-slate-800">Meus Imóveis</h3>
          <span className="text-xs text-slate-400 font-bold">{properties.length} cadastrados</span>
        </div>

        {properties.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs font-medium bg-slate-50 rounded-2xl">
            Nenhum imóvel cadastrado. Clique em "Cadastrar Novo Imóvel" acima.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((prop) => (
              <div key={prop.id} className="bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 flex flex-col justify-between">
                <div className="relative h-40 bg-slate-200">
                  <img src={prop.images?.[0]} alt={prop.title} className="w-full h-full object-cover" />
                  <span className="absolute top-2 left-2 bg-white/90 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[10px] font-bold text-slate-800">
                    {prop.property_type}
                  </span>
                </div>
                <div className="p-4 space-y-2">
                  <h4 className="font-bold text-slate-800 text-sm line-clamp-1">{prop.title}</h4>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-teal-600" /> {prop.city} - {prop.state}
                  </p>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200/60 text-xs font-extrabold text-teal-700">
                    <span>R$ {Number(prop.price).toFixed(2)} / dia</span>
                    <button
                      onClick={() => handleDeleteProperty(prop.id)}
                      className="text-rose-500 hover:text-rose-700 p-1.5 hover:bg-rose-50 rounded-lg transition"
                      title="Excluir imóvel"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL DE CADASTRO DE NOVO IMÓVEL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative my-8 space-y-5">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-teal-600 uppercase">Novo Anúncio</span>
                <h3 className="text-lg font-extrabold text-slate-800 mt-0.5">Cadastrar Imóvel</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProperty} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Título do Imóvel</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Ex: Loft Vista Mar" 
                  value={newTitle} 
                  onChange={(e) => setNewTitle(e.target.value)} 
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-2xl font-medium focus:outline-none focus:ring-2 focus:ring-teal-500" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Tipo de Imóvel</label>
                  <select 
                    value={newType} 
                    onChange={(e) => setNewType(e.target.value)} 
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-2xl font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  >
                    <option value="Casa">Casa</option>
                    <option value="Apartamento">Apartamento</option>
                    <option value="Loft">Loft</option>
                    <option value="Chácara">Chácara</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Cidade</label>
                  <input 
                    type="text" 
                    required 
                    value={newCity} 
                    onChange={(e) => setNewCity(e.target.value)} 
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-2xl font-medium focus:outline-none focus:ring-2 focus:ring-teal-500" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Máx. Hóspedes</label>
                  <input 
                    type="number" 
                    min="1" 
                    required 
                    value={newMaxGuests} 
                    onChange={(e) => setNewMaxGuests(Number(e.target.value))} 
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-2xl font-medium focus:outline-none focus:ring-2 focus:ring-teal-500" 
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Quartos</label>
                  <input 
                    type="number" 
                    min="0" 
                    required 
                    value={newBedrooms} 
                    onChange={(e) => setNewBedrooms(Number(e.target.value))} 
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-2xl font-medium focus:outline-none focus:ring-2 focus:ring-teal-500" 
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Estado (UF)</label>
                  <input 
                    type="text" 
                    maxLength={2} 
                    required 
                    value={newState} 
                    onChange={(e) => setNewState(e.target.value)} 
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-2xl font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 uppercase text-center" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Preço da Diária (R$)</label>
                  <input 
                    type="number" 
                    min="0" 
                    step="0.01" 
                    required 
                    value={newPrice} 
                    onChange={(e) => setNewPrice(Number(e.target.value))} 
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-2xl font-medium focus:outline-none focus:ring-2 focus:ring-teal-500" 
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Taxa de Limpeza (R$)</label>
                  <input 
                    type="number" 
                    min="0" 
                    step="0.01" 
                    required 
                    value={newCleaningFee} 
                    onChange={(e) => setNewCleaningFee(Number(e.target.value))} 
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-2xl font-medium focus:outline-none focus:ring-2 focus:ring-teal-500" 
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">URL da Imagem de Capa</label>
                <input 
                  type="url" 
                  placeholder="https://images.unsplash.com/..." 
                  value={newImageUrl} 
                  onChange={(e) => setNewImageUrl(e.target.value)} 
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-2xl font-medium focus:outline-none focus:ring-2 focus:ring-teal-500" 
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-2xl font-bold transition"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-2xl font-bold shadow-md transition"
                >
                  Salvar Imóvel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};