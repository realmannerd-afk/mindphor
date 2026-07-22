import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const appStoreUrl = url.searchParams.get('url');

    if (!appStoreUrl) {
      return new Response(JSON.stringify({ error: "URL is required" }), { status: 400 });
    }

    let appId = appStoreUrl;
    
    // Extract ID from URL if provided (e.g. https://apps.apple.com/us/app/facebook/id284882215)
    const match = appStoreUrl.match(/id(\d+)/i);
    if (match) {
      appId = match[1];
    }

    let country = 'us';
    const countryMatch = appStoreUrl.match(/apple\.com\/([a-z]{2})\/app/i);
    if (countryMatch) {
      country = countryMatch[1].toLowerCase();
    }

    // Function to attempt fetching by country
    const fetchApp = async (cc: string) => {
      const response = await fetch(`https://itunes.apple.com/lookup?id=${appId}&country=${cc}`);
      if (!response.ok) return null;
      const data = await response.json();
      return (data.results && data.results.length > 0) ? data.results[0] : null;
    };

    // Try extracted country first, then fallback to 'us', then 'in'
    let app = await fetchApp(country);
    if (!app && country !== 'us') app = await fetchApp('us');
    if (!app && country !== 'in') app = await fetchApp('in');

    if (!app) {
      return new Response(JSON.stringify({ error: "App not found on App Store (Checked regions: " + country + ", us, in)" }), { status: 404 });
    }

    return new Response(JSON.stringify({ 
      title: app.trackName,
      icon: app.artworkUrl512 || app.artworkUrl100,
      developer: app.artistName,
      appId: appId,
      installs: "N/A", // App Store doesn't expose public install counts
      platform: "appstore"
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (err: any) {
    console.error("API error in appstore info:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
