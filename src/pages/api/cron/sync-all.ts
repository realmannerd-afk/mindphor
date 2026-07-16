import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";
import { scrapePlayStoreReviews } from "../../../lib/scrapers/playstore";
import { scrapeAppStoreReviews } from "../../../lib/scrapers/appstore";
import { scrapeReddit } from "../../../lib/scrapers/reddit";
import { scrapeG2Reviews } from "../../../lib/scrapers/g2";
import { scrapeCapterraReviews } from "../../../lib/scrapers/capterra";
import { checkProductHuntLaunch } from "../../../lib/scrapers/producthunt";
import { scrapeChangelog } from "../../../lib/scrapers/changelog";
import { summarizeChangelogChange } from "../../../lib/ai/summarizeChangelog";
import { classifySentiment } from "../../../lib/classifier";
import { generateAlerts } from "../../../lib/generateAlerts";
import crypto from "crypto";

/**
 * GET /api/cron/sync-all
 *
 * Vercel Cron endpoint — runs daily (configured in vercel.json).
 * For each app where sync_frequency != 'manual', checks whether enough
 * time has elapsed since last_synced_at based on the chosen frequency,
 * then runs the same ingestion logic used by the manual Sync buttons.
 * After ingestion, generates alerts for any newly inserted negative reviews
 * that cross the app's alert_threshold.
 *
 * Security: Vercel automatically sends the CRON_SECRET as Bearer in the
 * Authorization header. We validate it to prevent unauthorised triggers.
 * If CRON_SECRET is not set in .env, the check is skipped (dev mode).
 *
 * Valid sync_frequency values:
 *   'every_6_hours' → sync every 6 h
 *   'daily'         → sync every 24 h  (default)
 *   'weekly'        → sync every 7 days
 *   'manual'        → never auto-synced
 */

const FREQUENCY_HOURS: Record<string, number> = {
  every_6_hours: 6,
  daily: 24,
  weekly: 168,
};

