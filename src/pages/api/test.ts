import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";

export const GET: APIRoute = async () => {
  const supabaseUrl = import.meta.env.SUPABASE_URL;
  const supabaseKey = import.meta.env.SUPABASE_SERVICE_KEY;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase
    .from('traces')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  return new Response(JSON.stringify({ data, error }), {
    headers: { "Content-Type": "application/json" }
  });
};
