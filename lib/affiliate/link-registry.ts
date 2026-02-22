import type { Market, Category, AffiliateLink, MarketPartnerEntry } from '@/types';

// ============================================================
// AFFILIATE LINK REGISTRY — Single Source of Truth
// ============================================================
// All affiliate links are stored in Supabase. This registry
// provides a cached in-memory layer for fast lookups on the
// marketing frontend, plus helper utilities for market-aware
// link resolution.
// ============================================================

/**
 * Cached registry state.
 * During Static Generation (SSG/build), this in-memory cache persists
 * across ALL page renders since they run in a single Node.js process.
 * The registry loads once from Supabase and serves all 118+ pages
 * from memory — zero additional DB calls.
 *
 * At runtime (SSR / API routes), the 5-minute TTL ensures fresh data
 * without hammering Supabase on every request.
 */
let registryCache: AffiliateLink[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// ── Regional Compliance Labels ───────────────────────────────

const COMPLIANCE_LABELS: Record<Market, Record<string, string>> = {
  us: {
    default: 'Terms Apply',
    trading: 'Investing involves risk of loss',
    forex: 'Forex trading involves significant risk',
    'personal-finance': 'Terms & Conditions Apply',
  },
  uk: {
    default: 'Terms Apply',
    trading: 'Capital at risk. 74-89% of retail CFD accounts lose money',
    forex: 'Capital at risk. CFDs are complex instruments',
    'personal-finance': 'Your capital is at risk',
  },
  ca: {
    default: 'Terms Apply',
    trading: 'Trading involves risk of loss',
    forex: 'Forex trading carries significant risk',
    'personal-finance': 'Terms & Conditions Apply',
  },
  au: {
    default: 'Terms Apply',
    trading: 'Capital at risk. Consider the PDS before deciding',
    forex: 'CFDs carry a high risk of losing money. Consider the PDS',
    'personal-finance': 'Terms & Conditions Apply',
  },
};

/**
 * Get the compliance label for a given market and category
 */
export function getComplianceLabel(market: Market, category: Category): string {
  return COMPLIANCE_LABELS[market]?.[category] || COMPLIANCE_LABELS[market]?.default || 'Terms Apply';
}

// ── Registry API ─────────────────────────────────────────────

/**
 * Load links from Supabase into the in-memory cache.
 * Called server-side; safe for use in Server Components and Actions.
 */
export async function loadRegistry(): Promise<AffiliateLink[]> {
  const now = Date.now();
  if (registryCache && now - cacheTimestamp < CACHE_TTL_MS) {
    return registryCache;
  }

  // Dynamic import to avoid bundling Supabase in client builds
  const { createServiceClient } = await import('@/lib/supabase/server');
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('affiliate_links')
    .select('*')
    .order('partner_name', { ascending: true });

  if (error) {
    console.error('[LinkRegistry] Failed to load:', error.message);
    // Return stale cache if available
    return registryCache ?? [];
  }

  registryCache = data as AffiliateLink[];
  cacheTimestamp = now;
  return registryCache;
}

/**
 * Force-clear the cache (e.g. after CRUD ops in the dashboard)
 */
export function invalidateRegistry() {
  registryCache = null;
  cacheTimestamp = 0;
}

/**
 * Resolve a single affiliate link by slug
 */
export async function resolveLink(slug: string): Promise<AffiliateLink | null> {
  const links = await loadRegistry();
  return links.find((l) => l.slug === slug && l.active) ?? null;
}

/**
 * Resolve a link by partner name and market
 */
export async function resolveLinkByPartner(
  partnerName: string,
  market: Market
): Promise<AffiliateLink | null> {
  const links = await loadRegistry();
  return (
    links.find(
      (l) =>
        l.partner_name.toLowerCase() === partnerName.toLowerCase() &&
        l.market === market &&
        l.active
    ) ?? null
  );
}

/**
 * Get all active links for a specific market
 */
export async function getLinksForMarket(market: Market): Promise<AffiliateLink[]> {
  const links = await loadRegistry();
  return links.filter((l) => l.market === market && l.active);
}

/**
 * Get all active links for a specific market + category
 */
export async function getLinksForMarketCategory(
  market: Market,
  category: Category
): Promise<AffiliateLink[]> {
  const links = await loadRegistry();
  return links.filter(
    (l) => l.market === market && l.category === category && l.active
  );
}

/**
 * Build the market-view matrix for the dashboard.
 * Groups partners by market, showing their status across all 4 markets.
 */
export async function buildMarketMatrix(): Promise<
  Record<Market, MarketPartnerEntry[]>
> {
  const links = await loadRegistry();

  const matrix: Record<Market, MarketPartnerEntry[]> = {
    us: [],
    uk: [],
    ca: [],
    au: [],
  };

  for (const link of links) {
    matrix[link.market].push({
      partner_name: link.partner_name,
      slug: link.slug,
      category: link.category,
      active: link.active,
      health_status: link.health_status ?? 'unchecked',
      clicks_30d: 0, // populated separately from analytics
      offer_expires_at: link.offer_expires_at ?? null,
    });
  }

  return matrix;
}

/**
 * Build a cross-market partner map: which partners exist in which markets
 */
export async function buildPartnerCoverageMap(): Promise<
  Record<string, { markets: Market[]; links: Pick<AffiliateLink, 'slug' | 'market' | 'active'>[] }>
> {
  const links = await loadRegistry();
  const map: Record<
    string,
    { markets: Market[]; links: Pick<AffiliateLink, 'slug' | 'market' | 'active'>[] }
  > = {};

  for (const link of links) {
    const key = link.partner_name;
    if (!map[key]) {
      map[key] = { markets: [], links: [] };
    }
    if (!map[key].markets.includes(link.market)) {
      map[key].markets.push(link.market);
    }
    map[key].links.push({
      slug: link.slug,
      market: link.market,
      active: link.active,
    });
  }

  return map;
}

/**
 * Find links expiring within a given number of days
 */
export async function getExpiringLinks(withinDays: number = 7): Promise<AffiliateLink[]> {
  const links = await loadRegistry();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + withinDays);

  return links.filter((l) => {
    if (!l.offer_expires_at) return false;
    const expires = new Date(l.offer_expires_at);
    return expires <= cutoff && expires >= new Date();
  });
}

