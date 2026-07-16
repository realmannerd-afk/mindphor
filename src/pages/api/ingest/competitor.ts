import type { APIRoute } from "astro";
import { getSupabaseClient } from "../../../lib/supabase";
import { scrapeG2Reviews } from "../../../lib/scrapers/g2";
import { scrapeCapterraReviews } from "../../../lib/scrapers/capterra";
import { checkProductHuntLaunch } from "../../../lib/scrapers/producthunt";
import { scrapeChangelog } from "../../../lib/scrapers/changelog";
import { summarizeChangelogChange } from "../../../lib/ai/summarizeChangelog";
import { classifySentiment } from "../../../lib/classifier";
import crypto from 'crypto';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const supabase = getSupabaseClient(cookies);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const { competitor_id } = await request.json();
    if (!competitor_id) return new Response(JSON.stringify({ error: "Missing competitor_id" }), { status: 400 });

    const { data: comp, error: compError } = await supabase
      .from('competitors')
      .select('*')
      .eq('id', competitor_id)
      .eq('user_id', user.id)
      .single();

    if (compError || !comp) {
      return new Response(JSON.stringify({ error: "Competitor not found" }), { status: 404 });
    }

    let summary = { newReviews: 0, newUpdates: 0, newLaunches: 0 };
    
    // Helper to insert feedback rows safely
    const insertFeedback = async (source: string, content: string, sentiment: string, date: Date, url: string = '', author: string | null = null, score: number | null = null) => {
      const { data: existing } = await supabase.from('feedback')
        .select('id').eq('competitor_id', comp.id).eq('content', content).eq('date', date.toISOString()).maybeSingle();
      if (!existing) {
        const { error } = await supabase.from('feedback').insert({
          app_id: comp.app_id,
          user_id: user.id,
          competitor_id: comp.id,
          source,
          content,
          sentiment,
          date: date.toISOString(),
          url,
          author,
          score
        });
        if (error) {
          console.error("DB Insert Error:", error.message);
          return false;
        }
        return true;
      }
      return false;
    };

        

    

    

    // 1. Reddit Search (Using Domain or Name)
    try {
      const searchTerm = comp.domain || comp.name;
      if (searchTerm) {
        const { scrapeReddit } = await import('../../../lib/scrapers/reddit');
        const redditMentions = await scrapeReddit(searchTerm);
        for (const mention of redditMentions) {
          const sent = classifySentiment(mention.content);
          if (await insertFeedback('Reddit', mention.content, sent, mention.date, mention.url, mention.author, mention.score)) summary.newReviews++;
        }
      }
    } catch(e) { console.error("Reddit sync failed", e); }

    // 2. Play Store (Attempting to search by exact URL or search term)
    try {
      if (comp.domain) {
        const { scrapePlayStoreReviews } = await import('../../../lib/scrapers/playstore');
        const playReviews = await scrapePlayStoreReviews(comp.domain);
        for (const review of playReviews) {
          const sent = classifySentiment(review.content);
          if (await insertFeedback('Play Store', review.content, sent, review.date, review.url, review.author, review.score)) summary.newReviews++;
        }
      }
    } catch(e) { console.error("Play Store sync failed", e); }

    // 3. App Store (Attempting to search by app domain prefix)
    try {
      if (comp.domain) {
        const appId = comp.domain.split('.')[0]; // naive guess
        const { scrapeAppStoreReviews } = await import('../../../lib/scrapers/appstore');
        const appReviews = await scrapeAppStoreReviews(appId);
        for (const review of appReviews) {
          const sent = classifySentiment(review.content);
          if (await insertFeedback('App Store', review.content, sent, review.date, review.url, review.author, review.score)) summary.newReviews++;
        }
      }
    } catch(e) { console.error("App Store sync failed", e); }

    // G2
    if (comp.g2_url) {
      try {
        const reviews = await scrapeG2Reviews(comp.g2_url);
        for (const review of reviews) {
          const sent = classifySentiment(review.content);
          if (await insertFeedback('G2', review.content, sent, review.date, review.url, review.author, review.score)) summary.newReviews++;
        }
      } catch (e) { console.error("G2 sync failed", e); }
    }

    // Capterra
    if (comp.capterra_url) {
      try {
        const reviews = await scrapeCapterraReviews(comp.capterra_url);
        for (const review of reviews) {
          const sent = classifySentiment(review.content);
          if (await insertFeedback('Capterra', review.content, sent, review.date, review.url, review.author, review.score)) summary.newReviews++;
        }
      } catch (e) { console.error("Capterra sync failed", e); }
    }

    // Product Hunt
    if (comp.producthunt_name) {
      try {
        const launch = await checkProductHuntLaunch(comp.producthunt_name);
        if (launch) {
          // check by URL instead of content for launches to avoid duplicate issues on title changes
          const { data: existing } = await supabase.from('feedback').select('id').eq('competitor_id', comp.id).eq('url', launch.url).maybeSingle();
          if (!existing) {
             await supabase.from('feedback').insert({
               app_id: comp.app_id,
               user_id: user.id,
               competitor_id: comp.id,
               source: 'Product Hunt',
               content: launch.content,
               sentiment: 'neutral',
               date: launch.date.toISOString(),
               url: launch.url
             });
             summary.newLaunches++;
          }
        }
      } catch (e) { console.error("PH sync failed", e); }
    }

    // Changelog Tracking
    if (comp.changelog_url) {
      try {
        const newText = await scrapeChangelog(comp.changelog_url);
        const oldText = comp.last_changelog_text || '';
        
        // Simple hash to see if there's any change
        const oldHash = crypto.createHash('md5').update(oldText).digest('hex');
        const newHash = crypto.createHash('md5').update(newText).digest('hex');
        
        if (oldHash !== newHash && newText.trim().length > 0) {
           let aiSummary = await summarizeChangelogChange(oldText, newText);
           
           if (!oldText) {
             aiSummary = "Initial tracking snapshot: " + aiSummary; 
           }

           if (!aiSummary.includes("No meaningful product update detected")) {
             await insertFeedback('Product Update', aiSummary, 'neutral', new Date(), comp.changelog_url);
             summary.newUpdates++;
           }
           
           // update last_changelog_text
           await supabase.from('competitors').update({ last_changelog_text: newText }).eq('id', comp.id);
        }
      } catch (e) { console.error("Changelog sync failed", e); }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: `${summary.newReviews} new reviews, ${summary.newUpdates} product updates, ${summary.newLaunches} launch events found.`
    }), { status: 200, headers: { "Content-Type": "application/json" } });

  } catch (error: any) {
    console.error("Competitor Sync Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
