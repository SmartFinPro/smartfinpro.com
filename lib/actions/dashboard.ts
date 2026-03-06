'use server';

import 'server-only';
import { logger } from '@/lib/logging';

import { createServiceClient } from '@/lib/supabase/server';
import type { LinkClick, Conversion, AffiliateLink, PageView } from '@/lib/supabase/types';

// ============================================================
// SAFE QUERY HELPER
// Returns empty data instead of throwing when a table doesn't exist.
// This prevents the dashboard from crashing if migrations haven't
// been applied yet (e.g. page_views, leads, newsletter_subscribers).
// ============================================================
type SupabaseResult<T> = { data: T[] | null; count: number | null; error: { code?: string; message?: string } | null };

function safeData<T>(result: SupabaseResult<T>): T[] {
  if (result.error) {
    // PGRST204 = table not found in schema cache — safe to ignore
    if (result.error.code === 'PGRST204' || result.error.message?.includes('schema cache')) {
      return [];
    }
    // Log unexpected errors but don't crash
    logger.warn('[dashboard] Query warning:', result.error.message);
  }
  return result.data || [];
}

function safeCount(result: SupabaseResult<unknown>): number {
  if (result.error) return 0;
  return result.count || 0;
}

export type TimeRange = '24h' | '7d' | '30d' | 'all';

// Time comparison data
export interface TimeComparison {
  current: number;
  previous: number;
  change: number; // percentage change
  trend: 'up' | 'down' | 'neutral';
}

// Action items / Alerts
export interface ActionItem {
  id: string;
  type: 'warning' | 'insight' | 'success' | 'urgent';
  title: string;
  description: string;
  metric?: string;
  link?: string;
  timestamp: Date;
}

// Lead quality score
export interface LeadQualityData {
  totalLeads: number;
  avgEngagementScore: number;
  highQualityLeads: number;
  conversionPotential: number;
}

export interface DashboardStats {
  totalClicks: number;
  totalClicksInRange: number;
  totalRevenue: number;
  activeLinks: number;
  conversionRate: string;
  recentClicks: ClickData[];
  clicksOverTime: TimeSeriesData[];
  topLinks: TopLink[];
  geoStats: GeoStat[];
  topPages: PageStat[];
  deviceStats: DeviceStats;
  // Funnel data
  funnelData: FunnelData;
  // Scroll depth data
  scrollDepthStats: ScrollDepthStat[];
  averageScrollDepth: number;
  // Problem articles ("Sorgenkinder")
  problemArticles: ProblemArticle[];
  // NEW: Time comparisons
  clicksComparison: TimeComparison;
  revenueComparison: TimeComparison;
  leadsComparison: TimeComparison;
  // NEW: Action items
  actionItems: ActionItem[];
  // NEW: Lead quality
  leadQuality: LeadQualityData;
  // NEW: Revenue in range
  revenueInRange: number;
  // NEW: Leads count
  leadsInRange: number;
}

export interface FunnelData {
  clicks: number;
  conversions: number;
  approvedConversions: number;
  approvedRevenue: number;
}

export interface ClickData {
  id: string;
  slug: string;
  partner_name: string;
  country_code: string;
  country_name: string;
  clicked_at: string;
  utm_source: string | null;
  referrer: string | null;
  referrer_domain: string | null;
  source_page: string | null;
}

// Extended geo stats with top referrers
export interface GeoStatExtended {
  country_code: string;
  country_name: string;
  flag: string;
  clicks: number;
  percentage: number;
  topReferrers: { domain: string; count: number }[];
  topProducts: { name: string; clicks: number }[];
  recentClicks: { time: string; product: string; referrer: string }[];
}

export interface TimeSeriesData {
  label: string;
  clicks: number;
}

export interface TopLink {
  slug: string;
  partner_name: string;
  clicks: number;
  category: string;
  revenue: number;
  conversions: number;
  epc: string; // Earnings Per Click
}

export interface GeoStat {
  country_code: string;
  country_name: string;
  clicks: number;
  percentage: number;
}

export interface PageStat {
  page: string;
  clicks: number;
  percentage: number;
}

export interface DeviceStats {
  mobile: number;
  desktop: number;
  tablet: number;
  mobilePercent: number;
  desktopPercent: number;
  tabletPercent: number;
}

export interface ScrollDepthStat {
  page_path: string;
  article_slug: string | null;
  page_title: string | null;
  avg_scroll_depth: number;
  view_count: number;
}

// "Sorgenkinder" - Articles with high engagement but low affiliate CTR
export interface ProblemArticle {
  page_path: string;
  page_title: string | null;
  article_slug: string | null;
  category: string | null;
  // Engagement metrics (high = good content)
  avg_time_on_page: number; // in seconds
  avg_scroll_depth: number;
  page_views: number;
  // Conversion metrics (low = problem)
  affiliate_clicks: number;
  ctr: number; // click-through rate %
  // Calculated score (higher = bigger problem)
  opportunity_score: number;
  // Recommendations
  recommendations: string[];
}

// ============================================================
// GLOBAL MARKET INTELLIGENCE TYPES
// ============================================================

export type MarketCode = 'US' | 'GB' | 'CA' | 'AU';

export interface MarketSparklineData {
  label: string;
  clicks: number;
  revenue: number;
}

export interface MarketPerformance {
  market: MarketCode;
  marketName: string;
  flag: string;
  currency: string;
  currencySymbol: string;
  // Core Metrics
  clicks: number;
  clicksTrend: 'up' | 'down' | 'neutral';
  clicksChange: number;
  revenue: number; // in USD
  revenueLocal: number; // in local currency
  revenueChange: number;
  revenueTrend: 'up' | 'down' | 'neutral';
  // Performance
  conversions: number;
  conversionRate: number;
  epc: number; // Earnings Per Click in USD
  // Engagement
  avgScrollDepth: number;
  engagementScore: number; // 0-100
  // Top Performer
  topProduct: string;
  topProductClicks: number;
  topProductRevenue: number;
  // Sparkline data (last 7 days)
  sparklineData: MarketSparklineData[];
  // Ranking
  isLeader: boolean;
  rank: number;
}

