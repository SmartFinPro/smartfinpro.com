import { Market, marketConfig, markets } from '@/lib/i18n/config';

export interface HreflangLink {
  rel: string;
  hreflang: string;
  href: string;
}

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://smartfinpro.com';

/**
 * Generate hreflang links for internationalized pages.
 * All markets use /{market} prefix (symmetric routing).
 * @param path - The path without market prefix (e.g., '/ai-tools/jasper-review')
 * @param availableMarkets - Markets where this content is available
 * @returns Array of hreflang link objects
 */
/**
 * The US homepage is served at the bare domain root (no /us prefix) — the
 * /us and /us/ paths themselves 308-redirect there (next.config.ts redirects).
 * Hreflang/canonical targets must be self-canonical 200 URLs, so the US
 * homepage special-cases to the root instead of the redirecting /us URL.
 */
function marketPathUrl(market: Market, path: string): string {
  if (market === 'us' && path === '/') {
    return `${BASE_URL}/`;
  }
  return `${BASE_URL}/${market}${path}`;
}

export function generateHreflang(
  path: string,
  availableMarkets: Market[] = ['us', 'uk', 'ca', 'au']
): HreflangLink[] {
  const links: HreflangLink[] = [];

  // All markets get prefixed URLs (symmetric)
  availableMarkets.forEach((market) => {
    links.push({
      rel: 'alternate',
      hreflang: marketConfig[market].hreflang,
      href: marketPathUrl(market, path),
    });
  });

  // x-default points to the US version when it exists, otherwise the first available market
  const defaultMarket = availableMarkets.includes('us') ? 'us' : availableMarkets[0];
  if (defaultMarket) {
    links.push({
      rel: 'alternate',
      hreflang: 'x-default',
      href: marketPathUrl(defaultMarket, path),
    });
  }

  return links;
}

/**
 * Generate hreflang alternates object for Next.js metadata.
 * All markets use /{market} prefix (symmetric routing).
 */
export function generateAlternates(
  path: string,
  availableMarkets: Market[] = [...markets]
): Record<string, string> {
  const alternates: Record<string, string> = {};

  availableMarkets.forEach((market) => {
    alternates[marketConfig[market].hreflang] = marketPathUrl(market, path);
  });

  // Add x-default: US version when it exists, otherwise the first available market
  const defaultMarket = availableMarkets.includes('us') ? 'us' : availableMarkets[0];
  if (defaultMarket) {
    alternates['x-default'] = marketPathUrl(defaultMarket, path);
  }

  return alternates;
}

/**
 * Get the canonical URL for a page.
 * All markets use /{market} prefix (symmetric routing).
 */
export function getCanonicalUrl(market: Market, path: string): string {
  return `${BASE_URL}/${market}${path}`;
}

/**
 * Get URL for switching to a different market.
 * All markets use /{market} prefix (symmetric routing).
 */
export function getMarketSwitchUrl(
  currentMarket: Market,
  targetMarket: Market,
  path: string
): string {
  // Remove current market prefix if present
  let cleanPath = path;
  if (path.startsWith(`/${currentMarket}`)) {
    cleanPath = path.replace(`/${currentMarket}`, '');
  }

  return `/${targetMarket}${cleanPath || ''}`;
}
