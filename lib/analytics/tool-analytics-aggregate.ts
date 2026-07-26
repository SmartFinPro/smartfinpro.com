// lib/analytics/tool-analytics-aggregate.ts
//
// Pure, framework-free aggregation for /dashboard/analytics/tools
// (tool_v1). No React, no DOM, no Supabase, no 'use server' — this module
// is deliberately NOT under lib/actions/ so it can be:
//   1. unit-tested directly in node (__tests__/unit/tool-analytics.test.ts)
//   2. imported (types only OR value) from the 'use client' dashboard widget
//      (components/dashboard/tool-analytics.tsx) WITHOUT ever importing
//      lib/actions/tool-analytics.ts, which is 'use server' + 'server-only'
//      and would otherwise trip the documented Turbopack client→action trap.
//
// lib/actions/tool-analytics.ts does the Supabase fetch (fetchAllPaged,
// select-then-aggregate-in-JS, pattern: cockpit-analytics.ts) and calls the
// functions here to turn raw rows into the shapes below.

import type { ToolId, ToolMarket } from '@/lib/tools/registry/types';

export type ToolAnalyticsDays = 7 | 14 | 30 | 90;

export interface ToolAnalyticsFilters {
  days: ToolAnalyticsDays;
  market?: ToolMarket;
  toolId?: ToolId;
  device?: string;
}

export interface ToolFunnelRow {
  toolId: ToolId;
  market: ToolMarket;
  views: number;
  starts: number;
  firstResults: number;
  qualified: number;
  /** Median tool_first_result.ttfvMs — null when no first-result events. */
  ttfvMedianMs: number | null;
  /** firstResults ÷ views, percent (0-100). 0 when views = 0. */
  completionRate: number;
  /** qualified ÷ views, percent (0-100) — North-Star metric. 0 when views = 0. */
  qdr: number;
  /** tool_next_action_click ÷ firstResults, percent. 0 when firstResults = 0. */
  resultToActionRate: number;
  /** (tool_result_share + tool_report_download + tool_report_email) ÷ firstResults, percent. */
  shareReportRate: number;
  /** tool_scenario_compare events per result session (avg, not %). 0 when firstResults = 0. */
  scenarioComparesPerResultSession: number;
  /**
   * Honest label for "returning usage" (Spec 10.4): sessions whose tool_view
   * fired on ≥2 distinct calendar days ÷ total sessions with a view, percent.
   * This is NOT cross-session/cross-device user identity — only what a
   * single session-storage-scoped session can prove — hence "within session
   * window", never "returning users".
   */
  returnWithinSessionRate: number;
}

export type ToolHealthStatus = 'reporting' | 'silent' | 'low_traffic' | 'no_traffic';

export interface ToolHealthRow {
  toolId: ToolId;
  market: ToolMarket;
  path: string;
  status: ToolHealthStatus;
  pageviews: number;
  events: number;
}

export interface ToolVolumeRow {
  /** UTC calendar day, 'YYYY-MM-DD'. */
  day: string;
  eventName: string;
  rows: number;
  /** true when this (day, eventName) crosses its volume-guard threshold. */
  warning: boolean;
}

export interface ToolMobileDropoffRow {
  toolId: ToolId;
  market: ToolMarket;
  /** 1 − completion(mobile) ÷ completion(desktop), percent. null when desktop
   *  views < 50 (too little data) or completion(desktop) = 0. */
  value: number | null;
}

export interface ToolAnnotation {
  date: string;
  label: string;
}

export interface ToolAnalyticsKpis {
  views: number;
  qualified: number;
  /** Overall QDR across the filtered scope, percent. North-Star. */
  qdr: number;
  expectedTotal: number;
  reportingCount: number;
  silentCount: number;
  lowTrafficCount: number;
  noTrafficCount: number;
}

export interface ToolAnalyticsData {
  days: ToolAnalyticsDays;
  truncated: boolean;
  funnel: ToolFunnelRow[];
  health: ToolHealthRow[];
  volume: ToolVolumeRow[];
  mobileDropoff: ToolMobileDropoffRow[];
  annotations: ToolAnnotation[];
  kpis: ToolAnalyticsKpis;
}

/**
 * Minimal per-row shape the aggregator needs — a normalized projection of an
 * analytics_events row with event_category='tool' (see tool-events.ts /
 * ToolV1Properties for the full wire contract). Kept decoupled from DB
 * column names so this module has zero Supabase/server imports.
 */