export interface MarketOpportunity {
  id: string;
  market: MarketCode;
  type: 'growth' | 'warning' | 'optimization' | 'expansion';
  title: string;
  description: string;
  metric: string;
  action: string;
  priority: 'high' | 'medium' | 'low';
}

export interface GlobalMarketIntelligence {
  markets: MarketPerformance[];
  opportunities: MarketOpportunity[];
  leaderMarket: MarketCode;
  totalGlobalRevenue: number;
  totalGlobalClicks: number;
}

// Country code to name mapping
const countryNames: Record<string, string> = {
  US: 'United States',
  GB: 'United Kingdom',
  UK: 'United Kingdom',
  CA: 'Canada',
  AU: 'Australia',
  DE: 'Germany',
  FR: 'France',
  ES: 'Spain',
  IT: 'Italy',
  NL: 'Netherlands',
  BR: 'Brazil',
  IN: 'India',
  JP: 'Japan',
  CN: 'China',
  KR: 'South Korea',
  MX: 'Mexico',
  XX: 'Unknown',
};

function getCountryName(code: string): string {
  return countryNames[code] || code;
}

// Market configuration for Global Market Intelligence
const marketConfig: Record<MarketCode, {
  name: string;
  flag: string;
  currency: string;
  symbol: string;
  langCode: string;
  exchangeRate: number; // to USD
}> = {
  US: { name: 'United States', flag: '🇺🇸', currency: 'USD', symbol: '$', langCode: 'en-US', exchangeRate: 1 },
  GB: { name: 'United Kingdom', flag: '🇬🇧', currency: 'GBP', symbol: '£', langCode: 'en-GB', exchangeRate: 1.27 },
  CA: { name: 'Canada', flag: '🇨🇦', currency: 'CAD', symbol: 'C$', langCode: 'en-CA', exchangeRate: 0.74 },
  AU: { name: 'Australia', flag: '🇦🇺', currency: 'AUD', symbol: 'A$', langCode: 'en-AU', exchangeRate: 0.65 },
};

// Map country codes to market codes
function getMarketFromCountry(countryCode: string): MarketCode | null {
  const mapping: Record<string, MarketCode> = {
    US: 'US',
    GB: 'GB',
    UK: 'GB',
    CA: 'CA',
    AU: 'AU',
  };
  return mapping[countryCode] || null;
}

function getTimeRangeStart(range: TimeRange): Date | null {
  const now = new Date();
  switch (range) {
    case '24h':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case 'all':
      return null;
  }
}

// Get previous period for comparison
function getPreviousPeriodRange(range: TimeRange): { start: Date; end: Date } | null {
  const now = new Date();
  switch (range) {
    case '24h':
      return {
        start: new Date(now.getTime() - 48 * 60 * 60 * 1000),
        end: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      };
    case '7d':
      return {
        start: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
        end: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      };
    case '30d':
      return {
        start: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
        end: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      };
    case 'all':
      return null;
  }
}

// Calculate percentage change
function calculateChange(current: number, previous: number): TimeComparison {
  if (previous === 0) {
    return {
      current,
      previous,
      change: current > 0 ? 100 : 0,
      trend: current > 0 ? 'up' : 'neutral',
    };
  }
  const change = Math.round(((current - previous) / previous) * 100);
  return {
    current,
    previous,
    change: Math.abs(change),
    trend: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
  };
}

function parseDevice(userAgent: string | null): 'mobile' | 'tablet' | 'desktop' {
  if (!userAgent) return 'desktop';
  const ua = userAgent.toLowerCase();

  if (/ipad|tablet|playbook|silk/i.test(ua)) return 'tablet';
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) return 'mobile';
  return 'desktop';
}

function extractPagePath(referrer: string | null): string {
  if (!referrer) return 'Direct';
  try {
    const url = new URL(referrer);
    // Only track internal pages
    if (url.hostname.includes('localhost') || url.hostname.includes('smartfinpro')) {
      return url.pathname || '/';
    }
    return 'External: ' + url.hostname;
  } catch {
    return 'Direct';
  }
}

