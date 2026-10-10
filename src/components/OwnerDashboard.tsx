import React, { useState, useEffect, useRef } from 'react';
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
  const [isNotAuthenticated, setIsNotAuthenticated] = useState(false);
  const activeTab = 'overview';

  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState('Casa');
  const [newCity, setNewCity] = useState('Florianópolis');
  const [newState, setNewState] = useState('SC');
  const [newMaxGuests, setNewMaxGuests] = useState(4);
  const [newBedrooms, setNewBedrooms] = useState(2);
  const [newBathrooms, setNewBathrooms] = useState(1);
  const [newPrice, setNewPrice] = useState(350);
  const [newCleaningFee, setNewCleaningFee] = useState(100);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [isSavingProperty, setIsSavingProperty] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

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

      const propRes = await supabase
        .from('properties')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
        
      if (propRes.error) throw propRes.error;
      const userProperties = (propRes.data || []).map((property) => ({
        ...property,
        bedrooms: Number(property.quartos ?? property.bedrooms ?? 0),
      }));
      setProperties(userProperties);

      const propertyIds = userProperties.map(p => p.id);

      if (propertyIds.length === 0) {
        setReservations([]);
        setLoading(false);
        return;
      }

      const resQuery = await supabase
        .from('reservations')
        .select('*, properties:properties(title, city, cleaning_fee)')
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
    const uploadedImagePaths: string[] = [];
    setIsSavingProperty(true);

    try {
      const title = newTitle.trim();
      if (!title) {
        throw new Error('Informe o título do imóvel.');
      }

      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!authData.user) {
        throw new Error('Sessão expirada. Faça login novamente.');
      }
      const userId = authData.user.id;

      const imageUrls: string[] = [];
      for (const file of newImageFiles) {
        const extension = file.type === 'image/png' ? 'png' : 'jpg';
        const storagePath = `${userId}/${crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await supabase.storage
          .from('property-images')
          .upload(storagePath, file, {
            cacheControl: '3600',
            contentType: file.type,
            upsert: false,
          });

        if (uploadError) throw uploadError;
        uploadedImagePaths.push(storagePath);

        const { data: { publicUrl } } = supabase.storage
          .from('property-images')
          .getPublicUrl(storagePath);
        imageUrls.push(publicUrl);
      }

      const propertyData = {
        title,
        property_type: newType,
        city: newCity,
        state: newState,
        max_guests: Number(newMaxGuests),
        quartos: Number(newBedrooms),
        banheiros: Number(newBathrooms),
        price: Number(newPrice),
        cleaning_fee: Number(newCleaningFee),
        images: imageUrls,
        user_id: userId,
      };

      const { error } = await supabase.from('properties').insert([propertyData]);
      if (error) throw error;
      uploadedImagePaths.length = 0;

      showToast('Imóvel cadastrado com sucesso!', 'success');
      setShowForm(false);
      setNewTitle('');
      setNewImageFiles([]);
      if (imageInputRef.current) imageInputRef.current.value = '';
      fetchOwnerData();
    } catch (err: any) {
      if (uploadedImagePaths.length > 0) {
        const { error: cleanupError } = await supabase.storage
          .from('property-images')
          .remove(uploadedImagePaths);
        if (cleanupError) console.error('Não foi possível remover imagens do cadastro incompleto:', cleanupError);
      }
      console.error('Erro ao cadastrar imóvel:', err);
      showToast(err.message || 'Erro ao cadastrar imóvel.', 'error');
    } finally {
      setIsSavingProperty(false);
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
          <h1 className="text-3xl font-extrabold mt-2">Meus Imóveis</h1>
          <p className="text-slate-300 text-sm mt-1">Gerencie os imóveis cadastrados na sua conta.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowForm(true)}
            className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 shadow-lg transition"
          >
            <Plus className="w-4 h-4" /> Cadastrar Novo Imóvel
          </button>
        </div>
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

      {activeTab === 'overview' ? (
        <>
          {/* Seção de Meus Imóveis */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-extrabold text-slate-800">Meus Imóveis</h3>
              <span className="text-xs text-slate-400 font-bold">{properties.length} cadastrados</span>
            </div>

            {loading ? (
              <div className="text-center py-12 text-slate-400 text-xs font-medium bg-slate-50 rounded-2xl">
                Carregando seus imóveis...
              </div>
            ) : properties.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs font-medium bg-slate-50 rounded-2xl">
                Nenhum imóvel cadastrado. Use "Cadastrar Novo Imóvel" para adicionar o primeiro.
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
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative my-8 space-y-5">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-teal-600 uppercase">Novo Anúncio</span>
                <h3 className="text-lg font-extrabold text-slate-800 mt-0.5">Cadastrar Imóvel</h3>
              </div>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition">
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

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
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
                  <label className="block font-bold text-slate-700 uppercase mb-1">Banheiros</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newBathrooms}
                    onChange={(e) => setNewBathrooms(Number(e.target.value))}
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
                <label htmlFor="property-image-files" className="block font-bold text-slate-700 uppercase mb-1">Fotos do Imóvel</label>
                <input
                  ref={imageInputRef}
                  id="property-image-files"
                  type="file"
                  accept="image/jpeg,image/png"
                  multiple
                  onChange={(event) => {
                    const files = Array.from(event.currentTarget.files || []);
                    if (files.length > 10) {
                      showToast('Selecione no máximo 10 imagens.', 'error');
                      event.currentTarget.value = '';
                      setNewImageFiles([]);
                      return;
                    }
                    if (files.some((file) => !['image/jpeg', 'image/png'].includes(file.type) || file.size > 10 * 1024 * 1024)) {
                      showToast('Use imagens JPG ou PNG de até 10 MB cada.', 'error');
                      event.currentTarget.value = '';
                      setNewImageFiles([]);
                      return;
                    }
                    setNewImageFiles(files);
                  }}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-medium file:mr-3 file:rounded-lg file:border-0 file:bg-teal-50 file:px-3 file:py-2 file:font-semibold file:text-teal-800"
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  {newImageFiles.length > 0 ? `${newImageFiles.length} imagem(ns) selecionada(s)` : 'JPG ou PNG, até 10 imagens de 10 MB cada.'}
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowForm(false)}
                  disabled={isSavingProperty}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-2xl font-bold transition"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isSavingProperty}
                  className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-2xl font-bold shadow-md transition"
                >
                  {isSavingProperty ? 'Enviando...' : 'Salvar Imóvel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};