import type { APIRoute } from "astro";
import { getSupabaseClient } from "../../lib/supabase";
import { scrapePlayStoreReviews } from "../../lib/scrapers/playstore";
import { classifySentiment } from "../../lib/classifier";

import { createClient } from "@supabase/supabase-js";

export const GET: APIRoute = async () => {
  try {
    const supabase = createClient(
      import.meta.env.PUBLIC_SUPABASE_URL,
      import.meta.env.SUPABASE_SERVICE_KEY
    );

    // Bypass RLS by using service role if available, but let's try with anonymous
    const { data: users, error: uError } = await supabase.from('profiles').select('id').limit(1);
    if (uError || !users || users.length === 0) return new Response(JSON.stringify({ error: 'No users', uError }));
    const userId = users[0].id;

    const { data: apps, error: aError } = await supabase.from('apps').select('id').eq('user_id', userId).limit(1);
    if (aError || !apps || apps.length === 0) return new Response(JSON.stringify({ error: 'No apps', aError }));
    const appId = apps[0].id;

    const reviews = await scrapePlayStoreReviews('com.whatsapp', 1);
    if (!reviews || reviews.length === 0) return new Response(JSON.stringify({ error: 'Scraper returned 0 reviews' }));

    const review = reviews[0];
    const sentiment = classifySentiment(review.content);

    const { data, error: insertError } = await supabase
      .from('feedback')
      .insert({
        app_id: appId,
        user_id: userId,
        source: 'Google Play',
        content: review.content,
        sentiment: sentiment,
        date: review.date.toISOString()
      })
      .select();

    return new Response(JSON.stringify({ 
      success: !insertError, 
      insertError,
      data,
      review 
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message, stack: err.stack }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
