'use server';

import 'server-only';
import { logger } from '@/lib/logging';

import { createServiceClient } from '@/lib/supabase/server';
import type { Market } from '@/lib/supabase/types';

// ============================================================
// Revenue Forecast — CTA Clicks × Affiliate Rates
//
// Joins cta_analytics (clicks) with affiliate_rates (CPA values)
// to calculate Expected Revenue per slug, provider, and market.
//
// Formula: Expected Revenue = Emerald Clicks × CPA × Conversion Rate
// Default conversion rate: 3% (conservative click-to-lead)
//
// SECURITY: All queries use service_role only.
// affiliate_rates is never exposed to the public frontend.
// ============================================================

/** Default conversion rate when no rate record has a custom one */
const DEFAULT_CONVERSION_RATE = 0.03;

// ── Types ────────────────────────────────────────────────────

export interface RevenueForecastBySlug {
  slug: string;
  market: Market;
  provider: string;
  emeraldClicks: number;
  totalClicks: number;
  cpaValue: number;
  currency: string;
  conversionRate: number;
  expectedRevenue: number;
}

export interface RevenueForecastSummary {
  /** Total expected revenue across all slugs (USD) */
  totalExpectedRevenue: number;
  /** Previous period expected revenue (for trend) */
  previousExpectedRevenue: number;
  /** Revenue trend: up/down/neutral */
  trend: 'up' | 'down' | 'neutral';
  /** Trend percentage change */
  trendChange: number;
  /** Monthly run rate (extrapolated from current period) */
  monthlyRunRate: number;
  /** Top revenue-generating slugs */
  topSlugs: RevenueForecastBySlug[];
  /** Revenue by market */
  byMarket: { market: Market; revenue: number; clicks: number }[];
  /** Revenue by provider */
  byProvider: { provider: string; revenue: number; clicks: number; cpa: number }[];
  /** Total emerald clicks (action buttons only) */
  totalEmeraldClicks: number;
  /** Total matched clicks (with CPA rate) */
  totalMatchedClicks: number;
  /** Weighted average CPA */
  avgCpa: number;
  /** Time range used */
  timeRange: '7d' | '30d';
}

// ── Main: Get Revenue Forecast ───────────────────────────────

