// lib/backlinks/opportunity-scorer.ts
// Scores backlink opportunities 0-100 based on platform signals

export interface SerperBacklinkResult {
  title: string;
  link: string;
  snippet: string;
  position?: number;
}

export interface OpportunitySignals {
  platform: 'reddit' | 'quora' | 'forum' | 'medium' | 'pr' | 'stackexchange' | 'hackernews';
  title: string;
  snippet: string;
  url: string;
  keyword: string;
}

/**
 * Platform domain authority weights (known DA values)
 */
export const PLATFORM_DA: Record<string, number> = {
  'reddit.com': 91,
  'quora.com': 83,
  'medium.com': 95,
  'money.stackexchange.com': 79,
  'news.ycombinator.com': 88,
  'dev.to': 74,
  'hashnode.com': 72,
  'forexpeacearmy.com': 55,
  'babypips.com': 65,
  'bogleheads.org': 60,
  'whirlpool.net.au': 52,
  'stockhouse.com': 51,
};

/**
 * Finance subreddits with engagement multipliers
 */
const SUBREDDIT_MULTIPLIERS: Record<string, number> = {
  'r/personalfinance': 1.4,
  'r/investing': 1.3,
  'r/UKPersonalFinance': 1.35,
  'r/AusFinance': 1.3,
  'r/PersonalFinanceCanada': 1.3,
  'r/wallstreetbets': 0.8,   // High noise, lower quality
  'r/Bogleheads': 1.2,
  'r/financialindependence': 1.25,
  'r/stocks': 1.1,
  'r/povertyfinance': 1.0,
};

/**
 * Keywords that indicate high-intent, answerable threads
 */
const HIGH_INTENT_PATTERNS = [
  'best', 'recommend', 'which', 'should i', 'vs', 'comparison', 'review',
  'worth it', 'legit', 'safe', 'trustworthy', 'any experience', 'anyone tried',
  'help me choose', 'looking for', 'suggestions', 'alternatives to',
];

/**
 * Keywords that indicate low-quality opportunities (skip)
 */
const LOW_QUALITY_PATTERNS = [
  'spam', 'scam', 'avoid', 'warning', 'banned', 'rant', 'complaint only',
  'already decided', 'not looking for',
];

/**
 * Detect platform from URL
 */
export function detectPlatform(url: string): OpportunitySignals['platform'] | null {
  const lower = url.toLowerCase();
  if (lower.includes('reddit.com')) return 'reddit';
  if (lower.includes('quora.com')) return 'quora';
  if (lower.includes('stackexchange.com') || lower.includes('stackoverflow.com')) return 'stackexchange';
  if (lower.includes('news.ycombinator.com')) return 'hackernews';
  if (lower.includes('medium.com')) return 'medium';
  if (
    lower.includes('forexpeacearmy.com') ||
    lower.includes('babypips.com') ||
    lower.includes('bogleheads.org') ||
    lower.includes('whirlpool.net.au') ||
    lower.includes('stockhouse.com') ||
    lower.includes('elitetrader.com')
  ) return 'forum';
  return null;
}

/**
 * Extract subreddit name from Reddit URL
 */
export function extractSubreddit(url: string): string | null {
  const match = url.match(/reddit\.com\/r\/([a-zA-Z0-9_]+)/);
  return match ? `r/${match[1]}` : null;
}

/**
 * Get domain from URL
 */
export function extractDomainFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
}

/**
 * Score a backlink opportunity from 0 to 100
 *
 * Scoring weights:
 * - Platform DA (30 pts): Higher DA domain = more link value
 * - Keyword match (25 pts): How well thread matches our target keyword
 * - Intent signals (25 pts): High-intent patterns in title/snippet
 * - Thread freshness (10 pts): Newer = more engagement opportunity
 * - Content gap (10 pts): Few existing answers = more visibility
 */
export function scoreOpportunity(signals: OpportunitySignals): number {
  let score = 0;

  const { platform, title, snippet, url, keyword } = signals;
  const titleLower = title.toLowerCase();
  const snippetLower = snippet.toLowerCase();
  const keywordLower = keyword.toLowerCase();
  const keywordWords = keywordLower.split(' ');

  // ── 1. Platform DA Score (0–30) ──────────────────────────────
  const domain = extractDomainFromUrl(url);
  const da = PLATFORM_DA[domain] ?? 50;
  score += Math.round((da / 100) * 30);

  // ── 2. Keyword Match Score (0–25) ────────────────────────────
  let keywordMatchCount = 0;
  for (const word of keywordWords) {
    if (word.length > 3) {
      if (titleLower.includes(word)) keywordMatchCount += 2;
      if (snippetLower.includes(word)) keywordMatchCount += 1;
    }
  }
  // Full keyword phrase match bonus
  if (titleLower.includes(keywordLower)) keywordMatchCount += 5;
  if (snippetLower.includes(keywordLower)) keywordMatchCount += 3;
  score += Math.min(25, keywordMatchCount * 3);

  // ── 3. Intent Signals Score (0–25) ───────────────────────────
  let intentScore = 0;
  for (const pattern of HIGH_INTENT_PATTERNS) {
    if (titleLower.includes(pattern)) intentScore += 3;
    if (snippetLower.includes(pattern)) intentScore += 1;
  }
  // Penalty for low-quality signals
  for (const pattern of LOW_QUALITY_PATTERNS) {
    if (titleLower.includes(pattern) || snippetLower.includes(pattern)) intentScore -= 10;
  }
  score += Math.min(25, Math.max(0, intentScore));

  // ── 4. Subreddit Multiplier (Reddit only) ────────────────────
  if (platform === 'reddit') {
    const subreddit = extractSubreddit(url);
    const multiplier = subreddit ? (SUBREDDIT_MULTIPLIERS[subreddit] ?? 1.0) : 1.0;
    score = Math.round(score * multiplier);
  }

  // ── 5. Content Gap Bonus (0–10) ──────────────────────────────
  // If snippet shows few replies or "no answers yet" → higher bonus
  const noAnswers =
    snippetLower.includes('no answers') ||
    snippetLower.includes('0 comments') ||
    snippetLower.includes('1 comment') ||
    snippetLower.includes('unanswered');
  if (noAnswers) score += 10;

  return Math.min(100, Math.max(0, score));
}

/**
 * Build Serper search queries for backlink opportunity discovery
 * Returns multiple query variants per keyword for different platforms
 */
export function buildBacklinkSearchQueries(keyword: string): string[] {
  const encodedKeyword = keyword;
  return [
    // Reddit high-intent questions
    `site:reddit.com "${encodedKeyword}" (best OR recommend OR "should I" OR which)`,
    // Quora unanswered questions
    `site:quora.com "${encodedKeyword}"`,
    // Finance forums
    `site:forexpeacearmy.com OR site:babypips.com OR site:bogleheads.org "${encodedKeyword}"`,
    // Stack Exchange
    `site:money.stackexchange.com "${encodedKeyword}"`,
  ];
}
