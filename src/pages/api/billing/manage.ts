import type { APIRoute } from "astro";
import { getSupabaseClient } from "../../../lib/supabase";

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const supabase = getSupabaseClient(cookies);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const { action, priceId } = await request.json();
    
    // Fetch user's subscription
    const { data: subs } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1);

    const sub = subs?.[0];

    if (!sub || !sub.paddle_subscription_id) {
      return new Response(JSON.stringify({ error: "No active subscription found" }), { status: 400 });
    }

    const PADDLE_API_KEY = import.meta.env.PADDLE_API_KEY || process.env.PADDLE_API_KEY;
    
    if (!PADDLE_API_KEY) {
      return new Response(JSON.stringify({ error: "Paddle API Key is missing. Please set PADDLE_API_KEY in .env" }), { status: 500 });
    }

    const paddleApiUrl = import.meta.env.PADDLE_API_URL || process.env.PADDLE_API_URL;
    if (!paddleApiUrl) {
      return new Response(JSON.stringify({ error: "Paddle API URL is missing. Please set PADDLE_API_URL in .env" }), { status: 500 });
    }

    if (action === 'cancel') {
      // Cancel subscription at the end of the billing period
      const response = await fetch(`${paddleApiUrl}/subscriptions/${sub.paddle_subscription_id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${PADDLE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          scheduled_change: {
            action: 'cancel',
            effective_at: 'next_billing_period'
          }
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        return new Response(JSON.stringify({ error: result.error?.message || 'Failed to cancel subscription in Paddle' }), { status: response.status });
      }

      return new Response(JSON.stringify({ success: true, data: result.data }), { status: 200 });

    } else if (action === 'revoke_cancel') {
      const response = await fetch(`${paddleApiUrl}/subscriptions/${sub.paddle_subscription_id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${PADDLE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          scheduled_change: null
        })
      });

      const result = await response.json();
      if (!response.ok) {
        return new Response(JSON.stringify({ error: result.error?.message || 'Failed to revoke cancellation in Paddle' }), { status: response.status });
      }

      return new Response(JSON.stringify({ success: true, data: result.data }), { status: 200 });

    } else if (action === 'update') {
      if (!priceId) {
        return new Response(JSON.stringify({ error: "Missing priceId for plan change" }), { status: 400 });
      }

      // Update subscription (change plan) deferred to next billing cycle
      const response = await fetch(`${paddleApiUrl}/subscriptions/${sub.paddle_subscription_id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${PADDLE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          proration_billing_mode: 'prorated_next_billing_period',
          items: [{
            price_id: priceId,
            quantity: 1
          }]
        })
      });

      const result = await response.json();

      if (!response.ok) {
        return new Response(JSON.stringify({ error: result.error?.message || 'Failed to update subscription in Paddle' }), { status: response.status });
      }

      return new Response(JSON.stringify({ success: true, data: result.data }), { status: 200 });

    } else if (action === 'pause') {
       // optional if needed
       return new Response(JSON.stringify({ error: "Not implemented" }), { status: 400 });
    } else {
      return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400 });
    }

  } catch (error: any) {
    console.error('Billing update error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
