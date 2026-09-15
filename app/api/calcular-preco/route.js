import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Inicializa o cliente do Supabase pegando as chaves automáticas da Vercel
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

export async function POST(request) {
  try {
    // Recebe os dados enviados pela tela do GoFérias
    const { propertyId, targetDate } = await request.json()

    if (!propertyId || !targetDate) {
      return NextResponse.json({ error: 'Dados incompletos.' }, { status: 400 })
    }

    // 1. BUSCAR DADOS DO IMÓVEL DO USUÁRIO
    const { data: property, error: propError } = await supabase
      .from('Properties')
      .select('*')
      .eq('id', propertyId)
      .single()

    if (propError || !property) {
      return NextResponse.json({ error: 'Imóvel não encontrado.' }, { status: 404 })
    }

    const { latitude, longitude, bedrooms_count, bathrooms_count, daily_price: basePrice } = property

    // 2. CAMADA 1: FILTRO DO RAIO DE 500M
    const geoMargin = 0.0045 // ~500 metros em coordenadas de Florianópolis
    
    const { data: competitors, error: compError } = await supabase
      .from('External_Listings')
      .select('daily_price')
      .eq('bathrooms_count', bathrooms_count)
      .gte('bedrooms_count', bedrooms_count - 1)
      .lte('bedrooms_count', bedrooms_count + 1)
      .gte('latitude', latitude - geoMargin)
      .lte('latitude', latitude + geoMargin)
      .gte('longitude', longitude - geoMargin)
      .lte('longitude', longitude + geoMargin)

    // Calcula a Mediana dos concorrentes a 500m
    let marketBasePrice = basePrice
    if (!compError && competitors && competitors.length > 0) {
      const prices = competitors.map(c => Number(c.daily_price)).sort((a, b) => a - b)
      const mid = Math.floor(prices.length / 2)
      marketBasePrice = prices.length % 2 !== 0 ? prices[mid] : (prices[mid - 1] + prices[mid]) / 2
    }

    // 3. CAMADA 2: CONSULTAR TEMPORADA E EVENTOS NOS INGLESES
    let eventMultiplier = 1.0
    const { data: activeEvents } = await supabase
      .from('Local_Events')
      .select('price_multiplier')
      .lte('start_date', targetDate)
      .gte('end_date', targetDate)

    if (activeEvents && activeEvents.length > 0) {
      eventMultiplier = Math.max(...activeEvents.map(e => Number(e.price_multiplier)))
    } else {
      // Ajuste padrão de fim de semana (+15%)
      const dayOfWeek = new Date(targetDate).getUTCDay()
      if (dayOfWeek === 5 || dayOfWeek === 6) {
        eventMultiplier = 1.15
      }
    }

    // 4. CAMADA 3: REGRA DE OCUPAÇÃO (GATILHO DE URGÊNCIA)
    let occupancyAdjustment = 1.0
    const today = new Date().toISOString().split('T')[0]
    const daysUntilTarget = Math.ceil((new Date(targetDate) - new Date(today)) / (1000 * 60 * 60 * 24))

    if (daysUntilTarget <= 7 && daysUntilTarget >= 0) {
      occupancyAdjustment = 0.85 // Desconto de 15% de última hora
    }

    // 5. CÁLCULO FINAL DO MOTOR GOFÉRIAS
    const finalSuggestedPrice = Math.round((marketBasePrice * eventMultiplier) * occupancyAdjustment * 100) / 100

    // 6. SALVAR REGISTRO NO HISTÓRICO PARA O GRÁFICO
    await supabase
      .from('Price_History')
      .insert({
        property_id: propertyId,
        historical_price: basePrice,
        competitive_average_price: finalSuggestedPrice
      })

    // Retorna o resultado limpo para a tela exibir
    return NextResponse.json({
      priceSuggested: finalSuggestedPrice,
      marketBase: marketBasePrice,
      multiplierApplied: eventMultiplier,
      urgencyApplied: occupancyAdjustment
    })

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
