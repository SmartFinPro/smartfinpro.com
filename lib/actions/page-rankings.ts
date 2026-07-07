'use server';
import 'server-only';

import sitemap from '@/app/sitemap';
import {
  isGSCConfigured,
  querySearchAnalytics,
  type GSCRow,
} from '@/lib/seo/google-search-console';
import { logger } from '@/lib/logging';

// ── Types ────────────────────────────────────────────────────

export type PageRankingRange = '7d' | '28d' | '90d';

export interface PageRanking {
  /** Path relative to origin, e.g. "/uk/trading/etoro-review" */
  page: string;
  /** Full URL for external linking */
  url: string;
  market: 'us' | 'uk' | 'ca' | 'au';
  /** Impressions-weighted average Google position of the page */
  position: number;
  /** Position in the previous period (null = page is new in results) */
  prevPosition: number | null;
  /** prevPosition - position → positive = improved */
  delta: number | null;
  clicks: number;
  impressions: number;
  /** CTR as percentage, e.g. 4.3 */
  ctr: number;
  /** Query that drives the most clicks/impressions to this page */
  topQuery: string | null;
  /** Position for that top query */
  topQueryPosition: number | null;
  inSitemap: boolean;
}

export interface NoDataPage {
  page: string;
  url: string;
  market: 'us' | 'uk' | 'ca' | 'au';
}

export interface PageRankingsStats {
  ranked: number;
  top3: number;
  top10: number;
  avgPosition: number;
  noData: number;
}

export interface PageRankingsResult {
  configured: boolean;
  fetchedAt: string;
  range: { label: PageRankingRange; start: string; end: string };
  pages: PageRanking[];
  noDataPages: NoDataPage[];
  stats: PageRankingsStats;
  error?: string;
}

// ── Helpers ─────────────────────────────────────────────────

const RANGE_DAYS: Record<PageRankingRange, number> = {
  '7d': 7,
  '28d': 28,
  '90d': 90,
};

function fmt(d: Date): string {
  return d.toISOString().split('T')[0];
}

