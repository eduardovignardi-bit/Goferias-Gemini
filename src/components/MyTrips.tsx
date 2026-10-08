import { useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  LoaderCircle,
  MapPin,
  Plane,
  XCircle,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

type ReservationProperty = {
  title: string | null;
  city: string | null;
  state: string | null;
  images: string[] | null;
};

type Reservation = {
  id: string;
  property_id: string;
  guest_name: string | null;
  guest_email: string;
  check_in: string;
  check_out: string;
  total_price: number | string | null;
  status: string;
  Properties: ReservationProperty | ReservationProperty[] | null;
};

type TripsTab = 'upcoming' | 'history';

const fallbackImage = 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1000&q=85';

function getRelatedProperty(reservation: Reservation) {
  return Array.isArray(reservation.Properties)
    ? reservation.Properties[0] ?? null
    : reservation.Properties;
}

function normalizeStatus(status: string) {
  return status.trim().toLocaleLowerCase('pt-BR');
}

function getStatusStyle(status: string) {
  switch (normalizeStatus(status)) {
    case 'confirmada':
    case 'confirmado':
    case 'confirmed':
      return {
        label: 'Confirmada',
        className: 'bg-emerald-50 text-emerald-800 ring-emerald-600/20',
        Icon: CheckCircle2,
      };
    case 'cancelada':
    case 'cancelado':
    case 'cancelled':
    case 'canceled':
      return {
        label: 'Cancelada',
        className: 'bg-rose-50 text-rose-800 ring-rose-600/20',
        Icon: XCircle,
      };
    default:
      return {
        label: 'Pendente',
        className: 'bg-amber-50 text-amber-800 ring-amber-600/20',
        Icon: Clock,
      };
  }
}

function formatDate(date: string) {
  const [year, month, day] = date.split('-').map(Number);
  return new Intl.DateTimeFormat('pt-BR').format(new Date(year, month - 1, day));
}

function formatCurrency(value: number | string | null) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value) || 0);
}

