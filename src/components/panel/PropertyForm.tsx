import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Check, Home, ImagePlus, LoaderCircle, MapPin, Plus, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

type Property = {
  id: string;
  title: string;
  property_type: string;
  city: string;
  state: string;
  full_address: string;
  neighborhood: string;
  location: string;
  max_guests: number;
  bedrooms: number;
  bathrooms: number;
  latitude: number | null;
  longitude: number | null;
  price: number;
  cleaning_fee: number;
  images: string[];
  user_id: string;
};

interface PropertyFormProps {
  ownerId: string | null;
  onCreated: (property: Property) => void;
}

type PhotoPreview = {
  file: File;
  url: string;
};

const PHOTO_BUCKET = 'property-images';
const MAX_PHOTO_COUNT = 10;
const MAX_PHOTO_SIZE = 10 * 1024 * 1024;

const initialForm = {
  title: '',
  postalCode: '',
  fullAddress: '',
  city: '',
  neighborhood: '',
  state: 'SC',
  maxGuests: 4,
  bedrooms: 2,
  bathrooms: 1,
  price: 350,
  latitude: '',
  longitude: '',
};

export function PropertyForm({ ownerId, onCreated }: PropertyFormProps) {
  const [form, setForm] = useState(initialForm);
  const [photoPreviews, setPhotoPreviews] = useState<PhotoPreview[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLookingUpCep, setIsLookingUpCep] = useState(false);
  const [locationLookupMessage, setLocationLookupMessage] = useState('');
  const [feedback, setFeedback] = useState<{ message: string; success: boolean } | null>(null);
  const photoPreviewsRef = useRef<PhotoPreview[]>([]);
  const cepLookupSequenceRef = useRef(0);

  useEffect(() => () => {
    photoPreviewsRef.current.forEach((photo) => URL.revokeObjectURL(photo.url));
  }, []);

  const setField = (field: keyof typeof initialForm, value: string | number) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleCepChange = (value: string) => {
    const postalCode = value.replace(/\D/g, '').slice(0, 8);
    setForm((current) => ({
      ...current,
      postalCode,
      latitude: postalCode.length === 8 ? '' : current.latitude,
      longitude: postalCode.length === 8 ? '' : current.longitude,
    }));
    setLocationLookupMessage('');

    const requestSequence = ++cepLookupSequenceRef.current;
    if (postalCode.length === 8) {
      void lookupAddressByCep(postalCode, requestSequence);
    } else {
      setIsLookingUpCep(false);
    }
  };

  const lookupAddressByCep = async (postalCode: string, requestSequence: number) => {
    setIsLookingUpCep(true);
    setLocationLookupMessage('Buscando endereço e coordenadas...');

    try {
      const addressResponse = await fetch(`https://viacep.com.br/ws/${postalCode}/json/`);
      if (!addressResponse.ok) throw new Error('Não foi possível consultar o ViaCEP.');
      const address = await addressResponse.json() as {
        erro?: boolean;
        logradouro?: string;
        bairro?: string;
        localidade?: string;
        uf?: string;
      };

      if (requestSequence !== cepLookupSequenceRef.current) return;
      if (address.erro) throw new Error('CEP não encontrado. Verifique os oito dígitos informados.');

      const street = address.logradouro?.trim() || '';
      const neighborhood = address.bairro?.trim() || '';
      const city = address.localidade?.trim() || '';
      const state = address.uf?.trim().toUpperCase() || '';

      setForm((current) => ({
        ...current,
        fullAddress: street,
        neighborhood,
        city,
        state,
        latitude: '',
        longitude: '',
      }));

      const geocodingUrl = new URL('https://nominatim.openstreetmap.org/search');
      geocodingUrl.searchParams.set('format', 'jsonv2');
      geocodingUrl.searchParams.set('limit', '1');
      geocodingUrl.searchParams.set('countrycodes', 'br');
      geocodingUrl.searchParams.set('q', [street, neighborhood, city, state, 'Brasil'].filter(Boolean).join(', '));

      const coordinateResponse = await fetch(geocodingUrl, {
        headers: { 'Accept-Language': 'pt-BR' },
      });
      if (!coordinateResponse.ok) throw new Error('O endereço foi preenchido, mas a busca de coordenadas falhou. Informe a localização manualmente.');

      const coordinates = await coordinateResponse.json() as Array<{ lat: string; lon: string }>;
      if (requestSequence !== cepLookupSequenceRef.current) return;
      if (!coordinates[0]) {
        setLocationLookupMessage('Endereço preenchido. Não localizamos coordenadas exatas; revise-as manualmente antes de salvar.');
        return;
      }

      setForm((current) => ({
        ...current,
        latitude: coordinates[0].lat,
        longitude: coordinates[0].lon,
      }));
      setLocationLookupMessage('Endereço e coordenadas preenchidos pelo CEP.');
    } catch (error) {
      if (requestSequence !== cepLookupSequenceRef.current) return;
      setLocationLookupMessage(error instanceof Error ? error.message : 'Não foi possível localizar este CEP.');
    } finally {
      if (requestSequence === cepLookupSequenceRef.current) setIsLookingUpCep(false);
    }
  };

  const handlePhotoSelection = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    event.target.value = '';
    if (selectedFiles.length === 0) return;

    const hasUnsupportedFile = selectedFiles.some((file) =>
      file.type !== 'image/jpeg' && file.type !== 'image/png',
    );
    if (hasUnsupportedFile) {
      setFeedback({ message: 'Selecione somente arquivos JPG ou PNG.', success: false });
      return;
    }

    if (selectedFiles.some((file) => file.size > MAX_PHOTO_SIZE)) {
      setFeedback({ message: 'Cada imagem deve ter no máximo 10 MB.', success: false });
      return;
    }

    if (photoPreviewsRef.current.length + selectedFiles.length > MAX_PHOTO_COUNT) {
      setFeedback({ message: `Selecione no máximo ${MAX_PHOTO_COUNT} imagens por imóvel.`, success: false });
      return;
    }

    const nextPhotos = selectedFiles.map((file) => ({ file, url: URL.createObjectURL(file) }));
    photoPreviewsRef.current = [...photoPreviewsRef.current, ...nextPhotos];
    setPhotoPreviews(photoPreviewsRef.current);
    setFeedback(null);
  };

  const removePhoto = (url: string) => {
    URL.revokeObjectURL(url);
    photoPreviewsRef.current = photoPreviewsRef.current.filter((photo) => photo.url !== url);
    setPhotoPreviews(photoPreviewsRef.current);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);

    if (!ownerId) {
      setFeedback({ message: 'Entre na sua conta para cadastrar um imóvel.', success: false });
      return;
    }

    setIsSaving(true);
    const uploadedPaths: string[] = [];
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user || user.id !== ownerId) {
        throw new Error('Sua sessão expirou. Entre novamente.');
      }

      const fullAddress = form.fullAddress.trim();
      const neighborhood = form.neighborhood.trim();
      const location = [fullAddress, neighborhood, form.city.trim(), form.state.trim()]
        .filter(Boolean)
        .join(', ');
      const latitude = form.latitude.trim() ? Number(form.latitude) : null;
      const longitude = form.longitude.trim() ? Number(form.longitude) : null;

      if (form.postalCode.length !== 8) {
        throw new Error('Informe um CEP válido com oito dígitos.');
      }
      if (isLookingUpCep) {
        throw new Error('Aguarde a busca de endereço e coordenadas terminar.');
      }
      if ((latitude === null) !== (longitude === null)) {
        throw new Error('Preencha latitude e longitude juntas ou deixe as duas em branco.');
      }
      if (latitude === null || longitude === null) {
        throw new Error('Não encontramos as coordenadas deste endereço. Informe latitude e longitude antes de salvar para habilitar a precificação por IA.');
      }

      const imageUrls: string[] = [];
      for (const { file } of photoPreviewsRef.current) {
        const extension = file.type === 'image/png' ? 'png' : 'jpg';
        const storagePath = `${user.id}/${crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await supabase.storage
          .from(PHOTO_BUCKET)
          .upload(storagePath, file, {
            cacheControl: '3600',
            contentType: file.type,
            upsert: false,
          });

        if (uploadError) throw uploadError;

        uploadedPaths.push(storagePath);
        const { data: { publicUrl } } = supabase.storage
          .from(PHOTO_BUCKET)
          .getPublicUrl(storagePath);
        imageUrls.push(publicUrl);
      }

      const { data, error } = await supabase
        .from('properties')
        .insert({
          title: form.title.trim(),
          full_address: fullAddress,
          neighborhood,
          location,
          city: form.city.trim(),
          state: form.state.trim().toUpperCase(),
          property_type: 'Casa',
          max_guests: form.maxGuests,
          quartos: form.bedrooms,
          banheiros: form.bathrooms,
          latitude,
          longitude,
          price: form.price,
          cleaning_fee: 0,
          images: imageUrls,
          user_id: user.id,
          platform: 'direct',
        })
        .select('*')
        .single();

      if (error) throw error;
  if (!data) throw new Error('O imóvel foi enviado, mas não recebemos a confirmação do Supabase. Atualize a lista antes de tentar novamente.');
  uploadedPaths.length = 0;

      onCreated({
        id: data.id,
        title: data.title,
        property_type: data.property_type,
        city: data.city,
        state: data.state,
        full_address: data.full_address,
        neighborhood: data.neighborhood,
        location: data.location,
        max_guests: Number(data.max_guests),
        bedrooms: Number(data.quartos),
        bathrooms: Number(data.banheiros),
        latitude: data.latitude == null ? null : Number(data.latitude),
        longitude: data.longitude == null ? null : Number(data.longitude),
        price: Number(data.price),
        cleaning_fee: Number(data.cleaning_fee),
        images: data.images || [],
        user_id: data.user_id,
      });
      setForm(initialForm);
      cepLookupSequenceRef.current += 1;
      setLocationLookupMessage('');
      photoPreviewsRef.current.forEach((photo) => URL.revokeObjectURL(photo.url));
      photoPreviewsRef.current = [];
      setPhotoPreviews([]);
      setFeedback({ message: 'Imóvel cadastrado e selecionado na precificação inteligente.', success: true });
    } catch (error) {
      if (uploadedPaths.length > 0) {
        const { error: cleanupError } = await supabase.storage
          .from(PHOTO_BUCKET)
          .remove(uploadedPaths);
        if (cleanupError) console.error('Não foi possível remover imagens do cadastro incompleto:', cleanupError);
      }
      setFeedback({
        message: error instanceof Error ? error.message : 'Não foi possível cadastrar o imóvel.',
        success: false,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const inputClassName = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100';
  const labelClassName = 'mb-1.5 block text-xs font-semibold text-slate-700';

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
        <span className="flex size-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
          <Home className="size-5" />
        </span>
        <div>
          <h2 className="font-bold text-slate-900">Cadastrar imóvel</h2>
          <p className="text-xs text-slate-500">Adicione uma propriedade ao seu portfólio</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <label>
            <span className={labelClassName}>CEP</span>
            <input
              required
              type="text"
              inputMode="numeric"
              autoComplete="postal-code"
              pattern="[0-9]{8}"
              maxLength={8}
              value={form.postalCode}
              onChange={(event) => handleCepChange(event.target.value)}
              placeholder="00000000"
              className={inputClassName}
            />
            <span className="mt-1 block text-[11px] text-slate-500">Digite os oito dígitos para buscar endereço e coordenadas.</span>
          </label>
          <label>
            <span className={labelClassName}>Nome do imóvel</span>
            <input
              required
              maxLength={120}
              value={form.title}
              onChange={(event) => setField('title', event.target.value)}
              placeholder="Ex.: Apartamento perto da praia"
              className={inputClassName}
            />
          </label>
          <label>
            <span className={labelClassName}>Endereço completo</span>
            <input
              required
              maxLength={240}
              value={form.fullAddress}
              onChange={(event) => setField('fullAddress', event.target.value)}
              placeholder="Rua, número e complemento"
              className={inputClassName}
            />
          </label>
          <label>
            <span className={labelClassName}>Cidade</span>
            <input
              required
              maxLength={100}
              value={form.city}
              onChange={(event) => setField('city', event.target.value)}
              placeholder="Ex.: Florianópolis"
              className={inputClassName}
            />
          </label>
          <div className="grid grid-cols-[1fr_5rem] gap-3">
            <label>
              <span className={labelClassName}>Bairro</span>
              <input
                required
                maxLength={100}
                value={form.neighborhood}
                onChange={(event) => setField('neighborhood', event.target.value)}
                placeholder="Ex.: Ingleses"
                className={inputClassName}
              />
            </label>
            <label>
              <span className={labelClassName}>UF</span>
              <input
                required
                maxLength={2}
                value={form.state}
                onChange={(event) => setField('state', event.target.value)}
                className={inputClassName}
              />
            </label>
          </div>
          <label>
            <span className={labelClassName}>Quantidade de quartos</span>
            <input
              required
              type="number"
              min="0"
              step="1"
              value={form.bedrooms}
              onChange={(event) => setField('bedrooms', Number(event.target.value))}
              className={inputClassName}
            />
          </label>
          <label>
            <span className={labelClassName}>Quantidade de banheiros</span>
            <input
              required
              type="number"
              min="0"
              step="0.5"
              value={form.bathrooms}
              onChange={(event) => setField('bathrooms', Number(event.target.value))}
              className={inputClassName}
            />
          </label>
          <label>
            <span className={labelClassName}>Número de Ocupantes</span>
            <input
              required
              type="number"
              min="1"
              max="30"
              step="1"
              value={form.maxGuests}
              onChange={(event) => setField('maxGuests', Number(event.target.value))}
              className={inputClassName}
            />
          </label>
          <label>
            <span className={labelClassName}>Preço base desejado (R$ / diária)</span>
            <input
              required
              type="number"
              min="1"
              step="0.01"
              value={form.price}
              onChange={(event) => setField('price', Number(event.target.value))}
              className={inputClassName}
            />
          </label>
        </div>

        {locationLookupMessage && (
          <p role="status" className={`text-xs ${form.latitude && form.longitude ? 'text-emerald-700' : 'text-amber-800'}`}>
            {locationLookupMessage}
          </p>
        )}

        <div className="space-y-3">
          <div>
            <span className={labelClassName}>Fotos do imóvel</span>
            <label className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm font-medium text-slate-700 transition hover:border-teal-500 hover:bg-teal-50 ${isSaving ? 'pointer-events-none opacity-60' : ''}`}>
              <ImagePlus className="size-4 text-teal-700" />
              {isSaving ? 'Enviando imagens...' : 'Selecionar imagens JPG ou PNG'}
              <input
                type="file"
                accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                multiple
                disabled={isSaving}
                onChange={handlePhotoSelection}
                className="sr-only"
              />
            </label>
            <p className="mt-1.5 text-xs text-slate-500">Até {MAX_PHOTO_COUNT} fotos, máximo 10 MB por imagem.</p>
          </div>

          {photoPreviews.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {photoPreviews.map(({ file, url }) => (
                <figure key={`${file.name}-${file.lastModified}-${url}`} className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                  <img src={url} alt={`Prévia de ${file.name}`} className="size-full object-cover" />
                  {isSaving && (
                    <span className="absolute inset-x-0 bottom-0 bg-slate-950/70 px-2 py-1 text-center text-[10px] font-medium text-white">
                      Enviando...
                    </span>
                  )}
                  {!isSaving && (
                    <button
                      type="button"
                      onClick={() => removePhoto(url)}
                      aria-label={`Remover ${file.name}`}
                      className="absolute right-1.5 top-1.5 flex size-7 items-center justify-center rounded-full bg-slate-950/75 text-white opacity-100 transition hover:bg-rose-600 sm:opacity-0 sm:group-hover:opacity-100"
                    >
                      <X className="size-4" />
                    </button>
                  )}
                </figure>
              ))}
            </div>
          )}
        </div>

        <details className="rounded-lg border border-slate-200 px-3.5 py-3">
          <summary className="flex cursor-pointer list-none items-center gap-2 text-xs font-semibold text-slate-700">
            <MapPin className="size-4 text-teal-700" />
            Coordenadas para análise de concorrentes
          </summary>
          <p className="mb-3 mt-2 text-xs text-slate-500">
            {form.latitude && form.longitude
              ? 'Coordenadas encontradas pelo CEP. Ajuste-as aqui se necessário.'
              : 'Se o CEP não localizar as coordenadas, informe latitude e longitude para habilitar a precificação por concorrentes.'}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label>
              <span className={labelClassName}>Latitude</span>
              <input
                type="number"
                min="-90"
                max="90"
                step="any"
                value={form.latitude}
                onChange={(event) => setField('latitude', event.target.value)}
                placeholder="-27.435"
                className={inputClassName}
              />
            </label>
            <label>
              <span className={labelClassName}>Longitude</span>
              <input
                type="number"
                min="-180"
                max="180"
                step="any"
                value={form.longitude}
                onChange={(event) => setField('longitude', event.target.value)}
                placeholder="-48.398"
                className={inputClassName}
              />
            </label>
          </div>
        </details>

        {feedback && (
          <p role={feedback.success ? 'status' : 'alert'} className={`text-sm ${feedback.success ? 'text-emerald-700' : 'text-rose-700'}`}>
            {feedback.message}
          </p>
        )}

        <div className="flex justify-end border-t border-slate-100 pt-4">
          <button
            type="submit"
            disabled={isSaving || isLookingUpCep || !ownerId}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? <LoaderCircle className="size-4 animate-spin" /> : feedback?.success ? <Check className="size-4" /> : <Plus className="size-4" />}
            {isSaving ? 'Salvando...' : isLookingUpCep ? 'Localizando endereço...' : 'Cadastrar Imóvel'}
          </button>
        </div>
      </form>
    </section>
  );
}
