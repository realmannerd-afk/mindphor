import type { APIRoute } from "astro";
import { getSupabaseClient } from "../../lib/supabase";
import { generateCompetitorRecommendations } from "../../lib/ai/competitorSummary";

export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    const url = new URL(request.url);
    const competitorId = url.searchParams.get("competitor_id");

    if (!competitorId) {
      return new Response(JSON.stringify({ error: "Missing competitor_id" }), { status: 400 });
    }

    // Guest mode bypass

    const supabase = getSupabaseClient(cookies);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const { data: fb } = await supabase
      .from('feedback')
      .select('*')
      .eq('competitor_id', competitorId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!fb || fb.length === 0) {
      return new Response(JSON.stringify({ recommendations: [] }));
    }

    const recommendations = await generateCompetitorRecommendations(fb);

    return new Response(JSON.stringify({ recommendations }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error: any) {
    console.error("AI Recommendations API error:", error);
    return new Response(JSON.stringify({ error: error.message || "Failed to generate recommendations." }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
