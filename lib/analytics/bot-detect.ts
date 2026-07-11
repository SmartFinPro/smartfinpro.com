// lib/analytics/bot-detect.ts
// Standalone bot User-Agent detection for first-party analytics ingestion
// (/api/track cockpit gate). Seeded as the UNION of the two affiliate-path
// lists (lib/affiliate/tracker.ts BOT_UA_SIGNATURES and
// app/(marketing)/go/[slug]/route.ts BOT_UA_PATTERNS) — deliberately NOT
// shared with them so the battle-tested /go fraud path stays untouched.
// Lowercase substrings matched against the UA string.

const BOT_UA_SIGNATURES = [
  // Search / social crawlers
  'googlebot', 'bingbot', 'baiduspider', 'duckduckbot', 'slurp',
  'yandexbot', 'msnbot', 'teoma', 'ia_archiver', 'facebot', 'facebookexternalhit',
  'twitterbot', 'linkedinbot', 'whatsapp', 'applebot', 'semrushbot',
  'ahrefsbot', 'dotbot', 'mj12bot', 'petalbot', 'seznambot',
  // Headless / automation
  'headless', 'phantomjs', 'selenium', 'playwright', 'puppeteer',
  'cypress', 'htmlunit', 'mechanize', 'scrapy',
  // Download tools / HTTP clients
  'wget', 'curl/', 'python-requests', 'python-urllib', 'java/', 'go-http',
  'axios/', 'node-fetch', 'libwww', 'httpclient',
  // Generic signals (the /go route matches these broadly — real browsers never do)
  'bot', 'crawler', 'spider', 'scraper', 'archive.org',
] as const;

/**
 * Returns true if the User-Agent looks like an automated bot.
 * Empty / missing UA is treated as bot (real browsers always send one).
 */
export function isBotUserAgent(ua: string | null | undefined): boolean {
  if (!ua || ua.trim().length === 0) return true;
  const lower = ua.toLowerCase();
  return BOT_UA_SIGNATURES.some((sig) => lower.includes(sig));
}
