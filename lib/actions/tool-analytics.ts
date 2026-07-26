'use server';
import 'server-only';

// ============================================================
// Tool Analytics (tool_v1)
// Aggregates the analytics_events rows with event_category='tool' for
// /dashboard/analytics/tools. Pattern: lib/actions/cockpit-analytics.ts —
// fetchAllPaged (defensive .range() pagination, no silent truncation),
// select-then-aggregate-in-JS, missing-table errors tolerated.
//
// This file is 'use server' + 'server-only' and must NEVER be imported
// (value or type) from a 'use client' component — see
// components/dashboard/tool-analytics.tsx, which only ever calls
// fetch('/api/dashboard/tool-analytics') and imports its types from the
// sibling pure module lib/analytics/tool-analytics-aggregate.ts instead.
// ============================================================

import { logger } from '@/lib/logging';
import { getExpectedTrackingManifest } from '@/lib/tools/registry';
import { ANALYTICS_ANNOTATIONS } from '@/lib/analytics/analytics-annotations';
import {
  aggregateFunnel,
  aggregateHealth,
  aggregateMobileDropoff,
  aggregateVolume,
  buildKpis,
  emptyToolAnalyticsData,
  type ToolAnalyticsData,
  type ToolAnalyticsDays,
  type ToolAnalyticsFilters,
  type ToolEventRow,
} from '@/lib/analytics/tool-analytics-aggregate';

export type {
  ToolAnalyticsData,
  ToolAnalyticsDays,
  ToolAnalyticsFilters,
  ToolAnnotation,
  ToolFunnelRow,
  ToolHealthRow,
  ToolHealthStatus,
  ToolMobileDropoffRow,
  ToolVolumeRow,
} from '@/lib/analytics/tool-analytics-aggregate';

const PAGE_SIZE = 10_000;
const HARD_CAP = 100_000; // per window, per query — beyond this: truncated:true

interface SupabaseQueryError {
  code?: string;
  message: string;
}

interface RawEventRow {
  session_id: string;
  event_name: string;
  event_value: number | null;
  page_path: string | null;
  device_type: string | null;
  properties: Record<string, unknown> | null;
  occurred_at: string;
}

interface RawPageViewRow {
  page_path: string;
}

/**
 * Fetches ALL rows matching a query via .range() pagination — defensively
 * correct even if PostgREST/Supabase caps a single response BELOW the width
 * requested. We never treat a short response as EOF — we always advance the
 * cursor by the ACTUAL rows returned and re-query from there; the only
 * valid end-of-data signal is a genuinely EMPTY page. Bounded by hardCap and
 * a generous iteration ceiling as a backstop. (Identical logic to
 * cockpit-analytics.ts's fetchAllPaged — kept as a local copy rather than a
 * shared import so neither file needs to depend on the other; cockpit_v1
 * stays frozen and untouched, 0.1.)
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

function isMissingTableError(err: SupabaseQueryError): boolean {
  return err.code === 'PGRST204' || err.code === '42P01';
}

function normPath(p: string | null): string {
  return (p || '').split('?')[0].replace(/\/$/, '');
}

/** Normalizes a raw analytics_events row into the shape the pure aggregator
 *  needs. Rows missing toolId/market/variantPath (malformed/legacy data)
 *  are filtered out by the caller — they cannot be attributed to any
 *  funnel scope. */
function toToolEventRow(r: RawEventRow): ToolEventRow | null {
  const props = r.properties || {};
  const toolId = props.toolId;
  const market = props.market;
  const variantPath = typeof props.variantPath === 'string' ? props.variantPath : normPath(r.page_path);
  if (typeof toolId !== 'string' || !toolId) return null;
  if (typeof market !== 'string' || !market) return null;
  if (!variantPath) return null;
  return {
    sessionId: r.session_id,
    eventName: r.event_name,
    eventValue: r.event_value,
    deviceType: r.device_type,
    occurredAt: r.occurred_at,
    toolId,
    market,
    variantPath,
    controlRole: typeof props.controlRole === 'string' ? props.controlRole : undefined,
  };
}

/**
 * Fetches + aggregates tool_v1 analytics for the dashboard tab.
 *
 * `days`/`market`/`toolId` scope BOTH the funnel numbers and the health
 * manifest. `device`, when set, scopes ONLY the main funnel tiles — the
 * mobile-dropoff tile always compares the full mobile-vs-desktop
 * population within the market/toolId scope (a drop-off comparison is
 * meaningless once one side has been filtered away), and health/volume are
 * device-agnostic by definition (route-level, not session-level).
 */