export interface ToolEventRow {
  sessionId: string;
  eventName: string;
  eventValue: number | null;
  deviceType: string | null;
  /** ISO timestamp string. */
  occurredAt: string;
  toolId: string;
  market: string;
  variantPath: string;
  controlRole?: string;
}

export interface ToolManifestEntry {
  toolId: string;
  path: string;
  market: string;
}

const VOLUME_WARN_THRESHOLD: Record<string, number> = {
  tool_input_change: 5_000,
};

/** Percent rate (0-100), rounded to 1 decimal. Division-by-zero → 0 (a
 *  funnel rate with no denominator is "nothing happened yet", not unknown —
 *  unlike TTFV/mobile-dropoff, which use null for "not enough data"). */
export function ratePct(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 1000) / 10;
}

/** Standard median: average of the two middle values when the count is
 *  even, the single middle value when odd. null for an empty array. */
export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/** Unified funnel dedupe scope (Spec 10.1): sessionId + toolId + market +
 *  variantPath. Two rows with the same key count as ONE view/start/etc,
 *  even if the client (or a retried batch) sent the event twice. */
export function funnelDedupeKey(
  e: Pick<ToolEventRow, 'sessionId' | 'toolId' | 'market' | 'variantPath'>,
): string {
  return `${e.sessionId}|${e.toolId}|${e.market}|${e.variantPath}`;
}

function dayOf(occurredAt: string): string {
  const d = new Date(occurredAt);
  if (Number.isNaN(d.getTime())) return 'invalid';
  return d.toISOString().slice(0, 10);
}

function groupKeyOf(e: { toolId: string; market: string }): string {
  return `${e.toolId}|${e.market}`;
}

/**
 * Aggregates funnel metrics per (toolId, market). Dedupes the funnel-scoped
 * "fires once per funnel key" events (tool_view/tool_start/
 * tool_first_result/tool_qualified_decision) via funnelDedupeKey — defensive
 * against retried/duplicated batches, never trusting the client-side
 * impression deduper alone.
 */
export function aggregateFunnel(events: ToolEventRow[]): ToolFunnelRow[] {
  interface Acc {
    toolId: string;
    market: string;
    viewKeys: Set<string>;
    startKeys: Set<string>;
    firstResultKeys: Set<string>;
    qualifiedKeys: Set<string>;
    ttfvByKey: Map<string, number>;
    nextActionCount: number;
    scenarioCompareCount: number;
    shareReportCount: number;
    /** funnelKey → set of distinct calendar days a tool_view fired on. */
    viewDaysByKey: Map<string, Set<string>>;
  }

  const groups = new Map<string, Acc>();
  const ensure = (e: ToolEventRow): Acc => {
    const gk = groupKeyOf(e);
    let acc = groups.get(gk);
    if (!acc) {
      acc = {
        toolId: e.toolId,
        market: e.market,
        viewKeys: new Set(),
        startKeys: new Set(),
        firstResultKeys: new Set(),
        qualifiedKeys: new Set(),
        ttfvByKey: new Map(),
        nextActionCount: 0,
        scenarioCompareCount: 0,
        shareReportCount: 0,
        viewDaysByKey: new Map(),
      };
      groups.set(gk, acc);
    }
    return acc;
  };

  for (const e of events) {
    const acc = ensure(e);
    const fKey = funnelDedupeKey(e);
    switch (e.eventName) {
      case 'tool_view': {
        acc.viewKeys.add(fKey);
        let days = acc.viewDaysByKey.get(fKey);
        if (!days) {
          days = new Set();
          acc.viewDaysByKey.set(fKey, days);
        }
        days.add(dayOf(e.occurredAt));
        break;
      }
      case 'tool_start':
        acc.startKeys.add(fKey);
        break;
      case 'tool_first_result':
        if (!acc.firstResultKeys.has(fKey)) {
          acc.firstResultKeys.add(fKey);
          if (typeof e.eventValue === 'number') acc.ttfvByKey.set(fKey, e.eventValue);
        }
        break;
      case 'tool_qualified_decision':
        acc.qualifiedKeys.add(fKey);
        break;
      case 'tool_next_action_click':
        acc.nextActionCount += 1;
        break;
      case 'tool_scenario_compare':
        acc.scenarioCompareCount += 1;
        break;
      case 'tool_result_share':
      case 'tool_report_download':
      case 'tool_report_email':
        acc.shareReportCount += 1;
        break;
      default:
        break;
    }
  }

  const rows: ToolFunnelRow[] = [];
  for (const acc of groups.values()) {
    const views = acc.viewKeys.size;
    const firstResults = acc.firstResultKeys.size;
    const qualified = acc.qualifiedKeys.size;
    const ttfvValues = [...acc.ttfvByKey.values()];

    let returningSessions = 0;
    for (const days of acc.viewDaysByKey.values()) {
      if (days.size >= 2) returningSessions += 1;
    }

    rows.push({
      toolId: acc.toolId as ToolId,
      market: acc.market as ToolMarket,
      views,
      starts: acc.startKeys.size,
      firstResults,
      qualified,
      ttfvMedianMs: median(ttfvValues),
      completionRate: ratePct(firstResults, views),
      qdr: ratePct(qualified, views),
      resultToActionRate: ratePct(acc.nextActionCount, firstResults),
      shareReportRate: ratePct(acc.shareReportCount, firstResults),
      scenarioComparesPerResultSession:
        firstResults > 0 ? Math.round((acc.scenarioCompareCount / firstResults) * 100) / 100 : 0,
      returnWithinSessionRate: ratePct(returningSessions, views),
    });
  }

  rows.sort((a, b) => b.views - a.views || a.toolId.localeCompare(b.toolId) || a.market.localeCompare(b.market));
  return rows;
}

