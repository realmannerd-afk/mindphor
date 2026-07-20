import gplay from 'google-play-scraper';

export interface ReviewItem {
  content: string;
  author: string;
  date: Date;
  url: string;
  score: number | null;   // 1-5 star rating from Play Store
  version: string | null; // App version string e.g. "10.3.1"
}

export async function scrapePlayStoreReviews(packageName: string, count: number = 50): Promise<ReviewItem[]> {
  try {
    let appId = packageName;
    
    // Check if it's a direct URL
    if (packageName.includes('play.google.com')) {
      const match = packageName.match(/[?&]id=([^&]+)/);
      if (match) {
        appId = match[1];
      }
    } 
    // If it doesn't look like an android package (e.g. missing a dot), try searching for it
    else if (!packageName.includes('.')) {
      const searchResults = await gplay.search({ term: packageName, num: 1 });
      if (searchResults && searchResults.length > 0) {
        appId = searchResults[0].appId;
      } else {
        console.warn('Play Store: Could not find app for term', packageName);
        return [];
      }
    }

    let reviews;
    try {
      reviews = await gplay.reviews({
        appId: appId,
        sort: gplay.sort.NEWEST,
        num: count,
        paginate: true
      });
      
      // gplay.reviews doesn't throw an error for invalid apps, it just returns empty data
      if (!reviews || !reviews.data || reviews.data.length === 0) {
        throw new Error('No reviews found, might be invalid app ID');
      }
    } catch (e) {
      // If it fails or is empty, maybe the appId was just a domain or search term. Fallback to search!
      console.log(`Failed to get reviews for ${appId}, trying search fallback...`);
      const searchResults = await gplay.search({ term: packageName, num: 1 });
      if (searchResults && searchResults.length > 0) {
        appId = searchResults[0].appId;
        reviews = await gplay.reviews({
          appId: appId,
          sort: gplay.sort.NEWEST,
          num: count,
          paginate: true
        });
      } else {
        console.warn('Play Store fallback search also failed for term', packageName);
        return [];
      }
    }

    if (!reviews || !reviews.data) return [];

    return reviews.data.map((review: any) => ({
      content: review.text || review.title || `User gave a ${review.score} star rating without text.`,
      author: review.userName,
      date: new Date(review.date),
      url: review.url,
      score: typeof review.score === 'number' ? review.score : null,
      version: review.version || null,
    }));
  } catch (error) {
    console.error('Error scraping Play Store reviews:', error);
    return [];
  }
}
