import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    import.meta.env.SUPABASE_URL,
    import.meta.env.SUPABASE_SERVICE_KEY
  );
}

// GET /api/alerts?app_id=xxx — fetch all alerts for an app
export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const appId = url.searchParams.get('app_id');
    if (!appId) {
      return new Response(JSON.stringify({ error: "Missing app_id" }), { status: 400 });
    }



    const { data, error } = await getSupabase()
      .from('alerts')
      .select('*')
      .eq('app_id', appId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return new Response(JSON.stringify({ alerts: data || [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};

// PATCH /api/alerts — mark alerts as read
// Body: { ids: string[] }         → mark specific alerts as read
// Body: { app_id: string, all: true } → mark ALL alerts for app as read
export const PATCH: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const supabase = getSupabase();

    if (body.all && body.app_id) {
      // Mark all for this app
      const { error } = await supabase
        .from('alerts')
        .update({ is_read: true })
        .eq('app_id', body.app_id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, updated: 'all' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (body.ids && Array.isArray(body.ids) && body.ids.length > 0) {
      const { error } = await supabase
        .from('alerts')
        .update({ is_read: true })
        .in('id', body.ids);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, updated: body.ids.length }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: "Provide ids[] or {app_id, all:true}" }), { status: 400 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};

// DELETE /api/alerts — delete specific alerts
// Body: { ids: string[] }
export const DELETE: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const supabase = getSupabase();

    if (!body.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
      return new Response(JSON.stringify({ error: "Provide ids[] to delete" }), { status: 400 });
    }

    const { error } = await supabase
      .from('alerts')
      .delete()
      .in('id', body.ids);

    if (error) throw error;
    return new Response(JSON.stringify({ success: true, deleted: body.ids.length }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
