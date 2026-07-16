export interface ReviewItem {
  content: string;
  author: string;
  date: Date;
  url: string;
}

export async function scrapeG2Reviews(productUrl: string, count: number = 50): Promise<ReviewItem[]> {
  try {
    const response = await fetch(productUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Mindphor/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      }
    });

    if (!response.ok) {
      console.warn('G2 returned non-OK status:', response.status);
      return [];
    }

    const html = await response.text();
    return [];
  } catch (error) {
    console.error('Error scraping G2 reviews:', error);
    return [];
  }
}
