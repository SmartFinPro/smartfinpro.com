'use server';

import 'server-only';
import { unstable_cache } from 'next/cache';
import { logger } from '@/lib/logging';

import { createServiceClient } from '@/lib/supabase/server';
import type { PageView, LinkClick } from '@/lib/supabase/types';
import { TimeRange } from './dashboard';

// ============================================================
// Types
// ============================================================

export interface AnalyticsOverview {
  totalPageViews: number;
  uniqueSessions: number;
  avgTimeOnPage: number;
  avgScrollDepth: number;
  bounceRate: number;
  pageViewsInRange: number;
}

export interface TrafficSource {
  source: string;
  sessions: number;
  pageViews: number;
  percentage: number;
}

export interface UTMStats {
  campaign: string;
  source: string;
  medium: string;
  sessions: number;
  clicks: number;
  conversionRate: number;
}

export interface BrowserStat {
  browser: string;
  sessions: number;
  percentage: number;
}

export interface OSStat {
  os: string;
  sessions: number;
  percentage: number;
}

export interface LandingPageStat {
  page_path: string;
  page_title: string | null;
  sessions: number;
  avgTimeOnPage: number;
  avgScrollDepth: number;
  bounceRate: number;
  affiliateClicks: number;
}

export interface ReferrerStat {
  domain: string;
  sessions: number;
  pageViews: number;
  percentage: number;
}

export interface TimeSeriesPageView {
  label: string;
  pageViews: number;
  sessions: number;
}

export interface AnalyticsStats {
  overview: AnalyticsOverview;
  trafficSources: TrafficSource[];
  utmStats: UTMStats[];
  browserStats: BrowserStat[];
  osStats: OSStat[];
  landingPages: LandingPageStat[];
  referrers: ReferrerStat[];
  pageViewsOverTime: TimeSeriesPageView[];
}

// ============================================================
// Helper Functions
// ============================================================

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

function categorizeTrafficSource(referrer: string | null, utmSource: string | null): string {
  if (utmSource) {
    const source = utmSource.toLowerCase();
    if (source.includes('google')) return 'Google';
    if (source.includes('facebook') || source.includes('fb')) return 'Facebook';
    if (source.includes('twitter') || source.includes('x.com')) return 'Twitter/X';
    if (source.includes('linkedin')) return 'LinkedIn';
    if (source.includes('reddit')) return 'Reddit';
    if (source.includes('email') || source.includes('newsletter')) return 'Email';
    return utmSource;
  }

  if (!referrer) return 'Direct';

  try {
    const domain = new URL(referrer).hostname.replace('www.', '');
    if (domain.includes('google')) return 'Google';
    if (domain.includes('bing')) return 'Bing';
    if (domain.includes('yahoo')) return 'Yahoo';
    if (domain.includes('duckduckgo')) return 'DuckDuckGo';
    if (domain.includes('facebook')) return 'Facebook';
    if (domain.includes('twitter') || domain.includes('t.co')) return 'Twitter/X';
    if (domain.includes('linkedin')) return 'LinkedIn';
    if (domain.includes('reddit')) return 'Reddit';
    if (domain.includes('youtube')) return 'YouTube';
    return domain;
  } catch {
    return 'Direct';
  }
}

// ============================================================
// Main Analytics Function
// ============================================================

