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
      href: `${BASE_URL}/${market}${path}`,
    });
  });

  // x-default points to US version
  links.push({
    rel: 'alternate',
    hreflang: 'x-default',
    href: `${BASE_URL}/us${path}`,
  });

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
    alternates[marketConfig[market].hreflang] = `${BASE_URL}/${market}${path}`;
  });

  // Add x-default
  alternates['x-default'] = `${BASE_URL}/us${path}`;

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
