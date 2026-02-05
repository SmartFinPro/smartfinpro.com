'use server';

import { createServiceClient } from '@/lib/supabase/server';
import type { LinkClick, Conversion, AffiliateLink, PageView } from '@/lib/supabase/types';

export type TimeRange = '24h' | '7d' | '30d' | 'all';

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
  clicked_at: string;
  utm_source: string | null;
  referrer: string | null;
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

  // Base query for clicks in range
  let clicksQuery = supabase
    .from('link_clicks')
    .select('id, link_id, country_code, clicked_at, utm_source, referrer, user_agent');

  if (rangeStart) {
    clicksQuery = clicksQuery.gte('clicked_at', rangeStart.toISOString());
  }

  const { data: clicksInRange } = await clicksQuery.order('clicked_at', { ascending: false });
  type ClickRecord = Pick<LinkClick, 'id' | 'link_id' | 'country_code' | 'clicked_at' | 'utm_source' | 'referrer' | 'user_agent'>;
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

  // Recent clicks with link info
  const recentClicks: ClickData[] = clicks.slice(0, 10).map((click) => {
    const link = linkMap.get(click.link_id);
    return {
      id: click.id,
      slug: link?.slug || 'unknown',
      partner_name: link?.partner_name || 'Unknown',
      country_code: click.country_code || 'XX',
      clicked_at: click.clicked_at,
      utm_source: click.utm_source,
      referrer: click.referrer,
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

  const { data: scrollData } = await scrollQuery;
  type ScrollViewRecord = Pick<PageView, 'page_path' | 'article_slug' | 'page_title' | 'scroll_depth'>;
  const scrollViews = (scrollData || []) as ScrollViewRecord[];

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

  const { data: engagementData } = await engagementQuery;
  type EngagementRecord = Pick<PageView, 'page_path' | 'page_title' | 'article_slug' | 'category' | 'time_on_page' | 'scroll_depth'>;
  const articleViews = (engagementData || []) as EngagementRecord[];

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
