// lib/actions/content-health.ts
'use server';
import 'server-only';

import { createServiceClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logging';

// ── Types ──────────────────────────────────────────────────────────────────

export interface ContentHealthScore {
  slug: string;
  market: string;
  category: string | null;
  ranking_score: number;
  freshness_score: number;
  engagement_score: number;
  conversion_score: number;
  competitor_score: number;
  monthly_revenue: number;
  monthly_clicks: number;
  epc: number;
  health_delta: number;
  revenue_delta: number;
}

export interface ContentHealthResult {
  success: boolean;
  pagesScored: number;
  errors: string[];
}

// ── Score Normalization Helpers ────────────────────────────────────────────

/** Position 1 = 1.0, position 10 = 0.5, position 50+ = 0.0 */
function normalizeRankingScore(avgPosition: number): number {
  if (avgPosition <= 0) return 0;
  if (avgPosition <= 1) return 1.0;
  if (avgPosition >= 50) return 0;
  // Linear interpolation: 1→1.0, 10→0.5, 50→0.0
  if (avgPosition <= 10) return 1.0 - (avgPosition - 1) * (0.5 / 9);
  return 0.5 - (avgPosition - 10) * (0.5 / 40);
}

/** 0 days since modified = 1.0, 180+ days = 0.0 */
function normalizeFreshnessScore(daysSinceModified: number): number {
  if (daysSinceModified <= 0) return 1.0;
  if (daysSinceModified >= 180) return 0;
  return 1.0 - daysSinceModified / 180;
}

/** Normalize engagement: avg time on page (seconds) + scroll depth (0-100) */
function normalizeEngagementScore(
  avgTimeOnPage: number,
  avgScrollDepth: number,
): number {
  // Time: 0s = 0, 120s+ = 1.0 (2 min is great for a review article)
  const timeScore = Math.min(avgTimeOnPage / 120, 1.0);
  // Scroll: 0-100 → 0-1
  const scrollScore = Math.min(avgScrollDepth / 100, 1.0);
  // Weighted: 60% time, 40% scroll
  return timeScore * 0.6 + scrollScore * 0.4;
}

/** Normalize EPC relative to category average. 2x avg = 1.0 */
function normalizeConversionScore(epc: number, categoryAvgEpc: number): number {
  if (categoryAvgEpc <= 0 || epc <= 0) return 0;
  const ratio = epc / categoryAvgEpc;
  return Math.min(ratio / 2, 1.0); // 2x the category average = 1.0
}

/** CPS-based competitor score. High CPS + low own position = opportunity */
function normalizeCompetitorScore(
  avgCps: number,
  avgOwnPosition: number,
): number {
  // CPS ranges 0-100 typically. Higher = more competitive.
  // Own position: lower is better (1 = top)
  // Score high when we rank well in competitive keywords
  const cpsNorm = Math.min(avgCps / 80, 1.0);
  const posNorm = avgOwnPosition > 0 ? normalizeRankingScore(avgOwnPosition) : 0;
  // Balanced: if we rank well AND it's competitive, that's great
  return cpsNorm * 0.4 + posNorm * 0.6;
}

// ── Main: Compute Health Scores ────────────────────────────────────────────

export async function computeContentHealthScores(): Promise<ContentHealthResult> {
  const errors: string[] = [];
  const supabase = createServiceClient();

  try {
    // ── Step 1: Get all content pages from content_freshness ──
    const { data: pages, error: pagesErr } = await supabase
      .from('content_freshness')
      .select('slug, market, category, publish_date, modified_date');

    if (pagesErr || !pages) {
      logger.error('[content-health] Failed to load pages', { error: pagesErr?.message });
      return { success: false, pagesScored: 0, errors: [pagesErr?.message ?? 'No pages found'] };
    }

    // ── Step 2: Load all data sources in parallel ──
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

    const [
      rankingsResult,
      pageViewsResult,
      ctaClicksResult,
      conversionsResult,
      competitorResult,
      previousScoresResult,
    ] = await Promise.all([
      // Rankings from GSC keyword tracking
      supabase
        .from('keyword_tracking')
        .select('page, market, current_position, clicks, impressions, ctr'),

      // Page views (last 30 days) for engagement
      supabase
        .from('page_views')
        .select('article_slug, market, time_on_page, scroll_depth')
        .gte('viewed_at', thirtyDaysAgo),

      // CTA clicks (last 30 days)
      supabase
        .from('cta_analytics')
        .select('slug, market')
        .gte('clicked_at', thirtyDaysAgo),

      // Conversions (last 90 days) joined with link_clicks for page attribution
      supabase
        .from('conversions')
        .select('commission_earned, status, link_id, currency')
        .eq('status', 'approved')
        .gte('converted_at', ninetyDaysAgo),

      // Competitor keywords
      supabase
        .from('competitor_tracked_keywords')
        .select('keyword, market, latest_cps, latest_own_position')
        .eq('active', true),

      // Previous health scores (for delta calculation)
      supabase
        .from('content_health_scores')
        .select('slug, market, health_score, monthly_revenue'),
    ]);

    // Also load link_clicks for EPC calculation
    const { data: linkClicks } = await supabase
      .from('link_clicks')
      .select('id, link_id, page_slug')
      .gte('clicked_at', ninetyDaysAgo);

    // Load affiliate_links for category mapping
    const { data: affiliateLinks } = await supabase
      .from('affiliate_links')
      .select('id, slug, category, market');

    // ── Step 3: Build lookup maps ──
    const rankings = rankingsResult.data ?? [];
    const pageViews = pageViewsResult.data ?? [];
    const ctaClicks = ctaClicksResult.data ?? [];
    const conversions = conversionsResult.data ?? [];
    const competitors = competitorResult.data ?? [];
    const previousScores = previousScoresResult.data ?? [];
    const clicks = linkClicks ?? [];
    const links = affiliateLinks ?? [];

    // Rankings by page+market (page field contains URL path)
    const rankingMap = new Map<string, { positions: number[]; clicks: number; impressions: number }>();
    for (const r of rankings) {
      if (!r.page || !r.market) continue;
      // Normalize page path: extract slug from full URL if needed
      const slug = r.page.startsWith('/') ? r.page : `/${r.page}`;
      const key = `${slug}::${r.market}`;
      const existing = rankingMap.get(key) ?? { positions: [], clicks: 0, impressions: 0 };
      existing.positions.push(r.current_position);
      existing.clicks += r.clicks ?? 0;
      existing.impressions += r.impressions ?? 0;
      rankingMap.set(key, existing);
    }

    // Engagement by slug+market
    const engagementMap = new Map<string, { totalTime: number; totalScroll: number; count: number }>();
    for (const pv of pageViews) {
      if (!pv.article_slug || !pv.market) continue;
      const key = `${pv.article_slug}::${pv.market}`;
      const existing = engagementMap.get(key) ?? { totalTime: 0, totalScroll: 0, count: 0 };
      existing.totalTime += pv.time_on_page ?? 0;
      existing.totalScroll += pv.scroll_depth ?? 0;
      existing.count += 1;
      engagementMap.set(key, existing);
    }

    // CTA clicks count by slug+market
    const ctaMap = new Map<string, number>();
    for (const c of ctaClicks) {
      if (!c.slug || !c.market) continue;
      const key = `${c.slug}::${c.market}`;
      ctaMap.set(key, (ctaMap.get(key) ?? 0) + 1);
    }

    // Link ID → affiliate link mapping
    const linkById = new Map<string, { category: string; market: string }>();
    for (const l of links) {
      linkById.set(l.id, { category: l.category ?? '', market: l.market ?? '' });
    }

    // Revenue by link_id
    const revenueByLink = new Map<string, number>();
    for (const c of conversions) {
      if (!c.link_id) continue;
      revenueByLink.set(c.link_id, (revenueByLink.get(c.link_id) ?? 0) + (c.commission_earned ?? 0));
    }

    // Clicks by page_slug+link_id → for EPC calculation per page
    const clicksByPage = new Map<string, { totalClicks: number; totalRevenue: number }>();
    for (const click of clicks) {
      if (!click.page_slug || !click.link_id) continue;
      const pageKey = click.page_slug;
      const existing = clicksByPage.get(pageKey) ?? { totalClicks: 0, totalRevenue: 0 };
      existing.totalClicks += 1;
      const rev = revenueByLink.get(click.link_id) ?? 0;
      // Proportional attribution: this click's share of link revenue
      existing.totalRevenue += rev; // Will normalize by total clicks on this link below
      clicksByPage.set(pageKey, existing);
    }

    // Category avg EPC (for conversion score normalization)
    const categoryRevenue = new Map<string, { revenue: number; clicks: number }>();
    for (const click of clicks) {
      if (!click.link_id) continue;
      const link = linkById.get(click.link_id);
      if (!link?.category) continue;
      const existing = categoryRevenue.get(link.category) ?? { revenue: 0, clicks: 0 };
      existing.clicks += 1;
      existing.revenue += revenueByLink.get(click.link_id) ?? 0;
      categoryRevenue.set(link.category, existing);
    }

    const categoryAvgEpc = new Map<string, number>();
    for (const [cat, data] of categoryRevenue) {
      categoryAvgEpc.set(cat, data.clicks > 0 ? data.revenue / data.clicks : 0);
    }

    // Competitor scores by market (aggregated across keywords for pages we rank on)
    const competitorMap = new Map<string, { totalCps: number; totalPos: number; count: number }>();
    for (const c of competitors) {
      if (!c.market || !c.latest_own_position || c.latest_own_position <= 0) continue;
      // Group by market since we don't have direct slug→keyword mapping here
      const key = c.market;
      const existing = competitorMap.get(key) ?? { totalCps: 0, totalPos: 0, count: 0 };
      existing.totalCps += c.latest_cps ?? 0;
      existing.totalPos += c.latest_own_position;
      existing.count += 1;
      competitorMap.set(key, existing);
    }

    // Previous scores for delta calculation
    const prevScoreMap = new Map<string, { health: number; revenue: number }>();
    for (const p of previousScores) {
      prevScoreMap.set(`${p.slug}::${p.market}`, {
        health: Number(p.health_score) || 0,
        revenue: Number(p.monthly_revenue) || 0,
      });
    }

    // ── Step 4: Compute scores for each page ──
    const scores: ContentHealthScore[] = [];
    const now = new Date();

    for (const page of pages) {
      const { slug, market, category } = page;
      if (!slug || !market) continue;

      const key = `${slug}::${market}`;

      // Ranking score
      const ranking = rankingMap.get(key);
      const avgPos = ranking && ranking.positions.length > 0
        ? ranking.positions.reduce((a, b) => a + b, 0) / ranking.positions.length
        : 0;
      const rankingScore = ranking ? normalizeRankingScore(avgPos) : 0;

      // Freshness score
      const modDate = page.modified_date ? new Date(page.modified_date) : null;
      const pubDate = page.publish_date ? new Date(page.publish_date) : null;
      const latestDate = modDate ?? pubDate ?? now;
      const daysSinceModified = Math.floor((now.getTime() - latestDate.getTime()) / (1000 * 60 * 60 * 24));
      const freshnessScore = normalizeFreshnessScore(daysSinceModified);

      // Engagement score
      const engagement = engagementMap.get(key);
      const avgTime = engagement && engagement.count > 0 ? engagement.totalTime / engagement.count : 0;
      const avgScroll = engagement && engagement.count > 0 ? engagement.totalScroll / engagement.count : 0;
      const engagementScore = normalizeEngagementScore(avgTime, avgScroll);

      // Conversion score (EPC-based)
      const pageClicks = clicksByPage.get(slug);
      const pageEpc = pageClicks && pageClicks.totalClicks > 0
        ? pageClicks.totalRevenue / pageClicks.totalClicks
        : 0;
      const catAvgEpc = categoryAvgEpc.get(category ?? '') ?? 0;
      const conversionScore = normalizeConversionScore(pageEpc, catAvgEpc > 0 ? catAvgEpc : 1);

      // Competitor score (market-level)
      const comp = competitorMap.get(market);
      const avgCps = comp && comp.count > 0 ? comp.totalCps / comp.count : 0;
      const avgCompPos = comp && comp.count > 0 ? comp.totalPos / comp.count : 0;
      const competitorScore = normalizeCompetitorScore(avgCps, avgCompPos);

      // Revenue metrics
      const monthlyClicks = ranking?.clicks ?? 0;
      const monthlyRevenue = pageClicks?.totalRevenue ?? 0;
      const epc = monthlyClicks > 0 ? monthlyRevenue / monthlyClicks : 0;

      // Delta vs previous week
      const prev = prevScoreMap.get(key);
      // health_score is computed by DB, so estimate it here for delta
      const estimatedHealth =
        rankingScore * 0.25 +
        freshnessScore * 0.15 +
        engagementScore * 0.15 +
        conversionScore * 0.30 +
        competitorScore * 0.15;
      const healthDelta = prev ? estimatedHealth - prev.health : 0;
      const revenueDelta = prev ? monthlyRevenue - prev.revenue : 0;

      scores.push({
        slug,
        market,
        category: category ?? null,
        ranking_score: clamp(rankingScore),
        freshness_score: clamp(freshnessScore),
        engagement_score: clamp(engagementScore),
        conversion_score: clamp(conversionScore),
        competitor_score: clamp(competitorScore),
        monthly_revenue: round2(monthlyRevenue),
        monthly_clicks: monthlyClicks,
        epc: round4(epc),
        health_delta: round3(healthDelta),
        revenue_delta: round2(revenueDelta),
      });
    }

    // ── Step 5: Upsert all scores ──
    if (scores.length === 0) {
      logger.warn('[content-health] No pages to score');
      return { success: true, pagesScored: 0, errors: [] };
    }

    // Batch upsert in chunks of 100
    const BATCH_SIZE = 100;
    let upserted = 0;

    for (let i = 0; i < scores.length; i += BATCH_SIZE) {
      const batch = scores.slice(i, i + BATCH_SIZE).map((s) => ({
        slug: s.slug,
        market: s.market,
        category: s.category,
        ranking_score: s.ranking_score,
        freshness_score: s.freshness_score,
        engagement_score: s.engagement_score,
        conversion_score: s.conversion_score,
        competitor_score: s.competitor_score,
        monthly_revenue: s.monthly_revenue,
        monthly_clicks: s.monthly_clicks,
        epc: s.epc,
        health_delta: s.health_delta,
        revenue_delta: s.revenue_delta,
        computed_at: new Date().toISOString(),
      }));

      const { error: upsertErr } = await supabase
        .from('content_health_scores')
        .upsert(batch, { onConflict: 'slug,market' });

      if (upsertErr) {
        const msg = `Batch ${i / BATCH_SIZE + 1} upsert failed: ${upsertErr.message}`;
        logger.error(`[content-health] ${msg}`);
        errors.push(msg);
      } else {
        upserted += batch.length;
      }
    }

    logger.info(`[content-health] Scored ${upserted}/${pages.length} pages`, {
      markets: [...new Set(scores.map((s) => s.market))],
      avgHealth: round3(
        scores.reduce(
          (sum, s) =>
            sum +
            s.ranking_score * 0.25 +
            s.freshness_score * 0.15 +
            s.engagement_score * 0.15 +
            s.conversion_score * 0.30 +
            s.competitor_score * 0.15,
          0,
        ) / scores.length,
      ),
    });

    return { success: errors.length === 0, pagesScored: upserted, errors };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    logger.error('[content-health] Fatal error', { error: msg });
    return { success: false, pagesScored: 0, errors: [msg] };
  }
}

// ── Numeric helpers ────────────────────────────────────────────────────────

function clamp(v: number): number {
  return Math.max(0, Math.min(1, Number(v.toFixed(3))));
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

function round3(v: number): number {
  return Math.round(v * 1000) / 1000;
}

function round4(v: number): number {
  return Math.round(v * 10000) / 10000;
}
