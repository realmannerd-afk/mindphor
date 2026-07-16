import type { APIRoute } from "astro";
import { getSupabaseClient } from "../../../lib/supabase";
import { scrapePlayStoreReviews } from "../../../lib/scrapers/playstore";
import { scrapeAppStoreReviews } from "../../../lib/scrapers/appstore";
import { scrapeReddit } from "../../../lib/scrapers/reddit";
import { classifySentiment } from "../../../lib/classifier";
import { generateAlerts } from "../../../lib/generateAlerts";

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const supabase = getSupabaseClient(cookies);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const body = await request.json();
    const { app_id, target_type, target_id, store, store_identifier } = body;

    // Validate ownership
    const { data: appData, error: appError } = await supabase
      .from('apps')
      .select('id, alert_threshold')
      .eq('id', app_id)
      .eq('user_id', user.id)
      .single();

    if (appError || !appData) {
      return new Response(JSON.stringify({ error: "App not found or unauthorized" }), { status: 403 });
    }

    if (!store_identifier) {
      return new Response(JSON.stringify({ inserted: 0, skipped: 0, total_fetched: 0 }), { status: 200 });
    }

    let reviews: any[] = [];
    let sourceName = '';

    try {
      const cleanId = store_identifier.trim();
      if (store === 'playstore') {
        reviews = await scrapePlayStoreReviews(cleanId);
        sourceName = 'Google Play';
      } else if (store === 'appstore') {
        reviews = await scrapeAppStoreReviews(cleanId);
        sourceName = 'App Store';
      } else if (store === 'reddit') {
        reviews = await scrapeReddit(cleanId);
        sourceName = 'Reddit';
      } else {
        return new Response(JSON.stringify({ error: "Invalid store type" }), { status: 400 });
      }
    } catch (e) {
      console.error(`Scraper error for ${store}:`, e);
      return new Response(JSON.stringify({ inserted: 0, skipped: 0, total_fetched: 0 }), { status: 200 });
    }

    let inserted = 0;
    let skipped = 0;
    const newFeedbackIds: string[] = [];

    for (const review of reviews) {
      const sentiment = classifySentiment(review.content);
      const competitor_id = target_type === 'competitor' ? target_id : null;
      
      const { data: existing } = await supabase
        .from('feedback')
        .select('id')
        .eq('app_id', app_id)
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
          app_id,
          user_id: user.id,
          competitor_id,
          source: sourceName,
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
      } else if (insertError) {
        console.error("Insert error:", insertError);
      }
    }

    // Generate alerts for newly inserted feedback
    await generateAlerts({
      supabase,
      appId: app_id,
      userId: user.id,
      alertThreshold: appData.alert_threshold ?? 70,
      newFeedbackIds,
    });

    return new Response(JSON.stringify({ 
      inserted, 
      skipped, 
      total_fetched: reviews.length 
    }), { status: 200 });

  } catch (err: any) {
    console.error("API error in ingest/reviews:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
