import type { APIRoute } from "astro";
import { getSupabaseClient } from "../../lib/supabase";

export const GET: APIRoute = async ({ request, cookies }) => {
  const supabase = getSupabaseClient(cookies);

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData?.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const { data: projects, error } = await supabase
      .from('projects')
      .select('id, name, api_key, created_at')
      .eq('user_id', authData.user.id)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, projects }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

export const POST: APIRoute = async ({ request, cookies }) => {
  const supabase = getSupabaseClient(cookies);

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData?.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const body = await request.json();
    if (!body.name || body.name.trim().length === 0) {
      return new Response(JSON.stringify({ error: "App name is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Generate secure random API key
    const rawKey = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '').substring(0, 16);
    const newApiKey = `mp_live_${rawKey}`;

    const { data: project, error } = await supabase.from('projects').insert({
      name: body.name.trim().substring(0, 50),
      user_id: authData.user.id,
      api_key: newApiKey,
      retention_days: 30,
      memory_prune_limit: 5000,
      alert_threshold: 70
    }).select('id, name, api_key, created_at').single();

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, project }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

export const DELETE: APIRoute = async ({ request, cookies }) => {
  const supabase = getSupabaseClient(cookies);

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData?.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const body = await request.json();
    if (!body.id) {
      return new Response(JSON.stringify({ error: "Project ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Delete the project (Supabase RLS or user_id check ensures safety)
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', body.id)
      .eq('user_id', authData.user.id);

    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
