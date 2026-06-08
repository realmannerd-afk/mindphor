import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const projectId = url.searchParams.get('project_id');

    if (!projectId) {
      return new Response(JSON.stringify({ error: "Missing project_id" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }
    if (projectId === 'guest_project') {
      return new Response(JSON.stringify({
        traces: [
          { id: 'tr_8f9a21', trace_id: 'tr_8f9a21', input: 'Extract JSON parameters from this invoice', model: 'gpt-4o', status: 'active', score: 95 },
          { id: 'tr_3b1c88', trace_id: 'tr_3b1c88', input: 'Write a python script to parse CSV files', model: 'claude-3.5-sonnet', status: 'active', score: 88 },
          { id: 'tr_7d4e99', trace_id: 'tr_7d4e99', input: 'Summarize the latest product requirements', model: 'gpt-4o', status: 'stale', score: 62 },
          { id: 'tr_1a2b3c', trace_id: 'tr_1a2b3c', input: 'Generate a SQL query for daily active users', model: 'llama-3-70b', status: 'active', score: 45 },
          { id: 'tr_9f8e7d', trace_id: 'tr_9f8e7d', input: 'Debug this React useEffect infinite loop', model: 'gpt-4o', status: 'active', score: null },
        ]
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    const supabaseUrl = import.meta.env.SUPABASE_URL;
    const supabaseKey = import.meta.env.SUPABASE_SERVICE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: traces, error } = await supabase
      .from('traces')
      .select('id, trace_id, input, model, status, score, created_at')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    let filteredTraces = traces || [];
    filteredTraces = filteredTraces.filter(t => !t.input.toLowerCase().includes('french'));


    return new Response(JSON.stringify({ traces: filteredTraces }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
