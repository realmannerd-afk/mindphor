import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";

export const GET: APIRoute = async () => {
  const supabaseUrl = import.meta.env.SUPABASE_URL;
  const supabaseKey = import.meta.env.SUPABASE_SERVICE_KEY;
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const { data: comps } = await supabase.from('competitors').select('id');
  if (comps && comps.length > 0) {
    for (const comp of comps) {
      await supabase.from('competitors').update({ last_changelog_text: null }).eq('id', comp.id);
      await supabase.from('feedback').delete().eq('competitor_id', comp.id).eq('source', 'Product Update');
    }
    return new Response(JSON.stringify({ success: true, message: `Reset ${comps.length} competitor(s)` }), { status: 200 });
  }
  return new Response(JSON.stringify({ error: 'No competitors found in the database.' }), { status: 404 });
};
