export interface ReviewItem {
  content: string;
  author: string;
  date: Date;
  url: string;
}

export async function scrapeCapterraReviews(productUrl: string, count: number = 50): Promise<ReviewItem[]> {
  try {
    if (!productUrl) return [];
    
    const res = await fetch(productUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MindphorBot/1.0; +https://mindphor.com)'
      }
    });
    
    if (!res.ok) {
      console.warn('Capterra returned non-OK status:', res.status);
      return [];
    }

    const html = await res.text();
    const reviews: ReviewItem[] = [];
    
    // Capterra also often embeds structured data.
    const schemaMatch = html.match(/"@type":"Review".*?\}/g);
    
    if (schemaMatch) {
      for (const match of schemaMatch) {
        try {
          const json = JSON.parse(`{${match}`);
          if (json.reviewBody) {
            reviews.push({
              content: json.reviewBody,
              author: json.author?.name || 'Anonymous',
              date: json.datePublished ? new Date(json.datePublished) : new Date(),
              url: productUrl
            });
          }
        } catch(e) {}
      }
    }
    
    return reviews.slice(0, count);
  } catch (error) {
    console.error('Error scraping Capterra:', error);
    return [];
  }
}
