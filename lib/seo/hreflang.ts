import { Market, marketConfig, markets } from '@/lib/i18n/config';

export interface HreflangLink {
  rel: string;
  hreflang: string;
  href: string;
}

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://smartfinpro.com';

/**
 * Generate hreflang links for internationalized pages
 * @param path - The path without market prefix (e.g., '/ai-tools/jasper-review')
 * @param availableMarkets - Markets where this content is available
 * @returns Array of hreflang link objects
 */
export function generateHreflang(
  path: string,
  availableMarkets: Market[] = ['us', 'uk', 'ca', 'au']
): HreflangLink[] {
  const links: HreflangLink[] = [];

  // US is the default (no prefix)
  if (availableMarkets.includes('us')) {
    links.push({
      rel: 'alternate',
      hreflang: marketConfig.us.hreflang,
      href: `${BASE_URL}${path}`,
    });
  }

  // x-default points to US version
  links.push({
    rel: 'alternate',
    hreflang: 'x-default',
    href: `${BASE_URL}${path}`,
  });

  // Other markets get prefixed URLs
  availableMarkets
    .filter((market) => market !== 'us')
    .forEach((market) => {
      links.push({
        rel: 'alternate',
        hreflang: marketConfig[market].hreflang,
        href: `${BASE_URL}/${market}${path}`,
      });
    });

  return links;
}

/**
 * Generate hreflang alternates object for Next.js metadata
 */
export function generateAlternates(
  path: string,
  availableMarkets: Market[] = [...markets]
): Record<string, string> {
  const alternates: Record<string, string> = {};

  availableMarkets.forEach((market) => {
    const url =
      market === 'us'
        ? `${BASE_URL}${path}`
        : `${BASE_URL}/${market}${path}`;
    alternates[marketConfig[market].hreflang] = url;
  });

  // Add x-default
  alternates['x-default'] = `${BASE_URL}${path}`;

  return alternates;
}

/**
 * Get the canonical URL for a page
 */
export function getCanonicalUrl(market: Market, path: string): string {
  if (market === 'us') {
    return `${BASE_URL}${path}`;
  }
  return `${BASE_URL}/${market}${path}`;
}

/**
 * Get URL for switching to a different market
 */
export function getMarketSwitchUrl(
  currentMarket: Market,
  targetMarket: Market,
  path: string
): string {
  // Remove current market prefix if present
  let cleanPath = path;
  if (currentMarket !== 'us' && path.startsWith(`/${currentMarket}`)) {
    cleanPath = path.replace(`/${currentMarket}`, '');
  }

  // Add target market prefix if not US
  if (targetMarket === 'us') {
    return cleanPath || '/';
  }
  return `/${targetMarket}${cleanPath}`;
}
