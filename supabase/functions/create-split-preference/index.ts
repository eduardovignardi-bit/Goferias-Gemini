import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { reservationId, title, totalAmount, ownerAccountId } = await req.json()

    // 1. Cálculo matemático do Split (10% Plataforma, 90% Proprietário)
    const commissionRate = 0.10;
    const platformCommission = Number((totalAmount * commissionRate).toFixed(2));
    const ownerNetAmount = Number((totalAmount - platformCommission).toFixed(2));

    // 2. Inicializar cliente Supabase com privilégios de serviço
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 3. Registrar a transação pendente no banco de dados
    const { error: txError } = await supabaseAdmin
      .from('transactions')
      .insert({
        reservation_id: reservationId,
        total_amount: totalAmount,
        platform_commission: platformCommission,
        owner_net_amount: ownerNetAmount,
        status: 'Pendente'
      })

    if (txError) throw txError;

    // 4. Integração com o Gateway de Pagamento (Exemplo estruturado para Stripe Connect / Split)
    // Aqui você insere a chave secreta do seu gateway configurada nas Secrets do Supabase
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    
    // Simulação de chamada de preferência de pagamento com Split para o Gateway
    // Se o proprietário tiver uma conta conectada (ownerAccountId), o Stripe faz o transfer_data automático.
    /*
    const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'payment_method_types[0]': 'card',
        'line_items[0][price_data][currency]': 'brl',
        'line_items[0][price_data][unit_amount]': String(Math.round(totalAmount * 100)),
        'line_items[0][price_data][product_data][name]': title,
        'line_items[0][quantity]': '1',
        'mode': 'payment',
        // Regra de Split se o proprietário estiver cadastrado:
        ...(ownerAccountId ? {
          'payment_intent_data[transfer_data][destination]': ownerAccountId,
          'payment_intent_data[transfer_data][amount_data][unit_amount]': String(Math.round(ownerNetAmount * 100)),
        } : {}),
        'success_url': `${req.headers.get('origin')}/?payment=success`,
        'cancel_url': `${req.headers.get('origin')}/?payment=cancel`,
      })
    });
    const session = await stripeResponse.json();
    */

    // Retorno temporário simulado para teste de integração do fluxo
    return new Response(
      JSON.stringify({ 
        success: true, 
        init_point: "https://checkout.stripe.com/pay/simulated_checkout_link", 
        platformCommission,
        ownerNetAmount 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})