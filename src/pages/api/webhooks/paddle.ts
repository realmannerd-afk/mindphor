import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Verify Paddle webhook signature
function verifyPaddleSignature(rawBody: string, signatureHeader: string, secret: string) {
  // signatureHeader format: ts=1680000000;h1=abcd1234abcd...
  const parts = signatureHeader.split(';');
  let ts = '';
  let h1 = '';

  for (const part of parts) {
    if (part.startsWith('ts=')) ts = part.substring(3);
    else if (part.startsWith('h1=')) h1 = part.substring(3);
  }

  if (!ts || !h1) return false;

  const payload = `${ts}:${rawBody}`;
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const computedHash = hmac.digest('hex');

  return computedHash === h1;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const signatureHeader = request.headers.get('paddle-signature');
    if (!signatureHeader) {
      return new Response(JSON.stringify({ error: 'Missing Paddle signature' }), { status: 401 });
    }

    const rawBody = await request.text();
    const webhookSecret = import.meta.env.PADDLE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('Missing PADDLE_WEBHOOK_SECRET');
      return new Response(JSON.stringify({ error: 'Server misconfiguration' }), { status: 500 });
    }

    if (!verifyPaddleSignature(rawBody, signatureHeader, webhookSecret)) {
      console.error('Invalid Paddle signature');
      return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 401 });
    }

    const event = JSON.parse(rawBody);
    const eventType = event.event_type;
    const data = event.data;

    // Use service role for DB writes to bypass RLS for server-side webhook processing
    const supabaseUrl = import.meta.env.SUPABASE_URL;
    const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_KEY;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const starterPriceId = import.meta.env.PUBLIC_PADDLE_STARTER_PRICE_ID;
    const growthPriceId = import.meta.env.PUBLIC_PADDLE_GROWTH_PRICE_ID;
    const proPriceId = import.meta.env.PUBLIC_PADDLE_PRO_PRICE_ID;

    const determinePlan = (priceId: string) => {
      if (priceId === starterPriceId) return 'starter';
      if (priceId === growthPriceId) return 'growth';
      if (priceId === proPriceId) return 'pro';
      return 'unknown';
    };

    if (eventType === 'subscription.created' || eventType === 'subscription.activated') {
      const userId = data.custom_data?.supabase_user_id;
      if (!userId) {
        console.error('No supabase_user_id found in custom_data');
        return new Response(JSON.stringify({ error: 'Missing supabase_user_id' }), { status: 400 });
      }

      const priceId = data.items?.[0]?.price?.id;
      const plan = determinePlan(priceId);

      const { error } = await supabase.from('subscriptions').upsert({
        user_id: userId,
        paddle_customer_id: data.customer_id,
        paddle_subscription_id: data.id,
        plan: plan,
        status: data.status === 'active' ? 'active' : data.status,
        current_period_end: data.current_billing_period?.ends_at,
        updated_at: new Date().toISOString()
      }, { onConflict: 'paddle_subscription_id' });

      if (error) {
        console.error('DB Insert Error:', error);
        return new Response(JSON.stringify({ error: 'Database write failed' }), { status: 500 });
      }
      console.log(`Successfully processed ${eventType} for user ${userId}`);

    } else if (eventType === 'subscription.updated') {
      const { error } = await supabase.from('subscriptions')
        .update({
          status: data.status === 'active' ? 'active' : data.status,
          current_period_end: data.current_billing_period?.ends_at,
          updated_at: new Date().toISOString()
        })
        .eq('paddle_subscription_id', data.id);

      if (error) {
        console.error('DB Update Error:', error);
        return new Response(JSON.stringify({ error: 'Database write failed' }), { status: 500 });
      }
      console.log(`Successfully processed subscription.updated for sub ${data.id}`);

    } else if (eventType === 'subscription.canceled') {
      const { error } = await supabase.from('subscriptions')
        .update({
          status: 'canceled',
          updated_at: new Date().toISOString()
        })
        .eq('paddle_subscription_id', data.id);

      if (error) {
        console.error('DB Cancel Update Error:', error);
        return new Response(JSON.stringify({ error: 'Database write failed' }), { status: 500 });
      }
      console.log(`Successfully processed subscription.canceled for sub ${data.id}`);

    } else if (eventType === 'transaction.completed') {
      console.log(`Transaction completed: ${data.id}`);
    } else {
      console.log(`Unhandled event type: ${eventType}`);
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (err) {
    console.error('Webhook error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
};
