import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";

export const GET: APIRoute = async () => {
  const supabase = createClient(
    import.meta.env.SUPABASE_URL,
    import.meta.env.SUPABASE_SERVICE_KEY
  );

  const { data, error } = await supabase
    .from('feedback')
    .delete()
    .ilike('content', '%Love the new UI update%');
    
  const { data: d2, error: e2 } = await supabase
    .from('feedback')
    .delete()
    .ilike('content', '%App crashes when I try to upload a photo%');
    
  const { data: d3, error: e3 } = await supabase
    .from('feedback')
    .delete()
    .ilike('content', '%does the job but could use a dark mode%');
    
  const { data: d4, error: e4 } = await supabase
    .from('feedback')
    .delete()
    .ilike('content', '%Customer support was also very helpful%');
    
  const { data: d5, error: e5 } = await supabase
    .from('feedback')
    .delete()
    .ilike('author', 'Alex T.');

  const { data: d6, error: e6 } = await supabase
    .from('feedback')
    .delete()
    .in('source', ['playstore', 'appstore']); // If they used lowercase

  return new Response(JSON.stringify({ success: true, error: error?.message }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
