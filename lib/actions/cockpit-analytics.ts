'use server';

// ============================================================
// Cockpit Analytics (cockpit_v1)
// Aggregates the analytics_events rows with event_category='cockpit'
// for /dashboard/analytics/cockpits. Pattern: cta-analytics.ts —
// select-then-aggregate-in-JS, Node-only imports inside function bodies,
// missing-table errors tolerated.
//
// Market/category/topic are derived from page_path via parseCockpitPath —
// page_views.market/category are NOT reliably populated by the global
// pageview layer, so they are never used here.
// ============================================================

import { logger } from '@/lib/logging';
import { parseCockpitPath } from '@/lib/analytics/cockpit-events';

export type CockpitTimeRange = '24h' | '7d' | '30d';

const PAGE_SIZE = 10_000;
const MAX_PAGES = 10; // hard cap 100k events per window → truncated:true beyond

export interface CockpitTopicRow {
  pagePath: string;
  market: string;
  category: string;
  topic: string;
  pageviews: number;
  cockpitViews: number;
  impressions: number;
  clicks: number;
  /** clicks ÷ cockpit pageviews (%) — null when pageviews = 0 */
  ctr: number | null;
  offerClicks: number;
  visitClicks: number;
  reviewClicks: number;
  unavailableClicks: number;
  mobileClicks: number;
  desktopClicks: number;
}

export interface CockpitSurfaceRow {
  surface: string;
  clicks: number;
  denominator: number;
  /** card/verdict → viewport impressions; table/compare → cockpit_view count */
  denomKind: 'impressions' | 'views';
  ctr: number | null;
}

export interface CockpitHealthRow {
  pagePath: string;
  market: string;
  isNewMarket: boolean;
  pageviews: number;
  events: number;
  clicks: number;
  silent: boolean;
}

export interface CockpitDeviceRow {
  device: string;
  clicks: number;
  views: number;
  ctr: number | null;
}

export interface CockpitAnalyticsData {
  timeRange: CockpitTimeRange;
  truncated: boolean;
  kpis: {
    pageviews: number;
    cockpitViews: number;
    ctaClicks: number;
    overallCtr: number | null;
    eventCount: number;
    prevEventCount: number;
    volumeDeltaPct: number | null;
    zeroVolume: boolean;
    silentCount: number;
  };
  byTopic: CockpitTopicRow[];
  bySurface: CockpitSurfaceRow[];
  rates: {
    winnerImpressionToClick: number | null;
    cardImpressionToClick: number | null;
    matcherCompleteToClick: number | null;
    compareUsageToClick: number | null;
    top3Ctr: number | null;
    restCtr: number | null;
  };
  ctaSplit: { offer: number; visit: number; review: number; unavailable: number };
  destinationSplit: Record<string, number>;
  deviceSplit: CockpitDeviceRow[];
  health: CockpitHealthRow[];
}

interface EventRow {
  session_id: string;
  event_name: string;
  event_label: string | null;
  event_value: number | null;
  page_path: string | null;
  device_type: string | null;
  properties: Record<string, unknown> | null;
}

const NEW_MARKETS = new Set(['au', 'ca', 'uk']);

function pct(numerator: number, denominator: number): number | null {
  if (denominator <= 0) return null;
  return Math.round((numerator / denominator) * 1000) / 10;
}

function prop(row: EventRow, key: string): unknown {
  return row.properties ? (row.properties as Record<string, unknown>)[key] : undefined;
}

function emptyData(timeRange: CockpitTimeRange): CockpitAnalyticsData {
  return {
    timeRange,
    truncated: false,
    kpis: {
      pageviews: 0,
      cockpitViews: 0,
      ctaClicks: 0,
      overallCtr: null,
      eventCount: 0,
      prevEventCount: 0,
      volumeDeltaPct: null,
      zeroVolume: false,
      silentCount: 0,
    },
    byTopic: [],
    bySurface: [],
    rates: {
      winnerImpressionToClick: null,
      cardImpressionToClick: null,
      matcherCompleteToClick: null,
      compareUsageToClick: null,
      top3Ctr: null,
      restCtr: null,
    },
    ctaSplit: { offer: 0, visit: 0, review: 0, unavailable: 0 },
    destinationSplit: {},
    deviceSplit: [],
    health: [],
  };
}

