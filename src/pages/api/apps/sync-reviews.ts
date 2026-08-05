import type { APIRoute } from "astro";
import { getSupabaseClient } from "../../../lib/supabase";
import { scrapePlayStoreReviews } from "../../../lib/scrapers/playstore";
import { scrapeAppStoreReviews } from "../../../lib/scrapers/appstore";
import { classifySentiment } from "../../../lib/classifier";
import { generateAlerts } from "../../../lib/generateAlerts";



export const POST: APIRoute = async ({ request, cookies }) => {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: any) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch (e) { } // Stream might be closed
      };

      try {
        const url = new URL(request.url);
        const appId = url.searchParams.get('app_id');
        const limitParam = url.searchParams.get('limit');
        const countriesParam = url.searchParams.get('countries');
        const sourceParam = url.searchParams.get('source');
        const sinceDateParam = url.searchParams.get('sinceDate');
        const fetchLimit = limitParam ? parseInt(limitParam, 10) : 50;
        const sinceDate = sinceDateParam ? new Date(sinceDateParam) : undefined;

        if (!appId) {
          sendEvent({ error: "Missing app_id" });
          controller.close();
          return;
        }

        const supabase = getSupabaseClient(cookies);
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          sendEvent({ error: "Unauthorized" });
          controller.close();
          return;
        }

        const { data: appData, error: appError } = await supabase
          .from('apps')
          .select('id, play_store_url, app_store_url, alert_threshold')
          .eq('id', appId)
          .eq('user_id', user.id)
          .single();

        if (appError || !appData) {
          sendEvent({ error: "App not found" });
          controller.close();
          return;
        }

        if (!appData.play_store_url && !appData.app_store_url) {
          sendEvent({ error: "No store URLs configured for this app" });
          controller.close();
          return;
        }

        const { data: sub } = await supabase
          .from('subscriptions')
          .select('status')
          .eq('user_id', user.id)
          .single();

        if (sub?.status !== 'active') {
          sendEvent({ error: 'An active subscription is required to sync reviews.' });
          controller.close();
          return;
        }

        let reviews: any[] = [];
        
        if (appData.play_store_url && (!sourceParam || sourceParam === 'playstore' || sourceParam === 'both')) {
          sendEvent({ status: 'scraping', message: 'Scraping Google Play Store...' });
          try {
            const playStoreReviews = await scrapePlayStoreReviews(appData.play_store_url, fetchLimit, sinceDate);
            reviews = [...reviews, ...playStoreReviews];
          } catch (e) {
            console.error("Play Store Scraper error:", e);
          }
        }

        if (appData.app_store_url && (!sourceParam || sourceParam === 'appstore' || sourceParam === 'both')) {
          sendEvent({ status: 'scraping', message: 'Scraping Apple App Store...' });
          try {
            const match = appData.app_store_url.match(/id(\d+)/i);
            const appleId = match ? match[1] : appData.app_store_url;

            let targetCountries = undefined;
            if (countriesParam && countriesParam !== 'all') {
              targetCountries = countriesParam.split(',').map(s => s.trim().toLowerCase()).filter(s => s.length === 2);
              if (targetCountries.length === 0) targetCountries = undefined;
            }
            if (!targetCountries) {
              try {
                const u = new URL(appData.app_store_url);
                const c = u.searchParams.get('countries');
                if (c) {
                  targetCountries = c.split(',').map(s => s.trim().toLowerCase()).filter(s => s.length === 2);
                  if (targetCountries.length === 0) targetCountries = undefined;
                }
              } catch(e) { }
            }

            const appStoreReviews = await scrapeAppStoreReviews(appId, appleId, fetchLimit, targetCountries, sinceDate);
            reviews = [...appStoreReviews, ...reviews];
          } catch (e: any) {
            console.error("App Store Scraper error:", e);
          }
        }

        if (reviews.length === 0) {
          sendEvent({ status: 'complete', inserted: 0, skipped: 0, total_fetched: 0, alertsGenerated: 0 });
          controller.close();
          return;
        }

        const dateRangeParam = url.searchParams.get('date_range');
        if (dateRangeParam && dateRangeParam !== 'all') {
          const now = new Date();
          if (dateRangeParam === 'today') {
            now.setUTCHours(0, 0, 0, 0);
          } else if (dateRangeParam === 'last_7') {
            now.setDate(now.getDate() - 7);
          } else if (dateRangeParam === 'last_30') {
            now.setDate(now.getDate() - 30);
          }
          const limitTime = now.getTime();
          reviews = reviews.filter(r => new Date(r.date).getTime() >= limitTime);
        }

        // Strictly bound the TOTAL combined reviews to the fetchLimit to exactly match user's UI selection
        reviews.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        if (reviews.length > fetchLimit) {
          reviews = reviews.slice(0, fetchLimit);
        }

        let inserted = 0;
        let skipped = 0;
        const newFeedbackIds: string[] = [];

        sendEvent({ status: 'inserting', current: 0, total: reviews.length });

        for (let i = 0; i < reviews.length; i++) {
          const review = reviews[i];
          const sentiment = classifySentiment(review.content);
          
          let existing = null;
          if (review.url) {
            const { data: urlMatch } = await supabase
              .from('feedback')
              .select('id')
              .eq('app_id', appId)
              .eq('url', review.url)
              .maybeSingle();
            existing = urlMatch;
          }
          
          if (!existing) {
            const { data: contentMatch } = await supabase
              .from('feedback')
              .select('id')
              .eq('app_id', appId)
              .eq('content', review.content)
              .eq('date', review.date.toISOString())
              .maybeSingle();
            existing = contentMatch;
          }
            
          if (existing) {
            skipped++;
          } else {
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
                version: review.version ?? null,
                country: review.country ?? null
              })
              .select('id')
              .single();
              
            if (!insertError && newRow) {
              inserted++;
              newFeedbackIds.push(newRow.id);
            }
          }
          
          // Send progress every item to keep UI ultra responsive
          sendEvent({ status: 'inserting', current: i + 1, total: reviews.length });
        }

        sendEvent({ status: 'analyzing', message: 'Analyzing new reviews for alerts...' });
        const alertsGenerated = await generateAlerts({
          supabase,
          appId,
          userId: user.id,
          alertThreshold: appData.alert_threshold || 10,
          newFeedbackIds
        });

        sendEvent({ status: 'complete', inserted, skipped, total_fetched: reviews.length, alertsGenerated });
        controller.close();
      } catch (error: any) {
        console.error("Sync error:", error);
        sendEvent({ error: error.message });
        controller.close();
      }
    }
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive"
    }
  });
};
