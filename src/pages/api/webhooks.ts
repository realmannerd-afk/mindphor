import type { APIRoute } from "astro";
import { getSupabaseClient } from "../../lib/supabase";
import { getUserPlanLimits } from "../../lib/planLimits";
import crypto from "crypto";

export const GET: APIRoute = async ({ request, cookies }) => {
  const supabase = getSupabaseClient(cookies);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { data: webhooks, error } = await supabase
    .from("integration_webhooks")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return new Response(error.message, { status: 500 });

  return new Response(JSON.stringify({ webhooks }), { status: 200 });
};

export const POST: APIRoute = async ({ request, cookies }) => {
  const supabase = getSupabaseClient(cookies);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const planData = await getUserPlanLimits(cookies);
  if (planData.plan !== 'pro' && planData.plan !== 'growth') {
    return new Response(JSON.stringify({ error: "Upgrade required" }), { status: 403 });
  }

  const { platform, webhook_url } = await request.json();

  if (platform === 'custom' && planData.plan !== 'pro') {
    return new Response(JSON.stringify({ error: "Pro plan required for Custom Webhooks" }), { status: 403 });
  }

  let secret = null;
  if (platform === 'custom') {
    secret = crypto.randomBytes(32).toString("hex");
  }

  const { error } = await supabase
    .from("integration_webhooks")
    .insert({
      user_id: user.id,
      platform,
      webhook_url,
      secret
    });

  if (error) return new Response(error.message, { status: 500 });

  return new Response(JSON.stringify({ success: true }), { status: 201 });
};

export const PATCH: APIRoute = async ({ request, cookies }) => {
  const supabase = getSupabaseClient(cookies);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { id, enabled } = await request.json();

  const { error } = await supabase
    .from("integration_webhooks")
    .update({ enabled })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return new Response(error.message, { status: 500 });

  return new Response(JSON.stringify({ success: true }), { status: 200 });
};

export const DELETE: APIRoute = async ({ request, cookies }) => {
  const supabase = getSupabaseClient(cookies);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { id } = await request.json();

  const { error } = await supabase
    .from("integration_webhooks")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return new Response(error.message, { status: 500 });

  return new Response(JSON.stringify({ success: true }), { status: 200 });
};
