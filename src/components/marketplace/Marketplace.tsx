import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { MapPin, Users, Calendar as CalendarIcon, X, CheckCircle2, AlertTriangle, Building2, ChevronLeft, ChevronRight, SlidersHorizontal, Search } from 'lucide-react';

interface Property {
  id: string;
  title: string;
  property_type: string;
  city: string;
  state: string;
  bedrooms: number;
  bathrooms: number;
  max_guests: number;
  price: number;
  cleaning_fee: number;
  images: string[];
}

interface Reservation {
  property_id: string;
  check_in: string;
  check_out: string;
  status: string;
}

export const Marketplace: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados dos Filtros Avançados
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [guestCount, setGuestCount] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(5000);
  const [availableCities, setAvailableCities] = useState<string[]>([]);

  // Estados do Modal de Reserva
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  
  // Seleção de Datas pelo Calendário Visual
  const [checkIn, setCheckIn] = useState<string | null>(null);
  const [checkOut, setCheckOut] = useState<string | null>(null);
  const [totalPrice, setTotalPrice] = useState(0);
  const [nightsCount, setNightsCount] = useState(0);

  // Navegação do Mês no Calendário
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());

  // Toast flutuante
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchMarketplaceData();
  }, []);

  // Lógica de Filtragem em Tempo Real
  useEffect(() => {
    let result = properties;

    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      result = result.filter(p => 
        p.title?.toLowerCase().includes(term) || 
        p.city?.toLowerCase().includes(term)
      );
    }

    if (selectedCity !== '') {
      result = result.filter(p => p.city === selectedCity);
    }

    if (guestCount > 0) {
      result = result.filter(p => (p.max_guests || 0) >= guestCount);
    }

    result = result.filter(p => (p.price || 0) <= maxPrice);

    setFilteredProperties(result);
  }, [searchTerm, selectedCity, guestCount, maxPrice, properties]);

  const fetchMarketplaceData = async () => {
    try {
      setLoading(true);
      const [propRes, resRes] = await Promise.all([
        supabase.from('marketplace_properties').select('*').order('created_at', { ascending: false }),
        supabase.from('reservations').select('property_id, check_in, check_out, status')
      ]);

      let finalProps = propRes.data;
      // Fallback caso a view ainda não tenha sido criada no Supabase
      if (propRes.error || !propRes.data) {
        const fallback = await supabase.from('properties').select('*').order('created_at', { ascending: false });
        finalProps = fallback.data;
      }

      if (finalProps) {
        setProperties(finalProps);
        setFilteredProperties(finalProps);

        const cities = Array.from(
          new Set(finalProps.map((p: any) => p.city).filter(Boolean))
        ) as string[];
        setAvailableCities(cities);
      }

      if (resRes.data) setReservations(resRes.data);
    } catch (err) {
      console.error('Erro ao carregar marketplace:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCity('');
    setGuestCount(0);
    setMaxPrice(5000);
  };

  const getPropertyReservations = (propId: string) => {
    return reservations.filter(r => r.property_id === propId && r.status !== 'Cancelada');
  };

  const isDateBooked = (propId: string, dateStr: string) => {
    const targetTime = new Date(dateStr + 'T00:00:00').getTime();
    const propRes = getPropertyReservations(propId);

    for (const res of propRes) {
      const inTime = new Date(res.check_in + 'T00:00:00').getTime();
      const outTime = new Date(res.check_out + 'T00:00:00').getTime();
      if (targetTime >= inTime && targetTime < outTime) {
        return true;
      }
    }
    return false;
  };

  useEffect(() => {
    if (selectedProperty && checkIn && checkOut) {
      const start = new Date(checkIn + 'T00:00:00');
      const end = new Date(checkOut + 'T00:00:00');
      const diffTime = end.getTime() - start.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > 0) {
        setNightsCount(diffDays);
        const nightlyTotal = diffDays * (Number(selectedProperty.price) || 0);
        const cleaning = Number(selectedProperty.cleaning_fee) || 0;
        setTotalPrice(nightlyTotal + cleaning);
      } else {
        setNightsCount(0);
        setTotalPrice(0);
      }
    } else {
      setNightsCount(0);
      setTotalPrice(0);
    }
  }, [checkIn, checkOut, selectedProperty]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleOpenBookingModal = (property: Property) => {
    setSelectedProperty(property);
    setGuestName('');
    setGuestEmail('');
    setCheckIn(null);
    setCheckOut(null);
    setTotalPrice(0);
    setNightsCount(0);
    setCurrentMonthDate(new Date());
  };

  const handleDayClick = (dateStr: string) => {
    if (!selectedProperty) return;

    if (isDateBooked(selectedProperty.id, dateStr)) {
      showToast('Esta data já está ocupada.', 'error');
      return;
    }

    if (!checkIn || (checkIn && checkOut)) {
      setCheckIn(dateStr);
      setCheckOut(null);
    } else if (checkIn && !checkOut) {
      if (dateStr <= checkIn) {
        setCheckIn(dateStr);
        setCheckOut(null);
      } else {
        let hasConflictInBetween = false;
        const current = new Date(checkIn + 'T00:00:00');
        const end = new Date(dateStr + 'T00:00:00');

        while (current < end) {
          current.setDate(current.getDate() + 1);
          const tempStr = current.toISOString().split('T')[0];
          if (isDateBooked(selectedProperty.id, tempStr)) {
            hasConflictInBetween = true;
            break;
          }
        }

        if (hasConflictInBetween) {
          showToast('O intervalo selecionado contém datas já ocupadas.', 'error');
          setCheckIn(dateStr);
          setCheckOut(null);
        } else {
          setCheckOut(dateStr);
        }
      }
    }
  };

  const handleConfirmReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProperty || !checkIn || !checkOut) {
      showToast('Selecione o período de check-in e check-out no calendário.', 'error');
      return;
    }

    try {
      const newReservation = {
        property_id: selectedProperty.id,
        guest_name: guestName,
        guest_email: guestEmail,
        check_in: checkIn,
        check_out: checkOut,
        total_price: totalPrice,
        status: 'Confirmada'
      };

      const { error } = await supabase.from('reservations').insert([newReservation]);
      if (error) throw error;

      showToast(`Reserva confirmada com sucesso para ${selectedProperty.title}!`, 'success');
      setSelectedProperty(null);
      fetchMarketplaceData();
    } catch (err: any) {
      console.error('Erro ao salvar reserva:', err);
      showToast('Erro ao realizar reserva. Tente novamente.', 'error');
    }
  };

  const renderCalendarDays = () => {
    if (!selectedProperty) return null;

    const year = currentMonthDate.getFullYear();
    const month = currentMonthDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const daysArray = [];

    for (let i = 0; i < firstDayOfMonth; i++) {
      daysArray.push(<div key={`empty-${i}`} className="h-9 w-9"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const monthStr = String(month + 1).padStart(2, '0');
      const dayStr = String(day).padStart(2, '0');
      const dateStr = `${year}-${monthStr}-${dayStr}`;

      const booked = isDateBooked(selectedProperty.id, dateStr);
      const isCheckIn = checkIn === dateStr;
      const isCheckOut = checkOut === dateStr;
      
      let isInBetween = false;
      if (checkIn && checkOut) {
        isInBetween = dateStr > checkIn && dateStr < checkOut;
      }

      const todayStr = new Date().toISOString().split('T')[0];
      const isPast = dateStr < todayStr;

      let btnStyles = "h-9 w-9 rounded-xl text-xs font-bold flex items-center justify-center transition-all ";

      if (booked || isPast) {
        btnStyles += "bg-rose-100 text-rose-600 line-through cursor-not-allowed border border-rose-200";
      } else if (isCheckIn || isCheckOut) {
        btnStyles += "bg-teal-600 text-white shadow-md scale-105";
      } else if (isInBetween) {
        btnStyles += "bg-teal-100 text-teal-800 rounded-none";
      } else {
        btnStyles += "bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-100";
      }

      daysArray.push(
        <button
          key={dateStr}
          type="button"
          disabled={booked || isPast}
          onClick={() => handleDayClick(dateStr)}
          className={btnStyles}
        >
          {day}
        </button>
      );
    }

    return daysArray;
  };

  const nextMonth = () => {
    setCurrentMonthDate(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentMonthDate(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() - 1, 1));
  };

  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

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

      {/* Banner */}
      <div className="bg-gradient-to-r from-teal-800 to-teal-900 p-8 rounded-3xl text-white shadow-xl flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <span className="bg-teal-700/80 text-teal-100 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            Aluguel por Temporada
          </span>
          <h1 className="text-3xl font-extrabold mt-2">Encontre seu próximo destino</h1>
          <p className="text-teal-100 text-sm mt-1">Explore os melhores imóveis selecionados e reserve com total segurança.</p>
        </div>
        <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/20 text-center">
          <span className="block text-2xl font-extrabold">{filteredProperties.length}</span>
          <span className="text-xs text-teal-200 uppercase font-bold tracking-wider">Imóveis Encontrados</span>
        </div>
      </div>

      {/* FILTROS DE BUSCA AVANÇADOS */}
      <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2 text-slate-800 font-extrabold text-sm">
            <SlidersHorizontal className="w-4 h-4 text-teal-600" />
            <span>Filtros de Busca Avançados</span>
          </div>
          <button 
            onClick={handleResetFilters}
            className="text-xs text-teal-600 hover:text-teal-700 font-bold"
          >
            Limpar Filtros
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          {/* Busca por Nome */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-600">Pesquisar</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Nome do imóvel..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-600"
              />
            </div>
          </div>

          {/* Filtro por Cidade Dinâmica */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-600">Cidade</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <select
                value={selectedCity}
                onChange={e => setSelectedCity(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-600 appearance-none bg-white"
              >
                <option value="">Todas as cidades</option>
                {availableCities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Filtro por Hóspedes */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-600">Mín. Hóspedes</label>
            <div className="relative">
              <Users className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input 
                type="number" 
                min="0"
                placeholder="Qtd. hóspedes" 
                value={guestCount === 0 ? '' : guestCount}
                onChange={e => setGuestCount(Number(e.target.value))}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-600"
              />
            </div>
          </div>

          {/* Filtro por Preço Máximo */}
          <div className="space-y-1.5">
            <div className="flex justify-between font-bold text-slate-600">
              <span>Preço Máximo</span>
              <span className="text-teal-700">R$ {maxPrice}</span>
            </div>
            <div className="pt-2">
              <input 
                type="range" 
                min="100" 
                max="5000" 
                step="50"
                value={maxPrice}
                onChange={e => setMaxPrice(Number(e.target.value))}
                className="w-full accent-teal-600 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Imóveis Filtrados */}
      {loading ? (
        <div className="text-center py-16 text-slate-400 font-medium">A carregar imóveis disponíveis...</div>
      ) : filteredProperties.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm space-y-3">
          <Building2 className="w-12 h-12 text-teal-600 mx-auto" />
          <h3 className="text-lg font-bold text-slate-800">Nenhum imóvel corresponde aos filtros selecionados</h3>
          <button 
            onClick={handleResetFilters}
            className="bg-teal-600 text-white px-4 py-2 rounded-xl text-xs font-bold"
          >
            Repor Filtros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map((prop) => (
            <div key={prop.id} className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition flex flex-col justify-between">
              <div>
                <div className="relative h-56 bg-slate-100">
                  <img 
                    src={prop.images?.[0] || 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688'} 
                    alt={prop.title} 
                    className="w-full h-full object-cover" 
                  />
                  <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-slate-800 shadow-sm">
                    {prop.property_type || 'Imóvel'}
                  </span>
                </div>

                <div className="p-6 space-y-3">
                  <h3 className="text-lg font-bold text-slate-800 line-clamp-1">{prop.title}</h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" /> {prop.city} - {prop.state}
                  </p>
                  <div className="flex items-center gap-4 text-xs font-semibold text-slate-600 pt-2 border-t border-slate-50">
                    <span>👥 Até {prop.max_guests || 4} hóspedes</span>
                    <span>•</span>
                    <span>🛏️ {prop.bedrooms || 1} quartos</span>
                  </div>
                </div>
              </div>

              <div className="p-6 pt-0 flex items-center justify-between border-t border-slate-50 mt-4">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Diária a partir de</span>
                  <span className="text-xl font-extrabold text-teal-700">R$ {Number(prop.price).toFixed(2)}</span>
                </div>
                <button
                  onClick={() => handleOpenBookingModal(prop)}
                  className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-2xl font-bold transition shadow-md text-xs"
                >
                  Reservar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL DE RESERVA COM CALENDÁRIO VISUAL INTEGRADO */}
      {selectedProperty && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative my-8 space-y-5">
            
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-teal-600 uppercase">Reserva Direta</span>
                <h3 className="text-lg font-extrabold text-slate-800 mt-0.5">{selectedProperty.title}</h3>
                <p className="text-xs text-slate-500">{selectedProperty.city} - {selectedProperty.state}</p>
              </div>
              <button onClick={() => setSelectedProperty(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmReservation} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Seu Nome Completo</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Ex: Ana Souza" 
                  value={guestName} 
                  onChange={(e) => setGuestName(e.target.value)} 
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500" 
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Seu E-mail de Contato</label>
                <input 
                  type="email" 
                  required 
                  placeholder="ana@email.com" 
                  value={guestEmail} 
                  onChange={(e) => setGuestEmail(e.target.value)} 
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500" 
                />
              </div>

              {/* CALENDÁRIO VISUAL INTERATIVO */}
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-extrabold text-slate-800">
                    {monthNames[currentMonthDate.getMonth()]} {currentMonthDate.getFullYear()}
                  </span>
                  <div className="flex gap-1">
                    <button type="button" onClick={prevMonth} className="p-1.5 hover:bg-white rounded-lg text-slate-600 shadow-sm transition">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={nextMonth} className="p-1.5 hover:bg-white rounded-lg text-slate-600 shadow-sm transition">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 uppercase">
                  <span>Dom</span><span>Seg</span><span>Ter</span><span>Qua</span><span>Qui</span><span>Sex</span><span>Sáb</span>
                </div>

                <div className="grid grid-cols-7 gap-1 justify-items-center">
                  {renderCalendarDays()}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-[10px] text-slate-500 font-medium">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-200 inline-block"></span> Ocupado (Vermelho)</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-teal-600 inline-block"></span> Selecionado</span>
                </div>
              </div>

              {/* Status das Datas Escolhidas */}
              <div className="bg-teal-50/60 border border-teal-100 p-3 rounded-2xl flex justify-between items-center text-xs">
                <div>
                  <span className="block text-[10px] font-bold text-teal-800 uppercase">Check-in</span>
                  <span className="font-bold text-slate-700">{checkIn ? checkIn.split('-').reverse().join('/') : 'Selecione no calendário'}</span>
                </div>
                <div className="text-teal-400">➔</div>
                <div className="text-right">
                  <span className="block text-[10px] font-bold text-teal-800 uppercase">Check-out</span>
                  <span className="font-bold text-slate-700">{checkOut ? checkOut.split('-').reverse().join('/') : 'Selecione no calendário'}</span>
                </div>
              </div>

              {/* Resumo Financeiro */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Diária ({nightsCount} noites):</span>
                  <span className="font-semibold">R$ {(nightsCount * Number(selectedProperty.price)).toFixed(2)}</span>
                </div>
                {selectedProperty.cleaning_fee > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Taxa de limpeza:</span>
                    <span className="font-semibold">R$ {Number(selectedProperty.cleaning_fee).toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t border-slate-200 pt-1.5 flex justify-between items-center text-slate-800 font-extrabold text-sm">
                  <span>Total da Estadia:</span>
                  <span className="text-teal-700 text-base">R$ {totalPrice.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button 
                  type="button" 
                  onClick={() => setSelectedProperty(null)} 
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-2xl font-bold text-xs transition"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={!checkIn || !checkOut}
                  className={`flex-1 py-2.5 rounded-2xl font-bold text-xs shadow-md transition ${
                    !checkIn || !checkOut 
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
                      : 'bg-teal-600 hover:bg-teal-700 text-white'
                  }`}
                >
                  Confirmar Reserva
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};