/**
 * Find expired links that are still active
 */
export async function getExpiredActiveLinks(): Promise<AffiliateLink[]> {
  const links = await loadRegistry();
  const now = new Date();

  return links.filter((l) => {
    if (!l.offer_expires_at || !l.active) return false;
    return new Date(l.offer_expires_at) < now;
  });
}

/**
 * Register a new affiliate link slug (used by Auto-Genesis Hub).
 * Upserts into affiliate_links and clears the registry cache.
 */
export async function registerAffiliateSlug(
  slug: string,
  partnerName: string,
  destinationUrl: string,
  market: Market,
  category: Category,
  commissionType: 'cpa' | 'recurring' | 'hybrid' = 'cpa',
  commissionValue: number = 0,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { createServiceClient } = await import('@/lib/supabase/server');
    const supabase = createServiceClient();

    const { error } = await supabase
      .from('affiliate_links')
      .upsert(
        {
          slug,
          partner_name: partnerName,
          destination_url: destinationUrl,
          market,
          category,
          commission_type: commissionType,
          commission_value: commissionValue,
          active: true,
        },
        { onConflict: 'slug' },
      );

    if (error) {
      console.error('[LinkRegistry] registerAffiliateSlug failed:', error.message);
      return { success: false, error: error.message };
    }

    invalidateRegistry();
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: msg };
  }
}

/**
 * Global search & replace for affiliate IDs across all links
 * Returns the count of affected links (does NOT persist — caller must handle Supabase update)
 */
export async function findLinksWithParam(
  paramKey: string,
  paramValue: string
): Promise<AffiliateLink[]> {
  const links = await loadRegistry();

  return links.filter((l) => {
    try {
      const url = new URL(l.destination_url);
      return url.searchParams.get(paramKey) === paramValue;
    } catch {
      return false;
    }
  });
}
