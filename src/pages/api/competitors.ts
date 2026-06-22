import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";

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

    if (appId === 'guest_project') {
      return new Response(JSON.stringify({
        keys: [
          { id: 'mk_1', user_id: 'Productivity', key: 'linear.app', value: 'Launched a new inline roadmap editor and custom workflow states today.', is_stale: false, updated_at: new Date().toISOString() },
          { id: 'mk_2', user_id: 'Documentation', key: 'notion.so', value: 'Integrating deep spreadsheet autofills via GPT-4o-mini globally.', is_stale: false, updated_at: new Date(Date.now() - 3600000).toISOString() },
          { id: 'mk_3', user_id: 'Project Management', key: 'jira.com', value: 'Released a migration assistant tool for enterprise users.', is_stale: true, updated_at: new Date(Date.now() - 86400000 * 2).toISOString() },
          { id: 'mk_4', user_id: 'Collaboration', key: 'slack.com', value: 'Announced Slack canvas additions for automated workflows.', is_stale: true, updated_at: new Date(Date.now() - 86400000 * 3).toISOString() },
          { id: 'mk_5', user_id: 'Knowledge', key: 'obsidian.md', value: 'Launched new Sync pricing and canvas improvements.', is_stale: false, updated_at: new Date(Date.now() - 1800000).toISOString() },
          { id: 'mk_6', user_id: 'Note Taking', key: 'evernote.com', value: 'Acquired by Bending Spoons, subscription prices raised significantly.', is_stale: false, updated_at: new Date(Date.now() - 7200000).toISOString() },
          { id: 'mk_7', user_id: 'Knowledge', key: 'roamresearch.com', value: 'Still no major updates, users reportedly migrating to alternatives.', is_stale: true, updated_at: new Date(Date.now() - 86400000 * 5).toISOString() },
        ],
        total: 7,
        stale_count: 3
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
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

    // Map to frontend shape
    let finalKeys = dbCompetitors.map(c => {
      const isStale = new Date(c.created_at) < twentyFourHoursAgo;
      return {
        id: c.id,
        user_id: c.name, // Frontend uses user_id as category
        key: c.domain,
        value: c.description,
        is_stale: isStale,
        updated_at: c.created_at
      };
    });

    let finalTotal = count || 0;
    let finalStaleCount = finalKeys.filter(k => k.is_stale).length;

    if (finalKeys.length === 0) {
      finalKeys = [
        { id: 'mk_1', user_id: 'Productivity', key: 'linear.app', value: 'Launched a new inline roadmap editor and custom workflow states today.', is_stale: false, updated_at: new Date().toISOString() },
        { id: 'mk_2', user_id: 'Documentation', key: 'notion.so', value: 'Integrating deep spreadsheet autofills via GPT-4o-mini globally.', is_stale: false, updated_at: new Date(Date.now() - 3600000).toISOString() },
        { id: 'mk_3', user_id: 'Project Management', key: 'jira.com', value: 'Released a migration assistant tool for enterprise users.', is_stale: true, updated_at: new Date(Date.now() - 86400000 * 2).toISOString() },
        { id: 'mk_4', user_id: 'Collaboration', key: 'slack.com', value: 'Announced Slack canvas additions for automated workflows.', is_stale: true, updated_at: new Date(Date.now() - 86400000 * 3).toISOString() },
      ];
      if (categoryParam) {
        finalKeys = finalKeys.filter(k => k.user_id === categoryParam);
      }
      finalTotal = finalKeys.length;
      finalStaleCount = finalKeys.filter(k => k.is_stale).length;
    }

    return new Response(JSON.stringify({ 
      keys: finalKeys,
      total: finalTotal,
      stale_count: finalStaleCount
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { app_id, user_id, category, key, value } = body;
    // user_id here might be actual auth UUID, and category might be passed, but old API used user_id as category.
    // So let's fall back gracefully.

    if (!app_id || !key || value === undefined) {
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

    const { error: upsertError } = await supabase
      .from('competitors')
      .insert({
        app_id: app.id,
        user_id: user_id || '00000000-0000-0000-0000-000000000000', // fallback if none
        name: category || 'General',
        domain: key,
        description: value,
        created_at: new Date().toISOString()
      });

    if (upsertError) throw upsertError;

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { app_id, key } = body;

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

    if (key) {
      query = query.eq('domain', key);
    }

    const { count, error: deleteError } = await query;
    if (deleteError) throw deleteError;

    return new Response(JSON.stringify({ success: true, deleted: count || 0 }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
