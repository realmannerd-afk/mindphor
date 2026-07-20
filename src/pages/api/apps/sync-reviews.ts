import type { APIRoute } from "astro";
import { getSupabaseClient } from "../../../lib/supabase";
import { scrapePlayStoreReviews } from "../../../lib/scrapers/playstore";
import { classifySentiment } from "../../../lib/classifier";
import { generateAlerts } from "../../../lib/generateAlerts";

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const url = new URL(request.url);
    const appId = url.searchParams.get('app_id');

    if (!appId) {
      return new Response(JSON.stringify({ error: "Missing app_id" }), { status: 400 });
    }

    const supabase = getSupabaseClient(cookies);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    // Fetch the app details
    const { data: appData, error: appError } = await supabase
      .from('apps')
      .select('id, play_store_id, alert_threshold')
      .eq('id', appId)
      .eq('user_id', user.id)
      .single();

    if (appError || !appData || !appData.play_store_id) {
      return new Response(JSON.stringify({ error: "App not found or missing Play Store ID" }), { status: 404 });
    }

    // Fetch a massive batch of reviews (up to 3000) so we grab as much historical data as possible
    let reviews: any[] = [];
    try {
      reviews = await scrapePlayStoreReviews(appData.play_store_id, 1500);
    } catch (e) {
      console.error("Scraper error:", e);
      return new Response(JSON.stringify({ error: "Scraper failed" }), { status: 500 });
    }

    let inserted = 0;
    let skipped = 0;
    const newFeedbackIds: string[] = [];

    // Reviews are sorted newest first from the scraper.
    for (const review of reviews) {
      const sentiment = classifySentiment(review.content);
      
      const { data: existing } = await supabase
        .from('feedback')
        .select('id')
        .eq('app_id', appId)
        .eq('content', review.content)
        .eq('date', review.date.toISOString())
        .maybeSingle();
        
      if (existing) {
        skipped++;
        continue;
      }
      
      const { data: newRow, error: insertError } = await supabase
        .from('feedback')
        .insert({
          app_id: appId,
          user_id: user.id,
          source: 'Google Play',
          content: review.content,
          sentiment,
          date: review.date.toISOString(),
          author: review.author ?? null,
          url: review.url ?? null,
          score: review.score ?? null,
          version: review.version ?? null
        })
        .select('id')
        .single();
        
      if (!insertError && newRow) {
        inserted++;
        newFeedbackIds.push(newRow.id);
      }
    }

    // Generate alerts for new feedback
    const alertsGenerated = await generateAlerts(appId, appData.alert_threshold || 10, newFeedbackIds);

    return new Response(JSON.stringify({ success: true, inserted, skipped, total_fetched: reviews.length, alertsGenerated }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error: any) {
    console.error("Sync error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