async function fetchAnalyticsStats(range: TimeRange): Promise<AnalyticsStats> {
  const supabase = createServiceClient();
  const now = new Date();
  const rangeStart = getTimeRangeStart(range);

  // Fetch page views — explicit columns (avoid fetching large user_agent/referrer text)
  // Limit to 5K rows max to prevent VPS memory issues (20K was over-fetching)
  let pageViewsQuery = supabase
    .from('page_views')
    .select('id, session_id, page_path, article_slug, page_title, market, viewed_at, scroll_depth, time_on_page, referrer, referrer_domain, utm_source, utm_medium, utm_campaign, country_code, device_type, browser, os');

  if (rangeStart) {
    pageViewsQuery = pageViewsQuery.gte('viewed_at', rangeStart.toISOString());
  }

  const { data: pageViewsData } = await pageViewsQuery.order('viewed_at', { ascending: false }).limit(5000);
  const pageViews = (pageViewsData || []) as PageView[];

  // Fetch link clicks for conversion tracking — limit to 20K
  let clicksQuery = supabase
    .from('link_clicks')
    .select('id, link_id, utm_source, utm_medium, utm_campaign, referrer');

  if (rangeStart) {
    clicksQuery = clicksQuery.gte('clicked_at', rangeStart.toISOString());
  }

  const { data: clicksData, error: clicksError } = await clicksQuery.limit(5000);
  if (clicksError) {
    logger.error('link_clicks query error:', clicksError.message);
  }
  type ClickRecord = { id: string; link_id: string | null; utm_source: string | null; utm_medium: string | null; utm_campaign: string | null; referrer: string | null };
  const clicks = (clicksData || []) as ClickRecord[];

  // Get total page views (all time) — head:true = count only, no data transferred
  const { count: totalPageViews } = await supabase
    .from('page_views')
    .select('*', { count: 'exact', head: true });

  // ============================================================
  // Calculate Overview Stats
  // ============================================================

  const uniqueSessions = new Set(pageViews.map((pv) => pv.session_id)).size;

  const avgTimeOnPage = pageViews.length > 0
    ? Math.round(
        pageViews.reduce((sum, pv) => sum + (pv.time_on_page || 0), 0) / pageViews.length
      )
    : 0;

  const avgScrollDepth = pageViews.length > 0
    ? Math.round(
        pageViews.reduce((sum, pv) => sum + (pv.scroll_depth || 0), 0) / pageViews.length
      )
    : 0;

  // Calculate bounce rate (sessions with only 1 page view)
  const sessionPageCounts = new Map<string, number>();
  pageViews.forEach((pv) => {
    sessionPageCounts.set(pv.session_id, (sessionPageCounts.get(pv.session_id) || 0) + 1);
  });
  const bouncedSessions = Array.from(sessionPageCounts.values()).filter((count) => count === 1).length;
  const bounceRate = uniqueSessions > 0 ? Math.round((bouncedSessions / uniqueSessions) * 100) : 0;

  const overview: AnalyticsOverview = {
    totalPageViews: totalPageViews || 0,
    uniqueSessions,
    avgTimeOnPage,
    avgScrollDepth,
    bounceRate,
    pageViewsInRange: pageViews.length,
  };

  // ============================================================
  // Traffic Sources
  // ============================================================

  const sourceMap = new Map<string, { sessions: Set<string>; pageViews: number }>();

  pageViews.forEach((pv) => {
    const source = categorizeTrafficSource(pv.referrer, pv.utm_source);
    const existing = sourceMap.get(source) || { sessions: new Set(), pageViews: 0 };
    existing.sessions.add(pv.session_id);
    existing.pageViews++;
    sourceMap.set(source, existing);
  });

  const trafficSources: TrafficSource[] = Array.from(sourceMap.entries())
    .map(([source, data]) => ({
      source,
      sessions: data.sessions.size,
      pageViews: data.pageViews,
      percentage: uniqueSessions > 0 ? Math.round((data.sessions.size / uniqueSessions) * 100) : 0,
    }))
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, 10);

  // ============================================================
  // UTM Stats
  // ============================================================

  const utmMap = new Map<string, { sessions: Set<string>; clicks: number; source: string; medium: string }>();

  pageViews.forEach((pv) => {
    if (pv.utm_campaign) {
      const key = pv.utm_campaign;
      const existing = utmMap.get(key) || {
        sessions: new Set(),
        clicks: 0,
        source: pv.utm_source || 'unknown',
        medium: pv.utm_medium || 'unknown',
      };
      existing.sessions.add(pv.session_id);
      utmMap.set(key, existing);
    }
  });

  // Count clicks per campaign
  clicks.forEach((click) => {
    if (click.utm_campaign && utmMap.has(click.utm_campaign)) {
      const data = utmMap.get(click.utm_campaign)!;
      data.clicks++;
    }
  });

  const utmStats: UTMStats[] = Array.from(utmMap.entries())
    .map(([campaign, data]) => ({
      campaign,
      source: data.source,
      medium: data.medium,
      sessions: data.sessions.size,
      clicks: data.clicks,
      conversionRate: data.sessions.size > 0 ? Math.round((data.clicks / data.sessions.size) * 100) : 0,
    }))
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, 10);

  // ============================================================
  // Browser Stats
  // ============================================================

  const browserMap = new Map<string, Set<string>>();

  pageViews.forEach((pv) => {
    const browser = pv.browser || 'Unknown';
    const sessions = browserMap.get(browser) || new Set();
    sessions.add(pv.session_id);
    browserMap.set(browser, sessions);
  });

  const browserStats: BrowserStat[] = Array.from(browserMap.entries())
    .map(([browser, sessions]) => ({
      browser,
      sessions: sessions.size,
      percentage: uniqueSessions > 0 ? Math.round((sessions.size / uniqueSessions) * 100) : 0,
    }))
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, 6);

  // ============================================================
  // OS Stats
  // ============================================================

  const osMap = new Map<string, Set<string>>();

  pageViews.forEach((pv) => {
    const os = pv.os || 'Unknown';
    const sessions = osMap.get(os) || new Set();
    sessions.add(pv.session_id);
    osMap.set(os, sessions);
  });

  const osStats: OSStat[] = Array.from(osMap.entries())
    .map(([os, sessions]) => ({
      os,
      sessions: sessions.size,
      percentage: uniqueSessions > 0 ? Math.round((sessions.size / uniqueSessions) * 100) : 0,
    }))
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, 6);

  // ============================================================
  // Landing Pages
  // ============================================================

  // Group by first page per session
  const sessionFirstPage = new Map<string, PageView>();
  const sortedByTime = [...pageViews].sort(
    (a, b) => new Date(a.viewed_at).getTime() - new Date(b.viewed_at).getTime()
  );

  sortedByTime.forEach((pv) => {
    if (!sessionFirstPage.has(pv.session_id)) {
      sessionFirstPage.set(pv.session_id, pv);
    }
  });

  // Aggregate by page path
  const landingPageMap = new Map<string, {
    page_title: string | null;
    sessions: number;
    totalTime: number;
    totalScroll: number;
    bounces: number;
    timeCount: number;
    scrollCount: number;
  }>();

  sessionFirstPage.forEach((pv, sessionId) => {
    const existing = landingPageMap.get(pv.page_path) || {
      page_title: pv.page_title,
      sessions: 0,
      totalTime: 0,
      totalScroll: 0,
      bounces: 0,
      timeCount: 0,
      scrollCount: 0,
    };

    existing.sessions++;
    if (pv.time_on_page) {
      existing.totalTime += pv.time_on_page;
      existing.timeCount++;
    }
    if (pv.scroll_depth) {
      existing.totalScroll += pv.scroll_depth;
      existing.scrollCount++;
    }

    // Check if this session bounced
    const sessionPageCount = sessionPageCounts.get(sessionId) || 1;
    if (sessionPageCount === 1) {
      existing.bounces++;
    }

    landingPageMap.set(pv.page_path, existing);
  });

  // Count affiliate clicks per page
  const pageClickMap = new Map<string, number>();
  clicks.forEach((click) => {
    if (click.referrer) {
      try {
        const url = new URL(click.referrer);
        const pagePath = url.pathname;
        pageClickMap.set(pagePath, (pageClickMap.get(pagePath) || 0) + 1);
      } catch {
        // Ignore invalid URLs
      }
    }
  });

  const landingPages: LandingPageStat[] = Array.from(landingPageMap.entries())
    .map(([page_path, data]) => ({
      page_path,
      page_title: data.page_title,
      sessions: data.sessions,
      avgTimeOnPage: data.timeCount > 0 ? Math.round(data.totalTime / data.timeCount) : 0,
      avgScrollDepth: data.scrollCount > 0 ? Math.round(data.totalScroll / data.scrollCount) : 0,
      bounceRate: data.sessions > 0 ? Math.round((data.bounces / data.sessions) * 100) : 0,
      affiliateClicks: pageClickMap.get(page_path) || 0,
    }))
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, 15);

  // ============================================================
  // Referrers
  // ============================================================

  const referrerMap = new Map<string, { sessions: Set<string>; pageViews: number }>();

  pageViews.forEach((pv) => {
    const domain = pv.referrer_domain || 'Direct';
    const existing = referrerMap.get(domain) || { sessions: new Set(), pageViews: 0 };
    existing.sessions.add(pv.session_id);
    existing.pageViews++;
    referrerMap.set(domain, existing);
  });

  const referrers: ReferrerStat[] = Array.from(referrerMap.entries())
    .map(([domain, data]) => ({
      domain,
      sessions: data.sessions.size,
      pageViews: data.pageViews,
      percentage: uniqueSessions > 0 ? Math.round((data.sessions.size / uniqueSessions) * 100) : 0,
    }))
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, 10);

  // ============================================================
  // Page Views Over Time
  // ============================================================

  const pageViewsOverTime = buildPageViewTimeSeries(pageViews, range, now);

  return {
    overview,
    trafficSources,
    utmStats,
    browserStats,
    osStats,
    landingPages,
    referrers,
    pageViewsOverTime,
  };
}

