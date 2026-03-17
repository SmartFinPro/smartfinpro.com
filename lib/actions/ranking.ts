'use server';

import 'server-only';
import * as Sentry from '@sentry/nextjs';
import { logger } from '@/lib/logging';

import { createClient } from '@/lib/supabase/server';
import {
  getTopKeywords,
  getKeywordTrend,
  getWinnersAndLosers,
  isGSCConfigured,
  type KeywordData,
  type PositionTrend,
} from '@/lib/seo/google-search-console';
import type { Market } from '@/types';
import { MONEY_KEYWORDS } from '@/lib/seo/money-keywords';

// ── Types ────────────────────────────────────────────────────

export interface RankingKeyword {
  id: string;
  keyword: string;
  page: string;
  market: Market;
  currentPosition: number;
  previousPosition: number | null;
  positionDelta: number | null; // positive = improved
  clicks: number;
  impressions: number;
  ctr: number;
  lastUpdated: string;
}

export interface RankingStats {
  totalKeywords: number;
  avgPosition: number;
  top3Keywords: number;
  top10Keywords: number;
  top20Keywords: number;
  totalClicks: number;
  totalImpressions: number;
}

export interface WinnerLoser {
  keyword: string;
  page: string;
  market: string;
  position: number;
  positionDelta: number;
  clicks: number;
  impressions: number;
}

export interface SerpResult {
  position: number;
  title: string;
  link: string;
  snippet: string;
  isOwnSite: boolean;
}

export interface RankingDashboardData {
  keywords: RankingKeyword[];
  stats: RankingStats;
  trend: PositionTrend[];
  winners: WinnerLoser[];
  losers: WinnerLoser[];
  gscConfigured: boolean;
  serperConfigured: boolean;
}

export interface RealtimeRankingResult {
  keyword: string;
  market: Market;
  serpResults: SerpResult[];
  ownPosition: number | null;
  savedToDb: boolean;
  timestamp: string;
}

// ── Safe query helper ───────────────────────────────────────

type SupabaseResult<T> = {
  data: T[] | null;
  count: number | null;
  error: { code?: string; message?: string } | null;
};

function safeData<T>(result: SupabaseResult<T>): T[] {
  if (result.error) {
    if (
      result.error.code === 'PGRST204' ||
      result.error.code === '42P01' ||
      result.error.message?.includes('schema cache') ||
      result.error.message?.includes('does not exist')
    ) {
      return [];
    }
    logger.warn('[ranking] Query warning:', result.error.message);
  }
  return result.data || [];
}

// ── Seed initial keywords into Supabase ─────────────────────

/**
 * Ensures the 10 money-keywords exist in keyword_tracking.
 * Does NOT overwrite existing data (uses upsert with onConflict).
 * Returns the count of newly seeded keywords.
 */
export async function seedMoneyKeywords(): Promise<number> {
  const supabase = await createClient();
  let seeded = 0;

  for (const kw of MONEY_KEYWORDS) {
    const { error } = await supabase.from('keyword_tracking').upsert(
      {
        keyword: kw.keyword,
        page: kw.page,
        market: kw.market,
        current_position: 0,
        previous_position: null,
        clicks: 0,
        impressions: 0,
        ctr: 0,
        tracked_at: new Date().toISOString(),
      },
      { onConflict: 'keyword,market', ignoreDuplicates: true },
    );

    if (!error) seeded++;
  }

  return seeded;
}

// ── Main data fetcher ───────────────────────────────────────

