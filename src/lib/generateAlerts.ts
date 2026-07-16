import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * generateAlerts
 *
 * Called after any ingestion run (manual or cron).
 * Looks at newly inserted feedback rows and creates alert rows in the
 * `alerts` table based on these rules:
 *
 * 1. CRITICAL alert  — a single negative review whose content contains a
 *    high-priority crash/failure keyword (crash, down, data loss, etc.)
 *
 * 2. WARNING alert   — a burst: 3+ negative reviews inserted in the same
 *    sync run for the same app (signals a complaint spike)
 *
 * 3. INFO alert      — a competitor product update (source = 'Product Update')
 *    was detected and inserted in this sync run
 *
 * Deduplication: alerts are keyed on (app_id, type, date::date) so the same
 * condition doesn't fire twice on the same calendar day.
 *
 * Returns the number of new alert rows inserted.
 */

const CRITICAL_KEYWORDS = [
  "crash", "crashes", "crashing", "crashed",
  "data loss", "lost my data", "deleted my data",
  "not working", "doesn't work", "stopped working",
  "broken", "unusable", "uninstall",
  "refund", "scam", "fraud",
];

interface GenerateAlertsOptions {
  supabase: SupabaseClient;
  appId: string;
  userId: string;
  alertThreshold: number;   // from apps.alert_threshold (0-100, lower = more sensitive)
  newFeedbackIds: string[]; // IDs of feedback rows inserted in this sync run
}

export async function generateAlerts({
  supabase,
  appId,
  userId,
  alertThreshold,
  newFeedbackIds,
}: GenerateAlertsOptions): Promise<number> {
  if (!newFeedbackIds.length) return 0;

  // Fetch the full content of newly inserted feedback rows
  const { data: newRows, error } = await supabase
    .from("feedback")
    .select("id, content, sentiment, source, competitor_id")
    .in("id", newFeedbackIds);

  if (error || !newRows || newRows.length === 0) return 0;

  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  let created = 0;

  // ── Helper: insert an alert if not already exists today ─────────────────
  const insertAlert = async (
    type: "error" | "warning" | "info",
    title: string,
    description: string
  ) => {
    // Dedup check: same app + same type + same day
    const { data: existing } = await supabase
      .from("alerts")
      .select("id")
      .eq("app_id", appId)
      .eq("type", type)
      .gte("created_at", `${today}T00:00:00Z`)
      .lte("created_at", `${today}T23:59:59Z`)
      .eq("title", title)
      .maybeSingle();

    if (existing) return; // already fired today

    const { error: insertErr } = await supabase.from("alerts").insert({
      app_id: appId,
      user_id: userId,
      competitor_id: null,
      type,
      severity: type === "error" ? "critical" : type === "warning" ? "warning" : "info",
      title,
      description,
      date: new Date().toISOString(),
      is_read: false,
    });

    if (!insertErr) created++;
  };

  // ── Rule 1: CRITICAL — individual review with crash/failure keywords ─────
  for (const row of newRows) {
    if (row.sentiment !== "negative") continue;
    const text = (row.content ?? "").toLowerCase();
    const matchedKeyword = CRITICAL_KEYWORDS.find((kw) => text.includes(kw));
    if (matchedKeyword) {
      const snippet = row.content.length > 120
        ? row.content.slice(0, 120) + "…"
        : row.content;
      await insertAlert(
        "error",
        `Critical feedback detected: "${matchedKeyword}"`,
        snippet
      );
    }
  }

  // ── Rule 2: WARNING — negative spike (3+ negative reviews in this batch) ─
  const negativeRows = newRows.filter(
    (r) => r.sentiment === "negative" && !r.competitor_id
  );
  if (negativeRows.length >= 3) {
    await insertAlert(
      "warning",
      `Negative review spike: ${negativeRows.length} new negative reviews`,
      `${negativeRows.length} negative reviews were collected in the latest sync. Review the feedback tab for details.`
    );
  }

  // ── Rule 3: INFO — competitor product update detected ────────────────────
  const productUpdates = newRows.filter((r) => r.source === "Product Update");
  for (const upd of productUpdates) {
    const snippet = upd.content.length > 160
      ? upd.content.slice(0, 160) + "…"
      : upd.content;
    await insertAlert(
      "info",
      "Competitor product update detected",
      snippet
    );
  }

  return created;
}
