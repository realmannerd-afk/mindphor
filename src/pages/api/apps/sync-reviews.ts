import type { APIRoute } from "astro";
import { getSupabaseClient } from "../../../lib/supabase";
import { scrapePlayStoreReviews } from "../../../lib/scrapers/playstore";
import { scrapeAppStoreReviews } from "../../../lib/scrapers/appstore";
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
      .select('id, play_store_url, app_store_url, alert_threshold')
      .eq('id', appId)
      .eq('user_id', user.id)
      .single();

    if (appError || !appData) {
      return new Response(JSON.stringify({ error: "App not found" }), { status: 404 });
    }

    if (!appData.play_store_url && !appData.app_store_url) {
      return new Response(JSON.stringify({ error: "No store URLs configured for this app" }), { status: 400 });
    }

    // Fetch a massive batch of reviews (up to 3000) so we grab as much historical data as possible
    let reviews: any[] = [];
    
    // Play Store ingestion
    if (appData.play_store_url) {
      try {
        const playStoreReviews = await scrapePlayStoreReviews(appData.play_store_url, 1500);
        reviews = [...reviews, ...playStoreReviews];
      } catch (e) {
        console.error("Play Store Scraper error:", e);
      }
    }

    // App Store ingestion
    if (appData.app_store_url) {
      try {
        // Extract the numerical App ID from an Apple App Store URL (e.g. id284882215)
        const match = appData.app_store_url.match(/id(\d+)/i);
        const appleId = match ? match[1] : appData.app_store_url;
        // Extract country code from URL if present
        let country = "in";
        const countryMatch = appData.app_store_url.match(/apple\.com\/([a-z]{2})\/app/i);
        if (countryMatch) {
          country = countryMatch[1].toLowerCase();
        }

        const appStoreReviews = await scrapeAppStoreReviews(appId, appleId, 1500, country);
        reviews = [...reviews, ...appStoreReviews];
      } catch (e) {
        console.error("App Store Scraper error:", e);
      }
    }

    if (reviews.length === 0) {
      console.warn("No reviews returned from any scrapers.");
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
          source: review.source || 'Google Play',
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
    const alertsGenerated = await generateAlerts({
      supabase,
      appId,
      userId: user.id,
      alertThreshold: appData.alert_threshold || 10,
      newFeedbackIds
    });

    return new Response(JSON.stringify({ success: true, inserted, skipped, total_fetched: reviews.length, alertsGenerated }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error: any) {
    console.error("Sync error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
