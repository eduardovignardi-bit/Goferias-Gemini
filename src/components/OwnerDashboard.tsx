import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Building2, Calendar, DollarSign, Plus, Trash2, CheckCircle2, AlertTriangle, MapPin, X, Lock, CreditCard, PieChart, MessageSquare } from 'lucide-react';

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
  user_id?: string;
}

interface ReservationWithProperty {
  id: string;
  property_id: string;
  guest_name: string;
  guest_email: string;
  guest_phone?: string | null;
  check_in: string;
  check_out: string;
  total_price: number;
  status: string;
  properties?: {
    title: string;
    city: string;
    cleaning_fee: number;
  } | null;
}

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function getReservationCleaningFee(reservation: ReservationWithProperty) {
  return Math.max(0, Number(reservation.properties?.cleaning_fee) || 0);
}

function getReservationOwnerNet(reservation: ReservationWithProperty) {
  const gross = Number(reservation.total_price) || 0;
  const cleaningFee = Math.min(getReservationCleaningFee(reservation), gross);
  const rentalAmount = gross - cleaningFee;
  return (rentalAmount * 0.9) + cleaningFee;
}

function formatReservationDate(date: string) {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('pt-BR');
}

export const OwnerDashboard: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [reservations, setReservations] = useState<ReservationWithProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isNotAuthenticated, setIsNotAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'finances'>('overview');

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
      setIsNotAuthenticated(false);

      const { data: authData, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authData?.user) {
        setIsNotAuthenticated(true);
        setProperties([]);
        setReservations([]);
        setLoading(false);
        return;
      }

      const userId = authData.user.id;
      setCurrentUserId(userId);

      const propRes = await supabase
        .from('Properties')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
        
      if (propRes.error) throw propRes.error;
      const userProperties = propRes.data || [];
      setProperties(userProperties);

      const propertyIds = userProperties.map(p => p.id);

      if (propertyIds.length === 0) {
        setReservations([]);
        setLoading(false);
        return;
      }

      const resQuery = await supabase
        .from('reservations')
        .select('*, properties:Properties(title, city, cleaning_fee)')
        .in('property_id', propertyIds)
        .order('check_in', { ascending: false });

      if (resQuery.error) throw resQuery.error;

      if (resQuery.data) {
        const formattedReservations = resQuery.data.map(res => ({
          ...res,
          status: res.status || 'Pendente'
        }));
        setReservations(formattedReservations);
      }
    } catch (err: any) {
      console.error('Erro ao carregar dados do painel:', err);
      setDbError(err.message || 'Erro desconhecido ao carregar dados.');
      showToast(err.message || 'Erro ao carregar dados do painel.', 'error');
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
      if (!currentUserId) {
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      const propertyData = {
        title: newTitle,
        property_type: newType,
        city: newCity,
        state: newState,
        max_guests: Number(newMaxGuests),
        bedrooms: Number(newBedrooms),
        price: Number(newPrice),
        cleaning_fee: Number(newCleaningFee),
        images: [newImageUrl || 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688'],
        user_id: currentUserId
      };

      const { error } = await supabase.from('Properties').insert([propertyData]);
      if (error) throw error;

      showToast('Imóvel cadastrado com sucesso!', 'success');
      setIsModalOpen(false);
      setNewTitle('');
      setNewImageUrl('');
      fetchOwnerData();
    } catch (err: any) {
      console.error('Erro ao cadastrar imóvel:', err);
      showToast(err.message || 'Erro ao cadastrar imóvel.', 'error');
    }
  };

  const handleDeleteProperty = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este imóvel?')) return;
    try {
      const { error } = await supabase.from('Properties').delete().eq('id', id);
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
    } catch (err: any) {
      console.error('Erro ao atualizar status da reserva:', err);
      showToast(err.message || 'Erro ao atualizar status da reserva.', 'error');
    }
  };

  const handleSendWhatsAppSummary = (reservation: ReservationWithProperty) => {
    const message = [
      `Olá, *${reservation.guest_name || reservation.guest_email || 'Hóspede'}*! Segue o resumo da sua reserva no GoFérias:`,
      '',
      `🏠 *Imóvel:* ${reservation.properties?.title || 'Imóvel'}`,
      `📅 *Check-in:* ${formatReservationDate(reservation.check_in)}`,
      `📅 *Check-out:* ${formatReservationDate(reservation.check_out)}`,
      `💰 *Valor Total:* ${formatCurrency(Number(reservation.total_price) || 0)}`,
      `📌 *Status:* ${reservation.status || 'Pendente'}`,
    ].join('\n');
    const encodedMessage = encodeURIComponent(message);
    const phone = reservation.guest_phone?.replace(/\D/g, '');
    const recipient = phone ? `phone=${phone}&` : '';
    const url = `https://api.whatsapp.com/send?${recipient}text=${encodedMessage}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Cálculos Financeiros (Split 10% Plataforma / 90% Proprietário)
  const confirmedReservations = reservations.filter(r => r.status === 'Confirmada');
  const totalGrossRevenue = confirmedReservations
    .reduce((total, reservation) => total + (Number(reservation.total_price) || 0), 0);
  const ownerNetRevenue = confirmedReservations
    .reduce((total, reservation) => total + getReservationOwnerNet(reservation), 0);
  const platformFee = totalGrossRevenue - ownerNetRevenue;
  const recentMonths = Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - (5 - index));
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    return {
      key: monthKey,
      label: date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
      total: 0,
    };
  });
  const recentMonthTotals = new Map(recentMonths.map(month => [month.key, 0]));
  confirmedReservations.forEach((reservation) => {
    const [year, month] = reservation.check_in.split('-');
    if (!year || !month) return;

    const monthKey = `${year}-${month}`;
    const currentTotal = recentMonthTotals.get(monthKey);
    if (currentTotal !== undefined) {
      recentMonthTotals.set(monthKey, currentTotal + (Number(reservation.total_price) || 0));
    }
  });
  const monthlyRevenue = recentMonths.map(month => ({
    ...month,
    total: recentMonthTotals.get(month.key) || 0,
  }));
  const maxMonthlyRevenue = Math.max(...monthlyRevenue.map(month => month.total), 0);

  const activeReservationsCount = reservations.filter(r => r.status === 'Confirmada').length;

  if (isNotAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto my-16 bg-white p-10 rounded-3xl border border-slate-100 shadow-xl text-center space-y-6">
        <div className="w-16 h-16 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
          <Lock className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-slate-800">Acesso Restrito ao Painel</h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Você precisa estar autenticado na sua conta de proprietário para visualizar o painel operacional, gerir reservas e consultar receitas.
          </p>
        </div>
        <div className="pt-4 flex justify-center gap-4">
          <a
            href="/"
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-3 rounded-2xl font-bold text-xs transition"
          >
            Voltar ao Marketplace
          </a>
          <button
            onClick={() => {
              const loginBtn = document.querySelector('button.bg-teal-600, header button') as HTMLButtonElement;
              if (loginBtn) loginBtn.click();
              else alert('Por favor, clique no botão "Entrar" no topo da página.');
            }}
            className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-2xl font-bold text-xs shadow-lg transition"
          >
            Fazer Login Agora
          </button>
        </div>
      </div>
    );
  }

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
            Painel GoFérias Pro
          </span>
          <h1 className="text-3xl font-extrabold mt-2">Gestão de Imóveis & Demonstrativo Financeiro</h1>
          <p className="text-slate-300 text-sm mt-1">Controle de reservas em tempo real com projeção de repasses líquidos.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 shadow-lg transition"
          >
            <Plus className="w-4 h-4" /> Novo Imóvel
          </button>
        </div>
      </div>

      {/* Abas de Navegação */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-5 py-2.5 rounded-2xl font-bold text-xs transition flex items-center gap-2 ${
            activeTab === 'overview' ? 'bg-teal-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" /> Visão Operacional & Reservas
        </button>
        <button
          onClick={() => setActiveTab('finances')}
          className={`px-5 py-2.5 rounded-2xl font-bold text-xs transition flex items-center gap-2 ${
            activeTab === 'finances' ? 'bg-teal-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <PieChart className="w-4 h-4" /> Relatório de Receitas & Repasses
        </button>
      </div>

      {dbError && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-2xl text-xs flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div>
            <span className="font-bold block">Aviso:</span>
            <span>{dbError}</span>
          </div>
        </div>
      )}

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="bg-teal-50 text-teal-600 p-4 rounded-2xl">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase block">Meus Imóveis</span>
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
            <span className="text-xs text-slate-400 font-bold uppercase block">Repasse Líquido</span>
            <span className="text-xl font-extrabold text-emerald-700">{formatCurrency(ownerNetRevenue)}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="bg-sky-50 text-sky-600 p-4 rounded-2xl">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase block">Taxa Plataforma (10%)</span>
            <span className="text-xl font-extrabold text-sky-700">{formatCurrency(platformFee)}</span>
          </div>
        </div>
      </div>

      {activeTab === 'overview' ? (
        <>
          {/* Seção de Controle de Reservas */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-extrabold text-slate-800">Controle de Reservas</h3>
              <span className="text-xs text-slate-400 font-bold">{reservations.length} total</span>
            </div>

            {loading ? (
              <div className="text-center py-8 text-slate-400 text-xs font-medium">A carregar reservas...</div>
            ) : reservations.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs font-medium bg-slate-50 rounded-2xl">
                Nenhuma reserva registrada para os seus imóveis.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead className="sticky top-0 bg-slate-50">
                    <tr className="border-b border-slate-200 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                      <th className="py-3 px-4">Hóspede</th>
                      <th className="py-3 px-4">Imóvel</th>
                      <th className="py-3 px-4">Período</th>
                      <th className="py-3 px-4">Bruto (R$)</th>
                      <th className="py-3 px-4">Líquido Prop. (90%)</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reservations.map((res) => {
                      const currentStatus = res.status || 'Pendente';
                      const resTotal = Number(res.total_price) || 0;
                      const resNet = getReservationOwnerNet(res);

                      return (
                        <tr key={res.id} className="transition-colors hover:bg-teal-50/40">
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
                          <td className="py-3.5 px-4 font-extrabold text-slate-800">
                            {formatCurrency(resTotal)}
                          </td>
                          <td className="py-3.5 px-4 font-extrabold text-emerald-700">
                            {formatCurrency(resNet)}
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
                          <td className="py-3.5 px-4">
                            <div className="flex flex-wrap justify-end gap-2">
                              {currentStatus !== 'Confirmada' && (
                                <button
                                  onClick={() => handleUpdateReservationStatus(res.id, 'Confirmada')}
                                  className="rounded-xl bg-emerald-50 px-3 py-1.5 font-bold text-emerald-600 transition hover:bg-emerald-100"
                                >
                                  Aprovar
                                </button>
                              )}
                              {currentStatus !== 'Cancelada' && (
                                <button
                                  onClick={() => handleUpdateReservationStatus(res.id, 'Cancelada')}
                                  className="rounded-xl bg-rose-50 px-3 py-1.5 font-bold text-rose-600 transition hover:bg-rose-100"
                                >
                                  Cancelar
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleSendWhatsAppSummary(res)}
                                aria-label={`Enviar resumo da reserva de ${res.guest_name || res.guest_email} pelo WhatsApp`}
                                className="ml-auto flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700"
                              >
                                <MessageSquare className="size-3.5" />
                                WhatsApp
                              </button>
                            </div>
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
                Nenhum imóvel cadastrado. Clique em "Novo Imóvel" acima.
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
                        <span>{formatCurrency(Number(prop.price))} / dia</span>
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
        </>
      ) : (
        /* Aba de Relatório Financeiro */
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-extrabold text-slate-800">Demonstrativo Financeiro (GoFérias Pay)</h3>
            <p className="mt-1 text-xs text-slate-500">
              Comissões e valores líquidos calculados a partir das reservas confirmadas.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="flex items-center gap-4 rounded-2xl border border-teal-100 bg-teal-50 p-5">
              <div className="rounded-xl bg-white/80 p-3 text-teal-700"><DollarSign className="size-6" /></div>
              <div className="min-w-0">
                <span className="block text-[10px] font-bold uppercase tracking-wide text-teal-700">Faturamento bruto</span>
                <p className="mt-1 truncate text-2xl font-extrabold text-teal-900">{formatCurrency(totalGrossRevenue)}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
              <div className="rounded-xl bg-white/80 p-3 text-emerald-700"><CreditCard className="size-6" /></div>
              <div className="min-w-0">
                <span className="block text-[10px] font-bold uppercase tracking-wide text-emerald-700">Repasse líquido do proprietário</span>
                <p className="mt-1 truncate text-2xl font-extrabold text-emerald-900">{formatCurrency(ownerNetRevenue)}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-2xl border border-amber-100 bg-amber-50 p-5">
              <div className="rounded-xl bg-white/80 p-3 text-amber-700"><PieChart className="size-6" /></div>
              <div className="min-w-0">
                <span className="block text-[10px] font-bold uppercase tracking-wide text-amber-700">Comissão GoFérias · 10%</span>
                <p className="mt-1 truncate text-2xl font-extrabold text-amber-900">{formatCurrency(platformFee)}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="mb-6">
                <h4 className="font-bold text-slate-800">Divisão do faturamento</h4>
                <p className="mt-1 text-xs text-slate-500">Distribuição do valor bruto por reserva confirmada.</p>
              </div>

              <div
                role="img"
                aria-label={`Divisão: repasse do proprietário ${formatCurrency(ownerNetRevenue)} e comissão GoFérias ${formatCurrency(platformFee)}`}
                className="flex h-8 w-full overflow-hidden rounded-full bg-slate-100"
              >
                <div
                  className="h-full bg-emerald-500 transition-all"
                  style={{ width: `${totalGrossRevenue > 0 ? (ownerNetRevenue / totalGrossRevenue) * 100 : 0}%` }}
                />
                <div
                  className="h-full bg-amber-500 transition-all"
                  style={{ width: `${totalGrossRevenue > 0 ? (platformFee / totalGrossRevenue) * 100 : 0}%` }}
                />
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="flex items-start gap-3 rounded-xl bg-emerald-50 p-4">
                  <span className="mt-1 size-3 shrink-0 rounded-full bg-emerald-500" />
                  <div>
                    <span className="block text-xs font-semibold text-emerald-800">Repasse do proprietário · locação 90% + limpeza integral</span>
                    <span className="mt-1 block text-lg font-extrabold text-emerald-900">{formatCurrency(ownerNetRevenue)}</span>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-xl bg-amber-50 p-4">
                  <span className="mt-1 size-3 shrink-0 rounded-full bg-amber-500" />
                  <div>
                    <span className="block text-xs font-semibold text-amber-800">Comissão GoFérias · 10%</span>
                    <span className="mt-1 block text-lg font-extrabold text-amber-900">{formatCurrency(platformFee)}</span>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="mb-6">
                <h4 className="font-bold text-slate-800">Faturamento mensal</h4>
                <p className="mt-1 text-xs text-slate-500">Últimos seis meses, agrupados pela data de check-in.</p>
              </div>

              <div className="space-y-4">
                {monthlyRevenue.map((month) => {
                  const barWidth = maxMonthlyRevenue > 0 ? (month.total / maxMonthlyRevenue) * 100 : 0;
                  return (
                    <div key={month.key} className="grid grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-3">
                      <span className="text-xs font-semibold capitalize text-slate-500">{month.label}</span>
                      <div
                        className="h-3 overflow-hidden rounded-full bg-slate-100"
                        role="img"
                        aria-label={`${month.label}: ${formatCurrency(month.total)}`}
                      >
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-500"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                      <span className="min-w-24 text-right text-xs font-bold tabular-nums text-slate-700">
                        {formatCurrency(month.total)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          <section className="space-y-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wide text-slate-800">Relatório Financeiro Discriminado</h4>
              <p className="mt-1 text-xs text-slate-500">Locação, taxa de limpeza, repasse e comissão por reserva confirmada.</p>
            </div>
            {confirmedReservations.length === 0 ? (
              <p className="rounded-2xl bg-slate-50 py-6 text-center text-xs text-slate-400">
                Nenhum registo efetuado por falta de reservas confirmadas.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full min-w-[940px] border-collapse text-left text-xs">
                  <thead className="bg-slate-50">
                    <tr className="border-b border-slate-200 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                      <th className="px-4 py-3">Reserva / hóspede</th>
                      <th className="px-4 py-3">Período</th>
                      <th className="px-4 py-3 text-right">Bruto</th>
                      <th className="px-4 py-3 text-right">Limpeza</th>
                      <th className="px-4 py-3 text-right">Repasse</th>
                      <th className="px-4 py-3 text-right">Comissão</th>
                      <th className="px-4 py-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {confirmedReservations.map((reservation) => {
                      const gross = Number(reservation.total_price) || 0;
                      const cleaningFee = Math.min(getReservationCleaningFee(reservation), gross);
                      const ownerNet = getReservationOwnerNet(reservation);
                      const commission = gross - ownerNet;

                      return (
                        <tr key={reservation.id} className="transition-colors hover:bg-teal-50/40">
                          <td className="px-4 py-3.5">
                            <span className="block font-bold text-slate-800">{reservation.guest_name || reservation.guest_email}</span>
                            <span className="mt-0.5 block text-[10px] text-slate-500">{reservation.properties?.title || 'Imóvel'}</span>
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap text-slate-600">
                            {formatReservationDate(reservation.check_in)} – {formatReservationDate(reservation.check_out)}
                          </td>
                          <td className="px-4 py-3.5 text-right font-semibold tabular-nums text-slate-800">{formatCurrency(gross)}</td>
                          <td className="px-4 py-3.5 text-right tabular-nums text-slate-600">{formatCurrency(cleaningFee)}</td>
                          <td className="px-4 py-3.5 text-right font-bold tabular-nums text-emerald-700">{formatCurrency(ownerNet)}</td>
                          <td className="px-4 py-3.5 text-right tabular-nums text-amber-700">{formatCurrency(commission)}</td>
                          <td className="px-4 py-3.5 text-right">
                            <button
                              type="button"
                              onClick={() => handleSendWhatsAppSummary(reservation)}
                              aria-label={`Enviar resumo da reserva de ${reservation.guest_name || reservation.guest_email} pelo WhatsApp`}
                              className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700"
                            >
                              <MessageSquare className="size-3.5" />
                              WhatsApp
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}

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