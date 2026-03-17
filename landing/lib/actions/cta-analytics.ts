'use server';

// ============================================================
// CTA Click Analytics
// Granular tracking for affiliate CTA buttons
// ============================================================
// All Node.js-only imports (crypto, next/headers, supabase/server)
// are dynamically imported INSIDE each function body to prevent
// Turbopack HMR crashes in dev mode. See newsletter.ts for details.
// ============================================================

import type { CtaVariant, Market } from '@/lib/supabase/types';

interface LogCtaClickParams {
  /** Page slug, e.g. '/personal-finance/best-robo-advisors' */
  slug: string;
  /** Provider name, e.g. 'Wealthfront', 'Schwab Intelligent' */
  provider: string;
  /** Button variant: 'emerald-shimmer' (action) or 'violet-pill' (learn more) */
  variant: CtaVariant;
  /** Market code */
  market?: Market;
  /** Client session ID */
  sessionId?: string;
}

export async function logCtaClick(params: LogCtaClickParams) {
  try {
    const { createServiceClient } = await import('@/lib/supabase/server');
    const { headers } = await import('next/headers');
    const crypto = await import('crypto');

    const supabase = createServiceClient();
    const headersList = await headers();

    // Extract device info
    const userAgent = headersList.get('user-agent') || '';
    const deviceType = getDeviceType(userAgent);

    // Privacy-safe IP hash (GDPR-compliant, truncated SHA-256)
    const forwardedFor = headersList.get('x-forwarded-for');
    const realIp = headersList.get('x-real-ip');
    const ip = forwardedFor?.split(',')[0] || realIp || 'unknown';
    const ipHash = crypto.createHash('sha256').update(ip).digest('hex').slice(0, 16);

    const { error } = await supabase.from('cta_analytics').insert({
      slug: params.slug,
      provider: params.provider,
      variant: params.variant,
      market: params.market || 'us',
      session_id: params.sessionId || null,
      device_type: deviceType,
      ip_hash: ipHash,
    });

    if (error) {
      console.error('[CTA Analytics] Insert error:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    // Fail silently — analytics should never break the user experience
    console.error('[CTA Analytics] Unexpected error:', error);
    return { success: false, error: 'Failed to log CTA click' };
  }
}

// ============================================================
// Dashboard Query: CTA Performance by Provider
// ============================================================

interface CtaPerformanceParams {
  slug?: string;
  market?: Market;
  daysBack?: number;
}

export async function getCtaPerformance(params: CtaPerformanceParams = {}) {
  try {
    const { createServiceClient } = await import('@/lib/supabase/server');

    const supabase = createServiceClient();
    const daysBack = params.daysBack || 30;

    const since = new Date();
    since.setDate(since.getDate() - daysBack);

    let query = supabase
      .from('cta_analytics')
      .select('provider, variant, slug, market')
      .gte('clicked_at', since.toISOString());

    if (params.slug) {
      query = query.eq('slug', params.slug);
    }
    if (params.market) {
      query = query.eq('market', params.market);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[CTA Analytics] Query error:', error.message);
      return { success: false, data: null, error: error.message };
    }

    // Aggregate: clicks per provider × variant
    const stats = (data || []).reduce(
      (acc, row) => {
        const key = `${row.provider}|${row.variant}`;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // Transform into array sorted by clicks desc
    const results = Object.entries(stats)
      .map(([key, clicks]) => {
        const [provider, variant] = key.split('|');
        return { provider, variant, clicks };
      })
      .sort((a, b) => b.clicks - a.clicks);

    return { success: true, data: results, error: null };
  } catch (error) {
    console.error('[CTA Analytics] Unexpected error:', error);
    return { success: false, data: null, error: 'Failed to query CTA performance' };
  }
}

// ============================================================
// Dashboard Query: CTA Heatmap Data
// Returns click density per page for the heatmap grid
// ============================================================

export type HeatmapTimeRange = '24h' | '7d' | '30d';

export interface HeatmapCell {
  slug: string;
  market: Market;
  totalClicks: number;
  emeraldClicks: number;
  violetClicks: number;
  topProvider: string | null;
  /** Normalized 0-100 intensity score */
  intensity: number;
  /** Page views in the same time range */
  pageViews: number;
  /** CTR = totalClicks / pageViews (0-100 %) */
  ctr: number;
}

export interface HeatmapData {
  cells: HeatmapCell[];
  totalClicks: number;
  maxClicks: number;
  hottest: HeatmapCell | null;
  timeRange: HeatmapTimeRange;
}

export async function getCtaHeatmapData(
  timeRange: HeatmapTimeRange = '7d',
  marketFilter?: Market
): Promise<{ success: boolean; data: HeatmapData | null; error: string | null }> {
  try {
    const { createServiceClient } = await import('@/lib/supabase/server');

    const supabase = createServiceClient();

    // Calculate time boundary
    const since = new Date();
    if (timeRange === '24h') since.setHours(since.getHours() - 24);
    else if (timeRange === '7d') since.setDate(since.getDate() - 7);
    else since.setDate(since.getDate() - 30);

    let query = supabase
      .from('cta_analytics')
      .select('slug, market, variant, provider')
      .gte('clicked_at', since.toISOString());

    if (marketFilter) {
      query = query.eq('market', marketFilter);
    }

    const { data, error } = await query;

    if (error) {
      // Table may not exist yet — return empty data gracefully
      if (error.code === 'PGRST204' || error.code === '42P01') {
        return { success: true, data: emptyHeatmap(timeRange), error: null };
      }
      console.error('[CTA Heatmap] Query error:', error.message);
      return { success: false, data: null, error: error.message };
    }

    const rows = data || [];

    // Query page_views for CTR calculation (same time window + market filter)
    let pvQuery = supabase
      .from('page_views')
      .select('page_path, market')
      .gte('viewed_at', since.toISOString());

    if (marketFilter) {
      pvQuery = pvQuery.eq('market', marketFilter);
    }

    const { data: pvData } = await pvQuery;

    // Aggregate page views per slug+market
    const pvMap = new Map<string, number>();
    for (const row of pvData || []) {
      const key = `${row.page_path}|${row.market}`;
      pvMap.set(key, (pvMap.get(key) || 0) + 1);
    }

    // Aggregate per slug+market
    const slugMap = new Map<
      string,
      {
        slug: string;
        market: Market;
        total: number;
        emerald: number;
        violet: number;
        providers: Map<string, number>;
      }
    >();

    for (const row of rows) {
      const key = `${row.slug}|${row.market}`;
      let entry = slugMap.get(key);
      if (!entry) {
        entry = {
          slug: row.slug,
          market: row.market as Market,
          total: 0,
          emerald: 0,
          violet: 0,
          providers: new Map(),
        };
        slugMap.set(key, entry);
      }
      entry.total++;
      if (row.variant === 'emerald-shimmer') entry.emerald++;
      else entry.violet++;
      entry.providers.set(row.provider, (entry.providers.get(row.provider) || 0) + 1);
    }

    // Find max clicks for normalization
    let maxClicks = 0;
    for (const entry of slugMap.values()) {
      if (entry.total > maxClicks) maxClicks = entry.total;
    }

    // Build cells with normalized intensity
    const cells: HeatmapCell[] = Array.from(slugMap.values())
      .map((entry) => {
        // Find top provider
        let topProvider: string | null = null;
        let topProviderCount = 0;
        for (const [provider, count] of entry.providers) {
          if (count > topProviderCount) {
            topProvider = provider;
            topProviderCount = count;
          }
        }

        const pvKey = `${entry.slug}|${entry.market}`;
        const pageViews = pvMap.get(pvKey) || 0;
        const ctr = pageViews > 0 ? (entry.total / pageViews) * 100 : 0;

        return {
          slug: entry.slug,
          market: entry.market,
          totalClicks: entry.total,
          emeraldClicks: entry.emerald,
          violetClicks: entry.violet,
          topProvider,
          intensity: maxClicks > 0 ? Math.round((entry.total / maxClicks) * 100) : 0,
          pageViews,
          ctr: Math.round(ctr * 100) / 100, // 2 decimal precision
        };
      })
      .sort((a, b) => b.totalClicks - a.totalClicks);

    const totalClicks = rows.length;
    const hottest = cells.length > 0 ? cells[0] : null;

    return {
      success: true,
      data: { cells, totalClicks, maxClicks, hottest, timeRange },
      error: null,
    };
  } catch (error) {
    console.error('[CTA Heatmap] Unexpected error:', error);
    return { success: false, data: null, error: 'Failed to load heatmap data' };
  }
}

function emptyHeatmap(timeRange: HeatmapTimeRange): HeatmapData {
  return { cells: [], totalClicks: 0, maxClicks: 0, hottest: null, timeRange };
}

// ============================================================
// CTR Calculation for Spike Monitor
// Returns CTR for a specific slug over the last N hours
// ============================================================

export interface SlugCtrResult {
  slug: string;
  clicks: number;
  pageViews: number;
  ctr: number; // 0-100 %
}

export async function getSlugCtr(
  slug: string,
  hoursBack: number = 24
): Promise<SlugCtrResult> {
  const { createServiceClient } = await import('@/lib/supabase/server');

  const supabase = createServiceClient();
  const since = new Date();
  since.setHours(since.getHours() - hoursBack);
  const sinceStr = since.toISOString();

  // Parallel queries: clicks + page views
  const [clicksResult, viewsResult] = await Promise.all([
    supabase
      .from('cta_analytics')
      .select('id', { count: 'exact', head: true })
      .eq('slug', slug)
      .gte('clicked_at', sinceStr),
    supabase
      .from('page_views')
      .select('id', { count: 'exact', head: true })
      .eq('page_path', slug)
      .gte('viewed_at', sinceStr),
  ]);

  const clicks = clicksResult.count || 0;
  const pageViews = viewsResult.count || 0;
  const ctr = pageViews > 0 ? (clicks / pageViews) * 100 : 0;

  return {
    slug,
    clicks,
    pageViews,
    ctr: Math.round(ctr * 100) / 100,
  };
}

// ============================================================
// Helper
// ============================================================

function getDeviceType(ua: string): 'desktop' | 'mobile' | 'tablet' | 'unknown' {
  if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
  if (/mobile|iphone|ipod|android.*mobile|blackberry|opera mini|iemobile/i.test(ua))
    return 'mobile';
  if (/windows|macintosh|linux/i.test(ua)) return 'desktop';
  return 'unknown';
}