/**
 * Mobile drop-off per (toolId, market): 1 − completion(mobile) ÷
 * completion(desktop). Always computed over ALL devices in scope
 * (independent of any `device` filter the caller may apply to the main
 * funnel tiles — a drop-off comparison is meaningless once one side of the
 * comparison has been filtered away).
 */
export function aggregateMobileDropoff(events: ToolEventRow[]): ToolMobileDropoffRow[] {
  interface DeviceAcc {
    viewKeys: Set<string>;
    firstResultKeys: Set<string>;
  }
  interface Group {
    toolId: string;
    market: string;
    mobile: DeviceAcc;
    desktop: DeviceAcc;
  }

  const groups = new Map<string, Group>();
  const ensure = (e: ToolEventRow): Group => {
    const gk = groupKeyOf(e);
    let g = groups.get(gk);
    if (!g) {
      g = {
        toolId: e.toolId,
        market: e.market,
        mobile: { viewKeys: new Set(), firstResultKeys: new Set() },
        desktop: { viewKeys: new Set(), firstResultKeys: new Set() },
      };
      groups.set(gk, g);
    }
    return g;
  };

  for (const e of events) {
    if (e.deviceType !== 'mobile' && e.deviceType !== 'desktop') continue;
    const g = ensure(e);
    const bucket = e.deviceType === 'mobile' ? g.mobile : g.desktop;
    const fKey = funnelDedupeKey(e);
    if (e.eventName === 'tool_view') bucket.viewKeys.add(fKey);
    if (e.eventName === 'tool_first_result') bucket.firstResultKeys.add(fKey);
  }

  const rows: ToolMobileDropoffRow[] = [];
  for (const g of groups.values()) {
    const desktopViews = g.desktop.viewKeys.size;
    const mobileViews = g.mobile.viewKeys.size;

    if (desktopViews < 50) {
      rows.push({ toolId: g.toolId as ToolId, market: g.market as ToolMarket, value: null });
      continue;
    }

    const completionDesktop = g.desktop.firstResultKeys.size / desktopViews;
    const completionMobile = mobileViews > 0 ? g.mobile.firstResultKeys.size / mobileViews : 0;
    const value = completionDesktop > 0 ? Math.round((1 - completionMobile / completionDesktop) * 1000) / 10 : null;
    rows.push({ toolId: g.toolId as ToolId, market: g.market as ToolMarket, value });
  }

  rows.sort((a, b) => a.toolId.localeCompare(b.toolId) || a.market.localeCompare(b.market));
  return rows;
}

/**
 * Health = expected manifest routes (getExpectedTrackingManifest(), 29
 * entries) × actual events per (toolId, market) — precise, since `market`
 * lives in event properties — × pageviews per PHYSICAL path. Caveat: global
 * multi-market routes (e.g. broker-finder) share ONE page_path across all
 * their markets (variantPath never encodes the ?market= query param), so
 * the pageviews denominator for those rows is shared, not per-market. This
 * mirrors the equivalent, equally-documented limitation in
 * cockpit-analytics.ts. The `events>0` (reporting) determination is
 * unaffected and stays fully market-accurate.
 */
