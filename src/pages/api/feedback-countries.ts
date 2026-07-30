import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const appId = url.searchParams.get('app_id');

    if (!appId) {
      return new Response(JSON.stringify({ error: "Missing app_id" }), { status: 400 });
    }

    const supabase = createClient(
      import.meta.env.SUPABASE_URL,
      import.meta.env.SUPABASE_SERVICE_KEY
    );

    // Fetch distinct non-null country values for this app
    const { data, error } = await supabase
      .from('feedback')
      .select('country')
      .eq('app_id', appId)
      .not('country', 'is', null)
      .not('country', 'eq', '');

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    const unique = [...new Set((data || []).map((r: any) => r.country).filter(Boolean))];
    unique.sort();

    return new Response(JSON.stringify({ countries: unique }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
