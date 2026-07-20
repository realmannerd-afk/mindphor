import type { APIRoute } from "astro";
import gplay from '../../../lib/scrapers/vendor/index.js';

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

    let appInfo;
    try {
      appInfo = await gplay.app({ appId });
    } catch (gplayError) {
      console.warn(`gplay.app failed for ${appId}, attempting direct HTML fallback...`);
      // Direct HTML fetch fallback for brand new apps
      const fallbackUrl = `https://play.google.com/store/apps/details?id=${appId}`;
      const htmlRes = await fetch(fallbackUrl);
      if (!htmlRes.ok) throw new Error("App not found on Play Store");
      
      const html = await htmlRes.text();
      
      const titleMatch = html.match(/<meta property="og:title" content="([^"]+)">/);
      const iconMatch = html.match(/<meta property="og:image" content="([^"]+)">/);
      
      let title = titleMatch ? titleMatch[1] : appId;
      // Clean up title (Google Play sometimes appends " - Apps on Google Play")
      title = title.replace(' - Apps on Google Play', '');
      
      const installsMatch = html.match(/<div class="ClM7O">([^<]+)<\/div>/); // Best effort regex for installs, or default
      
      if (!iconMatch) throw new Error("Could not extract app icon");

      appInfo = {
        title: title,
        icon: iconMatch[1],
        developer: "Unknown Developer",
        appId: appId,
        installs: installsMatch ? installsMatch[1] : "N/A"
      };
    }
    
    // Format installs from "1,000,000+" to "1M+"
    let formattedInstalls = appInfo.installs || "N/A";
    if (formattedInstalls !== "N/A") {
      const numStr = formattedInstalls.replace(/[^0-9]/g, '');
      const num = parseInt(numStr, 10);
      if (!isNaN(num) && num >= 1000) {
        if (num >= 1000000000) formattedInstalls = (num / 1000000000).toFixed(num % 1000000000 === 0 ? 0 : 1).replace(/\.0$/, '') + 'B+';
        else if (num >= 1000000) formattedInstalls = (num / 1000000).toFixed(num % 1000000 === 0 ? 0 : 1).replace(/\.0$/, '') + 'M+';
        else if (num >= 1000) formattedInstalls = (num / 1000).toFixed(num % 1000 === 0 ? 0 : 1).replace(/\.0$/, '') + 'K+';
      } else if (!isNaN(num)) {
        formattedInstalls = num + (formattedInstalls.includes('+') ? '+' : '');
      }
    }
    
    return new Response(JSON.stringify({ 
      title: appInfo.title,
      icon: appInfo.icon,
      developer: appInfo.developer,
      appId: appInfo.appId,
      installs: formattedInstalls
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (err: any) {
    console.error("API error in playstore info:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
