import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const appId = url.searchParams.get('app_id');
    const dateParam = url.searchParams.get('date');
    const sentimentParam = url.searchParams.get('sentiment'); // 'positive' | 'negative' | 'neutral'
    const sourceParam = url.searchParams.get('source');       // 'Reddit' | 'Google Play' | 'App Store' etc.
    const searchParam = url.searchParams.get('search');       // free-text search on content

    if (!appId) {
      return new Response(JSON.stringify({ error: "Missing app_id" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    // Guest mock data block removed to prevent fake data confusion

    let targetDate = new Date();
    if (dateParam) {
      targetDate = new Date(dateParam);
      targetDate.setUTCHours(23, 59, 59, 999);
    }

    let limit = 30;
    const limitParam = url.searchParams.get('limit');
    if (limitParam) limit = parseInt(limitParam);

    let offset = 0;
    const offsetParam = url.searchParams.get('offset');
    if (offsetParam) offset = parseInt(offsetParam);

    const supabase = createClient(
      import.meta.env.SUPABASE_URL,
      import.meta.env.SUPABASE_SERVICE_KEY
    );

    let query = supabase
      .from('feedback')
      .select('id, content, source, sentiment, created_at, author, url, score')
      .eq('app_id', appId)
      .lte('created_at', targetDate.toISOString())
      .or('score.not.is.null,and(source.not.ilike.*play*,source.not.ilike.*app store*)')
      .order('created_at', { ascending: false });

    // Server-side filters
    if (sentimentParam && sentimentParam !== 'all') {
      if (sentimentParam === 'negative') query = query.lt('score', 3);
      else if (sentimentParam === 'neutral') query = query.eq('score', 3);
      else if (sentimentParam === 'positive') query = query.gt('score', 3);
    }
    if (sourceParam && sourceParam !== 'all') {
      query = query.ilike('source', `%${sourceParam}%`);
    }
    if (searchParam && searchParam.trim()) {
      query = query.ilike('content', `%${searchParam.trim()}%`);
    }

    query = query.range(offset, offset + limit - 1);

    let feedbackList: any[] = [];
    try {
      const { data, error } = await query;
      if (!error && data) feedbackList = data;
    } catch (e) {
      console.warn("DB feedback fetch failed");
    }

    const result = feedbackList.map(fb => {
      let calcSentiment = fb.sentiment;
      if (fb.score !== undefined && fb.score !== null) {
        if (fb.score < 3) calcSentiment = 'negative';
        else if (fb.score === 3) calcSentiment = 'neutral';
        else if (fb.score > 3) calcSentiment = 'positive';
      }
      return {
        id: fb.id,
        content: fb.content,
        source: fb.source,
        sentiment: calcSentiment,
        author: fb.author,
        url: fb.url,
        score: fb.score,
        created_at: fb.created_at,
      };
    });

    return new Response(JSON.stringify({ feedback: result }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
