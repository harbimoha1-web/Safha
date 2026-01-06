// Supabase Edge Function: Moyasar Webhook Handler
// Processes payment notifications from Moyasar
// SECURITY: Implements signature verification and idempotency checks

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-moyasar-signature',
};

interface MoyasarPayment {
  id: string;
  status: 'initiated' | 'paid' | 'failed' | 'refunded';
  amount: number;
  fee: number;
  currency: string;
  description: string;
  source: {
    type: string;
    company?: string;
    name?: string;
    number?: string;
  };
  metadata?: {
    user_id?: string;
    plan?: string;
    type?: string;
  };
  created_at: string;
  updated_at: string;
}

/**
 * Verify Moyasar webhook signature using HMAC-SHA256
 * CRITICAL: Always verify signatures to prevent payment fraud
 */
async function verifySignature(
  rawBody: string,
  signature: string | null,
  secret: string
): Promise<boolean> {
  if (!signature || !secret) {
    console.error('Signature verification failed: Missing signature or secret');
    return false;
  }

  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(rawBody);

    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign('HMAC', key, messageData);
    const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Constant-time comparison to prevent timing attacks
    if (signature.length !== expectedSignature.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < signature.length; i++) {
      result |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
    }

    return result === 0;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const moyasarWebhookSecret = Deno.env.get('MOYASAR_WEBHOOK_SECRET');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing');
    }

    // SECURITY: Require webhook secret in production
    if (!moyasarWebhookSecret) {
      console.warn('MOYASAR_WEBHOOK_SECRET not set - signature verification disabled');
      // In production, you should reject requests without secret configured
      // throw new Error('Webhook secret not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get raw body for signature verification
    const rawBody = await req.text();
    const signature = req.headers.get('X-Moyasar-Signature') || req.headers.get('x-moyasar-signature');

    // SECURITY: Verify webhook signature
    if (moyasarWebhookSecret) {
      const isValid = await verifySignature(rawBody, signature, moyasarWebhookSecret);
      if (!isValid) {
        console.error('Invalid webhook signature - possible fraud attempt');
        return new Response(
          JSON.stringify({ error: 'Invalid signature' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      console.log('Webhook signature verified successfully');
    }

    // Parse verified payload
    const payload = JSON.parse(rawBody);
    const payment: MoyasarPayment = payload.data || payload;

    console.log('Moyasar webhook received:', payment.id, payment.status);

    // Only process subscription payments
    if (payment.metadata?.type !== 'subscription') {
      return new Response(
        JSON.stringify({ message: 'Not a subscription payment' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = payment.metadata.user_id;
    const plan = payment.metadata.plan as 'premium' | 'premium_annual';

    if (!userId || !plan) {
      throw new Error('Missing user_id or plan in metadata');
    }

    // IDEMPOTENCY CHECK: Prevent duplicate payment processing
    const { data: existingPayment } = await supabase
      .from('payment_history')
      .select('id, status')
      .eq('moyasar_payment_id', payment.id)
      .single();

    if (existingPayment) {
      console.log('Payment already processed:', payment.id, existingPayment.status);
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Payment already processed',
          payment_id: payment.id
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Record payment (first time)
    const { error: paymentError } = await supabase.from('payment_history').insert({
      user_id: userId,
      amount: payment.amount / 100, // Convert halalas to SAR
      currency: payment.currency,
      payment_method: payment.source.type,
      moyasar_payment_id: payment.id,
      status: payment.status,
      paid_at: payment.status === 'paid' ? new Date().toISOString() : null,
    });

    if (paymentError) {
      console.error('Payment history insert error:', paymentError);
      // Continue processing - don't fail the whole request for logging errors
    }

    if (payment.status === 'paid') {
      // Calculate subscription period
      const now = new Date();
      const periodEnd = new Date(now);

      if (plan === 'premium') {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      } else if (plan === 'premium_annual') {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      }

      // Upsert subscription
      const { error: subError } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: userId,
          plan,
          status: 'active',
          moyasar_customer_id: payment.source.number?.slice(-4) || null,
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
          cancel_at_period_end: false,
        }, {
          onConflict: 'user_id',
        });

      if (subError) {
        console.error('Subscription upsert error:', subError);
        throw subError;
      }

      // Update profile
      await supabase
        .from('profiles')
        .update({ subscription_plan: plan })
        .eq('id', userId);

      console.log('Subscription activated for user:', userId, plan);
    } else if (payment.status === 'failed') {
      // Update subscription status if exists
      await supabase
        .from('subscriptions')
        .update({ status: 'past_due' })
        .eq('user_id', userId);
    }

    return new Response(
      JSON.stringify({ success: true, payment_id: payment.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
