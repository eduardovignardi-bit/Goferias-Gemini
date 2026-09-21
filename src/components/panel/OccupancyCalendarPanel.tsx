import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, CheckCircle2, AlertCircle, Home } from 'lucide-react';

interface Property {
  id: string;
  title: string;
  city: string;
}

interface Booking {
  id: string;
  property_id: string;
  check_in: string;
  check_out: string;
  guest_name: string;
  status: string;
}

export const OccupancyCalendarPanel: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    if (selectedPropertyId) {
      fetchBookings(selectedPropertyId);
    }
  }, [selectedPropertyId, currentDate]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('properties')
        .select('id, title, city')
        .order('title', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        setProperties(data);
        setSelectedPropertyId(data[0].id);
      }
    } catch (err) {
      console.error('Erro ao carregar imóveis:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async (propertyId: string) => {
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      
      // Intervalo do mês atual para busca eficiente
      const firstDay = new Date(year, month, 1).toISOString();
      const lastDay = new Date(year, month + 1, 0).toISOString();

      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('property_id', propertyId);

      if (error) throw error;
      setBookings(data || []);
    } catch (err) {
      console.error('Erro ao carregar reservas:', err);
    }
  };

  // Funções de navegação do mês
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  // Lógica de montagem do calendário
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  // Verificar se um dia específico está ocupado por alguma reserva
  const getBookingForDay = (day: number) => {
    const targetDate = new Date(year, month, day);
    targetDate.setHours(0, 0, 0, 0);

    return bookings.find(b => {
      const checkIn = new Date(b.check_in);
      const checkOut = new Date(b.check_out);
      checkIn.setHours(0, 0, 0, 0);
      checkOut.setHours(0, 0, 0, 0);

      return targetDate >= checkIn && targetDate <= checkOut;
    });
  };

  if (loading) {
    return <div className="text-center py-12 text-slate-400">A carregar calendário de ocupação...</div>;
  }

  return (
    <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-6">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-6 gap-4">
        <div>
          <span className="bg-teal-50 text-teal-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            Disponibilidade
          </span>
          <h3 className="text-2xl font-extrabold text-slate-800 mt-2">Calendário de Ocupação</h3>
          <p className="text-xs text-slate-500 mt-1">Consulte as datas bloqueadas e gerencie a agenda dos imóveis.</p>
        </div>

        {/* Seletor de Imóvel */}
        <div className="w-full md:w-72">
          <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Selecionar Imóvel</label>
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
      </div>

      {/* Controlo do Mês */}
      <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100">
        <button
          onClick={prevMonth}
          className="p-2 hover:bg-white rounded-xl text-slate-600 transition shadow-sm"
          title="Mês Anterior"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        <h4 className="text-base font-extrabold text-slate-800">
          {monthNames[month]} de {year}
        </h4>

        <button
          onClick={nextMonth}
          className="p-2 hover:bg-white rounded-xl text-slate-600 transition shadow-sm"
          title="Próximo Mês"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Grid do Calendário */}
      <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white">
        {/* Cabeçalho dos Dias da Semana */}
        <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-100 text-center text-xs font-bold text-slate-500 uppercase py-3">
          <div>Dom</div>
          <div>Seg</div>
          <div>Ter</div>
          <div>Qua</div>
          <div>Qui</div>
          <div>Sex</div>
          <div>Sáb</div>
        </div>

        {/* Dias do Mês */}
        <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100">
          {/* Espaços vazios para o início do mês */}
          {Array.from({ length: firstDayIndex }).map((_, index) => (
            <div key={`empty-${index}`} className="min-h-[100px] bg-slate-50/30 p-2"></div>
          ))}

          {/* Dias reais */}
          {Array.from({ length: totalDays }).map((_, index) => {
            const day = index + 1;
            const booking = getBookingForDay(day);
            const isToday = 
              day === new Date().getDate() && 
              month === new Date().getMonth() && 
              year === new Date().getFullYear();

            return (
              <div 
                key={`day-${day}`} 
                className={`min-h-[100px] p-2 flex flex-col justify-between transition relative ${
                  booking ? 'bg-amber-50/60 border-amber-200' : 'hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${
                    isToday ? 'bg-teal-600 text-white' : 'text-slate-700'
                  }`}>
                    {day}
                  </span>
                  {booking && (
                    <span className="w-2 h-2 rounded-full bg-amber-500" title="Data Reservada"></span>
                  )}
                </div>

                {booking ? (
                  <div className="mt-2 bg-amber-100/80 border border-amber-200 text-amber-900 p-1.5 rounded-xl text-[10px] font-semibold leading-tight overflow-hidden">
                    <p className="truncate font-bold">🔒 {booking.guest_name}</p>
                    <p className="text-[9px] text-amber-700 mt-0.5">Reservado</p>
                  </div>
                ) : (
                  <div className="text-[10px] text-emerald-600 font-medium mt-auto text-right">
                    Disponível
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legenda */}
      <div className="flex items-center gap-6 pt-2 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
          <span>Disponível</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-amber-500"></span>
          <span>Ocupado / Reservado</span>
        </div>
      </div>
    </div>
  );
};