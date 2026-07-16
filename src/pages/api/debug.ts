import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";

export const GET: APIRoute = async () => {
  const supabase = createClient(
    import.meta.env.SUPABASE_URL,
    import.meta.env.SUPABASE_SERVICE_KEY
  );

  const { data, error } = await supabase
    .from('feedback')
    .select('id, content, source, author, created_at, app_id, score')
    .order('created_at', { ascending: false })
    .limit(5);

  return new Response(JSON.stringify({ data, error: error?.message }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
