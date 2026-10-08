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
    const { 
      reservationId, 
      title, 
      totalAmount, 
      guestName,
      guestEmail,
      guestCpf 
    } = await req.json()

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
    const { data: txData, error: txError } = await supabaseAdmin
      .from('transactions')
      .insert({
        reservation_id: reservationId,
        total_amount: totalAmount,
        platform_commission: platformCommission,
        owner_net_amount: ownerNetAmount,
        status: 'Pendente'
      })
      .select()
      .single()

    if (txError) throw txError;

    // 4. Obter o Access Token do Mercado Pago
    const mpAccessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
    if (!mpAccessToken) {
      throw new Error('MERCADO_PAGO_ACCESS_TOKEN não está configurada nas Secrets do Supabase.');
    }

    // 5. Montar o payload para criação de pagamento Pix Direto
    const paymentPayload = {
      transaction_amount: Number(totalAmount),
      description: title || 'Reserva GoFérias',
      payment_method_id: 'pix',
      payer: {
        email: guestEmail || 'hospede@goferias.com.br',
        first_name: guestName ? guestName.split(' ')[0] : 'Hóspede',
        last_name: guestName ? guestName.split(' ').slice(1).join(' ') || 'GoFérias' : 'GoFérias',
        identification: {
          type: 'CPF',
          number: guestCpf || '88820050978'
        }
      },
      external_reference: String(txData.id)
    };

    const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mpAccessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': String(txData.id)
      },
      body: JSON.stringify(paymentPayload)
    });

    const mpData = await mpResponse.json();

    if (!mpResponse.ok) {
      throw new Error(`Erro Pix Mercado Pago: ${mpData.message || JSON.stringify(mpData)}`);
    }

    // Extrair os dados do Pix gerados pelo Mercado Pago
    const pointOfInteraction = mpData.point_of_interaction;
    const qrCode = pointOfInteraction?.transaction_data?.qr_code;
    const qrCodeBase64 = pointOfInteraction?.transaction_data?.qr_code_base64;
    const ticketUrl = pointOfInteraction?.transaction_data?.ticket_url;

    // 6. Atualizar a transação no banco com o ID do pagamento gerado
    await supabaseAdmin
      .from('transactions')
      .update({ gateway_session_id: String(mpData.id) })
      .eq('id', txData.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        paymentId: mpData.id,
        qrCode,          // Código Pix "Copia e Cola"
        qrCodeBase64,    // Imagem em Base64 para exibir o QR Code
        ticketUrl,       // Link alternativo se necessário
        totalAmount,
        platformCommission,
        ownerNetAmount 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})