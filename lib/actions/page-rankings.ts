'use server';
import 'server-only';

import sitemap from '@/app/sitemap';
import {
  isGSCConfigured,
  querySearchAnalytics,
  type GSCRow,
} from '@/lib/seo/google-search-console';
import { fetchLiveSERP } from '@/lib/actions/ranking';
import { logger } from '@/lib/logging';
import type { Market } from '@/types';

// ── Types ────────────────────────────────────────────────────

export type PageRankingRange = '7d' | '28d' | '90d';

export interface PageKeyword {
  query: string;
  /** Impressions-weighted average position for this query on this page */
  position: number;
  /** Position in the previous period (null = query is new) */
  prevPosition: number | null;
  /** prevPosition - position → positive = improved */
  delta: number | null;
  clicks: number;
  impressions: number;
  /** CTR as percentage, e.g. 4.3 */
  ctr: number;
}

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
  /** Top queries for this page (by clicks, then impressions) — max 20 */
  topQueries: PageKeyword[];
  /** Total number of visible (non-anonymized) queries GSC reports */
  queryCount: number;
  /** Impressions attributed to visible queries — the gap vs. `impressions`
   *  is Google's privacy-filtered ("anonymized") share */
  visibleImpressions: number;
  visibleClicks: number;
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
    const [currentRows, prevRows, pageQueryRows, prevPageQueryRows, sitemapPaths] =
      await Promise.all([
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
        querySearchAnalytics({
          startDate: fmt(prevStart),
          endDate: fmt(prevEnd),
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

    // Per-page query aggregation: path → query → agg.
    // URL variants of the same page collapse here too.
    function aggregateQueries(rows: GSCRow[]): Map<string, Map<string, PageAgg>> {
      const map = new Map<string, Map<string, PageAgg>>();
      for (const row of rows) {
        const path = normalizePath(row.keys[0]);
        const query = row.keys[1];
        let queries = map.get(path);
        if (!queries) {
          queries = new Map();
          map.set(path, queries);
        }
        const agg = queries.get(query) ?? {
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
        queries.set(query, agg);
      }
      return map;
    }

    const queryMap = aggregateQueries(pageQueryRows);
    const prevQueryMap = aggregateQueries(prevPageQueryRows);

    const TOP_QUERIES_PER_PAGE = 20;

    function buildTopQueries(path: string): {
      topQueries: PageKeyword[];
      queryCount: number;
      visibleClicks: number;
      visibleImpressions: number;
    } {
      const queries = queryMap.get(path);
      if (!queries) {
        return { topQueries: [], queryCount: 0, visibleClicks: 0, visibleImpressions: 0 };
      }

      let visibleClicks = 0;
      let visibleImpressions = 0;
      for (const agg of queries.values()) {
        visibleClicks += agg.clicks;
        visibleImpressions += agg.impressions;
      }

      const prevQueries = prevQueryMap.get(path);
      const topQueries: PageKeyword[] = [...queries.entries()]
        .sort(
          ([, a], [, b]) => b.clicks - a.clicks || b.impressions - a.impressions,
        )
        .slice(0, TOP_QUERIES_PER_PAGE)
        .map(([query, agg]) => {
          const position = aggPosition(agg);
          const prevAgg = prevQueries?.get(query);
          const prevPosition = prevAgg ? aggPosition(prevAgg) : null;
          return {
            query,
            position: round1(position),
            prevPosition: prevPosition !== null ? round1(prevPosition) : null,
            delta: prevPosition !== null ? round1(prevPosition - position) : null,
            clicks: agg.clicks,
            impressions: agg.impressions,
            ctr:
              agg.impressions > 0
                ? Math.round((agg.clicks / agg.impressions) * 10000) / 100
                : 0,
          };
        });

      return { topQueries, queryCount: queries.size, visibleClicks, visibleImpressions };
    }

    const siteBase = process.env.NEXT_PUBLIC_SITE_URL || 'https://smartfinpro.com';

    const pages: PageRanking[] = [...currentMap.entries()].map(([path, agg]) => {
      const position = aggPosition(agg);
      const prevAgg = prevAggMap.get(path);
      const prevPosition = prevAgg ? aggPosition(prevAgg) : null;
      const { topQueries, queryCount, visibleClicks, visibleImpressions } =
        buildTopQueries(path);

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
        topQuery: topQueries[0]?.query ?? null,
        topQueryPosition: topQueries[0]?.position ?? null,
        topQueries,
        queryCount,
        visibleClicks,
        visibleImpressions,
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

// ── Per-page daily trend ────────────────────────────────────

export interface PageTrendPoint {
  date: string;
  position: number;
  clicks: number;
  impressions: number;
}

/**
 * Daily position trend for a single page. Matches all URL variants of the
 * path (http/https, www, trailing slash) via RE2 regex filter.
 */
export async function getPageTrend(
  page: string,
  range: PageRankingRange = '28d',
): Promise<PageTrendPoint[]> {
  if (!isGSCConfigured()) return [];

  const path = normalizePath(page);
  const days = RANGE_DAYS[range] ?? 28;

  const end = new Date();
  end.setDate(end.getDate() - 3);
  const start = new Date(end);
  start.setDate(start.getDate() - days);

  const siteBase = process.env.NEXT_PUBLIC_SITE_URL || 'https://smartfinpro.com';
  const host = siteBase.replace(/^https?:\/\/(www\.)?/, '');
  const escapeRe2 = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pageRegex = `^https?://(www\\.)?${escapeRe2(host)}${escapeRe2(path === '/' ? '' : path)}/?$`;

  const rows = await querySearchAnalytics({
    startDate: fmt(start),
    endDate: fmt(end),
    dimensions: ['date'],
    dimensionFilterGroups: [
      {
        filters: [
          { dimension: 'page', operator: 'includingRegex', expression: pageRegex },
        ],
      },
    ],
    rowLimit: days + 1,
  });

  return rows
    .map((row) => ({
      date: row.keys[0],
      position: round1(row.position),
      clicks: row.clicks,
      impressions: row.impressions,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// ── Page-specific live SERP check ───────────────────────────

export interface PageLiveCheckResult {
  keyword: string;
  market: Market;
  page: string;
  serperConfigured: boolean;
  /** True when the SERP could not be fetched (missing key or API error) */
  checkFailed: boolean;
  /** Live position of THIS page in the top 10 (null = not in top 10) */
  pagePosition: number | null;
  /** Best live position of ANY own result — may be a different page */
  sitePosition: number | null;
  /** Path of the own page that ranks (cannibalization hint when ≠ page) */
  sitePage: string | null;
  checkedAt: string;
}

/**
 * Live SERP check for a keyword, matched against a SPECIFIC page.
 * Unlike getRealtimeRanking (first own result wins), this distinguishes
 * "this page ranks" from "a different SmartFinPro page ranks" —
 * the latter is a cannibalization signal, not a success.
 */
export async function checkPageLiveRanking(
  keyword: string,
  market: Market,
  page: string,
): Promise<PageLiveCheckResult> {
  const targetPath = normalizePath(page);
  const base: PageLiveCheckResult = {
    keyword,
    market,
    page: targetPath,
    serperConfigured: !!process.env.SERPER_API_KEY,
    checkFailed: false,
    pagePosition: null,
    sitePosition: null,
    sitePage: null,
    checkedAt: new Date().toISOString(),
  };

  if (!base.serperConfigured) {
    return { ...base, checkFailed: true };
  }

  const results = await fetchLiveSERP(keyword, market);
  // fetchLiveSERP swallows API errors into [] — a real SERP is never empty,
  // so treat empty as a failed check instead of reporting "not in top 10".
  if (results.length === 0) {
    logger.warn('[page-rankings] Live SERP check returned no results', { keyword, market });
    return { ...base, checkFailed: true };
  }

  const own = results.filter((r) => r.isOwnSite);
  const pageMatch = own.find((r) => normalizePath(r.link) === targetPath);
  const siteMatch = own[0] ?? null;

  return {
    ...base,
    pagePosition: pageMatch ? pageMatch.position : null,
    sitePosition: siteMatch ? siteMatch.position : null,
    sitePage: siteMatch ? normalizePath(siteMatch.link) : null,
  };
}