export async function getDashboardStats(range: TimeRange = '24h'): Promise<DashboardStats> {
  const supabase = createServiceClient();
  const now = new Date();
  const rangeStart = getTimeRangeStart(range);
  const previousPeriod = getPreviousPeriodRange(range);

  // Base query for clicks in range
  let clicksQuery = supabase
    .from('link_clicks')
    .select('id, link_id, country_code, clicked_at, utm_source, referrer, user_agent');

  if (rangeStart) {
    clicksQuery = clicksQuery.gte('clicked_at', rangeStart.toISOString());
  }

  const { data: clicksInRange } = await clicksQuery.order('clicked_at', { ascending: false });
  type ClickRecord = Pick<LinkClick, 'id' | 'link_id' | 'country_code' | 'clicked_at' | 'utm_source' | 'referrer' | 'user_agent'>;

  // Fetch previous period clicks for comparison
  let previousClicksCount = 0;
  if (previousPeriod) {
    const { count } = await supabase
      .from('link_clicks')
      .select('*', { count: 'exact', head: true })
      .gte('clicked_at', previousPeriod.start.toISOString())
      .lt('clicked_at', previousPeriod.end.toISOString());
    previousClicksCount = count || 0;
  }
  const clicks = (clicksInRange || []) as ClickRecord[];

  // Get total clicks (all time)
  const { count: totalClicks } = await supabase
    .from('link_clicks')
    .select('*', { count: 'exact', head: true });

  // Get all conversions with link info for EPC calculation
  const { data: allConversions } = await supabase
    .from('conversions')
    .select('link_id, commission_earned, status');

  const conversions = (allConversions || []) as Pick<Conversion, 'link_id' | 'commission_earned' | 'status'>[];
  const approvedConversions = conversions.filter((c) => c.status === 'approved');
  const totalRevenue = approvedConversions.reduce((sum, c) => sum + (c.commission_earned || 0), 0);

  // Build revenue map by link_id
  const linkRevenueMap = new Map<string, { revenue: number; conversions: number }>();
  approvedConversions.forEach((c) => {
    if (c.link_id) {
      const current = linkRevenueMap.get(c.link_id) || { revenue: 0, conversions: 0 };
      linkRevenueMap.set(c.link_id, {
        revenue: current.revenue + (c.commission_earned || 0),
        conversions: current.conversions + 1,
      });
    }
  });

  // Get active links count
  const { count: activeLinks } = await supabase
    .from('affiliate_links')
    .select('*', { count: 'exact', head: true })
    .eq('active', true);

  // Get all links for mapping
  const { data: allLinks } = await supabase
    .from('affiliate_links')
    .select('id, slug, partner_name, category');

  type LinkInfo = Pick<AffiliateLink, 'id' | 'slug' | 'partner_name' | 'category'>;
  const linkMap = new Map((allLinks || []).map((l) => [l.id, l as LinkInfo]));

  // Process clicks for various stats
  const geoMap = new Map<string, number>();
  const pageMap = new Map<string, number>();
  const deviceCounts = { mobile: 0, desktop: 0, tablet: 0 };
  const linkClickCounts = new Map<string, number>();

  clicks.forEach((click) => {
    // Geo stats
    const country = click.country_code || 'XX';
    geoMap.set(country, (geoMap.get(country) || 0) + 1);

    // Page stats
    const page = extractPagePath(click.referrer);
    pageMap.set(page, (pageMap.get(page) || 0) + 1);

    // Device stats
    const device = parseDevice(click.user_agent);
    deviceCounts[device]++;

    // Link stats
    if (click.link_id) {
      linkClickCounts.set(click.link_id, (linkClickCounts.get(click.link_id) || 0) + 1);
    }
  });

  // Build geo stats
  const totalClicksInRange = clicks.length;
  const geoStats: GeoStat[] = Array.from(geoMap.entries())
    .map(([code, count]) => ({
      country_code: code,
      country_name: getCountryName(code),
      clicks: count,
      percentage: totalClicksInRange > 0 ? Math.round((count / totalClicksInRange) * 100) : 0,
    }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 10);

  // Build page stats
  const topPages: PageStat[] = Array.from(pageMap.entries())
    .map(([page, count]) => ({
      page,
      clicks: count,
      percentage: totalClicksInRange > 0 ? Math.round((count / totalClicksInRange) * 100) : 0,
    }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 5);

  // Build device stats
  const totalDevices = deviceCounts.mobile + deviceCounts.desktop + deviceCounts.tablet;
  const deviceStats: DeviceStats = {
    mobile: deviceCounts.mobile,
    desktop: deviceCounts.desktop,
    tablet: deviceCounts.tablet,
    mobilePercent: totalDevices > 0 ? Math.round((deviceCounts.mobile / totalDevices) * 100) : 0,
    desktopPercent: totalDevices > 0 ? Math.round((deviceCounts.desktop / totalDevices) * 100) : 0,
    tabletPercent: totalDevices > 0 ? Math.round((deviceCounts.tablet / totalDevices) * 100) : 0,
  };

  // Build top links with EPC
  const topLinks: TopLink[] = ((allLinks || []) as LinkInfo[])
    .map((link) => {
      const clicks = linkClickCounts.get(link.id) || 0;
      const revenueData = linkRevenueMap.get(link.id) || { revenue: 0, conversions: 0 };
      const epc = clicks > 0 ? (revenueData.revenue / clicks).toFixed(2) : '0.00';

      return {
        slug: link.slug,
        partner_name: link.partner_name,
        category: link.category || 'other',
        clicks,
        revenue: revenueData.revenue,
        conversions: revenueData.conversions,
        epc,
      };
    })
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 5);

  // Build time series data
  const clicksOverTime = buildTimeSeries(clicks, range, now);

  // Recent clicks with link info and referrer domain
  const recentClicks: ClickData[] = clicks.slice(0, 20).map((click) => {
    const link = linkMap.get(click.link_id);
    const countryCode = click.country_code || 'XX';

    // Extract referrer domain
    let referrerDomain: string | null = null;
    let sourcePage: string | null = null;
    if (click.referrer) {
      try {
        const url = new URL(click.referrer);
        referrerDomain = url.hostname.replace('www.', '');
        // Check if it's internal
        if (referrerDomain.includes('smartfinpro') || referrerDomain.includes('localhost')) {
          sourcePage = url.pathname;
          referrerDomain = 'smartfinpro.com';
        }
      } catch {
        referrerDomain = click.referrer.slice(0, 30);
      }
    }

    return {
      id: click.id,
      slug: link?.slug || 'unknown',
      partner_name: link?.partner_name || 'Unknown',
      country_code: countryCode,
      country_name: getCountryName(countryCode),
      clicked_at: click.clicked_at,
      utm_source: click.utm_source,
      referrer: click.referrer,
      referrer_domain: referrerDomain,
      source_page: sourcePage,
    };
  });

  // Calculate conversion rate
  const conversionRate = totalClicks && conversions
    ? ((conversions.length / totalClicks) * 100).toFixed(2)
    : '0.00';

  // Build funnel data
  const funnelData: FunnelData = {
    clicks: totalClicks || 0,
    conversions: conversions.length,
    approvedConversions: approvedConversions.length,
    approvedRevenue: totalRevenue,
  };

  // Fetch scroll depth stats from page_views table
  let scrollQuery = supabase
    .from('page_views')
    .select('page_path, article_slug, page_title, scroll_depth')
    .not('scroll_depth', 'is', null)
    .gt('scroll_depth', 0);

  if (rangeStart) {
    scrollQuery = scrollQuery.gte('viewed_at', rangeStart.toISOString());
  }

  const scrollResult = await scrollQuery;
  type ScrollViewRecord = Pick<PageView, 'page_path' | 'article_slug' | 'page_title' | 'scroll_depth'>;
  const scrollViews = safeData(scrollResult) as ScrollViewRecord[];

  // Aggregate scroll depth by page
  const scrollMap = new Map<string, {
    page_path: string;
    article_slug: string | null;
    page_title: string | null;
    total_depth: number;
    count: number;
  }>();

  scrollViews.forEach((view) => {
    const key = view.page_path;
    const existing = scrollMap.get(key);
    if (existing) {
      existing.total_depth += view.scroll_depth ?? 0;
      existing.count++;
    } else {
      scrollMap.set(key, {
        page_path: view.page_path,
        article_slug: view.article_slug,
        page_title: view.page_title,
        total_depth: view.scroll_depth ?? 0,
        count: 1,
      });
    }
  });

  // Build scroll depth stats
  const scrollDepthStats: ScrollDepthStat[] = Array.from(scrollMap.values())
    .map((item) => ({
      page_path: item.page_path,
      article_slug: item.article_slug,
      page_title: item.page_title,
      avg_scroll_depth: Math.round(item.total_depth / item.count),
      view_count: item.count,
    }))
    .sort((a, b) => b.view_count - a.view_count)
    .slice(0, 10);

  // Calculate overall average scroll depth
  const totalScrollDepth = scrollViews.reduce((sum, v) => sum + (v.scroll_depth || 0), 0);
  const averageScrollDepth = scrollViews.length > 0
    ? Math.round(totalScrollDepth / scrollViews.length)
    : 0;

  // ============================================================
  // PROBLEM ARTICLES ("Sorgenkinder") ANALYSIS
  // Articles with high engagement but low affiliate CTR
  // ============================================================

  // Fetch all page views with engagement data
  let engagementQuery = supabase
    .from('page_views')
    .select('page_path, page_title, article_slug, category, time_on_page, scroll_depth')
    .not('article_slug', 'is', null); // Only articles, not pillar pages

  if (rangeStart) {
    engagementQuery = engagementQuery.gte('viewed_at', rangeStart.toISOString());
  }

  const engagementResult = await engagementQuery;
  type EngagementRecord = Pick<PageView, 'page_path' | 'page_title' | 'article_slug' | 'category' | 'time_on_page' | 'scroll_depth'>;
  const articleViews = safeData(engagementResult) as EngagementRecord[];

  // Aggregate engagement by article
  const articleEngagementMap = new Map<string, {
    page_path: string;
    page_title: string | null;
    article_slug: string | null;
    category: string | null;
    total_time: number;
    total_scroll: number;
    view_count: number;
  }>();

  articleViews.forEach((view) => {
    const key = view.page_path;
    const existing = articleEngagementMap.get(key);
    if (existing) {
      existing.total_time += view.time_on_page || 0;
      existing.total_scroll += view.scroll_depth || 0;
      existing.view_count++;
    } else {
      articleEngagementMap.set(key, {
        page_path: view.page_path,
        page_title: view.page_title,
        article_slug: view.article_slug,
        category: view.category,
        total_time: view.time_on_page || 0,
        total_scroll: view.scroll_depth || 0,
        view_count: 1,
      });
    }
  });

  // Count affiliate clicks per source page (from referrer in link_clicks)
  const articleClickMap = new Map<string, number>();
  clicks.forEach((click) => {
    const sourcePage = extractPagePath(click.referrer);
    if (sourcePage && !sourcePage.startsWith('External') && sourcePage !== 'Direct') {
      articleClickMap.set(sourcePage, (articleClickMap.get(sourcePage) || 0) + 1);
    }
  });

  // Calculate averages for normalization
  const allEngagements = Array.from(articleEngagementMap.values());
  const avgTimeAllArticles = allEngagements.length > 0
    ? allEngagements.reduce((sum, a) => sum + (a.total_time / a.view_count), 0) / allEngagements.length
    : 60;
  const avgScrollAllArticles = allEngagements.length > 0
    ? allEngagements.reduce((sum, a) => sum + (a.total_scroll / a.view_count), 0) / allEngagements.length
    : 50;
  const avgCTRAllArticles = allEngagements.length > 0
    ? allEngagements.reduce((sum, a) => {
        const clicks = articleClickMap.get(a.page_path) || 0;
        return sum + (a.view_count > 0 ? (clicks / a.view_count) * 100 : 0);
      }, 0) / allEngagements.length
    : 5;

  // Build problem articles list
  const problemArticles: ProblemArticle[] = Array.from(articleEngagementMap.values())
    .map((article) => {
      const avgTime = article.view_count > 0 ? article.total_time / article.view_count : 0;
      const avgScroll = article.view_count > 0 ? article.total_scroll / article.view_count : 0;
      const affiliateClicks = articleClickMap.get(article.page_path) || 0;
      const ctr = article.view_count > 0 ? (affiliateClicks / article.view_count) * 100 : 0;

      // Calculate opportunity score
      // High engagement (time + scroll) relative to average = positive
      // Low CTR relative to average = positive (bigger problem = higher score)
      const engagementScore =
        ((avgTime / (avgTimeAllArticles || 60)) * 0.5) +
        ((avgScroll / (avgScrollAllArticles || 50)) * 0.5);
      const ctrDeficit = avgCTRAllArticles > 0 ? Math.max(0, (avgCTRAllArticles - ctr) / avgCTRAllArticles) : 0;

      // Opportunity = high engagement × low CTR (normalized 0-100)
      const opportunityScore = Math.round(engagementScore * ctrDeficit * 100);

      // Generate recommendations based on metrics
      const recommendations: string[] = [];

      if (avgScroll > 60 && ctr < 2) {
        recommendations.push('Leser erreichen CTAs - aber klicken nicht. A/B-Test mit stärkeren Value Props.');
      }
      if (avgTime > 120 && affiliateClicks === 0) {
        recommendations.push('Hohe Lesezeit, keine Klicks. Prüfe CTA-Platzierung und Sichtbarkeit.');
      }
      if (avgScroll < 40 && avgTime > 60) {
        recommendations.push('Langsames Scrollen = gründliches Lesen. CTAs früher im Artikel platzieren.');
      }
      if (ctr < 1 && article.view_count > 10) {
        recommendations.push('Sehr niedrige CTR. PAS-Formel im Intro verstärken, Urgency hinzufügen.');
      }
      if (avgScroll > 80 && ctr < avgCTRAllArticles * 0.5) {
        recommendations.push('Exzellentes Engagement, halbe CTR. CTA-Text und Button-Design optimieren.');
      }

      // Default recommendation if none apply
      if (recommendations.length === 0 && opportunityScore > 20) {
        recommendations.push('Engagement ist gut. Psychologische Trigger (Scarcity, Social Proof) verstärken.');
      }

      return {
        page_path: article.page_path,
        page_title: article.page_title,
        article_slug: article.article_slug,
        category: article.category,
        avg_time_on_page: Math.round(avgTime),
        avg_scroll_depth: Math.round(avgScroll),
        page_views: article.view_count,
        affiliate_clicks: affiliateClicks,
        ctr: parseFloat(ctr.toFixed(2)),
        opportunity_score: opportunityScore,
        recommendations,
      };
    })
    // Filter: Only show articles with meaningful data AND opportunity
    .filter((a) => a.page_views >= 3 && a.avg_time_on_page > 30 && a.opportunity_score > 10)
    // Sort by opportunity score (highest = biggest problem = most potential)
    .sort((a, b) => b.opportunity_score - a.opportunity_score)
    .slice(0, 10);

  // ============================================================
  // TIME COMPARISONS
  // ============================================================

  // Clicks comparison
  const clicksComparison = calculateChange(totalClicksInRange, previousClicksCount);

  // Revenue comparison - fetch previous period revenue
  let previousRevenue = 0;
  if (previousPeriod) {
    const { data: prevConversions } = await supabase
      .from('conversions')
      .select('commission_earned')
      .eq('status', 'approved')
      .gte('created_at', previousPeriod.start.toISOString())
      .lt('created_at', previousPeriod.end.toISOString());
    previousRevenue = (prevConversions || []).reduce((sum, c) => sum + (c.commission_earned || 0), 0);
  }

  // Revenue in current range
  let revenueInRange = 0;
  if (rangeStart) {
    const { data: currentConversions } = await supabase
      .from('conversions')
      .select('commission_earned')
      .eq('status', 'approved')
      .gte('created_at', rangeStart.toISOString());
    revenueInRange = (currentConversions || []).reduce((sum, c) => sum + (c.commission_earned || 0), 0);
  } else {
    revenueInRange = totalRevenue;
  }
  const revenueComparison = calculateChange(revenueInRange, previousRevenue);

  // Leads comparison - from newsletter_subscribers (or subscribers fallback)
  let leadsInRange = 0;
  let previousLeads = 0;
  if (rangeStart) {
    const currentLeadsResult = await supabase
      .from('newsletter_subscribers')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', rangeStart.toISOString());
    leadsInRange = safeCount(currentLeadsResult);
  }
  if (previousPeriod) {
    const prevLeadsResult = await supabase
      .from('newsletter_subscribers')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', previousPeriod.start.toISOString())
      .lt('created_at', previousPeriod.end.toISOString());
    previousLeads = safeCount(prevLeadsResult);
  }
  const leadsComparison = calculateChange(leadsInRange, previousLeads);

  // ============================================================
  // ACTION ITEMS / ALERTS
  // ============================================================
  const actionItems: ActionItem[] = [];

  // Check for significant conversion rate drops per link
  for (const link of topLinks) {
    const linkClicks = link.clicks;
    const linkRevenue = link.revenue;
    const expectedRevenue = linkClicks * 0.50; // Expected $0.50 EPC
    if (linkClicks > 10 && linkRevenue < expectedRevenue * 0.5) {
      actionItems.push({
        id: `low-epc-${link.slug}`,
        type: 'warning',
        title: `Low EPC: ${link.partner_name}`,
        description: `${link.partner_name} has $${link.epc} EPC (expected ~$0.50). Review landing page or offer.`,
        metric: `$${link.epc} EPC`,
        link: `/dashboard/links`,
        timestamp: new Date(),
      });
    }
  }

  // Check geo distribution for insights
  const topGeo = geoStats[0];
  if (topGeo && topGeo.percentage > 60) {
    actionItems.push({
      id: 'geo-concentration',
      type: 'insight',
      title: `Traffic Concentration: ${topGeo.country_name}`,
      description: `${topGeo.percentage}% of traffic from ${topGeo.country_name}. Consider geo-targeted content expansion.`,
      metric: `${topGeo.percentage}%`,
      timestamp: new Date(),
    });
  }

  // Check for high engagement articles with low CTR
  if (problemArticles.length > 0) {
    const topProblem = problemArticles[0];
    actionItems.push({
      id: 'top-opportunity',
      type: 'urgent',
      title: `Optimization Opportunity`,
      description: `"${topProblem.page_title?.slice(0, 40) || topProblem.page_path}" has ${topProblem.avg_scroll_depth}% scroll depth but only ${topProblem.ctr}% CTR.`,
      metric: `${topProblem.opportunity_score} score`,
      link: topProblem.page_path,
      timestamp: new Date(),
    });
  }

  // Success alert for positive trends
  if (clicksComparison.trend === 'up' && clicksComparison.change > 20) {
    actionItems.push({
      id: 'clicks-growth',
      type: 'success',
      title: `Clicks Growing +${clicksComparison.change}%`,
      description: `Affiliate clicks are up ${clicksComparison.change}% compared to previous period.`,
      metric: `+${clicksComparison.change}%`,
      timestamp: new Date(),
    });
  }

  // ============================================================
  // LEAD QUALITY SCORE
  // ============================================================

  // Get newsletter subscribers with engagement data
  const leadResult = await supabase
    .from('newsletter_subscribers')
    .select('id, created_at, source_page')
    .order('created_at', { ascending: false })
    .limit(100);

  const leads = safeData(leadResult);

  // Calculate engagement score based on source page scroll depth
  let totalEngagementScore = 0;
  let highQualityCount = 0;

  for (const lead of leads) {
    // Look up scroll depth for the source page
    const sourcePageData = scrollDepthStats.find(s => s.page_path === lead.source_page);
    const scrollScore = sourcePageData?.avg_scroll_depth || 50;
    const engagementScore = Math.min(100, scrollScore * 1.2); // Scale to 100

    totalEngagementScore += engagementScore;
    if (engagementScore > 70) highQualityCount++;
  }

  const leadQuality: LeadQualityData = {
    totalLeads: leads.length,
    avgEngagementScore: leads.length > 0 ? Math.round(totalEngagementScore / leads.length) : 0,
    highQualityLeads: highQualityCount,
    conversionPotential: leads.length > 0 ? Math.round((highQualityCount / leads.length) * 100) : 0,
  };

  return {
    totalClicks: totalClicks || 0,
    totalClicksInRange,
    totalRevenue,
    activeLinks: activeLinks || 0,
    conversionRate,
    recentClicks,
    clicksOverTime,
    topLinks,
    geoStats,
    topPages,
    deviceStats,
    funnelData,
    scrollDepthStats,
    averageScrollDepth,
    problemArticles,
    // NEW fields
    clicksComparison,
    revenueComparison,
    leadsComparison,
    actionItems: actionItems.slice(0, 5), // Limit to 5 action items
    leadQuality,
    revenueInRange,
    leadsInRange,
  };
}

function buildTimeSeries(clicks: { clicked_at: string }[], range: TimeRange, now: Date): TimeSeriesData[] {
  const data: TimeSeriesData[] = [];

  if (range === '24h') {
    // Hourly data for last 24 hours
    const hourlyMap = new Map<string, number>();
    for (let i = 23; i >= 0; i--) {
      const hourDate = new Date(now.getTime() - i * 60 * 60 * 1000);
      const hourKey = hourDate.toISOString().slice(0, 13);
      hourlyMap.set(hourKey, 0);
    }

    clicks.forEach((click) => {
      const hourKey = click.clicked_at.slice(0, 13);
      if (hourlyMap.has(hourKey)) {
        hourlyMap.set(hourKey, (hourlyMap.get(hourKey) || 0) + 1);
      }
    });

    hourlyMap.forEach((count, hour) => {
      data.push({
        label: new Date(hour + ':00:00Z').toLocaleTimeString('en-US', { hour: '2-digit' }),
        clicks: count,
      });
    });
  } else if (range === '7d') {
    // Daily data for last 7 days
    const dailyMap = new Map<string, number>();
    for (let i = 6; i >= 0; i--) {
      const dayDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayKey = dayDate.toISOString().slice(0, 10);
      dailyMap.set(dayKey, 0);
    }

    clicks.forEach((click) => {
      const dayKey = click.clicked_at.slice(0, 10);
      if (dailyMap.has(dayKey)) {
        dailyMap.set(dayKey, (dailyMap.get(dayKey) || 0) + 1);
      }
    });

    dailyMap.forEach((count, day) => {
      data.push({
        label: new Date(day).toLocaleDateString('en-US', { weekday: 'short' }),
        clicks: count,
      });
    });
  } else {
    // Daily data for 30d or all time (show last 30 days)
    const dailyMap = new Map<string, number>();
    const daysToShow = range === '30d' ? 30 : 30;
    for (let i = daysToShow - 1; i >= 0; i--) {
      const dayDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayKey = dayDate.toISOString().slice(0, 10);
      dailyMap.set(dayKey, 0);
    }

    clicks.forEach((click) => {
      const dayKey = click.clicked_at.slice(0, 10);
      if (dailyMap.has(dayKey)) {
        dailyMap.set(dayKey, (dailyMap.get(dayKey) || 0) + 1);
      }
    });

    dailyMap.forEach((count, day) => {
      data.push({
        label: new Date(day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        clicks: count,
      });
    });
  }

  return data;
}

// ============================================================
// GLOBAL MARKET INTELLIGENCE
// ============================================================

export async function getGlobalMarketIntelligence(range: TimeRange = '7d'): Promise<GlobalMarketIntelligence> {
  const supabase = createServiceClient();
  const now = new Date();
  const rangeStart = getTimeRangeStart(range);
  const previousPeriod = getPreviousPeriodRange(range);

  // Fetch all clicks in range with country info
  let clicksQuery = supabase
    .from('link_clicks')
    .select('id, link_id, country_code, clicked_at, referrer');

  if (rangeStart) {
    clicksQuery = clicksQuery.gte('clicked_at', rangeStart.toISOString());
  }

  const { data: clicksData } = await clicksQuery.order('clicked_at', { ascending: false });
  const clicks = clicksData || [];

  // Fetch previous period clicks for comparison
  let previousClicks: { country_code: string | null }[] = [];
  if (previousPeriod) {
    const { data: prevClicksData } = await supabase
      .from('link_clicks')
      .select('country_code')
      .gte('clicked_at', previousPeriod.start.toISOString())
      .lt('clicked_at', previousPeriod.end.toISOString());
    previousClicks = prevClicksData || [];
  }

  // Fetch all conversions with link info
  let conversionsQuery = supabase
    .from('conversions')
    .select('link_id, commission_earned, status, created_at');

  if (rangeStart) {
    conversionsQuery = conversionsQuery.gte('created_at', rangeStart.toISOString());
  }

  const { data: conversionsData } = await conversionsQuery;
  const conversions = (conversionsData || []).filter(c => c.status === 'approved');

  // Fetch previous period conversions
  let previousConversions: { link_id: string | null; commission_earned: number | null }[] = [];
  if (previousPeriod) {
    const { data: prevConvData } = await supabase
      .from('conversions')
      .select('link_id, commission_earned')
      .eq('status', 'approved')
      .gte('created_at', previousPeriod.start.toISOString())
      .lt('created_at', previousPeriod.end.toISOString());
    previousConversions = prevConvData || [];
  }

  // Fetch affiliate links for product mapping
  const { data: linksData } = await supabase
    .from('affiliate_links')
    .select('id, slug, partner_name, category');
  const linksMap = new Map((linksData || []).map(l => [l.id, l]));

  // Fetch page views for scroll depth by market
  let pageViewsQuery = supabase
    .from('page_views')
    .select('page_path, scroll_depth, lang')
    .not('scroll_depth', 'is', null)
    .gt('scroll_depth', 0);

  if (rangeStart) {
    pageViewsQuery = pageViewsQuery.gte('viewed_at', rangeStart.toISOString());
  }

  const pageViewsResult = await pageViewsQuery;
  const pageViews = safeData(pageViewsResult);

  // Build market-specific data
  const marketData: Record<MarketCode, {
    clicks: { link_id: string; clicked_at: string; referrer: string | null }[];
    previousClicks: number;
    conversions: { link_id: string | null; commission_earned: number | null }[];
    previousRevenue: number;
    scrollDepths: number[];
  }> = {
    US: { clicks: [], previousClicks: 0, conversions: [], previousRevenue: 0, scrollDepths: [] },
    GB: { clicks: [], previousClicks: 0, conversions: [], previousRevenue: 0, scrollDepths: [] },
    CA: { clicks: [], previousClicks: 0, conversions: [], previousRevenue: 0, scrollDepths: [] },
    AU: { clicks: [], previousClicks: 0, conversions: [], previousRevenue: 0, scrollDepths: [] },
  };

  // Categorize clicks by market
  clicks.forEach(click => {
    const market = getMarketFromCountry(click.country_code || '');
    if (market) {
      marketData[market].clicks.push(click);
    }
  });

  // Categorize previous period clicks
  previousClicks.forEach(click => {
    const market = getMarketFromCountry(click.country_code || '');
    if (market) {
      marketData[market].previousClicks++;
    }
  });

  // Map conversions to markets via link_clicks country
  // First, build a map of link_id to countries from current clicks
  const linkToCountries = new Map<string, Set<string>>();
  clicks.forEach(click => {
    if (click.link_id && click.country_code) {
      if (!linkToCountries.has(click.link_id)) {
        linkToCountries.set(click.link_id, new Set());
      }
      linkToCountries.get(click.link_id)!.add(click.country_code);
    }
  });

  // Assign conversions to markets (primary country for that link)
  conversions.forEach(conv => {
    if (conv.link_id) {
      const countries = linkToCountries.get(conv.link_id);
      if (countries && countries.size > 0) {
        // Get the most likely market (first match)
        for (const country of countries) {
          const market = getMarketFromCountry(country);
          if (market) {
            marketData[market].conversions.push(conv);
            break;
          }
        }
      }
    }
  });

  // Assign previous conversions to markets
  previousConversions.forEach(conv => {
    if (conv.link_id) {
      const countries = linkToCountries.get(conv.link_id);
      if (countries && countries.size > 0) {
        for (const country of countries) {
          const market = getMarketFromCountry(country);
          if (market) {
            marketData[market].previousRevenue += conv.commission_earned || 0;
            break;
          }
        }
      }
    }
  });

  // Assign page views scroll depth to markets based on lang
  pageViews.forEach(pv => {
    if (pv.scroll_depth) {
      const langToMarket: Record<string, MarketCode> = {
        'en-US': 'US',
        'en-GB': 'GB',
        'en-CA': 'CA',
        'en-AU': 'AU',
      };
      // Try to determine market from lang or page_path
      let market: MarketCode | null = null;
      if (pv.lang && langToMarket[pv.lang]) {
        market = langToMarket[pv.lang];
      } else if (pv.page_path) {
        // Check URL path for market indicator
        if (pv.page_path.startsWith('/us/')) market = 'US';
        else if (pv.page_path.startsWith('/uk/')) market = 'GB';
        else if (pv.page_path.startsWith('/ca/')) market = 'CA';
        else if (pv.page_path.startsWith('/au/')) market = 'AU';
      }
      if (market) {
        marketData[market].scrollDepths.push(pv.scroll_depth);
      }
    }
  });

  // Build sparkline data (last 7 days) for each market
  function buildMarketSparkline(marketClicks: { clicked_at: string }[], marketConversions: { commission_earned: number | null; created_at: string }[]): MarketSparklineData[] {
    const data: MarketSparklineData[] = [];
    for (let i = 6; i >= 0; i--) {
      const dayDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayKey = dayDate.toISOString().slice(0, 10);
      const dayClicks = marketClicks.filter(c => c.clicked_at.slice(0, 10) === dayKey).length;
      const dayRevenue = marketConversions
        .filter(c => c.created_at?.slice(0, 10) === dayKey)
        .reduce((sum, c) => sum + (c.commission_earned || 0), 0);
      data.push({
        label: dayDate.toLocaleDateString('en-US', { weekday: 'short' }),
        clicks: dayClicks,
        revenue: dayRevenue,
      });
    }
    return data;
  }

  // Build market performance array
  const markets: MarketPerformance[] = [];
  let maxEpc = 0;
  let leaderMarket: MarketCode = 'US';

  for (const [marketCode, config] of Object.entries(marketConfig)) {
    const code = marketCode as MarketCode;
    const data = marketData[code];

    const totalClicks = data.clicks.length;
    const totalRevenue = data.conversions.reduce((sum, c) => sum + (c.commission_earned || 0), 0);
    const totalConversions = data.conversions.length;

    // Calculate trends
    const clicksComparison = calculateChange(totalClicks, data.previousClicks);
    const revenueComparison = calculateChange(totalRevenue, data.previousRevenue);

    // Calculate EPC
    const epc = totalClicks > 0 ? totalRevenue / totalClicks : 0;
    if (epc > maxEpc) {
      maxEpc = epc;
      leaderMarket = code;
    }

    // Calculate conversion rate
    const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;

    // Calculate engagement score from scroll depth
    const avgScrollDepth = data.scrollDepths.length > 0
      ? Math.round(data.scrollDepths.reduce((a, b) => a + b, 0) / data.scrollDepths.length)
      : 0;
    const engagementScore = Math.min(100, Math.round(avgScrollDepth * 1.2));

    // Find top product for this market
    const productClicks = new Map<string, { clicks: number; revenue: number; name: string }>();
    data.clicks.forEach(click => {
      if (click.link_id) {
        const link = linksMap.get(click.link_id);
        if (link) {
          const current = productClicks.get(link.id) || { clicks: 0, revenue: 0, name: link.partner_name };
          current.clicks++;
          productClicks.set(link.id, current);
        }
      }
    });
    data.conversions.forEach(conv => {
      if (conv.link_id) {
        const current = productClicks.get(conv.link_id);
        if (current) {
          current.revenue += conv.commission_earned || 0;
        }
      }
    });

    let topProduct = 'None';
    let topProductClicks = 0;
    let topProductRevenue = 0;

    productClicks.forEach((prod, _id) => {
      if (prod.clicks > topProductClicks) {
        topProduct = prod.name;
        topProductClicks = prod.clicks;
        topProductRevenue = prod.revenue;
      }
    });

    // Build sparkline
    const sparklineData = buildMarketSparkline(
      data.clicks,
      data.conversions.map(c => ({ ...c, created_at: (c as any).created_at || '' }))
    );

    markets.push({
      market: code,
      marketName: config.name,
      flag: config.flag,
      currency: config.currency,
      currencySymbol: config.symbol,
      clicks: totalClicks,
      clicksTrend: clicksComparison.trend,
      clicksChange: clicksComparison.change,
      revenue: totalRevenue,
      revenueLocal: totalRevenue / config.exchangeRate,
      revenueChange: revenueComparison.change,
      revenueTrend: revenueComparison.trend,
      conversions: totalConversions,
      conversionRate: parseFloat(conversionRate.toFixed(2)),
      epc: parseFloat(epc.toFixed(2)),
      avgScrollDepth,
      engagementScore,
      topProduct,
      topProductClicks,
      topProductRevenue,
      sparklineData,
      isLeader: false, // Set after sorting
      rank: 0, // Set after sorting
    });
  }

  // Sort by EPC and assign ranks
  markets.sort((a, b) => b.epc - a.epc);
  markets.forEach((m, i) => {
    m.rank = i + 1;
    m.isLeader = i === 0;
  });

  // Re-sort by clicks for display (but keep rank by EPC)
  markets.sort((a, b) => b.clicks - a.clicks);

  // Generate market opportunities
  const opportunities: MarketOpportunity[] = [];

  markets.forEach(market => {
    // High traffic, low conversion
    if (market.clicks > 10 && market.conversionRate < 1) {
      opportunities.push({
        id: `low-cr-${market.market}`,
        market: market.market,
        type: 'optimization',
        title: `Low Conversion Rate in ${market.marketName}`,
        description: `${market.clicks} clicks but only ${market.conversionRate}% conversion. Review ${market.currency} pricing and localization.`,
        metric: `${market.conversionRate}% CR`,
        action: `Check ${market.market} pillar page CTAs and ${market.currency} pricing display`,
        priority: market.clicks > 50 ? 'high' : 'medium',
      });
    }

    // Growing traffic
    if (market.clicksTrend === 'up' && market.clicksChange > 30) {
      opportunities.push({
        id: `growth-${market.market}`,
        market: market.market,
        type: 'growth',
        title: `${market.marketName} Traffic Growing +${market.clicksChange}%`,
        description: `Strong momentum in ${market.marketName}. Consider expanding ${market.market} content.`,
        metric: `+${market.clicksChange}%`,
        action: `Create more ${market.market}-specific comparison articles`,
        priority: 'medium',
      });
    }

    // Declining traffic
    if (market.clicksTrend === 'down' && market.clicksChange > 20) {
      opportunities.push({
        id: `decline-${market.market}`,
        market: market.market,
        type: 'warning',
        title: `${market.marketName} Traffic Down -${market.clicksChange}%`,
        description: `Traffic from ${market.marketName} is declining. Review SEO rankings.`,
        metric: `-${market.clicksChange}%`,
        action: `Audit ${market.market} pillar pages for ranking drops`,
        priority: 'high',
      });
    }

    // High engagement, low revenue
    if (market.engagementScore > 60 && market.epc < 0.3 && market.clicks > 5) {
      opportunities.push({
        id: `engagement-${market.market}`,
        market: market.market,
        type: 'optimization',
        title: `High Engagement in ${market.marketName}, Low EPC`,
        description: `${market.engagementScore}% engagement score but only $${market.epc} EPC. Improve offer relevance.`,
        metric: `$${market.epc} EPC`,
        action: `Review affiliate offers for ${market.market} market fit`,
        priority: 'medium',
      });
    }

    // Market expansion opportunity (low presence)
    if (market.clicks < 5 && market.market !== 'US') {
      opportunities.push({
        id: `expand-${market.market}`,
        market: market.market,
        type: 'expansion',
        title: `Expand ${market.marketName} Presence`,
        description: `Only ${market.clicks} clicks from ${market.marketName}. High growth potential.`,
        metric: `${market.clicks} clicks`,
        action: `Create ${market.market}-localized content and target ${market.currency} keywords`,
        priority: 'low',
      });
    }
  });

  // Sort opportunities by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  opportunities.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  // Calculate totals
  const totalGlobalRevenue = markets.reduce((sum, m) => sum + m.revenue, 0);
  const totalGlobalClicks = markets.reduce((sum, m) => sum + m.clicks, 0);

  return {
    markets,
    opportunities: opportunities.slice(0, 4), // Limit to 4 opportunities
    leaderMarket,
    totalGlobalRevenue,
    totalGlobalClicks,
  };
}