export async function getCockpitAnalytics(
  timeRange: CockpitTimeRange = '7d',
  marketFilter?: string,
): Promise<{ success: boolean; data: CockpitAnalyticsData | null; error: string | null }> {
  try {
    const { createServiceClient } = await import('@/lib/supabase/server');
    const supabase = createServiceClient();

    const since = new Date();
    const prevSince = new Date();
    if (timeRange === '24h') {
      since.setHours(since.getHours() - 24);
      prevSince.setHours(prevSince.getHours() - 48);
    } else if (timeRange === '7d') {
      since.setDate(since.getDate() - 7);
      prevSince.setDate(prevSince.getDate() - 14);
    } else {
      since.setDate(since.getDate() - 30);
      prevSince.setDate(prevSince.getDate() - 60);
    }

    // ── A: cockpit events, paged (no silent truncation) ─────────────────────
    const events: EventRow[] = [];
    let truncated = false;
    for (let page = 0; page < MAX_PAGES; page++) {
      let q = supabase
        .from('analytics_events')
        .select('session_id, event_name, event_label, event_value, page_path, device_type, properties')
        .eq('event_category', 'cockpit')
        .gte('occurred_at', since.toISOString())
        .order('occurred_at', { ascending: true })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
      if (marketFilter) q = q.like('page_path', `/${marketFilter}/%`);

      const { data, error } = await q;
      if (error) {
        if (error.code === 'PGRST204' || error.code === '42P01') {
          return { success: true, data: emptyData(timeRange), error: null };
        }
        logger.error('[Cockpit Analytics] Events query error:', error.message);
        return { success: false, data: null, error: error.message };
      }
      const rows = (data || []) as EventRow[];
      events.push(...rows);
      if (rows.length < PAGE_SIZE) break;
      if (page === MAX_PAGES - 1) truncated = true;
    }

    // ── B: cockpit pageviews (denominators + silent detection) ──────────────
    let pvQuery = supabase
      .from('page_views')
      .select('page_path, device_type')
      .gte('viewed_at', since.toISOString())
      .like('page_path', '%/best/%');
    if (marketFilter) pvQuery = pvQuery.like('page_path', `/${marketFilter}/%`);
    const { data: pvData } = await pvQuery.limit(50_000);

    // Pageviews per cockpit path (parseCockpitPath filters non-cockpit /best/ hits)
    const pvByPath = new Map<string, number>();
    for (const row of pvData || []) {
      const parsed = parseCockpitPath(row.page_path);
      if (!parsed) continue;
      const path = row.page_path.split('?')[0].replace(/\/$/, '');
      pvByPath.set(path, (pvByPath.get(path) || 0) + 1);
    }

    // ── C: previous-window event count (volume trend) ───────────────────────
    let prevQ = supabase
      .from('analytics_events')
      .select('id', { count: 'exact', head: true })
      .eq('event_category', 'cockpit')
      .gte('occurred_at', prevSince.toISOString())
      .lt('occurred_at', since.toISOString());
    if (marketFilter) prevQ = prevQ.like('page_path', `/${marketFilter}/%`);
    const { count: prevCountRaw } = await prevQ;
    const prevEventCount = prevCountRaw || 0;

    // ── Aggregation ──────────────────────────────────────────────────────────
    const normPath = (p: string | null): string => (p || '').split('?')[0].replace(/\/$/, '');

    const clicks = events.filter((e) => e.event_name === 'cockpit_cta_click');
    const impressions = events.filter((e) => e.event_name === 'cockpit_product_impression');
    const viewportImpressions = impressions.filter((e) => prop(e, 'impressionKind') !== 'rendered');
    const views = events.filter((e) => e.event_name === 'cockpit_view');
    const rootViews = views.filter((e) => prop(e, 'surface') === 'cockpit');

    // Topic rows
    const topicMap = new Map<string, CockpitTopicRow>();
    const ensureTopic = (path: string): CockpitTopicRow | null => {
      const parsed = parseCockpitPath(path);
      if (!parsed) return null;
      let row = topicMap.get(path);
      if (!row) {
        row = {
          pagePath: path,
          market: parsed.market,
          category: parsed.category,
          topic: parsed.topic,
          pageviews: pvByPath.get(path) || 0,
          cockpitViews: 0,
          impressions: 0,
          clicks: 0,
          ctr: null,
          offerClicks: 0,
          visitClicks: 0,
          reviewClicks: 0,
          unavailableClicks: 0,
          mobileClicks: 0,
          desktopClicks: 0,
        };
        topicMap.set(path, row);
      }
      return row;
    };
    for (const path of pvByPath.keys()) ensureTopic(path);

    const ctaSplit = { offer: 0, visit: 0, review: 0, unavailable: 0 };
    const destinationSplit: Record<string, number> = {};
    const deviceClicks = new Map<string, number>();
    const deviceViews = new Map<string, number>();

    for (const e of rootViews) {
      const row = ensureTopic(normPath(e.page_path));
      if (row) row.cockpitViews += 1;
      const dev = e.device_type || 'unknown';
      deviceViews.set(dev, (deviceViews.get(dev) || 0) + 1);
    }
    for (const e of impressions) {
      const row = ensureTopic(normPath(e.page_path));
      if (row) row.impressions += 1;
    }
    for (const e of clicks) {
      const row = ensureTopic(normPath(e.page_path));
      const mode = String(prop(e, 'ctaMode') || 'unknown');
      const dest = String(prop(e, 'destinationType') || 'unknown');
      destinationSplit[dest] = (destinationSplit[dest] || 0) + 1;
      if (mode === 'offer' || mode === 'visit' || mode === 'review' || mode === 'unavailable') {
        ctaSplit[mode] += 1;
      }
      const dev = e.device_type || 'unknown';
      deviceClicks.set(dev, (deviceClicks.get(dev) || 0) + 1);
      if (row) {
        row.clicks += 1;
        if (mode === 'offer') row.offerClicks += 1;
        else if (mode === 'visit') row.visitClicks += 1;
        else if (mode === 'review') row.reviewClicks += 1;
        else if (mode === 'unavailable') row.unavailableClicks += 1;
        if (dev === 'mobile') row.mobileClicks += 1;
        else if (dev === 'desktop') row.desktopClicks += 1;
      }
    }
    for (const row of topicMap.values()) row.ctr = pct(row.clicks, row.pageviews);

    const byTopic = [...topicMap.values()].sort(
      (a, b) => b.clicks - a.clicks || b.pageviews - a.pageviews,
    );

    // Surface rows — honest denominators: card/verdict = viewport impressions,
    // table/compare = cockpit_view of that surface ('rendered' events are rank
    // coverage only, never a visibility denominator).
    const surfaceClicks = new Map<string, number>();
    for (const e of clicks) {
      const s = String(prop(e, 'surface') || 'unknown');
      surfaceClicks.set(s, (surfaceClicks.get(s) || 0) + 1);
    }
    const bySurface: CockpitSurfaceRow[] = [];
    for (const surface of ['card', 'verdict'] as const) {
      const denom = viewportImpressions.filter((e) => prop(e, 'surface') === surface).length;
      const c = surfaceClicks.get(surface) || 0;
      bySurface.push({ surface, clicks: c, denominator: denom, denomKind: 'impressions', ctr: pct(c, denom) });
    }
    for (const surface of ['table', 'compare'] as const) {
      const denom = views.filter((e) => prop(e, 'surface') === surface).length;
      const c = surfaceClicks.get(surface) || 0;
      bySurface.push({ surface, clicks: c, denominator: denom, denomKind: 'views', ctr: pct(c, denom) });
    }

    // Engagement → CTA rates
    const isWinner = (e: EventRow) => e.event_value === 1 || prop(e, 'isTopPick') === true || prop(e, 'rank') === 1;
    const winnerImpr = viewportImpressions.filter(isWinner).length;
    const winnerClicks = clicks.filter(isWinner).length;

    const cardImpr = viewportImpressions.filter((e) => prop(e, 'surface') === 'card').length;
    const cardClicks = surfaceClicks.get('card') || 0;

    const sessionKey = (e: EventRow) => `${e.session_id}|${normPath(e.page_path)}`;
    const sessions = new Map<string, { complete: boolean; compareUsage: boolean; click: boolean }>();
    for (const e of events) {
      const key = sessionKey(e);
      let s = sessions.get(key);
      if (!s) {
        s = { complete: false, compareUsage: false, click: false };
        sessions.set(key, s);
      }
      if (e.event_name === 'cockpit_matcher_complete') s.complete = true;
      if (
        e.event_name === 'cockpit_compare_toggle' ||
        (e.event_name === 'cockpit_view' && prop(e, 'surface') === 'compare')
      ) {
        s.compareUsage = true;
      }
      if (e.event_name === 'cockpit_cta_click') s.click = true;
    }
    let completeSessions = 0;
    let completeAndClick = 0;
    let compareSessions = 0;
    let compareAndClick = 0;
    for (const s of sessions.values()) {
      if (s.complete) {
        completeSessions += 1;
        if (s.click) completeAndClick += 1;
      }
      if (s.compareUsage) {
        compareSessions += 1;
        if (s.click) compareAndClick += 1;
      }
    }

    const rankOf = (e: EventRow): number | null => {
      const r = prop(e, 'rank');
      return typeof r === 'number' ? r : typeof e.event_value === 'number' ? e.event_value : null;
    };
    const cardViewport = viewportImpressions.filter((e) => prop(e, 'surface') === 'card');
    const cardClickEvents = clicks.filter((e) => prop(e, 'surface') === 'card');
    const top3Impr = cardViewport.filter((e) => (rankOf(e) ?? 99) <= 3).length;
    const top3Clicks = cardClickEvents.filter((e) => (rankOf(e) ?? 99) <= 3).length;
    const restImpr = cardViewport.length - top3Impr;
    const restClicks = cardClickEvents.length - top3Clicks;

    // Device split
    const deviceSplit: CockpitDeviceRow[] = [...new Set([...deviceClicks.keys(), ...deviceViews.keys()])]
      .map((device) => {
        const c = deviceClicks.get(device) || 0;
        const v = deviceViews.get(device) || 0;
        return { device, clicks: c, views: v, ctr: pct(c, v) };
      })
      .sort((a, b) => b.clicks - a.clicks);

    // Health — silent cockpit detection (pageviews are NOT bot-filtered while
    // cockpit events are, hence the ≥5 pageview floor before "silent" counts)
    const eventsByPath = new Map<string, { events: number; clicks: number }>();
    for (const e of events) {
      const path = normPath(e.page_path);
      let h = eventsByPath.get(path);
      if (!h) {
        h = { events: 0, clicks: 0 };
        eventsByPath.set(path, h);
      }
      h.events += 1;
      if (e.event_name === 'cockpit_cta_click') h.clicks += 1;
    }
    const healthPaths = new Set<string>([...pvByPath.keys(), ...eventsByPath.keys()]);
    const health: CockpitHealthRow[] = [];
    for (const path of healthPaths) {
      const parsed = parseCockpitPath(path);
      if (!parsed) continue;
      const pageviews = pvByPath.get(path) || 0;
      const h = eventsByPath.get(path) || { events: 0, clicks: 0 };
      health.push({
        pagePath: path,
        market: parsed.market,
        isNewMarket: NEW_MARKETS.has(parsed.market),
        pageviews,
        events: h.events,
        clicks: h.clicks,
        silent: pageviews >= 5 && h.events === 0,
      });
    }
    health.sort((a, b) => Number(b.silent) - Number(a.silent) || b.pageviews - a.pageviews);

    const totalPageviews = [...pvByPath.values()].reduce((a, b) => a + b, 0);
    const eventCount = events.length;
    const data: CockpitAnalyticsData = {
      timeRange,
      truncated,
      kpis: {
        pageviews: totalPageviews,
        cockpitViews: rootViews.length,
        ctaClicks: clicks.length,
        overallCtr: pct(clicks.length, totalPageviews),
        eventCount,
        prevEventCount,
        volumeDeltaPct: prevEventCount > 0 ? Math.round(((eventCount - prevEventCount) / prevEventCount) * 100) : null,
        zeroVolume: eventCount === 0 && totalPageviews > 0,
        silentCount: health.filter((h) => h.silent).length,
      },
      byTopic,
      bySurface,
      rates: {
        winnerImpressionToClick: pct(winnerClicks, winnerImpr),
        cardImpressionToClick: pct(cardClicks, cardImpr),
        matcherCompleteToClick: pct(completeAndClick, completeSessions),
        compareUsageToClick: pct(compareAndClick, compareSessions),
        top3Ctr: pct(top3Clicks, top3Impr),
        restCtr: pct(restClicks, restImpr),
      },
      ctaSplit,
      destinationSplit,
      deviceSplit,
      health,
    };

    return { success: true, data, error: null };
  } catch (err) {
    logger.error('[Cockpit Analytics] Failed:', err);
    return { success: false, data: null, error: 'Internal error' };
  }
}
