import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const projectId = url.searchParams.get('project_id');

    if (!projectId) {
      return new Response(JSON.stringify({ error: "Missing project_id" }), { status: 400 });
    }

    if (projectId === 'guest_project') {
      return new Response(JSON.stringify({
        alerts: [
          { id: 'al_1', type: 'error', message: 'Trace tr_124 scored 45 (below threshold 70).', sub: '10 mins ago • Quality Drop' },
          { id: 'al_2', type: 'warning', message: 'Memory key "api_keys" has not been updated in 3 days.', sub: '1 hour ago • Stale Memory' },
          { id: 'al_3', type: 'error', message: 'Conflicting values set for "user_preferences".', sub: '2 hours ago • Contradiction' },
          { id: 'al_4', type: 'info', message: 'API latency spiked to 4.5s for trace tr_122.', sub: '5 hours ago • Performance' },
        ]
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    const supabaseUrl = import.meta.env.SUPABASE_URL;
    const supabaseKey = import.meta.env.SUPABASE_SERVICE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: alerts, error } = await supabase
      .from('alerts')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return new Response(JSON.stringify({ alerts: alerts || [] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