export function MyTrips() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [activeTab, setActiveTab] = useState<TripsTab>('upcoming');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    let isCurrent = true;

    const loadReservations = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        if (!isCurrent) return;

        const user = authData.user;
        if (!user) {
          setIsAuthenticated(false);
          setReservations([]);
          return;
        }

        setIsAuthenticated(true);
        if (!user.email) {
          setError('Sua conta não possui um e-mail associado para localizar as reservas.');
          return;
        }

        const { data, error: reservationsError } = await supabase
          .from('reservations')
          .select('*, Properties(title, city, state, images)')
          .eq('guest_email', user.email)
          .order('check_in', { ascending: true });

        if (reservationsError) throw reservationsError;
        if (!isCurrent) return;

        setReservations((data ?? []) as Reservation[]);
      } catch (loadError) {
        if (!isCurrent) return;
        console.error('Erro ao carregar viagens:', loadError);
        setError('Não foi possível carregar suas viagens. Tente novamente mais tarde.');
      } finally {
        if (isCurrent) setLoading(false);
      }
    };

    void loadReservations();
    return () => {
      isCurrent = false;
    };
  }, []);

  const { upcomingTrips, historyTrips } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayValue = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    return reservations.reduce<{ upcomingTrips: Reservation[]; historyTrips: Reservation[] }>(
      (groups, reservation) => {
        const status = normalizeStatus(reservation.status);
        const isCancelled = ['cancelada', 'cancelado', 'cancelled', 'canceled'].includes(status);
        const isPast = reservation.check_in < todayValue;
        const isUpcomingStatus = ['confirmada', 'confirmado', 'confirmed', 'pendente', 'pending'].includes(status);

        if (isCancelled || isPast) {
          groups.historyTrips.push(reservation);
        } else if (isUpcomingStatus) {
          groups.upcomingTrips.push(reservation);
        } else {
          groups.historyTrips.push(reservation);
        }

        return groups;
      },
      { upcomingTrips: [], historyTrips: [] },
    );
  }, [reservations]);

  const visibleTrips = activeTab === 'upcoming' ? upcomingTrips : historyTrips;

  if (isAuthenticated === false) {
    return (
      <section className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
          <Plane className="size-7" />
        </div>
        <h1 className="mt-5 text-2xl font-bold text-slate-900">Suas viagens começam aqui</h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
          Entre na sua conta para consultar e gerenciar suas reservas no GoFérias.
        </p>
      </section>
    );
  }

  return (
    <main className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">GoFérias · área do hóspede</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Minhas viagens</h1>
          <p className="mt-2 text-sm text-slate-600">Acompanhe suas próximas estadias e consulte seu histórico.</p>
        </div>
        <div className="flex size-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
          <Plane className="size-6" />
        </div>
      </header>

      <div role="tablist" aria-label="Seções de viagens" className="flex gap-1 border-b border-slate-200">
        {([
          { id: 'upcoming', label: 'Próximas Viagens', count: upcomingTrips.length },
          { id: 'history', label: 'Histórico', count: historyTrips.length },
        ] as const).map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${
              activeTab === tab.id
                ? 'border-teal-700 text-teal-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
            <span className={`rounded-full px-2 py-0.5 text-xs ${
              activeTab === tab.id ? 'bg-teal-50 text-teal-800' : 'bg-slate-100 text-slate-600'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      <section role="tabpanel" aria-label={activeTab === 'upcoming' ? 'Próximas Viagens' : 'Histórico'}>
        {loading ? (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-16 text-sm text-slate-500">
            <LoaderCircle className="size-4 animate-spin" /> Carregando suas viagens...
          </div>
        ) : error ? (
          <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800">
            {error}
          </div>
        ) : visibleTrips.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white px-6 py-14 text-center">
            <Calendar className="mx-auto size-9 text-slate-300" />
            <h2 className="mt-3 font-semibold text-slate-900">
              {activeTab === 'upcoming' ? 'Nenhuma próxima viagem' : 'Seu histórico está vazio'}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {activeTab === 'upcoming'
                ? 'Quando você fizer uma reserva, ela aparecerá aqui.'
                : 'As viagens concluídas ou canceladas aparecerão nesta seção.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {visibleTrips.map((reservation) => {
              const property = getRelatedProperty(reservation);
              const status = getStatusStyle(reservation.status);
              const StatusIcon = status.Icon;
              const image = property?.images?.find((item) => typeof item === 'string' && item.length > 0) ?? fallbackImage;

              return (
                <article
                  key={reservation.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-slate-300 hover:shadow-md"
                >
                  <div className="flex flex-col sm:flex-row">
                    <img
                      src={image}
                      alt={property?.title || 'Imagem do imóvel'}
                      loading="lazy"
                      className="h-52 w-full object-cover sm:h-auto sm:w-48"
                    />
                    <div className="flex min-w-0 flex-1 flex-col justify-between gap-4 p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h2 className="truncate text-lg font-bold text-slate-900">
                            {property?.title || 'Imóvel da reserva'}
                          </h2>
                          <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                            <MapPin className="size-4 shrink-0 text-teal-700" />
                            <span className="truncate">
                              {[property?.city, property?.state].filter(Boolean).join(', ') || 'Localização indisponível'}
                            </span>
                          </p>
                        </div>
                        <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${status.className}`}>
                          <StatusIcon className="size-3.5" />
                          {status.label}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-x-5 gap-y-3 border-t border-slate-100 pt-4">
                        <div className="flex items-start gap-2 text-sm">
                          <Calendar className="mt-0.5 size-4 text-teal-700" />
                          <div>
                            <span className="block text-[11px] font-medium uppercase tracking-wide text-slate-400">Check-in</span>
                            <span className="font-semibold text-slate-700">{formatDate(reservation.check_in)}</span>
                          </div>
                        </div>
                        <div className="flex items-start gap-2 text-sm">
                          <Calendar className="mt-0.5 size-4 text-slate-400" />
                          <div>
                            <span className="block text-[11px] font-medium uppercase tracking-wide text-slate-400">Check-out</span>
                            <span className="font-semibold text-slate-700">{formatDate(reservation.check_out)}</span>
                          </div>
                        </div>
                        <div className="flex items-start gap-2 text-sm">
                          <DollarSign className="mt-0.5 size-4 text-teal-700" />
                          <div>
                            <span className="block text-[11px] font-medium uppercase tracking-wide text-slate-400">Valor total</span>
                            <span className="font-bold text-slate-900">{formatCurrency(reservation.total_price)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}