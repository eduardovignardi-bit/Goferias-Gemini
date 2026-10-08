import { useState } from 'react';
import { CalendarDays, Check, Clock3, X } from 'lucide-react';

type Reservation = {
  id: string;
  property_id: string;
  guest_name: string;
  guest_email: string;
  check_in: string;
  check_out: string;
  total_price: number;
  status: string;
  properties?: { title: string; city: string } | null;
};

type ReservationStatusTab = 'pending' | 'confirmed' | 'cancelled';

interface OwnerReservationsProps {
  reservations: Reservation[];
  updatingReservationId: string | null;
  onStatusChange: (reservationId: string, status: 'confirmed' | 'rejected') => void;
  onOpenReservation: (reservation: Reservation) => void;
}

function getStatusTab(status: string): ReservationStatusTab {
  const normalized = status.toLocaleLowerCase('pt-BR');
  if (['confirmed', 'confirmada', 'confirmado'].includes(normalized)) return 'confirmed';
  if (['rejected', 'recusada', 'recusado', 'cancelled', 'canceled', 'cancelada', 'cancelado'].includes(normalized)) return 'cancelled';
  return 'pending';
}

function getNightCount(checkIn: string, checkOut: string) {
  const start = new Date(`${checkIn}T12:00:00`).getTime();
  const end = new Date(`${checkOut}T12:00:00`).getTime();
  return Math.max(0, Math.round((end - start) / 86_400_000));
}

function formatDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR');
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

const tabs: Array<{ id: ReservationStatusTab; label: string }> = [
  { id: 'pending', label: 'Pendentes' },
  { id: 'confirmed', label: 'Confirmadas' },
  { id: 'cancelled', label: 'Canceladas' },
];

export function OwnerReservations({
  reservations,
  updatingReservationId,
  onStatusChange,
  onOpenReservation,
}: OwnerReservationsProps) {
  const [activeTab, setActiveTab] = useState<ReservationStatusTab>('pending');
  const visibleReservations = reservations.filter((reservation) => getStatusTab(reservation.status) === activeTab);
  const counts = {
    pending: reservations.filter((reservation) => getStatusTab(reservation.status) === 'pending').length,
    confirmed: reservations.filter((reservation) => getStatusTab(reservation.status) === 'confirmed').length,
    cancelled: reservations.filter((reservation) => getStatusTab(reservation.status) === 'cancelled').length,
  };

  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Solicitações de reserva</h2>
          <p className="mt-1 text-sm text-slate-500">Revise as datas e atualize o status das estadias.</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-800">
          <Clock3 className="size-3.5" /> {counts.pending} aguardando análise
        </span>
      </div>

      <div role="tablist" aria-label="Status das reservas" className="flex gap-1 overflow-x-auto border-b border-slate-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-semibold transition ${
              activeTab === tab.id
                ? 'border-teal-700 text-teal-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${activeTab === tab.id ? 'bg-teal-50 text-teal-800' : 'bg-slate-100 text-slate-600'}`}>
              {counts[tab.id]}
            </span>
          </button>
        ))}
      </div>

      <div role="tabpanel" className="space-y-3">
        {visibleReservations.length === 0 ? (
          <p className="rounded-lg bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
            {activeTab === 'pending' ? 'Não há solicitações pendentes.' : 'Nenhuma reserva nesta seção.'}
          </p>
        ) : visibleReservations.map((reservation) => {
          const nights = getNightCount(reservation.check_in, reservation.check_out);
          const isPending = activeTab === 'pending';
          const isUpdating = updatingReservationId === reservation.id;

          return (
            <article key={reservation.id} className="grid gap-4 rounded-lg border border-slate-200 p-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
              <button type="button" onClick={() => onOpenReservation(reservation)} className="min-w-0 text-left">
                <span className="font-semibold text-slate-900">{reservation.properties?.title || 'Imóvel'}</span>
                <span className="mt-1 block text-xs text-slate-500">
                  {reservation.properties?.city || 'Localização indisponível'} · {reservation.guest_name || reservation.guest_email}
                </span>
                <span className="mt-2 inline-flex flex-wrap items-center gap-1.5 text-xs text-slate-600">
                  <CalendarDays className="size-3.5 text-teal-700" />
                  {formatDate(reservation.check_in)} – {formatDate(reservation.check_out)}
                  <span className="text-slate-400">·</span>
                  {nights} {nights === 1 ? 'noite' : 'noites'}
                </span>
              </button>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 lg:border-0 lg:pt-0">
                <div>
                  <span className="block text-[11px] text-slate-500">Total da estadia</span>
                  <span className="font-bold text-slate-900">{formatCurrency(Number(reservation.total_price) || 0)}</span>
                </div>
                {isPending ? (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => onStatusChange(reservation.id, 'rejected')}
                      className="inline-flex items-center gap-1.5 rounded-md border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-50"
                    >
                      <X className="size-3.5" /> Recusar
                    </button>
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => onStatusChange(reservation.id, 'confirmed')}
                      className="inline-flex items-center gap-1.5 rounded-md bg-emerald-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-50"
                    >
                      <Check className="size-3.5" /> {isUpdating ? 'Salvando...' : 'Aprovar Reserva'}
                    </button>
                  </div>
                ) : (
                  <span className={`rounded-md px-2.5 py-1.5 text-xs font-semibold ${activeTab === 'confirmed' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>
                    {activeTab === 'confirmed' ? 'Confirmada' : 'Recusada'}
                  </span>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