const cachedAnalyticsStats = unstable_cache(
  fetchAnalyticsStats,
  ['analytics-stats'],
  { revalidate: 300 } // Cache for 5 minutes — reduces TTFB on repeated dashboard loads
);

export async function getAnalyticsStats(range: TimeRange = '7d'): Promise<AnalyticsStats> {
  return cachedAnalyticsStats(range);
}

function buildPageViewTimeSeries(
  pageViews: PageView[],
  range: TimeRange,
  now: Date
): TimeSeriesPageView[] {
  const data: TimeSeriesPageView[] = [];

  if (range === '24h') {
    const hourlyMap = new Map<string, { pageViews: number; sessions: Set<string> }>();
    for (let i = 23; i >= 0; i--) {
      const hourDate = new Date(now.getTime() - i * 60 * 60 * 1000);
      const hourKey = hourDate.toISOString().slice(0, 13);
      hourlyMap.set(hourKey, { pageViews: 0, sessions: new Set() });
    }

    pageViews.forEach((pv) => {
      const hourKey = pv.viewed_at.slice(0, 13);
      if (hourlyMap.has(hourKey)) {
        const data = hourlyMap.get(hourKey)!;
        data.pageViews++;
        data.sessions.add(pv.session_id);
      }
    });

    hourlyMap.forEach((stats, hour) => {
      data.push({
        label: new Date(hour + ':00:00Z').toLocaleTimeString('en-US', { hour: '2-digit' }),
        pageViews: stats.pageViews,
        sessions: stats.sessions.size,
      });
    });
  } else if (range === '7d') {
    const dailyMap = new Map<string, { pageViews: number; sessions: Set<string> }>();
    for (let i = 6; i >= 0; i--) {
      const dayDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayKey = dayDate.toISOString().slice(0, 10);
      dailyMap.set(dayKey, { pageViews: 0, sessions: new Set() });
    }

    pageViews.forEach((pv) => {
      const dayKey = pv.viewed_at.slice(0, 10);
      if (dailyMap.has(dayKey)) {
        const data = dailyMap.get(dayKey)!;
        data.pageViews++;
        data.sessions.add(pv.session_id);
      }
    });

    dailyMap.forEach((stats, day) => {
      data.push({
        label: new Date(day).toLocaleDateString('en-US', { weekday: 'short' }),
        pageViews: stats.pageViews,
        sessions: stats.sessions.size,
      });
    });
  } else {
    const dailyMap = new Map<string, { pageViews: number; sessions: Set<string> }>();
    const daysToShow = 30;
    for (let i = daysToShow - 1; i >= 0; i--) {
      const dayDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayKey = dayDate.toISOString().slice(0, 10);
      dailyMap.set(dayKey, { pageViews: 0, sessions: new Set() });
    }

    pageViews.forEach((pv) => {
      const dayKey = pv.viewed_at.slice(0, 10);
      if (dailyMap.has(dayKey)) {
        const data = dailyMap.get(dayKey)!;
        data.pageViews++;
        data.sessions.add(pv.session_id);
      }
    });

    dailyMap.forEach((stats, day) => {
      data.push({
        label: new Date(day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        pageViews: stats.pageViews,
        sessions: stats.sessions.size,
      });
    });
  }

  return data;
}
