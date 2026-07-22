import { createClient } from '@supabase/supabase-js';
import { PLAN_LIMITS } from '../planLimits';

export interface ReviewItem {
  content: string;
  author: string;
  date: Date;
  url: string;
  source?: string;
  score?: number;
  reviewId?: string;
}

export async function scrapeAppStoreReviews(internalAppId: string, appStoreId: string, count: number = 50, country: string = "in"): Promise<ReviewItem[]> {
  try {
    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || import.meta.env.SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.warn("Missing Supabase credentials for App Store scraper limits check.");
      return [];
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user and plan details to enforce App Store review limits
    const { data: appData } = await supabase
      .from('apps')
      .select('user_id')
      .eq('id', internalAppId)
      .single();

    if (appData) {
      const { data: subData } = await supabase
        .from('subscriptions')
        .select('plan, status')
        .eq('user_id', appData.user_id)
        .eq('status', 'active')
        .maybeSingle();

      const plan = subData?.plan || 'starter';
      const limits = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.starter;

      // Count this month's App Store-sourced rows for this app
      const now = new Date();
      const firstDayOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
      
      const { count: usageCount } = await supabase
        .from('feedback')
        .select('*', { count: 'exact', head: true })
        .eq('app_id', internalAppId)
        .eq('source', 'appstore')
        .gte('created_at', firstDayOfMonth);

      if ((usageCount || 0) >= limits.appStoreReviewsPerMonth) {
        console.log(`[App Store Scraper] Limit reached for app ${internalAppId} (Plan: ${plan}, Limit: ${limits.appStoreReviewsPerMonth}). Skipping quietly.`);
        return [];
      }
    }

    const APIFY_TOKEN = import.meta.env.APIFY_API_TOKEN || process.env.APIFY_API_TOKEN;
    if (!APIFY_TOKEN) {
      console.warn("APIFY_API_TOKEN is missing");
      return [];
    }

    // Call Apify's API
    const response = await fetch(`https://api.apify.com/v2/actors/automation-lab~apple-app-store-scraper/run-sync-get-dataset-items?token=${APIFY_TOKEN}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        mode: "App reviews",
        appIds: [appStoreId],
        country: country
      })
    });

    if (!response.ok) {
      console.error(`Apify request failed with status: ${response.status}`);
      return [];
    }

    const items = await response.json();
    
    // Map the response to the existing ReviewItem interface
    const reviews: ReviewItem[] = [];
    for (const item of items) {
      reviews.push({
        content: item.content || "",
        author: item.author || "Anonymous",
        date: new Date(item.date),
        url: `https://apps.apple.com/app/id${appStoreId}`,
        source: 'appstore',
        score: item.rating,
        reviewId: item.reviewId
      });
    }

    return reviews;
  } catch (error) {
    console.error("App store scraper error:", error);
    return [];
  }
}