export function aggregateHealth(
  manifest: ToolManifestEntry[],
  events: ToolEventRow[],
  pageviewsByPath: Map<string, number>,
): ToolHealthRow[] {
  const eventsByGroup = new Map<string, number>();
  for (const e of events) {
    const gk = groupKeyOf(e);
    eventsByGroup.set(gk, (eventsByGroup.get(gk) || 0) + 1);
  }

  const STATUS_ORDER: Record<ToolHealthStatus, number> = {
    silent: 0,
    no_traffic: 1,
    low_traffic: 2,
    reporting: 3,
  };

  const rows: ToolHealthRow[] = manifest.map((m) => {
    const gk = groupKeyOf(m);
    const eventCount = eventsByGroup.get(gk) || 0;
    const pageviews = pageviewsByPath.get(m.path) || 0;
    // events>0 wins regardless of pageview count — a route that produced an
    // event is proven to be reporting; only zero-event routes fall through
    // to the pageview-volume-based classification.
    const status: ToolHealthStatus =
      eventCount > 0 ? 'reporting' : pageviews >= 5 ? 'silent' : pageviews > 0 ? 'low_traffic' : 'no_traffic';
    return {
      toolId: m.toolId as ToolId,
      market: m.market as ToolMarket,
      path: m.path,
      status,
      pageviews,
      events: eventCount,
    };
  });

  rows.sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || b.pageviews - a.pageviews);
  return rows;
}

/** rows/day per event_name — the volume guard against a tool_input_change
 *  flood (FIELD_INPUT_CAP/LEVER_INPUT_CAP bound per-session, this bounds the
 *  aggregate). `warning` flags (day, eventName) pairs above their threshold;
 *  only tool_input_change has one defined (>5,000/day) — every other event
 *  name is informational only. */
export function aggregateVolume(events: ToolEventRow[]): ToolVolumeRow[] {
  const counts = new Map<string, number>();
  for (const e of events) {
    const day = dayOf(e.occurredAt);
    const key = `${day}|${e.eventName}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  const rows: ToolVolumeRow[] = [];
  for (const [key, rowCount] of counts) {
    const sep = key.indexOf('|');
    const day = key.slice(0, sep);
    const eventName = key.slice(sep + 1);
    const threshold = VOLUME_WARN_THRESHOLD[eventName];
    rows.push({ day, eventName, rows: rowCount, warning: threshold !== undefined && rowCount > threshold });
  }

  rows.sort((a, b) => a.day.localeCompare(b.day) || a.eventName.localeCompare(b.eventName));
  return rows;
}

/** Overall KPI row (North-Star QDR first) — sums across whatever scope
 *  `funnel` already reflects (i.e. respects market/toolId/device filters
 *  the caller applied upstream), while `health` always reflects the FULL
 *  expected manifest (optionally market/toolId-scoped) regardless of the
 *  `device` filter, since device has no meaning for route-level health. */
export function buildKpis(funnel: ToolFunnelRow[], health: ToolHealthRow[]): ToolAnalyticsKpis {
  const views = funnel.reduce((a, r) => a + r.views, 0);
  const qualified = funnel.reduce((a, r) => a + r.qualified, 0);
  return {
    views,
    qualified,
    qdr: ratePct(qualified, views),
    expectedTotal: health.length,
    reportingCount: health.filter((h) => h.status === 'reporting').length,
    silentCount: health.filter((h) => h.status === 'silent').length,
    lowTrafficCount: health.filter((h) => h.status === 'low_traffic').length,
    noTrafficCount: health.filter((h) => h.status === 'no_traffic').length,
  };
}

/** Shape returned to callers with no rows/table data (missing table,
 *  0 events) — still a fully valid, crash-proof ToolAnalyticsData. */
export function emptyToolAnalyticsData(
  days: ToolAnalyticsDays,
  annotations: ToolAnnotation[] = [],
): ToolAnalyticsData {
  return {
    days,
    truncated: false,
    funnel: [],
    health: [],
    volume: [],
    mobileDropoff: [],
    annotations,
    kpis: {
      views: 0,
      qualified: 0,
      qdr: 0,
      expectedTotal: 0,
      reportingCount: 0,
      silentCount: 0,
      lowTrafficCount: 0,
      noTrafficCount: 0,
    },
  };
}
