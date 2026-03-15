// lib/backlinks/medium-client.ts
// Medium API client for publishing condensed articles with canonical backlinks
// API Docs: https://github.com/Medium/medium-api-docs

interface MediumUser {
  id: string;
  username: string;
  name: string;
  url: string;
}

interface MediumPostResponse {
  id: string;
  title: string;
  authorId: string;
  tags: string[];
  url: string;
  canonicalUrl: string;
  publishStatus: string;
  publishedAt: number;
}

interface MediumApiResponse<T> {
  data: T;
}

/**
 * Get the authenticated Medium user ID
 */
async function getMediumUserId(token: string): Promise<string> {
  const response = await fetch('https://api.medium.com/v1/me', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Medium API error: ${response.status}`);
  }

  const data: MediumApiResponse<MediumUser> = await response.json();
  return data.data.id;
}

/**
 * Publish a condensed article to Medium with canonical URL pointing back to SmartFinPro
 *
 * @param title - Article title
 * @param htmlContent - Article body (HTML format)
 * @param canonicalUrl - Our original review URL (e.g. https://smartfinpro.com/uk/forex/pepperstone-review/)
 * @param tags - SEO tags (max 5)
 * @returns Medium article URL
 */
export async function publishMediumArticle(params: {
  title: string;
  htmlContent: string;
  canonicalUrl: string;
  tags: string[];
}): Promise<{ success: true; url: string } | { success: false; error: string }> {
  const token = process.env.MEDIUM_API_TOKEN;
  if (!token) {
    return { success: false, error: 'MEDIUM_API_TOKEN not configured' };
  }

  try {
    const userId = await getMediumUserId(token);

    const response = await fetch(`https://api.medium.com/v1/users/${userId}/posts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        title: params.title,
        contentFormat: 'html',
        content: params.htmlContent,
        canonicalUrl: params.canonicalUrl,
        tags: params.tags.slice(0, 5),  // Medium allows max 5 tags
        publishStatus: 'public',
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      return { success: false, error: `Medium publish failed: ${response.status} — ${text}` };
    }

    const data: MediumApiResponse<MediumPostResponse> = await response.json();
    return { success: true, url: data.data.url };

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: message };
  }
}

/**
 * Check if Medium API is configured
 */
export function isMediumConfigured(): boolean {
  return !!process.env.MEDIUM_API_TOKEN;
}

/**
 * Generate tags for Medium article based on market and category
 */
export function getMediumTags(market: string, category: string, keyword: string): string[] {
  const categoryTags: Record<string, string[]> = {
    'forex': ['Forex', 'Trading', 'Finance'],
    'trading': ['Investing', 'Trading', 'Stock Market'],
    'personal-finance': ['Personal Finance', 'Money', 'Finance'],
    'ai-tools': ['Artificial Intelligence', 'Technology', 'Productivity'],
    'cybersecurity': ['Cybersecurity', 'Technology', 'Privacy'],
    'business-banking': ['Business', 'Finance', 'Banking'],
  };

  const marketTags: Record<string, string> = {
    us: 'United States',
    uk: 'United Kingdom',
    ca: 'Canada',
    au: 'Australia',
  };

  const base = categoryTags[category] ?? ['Finance', 'Money'];
  const marketTag = marketTags[market];
  const allTags = marketTag ? [...base, marketTag] : base;

  // Extract meaningful words from keyword as additional tag
  const keywordTag = keyword
    .split(' ')
    .filter(w => w.length > 3)
    .slice(0, 2)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  if (keywordTag && !allTags.includes(keywordTag)) {
    allTags.push(keywordTag);
  }

  return allTags.slice(0, 5);
}
