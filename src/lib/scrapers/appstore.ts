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
  version?: string;
  country?: string;
}

const ALL_COUNTRIES = [
  "us", "gb", "ca", "au", "in", "de", "fr", "jp", "br", "mx", "es", "it", "nl", "se", "kr", "id", "ph", "vn", 
  "th", "tr", "ae", "sa", "za", "ng", "pl", "ch", "be", "pt", "ar", "co", "ru", "cn", "hk", "tw", "sg", "my", 
  "nz", "ie", "dk", "no", "fi", "at", "gr", "il", "eg", "pk", "bd"
];

// PRIMARY: Direct iTunes RSS API Fetcher
export async function scrapeAppStoreReviews(
  internalAppId: string, 
  appStoreId: string, 
  count: number = 50, 
  countries: string[] = ALL_COUNTRIES,
  sinceDate?: Date
): Promise<ReviewItem[]> {
  try {
    const supabaseUrl = import.meta.env.SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = import.meta.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase credentials for App Store scraper limits check.");
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

      const now = new Date();
      const firstDayOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
      
      const { count: usageCount } = await supabase
        .from('feedback')
        .select('*', { count: 'exact', head: true })
        .eq('app_id', internalAppId)
        .eq('source', 'appstore')
        .gte('created_at', firstDayOfMonth);

      if ((usageCount || 0) >= limits.appStoreReviewsPerMonth) {
        throw new Error(`Limit reached for app ${internalAppId} (Plan: ${plan}, Limit: ${limits.appStoreReviewsPerMonth}).`);
      }
    }

    // Direct iTunes API fetch loop
    const allReviews: ReviewItem[] = [];
    const maxPages = 5; // Reduced from 10 to speed up and get only recent reviews
    const BATCH_SIZE = 50;

    const cleanAppStoreId = appStoreId.trim();

    for (let i = 0; i < countries.length; i += BATCH_SIZE) {
      const batch = countries.slice(i, i + BATCH_SIZE);
      const batchPromises = batch.map(async (country) => {
        // Fetch pages concurrently instead of sequentially for massive speed boost
        const pagePromises = Array.from({ length: maxPages }, (_, idx) => idx + 1).map(async (page) => {
          const url = `https://itunes.apple.com/${country}/rss/customerreviews/page=${page}/id=${cleanAppStoreId}/sortBy=mostRecent/json`;
          
          try {
            const res = await fetch(url);
            if (!res.ok) {
              return [];
            }
            
            const json = await res.json();
            if (!json?.feed?.entry || json.feed.entry.length === 0) {
              return [];
            }

            const entries = Array.isArray(json.feed.entry) ? json.feed.entry : [json.feed.entry];
            const pageReviews: ReviewItem[] = [];
            
            for (const e of entries) {
              if (!e['im:rating']) continue;

              const reviewId = e.id?.label || `unknown-${Math.random()}`;
              pageReviews.push({
                content: e.content?.label || "",
                author: e.author?.name?.label || "Anonymous",
                date: new Date(e.updated?.label || Date.now()),
                url: `https://apps.apple.com/${country}/app/id${cleanAppStoreId}?reviewId=${reviewId}`,
                source: 'appstore',
                score: parseInt(e['im:rating']?.label || '5', 10),
                reviewId: reviewId,
                version: e['im:version']?.label,
                country: country
              });
            }
            return pageReviews;
          } catch (err) {
            return [];
          }
        });
        
        const pagesResults = await Promise.all(pagePromises);
        return pagesResults.flat();
      });

      const results = await Promise.all(batchPromises);
      for (const res of results) {
        allReviews.push(...res);
      }
    }

    console.log(`[iTunes Direct] Finished paginating all countries. Returned ${allReviews.length} total items.`);
    
    // Strictly sort by newest first and truncate to the requested count
    allReviews.sort((a, b) => b.date.getTime() - a.date.getTime());
    let filteredReviews = allReviews;
    if (sinceDate) {
      filteredReviews = filteredReviews.filter(r => r.date >= sinceDate);
      return filteredReviews; // Return all matching reviews if sinceDate is provided, ignore count limit
    }
    return filteredReviews.slice(0, count);
    
  } catch (error) {
    console.error("App store scraper (iTunes Direct) error:", error);
    throw error;
  }
}
