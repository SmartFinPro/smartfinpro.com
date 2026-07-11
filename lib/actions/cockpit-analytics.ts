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
const HARD_CAP = 100_000; // per window, per query — beyond this: truncated:true

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

/** 'no_traffic' = expected live route, 0 pageviews this window (can't judge
 *  tracking yet). 'low_traffic' = 1-4 pageviews (too few to call it silent
 *  with confidence). 'silent' = ≥5 pageviews, 0 cockpit events — the strong,
 *  actionable "tracking is broken here" signal. 'reporting' = events > 0. */
export type CockpitHealthStatus = 'reporting' | 'silent' | 'low_traffic' | 'no_traffic';

export interface CockpitHealthRow {
  pagePath: string;
  market: string;
  isNewMarket: boolean;
  pageviews: number;
  events: number;
  clicks: number;
  status: CockpitHealthStatus;
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
    /** Total live cockpit routes expected this window (from the topic
     *  registry × active DB rows) — the denominator "all instrumented pages
     *  reporting" must be checked against, not just paths that happened to
     *  have traffic. */
    expectedTotal: number;
    reportingCount: number;
    silentCount: number;
    lowTrafficCount: number;
    noTrafficCount: number;
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
  occurred_at: string;
}

interface PageViewRow {
  page_path: string;
  device_type: string | null;
}

interface SupabaseQueryError {
  code?: string;
  message: string;
}

/**
 * Fetches ALL rows matching a query via .range() pagination — defensively
 * correct even if PostgREST/Supabase caps a single response BELOW the width
 * requested (a real risk: a naive "returned < requested ⇒ done" loop would
 * misread a capped response as end-of-data and silently drop the remaining
 * rows in that same range). We never treat a short response as EOF — we
 * always advance the cursor by the ACTUAL rows returned and re-query from
 * there; the only valid end-of-data signal is a genuinely EMPTY page.
 * Bounded by hardCap and a generous iteration ceiling as a backstop against
 * an unexpectedly small per-request cap.
 */
