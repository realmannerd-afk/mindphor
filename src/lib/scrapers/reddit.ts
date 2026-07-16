export interface RedditPost {
  content: string;
  author: string;
  date: Date;
  url: string;
}

export async function scrapeReddit(searchTerm: string, count: number = 50): Promise<RedditPost[]> {
  try {
    const response = await fetch(`https://www.reddit.com/search.json?q=${encodeURIComponent(searchTerm)}&sort=new&limit=${count}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Mindphor/1.0'
      }
    });

    if (!response.ok) {
      console.warn('Reddit API returned status:', response.status);
      return [];
    }

    const data = await response.json();
    const children = data?.data?.children || [];

    return children.map((child: any) => {
      const post = child.data;
      const content = [post.title, post.selftext].filter(Boolean).join('\n\n');
      
      return {
        content: content,
        author: post.author,
        date: new Date(post.created_utc * 1000),
        url: `https://www.reddit.com${post.permalink}`
      };
    });
  } catch (error) {
    console.error('Error scraping Reddit:', error);
    return [];
  }
}
