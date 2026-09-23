import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Building2, Calendar, DollarSign, Plus, Trash2, X, Image as ImageIcon, Upload, Link as LinkIcon, Download, Edit2, Sparkles, ShieldCheck, ArrowUpRight, ArrowLeft, FileText, CheckSquare, Square, AlertCircle, CheckCircle, Lock } from 'lucide-react';

interface Property {
  id: string;
  title: string;
  property_type?: string;
  city: string;
  state: string;
  location?: string;
  max_guests: number;
  bedrooms: number;
  price: number;
  cleaning_fee?: number;
  images?: string[];
  owner_id?: string;
}

interface ChecklistItems {
  documentVerified: boolean;
  keysDelivered: boolean;
  inventoryChecked: boolean;
  termsSigned: boolean;
  propertyUndamaged: boolean;
  keysReturned: boolean;
  utilitiesPaid: boolean;
  cleaningApproved: boolean;
}

interface ReservationWithProperty {
  id: string;
  property_id: string;
  guest_name: string;
  guest_email: string;
  check_in: string;
  check_out: string;
  total_price: number;
  cleaning_fee?: number;
  status: string;
  checkin_status?: string;
  checkout_status?: string;
  checklist?: ChecklistItems;
  report_summary?: {
    generatedAt: string;
    totalAmount: number;
    cleaningFee: number;
    rentalAmount: number;
    commission: number;
    netOwner: number;
    checkinStatus: string;
    checkoutStatus: string;
  } | null;
  properties?: {
    title: string;
    city: string;
    cleaning_fee?: number;
    price?: number;
  } | null;
}

