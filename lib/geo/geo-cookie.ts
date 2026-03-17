// lib/geo/geo-cookie.ts
// Client-safe helper to read the visitor's geo-market from the `sfp-geo` cookie.
// The cookie is set by middleware.ts from Cloudflare/Vercel geo-IP headers.
//
// SSG-safe: no server imports, no headers(), works in any 'use client' component.

import { GEO_COOKIE_NAME } from '@/lib/geo/detect-market';
import type { MarketCode } from '@/lib/geo/detect-market';

const VALID_MARKETS = new Set<string>(['us', 'uk', 'ca', 'au']);

/**
 * Read the visitor's detected market from the `sfp-geo` cookie.
 * Returns null if cookie is missing, invalid, or running on the server.
 */
export function getVisitorMarketFromCookie(): MarketCode | null {
  if (typeof document === 'undefined') return null;

  try {
    const match = document.cookie
      .split('; ')
      .find((c) => c.startsWith(`${GEO_COOKIE_NAME}=`));

    if (!match) return null;

    const value = match.split('=')[1];
    if (VALID_MARKETS.has(value)) return value as MarketCode;

    return null;
  } catch {
    return null;
  }
}
