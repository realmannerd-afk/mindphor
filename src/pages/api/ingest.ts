import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";
import { scoreTrace } from "../../lib/scorer";

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const { api_key, input, output, model, user_id, latency_ms } = body;

    const supabaseUrl = import.meta.env.SUPABASE_URL;
    const supabaseKey = import.meta.env.SUPABASE_SERVICE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Validate api_key
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('api_key', api_key)
      .single();

    if (!project) {
      return new Response(JSON.stringify({ error: "Invalid API key" }), { status: 401, headers: { "Content-Type": "application/json" } });
    }

    const trace_id = "tr_" + Math.floor(100000 + Math.random() * 900000).toString();

    // Insert trace
    const { error } = await supabase.from('traces').insert({
      project_id: project.id,
      trace_id,
      user_id,
      input,
      output,
      model,
      latency_ms,
      status: "active"
    });

    if (error) {
      return new Response(JSON.stringify({ error: "Failed to insert trace", details: error }), { status: 500, headers: { "Content-Type": "application/json" } });
    }

    // Await the scorer to ensure the serverless function doesn't terminate 
    // before the Cerebras response is received and the database is updated.
    await scoreTrace(
      trace_id,
      project.id,
      body.input,
      body.output,
      body.memory_snapshot ?? undefined
    ).catch(console.error);

    return new Response(JSON.stringify({ success: true, trace_id }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
};