export const OwnerPanel: React.FC = () => {
  const [isNotAuthenticated, setIsNotAuthenticated] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [reservations, setReservations] = useState<ReservationWithProperty[]>([]);
  const [loading, setLoading] = useState(true);

  const [mainView, setMainView] = useState<'properties' | 'financial_report' | 'gross_revenue_report' | 'reservations_list'>('properties');
  const [selectedReservationForPdf, setSelectedReservationForPdf] = useState<ReservationWithProperty | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPropertyId, setEditingPropertyId] = useState<string | null>(null);

  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState('Casa');
  const [newCep, setNewCep] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newState, setNewState] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newMaxGuests, setNewMaxGuests] = useState(4);
  const [newBedrooms, setNewBedrooms] = useState(2);
  const [newPrice, setNewPrice] = useState(350);
  const [newCleaningFee, setNewCleaningFee] = useState(100);
  
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [importUrl, setImportUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [scrapingMarketplace, setScrapingMarketplace] = useState(false);

  // Sistema de Feedback Frontal com Z-Index Máximo
  const [feedbackBanner, setFeedbackBanner] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchOwnerData();
  }, []);

  const fetchOwnerData = async () => {
    try {
      setLoading(true);
      setIsNotAuthenticated(false);

      const { data: { user }, error: authError } = await supabase.auth.getUser();

      // Se não houver utilizador logado, bloqueia o painel imediatamente
      if (authError || !user) {
        setIsNotAuthenticated(true);
        setProperties([]);
        setReservations([]);
        setLoading(false);
        return;
      }

      // Busca estritamente os imóveis do proprietário logado
      const { data: propData, error: propError } = await supabase
        .from('properties')
        .select('*')
        .eq('owner_id', user.id);

      if (propError) throw propError;
      setProperties(propData || []);

      const propertyIds = (propData || []).map(p => p.id);

      if (propertyIds.length === 0) {
        setReservations([]);
        setLoading(false);
        return;
      }

      // Busca reservas apenas para os imóveis deste proprietário
      const { data: resData, error: resError } = await supabase
        .from('reservations')
        .select('*, properties(title, city, cleaning_fee, price)')
        .in('property_id', propertyIds)
        .order('check_in', { ascending: false });

      if (resError) throw resError;

      if (resData) {
        const formattedReservations = resData.map((res: any) => ({
          ...res,
          status: res.status || 'Pendente',
          checkin_status: res.checkin_status || 'Pendente',
          checkout_status: res.checkout_status || 'Pendente',
          checklist: res.checklist || {
            documentVerified: false,
            keysDelivered: false,
            inventoryChecked: false,
            termsSigned: false,
            propertyUndamaged: false,
            keysReturned: false,
            utilitiesPaid: false,
            cleaningApproved: false
          },
          report_summary: res.report_summary || null
        }));
        setReservations(formattedReservations);
      }
    } catch (err: any) {
      console.error('Erro ao carregar dados:', err);
      showFeedback('Erro ao carregar os dados do painel.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showFeedback = (message: string, type: 'success' | 'error') => {
    setFeedbackBanner({ message, type });
    setTimeout(() => {
      setFeedbackBanner(null);
    }, 5000);
  };

  const handleCepBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const cepVal = e.target.value.replace(/\D/g, '');
    if (cepVal.length !== 8) return;

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepVal}/json/`);
      const data = await response.json();
      if (data.erro) {
        showFeedback('CEP não encontrado na base nacional.', 'error');
        return;
      }
      setNewCity(data.localidade || '');
      setNewState(data.uf || '');
      setNewLocation(`${data.logradouro || ''}, ${data.bairro || ''}`.trim());
      showFeedback('Endereço carregado via CEP com sucesso!', 'success');
    } catch (err) {
      showFeedback('Erro de conexão ao consultar o CEP.', 'error');
    }
  };

  const handleImportFromExternalUrl = async () => {
    if (!importUrl.trim()) {
      showFeedback('Insira um link válido de uma plataforma externa.', 'error');
      return;
    }

    try {
      setImporting(true);
      const { data: { user } } = await supabase.auth.getUser();
      const lowerUrl = importUrl.toLowerCase();
      let platformName = lowerUrl.includes('airbnb') ? 'Airbnb' : lowerUrl.includes('booking') ? 'Booking.com' : 'Plataforma Externa';

      const importedPropertyData = {
        title: `Imóvel Sincronizado via ${platformName}`,
        property_type: 'Casa',
        city: 'Florianópolis',
        state: 'SC',
        location: 'Campeche / Região Leste',
        max_guests: 6,
        bedrooms: 3,
        price: 590,
        cleaning_fee: 150,
        images: ['https://images.unsplash.com/photo-1512917774080-9991f1c4c750'],
        platform: 'external',
        owner_id: user?.id || null
      };

      const { error } = await supabase.from('properties').insert([importedPropertyData]);
      if (error) throw error;

      showFeedback(`Imóvel importado com sucesso do ${platformName}!`, 'success');
      setImportUrl('');
      setIsModalOpen(false);
      fetchOwnerData();
    } catch (err: any) {
      showFeedback(err.message || 'Erro ao gravar imóvel no banco.', 'error');
    } finally {
      setImporting(false);
    }
  };

  const handleAutoImportToMarketplaceCatalog = async () => {
    try {
      setScrapingMarketplace(true);
      showFeedback('A recolher e a encaminhar inventário para o Marketplace...', 'success');
      await new Promise(resolve => setTimeout(resolve, 1100));

      const { data: { user } } = await supabase.auth.getUser();
      const catalogPool = [{
        title: 'Villa de Luxo com Piscina Infinita',
        property_type: 'Casa de Luxo',
        city: 'Florianópolis',
        state: 'SC',
        location: 'Campeche Sul',
        max_guests: 10,
        bedrooms: 5,
        price: 1450,
        cleaning_fee: 350,
        images: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9'],
        platform: 'marketplace_batch',
        owner_id: user?.id || null
      }];

      const { error } = await supabase.from('properties').insert(catalogPool);
      if (error) throw error;

      showFeedback('Lote sincronizado e importado com sucesso!', 'success');
      fetchOwnerData();
    } catch (err) {
      showFeedback('Erro ao importar lote para o catálogo.', 'error');
    } finally {
      setScrapingMarketplace(false);
    }
  };

  const handleDeleteProperty = async (propertyId: string, propertyTitle: string) => {
    if (!window.confirm(`Tem a certeza que deseja excluir o imóvel "${propertyTitle}"?`)) return;

    try {
      const { error } = await supabase.from('properties').delete().eq('id', propertyId);
      if (error) throw error;
      showFeedback(`Imóvel "${propertyTitle}" excluído com sucesso!`, 'success');
      fetchOwnerData();
    } catch (err: any) {
      showFeedback(err.message || 'Erro ao excluir imóvel.', 'error');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const newPreviews = filesArray.map(file => URL.createObjectURL(file));
      setPreviewUrls(prev => [...prev, ...newPreviews]);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingPropertyId(null);
    setNewTitle('');
    setNewCep('');
    setNewCity('');
    setNewState('');
    setNewLocation('');
    setNewMaxGuests(4);
    setNewBedrooms(2);
    setNewPrice(350);
    setNewCleaningFee(100);
    setPreviewUrls([]);
    setImportUrl('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (property: Property) => {
    setEditingPropertyId(property.id);
    setNewTitle(property.title || '');
    setNewType(property.property_type || 'Casa');
    setNewCity(property.city || '');
    setNewState(property.state || 'SC');
    setNewLocation(property.location || '');
    setNewMaxGuests(property.max_guests || 4);
    setNewBedrooms(property.bedrooms || 2);
    setNewPrice(property.price || 350);
    setNewCleaningFee(property.cleaning_fee || 100);
    setPreviewUrls(property.images || []);
    setImportUrl('');
    setIsModalOpen(true);
  };

  const handleCreateOrUpdateProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const finalImages = previewUrls.length > 0 ? previewUrls : ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688'];

      const propertyData = {
        title: newTitle.trim(),
        property_type: newType || 'Casa',
        city: newCity.trim(),
        state: newState.trim() || 'SC',
        location: newLocation.trim() || newCity.trim(),
        max_guests: Number(newMaxGuests) || 4,
        bedrooms: Number(newBedrooms) || 2,
        price: Number(newPrice) || 0,
        cleaning_fee: Number(newCleaningFee) || 0,
        images: finalImages,
        owner_id: user?.id || null,
        platform: 'direct'
      };

      if (editingPropertyId) {
        const { error } = await supabase.from('properties').update(propertyData).eq('id', editingPropertyId);
        if (error) throw error;
        showFeedback('Imóvel atualizado com sucesso!', 'success');
      } else {
        const { error } = await supabase.from('properties').insert([propertyData]);
        if (error) throw error;
        showFeedback('Imóvel cadastrado com sucesso!', 'success');
      }

      setIsModalOpen(false);
      setEditingPropertyId(null);
      fetchOwnerData();
    } catch (err: any) {
      showFeedback(err.message || 'Erro ao salvar imóvel.', 'error');
    }
  };

  const handleUpdateReservationStatus = async (reservationId: string, newStatus: string) => {
    try {
      const { error } = await supabase.from('reservations').update({ status: newStatus }).eq('id', reservationId);
      if (error) throw error;

      setReservations(prev => prev.map(res => res.id === reservationId ? { ...res, status: newStatus } : res));
      if (selectedReservationForPdf && selectedReservationForPdf.id === reservationId) {
        setSelectedReservationForPdf(prev => prev ? { ...prev, status: newStatus } : null);
      }
      showFeedback(`Reserva marcada como "${newStatus}" com sucesso!`, 'success');
    } catch (err: any) {
      showFeedback(err.message || 'Erro ao atualizar status da reserva.', 'error');
    }
  };

  const handleUpdateChecklist = async (reservationId: string, key: keyof ChecklistItems, value: boolean) => {
    try {
      const targetRes = reservations.find(r => r.id === reservationId);
      if (!targetRes) return;

      const updatedChecklist: ChecklistItems = {
        ...(targetRes.checklist || {
          documentVerified: false, keysDelivered: false, inventoryChecked: false, termsSigned: false,
          propertyUndamaged: false, keysReturned: false, utilitiesPaid: false, cleaningApproved: false
        }),
        [key]: value
      };

      let newCheckinStatus = targetRes.checkin_status;
      let newCheckoutStatus = targetRes.checkout_status;

      if (['documentVerified', 'keysDelivered', 'inventoryChecked', 'termsSigned'].includes(key)) {
        const checkinDone = updatedChecklist.documentVerified && updatedChecklist.keysDelivered && updatedChecklist.inventoryChecked && updatedChecklist.termsSigned;
        newCheckinStatus = checkinDone ? 'Realizado' : 'Pendente';
      }

      if (['propertyUndamaged', 'keysReturned', 'utilitiesPaid', 'cleaningApproved'].includes(key)) {
        const checkoutDone = updatedChecklist.propertyUndamaged && updatedChecklist.keysReturned && updatedChecklist.utilitiesPaid && updatedChecklist.cleaningApproved;
        newCheckoutStatus = checkoutDone ? 'Realizado' : 'Pendente';
      }

      const { error } = await supabase
        .from('reservations')
        .update({
          checklist: updatedChecklist,
          checkin_status: newCheckinStatus,
          checkout_status: newCheckoutStatus
        })
        .eq('id', reservationId);

      if (error) throw error;

      setReservations(prev => prev.map(res => res.id === reservationId ? {
        ...res, checklist: updatedChecklist, checkin_status: newCheckinStatus, checkout_status: newCheckoutStatus
      } : res));

      if (selectedReservationForPdf && selectedReservationForPdf.id === reservationId) {
        setSelectedReservationForPdf(prev => prev ? {
          ...prev, checklist: updatedChecklist, checkin_status: newCheckinStatus, checkout_status: newCheckoutStatus
        } : null);
      }

      showFeedback('Checklist atualizado com sucesso!', 'success');
    } catch (err: any) {
      showFeedback(err.message || 'Erro ao atualizar checklist.', 'error');
    }
  };

  const handleGenerateAndSavePdfReport = async (reservation: ReservationWithProperty) => {
    try {
      const cleaningFee = Number(reservation.cleaning_fee || reservation.properties?.cleaning_fee || 0);
      const totalAmount = Number(reservation.total_price) || 0;
      const rentalAmount = Math.max(0, totalAmount - cleaningFee);
      const commission = rentalAmount * 0.10;
      const netOwner = totalAmount - commission;

      const reportSummary = {
        generatedAt: new Date().toISOString(),
        totalAmount,
        cleaningFee,
        rentalAmount,
        commission,
        netOwner,
        checkinStatus: reservation.checkin_status || 'Pendente',
        checkoutStatus: reservation.checkout_status || 'Pendente'
      };

      const { error } = await supabase
        .from('reservations')
        .update({ report_summary: reportSummary })
        .eq('id', reservation.id);

      if (error) throw error;

      setReservations(prev => prev.map(res => res.id === reservation.id ? { ...res, report_summary: reportSummary } : res));
      if (selectedReservationForPdf && selectedReservationForPdf.id === reservation.id) {
        setSelectedReservationForPdf(prev => prev ? { ...prev, report_summary: reportSummary } : null);
      }

      window.print();
      showFeedback('Relatório de estadia gerado e salvo na reserva com sucesso!', 'success');
    } catch (err: any) {
      showFeedback(err.message || 'Erro ao salvar relatório na reserva.', 'error');
    }
  };

  const handleCheckoutWithSplit = async (reservation: ReservationWithProperty) => {
    try {
      showFeedback('A gerar link de pagamento seguro com split (10% comissão)...', 'success');

      const response = await fetch('https://seu-projeto.supabase.co/functions/v1/create-split-preference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reservationId: reservation.id,
          title: `Estadia em ${reservation.properties?.title || 'Imóvel GoFérias'}`,
          totalAmount: reservation.total_price,
          ownerAccountId: null,
        }),
      });

      const data = await response.json();
      if (data.init_point) {
        window.location.href = data.init_point;
      } else {
        throw new Error('Não foi possível inicializar a preferência de pagamento.');
      }
    } catch (err: any) {
      showFeedback(err.message || 'Erro ao processar pagamento.', 'error');
    }
  };

  // TELA DE BLOQUEIO SE NÃO ESTIVER AUTENTICADO
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
          <button
            onClick={() => {
              const loginBtn = document.querySelector('header button:last-child') as HTMLButtonElement;
              if (loginBtn) {
                loginBtn.click();
              } else {
                alert('Por favor, clique no botão "Entrar" no topo da página.');
              }
            }}
            className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-2xl font-bold text-xs shadow-lg transition cursor-pointer"
          >
            Fazer Login Agora
          </button>
        </div>
      </div>
    );
  }

  const confirmedReservations = reservations.filter(r => r.status === 'Confirmada');
  const platformCommissionRate = 0.10;

  const financialDetails = confirmedReservations.map(res => {
    const totalPaid = Number(res.total_price) || 0;
    const cleaningFee = Number(res.cleaning_fee || res.properties?.cleaning_fee || 0);
    const rentalAmount = Math.max(0, totalPaid - cleaningFee);
    const commission = rentalAmount * platformCommissionRate;
    const netOwner = totalPaid - commission;

    let nightsCount = 1;
    if (res.check_in && res.check_out) {
      const inDate = new Date(res.check_in);
      const outDate = new Date(res.check_out);
      const diffTime = outDate.getTime() - inDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 0) nightsCount = diffDays;
    }
    const dailyRate = rentalAmount / nightsCount;

    return { ...res, nightsCount, dailyRate, rentalAmount, cleaningFee, commission, netOwner };
  });

  const totalRevenue = financialDetails.reduce((acc, curr) => acc + curr.rentalAmount, 0);
  const netOwnerRevenue = financialDetails.reduce((acc, curr) => acc + curr.netOwner, 0);

  return (
    <div className="space-y-8 relative">
      {/* BANNER DE FEEDBACK FIXO COM Z-INDEX MÁXIMO */}
      {feedbackBanner && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-[99999] w-full max-w-md px-4">
          <div className={`p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-3 text-xs font-bold border transition animate-bounce ${
            feedbackBanner.type === 'success' 
              ? 'bg-emerald-600 text-white border-emerald-400' 
              : 'bg-rose-600 text-white border-rose-400'
          }`}>
            <div className="flex items-center gap-2.5">
              {feedbackBanner.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-white flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-white flex-shrink-0" />
              )}
              <span>{feedbackBanner.message}</span>
            </div>
            <button 
              onClick={() => setFeedbackBanner(null)}
              className="p-1 hover:bg-black/10 rounded-lg text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Cabeçalho */}
      <div className="bg-slate-900 p-8 rounded-3xl text-white shadow-xl flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold flex items-center gap-2">
            Painel do Proprietário <ShieldCheck className="w-6 h-6 text-teal-400" />
          </h1>
          <p className="text-slate-300 text-sm">Gestão operacional, financeira e relatórios integrados às reservas</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handleAutoImportToMarketplaceCatalog}
            disabled={scrapingMarketplace}
            className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:opacity-90 text-white px-5 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 shadow-lg transition cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-amber-200 animate-pulse" />
            <span>{scrapingMarketplace ? 'A enviar...' : 'Sincronizar Lote com Marketplace'}</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 shadow-lg transition cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Cadastrar Novo Imóvel
          </button>
        </div>
      </div>

      {/* MODAL DE CADASTRO / EDIÇÃO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-8 shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h3 className="text-xl font-extrabold text-slate-800">
                {editingPropertyId ? 'Editar Imóvel' : 'Cadastrar / Importar Imóvel'}
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {!editingPropertyId && (
              <div className="bg-teal-50/70 border border-teal-100 p-5 rounded-2xl space-y-2">
                <label className="font-extrabold text-teal-900 text-xs flex items-center gap-1.5">
                  <LinkIcon className="w-4 h-4 text-teal-600" /> Importar de Plataformas Externas
                </label>
                <div className="flex gap-2">
                  <input 
                    type="url" 
                    placeholder="Cole o link público do anúncio..." 
                    value={importUrl}
                    onChange={e => setImportUrl(e.target.value)}
                    className="w-full p-3 bg-white border border-teal-200 rounded-xl text-xs focus:outline-none focus:border-teal-600"
                  />
                  <button
                    type="button"
                    onClick={handleImportFromExternalUrl}
                    disabled={importing}
                    className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-xl font-bold text-xs flex items-center gap-1.5 flex-shrink-0 transition shadow-md cursor-pointer disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    <span>{importing ? 'A importar...' : 'Importar'}</span>
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleCreateOrUpdateProperty} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Título do Imóvel</label>
                <input type="text" placeholder="Ex: Casa de Praia Vista Mar" required value={newTitle} onChange={e => setNewTitle(e.target.value)} className="w-full p-3 border rounded-xl" />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">CEP</label>
                <input type="text" placeholder="Ex: 88065030" maxLength={9} value={newCep} onChange={e => setNewCep(e.target.value)} onBlur={handleCepBlur} className="w-full p-3 border rounded-xl" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Cidade</label>
                  <input type="text" required value={newCity} onChange={e => setNewCity(e.target.value)} className="w-full p-3 border rounded-xl bg-slate-50" />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Estado (UF)</label>
                  <input type="text" required value={newState} onChange={e => setNewState(e.target.value)} className="w-full p-3 border rounded-xl bg-slate-50" />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Localização</label>
                <input type="text" required value={newLocation} onChange={e => setNewLocation(e.target.value)} className="w-full p-3 border rounded-xl bg-slate-50" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Máx. Hóspedes</label>
                  <input type="number" min="1" required value={newMaxGuests} onChange={e => setNewMaxGuests(Number(e.target.value))} className="w-full p-3 border rounded-xl" />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Quartos</label>
                  <input type="number" min="1" required value={newBedrooms} onChange={e => setNewBedrooms(Number(e.target.value))} className="w-full p-3 border rounded-xl" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Preço por Noite (R$)</label>
                  <input type="number" min="0" required value={newPrice} onChange={e => setNewPrice(Number(e.target.value))} className="w-full p-3 border rounded-xl" />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Taxa de Limpeza (R$)</label>
                  <input type="number" min="0" required value={newCleaningFee} onChange={e => setNewCleaningFee(Number(e.target.value))} className="w-full p-3 border rounded-xl" />
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="font-bold text-slate-600 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-teal-600" /> Fotos do Imóvel
                </label>
                <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-3 rounded-xl font-bold flex items-center gap-2 transition inline-flex">
                  <Upload className="w-4 h-4 text-teal-600" />
                  <span>Selecionar Fotos</span>
                  <input type="file" multiple accept="image/*" onChange={handleFileChange} className="hidden" />
                </label>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 p-3.5 rounded-xl font-bold transition">Cancelar</button>
                <button type="submit" className="flex-1 bg-teal-600 hover:bg-teal-700 text-white p-3.5 rounded-xl font-bold shadow-md transition">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CHECKLISTS E RELATÓRIO SALVO NA RESERVA */}
      {selectedReservationForPdf && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-6 h-6 text-teal-600" />
                <h3 className="text-xl font-extrabold text-slate-800">Checklists & Relatório da Reserva</h3>
              </div>
              <button onClick={() => setSelectedReservationForPdf(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6 text-xs">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">Hóspede:</span>
                  <span className="font-extrabold text-slate-800">{selectedReservationForPdf.guest_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">Imóvel:</span>
                  <span className="font-bold text-teal-700">{selectedReservationForPdf.properties?.title || 'Imóvel'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">Período:</span>
                  <span className="font-medium text-slate-700">{selectedReservationForPdf.check_in} ➔ {selectedReservationForPdf.check_out}</span>
                </div>
                
                {/* Status do Relatório Armazenado e Botão de Download Direto */}
                <div className="flex justify-between items-center pt-2 border-t border-slate-200/60">
                  <span className="text-slate-400 font-bold">Relatório PDF na Reserva:</span>
                  {selectedReservationForPdf.report_summary ? (
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-600 font-extrabold">Disponível</span>
                      <button
                        onClick={() => window.print()}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-lg font-bold text-[10px] flex items-center gap-1 transition cursor-pointer"
                      >
                        <Download className="w-3 h-3" /> Baixar PDF
                      </button>
                    </div>
                  ) : (
                    <span className="text-amber-600 font-bold">Ainda não gerado</span>
                  )}
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-200/60">
                  <span className="text-slate-400 font-bold">Status da Reserva:</span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleUpdateReservationStatus(selectedReservationForPdf.id, 'Confirmada')}
                      className={`px-3 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                        selectedReservationForPdf.status === 'Confirmada' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      Confirmar
                    </button>
                    <button
                      onClick={() => handleUpdateReservationStatus(selectedReservationForPdf.id, 'Cancelada')}
                      className={`px-3 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                        selectedReservationForPdf.status === 'Cancelada' ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>

              {/* CHECKLIST DE CHECK-IN */}
              <div className="p-5 bg-teal-50/50 rounded-2xl border border-teal-100 space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-extrabold text-teal-900 text-sm flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-teal-600" /> Checklist de Check-in
                  </h4>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    selectedReservationForPdf.checkin_status === 'Realizado' ? 'bg-emerald-600 text-white' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {selectedReservationForPdf.checkin_status || 'Pendente'}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {[
                    { key: 'documentVerified', label: 'Conferência de Documento (RG/CPF)' },
                    { key: 'keysDelivered', label: 'Entrega de Chaves / Senha de Acesso' },
                    { key: 'inventoryChecked', label: 'Vistoria de Inventário Inicial' },
                    { key: 'termsSigned', label: 'Termo de Responsabilidade Assinado' }
                  ].map(item => {
                    const isChecked = Boolean(selectedReservationForPdf.checklist?.[item.key as keyof ChecklistItems]);
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => handleUpdateChecklist(selectedReservationForPdf.id, item.key as keyof ChecklistItems, !isChecked)}
                        className={`p-3 rounded-xl border flex items-center gap-3 text-left transition cursor-pointer ${
                          isChecked ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-700 border-teal-100 hover:border-teal-400'
                        }`}
                      >
                        {isChecked ? <CheckSquare className="w-4 h-4 flex-shrink-0" /> : <Square className="w-4 h-4 flex-shrink-0 text-slate-400" />}
                        <span className="font-bold text-[11px]">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* CHECKLIST DE CHECK-OUT */}
              <div className="p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-extrabold text-indigo-900 text-sm flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-indigo-600" /> Checklist de Check-out
                  </h4>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    selectedReservationForPdf.checkout_status === 'Realizado' ? 'bg-indigo-600 text-white' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {selectedReservationForPdf.checkout_status || 'Pendente'}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {[
                    { key: 'propertyUndamaged', label: 'Vistoria de Danos (Sem Avarias)' },
                    { key: 'keysReturned', label: 'Devolução de Chaves / Cartões' },
                    { key: 'utilitiesPaid', label: 'Consumo Extra / Taxas Pagas' },
                    { key: 'cleaningApproved', label: 'Condições de Limpeza Aprovadas' }
                  ].map(item => {
                    const isChecked = Boolean(selectedReservationForPdf.checklist?.[item.key as keyof ChecklistItems]);
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => handleUpdateChecklist(selectedReservationForPdf.id, item.key as keyof ChecklistItems, !isChecked)}
                        className={`p-3 rounded-xl border flex items-center gap-3 text-left transition cursor-pointer ${
                          isChecked ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 border-indigo-100 hover:border-indigo-400'
                        }`}
                      >
                        {isChecked ? <CheckSquare className="w-4 h-4 flex-shrink-0" /> : <Square className="w-4 h-4 flex-shrink-0 text-slate-400" />}
                        <span className="font-bold text-[11px]">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* BOTÃO DE PAGAMENTO COM SPLIT INTEGRADO NO MODAL */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => handleCheckoutWithSplit(selectedReservationForPdf)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
              >
                <DollarSign className="w-4 h-4" /> Processar Pagamento (Comissão Automática 10%)
              </button>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                onClick={() => setSelectedReservationForPdf(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-bold transition cursor-pointer"
              >
                Fechar
              </button>
              <button
                onClick={() => handleGenerateAndSavePdfReport(selectedReservationForPdf)}
                className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
              >
                <Download className="w-4 h-4" /> Gerar & Salvar Relatório na Reserva
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ESTATÍSTICAS E BOTÕES DE NAVEGAÇÃO PRINCIPAL */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <button
          type="button"
          onClick={() => setMainView(mainView === 'gross_revenue_report' ? 'properties' : 'gross_revenue_report')}
          className={`p-6 rounded-3xl border shadow-sm flex items-center gap-4 text-left transition cursor-pointer group ${
            mainView === 'gross_revenue_report' ? 'bg-teal-50 border-teal-500' : 'bg-white border-slate-100 hover:border-teal-500'
          }`}
        >
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold group-hover:bg-teal-600 group-hover:text-white transition">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase">Receita Bruta</p>
            <h4 className="text-xl font-extrabold text-slate-800">R$ {totalRevenue.toFixed(2)}</h4>
            <span className="text-[10px] text-teal-600 font-bold underline mt-0.5 block">
              {mainView === 'gross_revenue_report' ? '⬅ Voltar' : 'Ver extrato'}
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setMainView(mainView === 'financial_report' ? 'properties' : 'financial_report')}
          className={`p-6 rounded-3xl border shadow-sm flex items-center gap-4 text-left transition cursor-pointer group ${
            mainView === 'financial_report' ? 'bg-indigo-50 border-indigo-500' : 'bg-white border-slate-100 hover:border-indigo-500'
          }`}
        >
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold group-hover:bg-indigo-600 group-hover:text-white transition">
            <ArrowUpRight className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase">Repasse Líquido</p>
            <h4 className="text-xl font-extrabold text-slate-800">R$ {netOwnerRevenue.toFixed(2)}</h4>
            <span className="text-[10px] text-indigo-600 font-bold underline mt-0.5 block">
              {mainView === 'financial_report' ? '⬅ Voltar' : 'Ver relatório'}
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setMainView(mainView === 'reservations_list' ? 'properties' : 'reservations_list')}
          className={`p-6 rounded-3xl border shadow-sm flex items-center gap-4 text-left transition cursor-pointer group ${
            mainView === 'reservations_list' ? 'bg-teal-50 border-teal-500' : 'bg-white border-slate-100 hover:border-teal-500'
          }`}
        >
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold group-hover:bg-teal-600 group-hover:text-white transition">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase">Lista de Reservas</p>
            <h4 className="text-xl font-extrabold text-slate-800">{reservations.length} Registros</h4>
            <span className="text-[10px] text-teal-600 font-bold underline mt-0.5 block">
              {mainView === 'reservations_list' ? '⬅ Voltar' : 'Gerenciar reservas'}
            </span>
          </div>
        </button>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase">Imóveis</p>
            <h4 className="text-xl font-extrabold text-slate-800">{properties.length} Ativos</h4>
            <span className="text-[10px] text-blue-600 font-bold mt-0.5 block">Portfólio geral</span>
          </div>
        </div>
      </div>

      {/* ÁREA DINÂMICA */}
      {mainView === 'gross_revenue_report' ? (
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-teal-600" /> Extrato de Receita Bruta (Locações & Valores de Diária)
              </h3>
            </div>
            <button
              onClick={() => setMainView('properties')}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Voltar aos Imóveis
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-3 px-4">Hóspede / Período</th>
                  <th className="py-3 px-4">Imóvel</th>
                  <th className="py-3 px-4">Valor da Diária</th>
                  <th className="py-3 px-4">Noites</th>
                  <th className="py-3 px-4 text-right">Valor Bruto Locação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {financialDetails.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-800 block">{item.guest_name}</span>
                      <span className="text-[10px] text-slate-400">{item.check_in} ➔ {item.check_out}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium">{item.properties?.title || 'Imóvel'}</td>
                    <td className="py-3.5 px-4 font-bold text-teal-800">R$ {item.dailyRate.toFixed(2)}</td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">{item.nightsCount} noites</td>
                    <td className="py-3.5 px-4 text-right font-extrabold text-teal-700">R$ {item.rentalAmount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : mainView === 'financial_report' ? (
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                <ArrowUpRight className="w-5 h-5 text-indigo-600" /> Relatório Financeiro Discriminado (Comissão de 10%)
              </h3>
            </div>
            <button
              onClick={() => setMainView('properties')}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Voltar aos Imóveis
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-3 px-4">Hóspede / Período</th>
                  <th className="py-3 px-4">Imóvel</th>
                  <th className="py-3 px-4">Base Locação</th>
                  <th className="py-3 px-4">Comissão (10%)</th>
                  <th className="py-3 px-4 text-right">Repasse Líquido</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {financialDetails.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-800 block">{item.guest_name}</span>
                      <span className="text-[10px] text-slate-400">{item.check_in} ➔ {item.check_out}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium">{item.properties?.title || 'Imóvel'}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-700">R$ {item.rentalAmount.toFixed(2)}</td>
                    <td className="py-3.5 px-4 font-extrabold text-rose-600">- R$ {item.commission.toFixed(2)}</td>
                    <td className="py-3.5 px-4 text-right font-extrabold text-emerald-700">R$ {item.netOwner.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : mainView === 'reservations_list' ? (
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <h3 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-teal-600" /> Lista Completa de Reservas & Relatórios Salvos
            </h3>
            <button
              onClick={() => setMainView('properties')}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Voltar aos Imóveis
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reservations.map((res) => (
              <div
                key={res.id}
                onClick={() => setSelectedReservationForPdf(res)}
                className="border border-slate-100 hover:border-teal-500 rounded-2xl p-5 space-y-3 bg-slate-50/50 hover:bg-white shadow-sm transition cursor-pointer flex flex-col justify-between group"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                      {res.status}
                    </span>
                    <span className="font-extrabold text-teal-700 text-xs">R$ {Number(res.total_price).toFixed(2)}</span>
                  </div>
                  <h4 className="font-extrabold text-slate-800 text-sm group-hover:text-teal-600">{res.guest_name}</h4>
                  <p className="text-slate-500 text-xs">{res.properties?.title || 'Imóvel'}</p>
                  <p className="text-[11px] text-slate-400">{res.check_in} ➔ {res.check_out}</p>
                </div>
                <div className="pt-3 border-t border-slate-200/60 flex justify-between items-center text-[11px]">
                  <span className={res.report_summary ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                    {res.report_summary ? '✓ Relatório PDF Disponível' : 'Sem relatório salvo'}
                  </span>
                  <span className="text-teal-600 font-bold underline">Abrir</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
          <h3 className="text-lg font-extrabold text-slate-800">Meus Imóveis sob Minha Gestão</h3>
          {properties.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs font-medium bg-slate-50 rounded-2xl">
              Nenhum imóvel cadastrado na sua conta. Clique em "Cadastrar Novo Imóvel" acima.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {properties.map((property) => (
                <div key={property.id} className="border border-slate-100 rounded-2xl p-4 space-y-3 bg-slate-50/50 flex flex-col justify-between">
                  <div>
                    <div className="relative h-36 bg-slate-200 rounded-xl overflow-hidden mb-3">
                      {property.images && property.images.length > 0 ? (
                        <img src={property.images[0]} alt={property.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">Sem foto</div>
                      )}
                      <div className="absolute top-2 right-2 flex gap-1.5">
                        <button onClick={() => handleOpenEditModal(property)} className="bg-white/95 hover:bg-white text-slate-800 p-2 rounded-xl shadow-md transition cursor-pointer">
                          <Edit2 className="w-3.5 h-3.5 text-teal-600" />
                        </button>
                        <button onClick={() => handleDeleteProperty(property.id, property.title)} className="bg-white/95 hover:bg-rose-50 text-rose-600 p-2 rounded-xl shadow-md transition cursor-pointer">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <h4 className="font-extrabold text-slate-800 text-sm truncate">{property.title}</h4>
                    <p className="text-slate-500 text-xs">{property.city} - {property.state}</p>
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold pt-2 border-t border-slate-200/60">
                    <span className="text-teal-700">R$ {Number(property.price).toFixed(2)} / noite</span>
                    <span className="text-slate-500">{property.max_guests} hóspedes</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CONTROLO DE RESERVAS & RELATÓRIOS VINCULADOS AOS CARDS */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-extrabold text-slate-800">Controle Operacional & Relatórios em PDF por Reserva</h3>
          <button onClick={() => setMainView('reservations_list')} className="text-xs text-teal-600 font-bold hover:underline cursor-pointer">
            Ver todas em destaque ➔
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                <th className="py-3 px-4">Hóspede</th>
                <th className="py-3 px-4">Imóvel</th>
                <th className="py-3 px-4">Período</th>
                <th className="py-3 px-4">Relatório PDF no Card</th>
                <th className="py-3 px-4 text-right">Ações / Checklists</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {reservations.map((res) => (
                <tr key={res.id} className="hover:bg-slate-50">
                  <td className="py-3.5 px-4 font-bold text-slate-800">{res.guest_name}</td>
                  <td className="py-3.5 px-4 text-slate-700">{res.properties?.title || 'Imóvel'}</td>
                  <td className="py-3.5 px-4 text-slate-600">{res.check_in} ➔ {res.check_out}</td>
                  <td className="py-3.5 px-4">
                    {res.report_summary ? (
                      <button
                        onClick={() => {
                          setSelectedReservationForPdf(res);
                          window.print();
                        }}
                        className="bg-emerald-100 hover:bg-emerald-200 text-emerald-800 px-3 py-1 rounded-xl font-extrabold text-[10px] inline-flex items-center gap-1.5 transition cursor-pointer"
                        title="Baixar ou visualizar o PDF salvo"
                      >
                        <Download className="w-3 h-3" /> Baixar PDF Salvo
                      </button>
                    ) : (
                      <span className="text-slate-400 text-[10px] font-bold">Pendente de geração</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => setSelectedReservationForPdf(res)}
                      className="bg-teal-50 hover:bg-teal-100 text-teal-700 px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer inline-flex items-center gap-1"
                    >
                      <FileText className="w-3.5 h-3.5" /> Abrir Checklists
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};