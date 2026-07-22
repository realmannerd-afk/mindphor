import type { APIRoute } from "astro";
import { getSupabaseClient } from "../../lib/supabase";
import { getUserPlanLimits } from "../../lib/planLimits";
import crypto from "crypto";

export const GET: APIRoute = async ({ request, cookies }) => {
  const supabase = getSupabaseClient(cookies);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { data: keys, error } = await supabase
    .from("api_keys")
    .select("id, key_prefix, name, created_at, last_used_at, revoked")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return new Response(error.message, { status: 500 });

  return new Response(JSON.stringify({ keys }), { status: 200 });
};

export const POST: APIRoute = async ({ request, cookies }) => {
  const supabase = getSupabaseClient(cookies);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const planData = await getUserPlanLimits(cookies);
  if (planData.plan !== 'pro') {
    return new Response(JSON.stringify({ error: "Pro plan required for API access" }), { status: 403 });
  }

  const { name } = await request.json();

  const rawKey = `mp_${crypto.randomBytes(32).toString("hex")}`;
  const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
  const keyPrefix = rawKey.substring(0, 11); // mp_ + 8 chars

  const { error } = await supabase
    .from("api_keys")
    .insert({
      user_id: user.id,
      key_hash: keyHash,
      key_prefix: keyPrefix,
      name: name || "Default Key"
    });

  if (error) return new Response(error.message, { status: 500 });

  return new Response(JSON.stringify({ rawKey }), { status: 201 });
};

export const DELETE: APIRoute = async ({ request, cookies }) => {
  const supabase = getSupabaseClient(cookies);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { id } = await request.json();
  
  const { error } = await supabase
    .from("api_keys")
    .update({ revoked: true })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return new Response(error.message, { status: 500 });

  return new Response(JSON.stringify({ success: true }), { status: 200 });
};
