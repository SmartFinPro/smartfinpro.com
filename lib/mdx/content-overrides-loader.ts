/**
 * Build-Time Content Overrides Loader
 * ────────────────────────────────────
 * Queries the Supabase `content_overrides` table during `npm run build`
 * to patch MDX modifiedDate with the latest boost_date.
 *
 * Uses the Service Role key (no cookie context needed at build time).
 * Falls back gracefully if Supabase isn't configured or the table
 * doesn't exist yet.
 */

import { createServerClient } from '@supabase/ssr';

interface ContentOverrideRow {
  slug: string;
  boost_date: string;
}

// Cache: loaded once per build, shared across all page generations
let overridesCache: Map<string, string> | null = null;
let cacheLoadAttempted = false;

/**
 * Load all content overrides into an in-memory map.
 * Called lazily on first `getBoostDate()` invocation.
 */
async function loadOverrides(): Promise<Map<string, string>> {
  if (overridesCache) return overridesCache;
  if (cacheLoadAttempted) return new Map();

  cacheLoadAttempted = true;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    console.warn('[content-overrides-loader] Supabase not configured — skipping overrides');
    overridesCache = new Map();
    return overridesCache;
  }

  try {
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {},
      },
    });

    const { data, error } = await supabase
      .from('content_overrides')
      .select('slug, boost_date')
      .order('boost_date', { ascending: false });

    if (error) {
      // Table might not exist yet — that's OK
      if (
        error.code === 'PGRST204' ||
        error.code === '42P01' ||
        error.message?.includes('does not exist') ||
        error.message?.includes('schema cache')
      ) {
        console.warn('[content-overrides-loader] Table not found — skipping overrides');
        overridesCache = new Map();
        return overridesCache;
      }

      console.warn('[content-overrides-loader] Query error:', error.message);
      overridesCache = new Map();
      return overridesCache;
    }

    const rows = (data || []) as ContentOverrideRow[];
    overridesCache = new Map();

    for (const row of rows) {
      // Normalize slug: ensure leading slash, lowercase
      const normalizedSlug = row.slug.startsWith('/')
        ? row.slug.toLowerCase()
        : `/${row.slug}`.toLowerCase();
      overridesCache.set(normalizedSlug, row.boost_date);
    }

    if (overridesCache.size > 0) {
      console.log(
        `[content-overrides-loader] Loaded ${overridesCache.size} freshness overrides`,
      );
    }

    return overridesCache;
  } catch (err) {
    console.warn(
      '[content-overrides-loader] Failed to load overrides:',
      err instanceof Error ? err.message : err,
    );
    overridesCache = new Map();
    return overridesCache;
  }
}

/**
 * Get the boost_date for a specific slug, if one exists.
 *
 * @param slug – URL path, e.g. '/uk/trading/etoro-review'
 * @returns ISO date string or null
 */
export async function getBoostDate(slug: string): Promise<string | null> {
  const map = await loadOverrides();
  const normalizedSlug = slug.startsWith('/')
    ? slug.toLowerCase()
    : `/${slug}`.toLowerCase();
  return map.get(normalizedSlug) ?? null;
}

/**
 * Apply a freshness override to modifiedDate if one exists.
 * Returns the boost_date if it's newer than the original, or
 * the original modifiedDate otherwise.
 *
 * @param slug         – URL path, e.g. '/uk/trading/etoro-review'
 * @param modifiedDate – original modifiedDate from MDX frontmatter
 * @returns the effective modifiedDate (possibly overridden)
 */
export async function applyFreshnessOverride(
  slug: string,
  modifiedDate: string,
): Promise<string> {
  const boostDate = await getBoostDate(slug);

  if (!boostDate) return modifiedDate;

  // Only override if boost_date is newer than existing modifiedDate
  const boostMs = new Date(boostDate).getTime();
  const originalMs = new Date(modifiedDate).getTime();

  if (isNaN(boostMs)) return modifiedDate;
  if (isNaN(originalMs)) return boostDate;

  return boostMs > originalMs ? boostDate : modifiedDate;
}
