import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Calendar as CalendarIcon, Building2, ChevronLeft, ChevronRight, Users } from 'lucide-react';

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
}

export const OccupancyCalendar: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<string>('');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchPropertiesAndBookings();
  }, []);

  const fetchPropertiesAndBookings = async () => {
    try {
      setLoading(true);
      const [propRes, bookRes] = await Promise.all([
        supabase.from('properties').select('id, title, city'),
        supabase.from('bookings').select('id, property_id, check_in, check_out, guest_name')
      ]);

      if (propRes.data && propRes.data.length > 0) {
        setProperties(propRes.data);
        setSelectedProperty(propRes.data[0].id);
      }
      if (bookRes.data) {
        setBookings(bookRes.data);
      }
    } catch (err) {
      console.error('Erro ao carregar calendário de ocupação:', err);
    } finally {
      setLoading(false);
    }
  };

  // Funções de navegação do mês
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

  // Dias do mês atual
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  // Filtrar reservas do imóvel selecionado
  const propertyBookings = bookings.filter(b => b.property_id === selectedProperty);

  // Verificar se um dia específico está ocupado
  const getBookingForDay = (day: number) => {
    const targetDate = new Date(year, month, day);
    targetDate.setHours(0, 0, 0, 0);

    return propertyBookings.find(b => {
      const checkIn = new Date(b.check_in);
      const checkOut = new Date(b.check_out);
      checkIn.setHours(0, 0, 0, 0);
      checkOut.setHours(0, 0, 0, 0);
      return targetDate >= checkIn && targetDate < checkOut;
    });
  };

  if (loading) {
    return <div className="text-center py-12 text-slate-400">A carregar o calendário de ocupação...</div>;
  }

  return (
    <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-6">
      
      {/* Cabeçalho e Seleção de Imóvel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-6 gap-4">
        <div>
          <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            Gestão de Ocupação
          </span>
          <h3 className="text-2xl font-extrabold text-slate-800 mt-2">Calendário de Reservas</h3>
          <p className="text-xs text-slate-500 mt-1">Visualize os dias bloqueados e disponíveis por imóvel em tempo real.</p>
        </div>

        <div className="flex items-center gap-3">
          <Building2 className="w-5 h-5 text-slate-400" />
          <select 
            value={selectedProperty} 
            onChange={(e) => setSelectedProperty(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            {properties.map(p => (
              <option key={p.id} value={p.id}>
                {p.title} ({p.city})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Controles de Mês */}
      <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100">
        <button 
          onClick={prevMonth}
          className="p-2 hover:bg-white rounded-xl text-slate-600 shadow-xs transition flex items-center gap-1 text-xs font-bold"
        >
          <ChevronLeft className="w-4 h-4" /> Mês Anterior
        </button>
        <h4 className="text-base font-extrabold text-slate-800 capitalize">{monthName}</h4>
        <button 
          onClick={nextMonth}
          className="p-2 hover:bg-white rounded-xl text-slate-600 shadow-xs transition flex items-center gap-1 text-xs font-bold"
        >
          Próximo Mês <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Grelha do Calendário */}
      <div className="grid grid-cols-7 gap-2 text-center">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
          <div key={d} className="text-xs font-bold text-slate-400 uppercase py-2">
            {d}
          </div>
        ))}

        {/* Espaços em branco antes do primeiro dia do mês */}
        {Array.from({ length: firstDayIndex }).map((_, index) => (
          <div key={`empty-${index}`} className="h-24 bg-slate-50/30 rounded-2xl border border-transparent"></div>
        ))}

        {/* Dias do mês */}
        {Array.from({ length: totalDays }).map((_, index) => {
          const day = index + 1;
          const booking = getBookingForDay(day);
          const isOccupied = Boolean(booking);

          return (
            <div 
              key={day} 
              className={`h-24 p-2 rounded-2xl border flex flex-col justify-between transition ${
                isOccupied 
                  ? 'bg-rose-50 border-rose-200 text-rose-900 shadow-xs' 
                  : 'bg-white border-slate-100 text-slate-700 hover:border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold ${isOccupied ? 'text-rose-700' : 'text-slate-600'}`}>{day}</span>
                <span className={`w-2 h-2 rounded-full ${isOccupied ? 'bg-rose-500' : 'bg-emerald-500'}`}></span>
              </div>

              {isOccupied ? (
                <div className="text-left overflow-hidden">
                  <p className="text-[10px] font-extrabold truncate text-rose-900 flex items-center gap-1">
                    <Users className="w-3 h-3 text-rose-600 inline" /> {booking?.guest_name || 'Ocupado'}
                  </p>
                  <span className="inline-block mt-1 bg-rose-200/60 text-rose-800 text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                    Reservado
                  </span>
                </div>
              ) : (
                <div className="text-left">
                  <span className="text-[9px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                    Disponível
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
};