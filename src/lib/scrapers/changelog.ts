export async function scrapeChangelog(url: string): Promise<string> {
  try {
    if (!url) return '';
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MindphorBot/1.0; +https://mindphor.com)'
      }
    });

    if (!res.ok) {
      console.warn('Changelog returned non-OK status:', res.status);
      return '';
    }

    const html = await res.text();
    // Very naive HTML stripping to extract text content
    // Remove scripts and styles first
    let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ');
    text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ');
    
    // Remove all HTML tags
    text = text.replace(/<[^>]+>/g, ' ');
    
    // Normalize whitespace
    text = text.replace(/\s+/g, ' ').trim();
    
    return text;
  } catch (error) {
    console.error('Error scraping changelog:', error);
    return '';
  }
}
