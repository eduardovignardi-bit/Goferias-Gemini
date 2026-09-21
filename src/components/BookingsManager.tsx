import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Calendar, User, DollarSign, CheckCircle2, AlertTriangle, Plus } from 'lucide-react';

interface Property {
  id: string;
  title: string;
  city: string;
}

interface Booking {
  id: string;
  property_id: string;
  guest_name: string;
  check_in: string;
  check_out: string;
  total_price: number;
  status: string;
  properties?: {
    title: string;
    city: string;
  };
}

export const BookingsManager: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [guestName, setGuestName] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [totalPrice, setTotalPrice] = useState('');

  // Toast notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Carregar imóveis
      const { data: propData } = await supabase
        .from('properties')
        .select('id, title, city')
        .order('title', { ascending: true });

      if (propData && propData.length > 0) {
        setProperties(propData);
        setSelectedPropertyId(propData[0].id);
      }

      // Carregar reservas com dados do imóvel associado
      const { data: bookData, error: bookError } = await supabase
        .from('bookings')
        .select('*, properties(title, city)')
        .order('created_at', { ascending: false });

      if (bookError) throw bookError;
      if (bookData) setBookings(bookData);

    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPropertyId || !guestName || !checkIn || !checkOut) {
      showToast('Por favor, preencha todos os campos obrigatórios.', 'error');
      return;
    }

    if (new Date(checkIn) >= new Date(checkOut)) {
      showToast('A data de check-out deve ser posterior ao check-in.', 'error');
      return;
    }

    try {
      const newBooking = {
        property_id: selectedPropertyId,
        guest_name: guestName,
        check_in: checkIn,
        check_out: checkOut,
        total_price: totalPrice ? parseFloat(totalPrice) : 0,
        status: 'Confirmada',
        created_at: new Date().toISOString()
      };

      const { error } = await supabase.from('bookings').insert([newBooking]);

      if (error) throw error;

      showToast('Reserva criada e salva com sucesso!', 'success');
      setGuestName('');
      setCheckIn('');
      setCheckOut('');
      setTotalPrice('');
      fetchData(); // Atualiza a lista instantaneamente
    } catch (err: any) {
      console.error('Erro ao salvar reserva:', err);
      showToast('Erro ao salvar no banco de dados. Verifique a tabela bookings.', 'error');
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-slate-400">A carregar gestão de reservas...</div>;
  }

  return (
    <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-8 relative">

      {/* Toast Flutuante */}
      {toast && (
        <div className={`fixed bottom-8 right-8 z-50 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 text-sm font-bold text-white transition-all transform animate-bounce ${
          toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          <span>{toast.message}</span>
        </div>
      )}

      <div>
        <span className="bg-teal-50 text-teal-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
          Painel do Proprietário
        </span>
        <h3 className="text-2xl font-extrabold text-slate-800 mt-2">Gestão de Reservas</h3>
        <p className="text-xs text-slate-500 mt-1">Registe novas estadias e consulte todas as reservas ativas no portal.</p>
      </div>

      {/* Formulário de Nova Reserva */}
      <form onSubmit={handleCreateBooking} className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
        <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
          <Plus className="w-4 h-4 text-teal-600" /> Registar Nova Reserva
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Imóvel</label>
            <select
              value={selectedPropertyId}
              onChange={(e) => setSelectedPropertyId(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-2xl bg-white text-sm font-medium focus:ring-2 focus:ring-teal-500"
            >
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} ({p.city})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Nome do Hóspede</label>
            <input
              type="text"
              required
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Ex: Carlos Silva"
              className="w-full px-4 py-3 border border-slate-200 rounded-2xl bg-white text-sm font-medium focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Valor Total (R$)</label>
            <input
              type="number"
              step="0.01"
              value={totalPrice}
              onChange={(e) => setTotalPrice(e.target.value)}
              placeholder="Ex: 1200.00"
              className="w-full px-4 py-3 border border-slate-200 rounded-2xl bg-white text-sm font-medium focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Data de Check-in</label>
            <input
              type="date"
              required
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-2xl bg-white text-sm font-medium focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Data de Check-out</label>
            <input
              type="date"
              required
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-2xl bg-white text-sm font-medium focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-2xl font-bold transition shadow-md text-sm flex items-center justify-center gap-2"
            >
              Salvar Reserva
            </button>
          </div>
        </div>
      </form>

      {/* Listagem de Reservas Atuais */}
      <div className="space-y-4">
        <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Reservas Registadas no Sistema ({bookings.length})</h4>

        {bookings.length === 0 ? (
          <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            Nenhuma reserva registada até o momento.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {bookings.map((b) => (
              <div key={b.id} className="bg-slate-50 border border-slate-100 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase">
                      {b.status || 'Confirmada'}
                    </span>
                    <span className="text-xs text-slate-400">Criado em {new Date(b.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <h5 className="text-base font-bold text-slate-800">{b.properties?.title || 'Imóvel'}</h5>
                  <p className="text-xs text-slate-600">Hóspede: <span className="font-bold text-slate-800">{b.guest_name}</span></p>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right text-xs">
                    <p className="text-slate-500">Período da Estadia</p>
                    <p className="font-bold text-slate-800">
                      {new Date(b.check_in).toLocaleDateString('pt-BR')} ➔ {new Date(b.check_out).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  {b.total_price > 0 && (
                    <div className="bg-teal-50 border border-teal-100 px-4 py-2 rounded-xl text-right">
                      <span className="text-[10px] text-teal-600 font-bold block uppercase">Valor Total</span>
                      <span className="text-sm font-extrabold text-teal-800">R$ {b.total_price.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};