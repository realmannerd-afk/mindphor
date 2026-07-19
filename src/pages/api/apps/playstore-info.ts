import type { APIRoute } from "astro";
import gplay from 'google-play-scraper';

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const playStoreUrl = url.searchParams.get('url');

    if (!playStoreUrl) {
      return new Response(JSON.stringify({ error: "URL is required" }), { status: 400 });
    }

    let appId = playStoreUrl;
    if (playStoreUrl.includes('play.google.com')) {
      const match = playStoreUrl.match(/[?&]id=([^&]+)/);
      if (match) {
        appId = match[1];
      }
    } else if (!playStoreUrl.includes('.')) {
      const searchResults = await gplay.search({ term: playStoreUrl, num: 1 });
      if (searchResults && searchResults.length > 0) {
        appId = searchResults[0].appId;
      } else {
        return new Response(JSON.stringify({ error: "App not found" }), { status: 404 });
      }
    }

    const appInfo = await gplay.app({ appId });
    
    return new Response(JSON.stringify({ 
      title: appInfo.title,
      icon: appInfo.icon,
      developer: appInfo.developer,
      appId: appInfo.appId
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (err: any) {
    console.error("API error in playstore info:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