async function fetchAllPaged<T>(
  runQuery: (offset: number, limit: number) => Promise<{ data: T[] | null; error: SupabaseQueryError | null }>,
  pageSize: number,
  hardCap: number,
): Promise<{ rows: T[]; truncated: boolean; queryError: SupabaseQueryError | null }> {
  const rows: T[] = [];
  let offset = 0;
  let queryError: SupabaseQueryError | null = null;
  const maxIterations = Math.ceil(hardCap / 100) + 10;
  for (let i = 0; i < maxIterations && offset < hardCap; i++) {
    const limit = Math.min(pageSize, hardCap - offset);
    const { data, error } = await runQuery(offset, limit);
    if (error) {
      queryError = error;
      break;
    }
    const batch = data || [];
    rows.push(...batch);
    if (batch.length === 0) break; // true EOF
    offset += batch.length; // advance by ACTUAL rows — never assume the full page arrived
  }
  return { rows, truncated: offset >= hardCap, queryError };
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
      expectedTotal: 0,
      reportingCount: 0,
      silentCount: 0,
      lowTrafficCount: 0,
      noTrafficCount: 0,
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

    // ── A: cockpit events, robustly paginated (no silent truncation) ────────
    // order by occurred_at + id: batched inserts (event_batch) can share the
    // SAME occurred_at across many rows (one NOW() per INSERT statement) —
    // without a secondary deterministic tiebreaker, .range() pagination over
    // ties is undefined and can skip or duplicate rows across page boundaries.
    const eventsResult = await fetchAllPaged<EventRow>(async (offset, limit) => {
      let q = supabase
        .from('analytics_events')
        .select('session_id, event_name, event_label, event_value, page_path, device_type, properties, occurred_at')
        .eq('event_category', 'cockpit')
        .gte('occurred_at', since.toISOString())
        .order('occurred_at', { ascending: true })
        .order('id', { ascending: true })
        .range(offset, offset + limit - 1);
      if (marketFilter) q = q.like('page_path', `/${marketFilter}/%`);
      const { data, error } = await q;
      return { data: data as EventRow[] | null, error };
    }, PAGE_SIZE, HARD_CAP);

    if (eventsResult.queryError) {
      if (eventsResult.queryError.code === 'PGRST204' || eventsResult.queryError.code === '42P01') {
        return { success: true, data: emptyData(timeRange), error: null };
      }
      logger.error('[Cockpit Analytics] Events query error:', eventsResult.queryError.message);
      return { success: false, data: null, error: eventsResult.queryError.message };
    }
    const events = eventsResult.rows;
    let truncated = eventsResult.truncated;

    // Exact-count cross-check — a defense-in-depth safety net independent of
    // the pagination loop's own EOF detection (e.g. RLS/visibility quirks
    // between the count and data queries). Non-fatal if it errors.
    {
      let countQ = supabase
        .from('analytics_events')
        .select('id', { count: 'exact', head: true })
        .eq('event_category', 'cockpit')
        .gte('occurred_at', since.toISOString());
      if (marketFilter) countQ = countQ.like('page_path', `/${marketFilter}/%`);
      const { count: exactEventCount } = await countQ;
      if (typeof exactEventCount === 'number' && events.length < Math.min(exactEventCount, HARD_CAP)) {
        truncated = true;
      }
    }

    // ── B: cockpit pageviews (denominators + silent detection), same robust
    //      pagination — this is the CTR denominator, so under-fetching it
    //      would be worse than under-fetching events. ─────────────────────
    const pvResult = await fetchAllPaged<PageViewRow>(async (offset, limit) => {
      let q = supabase
        .from('page_views')
        .select('page_path, device_type')
        .gte('viewed_at', since.toISOString())
        .like('page_path', '%/best/%')
        .order('id', { ascending: true })
        .range(offset, offset + limit - 1);
      if (marketFilter) q = q.like('page_path', `/${marketFilter}/%`);
      const { data, error } = await q;
      return { data: data as PageViewRow[] | null, error };
    }, PAGE_SIZE, HARD_CAP);
    if (pvResult.queryError) {
      // Mirror the events path: a missing/empty page_views table is
      // tolerated (zero pageviews), any other error is NOT — silently
      // treating a real query failure as "0 pageviews" would corrupt every
      // CTR and health status derived from it.
      if (pvResult.queryError.code !== 'PGRST204' && pvResult.queryError.code !== '42P01') {
        logger.error('[Cockpit Analytics] Pageviews query error:', pvResult.queryError.message);
        return { success: false, data: null, error: pvResult.queryError.message };
      }
    }
    if (pvResult.truncated) truncated = true;
    const pvData = pvResult.rows;

    // Pageviews per cockpit path (parseCockpitPath filters non-cockpit /best/ hits)
    const pvByPath = new Map<string, number>();
    for (const row of pvData) {
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
    // Scope clicks to the SAME population as winnerImpr (card/verdict
    // viewport surfaces only) — table/compare clicks have no viewport-
    // impression counterpart in that denominator, so including them here
    // could push this rate over 100% and misidentify the "winner".
    const WINNER_CLICK_SURFACES = new Set(['card', 'verdict']);
    const winnerClicks = clicks.filter(
      (e) => isWinner(e) && WINNER_CLICK_SURFACES.has(String(prop(e, 'surface'))),
    ).length;

    const cardImpr = viewportImpressions.filter((e) => prop(e, 'surface') === 'card').length;
    const cardClicks = surfaceClicks.get('card') || 0;

    // Matcher-complete / compare-usage → CTA are TEMPORALLY ordered: a click
    // only counts as a conversion if it happened AT OR AFTER the qualifying
    // signal within the same session — a click that preceded the matcher
    // completion (or preceded ever touching Compare) is not caused by it.
    // Caveat: event_batch inserts share ONE occurred_at per batch (Postgres
    // evaluates NOW() once per INSERT statement), so a signal and a click
    // flushed in the SAME batch can carry an identical timestamp; those are
    // counted as "at" the signal (>=) rather than dropped, which slightly
    // favors counting over strict causality for same-batch pairs.
    const sessionKey = (e: EventRow) => `${e.session_id}|${normPath(e.page_path)}`;
    interface SessionSignal {
      completeAt: number | null;
      compareUsageAt: number | null;
      clickTimes: number[];
    }
    const sessions = new Map<string, SessionSignal>();
    for (const e of events) {
      const key = sessionKey(e);
      let s = sessions.get(key);
      if (!s) {
        s = { completeAt: null, compareUsageAt: null, clickTimes: [] };
        sessions.set(key, s);
      }
      const t = Date.parse(e.occurred_at);
      if (Number.isNaN(t)) continue;
      if (e.event_name === 'cockpit_matcher_complete' && (s.completeAt === null || t < s.completeAt)) {
        s.completeAt = t;
      }
      if (
        (e.event_name === 'cockpit_compare_toggle' ||
          (e.event_name === 'cockpit_view' && prop(e, 'surface') === 'compare')) &&
        (s.compareUsageAt === null || t < s.compareUsageAt)
      ) {
        s.compareUsageAt = t;
      }
      if (e.event_name === 'cockpit_cta_click') s.clickTimes.push(t);
    }
    let completeSessions = 0;
    let completeAndClick = 0;
    let compareSessions = 0;
    let compareAndClick = 0;
    for (const s of sessions.values()) {
      if (s.completeAt !== null) {
        completeSessions += 1;
        if (s.clickTimes.some((t) => t >= s.completeAt!)) completeAndClick += 1;
      }
      if (s.compareUsageAt !== null) {
        compareSessions += 1;
        if (s.clickTimes.some((t) => t >= s.compareUsageAt!)) compareAndClick += 1;
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

    // Health — built from the FULL manifest of currently-live cockpit routes
    // (topic registry × active DB rows via getCockpitRouteParams), not just
    // paths that happened to have pageviews/events THIS window. Otherwise a
    // cockpit with zero traffic never appears at all, and a "0 silent" count
    // would falsely read as "all cockpits reporting" when most were simply
    // absent from the sample. Pageviews are NOT bot-filtered while cockpit
    // events are, hence the ≥5 pageview floor before "silent" (vs
    // "low_traffic") counts as the strong, actionable broken-tracking signal.
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

    const { getCockpitRouteParams } = await import('@/lib/comparison/loader');
    const liveRoutes = await getCockpitRouteParams();
    const expectedRoutes = marketFilter ? liveRoutes.filter((r) => r.market === marketFilter) : liveRoutes;

    const STATUS_ORDER: Record<CockpitHealthStatus, number> = {
      silent: 0,
      no_traffic: 1,
      low_traffic: 2,
      reporting: 3,
    };
    const health: CockpitHealthRow[] = expectedRoutes.map(({ market: rMarket, category, topic }) => {
      const path = `/${rMarket}/${category}/best/${topic}`;
      const pageviews = pvByPath.get(path) || 0;
      const h = eventsByPath.get(path) || { events: 0, clicks: 0 };
      // events>0 must win regardless of pageview count — a route with 1
      // pageview that DID produce an event is proven to be reporting, not
      // "too little traffic to judge". Only routes with zero events fall
      // through to the pageview-volume-based classification.
      const status: CockpitHealthStatus =
        h.events > 0 ? 'reporting' : pageviews >= 5 ? 'silent' : pageviews > 0 ? 'low_traffic' : 'no_traffic';
      return {
        pagePath: path,
        market: rMarket,
        isNewMarket: NEW_MARKETS.has(rMarket),
        pageviews,
        events: h.events,
        clicks: h.clicks,
        status,
      };
    });
    health.sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || b.pageviews - a.pageviews);

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
        expectedTotal: expectedRoutes.length,
        reportingCount: health.filter((h) => h.status === 'reporting').length,
        silentCount: health.filter((h) => h.status === 'silent').length,
        lowTrafficCount: health.filter((h) => h.status === 'low_traffic').length,
        noTrafficCount: health.filter((h) => h.status === 'no_traffic').length,
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
