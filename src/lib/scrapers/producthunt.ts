export interface ProductHuntLaunch {
  content: string;
  date: Date;
  url: string;
}

export async function checkProductHuntLaunch(productName: string): Promise<ProductHuntLaunch | null> {
  const token = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.PRODUCTHUNT_TOKEN) || process.env.PRODUCTHUNT_TOKEN;
  if (!token) {
    console.warn('Missing PRODUCTHUNT_TOKEN in environment.');
    return null;
  }
  
  try {
    const query = `
      query {
        post(slug: "${productName}") {
          id
          name
          tagline
          url
          createdAt
        }
      }
    `;

    const res = await fetch('https://api.producthunt.com/v2/api/graphql', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ query })
    });

    if (!res.ok) {
      console.warn('Product Hunt API returned non-OK status:', res.status);
      return null;
    }

    const data = await res.json();
    const post = data?.data?.post;

    if (post) {
      return {
        content: `${post.name} - ${post.tagline}`,
        date: new Date(post.createdAt),
        url: post.url
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching Product Hunt data:', error);
    return null;
  }
}
