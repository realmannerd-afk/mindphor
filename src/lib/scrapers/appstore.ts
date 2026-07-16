import store from 'app-store-scraper';

export interface ReviewItem {
  content: string;
  author: string;
  date: Date;
  url: string;
}

export async function scrapeAppStoreReviews(appId: string, count: number = 50): Promise<ReviewItem[]> {
  try {
    const reviews = await store.reviews({
      appId: appId,
      sort: store.sort.RECENT,
      page: 1
    });

    return reviews.map((review: any) => ({
      content: review.text || review.title || `User gave a ${review.score} star rating without text.`,
      author: review.userName,
      date: new Date(review.updated || Date.now()),
      url: review.url || `https://apps.apple.com/app/id${appId}`
    })).slice(0, count);
  } catch (error) {
    console.error('Error scraping App Store reviews:', error);
    return [];
  }
}
