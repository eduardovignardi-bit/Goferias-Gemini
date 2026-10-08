import { useCallback, useEffect, useRef, useState } from 'react';
import { Bot, Check, Send, Sparkles, TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getPricingSuggestion, type PricingSuggestion } from '../../services/pricingService';

type Property = {
  id: string;
  title: string;
  city: string;
  state: string;
  bedrooms?: number | null;
  quartos?: number | null;
  bathrooms?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  price: number;
};

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

function formatBRL(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

interface PricingAssistantProps {
  ownerId: string | null;
  properties: Property[];
  focusPropertyId: string | null;
  onPriceApplied: (propertyId: string, price: number) => void;
}

export const PricingAssistant: React.FC<PricingAssistantProps> = ({
  ownerId,
  properties,
  focusPropertyId,
  onPriceApplied,
}) => {
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [historyOwnerId, setHistoryOwnerId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [pricingSuggestion, setPricingSuggestion] = useState<PricingSuggestion | null>(null);
  const [pricingError, setPricingError] = useState<string | null>(null);
  const [isAnalyzingPricing, setIsAnalyzingPricing] = useState(false);
  const [isApplyingPrice, setIsApplyingPrice] = useState(false);
  const [appliedPricePropertyId, setAppliedPricePropertyId] = useState<string | null>(null);
  const autoAnalyzedPropertyId = useRef<string | null>(null);

  useEffect(() => {
    if (!ownerId) {
      setMessages([]);
      setHistoryOwnerId(null);
      return;
    }

    try {
      const storedHistory = sessionStorage.getItem(`goferias:pricing-chat:${ownerId}`);
      const parsedHistory: unknown = storedHistory ? JSON.parse(storedHistory) : [];
      setMessages(
        Array.isArray(parsedHistory)
          ? parsedHistory.filter(
              (message): message is Message =>
                typeof message?.content === 'string' &&
                (message.role === 'user' || message.role === 'assistant'),
            )
          : [],
      );
    } catch {
      setMessages([]);
    }

    setHistoryOwnerId(ownerId);
  }, [ownerId]);

  useEffect(() => {
    if (!ownerId || historyOwnerId !== ownerId) return;
    sessionStorage.setItem(`goferias:pricing-chat:${ownerId}`, JSON.stringify(messages));
  }, [historyOwnerId, messages, ownerId]);

  const sendMessage = async (content: string) => {
    const question = content.trim();
    if (!question || !ownerId || isSending) return;

    setIsSending(true);
    setInput('');
    const completeHistory: Message[] = [...messages, { role: 'user', content: question }];
    setMessages(completeHistory);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Sua sessão expirou. Entre novamente.');

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ messages: completeHistory }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Não foi possível consultar o assistente.');

      setMessages([...completeHistory, { role: 'assistant', content: result.message }]);
    } catch (error) {
      const explanation = error instanceof Error ? error.message : 'Tente novamente em instantes.';
      setMessages([
        ...completeHistory,
        { role: 'assistant', content: `Não consegui concluir a consulta. ${explanation}` },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const selectedProperty = properties.find((property) => property.id === selectedPropertyId);

  const analyzePricing = useCallback(async (property: Property | undefined = selectedProperty) => {
    if (!property || !ownerId || isAnalyzingPricing) return;

    setPricingSuggestion(null);
    setPricingError(null);
    setAppliedPricePropertyId(null);
    setIsAnalyzingPricing(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Sua sessão expirou. Entre novamente.');
      setPricingSuggestion(await getPricingSuggestion(property.id, session.access_token));
    } catch (error) {
      setPricingError(error instanceof Error ? error.message : 'Não foi possível analisar este imóvel.');
    } finally {
      setIsAnalyzingPricing(false);
    }
  }, [isAnalyzingPricing, ownerId, selectedProperty]);

  useEffect(() => {
    if (!focusPropertyId || autoAnalyzedPropertyId.current === focusPropertyId) return;

    const property = properties.find((item) => item.id === focusPropertyId);
    if (!property) return;

    autoAnalyzedPropertyId.current = focusPropertyId;
    setSelectedPropertyId(focusPropertyId);
    setPricingSuggestion(null);
    setPricingError(null);
    setAppliedPricePropertyId(null);

    if (
      typeof property.bathrooms !== 'number' ||
      typeof property.latitude !== 'number' ||
      typeof property.longitude !== 'number'
    ) {
      setPricingError('Imóvel selecionado. Informe quartos, banheiros e coordenadas para calcular a sugestão por concorrentes.');
      return;
    }

    void analyzePricing(property);
  }, [analyzePricing, focusPropertyId, properties]);

  const applySuggestedPrice = async () => {
    if (!selectedProperty || !ownerId || !pricingSuggestion || isApplyingPrice) return;

    setPricingError(null);
    setIsApplyingPrice(true);

    try {
      const { data, error } = await supabase
        .from('properties')
        .update({
          price: pricingSuggestion.suggestedDailyPrice,
          preco_inteligente_ativo: true,
        })
        .eq('id', selectedProperty.id)
        .eq('user_id', ownerId)
        .select('id')
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Não foi possível atualizar o preço deste imóvel.');

      onPriceApplied(selectedProperty.id, pricingSuggestion.suggestedDailyPrice);
      setAppliedPricePropertyId(selectedProperty.id);
    } catch (error) {
      setPricingError(error instanceof Error ? error.message : 'Não foi possível aplicar o preço sugerido.');
    } finally {
      setIsApplyingPrice(false);
    }
  };

  const requestPriceSuggestion = () => {
    if (!selectedProperty) return;
    const bedroomCount = Number(
      selectedProperty.bedrooms ?? selectedProperty.quartos ?? 0,
    );
    void sendMessage(
      `Analise uma diária para este imóvel: ${selectedProperty.title}, em ${selectedProperty.city}/${selectedProperty.state}, ` +
        `${Number.isFinite(bedroomCount) ? bedroomCount : 0} quartos, preço atual de R$ ${Number(selectedProperty.price).toFixed(2)}. ` +
        'Sugira uma faixa de preço e um valor recomendado, explicando as premissas. Não trate como dado confirmado de concorrentes.',
    );
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
            <Sparkles className="size-5" />
          </span>
          <div>
            <h2 className="font-bold text-slate-900">Precificação inteligente</h2>
            <p className="text-xs text-slate-500">Assistente de IA para seus imóveis</p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <select
            aria-label="Imóvel para análise de preço"
            value={selectedPropertyId}
            disabled={isApplyingPrice}
            onChange={(event) => {
              setSelectedPropertyId(event.target.value);
              setPricingSuggestion(null);
              setPricingError(null);
              setAppliedPricePropertyId(null);
            }}
            className="min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 sm:max-w-64"
          >
            <option value="">Selecione um imóvel</option>
            {properties.map((property) => (
              <option key={property.id} value={property.id}>
                {property.title}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={requestPriceSuggestion}
            disabled={!selectedProperty || isSending}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Sparkles className="size-4" />
            Conversar com IA
          </button>
          <button
            type="button"
            onClick={() => void analyzePricing(selectedProperty)}
            disabled={
              !selectedProperty ||
              typeof selectedProperty.bathrooms !== 'number' ||
              typeof selectedProperty.latitude !== 'number' ||
              typeof selectedProperty.longitude !== 'number' ||
              isAnalyzingPricing
            }
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Sparkles className="size-4" />
            {isAnalyzingPricing ? 'Analisando...' : 'Analisar concorrentes'}
          </button>
        </div>
      </div>

      {(pricingError || pricingSuggestion) && (
        <div className="space-y-3 border-b border-slate-100 bg-slate-50 px-5 py-4">
          {pricingError && (
            <p role="alert" className="text-sm font-medium text-rose-700">{pricingError}</p>
          )}
          {pricingSuggestion && (
            <>
              <div className="rounded-xl border border-teal-200 bg-white p-4 shadow-sm">
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase text-teal-800">Preço Sugerido pela IA</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">
                      {formatBRL(pricingSuggestion.suggestedDailyPrice)}
                      <span className="ml-1 text-sm font-medium text-slate-500">/ diária</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void applySuggestedPrice()}
                    disabled={isApplyingPrice || appliedPricePropertyId === selectedPropertyId}
                    className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
                      appliedPricePropertyId === selectedPropertyId
                        ? 'bg-emerald-700'
                        : 'bg-teal-700 hover:bg-teal-800'
                    }`}
                  >
                    {appliedPricePropertyId === selectedPropertyId ? <Check className="size-4" /> : <Sparkles className="size-4" />}
                    {isApplyingPrice
                      ? 'Aplicando...'
                      : appliedPricePropertyId === selectedPropertyId
                        ? 'Preço Aplicado'
                        : 'Aplicar Preço Sugerido'}
                  </button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
                      <TrendingUp className="size-4" /> Estimativa de ganho extra mensal
                    </p>
                    <p className="mt-1 text-xl font-bold text-emerald-800">
                      {formatBRL(pricingSuggestion.estimatedMonthlyExtraGain)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-medium text-slate-500">Mediana das diárias semelhantes</p>
                    <p className="mt-1 text-xl font-bold text-slate-800">
                      {formatBRL(pricingSuggestion.competitorMedianDailyPrice)}
                    </p>
                  </div>
                </div>

                <div className="mt-3 rounded-lg border-l-4 border-teal-600 bg-teal-50 px-4 py-3">
                  <p className="text-sm leading-relaxed text-teal-950">{pricingSuggestion.justification}</p>
                  <p className="mt-1.5 text-xs text-teal-800">
                    Média de {pricingSuggestion.competitorCount} imóveis com o mesmo número de banheiros e até um quarto de diferença, em até 500 m.
                  </p>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  O ganho mensal considera {pricingSuggestion.occupiedNightsAssumption} noites ocupadas e o preço atual de {formatBRL(pricingSuggestion.currentDailyPrice)}.
                </p>
              </div>
            </>
          )}
        </div>
      )}

      <div className="space-y-3 px-5 py-4">
        <div className="max-h-64 space-y-3 overflow-y-auto" aria-live="polite">
          {messages.length === 0 ? (
            <div className="flex items-start gap-2.5 text-sm text-slate-600">
              <Bot className="mt-0.5 size-4 shrink-0 text-teal-700" />
              <p>
                Escolha um imóvel para pedir uma estimativa ou pergunte sobre a estratégia de preços. As respostas são estimativas, não dados de concorrentes verificados.
              </p>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={`${index}-${message.role}`}
                className={`max-w-[90%] whitespace-pre-wrap rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  message.role === 'user'
                    ? 'ml-auto bg-teal-700 text-white'
                    : 'bg-slate-100 text-slate-800'
                }`}
              >
                {message.content}
              </div>
            ))
          )}
          {isSending && <p className="text-xs text-slate-500">Analisando...</p>}
        </div>

        <form
          className="flex items-end gap-2 border-t border-slate-100 pt-3"
          onSubmit={(event) => {
            event.preventDefault();
            void sendMessage(input);
          }}
        >
          <textarea
            aria-label="Mensagem para o assistente de preços"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                void sendMessage(input);
              }
            }}
            maxLength={4_000}
            rows={2}
            placeholder="Pergunte sobre preço, sazonalidade ou ocupação..."
            className="min-h-10 flex-1 resize-y rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
          />
          <button
            type="submit"
            aria-label="Enviar mensagem"
            title="Enviar mensagem"
            disabled={!input.trim() || isSending}
            className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Send className="size-4" />
          </button>
        </form>
        <p className="text-[11px] text-slate-400">
          O histórico desta conversa fica salvo nesta sessão do navegador.
        </p>
      </div>
    </section>
  );
};