export async function getToolAnalytics(
  filters: ToolAnalyticsFilters,
): Promise<{ success: boolean; data?: ToolAnalyticsData; error?: string }> {
  try {
    const { createServiceClient } = await import('@/lib/supabase/server');
    const supabase = createServiceClient();

    const since = new Date();
    since.setDate(since.getDate() - filters.days);

    // ── A: tool events, robustly paginated ──────────────────────────────
    const eventsResult = await fetchAllPaged<RawEventRow>(async (offset, limit) => {
      const { data, error } = await supabase
        .from('analytics_events')
        .select('session_id, event_name, event_value, page_path, device_type, properties, occurred_at')
        .eq('event_category', 'tool')
        .gte('occurred_at', since.toISOString())
        .order('occurred_at', { ascending: true })
        .order('id', { ascending: true })
        .range(offset, offset + limit - 1);
      return { data: data as RawEventRow[] | null, error };
    }, PAGE_SIZE, HARD_CAP);

    if (eventsResult.queryError) {
      if (isMissingTableError(eventsResult.queryError)) {
        return { success: true, data: emptyToolAnalyticsData(filters.days, ANALYTICS_ANNOTATIONS) };
      }
      logger.error('[Tool Analytics] Events query error:', eventsResult.queryError.message);
      return { success: false, error: eventsResult.queryError.message };
    }

    let truncated = eventsResult.truncated;
    const rawRows = eventsResult.rows;

    const allEvents: ToolEventRow[] = [];
    for (const r of rawRows) {
      const e = toToolEventRow(r);
      if (e) allEvents.push(e);
    }

    // Scope respected by funnel + health + mobile-dropoff (device excluded — see docstring above)
    const marketToolScoped = allEvents.filter(
      (e) =>
        (!filters.market || e.market === filters.market) &&
        (!filters.toolId || e.toolId === filters.toolId),
    );
    // Additionally scoped by `device` — used ONLY for the main funnel tiles.
    const fullyScoped = marketToolScoped.filter((e) => !filters.device || e.deviceType === filters.device);

    // ── B: tool pageviews (health denominators) ─────────────────────────
    const pvResult = await fetchAllPaged<RawPageViewRow>(async (offset, limit) => {
      const { data, error } = await supabase
        .from('page_views')
        .select('page_path')
        .gte('viewed_at', since.toISOString())
        .like('page_path', '%/tools/%')
        .order('id', { ascending: true })
        .range(offset, offset + limit - 1);
      return { data: data as RawPageViewRow[] | null, error };
    }, PAGE_SIZE, HARD_CAP);

    if (pvResult.queryError && !isMissingTableError(pvResult.queryError)) {
      // Mirror cockpit-analytics.ts: a missing/empty page_views table is
      // tolerated (zero pageviews); any other error is NOT — silently
      // treating a real query failure as "0 pageviews" would corrupt every
      // health status derived from it.
      logger.error('[Tool Analytics] Pageviews query error:', pvResult.queryError.message);
      return { success: false, error: pvResult.queryError.message };
    }
    if (pvResult.truncated) truncated = true;

    const pvByPath = new Map<string, number>();
    for (const row of pvResult.rows) {
      const path = normPath(row.page_path);
      if (!path) continue;
      pvByPath.set(path, (pvByPath.get(path) || 0) + 1);
    }

    // ── Manifest scope (health) ──────────────────────────────────────────
    const fullManifest = getExpectedTrackingManifest();
    const manifest = fullManifest.filter(
      (m) => (!filters.market || m.market === filters.market) && (!filters.toolId || m.toolId === filters.toolId),
    );

    // ── Aggregation (pure) ────────────────────────────────────────────────
    const funnel = aggregateFunnel(fullyScoped);
    const health = aggregateHealth(manifest, marketToolScoped, pvByPath);
    const volume = aggregateVolume(fullyScoped);
    const mobileDropoff = aggregateMobileDropoff(marketToolScoped);
    const kpis = buildKpis(funnel, health);

    const data: ToolAnalyticsData = {
      days: filters.days,
      truncated,
      funnel,
      health,
      volume,
      mobileDropoff,
      annotations: ANALYTICS_ANNOTATIONS,
      kpis,
    };

    return { success: true, data };
  } catch (err) {
    logger.error('[Tool Analytics] Failed:', err);
    return { success: false, error: 'Internal error' };
  }
}
