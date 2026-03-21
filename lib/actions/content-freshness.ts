// lib/actions/content-freshness.ts — Content Freshness dashboard data
'use server';
import 'server-only';
import { logger } from '@/lib/logging';
import { createServiceClient } from '@/lib/supabase/server';

// ── Types ──────────────────────────────────────────────────────

export interface FreshnessRow {
  slug: string;
  market: string;
  category: string;
  file_path: string;
  publish_date: string | null;
  modified_date: string | null;
  needs_review: boolean;
  flagged_at: string | null;
  reviewed_at: string | null;
  reviewer_notes: string | null;
  age_days: number;
}

export interface FreshnessStats {
  totalArticles: number;
  fresh: number;        // < 90 days
  aging: number;        // 90–180 days
  stale: number;        // > 180 days
  needsReview: number;  // flagged for review
  reviewed: number;     // already reviewed
  avgAgeDays: number;
  marketBreakdown: Record<string, { fresh: number; aging: number; stale: number }>;
  staleArticles: FreshnessRow[];   // top 20 stalest articles
  recentlyReviewed: FreshnessRow[]; // last 5 reviewed
}

// ── Helpers ────────────────────────────────────────────────────

function computeAgeDays(publishDate: string | null, modifiedDate: string | null): number {
  const effectiveDate = modifiedDate ?? publishDate;
  if (!effectiveDate) return 999; // no date = treat as very stale
  const d = new Date(effectiveDate);
  if (isNaN(d.getTime())) return 999;
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
}

// ── Main Query ─────────────────────────────────────────────────

export async function getContentFreshnessStats(): Promise<FreshnessStats> {
  const supabase = createServiceClient();

  try {
    const { data, error } = await supabase
      .from('content_freshness')
      .select('slug, market, category, file_path, publish_date, modified_date, needs_review, flagged_at, reviewed_at, reviewer_notes')
      .order('modified_date', { ascending: true, nullsFirst: true });

    if (error) {
      logger.warn('[content-freshness] Query error:', error.message);
      return emptyStats();
    }

    if (!data || data.length === 0) {
      return emptyStats();
    }

    const rows: FreshnessRow[] = data.map((r) => ({
      ...r,
      age_days: computeAgeDays(r.publish_date, r.modified_date),
    }));

    // Categorize
    let fresh = 0;
    let aging = 0;
    let stale = 0;
    let needsReview = 0;
    let reviewed = 0;
    let totalAge = 0;

    const marketBreakdown: Record<string, { fresh: number; aging: number; stale: number }> = {};

    for (const row of rows) {
      const age = row.age_days;
      totalAge += age;

      // Init market bucket
      if (!marketBreakdown[row.market]) {
        marketBreakdown[row.market] = { fresh: 0, aging: 0, stale: 0 };
      }

      if (age <= 90) {
        fresh++;
        marketBreakdown[row.market].fresh++;
      } else if (age <= 180) {
        aging++;
        marketBreakdown[row.market].aging++;
      } else {
        stale++;
        marketBreakdown[row.market].stale++;
      }

      if (row.needs_review) needsReview++;
      if (row.reviewed_at) reviewed++;
    }

    // Top 20 stalest articles (sorted by age descending)
    const staleArticles = [...rows]
      .sort((a, b) => b.age_days - a.age_days)
      .slice(0, 20);

    // Recently reviewed (last 5)
    const recentlyReviewed = rows
      .filter((r) => r.reviewed_at)
      .sort((a, b) => new Date(b.reviewed_at!).getTime() - new Date(a.reviewed_at!).getTime())
      .slice(0, 5);

    return {
      totalArticles: rows.length,
      fresh,
      aging,
      stale,
      needsReview,
      reviewed,
      avgAgeDays: rows.length > 0 ? Math.round(totalAge / rows.length) : 0,
      marketBreakdown,
      staleArticles,
      recentlyReviewed,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    logger.error('[content-freshness] getContentFreshnessStats error:', msg);
    return emptyStats();
  }
}

function emptyStats(): FreshnessStats {
  return {
    totalArticles: 0,
    fresh: 0,
    aging: 0,
    stale: 0,
    needsReview: 0,
    reviewed: 0,
    avgAgeDays: 0,
    marketBreakdown: {},
    staleArticles: [],
    recentlyReviewed: [],
  };
}