/** Strip origin + query/hash, normalize trailing slash (root stays "/"). */
function normalizePath(urlOrPath: string): string {
  let path = urlOrPath.replace(/^https?:\/\/[^/]+/, '');
  path = path.split(/[?#]/)[0] || '/';
  if (!path.startsWith('/')) path = `/${path}`;
  if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
  return path;
}

function marketFromPath(path: string): 'us' | 'uk' | 'ca' | 'au' {
  if (path === '/uk' || path.startsWith('/uk/')) return 'uk';
  if (path === '/ca' || path.startsWith('/ca/')) return 'ca';
  if (path === '/au' || path.startsWith('/au/')) return 'au';
  return 'us';
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

async function getSitemapPaths(): Promise<Set<string>> {
  try {
    const entries = await sitemap();
    return new Set(entries.map((e) => normalizePath(e.url)));
  } catch (err) {
    logger.error('[page-rankings] Sitemap load failed', { error: String(err) });
    return new Set();
  }
}

// ── Main Action ─────────────────────────────────────────────

/**
 * Fetch Google positions for ALL pages of the site, live from the
 * Search Console API (no cache — every call hits GSC directly).
 *
 * Combines four data sources:
 *  1. Current period, per page   → position, clicks, impressions, CTR
 *  2. Previous period, per page  → position delta
 *  3. Current period, page+query → top query per page
 *  4. sitemap.ts                 → pages with zero search presence
 */
export async function getPageRankings(
  range: PageRankingRange = '28d',
): Promise<PageRankingsResult> {
  const days = RANGE_DAYS[range] ?? 28;

  // GSC data has ~3 day lag
  const end = new Date();
  end.setDate(end.getDate() - 3);
  const start = new Date(end);
  start.setDate(start.getDate() - days);

  const prevEnd = new Date(start);
  prevEnd.setDate(prevEnd.getDate() - 1);
  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevStart.getDate() - days);

  const base: PageRankingsResult = {
    configured: isGSCConfigured(),
    fetchedAt: new Date().toISOString(),
    range: { label: range, start: fmt(start), end: fmt(end) },
    pages: [],
    noDataPages: [],
    stats: { ranked: 0, top3: 0, top10: 0, avgPosition: 0, noData: 0 },
  };

  if (!base.configured) return base;

  try {
    const [currentRows, prevRows, pageQueryRows, sitemapPaths] = await Promise.all([
      querySearchAnalytics({
        startDate: fmt(start),
        endDate: fmt(end),
        dimensions: ['page'],
        rowLimit: 25000,
      }),
      querySearchAnalytics({
        startDate: fmt(prevStart),
        endDate: fmt(prevEnd),
        dimensions: ['page'],
        rowLimit: 25000,
      }),
      querySearchAnalytics({
        startDate: fmt(start),
        endDate: fmt(end),
        dimensions: ['page', 'query'],
        rowLimit: 25000,
      }),
      getSitemapPaths(),
    ]);

    // GSC returns URL variants (trailing slash, query params) that normalize
    // to the same path — aggregate them, weighting position by impressions.
    interface PageAgg {
      clicks: number;
      impressions: number;
      weightedPos: number;
      posSum: number;
      rowCount: number;
    }

    function aggregate(rows: GSCRow[]): Map<string, PageAgg> {
      const map = new Map<string, PageAgg>();
      for (const row of rows) {
        const path = normalizePath(row.keys[0]);
        const agg = map.get(path) ?? {
          clicks: 0,
          impressions: 0,
          weightedPos: 0,
          posSum: 0,
          rowCount: 0,
        };
        agg.clicks += row.clicks;
        agg.impressions += row.impressions;
        agg.weightedPos += row.position * row.impressions;
        agg.posSum += row.position;
        agg.rowCount += 1;
        map.set(path, agg);
      }
      return map;
    }

    function aggPosition(agg: PageAgg): number {
      return agg.impressions > 0
        ? agg.weightedPos / agg.impressions
        : agg.posSum / agg.rowCount;
    }

    const currentMap = aggregate(currentRows);
    const prevAggMap = aggregate(prevRows);

    // Best query per path (most clicks, then most impressions)
    const topQueryMap = new Map<string, GSCRow>();
    for (const row of pageQueryRows) {
      const path = normalizePath(row.keys[0]);
      const current = topQueryMap.get(path);
      if (
        !current ||
        row.clicks > current.clicks ||
        (row.clicks === current.clicks && row.impressions > current.impressions)
      ) {
        topQueryMap.set(path, row);
      }
    }

    const siteBase = process.env.NEXT_PUBLIC_SITE_URL || 'https://smartfinpro.com';

    const pages: PageRanking[] = [...currentMap.entries()].map(([path, agg]) => {
      const position = aggPosition(agg);
      const prevAgg = prevAggMap.get(path);
      const prevPosition = prevAgg ? aggPosition(prevAgg) : null;
      const topQuery = topQueryMap.get(path) ?? null;

      return {
        page: path,
        url: `${siteBase}${path === '/' ? '' : path}`,
        market: marketFromPath(path),
        position: round1(position),
        prevPosition: prevPosition !== null ? round1(prevPosition) : null,
        delta: prevPosition !== null ? round1(prevPosition - position) : null,
        clicks: agg.clicks,
        impressions: agg.impressions,
        ctr: agg.impressions > 0 ? Math.round((agg.clicks / agg.impressions) * 10000) / 100 : 0,
        topQuery: topQuery ? topQuery.keys[1] : null,
        topQueryPosition: topQuery ? round1(topQuery.position) : null,
        inSitemap: sitemapPaths.has(path),
      };
    });

    // Most-visible pages first
    pages.sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions);

    // Sitemap pages Google shows no data for
    const rankedPaths = new Set(pages.map((p) => p.page));
    const noDataPages: NoDataPage[] = [...sitemapPaths]
      .filter((path) => !rankedPaths.has(path))
      .sort()
      .map((path) => ({
        page: path,
        url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://smartfinpro.com'}${path === '/' ? '' : path}`,
        market: marketFromPath(path),
      }));

    // Stats (position weighted by impressions)
    let weightedPos = 0;
    let totalImpr = 0;
    for (const p of pages) {
      weightedPos += p.position * p.impressions;
      totalImpr += p.impressions;
    }

    return {
      ...base,
      pages,
      noDataPages,
      stats: {
        ranked: pages.length,
        top3: pages.filter((p) => p.position <= 3).length,
        top10: pages.filter((p) => p.position <= 10).length,
        avgPosition: totalImpr > 0 ? round1(weightedPos / totalImpr) : 0,
        noData: noDataPages.length,
      },
    };
  } catch (err) {
    logger.error('[page-rankings] GSC fetch failed', { error: String(err) });
    return {
      ...base,
      error: err instanceof Error ? err.message : 'GSC fetch failed',
    };
  }
}