export async function getRankingData(options?: {
  market?: Market;
  days?: number;
}): Promise<RankingDashboardData> {
  const gscConfigured = isGSCConfigured();
  const serperConfigured = !!process.env.SERPER_API_KEY;
  const market = options?.market;
  const days = options?.days || 7;

  // Try Supabase first (cached daily snapshots)
  const supabase = await createClient();
  let query = supabase
    .from('keyword_tracking')
    .select('*')
    .order('current_position', { ascending: true })
    .limit(200);

  if (market) {
    query = query.eq('market', market);
  }

  const stored = safeData(await query);

  let keywords: RankingKeyword[];

  if (stored.length > 0) {
    keywords = stored.map((row: Record<string, unknown>) => ({
      id: (row.id as string) || crypto.randomUUID(),
      keyword: row.keyword as string,
      page: (row.page as string) || '',
      market: (row.market as Market) || 'us',
      currentPosition: (row.current_position as number) || 0,
      previousPosition: (row.previous_position as number | null) ?? null,
      positionDelta: row.previous_position
        ? Math.round(
            ((row.previous_position as number) - (row.current_position as number)) * 10,
          ) / 10
        : null,
      clicks: (row.clicks as number) || 0,
      impressions: (row.impressions as number) || 0,
      ctr: (row.ctr as number) || 0,
      lastUpdated: (row.tracked_at as string) || new Date().toISOString(),
    }));
  } else if (gscConfigured) {
    const gscKeywords = await getTopKeywords({ days, limit: 100, market });
    keywords = gscKeywords.map((kw: KeywordData) => ({
      id: crypto.randomUUID(),
      keyword: kw.keyword,
      page: kw.page,
      market: (kw.market || 'us') as Market,
      currentPosition: kw.position,
      previousPosition: null,
      positionDelta: null,
      clicks: kw.clicks,
      impressions: kw.impressions,
      ctr: kw.ctr,
      lastUpdated: new Date().toISOString(),
    }));
  } else {
    // Return seed keywords as placeholders (position 0 = unchecked)
    keywords = MONEY_KEYWORDS.map((kw) => ({
      id: crypto.randomUUID(),
      keyword: kw.keyword,
      page: kw.page,
      market: kw.market,
      currentPosition: 0,
      previousPosition: null,
      positionDelta: null,
      clicks: 0,
      impressions: 0,
      ctr: 0,
      lastUpdated: new Date().toISOString(),
    }));
  }

  const stats = calculateStats(keywords.filter((k) => k.currentPosition > 0));

  let trend: PositionTrend[] = [];
  if (keywords.length > 0 && gscConfigured) {
    const topKw = [...keywords]
      .filter((k) => k.clicks > 0)
      .sort((a, b) => b.clicks - a.clicks)[0];
    if (topKw) {
      trend = await getKeywordTrend(topKw.keyword, 30);
    }
  }

  let winners: WinnerLoser[] = [];
  let losers: WinnerLoser[] = [];

  if (gscConfigured) {
    const wl = await getWinnersAndLosers(days);
    winners = wl.winners.map((w) => ({
      keyword: w.keyword,
      page: w.page,
      market: w.market,
      position: w.position,
      positionDelta: (w as unknown as Record<string, number>).positionDelta || 0,
      clicks: w.clicks,
      impressions: w.impressions,
    }));
    losers = wl.losers.map((l) => ({
      keyword: l.keyword,
      page: l.page,
      market: l.market,
      position: l.position,
      positionDelta: (l as unknown as Record<string, number>).positionDelta || 0,
      clicks: l.clicks,
      impressions: l.impressions,
    }));
  }

  return { keywords, stats, trend, winners, losers, gscConfigured, serperConfigured };
}

// ── Position trend for a specific keyword ───────────────────

export async function getKeywordPositionTrend(
  keyword: string,
  days: number = 30,
): Promise<PositionTrend[]> {
  if (!isGSCConfigured()) return [];
  return getKeywordTrend(keyword, days);
}

// ── Realtime Ranking: Serper.dev → Supabase ─────────────────

/**
 * Fetch real-time SERP for a keyword, detect own position,
 * and persist the result into keyword_tracking.
 */
export async function getRealtimeRanking(
  keyword: string,
  market: Market = 'us',
): Promise<RealtimeRankingResult> {
  const serpResults = await fetchLiveSERPInternal(keyword, market);

  // Detect own position
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'smartfinpro.com';
  const siteDomain = extractDomain(siteUrl);
  const ownResult = serpResults.find((r) => r.isOwnSite);
  const ownPosition = ownResult ? ownResult.position : null;

  // Persist to Supabase
  let savedToDb = false;
  if (ownPosition !== null) {
    const supabase = await createClient();

    // Get previous position first
    const prevQuery = supabase
      .from('keyword_tracking')
      .select('current_position')
      .eq('keyword', keyword)
      .eq('market', market)
      .limit(1);

    const prevData = safeData(await prevQuery);
    const prevPos =
      prevData.length > 0
        ? (prevData[0] as Record<string, unknown>).current_position as number
        : null;

    const { error } = await supabase.from('keyword_tracking').upsert(
      {
        keyword,
        page: ownResult?.link || '',
        market,
        current_position: ownPosition,
        previous_position: prevPos,
        clicks: 0,
        impressions: 0,
        ctr: 0,
        tracked_at: new Date().toISOString(),
      },
      { onConflict: 'keyword,market' },
    );

    savedToDb = !error;
    if (error) logger.warn('[ranking] Failed to persist SERP result:', error.message);
  }

  return {
    keyword,
    market,
    serpResults,
    ownPosition,
    savedToDb,
    timestamp: new Date().toISOString(),
  };
}

