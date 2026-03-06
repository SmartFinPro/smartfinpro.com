'use server';
// lib/actions/compliance-db.ts
// Server-side compliance label resolution with DB override support.
//
// Architecture:
//   1. Check Supabase `compliance_overrides` table (5-minute TTL cache)
//   2. Fall back to code constants in `lib/affiliate/compliance-labels.ts`
//
// This keeps `compliance-labels.ts` 100% client-safe (no server imports)
// while allowing zero-downtime regulatory updates via the Supabase dashboard.
//
// Usage (Server Components and Server Actions only):
//   import { getComplianceLabelServer } from '@/lib/actions/compliance-db';
//   const label = await getComplianceLabelServer('uk', 'trading');

import { createServiceClient } from '@/lib/supabase/server';
import { getComplianceLabel } from '@/lib/affiliate/compliance-labels';
import { logger } from '@/lib/logging';
import type { Market, Category } from '@/types';

// ── In-memory cache (per PM2 worker) ─────────────────────────────────────────
// 5-minute TTL — regulatory labels don't change frequently.
// After a DB update, all workers refresh within 5 minutes (no redeploy needed).
interface OverrideCache {
  data: Record<string, string>; // key: `${market}:${category}`
  expiresAt: number;
}

let _cache: OverrideCache | null = null;
const CACHE_TTL_MS = 5 * 60_000; // 5 minutes

async function loadOverrides(): Promise<Record<string, string>> {
  // Return cached data if still fresh
  if (_cache && Date.now() < _cache.expiresAt) {
    return _cache.data;
  }

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('compliance_overrides')
      .select('market, category, label')
      .eq('is_active', true);

    if (error) {
      logger.warn('[compliance-db] Failed to load overrides, using code constants', {
        error: error.message,
      });
      return {};
    }

    const map: Record<string, string> = {};
    for (const row of data ?? []) {
      map[`${row.market}:${row.category}`] = row.label;
    }

    _cache = { data: map, expiresAt: Date.now() + CACHE_TTL_MS };
    return map;
  } catch (err) {
    logger.warn('[compliance-db] Unexpected error loading overrides', {
      error: err instanceof Error ? err.message : String(err),
    });
    return {};
  }
}

/**
 * Get compliance label for a market+category combination.
 *
 * Resolution order:
 *   1. DB override for exact market+category
 *   2. DB override for market+_default
 *   3. Code constant (lib/affiliate/compliance-labels.ts)
 *
 * @param market  - 'us' | 'uk' | 'ca' | 'au'
 * @param category - e.g. 'trading', 'forex', 'personal-finance'
 */
export async function getComplianceLabelServer(
  market: Market,
  category: Category | string,
): Promise<string> {
  const overrides = await loadOverrides();

  // 1. Exact match override
  const exactKey = `${market}:${category}`;
  if (overrides[exactKey]) return overrides[exactKey];

  // 2. Default override for this market
  const defaultKey = `${market}:_default`;
  if (overrides[defaultKey]) return overrides[defaultKey];

  // 3. Code constant fallback (always available, no DB dependency)
  return getComplianceLabel(market, category as Category);
}

/**
 * Get all active compliance overrides.
 * Used by admin dashboard to display and edit current labels.
 */
export async function getAllComplianceOverrides(): Promise<
  Array<{ market: string; category: string; label: string; regulatory_ref: string | null; updated_at: string }>
> {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('compliance_overrides')
      .select('market, category, label, regulatory_ref, updated_at')
      .eq('is_active', true)
      .order('market')
      .order('category');

    if (error) {
      logger.error('[compliance-db] Failed to load all overrides', { error: error.message });
      return [];
    }
    return data ?? [];
  } catch {
    return [];
  }
}

/**
 * Update or insert a compliance label override.
 * Immediately invalidates the local cache so next request fetches fresh data.
 */
export async function upsertComplianceOverride(
  market: string,
  category: string,
  label: string,
  options: { regulatoryRef?: string; updatedBy?: string } = {},
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServiceClient();
    const { error } = await supabase
      .from('compliance_overrides')
      .upsert(
        {
          market,
          category,
          label,
          regulatory_ref: options.regulatoryRef ?? null,
          updated_by: options.updatedBy ?? 'admin',
          updated_at: new Date().toISOString(),
          is_active: true,
        },
        { onConflict: 'market,category' },
      );

    if (error) {
      logger.error('[compliance-db] Upsert failed', { market, category, error: error.message });
      return { success: false, error: error.message };
    }

    // Invalidate cache so next request picks up the change
    _cache = null;

    logger.info('[compliance-db] Label updated', { market, category, label: label.slice(0, 60) });
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Invalidate the compliance cache (useful after bulk updates).
 * Next call to getComplianceLabelServer() will re-fetch from DB.
 */
export function invalidateComplianceCache(): void {
  _cache = null;
  logger.info('[compliance-db] Cache invalidated');
}
