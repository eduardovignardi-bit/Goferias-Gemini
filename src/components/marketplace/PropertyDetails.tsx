import { useEffect, useState, type FormEvent } from 'react';
import { ArrowLeft, Bath, BedDouble, CalendarDays, Check, ChevronLeft, ChevronRight, LoaderCircle, MapPin, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';

type PropertyDetailsRecord = {
  id: string;
  user_id: string | null;
  title: string;
  description: string | null;
  property_type: string | null;
  full_address: string | null;
  neighborhood: string | null;
  city: string;
  state: string;
  quartos: number;
  banheiros: number;
  max_guests: number;
  price: number;
  cleaning_fee: number | null;
  images: string[] | null;
};

type ReservationRecord = {
  check_in: string;
  check_out: string;
  status: string;
};

type Guest = {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
} | null;

interface PropertyDetailsProps {
  propertyId: string;
  guest: Guest;
  onBack: () => void;
  onRequireLogin: () => void;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function calculateNights(checkIn: string, checkOut: string) {
  if (!checkIn || !checkOut) return 0;
  const start = new Date(`${checkIn}T12:00:00`).getTime();
  const end = new Date(`${checkOut}T12:00:00`).getTime();
  return Math.max(0, Math.round((end - start) / 86_400_000));
}

export function PropertyDetails({ propertyId, guest, onBack, onRequireLogin }: PropertyDetailsProps) {
  const [property, setProperty] = useState<PropertyDetailsRecord | null>(null);
  const [reservations, setReservations] = useState<ReservationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [imageIndex, setImageIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;

    const loadProperty = async () => {
      setLoading(true);
      setLoadError(null);
      setAvailabilityError(null);
      setProperty(null);
      setReservations([]);

      const { data: propertyData, error: propertyError } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .maybeSingle();

      if (!isCurrent) return;
      if (propertyError || !propertyData) {
        setLoadError('Não foi possível encontrar este imóvel.');
        setLoading(false);
        return;
      }

      setProperty(propertyData as PropertyDetailsRecord);

      const { data: reservationData, error: reservationError } = await supabase
        .from('reservations')
        .select('check_in, check_out, status')
        .eq('property_id', propertyId);

      if (!isCurrent) return;
      if (reservationError) {
        setAvailabilityError('Não foi possível confirmar a disponibilidade agora. Tente novamente em instantes.');
      } else {
        setReservations(reservationData || []);
      }
      setLoading(false);
    };

    void loadProperty();
    return () => {
      isCurrent = false;
    };
  }, [propertyId]);

  const images = property?.images?.filter((image) => typeof image === 'string' && image.length > 0) || [];
  const nights = calculateNights(checkIn, checkOut);
  const nightlyPrice = Number(property?.price) || 0;
  const cleaningFee = Number(property?.cleaning_fee) || 0;
  const totalPrice = nights > 0 ? nights * nightlyPrice + cleaningFee : 0;
  const dateConflict = Boolean(checkIn && checkOut && reservations.some((reservation) => {
    const activeReservation = ['confirmed', 'confirmada', 'confirmado'].includes(
      reservation.status.toLocaleLowerCase('pt-BR'),
    );
    return activeReservation && reservation.check_in < checkOut && reservation.check_out > checkIn;
  }));
  const location = property
    ? [property.full_address, property.neighborhood, property.city, property.state].filter(Boolean).join(', ')
    : '';
  const today = new Date().toISOString().slice(0, 10);
  const guestName = String(
    guest?.user_metadata?.full_name || guest?.user_metadata?.name || guest?.email?.split('@')[0] || '',
  );

  const handleRequestReservation = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);
    if (!guest) {
      onRequireLogin();
      return;
    }
    if (!property || !checkIn || !checkOut || nights < 1) {
      setSubmitError('Selecione as datas de entrada e saída.');
      return;
    }
    if (availabilityError) {
      setSubmitError(availabilityError);
      return;
    }
    if (dateConflict) {
      setSubmitError('Este imóvel já está reservado para o período escolhido.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('reservations').insert({
        property_id: property.id,
        guest_id: guest.id,
        guest_name: guestName,
        guest_email: guest.email || '',
        check_in: checkIn,
        check_out: checkOut,
        total_price: totalPrice,
        status: 'pendente',
      });
      if (error) throw error;
      setSuccess(true);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Não foi possível solicitar a reserva.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="py-24 text-center text-sm text-slate-500">Carregando imóvel...</div>;
  }

  if (!property) {
    return (
      <section className="mx-auto max-w-2xl space-y-4 rounded-xl border border-slate-200 bg-white p-8 text-center">
        <p role="alert" className="text-sm text-slate-700">{loadError || 'Imóvel não encontrado.'}</p>
        <button type="button" onClick={onBack} className="rounded-lg bg-teal-800 px-4 py-2 text-sm font-semibold text-white">
          Voltar ao marketplace
        </button>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-teal-800">
        <ArrowLeft className="size-4" /> Voltar aos imóveis
      </button>

      <section className="relative overflow-hidden rounded-xl bg-slate-100">
        {images.length > 0 ? (
          <div className={`grid h-[280px] gap-2 sm:h-[420px] ${images.length === 1 ? 'grid-cols-1' : 'sm:grid-cols-4'}`}>
            <img
              src={images[imageIndex % images.length]}
              alt={property.title}
              className={`size-full min-h-0 object-cover ${images.length > 1 ? 'col-span-2 sm:row-span-2' : ''}`}
            />
            {images.length > 1 && images.slice(1, 3).map((image, index) => (
              <img
                key={`${image}-${index}`}
                src={image}
                alt={`${property.title} ${index + 2}`}
                className={`hidden size-full min-h-0 object-cover sm:block ${images.length === 2 ? 'sm:col-span-2 sm:row-span-2' : ''}`}
              />
            ))}
            {images.length > 1 && (
              <div className="absolute bottom-3 right-3 flex items-center gap-2 rounded-lg bg-slate-950/75 p-1 text-white">
                <button
                  type="button"
                  aria-label="Foto anterior"
                  onClick={() => setImageIndex((current) => (current - 1 + images.length) % images.length)}
                  className="flex size-8 items-center justify-center rounded-md hover:bg-white/15"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <span className="min-w-12 text-center text-xs">{(imageIndex % images.length) + 1} / {images.length}</span>
                <button
                  type="button"
                  aria-label="Próxima foto"
                  onClick={() => setImageIndex((current) => (current + 1) % images.length)}
                  className="flex size-8 items-center justify-center rounded-md hover:bg-white/15"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex h-[280px] items-center justify-center text-sm text-slate-500 sm:h-[420px]">Fotos deste imóvel ainda não disponíveis</div>
        )}
      </section>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-6">
          <div className="space-y-3 border-b border-slate-200 pb-6">
            <p className="text-xs font-semibold uppercase text-teal-800">{property.property_type || 'Aluguel por temporada'}</p>
            <h1 className="text-3xl font-bold text-slate-950">{property.title}</h1>
            <p className="flex items-start gap-2 text-sm text-slate-600">
              <MapPin className="mt-0.5 size-4 shrink-0 text-teal-800" /> {location}
            </p>
            <div className="flex flex-wrap gap-5 pt-2 text-sm text-slate-700">
              <span className="inline-flex items-center gap-2"><BedDouble className="size-4 text-teal-800" /> {property.quartos} quartos</span>
              <span className="inline-flex items-center gap-2"><Bath className="size-4 text-teal-800" /> {property.banheiros} banheiros</span>
              <span className="inline-flex items-center gap-2"><Users className="size-4 text-teal-800" /> Até {property.max_guests} hóspedes</span>
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-slate-900">Sobre este imóvel</h2>
            <p className="whitespace-pre-line text-sm leading-7 text-slate-600">
              {property.description || `Hospede-se em ${property.title}, em ${property.neighborhood || property.city}. Consulte as datas disponíveis e solicite sua reserva.`}
            </p>
          </div>
        </section>

        <aside className="lg:sticky lg:top-24">
          <form onSubmit={handleRequestReservation} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-baseline justify-between gap-3 border-b border-slate-100 pb-4">
              <p className="text-xl font-bold text-slate-950">{formatCurrency(nightlyPrice)} <span className="text-sm font-normal text-slate-500">/ diária</span></p>
              <span className="text-xs text-slate-500">{property.max_guests} hóspedes</span>
            </div>

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-slate-700">Check-in</span>
              <span className="relative block">
                <CalendarDays className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input required type="date" min={today} value={checkIn} onChange={(event) => {
                  setCheckIn(event.target.value);
                  if (checkOut && event.target.value >= checkOut) setCheckOut('');
                }} className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100" />
              </span>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-slate-700">Check-out</span>
              <span className="relative block">
                <CalendarDays className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input required type="date" min={checkIn || today} value={checkOut} onChange={(event) => setCheckOut(event.target.value)} className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100" />
              </span>
            </label>

            {nights > 0 && (
              <div className="space-y-2 border-t border-slate-100 pt-4 text-sm">
                <div className="flex justify-between gap-3 text-slate-600">
                  <span>{formatCurrency(nightlyPrice)} × {nights} {nights === 1 ? 'noite' : 'noites'}</span>
                  <span>{formatCurrency(nightlyPrice * nights)}</span>
                </div>
                {cleaningFee > 0 && (
                  <div className="flex justify-between gap-3 text-slate-600">
                    <span>Taxa de limpeza</span><span>{formatCurrency(cleaningFee)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-slate-100 pt-3 font-bold text-slate-900">
                  <span>Total da estadia</span><span>{formatCurrency(totalPrice)}</span>
                </div>
              </div>
            )}

            {availabilityError && <p role="alert" className="text-xs text-amber-800">{availabilityError}</p>}
            {dateConflict && <p role="alert" className="text-xs text-rose-700">Este período já está reservado. Escolha outras datas.</p>}
            {submitError && <p role="alert" className="text-xs text-rose-700">{submitError}</p>}
            {success ? (
              <p role="status" className="flex items-start gap-2 rounded-lg bg-emerald-50 p-3 text-sm font-medium text-emerald-800">
                <Check className="mt-0.5 size-4 shrink-0" /> Solicitação enviada. O proprietário analisará sua reserva.
              </p>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting || Boolean(availabilityError) || dateConflict || nights < 1}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-800 px-4 py-3 text-sm font-semibold text-white transition hover:bg-teal-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting && <LoaderCircle className="size-4 animate-spin" />}
                {isSubmitting ? 'Enviando solicitação...' : guest ? 'Solicitar Reserva' : 'Entrar para solicitar'}
              </button>
            )}
            <p className="text-center text-xs text-slate-500">A reserva só é confirmada após aprovação do proprietário.</p>
          </form>
        </aside>
      </div>
    </div>
  );
}
