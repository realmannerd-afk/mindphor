import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const appId = url.searchParams.get('app_id');
    const dateParam = url.searchParams.get('date');

    if (!appId) {
      return new Response(JSON.stringify({ error: "Missing app_id" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }


    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    let targetDate = new Date();
    if (dateParam && dateParam !== 'null' && dateParam !== 'undefined') {
      const parsedDate = new Date(dateParam);
      if (!isNaN(parsedDate.getTime())) {
        targetDate = parsedDate;
        targetDate.setUTCHours(23, 59, 59, 999);
      }
    }


    const supabase = createClient(
      import.meta.env.SUPABASE_URL,
      import.meta.env.SUPABASE_SERVICE_KEY
    );

    const rangeParam = parseInt(url.searchParams.get('range') || '7', 10);
    const rangeDays = isNaN(rangeParam) ? 7 : rangeParam;

    const previousPeriodStart = new Date(targetDate);
    previousPeriodStart.setDate(previousPeriodStart.getDate() - (rangeDays * 2));
    
    const currentPeriodStart = new Date(targetDate);
    currentPeriodStart.setDate(currentPeriodStart.getDate() - rangeDays);

    let currentTraces: any[] = [];
    let previousTraces: any[] = [];
    
    try {
      const { data, error: tracesError } = await supabase
        .from('feedback')
        .select('id, content, source, sentiment, created_at, url, score, version')
        .eq('app_id', appId)
        .gte('created_at', previousPeriodStart.toISOString())
        .lte('created_at', targetDate.toISOString())
        .order('created_at', { ascending: true }); // ascending for version tracking

      if (!tracesError && data) {
        data.forEach(fb => {
          const item = {
            id: fb.id,
            content: fb.content,
            source: fb.source,
            sentiment: fb.sentiment,
            // Normalised 0-100 score for the sentiment chart
            score: fb.sentiment === 'positive' ? 95 : fb.sentiment === 'negative' ? 25 : 75,
            // Raw 1-5 star rating for the rating chart
            raw_score: fb.score ?? null,
            version: fb.version ?? null,
            created_at: fb.created_at
          };
          if (new Date(fb.created_at) >= currentPeriodStart) {
            currentTraces.push(item);
          } else {
            previousTraces.push(item);
          }
        });
      }
    } catch (e) {
      console.warn("DB feedback fetch failed, falling back to empty");
    }

    // Fetch competitors to calculate memory accuracy
    let memoryKeys: any[] = [];
    try {
      const result = await supabase
        .from('competitors')
        .select('created_at')
        .eq('app_id', appId)
        .lte('created_at', targetDate.toISOString());
      memoryKeys = result.data || [];
    } catch (e) {
      console.warn("DB competitors fetch failed");
    }

    // ── Sentiment accuracy ───────────────────────────────────────────────────
    let memoryAccuracy = 0;
    let prevMemoryAccuracy = 0;
    
    if (currentTraces.length > 0) {
      const currentPos = currentTraces.filter(t => t.sentiment === 'positive').length;
      memoryAccuracy = Math.round((currentPos / currentTraces.length) * 100);
    }
    if (previousTraces.length > 0) {
      const prevPos = previousTraces.filter(t => t.sentiment === 'positive').length;
      prevMemoryAccuracy = Math.round((prevPos / previousTraces.length) * 100);
    }

    // ── Aggregate counts ──────────────────────────────────────────────────────
    let total_calls = currentTraces.length;
    let regression_count = 0;
    let totalScore = 0;
    let scoredCount = 0;

    let prev_total_calls = previousTraces.length;
    let prev_regression_count = previousTraces.filter(t => t.sentiment === 'negative').length;
    let prev_totalScore = 0;
    let prev_scoredCount = 0;
    previousTraces.forEach(t => {
      if (t.score !== null && t.score !== undefined) {
        prev_totalScore += t.score;
        prev_scoredCount++;
      }
    });

    // ── Score by day (sentiment, 0–100) ───────────────────────────────────────
    const daysMap: Record<string, { total: number; count: number }> = {};
    // ── Rating by day (raw 1–5 stars) ─────────────────────────────────────────
    const ratingByDayMap: Record<string, { total: number; count: number; date: Date }> = {};

    // ── Category breakdown ────────────────────────────────────────────────────
    const categoryScores: Record<string, { total: number; count: number }> = {
      'Google Play': { total: 0, count: 0 },
    };

    // Initialize last 'rangeDays' sequentially
    for (let i = rangeDays - 1; i >= 0; i--) {
      const d = new Date(targetDate);
      d.setDate(d.getDate() - i);
      const dayName = dayNames[d.getDay()];
      if (!daysMap[dayName]) {
        daysMap[dayName] = { total: 0, count: 0 };
      }
      // Use ISO date string as key for ratingByDay (YYYY-MM-DD)
      const isoDate = d.toISOString().split('T')[0];
      if (!ratingByDayMap[isoDate]) {
        ratingByDayMap[isoDate] = { total: 0, count: 0, date: d };
      }
    }

    if (currentTraces.length > 0) {
      currentTraces.forEach(trace => {
        if (trace.sentiment === 'negative') regression_count++;

        if (trace.score !== null && trace.score !== undefined) {
          totalScore += trace.score;
          scoredCount++;

          const d = new Date(trace.created_at);
          const dayStr = dayNames[d.getDay()];
          if (daysMap[dayStr]) {
            daysMap[dayStr].total += trace.score;
            daysMap[dayStr].count++;
          }
        }

        // Raw star rating aggregation
        if (trace.raw_score !== null) {
          const d = new Date(trace.created_at);
          const isoDate = d.toISOString().split('T')[0];
          if (ratingByDayMap[isoDate]) {
            ratingByDayMap[isoDate].total += trace.raw_score;
            ratingByDayMap[isoDate].count++;
          }
        }

        // Category
        if (trace.source === 'play_store' || trace.source === 'playstore' || trace.source === 'Google Play') {
          if (trace.score !== null) {
            categoryScores['Google Play'].total += trace.score;
            categoryScores['Google Play'].count++;
          }
        }
      });
    }

    let avg_score = scoredCount > 0 ? Math.round(totalScore / scoredCount) : 0;
    let prev_avg_score = prev_scoredCount > 0 ? Math.round(prev_totalScore / prev_scoredCount) : 0;

    let score_by_day = Object.entries(daysMap).map(([day, data]) => ({
      day,
      score: data.count > 0 ? Math.round(data.total / data.count) : 0
    }));

    let score_by_category = [
      { category: 'Google Play', score: categoryScores['Google Play'].count > 0 ? Math.round(categoryScores['Google Play'].total / categoryScores['Google Play'].count) : 0 },
    ];

    // ── Rating by day (1–5 stars, for version-correlated chart) ───────────────
    const rating_by_day = Object.entries(ratingByDayMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([isoDate, data]) => ({
        date: isoDate,                                                          // YYYY-MM-DD
        avg_rating: data.count > 0 ? Math.round((data.total / data.count) * 10) / 10 : null,
        count: data.count,
      }));

    // ── Version changes: first occurrence of each new version per day ─────────
    // Walk through all 7-day traces (sorted ascending by date) and detect when
    // version changes — emit {date, version} for each transition
    const versionChanges: { date: string; version: string }[] = [];
    let lastVersion: string | null = null;
    const tracesWithVersion = currentTraces
      .filter(t => t.version)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    for (const t of tracesWithVersion) {
      if (t.version !== lastVersion) {
        lastVersion = t.version;
        versionChanges.push({
          date: new Date(t.created_at).toISOString().split('T')[0],
          version: t.version,
        });
      }
    }

    let recent_traces = currentTraces.slice(0, 50);

    // ── Trend strings ─────────────────────────────────────────────────────────
    const avgScoreDiff = avg_score - prev_avg_score;
    const avgScoreTrend = avgScoreDiff > 0 ? `↑ +${avgScoreDiff}% vs prev period` : avgScoreDiff < 0 ? `↓ ${avgScoreDiff}% vs prev period` : `Stable`;

    const posDiff = memoryAccuracy - prevMemoryAccuracy;
    const posTrend = posDiff > 0 ? `↑ +${posDiff}% vs prev period` : posDiff < 0 ? `↓ ${posDiff}% vs prev period` : `Stable`;

    const regDiff = regression_count - prev_regression_count;
    const regTrend = regDiff > 0 ? `↑ +${regDiff} vs prev period` : regDiff < 0 ? `↓ ${regDiff} vs prev period` : `Stable`;

    let callTrend = `Stable`;
    if (prev_total_calls > 0) {
      const callDiffPerc = Math.round(((total_calls - prev_total_calls) / prev_total_calls) * 100);
      callTrend = callDiffPerc > 0 ? `↑ +${callDiffPerc}% vs prev period` : callDiffPerc < 0 ? `↓ ${callDiffPerc}% vs prev period` : `Stable`;
    } else if (total_calls > 0) {
      callTrend = `↑ +100% vs prev period`;
    }

    return new Response(JSON.stringify({
      avg_score,
      avg_score_trend: avgScoreTrend,
      memory_accuracy: memoryAccuracy,
      memory_accuracy_trend: posTrend,
      regression_count,
      regression_count_trend: regTrend,
      total_calls,
      total_calls_trend: callTrend,
      score_by_day,
      score_by_category,
      rating_by_day,      // NEW: avg 1-5 star rating per day
      version_changes: versionChanges,    // NEW: [{date, version}] when version number changed
      recent_feedback: recent_traces
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