// ── Legacy SERP fetch (no persistence) ──────────────────────

export async function fetchLiveSERP(
  keyword: string,
  market: Market = 'us',
): Promise<SerpResult[]> {
  return fetchLiveSERPInternal(keyword, market);
}

// ── Internal SERP fetch ─────────────────────────────────────

async function fetchLiveSERPInternal(
  keyword: string,
  market: Market = 'us',
): Promise<SerpResult[]> {
  const apiKey = process.env.SERPER_API_KEY;

  if (!apiKey) {
    logger.warn('[ranking] SERPER_API_KEY not configured');
    return [];
  }

  const glMap: Record<string, string> = {
    us: 'us',
    uk: 'uk',
    ca: 'ca',
    au: 'au',
  };

  try {
    const res = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: keyword,
        gl: glMap[market] || 'us',
        num: 10,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      logger.error('[ranking] Serper API error', { status: res.status, body: text });
      return [];
    }

    const data = await res.json();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'smartfinpro.com';
    const siteDomain = extractDomain(siteUrl);

    const organic = (data.organic || []) as Array<{
      position: number;
      title: string;
      link: string;
      snippet: string;
    }>;

    return organic.slice(0, 10).map((item, idx) => {
      let isOwn = false;
      try {
        isOwn = new URL(item.link).hostname.includes(siteDomain);
      } catch {
        // malformed URL
      }

      return {
        position: item.position || idx + 1,
        title: item.title,
        link: item.link,
        snippet: item.snippet || '',
        isOwnSite: isOwn,
      };
    });
  } catch (err) {
    Sentry.captureException(err);
    logger.error('[ranking] SERP fetch failed:', err);
    return [];
  }
}

// ── Sync GSC data to Supabase (cron) ────────────────────────

export async function syncKeywordTracking(): Promise<{
  synced: number;
  errors: number;
}> {
  if (!isGSCConfigured()) {
    return { synced: 0, errors: 0 };
  }

  const supabase = await createClient();
  const keywords = await getTopKeywords({ days: 3, limit: 200 });

  const prevQuery = supabase
    .from('keyword_tracking')
    .select('keyword, market, current_position');

  const prevData = safeData(await prevQuery);
  const prevMap = new Map<string, number>();
  for (const row of prevData) {
    const r = row as Record<string, unknown>;
    prevMap.set(
      `${r.keyword}__${r.market}`,
      r.current_position as number,
    );
  }

  let synced = 0;
  let errors = 0;

  for (const kw of keywords) {
    const prevPos = prevMap.get(`${kw.keyword}__${kw.market}`) ?? null;

    const { error } = await supabase.from('keyword_tracking').upsert(
      {
        keyword: kw.keyword,
        page: kw.page,
        market: kw.market,
        current_position: kw.position,
        previous_position: prevPos,
        clicks: kw.clicks,
        impressions: kw.impressions,
        ctr: kw.ctr,
        tracked_at: new Date().toISOString(),
      },
      { onConflict: 'keyword,market' },
    );

    if (error) {
      errors++;
      if (errors <= 3) logger.warn('[ranking] Upsert error:', error.message);
    } else {
      synced++;
    }
  }

  return { synced, errors };
}

// ── Helpers ─────────────────────────────────────────────────

function extractDomain(url: string): string {
  try {
    return new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
  } catch {
    return 'smartfinpro.com';
  }
}

function calculateStats(keywords: RankingKeyword[]): RankingStats {
  if (keywords.length === 0) {
    return {
      totalKeywords: 0,
      avgPosition: 0,
      top3Keywords: 0,
      top10Keywords: 0,
      top20Keywords: 0,
      totalClicks: 0,
      totalImpressions: 0,
    };
  }

  const positions = keywords.map((k) => k.currentPosition);
  const avgPosition =
    Math.round(
      (positions.reduce((a, b) => a + b, 0) / positions.length) * 10,
    ) / 10;

  return {
    totalKeywords: keywords.length,
    avgPosition,
    top3Keywords: keywords.filter((k) => k.currentPosition <= 3).length,
    top10Keywords: keywords.filter((k) => k.currentPosition <= 10).length,
    top20Keywords: keywords.filter((k) => k.currentPosition <= 20).length,
    totalClicks: keywords.reduce((a, k) => a + k.clicks, 0),
    totalImpressions: keywords.reduce((a, k) => a + k.impressions, 0),
  };
}