export async function getRevenueForecast(
  timeRange: '7d' | '30d' = '30d'
): Promise<{ success: boolean; data: RevenueForecastSummary | null; error: string | null }> {
  try {
    const supabase = createServiceClient();

    // Time boundaries
    const now = new Date();
    const since = new Date();
    const prevStart = new Date();

    if (timeRange === '7d') {
      since.setDate(since.getDate() - 7);
      prevStart.setDate(prevStart.getDate() - 14);
    } else {
      since.setDate(since.getDate() - 30);
      prevStart.setDate(prevStart.getDate() - 60);
    }

    // 1. Fetch CTA clicks (emerald = action buttons only)
    const { data: clicks, error: clickError } = await supabase
      .from('cta_analytics')
      .select('slug, market, provider, variant')
      .gte('clicked_at', since.toISOString());

    if (clickError) {
      logger.error('[Revenue Forecast] Click query error:', clickError.message);
      return { success: false, data: null, error: clickError.message };
    }

    // 2. Fetch previous period clicks (for trend)
    const { data: prevClicks } = await supabase
      .from('cta_analytics')
      .select('slug, market, provider, variant')
      .gte('clicked_at', prevStart.toISOString())
      .lt('clicked_at', since.toISOString());

    // 3. Fetch active affiliate rates
    const { data: rates, error: rateError } = await supabase
      .from('affiliate_rates')
      .select('provider_name, market, cpa_value, currency, avg_conversion_rate')
      .eq('active', true);

    if (rateError) {
      // Table may not exist yet — return empty forecast gracefully
      if (rateError.code === '42P01' || rateError.message?.includes('does not exist')) {
        return { success: true, data: emptyForecast(timeRange), error: null };
      }
      logger.error('[Revenue Forecast] Rate query error:', rateError.message);
      return { success: false, data: null, error: rateError.message };
    }

    // 4. Build rate lookup: provider+market → { cpa, convRate }
    //    NULL market = global rate (fallback for all markets)
    const rateMap = new Map<string, { cpa: number; currency: string; convRate: number }>();
    for (const rate of rates || []) {
      // Specific market key
      if (rate.market) {
        rateMap.set(`${rate.provider_name}|${rate.market}`, {
          cpa: rate.cpa_value,
          currency: rate.currency,
          convRate: rate.avg_conversion_rate ?? DEFAULT_CONVERSION_RATE,
        });
      }
      // Global fallback (NULL market)
      rateMap.set(`${rate.provider_name}|*`, {
        cpa: rate.cpa_value,
        currency: rate.currency,
        convRate: rate.avg_conversion_rate ?? DEFAULT_CONVERSION_RATE,
      });
    }

    // Helper: lookup rate for provider+market
    function getRate(provider: string, market: string) {
      return (
        rateMap.get(`${provider}|${market}`) ||
        rateMap.get(`${provider}|*`) ||
        null
      );
    }

    // 5. Aggregate current period
    const slugAgg = new Map<string, {
      slug: string;
      market: Market;
      provider: string;
      emerald: number;
      total: number;
    }>();

    for (const row of clicks || []) {
      const key = `${row.slug}|${row.market}|${row.provider}`;
      let entry = slugAgg.get(key);
      if (!entry) {
        entry = {
          slug: row.slug,
          market: row.market as Market,
          provider: row.provider,
          emerald: 0,
          total: 0,
        };
        slugAgg.set(key, entry);
      }
      entry.total++;
      if (row.variant === 'emerald-shimmer') entry.emerald++;
    }

    // 6. Calculate expected revenue per slug
    const forecasts: RevenueForecastBySlug[] = [];
    let totalExpectedRevenue = 0;
    let totalEmeraldClicks = 0;
    let totalMatchedClicks = 0;

    // Market revenue aggregation
    const marketRev = new Map<Market, { revenue: number; clicks: number }>();
    const providerRev = new Map<string, { revenue: number; clicks: number; cpa: number }>();

    for (const entry of slugAgg.values()) {
      totalEmeraldClicks += entry.emerald;

      const rate = getRate(entry.provider, entry.market);
      if (!rate || entry.emerald === 0) continue;

      const expectedRev = entry.emerald * rate.cpa * rate.convRate;
      totalExpectedRevenue += expectedRev;
      totalMatchedClicks += entry.emerald;

      forecasts.push({
        slug: entry.slug,
        market: entry.market,
        provider: entry.provider,
        emeraldClicks: entry.emerald,
        totalClicks: entry.total,
        cpaValue: rate.cpa,
        currency: rate.currency,
        conversionRate: rate.convRate,
        expectedRevenue: Math.round(expectedRev * 100) / 100,
      });

      // Market aggregation
      const mk = marketRev.get(entry.market) || { revenue: 0, clicks: 0 };
      mk.revenue += expectedRev;
      mk.clicks += entry.emerald;
      marketRev.set(entry.market, mk);

      // Provider aggregation
      const pk = providerRev.get(entry.provider) || { revenue: 0, clicks: 0, cpa: rate.cpa };
      pk.revenue += expectedRev;
      pk.clicks += entry.emerald;
      providerRev.set(entry.provider, pk);
    }

    // 7. Calculate previous period revenue (for trend)
    let previousExpectedRevenue = 0;
    for (const row of prevClicks || []) {
      if (row.variant !== 'emerald-shimmer') continue;
      const rate = getRate(row.provider, row.market);
      if (rate) {
        previousExpectedRevenue += rate.cpa * rate.convRate;
      }
    }

    // 8. Build response
    forecasts.sort((a, b) => b.expectedRevenue - a.expectedRevenue);

    const trendChange = previousExpectedRevenue > 0
      ? Math.round(((totalExpectedRevenue - previousExpectedRevenue) / previousExpectedRevenue) * 100)
      : 0;

    const daysInRange = timeRange === '7d' ? 7 : 30;
    const monthlyRunRate = (totalExpectedRevenue / daysInRange) * 30;

    const byMarket = (['us', 'uk', 'ca', 'au'] as Market[]).map((m) => ({
      market: m,
      revenue: Math.round((marketRev.get(m)?.revenue || 0) * 100) / 100,
      clicks: marketRev.get(m)?.clicks || 0,
    })).sort((a, b) => b.revenue - a.revenue);

    const byProvider = Array.from(providerRev.entries())
      .map(([provider, data]) => ({
        provider,
        revenue: Math.round(data.revenue * 100) / 100,
        clicks: data.clicks,
        cpa: data.cpa,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    const avgCpa = totalMatchedClicks > 0
      ? Math.round((totalExpectedRevenue / (totalMatchedClicks * DEFAULT_CONVERSION_RATE)) * 100) / 100
      : 0;

    return {
      success: true,
      data: {
        totalExpectedRevenue: Math.round(totalExpectedRevenue * 100) / 100,
        previousExpectedRevenue: Math.round(previousExpectedRevenue * 100) / 100,
        trend: trendChange > 0 ? 'up' : trendChange < 0 ? 'down' : 'neutral',
        trendChange: Math.abs(trendChange),
        monthlyRunRate: Math.round(monthlyRunRate * 100) / 100,
        topSlugs: forecasts.slice(0, 15),
        byMarket,
        byProvider,
        totalEmeraldClicks,
        totalMatchedClicks,
        avgCpa,
        timeRange,
      },
      error: null,
    };
  } catch (error) {
    logger.error('[Revenue Forecast] Unexpected error:', error);
    return { success: false, data: null, error: 'Failed to calculate revenue forecast' };
  }
}

function emptyForecast(timeRange: '7d' | '30d'): RevenueForecastSummary {
  return {
    totalExpectedRevenue: 0,
    previousExpectedRevenue: 0,
    trend: 'neutral',
    trendChange: 0,
    monthlyRunRate: 0,
    topSlugs: [],
    byMarket: [],
    byProvider: [],
    totalEmeraldClicks: 0,
    totalMatchedClicks: 0,
    avgCpa: 0,
    timeRange,
  };
}

// ── Spike Revenue Valuation ──────────────────────────────────
// Called by spike-monitor to calculate potential revenue of a spike

export interface SpikeRevenueEstimate {
  provider: string;
  market: Market;
  emeraldClicks: number;
  cpaValue: number;
  conversionRate: number;
  potentialRevenue: number;
  hasRate: boolean;
}

export async function estimateSpikeRevenue(
  slug: string,
  market: Market,
  clicksLastHour: number,
  topProvider: string | null
): Promise<SpikeRevenueEstimate> {
  const supabase = createServiceClient();
  const provider = topProvider || 'unknown';

  // Lookup rate for this provider + market
  const { data: rates } = await supabase
    .from('affiliate_rates')
    .select('cpa_value, avg_conversion_rate')
    .eq('provider_name', provider)
    .eq('active', true)
    .or(`market.eq.${market},market.is.null`)
    .order('market', { ascending: false, nullsFirst: false })
    .limit(1);

  const rate = rates?.[0];

  if (!rate) {
    return {
      provider,
      market,
      emeraldClicks: clicksLastHour,
      cpaValue: 0,
      conversionRate: DEFAULT_CONVERSION_RATE,
      potentialRevenue: 0,
      hasRate: false,
    };
  }

  // Estimate: assume ~60% of spike clicks are emerald (action buttons)
  const estimatedEmerald = Math.round(clicksLastHour * 0.6);
  const convRate = rate.avg_conversion_rate ?? DEFAULT_CONVERSION_RATE;
  const potentialRevenue = estimatedEmerald * rate.cpa_value * convRate;

  return {
    provider,
    market,
    emeraldClicks: estimatedEmerald,
    cpaValue: rate.cpa_value,
    conversionRate: convRate,
    potentialRevenue: Math.round(potentialRevenue * 100) / 100,
    hasRate: true,
  };
}
