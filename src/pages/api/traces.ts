import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const projectId = url.searchParams.get('project_id');

    if (!projectId) {
      return new Response(JSON.stringify({ error: "Missing project_id" }), { status: 400, headers: { "Content-Type": "application/json" } });
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
