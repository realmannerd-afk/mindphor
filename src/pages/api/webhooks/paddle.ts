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
    const supabaseUrl = import.meta.env.SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY;
    const supabase = createClient(supabaseUrl as string, supabaseServiceKey as string);

    const starterPriceId = import.meta.env.PUBLIC_PADDLE_STARTER_PRICE_ID || import.meta.env.PADDLE_STARTER_PRICE_ID || process.env.PUBLIC_PADDLE_STARTER_PRICE_ID || process.env.PADDLE_STARTER_PRICE_ID;
    const growthPriceId = import.meta.env.PUBLIC_PADDLE_GROWTH_PRICE_ID || import.meta.env.PADDLE_GROWTH_PRICE_ID || process.env.PUBLIC_PADDLE_GROWTH_PRICE_ID || process.env.PADDLE_GROWTH_PRICE_ID;
    const proPriceId = import.meta.env.PUBLIC_PADDLE_PRO_PRICE_ID || import.meta.env.PADDLE_PRO_PRICE_ID || process.env.PUBLIC_PADDLE_PRO_PRICE_ID || process.env.PADDLE_PRO_PRICE_ID;

    const determinePlan = (priceId: string) => {
      if (priceId === starterPriceId) return 'starter';
      if (priceId === growthPriceId) return 'growth';
      if (priceId === proPriceId) return 'pro';
      return 'unknown';
    };

    if (eventType === 'subscription.created' || eventType === 'subscription.activated') {
      let userId = data.custom_data?.supabase_user_id;
      
      // Fallback: If missing (e.g. manual creation in Paddle Sandbox), try to find user by customer_id
      if (!userId && data.customer_id) {
        const { data: existingSub } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('paddle_customer_id', data.customer_id)
          .limit(1)
          .maybeSingle();
        if (existingSub?.user_id) {
          userId = existingSub.user_id;
        }
      }

      if (!userId) {
        console.error('No supabase_user_id found in custom_data and no existing customer match');
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
      const priceId = data.items?.[0]?.price?.id;
      const plan = determinePlan(priceId);

      const { error } = await supabase.from('subscriptions')
        .update({
          status: data.status === 'active' ? 'active' : data.status,
          current_period_end: data.current_billing_period?.ends_at,
          plan: plan,
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
      const subId = data.subscription_id;
      if (subId) {
        const { error } = await supabase.from('subscriptions')
          .update({
            status: 'active',
            updated_at: new Date().toISOString()
          })
          .eq('paddle_subscription_id', subId);
          
        if (error) {
          console.error('DB Update Error on Transaction:', error);
          return new Response(JSON.stringify({ error: 'Database write failed' }), { status: 500 });
        }
      }
      console.log(`Transaction completed: ${data.id}`);
    } else if (eventType === 'adjustment.created' || eventType === 'adjustment.updated') {
      if (data.action === 'refund' && data.status === 'approved') {
        const subId = data.subscription_id;
        if (subId) {
          const { error } = await supabase.from('subscriptions')
            .update({
              status: 'canceled',
              plan: 'starter',
              updated_at: new Date().toISOString()
            })
            .eq('paddle_subscription_id', subId);
            
          if (error) {
            console.error('DB Update Error on Refund:', error);
            return new Response(JSON.stringify({ error: 'Database write failed' }), { status: 500 });
          }
          console.log(`Refund processed: Downgraded sub ${subId} to starter/canceled`);
        } else {
          console.log(`Refund processed, but no subscription_id attached (tx: ${data.transaction_id})`);
        }
      } else {
        console.log(`Adjustment received but skipped (action: ${data.action}, status: ${data.status})`);
      }
    } else {
      console.log(`Unhandled event type: ${eventType}`);
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (err) {
    console.error('Webhook error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
};
