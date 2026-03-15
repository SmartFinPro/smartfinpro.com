// lib/backlinks/reddit-client.ts
// Reddit OAuth2 client for posting comments on relevant threads
// Uses Reddit's official API: https://www.reddit.com/dev/api/

interface RedditTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

interface RedditCommentResponse {
  json: {
    errors: string[][];
    data?: {
      things: Array<{
        kind: string;
        data: {
          id: string;
          name: string;
          permalink: string;
        };
      }>;
    };
  };
}

let cachedToken: { token: string; expiresAt: number } | null = null;

/**
 * Get OAuth2 access token (cached)
 * Uses password grant for bot accounts
 */
async function getRedditToken(): Promise<string> {
  const now = Date.now();

  if (cachedToken && cachedToken.expiresAt > now + 60_000) {
    return cachedToken.token;
  }

  const clientId = process.env.REDDIT_CLIENT_ID;
  const clientSecret = process.env.REDDIT_CLIENT_SECRET;
  const username = process.env.REDDIT_USERNAME;
  const password = process.env.REDDIT_PASSWORD;

  if (!clientId || !clientSecret || !username || !password) {
    throw new Error('Reddit OAuth credentials not configured. Set REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USERNAME, REDDIT_PASSWORD');
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': `SmartFinPro/1.0 by /u/${username}`,
    },
    body: new URLSearchParams({
      grant_type: 'password',
      username,
      password,
    }).toString(),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Reddit auth failed: ${response.status} — ${text}`);
  }

  const data: RedditTokenResponse = await response.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: now + data.expires_in * 1000,
  };

  return data.access_token;
}

/**
 * Post a comment on a Reddit thread
 * @param threadUrl - Full Reddit thread URL (e.g. https://reddit.com/r/personalfinance/comments/abc123/...)
 * @param commentText - The comment body (Markdown supported)
 * @returns Permalink of the posted comment
 */
export async function postRedditComment(
  threadUrl: string,
  commentText: string,
): Promise<{ success: true; permalink: string } | { success: false; error: string }> {
  try {
    // Extract thread ID from URL
    const match = threadUrl.match(/\/comments\/([a-z0-9]+)/i);
    if (!match) {
      return { success: false, error: `Cannot extract thread ID from URL: ${threadUrl}` };
    }
    const threadId = `t3_${match[1]}`;

    const token = await getRedditToken();
    const username = process.env.REDDIT_USERNAME;

    const response = await fetch('https://oauth.reddit.com/api/comment', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': `SmartFinPro/1.0 by /u/${username}`,
      },
      body: new URLSearchParams({
        api_type: 'json',
        thing_id: threadId,
        text: commentText,
      }).toString(),
    });

    const data: RedditCommentResponse = await response.json();

    if (data.json.errors && data.json.errors.length > 0) {
      const errorMsg = data.json.errors.map(e => e.join(': ')).join('; ');
      return { success: false, error: `Reddit API error: ${errorMsg}` };
    }

    const commentData = data.json.data?.things?.[0]?.data;
    if (!commentData) {
      return { success: false, error: 'No comment data returned from Reddit' };
    }

    const permalink = `https://reddit.com${commentData.permalink}`;
    return { success: true, permalink };

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: message };
  }
}

/**
 * Check if Reddit credentials are configured
 */
export function isRedditConfigured(): boolean {
  return !!(
    process.env.REDDIT_CLIENT_ID &&
    process.env.REDDIT_CLIENT_SECRET &&
    process.env.REDDIT_USERNAME &&
    process.env.REDDIT_PASSWORD
  );
}

/**
 * Fetch Reddit thread info (public, no auth needed)
 * Used to check comment count before deciding to post
 */
export async function getRedditThreadInfo(
  threadUrl: string,
): Promise<{ commentCount: number; upvotes: number; title: string } | null> {
  try {
    // Convert to JSON endpoint
    const jsonUrl = threadUrl.replace(/\?.*$/, '').replace(/\/$/, '') + '.json?limit=1';

    const response = await fetch(jsonUrl, {
      headers: {
        'User-Agent': `SmartFinPro/1.0`,
      },
    });

    if (!response.ok) return null;

    const data = await response.json();
    const post = data?.[0]?.data?.children?.[0]?.data;
    if (!post) return null;

    return {
      commentCount: post.num_comments ?? 0,
      upvotes: post.score ?? 0,
      title: post.title ?? '',
    };
  } catch {
    return null;
  }
}
