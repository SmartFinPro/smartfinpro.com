// lib/geo/detect-market.ts
// Unified country-to-market mapping for geo-personalized CTAs.
//
// Used by:
//   - middleware.ts → sets `sfp-geo` cookie from Cloudflare/Vercel geo-IP headers
//   - lib/geo/geo-cookie.ts → client-side cookie reader
//
// SSG-safe: This module has NO dependency on `headers()` or `server-only`.
// Pages stay statically generated; geo is resolved via middleware cookie.

export type MarketCode = 'us' | 'uk' | 'ca' | 'au';

/**
 * Map ISO 3166-1 alpha-2 country code to SmartFinPro market.
 * Returns null for countries not in any market (e.g. Germany, France).
 */
export const COUNTRY_TO_MARKET: Record<string, MarketCode> = {
  // United States
  US: 'us',
  // United Kingdom + Crown Dependencies
  GB: 'uk',
  GG: 'uk', // Guernsey
  JE: 'uk', // Jersey
  IM: 'uk', // Isle of Man
  // Canada
  CA: 'ca',
  // Australia + New Zealand (closest market)
  AU: 'au',
  NZ: 'au',
};

/** Cookie name set by middleware */
export const GEO_COOKIE_NAME = 'sfp-geo';

/**
 * Map a raw country code to a MarketCode.
 * Used by middleware to resolve the cookie value.
 */
export function mapCountryToMarket(countryCode: string): MarketCode | null {
  return COUNTRY_TO_MARKET[countryCode.toUpperCase()] || null;
}
