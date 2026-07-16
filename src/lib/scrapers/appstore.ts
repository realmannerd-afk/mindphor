export interface ReviewItem {
  content: string;
  author: string;
  date: Date;
  url: string;
}

export async function scrapeAppStoreReviews(appId: string, count: number = 50): Promise<ReviewItem[]> {
  // App Store scraping is currently unavailable: Apple's iTunes RSS review feed
  // returns an empty entry array at the platform level (not a code issue).
  // Returning an honest empty result rather than fake/mock data.
  console.warn(`App Store reviews unavailable for app ${appId}: platform-level RSS limitation.`);
  return [];
}
