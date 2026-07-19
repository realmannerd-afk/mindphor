import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";
import { getUserPlanLimits } from "../../lib/planLimits";

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const appId = url.searchParams.get('app_id');
    const categoryParam = url.searchParams.get('user_id'); // Frontend passes category here
    const dateParam = url.searchParams.get('date');

    if (!appId) {
      return new Response(JSON.stringify({ error: "Missing app_id" }), { status: 400 });
    }



    let targetDate = new Date();
    if (dateParam) {
      targetDate = new Date(dateParam);
      targetDate.setUTCHours(23, 59, 59, 999);
    }





    const supabaseUrl = import.meta.env.SUPABASE_URL;
    const supabaseKey = import.meta.env.SUPABASE_SERVICE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    let dbCompetitors: any[] = [];
    let count = 0;

    try {
      let query = supabase
        .from('competitors')
        .select('*', { count: 'exact' })
        .eq('app_id', appId)
        .lte('created_at', targetDate.toISOString())
        .order('created_at', { ascending: false });

      if (categoryParam) {
        query = query.eq('name', categoryParam);
      } else {
        query = query.limit(100);
      }

      const result = await query;
      if (!result.error && result.data) {
        dbCompetitors = result.data;
        count = result.count || 0;
      }
    } catch (e) {
      console.warn("DB competitors fetch failed");
    }

    // Map to new schema shape
    let competitors = dbCompetitors.map(c => {
      const isStale = new Date(c.created_at) < twentyFourHoursAgo;
      return {
        id: c.id,
        name: c.name,
        domain: c.domain,
        description: c.description,
        status: c.status,
        is_stale: isStale,
        updated_at: c.created_at
      };
    });

    let finalTotal = count || 0;
    let finalStaleCount = competitors.filter(k => k.is_stale).length;

    return new Response(JSON.stringify({ 
      competitors: competitors,
      total: finalTotal,
      stale_count: finalStaleCount
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    const { app_id, name, domain, description } = body;

    if (!app_id || !domain || description === undefined) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
    }

    const { getSupabaseClient } = await import("../../lib/supabase");
    const supabase = getSupabaseClient(cookies);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const { data: app, error: appError } = await supabase
      .from('apps')
      .select('id')
      .eq('id', app_id)
      .eq('user_id', user.id)
      .single();

    if (appError || !app) {
      return new Response(JSON.stringify({ error: "Invalid app_id" }), { status: 401 });
    }

    // Check plan limits
    const { limits, plan } = await getUserPlanLimits(cookies);
    const { count, error: countError } = await supabase
      .from('competitors')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (count !== null && count >= limits.competitors) {
      return new Response(JSON.stringify({ 
        error: `Upgrade Required: Your current ${plan} plan is limited to ${limits.competitors} competitors total. Please upgrade to add more.` 
      }), { status: 403 });
    }

    const { error: upsertError } = await supabase
      .from('competitors')
      .insert({
        app_id: app.id,
        user_id: user.id,
        name: name || 'General',
        domain: domain,
        description: description,
        created_at: new Date().toISOString()
      });

    if (upsertError) throw upsertError;

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error("Error creating competitor:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { app_id, domain } = body;

    if (!app_id) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
    }

    const supabaseUrl = import.meta.env.SUPABASE_URL;
    const supabaseKey = import.meta.env.SUPABASE_SERVICE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: app, error: appError } = await supabase
      .from('apps')
      .select('id')
      .eq('id', app_id)
      .single();

    if (appError || !app) {
      return new Response(JSON.stringify({ error: "Invalid app_id" }), { status: 401 });
    }

    let query = supabase
      .from('competitors')
      .delete()
      .eq('app_id', app_id);

    if (domain) {
      query = query.eq('domain', domain);
    }

    const { count, error: deleteError } = await query;
    if (deleteError) throw deleteError;

    return new Response(JSON.stringify({ success: true, deleted: count || 0 }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
