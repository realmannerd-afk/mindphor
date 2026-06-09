import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const projectId = url.searchParams.get('project_id');
    const userId = url.searchParams.get('user_id');

    if (!projectId) {
      return new Response(JSON.stringify({ error: "Missing project_id" }), { status: 400 });
    }


    const supabaseUrl = import.meta.env.SUPABASE_URL;
    const supabaseKey = import.meta.env.SUPABASE_SERVICE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Auto-mark stale keys
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    // Find keys to mark stale
    const { data: keysToStale, error: selectStaleError } = await supabase
      .from('memory_keys')
      .select('*')
      .eq('project_id', projectId)
      .eq('is_stale', false)
      .lt('updated_at', twentyFourHoursAgo);

    if (selectStaleError) throw selectStaleError;

    if (keysToStale && keysToStale.length > 0) {
      // Mark them as stale
      const { error: updateStaleError } = await supabase
        .from('memory_keys')
        .update({ is_stale: true })
        .in('id', keysToStale.map(k => k.id));
      
      if (updateStaleError) throw updateStaleError;

      // Insert alerts for newly stale keys
      const alertsToInsert = keysToStale.map(k => ({
        project_id: projectId,
        type: 'stale_memory',
        message: `Memory key "${k.key}" for user ${k.user_id} has not been updated in over 24 hours`,
        severity: 'warning'
      }));

      const { error: alertError } = await supabase.from('alerts').insert(alertsToInsert);
      if (alertError) throw alertError;
    }

    // 2. Fetch memory keys
    let query = supabase
      .from('memory_keys')
      .select('*', { count: 'exact' })
      .eq('project_id', projectId)
      .order('updated_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    } else {
      query = query.limit(100);
    }

    const { data: keys, count, error } = await query;
    if (error) throw error;

    const staleCount = keys ? keys.filter(k => k.is_stale).length : 0;

    return new Response(JSON.stringify({ 
      keys: keys || [],
      total: count || 0,
      stale_count: staleCount
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { api_key, user_id, key, value } = body;

    if (!api_key || !user_id || !key || value === undefined) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
    }

    const supabaseUrl = import.meta.env.SUPABASE_URL;
    const supabaseKey = import.meta.env.SUPABASE_SERVICE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Validate api_key against projects table
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('api_key', api_key)
      .single();

    if (projectError || !project) {
      return new Response(JSON.stringify({ error: "Invalid API key" }), { status: 401 });
    }

    const projectId = project.id;

    // 3. Check if same key already exists
    const { data: existingKey, error: existingKeyError } = await supabase
      .from('memory_keys')
      .select('value, updated_at')
      .eq('project_id', projectId)
      .eq('user_id', user_id)
      .eq('key', key)
      .maybeSingle();

    if (existingKeyError && existingKeyError.code !== 'PGRST116') {
      throw existingKeyError;
    }

    // 4. Contradiction detection
    if (existingKey && existingKey.value !== value) {
      const updatedTime = new Date(existingKey.updated_at).getTime();
      const oneHourAgo = Date.now() - 60 * 60 * 1000;
      
      if (updatedTime > oneHourAgo) {
        const { error: alertError } = await supabase
          .from('alerts')
          .insert({
            project_id: projectId,
            type: 'contradiction',
            message: `Conflicting values for memory key "${key}" for user ${user_id}. Old: "${existingKey.value}" New: "${value}"`,
            severity: 'warning'
          });
        if (alertError) throw alertError;
      }
    }

    // 5. Upsert into memory_keys
    const { error: upsertError } = await supabase
      .from('memory_keys')
      .upsert({
        project_id: projectId,
        user_id: user_id,
        key: key,
        value: value,
        updated_at: new Date().toISOString(),
        is_stale: false
      }, { onConflict: 'project_id,user_id,key' });

    if (upsertError) throw upsertError;

    // 6. Return success
    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { api_key, user_id, key } = body;

    if (!api_key || !user_id) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
    }

    const supabaseUrl = import.meta.env.SUPABASE_URL;
    const supabaseKey = import.meta.env.SUPABASE_SERVICE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Validate api_key
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('api_key', api_key)
      .single();

    if (projectError || !project) {
      return new Response(JSON.stringify({ error: "Invalid API key" }), { status: 401 });
    }

    const projectId = project.id;

    // 2. Delete
    let query = supabase
      .from('memory_keys')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', user_id);

    if (key) {
      query = query.eq('key', key);
    }

    const { count, error: deleteError } = await query;
    if (deleteError) throw deleteError;

    // 3. Return success
    return new Response(JSON.stringify({ success: true, deleted: count || 0 }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
