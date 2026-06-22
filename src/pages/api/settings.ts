import type { APIRoute } from "astro";
import { getSupabaseClient } from "../../lib/supabase";

export const PATCH: APIRoute = async ({ request, cookies }) => {
  const supabase = getSupabaseClient(cookies);

  // Check auth
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData?.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const body = await request.json();
    const updates: Record<string, any> = {};

    if (body.alert_threshold !== undefined) {
      updates.alert_threshold = body.alert_threshold;
    }
    if (body.retention_days !== undefined) {
      updates.retention_days = body.retention_days;
    }
    if (body.memory_prune_limit !== undefined) {
      updates.memory_prune_limit = body.memory_prune_limit;
    }
    if (body.name !== undefined) {
      updates.name = body.name;
    }

    if (Object.keys(updates).length === 0) {
      return new Response(JSON.stringify({ error: "No fields to update" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const { error: updateError } = await supabase
      .from('apps')
      .update(updates)
      .eq('user_id', authData.user.id);

    if (updateError) {
      console.error("Settings update error:", updateError);
      return new Response(JSON.stringify({ error: "Failed to update settings" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (err: any) {
    console.error("Settings patch error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