export const GET: APIRoute = async ({ request }) => {
  // ── Auth guard ────────────────────────────────────────────────────────────
  const cronSecret = import.meta.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // ── Service-role Supabase client (bypasses RLS) ───────────────────────────
  const supabase = createClient(
    import.meta.env.SUPABASE_URL,
    import.meta.env.SUPABASE_SERVICE_KEY
  );

  const now = new Date();
  const results: Array<{
    app_id: string;
    app_name: string;
    skipped: boolean;
    reason?: string;
    reviews_inserted?: number;
    competitor_syncs?: number;
    alerts_created?: number;
    error?: string;
  }> = [];

  try {
    // Fetch all apps not on manual schedule
    const { data: apps, error: appsError } = await supabase
      .from("apps")
      .select(
        "id, user_id, name, sync_frequency, last_synced_at, play_store_url, app_store_url, reddit_search_term, alert_threshold"
      )
      .neq("sync_frequency", "manual");

    if (appsError) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch apps", detail: appsError }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!apps || apps.length === 0) {
      return new Response(
        JSON.stringify({ message: "No apps to sync", synced: 0 }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    for (const app of apps) {
      // ── Check if enough time has elapsed ─────────────────────────────────
      const freq = app.sync_frequency ?? "daily";
      const thresholdHours = FREQUENCY_HOURS[freq] ?? 24;

      if (app.last_synced_at) {
        const lastSync = new Date(app.last_synced_at);
        const hoursSince =
          (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60);

        if (hoursSince < thresholdHours) {
          results.push({
            app_id: app.id,
            app_name: app.name,
            skipped: true,
            reason: `Only ${hoursSince.toFixed(1)}h since last sync (threshold: ${thresholdHours}h)`,
          });
          continue;
        }
      }

      let reviewsInserted = 0;
      const newFeedbackIds: string[] = [];

      // ── Sync own reviews (Play Store / App Store / Reddit) ────────────────
      const sources = [
        { store: "playstore", identifier: app.play_store_url, sourceName: "Google Play" },
        { store: "appstore",  identifier: app.app_store_url,  sourceName: "App Store" },
        { store: "reddit",    identifier: app.reddit_search_term, sourceName: "Reddit" },
      ];

      for (const src of sources) {
        if (!src.identifier) continue;
        try {
          let reviews: any[] = [];
          const id = src.identifier.trim();

          if (src.store === "playstore") {
            reviews = await scrapePlayStoreReviews(id);
          } else if (src.store === "appstore") {
            reviews = await scrapeAppStoreReviews(id);
          } else if (src.store === "reddit") {
            reviews = await scrapeReddit(id);
          }

          for (const review of reviews) {
            const sentiment = classifySentiment(review.content);

            const { data: existing } = await supabase
              .from("feedback")
              .select("id")
              .eq("app_id", app.id)
              .eq("content", review.content)
              .eq("date", review.date.toISOString())
              .maybeSingle();

            if (!existing) {
              const { data: inserted, error: insertErr } = await supabase
                .from("feedback")
                .insert({
                  app_id: app.id,
                  user_id: app.user_id,
                  competitor_id: null,
                  source: src.sourceName,
                  content: review.content,
                  sentiment,
                  date: review.date.toISOString(),
                  author: review.author ?? null,
                  url: review.url ?? null,
                  score: review.score ?? null,
                  version: review.version ?? null,
                })
                .select("id")
                .single();

              if (!insertErr && inserted) {
                reviewsInserted++;
                newFeedbackIds.push(inserted.id);
              }
            }
          }
        } catch (srcErr: any) {
          console.error(
            `[cron/sync-all] ${src.store} scrape failed for app ${app.id}:`,
            srcErr.message
          );
        }
      }

      // ── Sync competitors ───────────────────────────────────────────────────
      let competitorSyncs = 0;

      const { data: competitors } = await supabase
        .from("competitors")
        .select("*")
        .eq("app_id", app.id);

      for (const comp of competitors ?? []) {
        try {
          const insertFeedback = async (
            source: string,
            content: string,
            sentiment: string,
            date: Date,
            url = ""
          ) => {
            const { data: existing } = await supabase
              .from("feedback")
              .select("id")
              .eq("competitor_id", comp.id)
              .eq("content", content)
              .eq("date", date.toISOString())
              .maybeSingle();

            if (!existing) {
              const { data: ins } = await supabase
                .from("feedback")
                .insert({
                  app_id: comp.app_id,
                  user_id: app.user_id,
                  competitor_id: comp.id,
                  source,
                  content,
                  sentiment,
                  date: date.toISOString(),
                  url,
                })
                .select("id")
                .single();
              if (ins) newFeedbackIds.push(ins.id);
              return true;
            }
            return false;
          };

          // Reddit
          try {
            const searchTerm = comp.domain || comp.name;
            if (searchTerm) {
              const mentions = await scrapeReddit(searchTerm);
              for (const m of mentions) {
                await insertFeedback("Reddit", m.content, classifySentiment(m.content), m.date, m.url);
              }
            }
          } catch (e) {}

          // G2
          if (comp.g2_url) {
            try {
              const reviews = await scrapeG2Reviews(comp.g2_url);
              for (const r of reviews) {
                await insertFeedback("G2", r.content, classifySentiment(r.content), r.date, r.url);
              }
            } catch (e) {}
          }

          // Capterra
          if (comp.capterra_url) {
            try {
              const reviews = await scrapeCapterraReviews(comp.capterra_url);
              for (const r of reviews) {
                await insertFeedback("Capterra", r.content, classifySentiment(r.content), r.date, r.url);
              }
            } catch (e) {}
          }

          // Product Hunt
          if (comp.producthunt_name) {
            try {
              const launch = await checkProductHuntLaunch(comp.producthunt_name);
              if (launch) {
                const { data: ex } = await supabase
                  .from("feedback")
                  .select("id")
                  .eq("competitor_id", comp.id)
                  .eq("url", launch.url)
                  .maybeSingle();
                if (!ex) {
                  const { data: ins } = await supabase
                    .from("feedback")
                    .insert({
                      app_id: comp.app_id,
                      user_id: app.user_id,
                      competitor_id: comp.id,
                      source: "Product Hunt",
                      content: launch.content,
                      sentiment: "neutral",
                      date: launch.date.toISOString(),
                      url: launch.url,
                    })
                    .select("id")
                    .single();
                  if (ins) newFeedbackIds.push(ins.id);
                }
              }
            } catch (e) {}
          }

          // Changelog
          if (comp.changelog_url) {
            try {
              const newText = await scrapeChangelog(comp.changelog_url);
              const oldText = comp.last_changelog_text || "";
              const oldHash = crypto.createHash("md5").update(oldText).digest("hex");
              const newHash = crypto.createHash("md5").update(newText).digest("hex");

              if (oldHash !== newHash && newText.trim().length > 0) {
                let aiSummary = await summarizeChangelogChange(oldText, newText);
                if (!oldText) aiSummary = "Initial tracking snapshot: " + aiSummary;
                if (!aiSummary.includes("No meaningful product update detected")) {
                  await insertFeedback("Product Update", aiSummary, "neutral", new Date(), comp.changelog_url);
                }
                await supabase
                  .from("competitors")
                  .update({ last_changelog_text: newText })
                  .eq("id", comp.id);
              }
            } catch (e) {}
          }

          competitorSyncs++;
        } catch (compErr: any) {
          console.error(
            `[cron/sync-all] Competitor sync error for ${comp.id}:`,
            compErr.message
          );
        }
      }

      // ── Generate alerts for newly inserted feedback ────────────────────────
      const alertsCreated = await generateAlerts({
        supabase,
        appId: app.id,
        userId: app.user_id,
        alertThreshold: app.alert_threshold ?? 70,
        newFeedbackIds,
      });

      // ── Stamp last_synced_at ──────────────────────────────────────────────
      await supabase
        .from("apps")
        .update({ last_synced_at: now.toISOString() })
        .eq("id", app.id);

      results.push({
        app_id: app.id,
        app_name: app.name,
        skipped: false,
        reviews_inserted: reviewsInserted,
        competitor_syncs: competitorSyncs,
        alerts_created: alertsCreated,
      });
    }

    const synced = results.filter((r) => !r.skipped).length;
    const skipped = results.filter((r) => r.skipped).length;

    return new Response(
      JSON.stringify({
        message: `Cron complete. ${synced} app(s) synced, ${skipped} skipped.`,
        timestamp: now.toISOString(),
        results,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[cron/sync-all] Fatal error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
