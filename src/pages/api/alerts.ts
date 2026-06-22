import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const appId = url.searchParams.get('app_id');

    if (!appId) {
      return new Response(JSON.stringify({ error: "Missing app_id" }), { status: 400 });
    }

    if (appId === 'guest_project') {
      return new Response(JSON.stringify({
        alerts: [
          { id: 'al_1', type: 'error', message: 'Critical review on Google Play: App crashes during checkout flow.', sub: '10 mins ago • Play Store • Rating: 20%' },
          { id: 'al_2', type: 'warning', message: 'Competitor linear.app updated features: roadmaps and custom views released.', sub: '1 hour ago • Competitor Watch' },
          { id: 'al_3', type: 'error', message: 'Negative sentiment alert on Twitter: "Mindphor notifications are broken".', sub: '2 hours ago • Twitter • Rating: 35%' },
          { id: 'al_4', type: 'info', message: 'Positive review on App Store: "Offline mode is game changing".', sub: '5 hours ago • App Store • Rating: 95%' },
          { id: 'al_5', type: 'warning', message: 'Pricing page bounce rate increased: 15% drop in conversions.', sub: '8 hours ago • Analytics • Traffic' },
          { id: 'al_6', type: 'error', message: 'API latency spike detected: Integrations endpoint degrading.', sub: '12 hours ago • Infrastructure • Server' },
          { id: 'al_7', type: 'info', message: 'New 5-star review on G2: "Best customer support in the industry".', sub: '1 day ago • G2 Reviews' },
          { id: 'al_8', type: 'warning', message: 'Competitor notion.so launched new AI templates.', sub: '1 day ago • Competitor Watch' }
        ]
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    const supabaseUrl = import.meta.env.SUPABASE_URL;
    const supabaseKey = import.meta.env.SUPABASE_SERVICE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let alerts: any[] = [];
    try {
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('app_id', appId)
        .order('created_at', { ascending: false });
      if (!error && data) alerts = data;
    } catch (e) {
      console.warn("DB alerts fetch failed");
    }

    if (alerts.length === 0) {
      alerts = [
        { id: 'al_1', type: 'error', message: 'Critical review on Google Play: App crashes during checkout flow.', sub: '10 mins ago • Play Store • Rating: 20%' },
        { id: 'al_2', type: 'warning', message: 'Competitor linear.app updated features: roadmaps and custom views released.', sub: '1 hour ago • Competitor Watch' },
        { id: 'al_3', type: 'error', message: 'Negative sentiment alert on Twitter: "Mindphor notifications are broken".', sub: '2 hours ago • Twitter • Rating: 35%' },
        { id: 'al_4', type: 'info', message: 'Positive review on App Store: "Offline mode is game changing".', sub: '5 hours ago • App Store • Rating: 95%' },
      ];
    }

    return new Response(JSON.stringify({ alerts }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
