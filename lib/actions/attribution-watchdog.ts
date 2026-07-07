'use server';
import 'server-only';

import { revalidatePath } from 'next/cache';
import { createServiceClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logging';
import { sendAlert, sendAlertWithActions } from '@/lib/alerts/alert-delivery';
import {
  computeHealthScore,
  classifyStageFailure,
  estimateRevenueRisk,
  resolveExpectedWindow,
  type ProviderSnapshot,
  type HealthScoreResult,
  type WatchdogThresholds,
  type IncidentType,
  type IncidentStatus,
} from '@/lib/attribution/health-score';

// ============================================================================
// Attribution Watchdog — data assembly + incident lifecycle.
//
// All decision logic (score, stage classification, risk) is pure and lives in
// lib/attribution/health-score.ts. This module only reads the DB, assembles
// ProviderSnapshots and persists incidents/alerts.
//
// Traffic volumes are small (hundreds of clicks/month), so we fetch the raw
// rows once and aggregate in memory instead of firing hundreds of count
// queries. Row caps below are a memory guard, not a correctness boundary.
// ============================================================================

// ── Local row types (service client is untyped; codebase convention) ────────

interface LinkRow {
  id: string;
  slug: string;
  partner_name: string;
  destination_url: string;
  category: string | null;
  market: string | null;
  commission_value: number | null;
  active: boolean;
  network: string | null;
  tracking_status: string | null;
  postback_supported: boolean | null;
  expected_conversion_days: number | null;
}

interface ClickRow {
  link_id: string;
  click_id: string | null;
  clicked_at: string;
}

interface EventRow {
  link_id: string | null;
  event_type: string;
  event_value: number | null;
  occurred_at: string | null;
  received_at: string;
}

interface ConversionRow {
  link_id: string;
  commission_earned: number | null;
  status: string;
  converted_at: string;
}

interface ConnectorRow {
  name: string;
  is_enabled: boolean;
  last_sync_at: string | null;
  last_sync_status: string | null;
}

export interface IncidentRow {
  id: string;
  provider: string;
  network: string | null;
  market: string | null;
  category: string | null;
  incident_type: IncidentType;
  status: IncidentStatus;
  detected_at: string;
  clicks_since_last_conversion: number;
  last_conversion_at: string | null;
  health_score: number | null;
  suspected_cause: string | null;
  revenue_risk_estimate: number | null;
  ignored_until: string | null;
  resolution_note: string | null;
  resolved_at: string | null;
}

// ── Public result types ─────────────────────────────────────────────────────

export interface ProviderHealth {
  snapshot: ProviderSnapshot;
  score: HealthScoreResult;
  /** Primary /go slug + destination for diagnostic deep links */
  slug: string;
  destinationUrl: string;
}

export interface AttributionHealthData {
  providers: ProviderHealth[];
  incidents: IncidentRow[];
  unmatchedCtaProviders: string[];
  fetchedAt: string;
  error?: string;
}

export interface WatchdogRunResult {
  ok: boolean;
  dryRun: boolean;
  skipped?: boolean;
  providersChecked: number;
  incidentsOpened: number;
  incidentsResolved: number;
  alertsSent: number;
  unmatchedCtaProviders: string[];
  candidates: Array<{
    provider: string;
    incidentType: IncidentType;
    healthScore: number | null;
    revenueRisk: number;
    suppressed: boolean;
    suppressedReason?: string;
  }>;
  /** dryRun only: per-provider snapshot summary for verification */
  providers?: Array<{
    provider: string;
    network: string | null;
    trackingStatus: string | null;
    band: string;
    score: number | null;
    lifetimeClicks: number;
    clicks30d: number;
    clicksSinceLastEvent: number;
    lastEventAt: string | null;
    windowDays: number;
  }>;
  errors: string[];
}

// ── Settings ────────────────────────────────────────────────────────────────

interface WatchdogSettings extends WatchdogThresholds {
  enabled: boolean;
  baselineDays: number;
  recentDays: number;
  ignoreSnoozeDays: number;
}

async function loadWatchdogSettings(
  supabase: ReturnType<typeof createServiceClient>,
): Promise<WatchdogSettings> {
  const keys = [
    'watchdog_enabled',
    'watchdog_min_clicks_incident',
    'watchdog_min_clicks_score',
    'watchdog_assumed_baseline_cr',
    'watchdog_baseline_days',
    'watchdog_recent_days',
    'watchdog_ignore_snooze_days',
  ];

  const { data } = await supabase.from('system_settings').select('key, value').in('key', keys);

  const map = new Map<string, string>();
  for (const row of data ?? []) map.set(row.key as string, row.value as string);

  return {
    enabled: (map.get('watchdog_enabled') ?? 'true') === 'true',
    minClicksIncident: parseInt(map.get('watchdog_min_clicks_incident') ?? '50', 10),
    minClicksScore: parseInt(map.get('watchdog_min_clicks_score') ?? '20', 10),
    assumedBaselineCr: parseFloat(map.get('watchdog_assumed_baseline_cr') ?? '0.005'),
    baselineDays: parseInt(map.get('watchdog_baseline_days') ?? '180', 10),
    recentDays: parseInt(map.get('watchdog_recent_days') ?? '30', 10),
    ignoreSnoozeDays: parseInt(map.get('watchdog_ignore_snooze_days') ?? '30', 10),
    globalEpc: null, // filled after aggregation
  };
}

// ── Audit helpers (duplicated from auto-executor.ts — they are not exported
//    there, and extracting them would touch the autonomous system) ──────────

async function startAudit(supabase: ReturnType<typeof createServiceClient>, jobName: string) {
  try {
    const { data } = await supabase
      .from('cron_run_audit')
      .insert({ job_name: jobName, status: 'running' })
      .select('id')
      .single();
    return (data?.id as string) ?? null;
  } catch {
    return null;
  }
}

async function finishAudit(
  supabase: ReturnType<typeof createServiceClient>,
  auditId: string | null,
  status: 'success' | 'error',
  startTime: number,
  processedCount: number,
  errorMessage?: string,
  metadata?: Record<string, unknown>,
) {
  if (!auditId) return;
  await supabase
    .from('cron_run_audit')
    .update({
      status,
      finished_at: new Date().toISOString(),
      duration_ms: Date.now() - startTime,
      processed_count: processedCount,
      error_message: errorMessage ?? null,
      metadata: metadata ?? {},
    })
    .eq('id', auditId);
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const ROW_CAP = 100_000;
const NEGATIVE_EVENT_TYPES = new Set(['rejected', 'reversed']);

function norm(name: string): string {
  return name.toLowerCase().trim();
}

/** Supabase/Cloudflare errors can carry whole HTML pages — keep messages short. */
function shortError(message: string): string {
  const clean = message.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return clean.length > 200 ? `${clean.slice(0, 197)}…` : clean;
}

function isMissingRelation(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return (
    error.code === '42P01' ||
    error.code === 'PGRST204' ||
    (error.message ?? '').includes('does not exist') ||
    (error.message ?? '').includes('schema cache')
  );
}

// ── Snapshot assembly ───────────────────────────────────────────────────────

interface GatherResult {
  providers: ProviderHealth[];
  incidents: IncidentRow[];
  unmatchedCtaProviders: string[];
  /** Per provider: latest activity timestamps for incident-specific auto-resolve */
  activity: Map<
    string,
    { lastClickAt: string | null; lastEventAt: string | null; lastRevenueAt: string | null }
  >;
  settings: WatchdogSettings;
}

async function gatherProviderData(
  supabase: ReturnType<typeof createServiceClient>,
  settings: WatchdogSettings,
  now: Date,
): Promise<GatherResult> {
  const recentMs = settings.recentDays * 24 * 60 * 60 * 1000;
  const baselineMs = settings.baselineDays * 24 * 60 * 60 * 1000;
  const recentCutoff = new Date(now.getTime() - recentMs).toISOString();

  // 1) Links — expected_conversion_days may not exist until the migration is
  //    applied; degrade gracefully (same defensive style as alert-delivery).
  const LINK_COLS =
    'id, slug, partner_name, destination_url, category, market, commission_value, active, network, tracking_status, postback_supported';
  let links: LinkRow[] = [];
  {
    const withCol = await supabase
      .from('affiliate_links')
      .select(`${LINK_COLS}, expected_conversion_days`)
      .eq('active', true);
    if (withCol.error) {
      const withoutCol = await supabase.from('affiliate_links').select(LINK_COLS).eq('active', true);
      if (withoutCol.error) throw new Error(`affiliate_links: ${shortError(withoutCol.error.message)}`);
      links = (withoutCol.data as unknown as LinkRow[]).map((l) => ({
        ...l,
        expected_conversion_days: null,
      }));
    } else {
      links = withCol.data as unknown as LinkRow[];
    }
  }

  // 2) Raw rows for in-memory aggregation
  const [clicksRes, eventsRes, convRes, connRes] = await Promise.all([
    supabase
      .from('link_clicks')
      .select('link_id, click_id, clicked_at')
      .order('clicked_at', { ascending: true })
      .limit(ROW_CAP),
    supabase
      .from('conversion_events')
      .select('link_id, event_type, event_value, occurred_at, received_at')
      .limit(ROW_CAP),
    supabase
      .from('conversions')
      .select('link_id, commission_earned, status, converted_at')
      .limit(ROW_CAP),
    supabase.from('api_connectors').select('name, is_enabled, last_sync_at, last_sync_status'),
  ]);

  if (clicksRes.error) throw new Error(`link_clicks: ${shortError(clicksRes.error.message)}`);
  if (eventsRes.error) throw new Error(`conversion_events: ${shortError(eventsRes.error.message)}`);

  const clicks = (clicksRes.data ?? []) as unknown as ClickRow[];
  const events = (eventsRes.data ?? []) as unknown as EventRow[];
  const conversions = (convRes.error ? [] : ((convRes.data ?? []) as unknown as ConversionRow[]));
  const connectors = (connRes.error ? [] : ((connRes.data ?? []) as unknown as ConnectorRow[]));

  // 3) CTA clicks (30d) — display names, matched conservatively by name
  let ctaCounts = new Map<string, number>();
  {
    const ctaRes = await supabase
      .from('cta_analytics')
      .select('provider')
      .gte('clicked_at', recentCutoff)
      .limit(ROW_CAP);
    if (!ctaRes.error) {
      ctaCounts = new Map();
      for (const row of (ctaRes.data ?? []) as Array<{ provider: string }>) {
        const key = norm(row.provider ?? '');
        if (!key) continue;
        ctaCounts.set(key, (ctaCounts.get(key) ?? 0) + 1);
      }
    }
  }

  // 4) Incidents (table may not exist before migration — tolerate)
  let incidents: IncidentRow[] = [];
  {
    const incRes = await supabase
      .from('attribution_incidents')
      .select(
        'id, provider, network, market, category, incident_type, status, detected_at, clicks_since_last_conversion, last_conversion_at, health_score, suspected_cause, revenue_risk_estimate, ignored_until, resolution_note, resolved_at',
      )
      .order('detected_at', { ascending: false })
      .limit(200);
    if (incRes.error) {
      if (!isMissingRelation(incRes.error)) {
        logger.warn('[attribution-watchdog] incidents query failed', {
          error: incRes.error.message,
        });
      }
    } else {
      incidents = (incRes.data ?? []) as unknown as IncidentRow[];
    }
  }

  // ── Group links by provider (partner_name) ──
  const byProvider = new Map<string, LinkRow[]>();
  for (const link of links) {
    const key = link.partner_name;
    const arr = byProvider.get(key) ?? [];
    arr.push(link);
    byProvider.set(key, arr);
  }

  const linkToProvider = new Map<string, string>();
  for (const [provider, provLinks] of byProvider) {
    for (const l of provLinks) linkToProvider.set(l.id, provider);
  }

  // ── Per-provider aggregation ──
  interface Agg {
    lifetimeClicks: number;
    clicks30d: number;
    clicks180d: number;
    clickId30d: number;
    firstClickAt: string | null;
    lastClickAt: string | null;
    clickTimes: number[]; // sorted ascending (ms)
    lastEventAt: string | null;
    events30d: number;
    events180d: number;
    eventRevenue180d: number;
    lastRevenueAt: string | null;
    convRevenue180d: number;
  }

  const aggs = new Map<string, Agg>();
  const getAgg = (provider: string): Agg => {
    let a = aggs.get(provider);
    if (!a) {
      a = {
        lifetimeClicks: 0,
        clicks30d: 0,
        clicks180d: 0,
        clickId30d: 0,
        firstClickAt: null,
        lastClickAt: null,
        clickTimes: [],
        lastEventAt: null,
        events30d: 0,
        events180d: 0,
        eventRevenue180d: 0,
        lastRevenueAt: null,
        convRevenue180d: 0,
      };
      aggs.set(provider, a);
    }
    return a;
  };

  const recentMsCutoff = now.getTime() - recentMs;
  const baselineMsCutoff = now.getTime() - baselineMs;

  for (const c of clicks) {
    const provider = linkToProvider.get(c.link_id);
    if (!provider) continue;
    const a = getAgg(provider);
    const t = new Date(c.clicked_at).getTime();
    if (Number.isNaN(t)) continue;
    a.lifetimeClicks++;
    a.clickTimes.push(t);
    if (!a.firstClickAt) a.firstClickAt = c.clicked_at; // rows are sorted ascending
    a.lastClickAt = c.clicked_at;
    if (t >= recentMsCutoff) {
      a.clicks30d++;
      if (c.click_id) a.clickId30d++;
    }
    if (t >= baselineMsCutoff) a.clicks180d++;
  }

  for (const e of events) {
    const provider = e.link_id ? linkToProvider.get(e.link_id) : undefined;
    if (!provider) continue;
    const a = getAgg(provider);
    const iso = e.occurred_at ?? e.received_at;
    const t = new Date(iso).getTime();
    if (Number.isNaN(t)) continue;
    if (!a.lastEventAt || t > new Date(a.lastEventAt).getTime()) a.lastEventAt = iso;
    const isNegative = NEGATIVE_EVENT_TYPES.has(e.event_type);
    if (t >= recentMsCutoff && !isNegative) a.events30d++;
    if (t >= baselineMsCutoff && !isNegative) {
      a.events180d++;
      if ((e.event_value ?? 0) > 0) {
        a.eventRevenue180d += e.event_value ?? 0;
        if (!a.lastRevenueAt || t > new Date(a.lastRevenueAt).getTime()) a.lastRevenueAt = iso;
      }
    }
  }

  for (const c of conversions) {
    const provider = linkToProvider.get(c.link_id);
    if (!provider) continue;
    if (c.status !== 'approved') continue;
    const a = getAgg(provider);
    const t = new Date(c.converted_at).getTime();
    if (Number.isNaN(t)) continue;
    if (t >= baselineMsCutoff) a.convRevenue180d += c.commission_earned ?? 0;
    if (!a.lastRevenueAt || t > new Date(a.lastRevenueAt).getTime()) a.lastRevenueAt = c.converted_at;
  }

  // ── Global EPC (site-wide fallback for risk estimation) ──
  let totalRevenue180d = 0;
  let totalClicks180d = 0;
  for (const a of aggs.values()) {
    totalRevenue180d += Math.max(a.eventRevenue180d, a.convRevenue180d);
    totalClicks180d += a.clicks180d;
  }
  const globalEpc = totalRevenue180d > 0 && totalClicks180d > 0 ? totalRevenue180d / totalClicks180d : null;
  settings.globalEpc = globalEpc;

  // ── CTA matching (conservative): exactly one provider per CTA name ──
  const providerByNorm = new Map<string, string[]>();
  for (const provider of byProvider.keys()) {
    const key = norm(provider);
    const arr = providerByNorm.get(key) ?? [];
    arr.push(provider);
    providerByNorm.set(key, arr);
  }

  const ctaByProvider = new Map<string, number>();
  const unmatchedCtaProviders: string[] = [];
  for (const [ctaName, count] of ctaCounts) {
    const matches = providerByNorm.get(ctaName);
    if (matches && matches.length === 1) {
      ctaByProvider.set(matches[0], (ctaByProvider.get(matches[0]) ?? 0) + count);
    } else {
      unmatchedCtaProviders.push(ctaName);
    }
  }

  // ── Connector lookup (normalized contains-match on name) ──
  const findConnector = (network: string | null): ConnectorRow | null => {
    if (!network || network === 'direct') return null;
    const n = norm(network);
    return (
      connectors.find((c) => norm(c.name) === n) ??
      connectors.find((c) => norm(c.name).includes(n) || n.includes(norm(c.name))) ??
      null
    );
  };

  // ── Build snapshots + scores ──
  const providers: ProviderHealth[] = [];
  const activity: GatherResult['activity'] = new Map();

  for (const [provider, provLinks] of byProvider) {
    const a = getAgg(provider);
    const primary = provLinks[0];

    const lastEventMs = a.lastEventAt ? new Date(a.lastEventAt).getTime() : null;
    const clicksSinceLastEvent =
      lastEventMs === null
        ? a.lifetimeClicks
        : a.clickTimes.filter((t) => t > lastEventMs).length;

    const connector = findConnector(primary.network);
    const connectorSyncOk = connector
      ? connector.last_sync_status === 'success' &&
        !!connector.last_sync_at &&
        now.getTime() - new Date(connector.last_sync_at).getTime() < 48 * 60 * 60 * 1000
      : null;

    const ctaClicks = ctaByProvider.get(provider);

    const snapshot: ProviderSnapshot = {
      partnerName: provider,
      network: primary.network,
      market: primary.market,
      category: primary.category,
      active: provLinks.some((l) => l.active),
      trackingStatus: primary.tracking_status,
      postbackSupported: provLinks.some((l) => l.postback_supported === true),
      expectedConversionDays: primary.expected_conversion_days,
      commissionValue: Math.max(...provLinks.map((l) => l.commission_value ?? 0), 0),
      lifetimeClicks: a.lifetimeClicks,
      clicks30d: a.clicks30d,
      clicks180d: a.clicks180d,
      clickIdShare30d: a.clicks30d > 0 ? a.clickId30d / a.clicks30d : null,
      firstClickAt: a.firstClickAt,
      clicksSinceLastEvent,
      lastEventAt: a.lastEventAt,
      conversions30d: a.events30d,
      conversions180d: a.events180d,
      revenue180d: Math.max(a.eventRevenue180d, a.convRevenue180d),
      connectorConfigured: connector !== null,
      connectorSyncOk,
      ctaClicks30d: ctaClicks && ctaClicks > 0 ? ctaClicks : null,
      goClicks30d: a.clicks30d,
    };

    providers.push({
      snapshot,
      score: computeHealthScore(snapshot, settings, now),
      slug: primary.slug,
      destinationUrl: primary.destination_url,
    });

    activity.set(provider, {
      lastClickAt: a.lastClickAt,
      lastEventAt: a.lastEventAt,
      lastRevenueAt: a.lastRevenueAt,
    });
  }

  // Worst first: critical → warning → healthy → n/a, then by score ascending
  const bandRank = { critical: 0, warning: 1, healthy: 2, na: 3 } as const;
  providers.sort(
    (x, y) =>
      bandRank[x.score.band] - bandRank[y.score.band] ||
      (x.score.score ?? 101) - (y.score.score ?? 101),
  );

  return { providers, incidents, unmatchedCtaProviders, activity, settings };
}

// ── Widget read ─────────────────────────────────────────────────────────────

export async function getAttributionHealth(): Promise<AttributionHealthData> {
  const now = new Date();
  try {
    const supabase = createServiceClient();
    const settings = await loadWatchdogSettings(supabase);
    const { providers, incidents, unmatchedCtaProviders } = await gatherProviderData(
      supabase,
      settings,
      now,
    );
    return { providers, incidents, unmatchedCtaProviders, fetchedAt: now.toISOString() };
  } catch (err) {
    // Surface the failure — an empty table must not look like "all healthy"
    // (same principle as the GSC strict fix).
    logger.error('[attribution-watchdog] health read failed', { error: String(err) });
    return {
      providers: [],
      incidents: [],
      unmatchedCtaProviders: [],
      fetchedAt: now.toISOString(),
      error: err instanceof Error ? shortError(err.message) : 'Attribution health read failed',
    };
  }
}

// ── Incident-specific auto-resolve rules ────────────────────────────────────

function incidentResolvedBy(
  incident: IncidentRow,
  act: { lastClickAt: string | null; lastEventAt: string | null; lastRevenueAt: string | null },
): boolean {
  const after = (iso: string | null) =>
    !!iso && new Date(iso).getTime() > new Date(incident.detected_at).getTime();

  switch (incident.incident_type) {
    case 'cta_no_go':
      return after(act.lastClickAt); // /go clicks flowing again
    case 'clicks_no_postback':
      return after(act.lastEventAt); // postback signal arrived
    case 'postback_no_revenue':
      return after(act.lastRevenueAt); // only actual revenue resolves this
    case 'conversion_stalled':
      return after(act.lastEventAt);
    default:
      return false;
  }
}

// ── Cron core ───────────────────────────────────────────────────────────────

export async function runAttributionWatchdog(opts?: {
  dryRun?: boolean;
}): Promise<WatchdogRunResult> {
  const dryRun = opts?.dryRun ?? false;
  const now = new Date();
  const startTime = Date.now();
  const errors: string[] = [];

  const supabase = createServiceClient();
  const settings = await loadWatchdogSettings(supabase);

  if (!settings.enabled) {
    return {
      ok: true,
      dryRun,
      skipped: true,
      providersChecked: 0,
      incidentsOpened: 0,
      incidentsResolved: 0,
      alertsSent: 0,
      unmatchedCtaProviders: [],
      candidates: [],
      errors,
    };
  }

  const auditId = dryRun ? null : await startAudit(supabase, 'attribution-watchdog');

  try {
    const { providers, incidents, unmatchedCtaProviders, activity } = await gatherProviderData(
      supabase,
      settings,
      now,
    );

    let incidentsOpened = 0;
    let incidentsResolved = 0;
    let alertsSent = 0;
    const candidates: WatchdogRunResult['candidates'] = [];

    // ── 1) Incident-specific auto-resolve ──
    const liveIncidents = incidents.filter((i) =>
      ['open', 'confirmed', 'ignored'].includes(i.status),
    );
    for (const incident of liveIncidents) {
      const act = activity.get(incident.provider);
      if (!act || !incidentResolvedBy(incident, act)) continue;

      incidentsResolved++;
      if (!dryRun) {
        const { error } = await supabase
          .from('attribution_incidents')
          .update({
            status: 'resolved',
            resolved_at: now.toISOString(),
            resolution_note: 'auto: Datenfluss wieder aktiv',
            updated_at: now.toISOString(),
          })
          .eq('id', incident.id);
        if (error) {
          errors.push(`resolve ${incident.provider}: ${error.message}`);
          continue;
        }
        if (incident.status !== 'ignored') {
          await sendAlert({
            type: 'attribution_watchdog',
            severity: 'success',
            title: `Attribution wiederhergestellt: ${incident.provider}`,
            message: `Für ${incident.provider} sind wieder Daten eingetroffen (${incident.incident_type}). Vorfall automatisch geschlossen.`,
            source: 'attribution-watchdog',
            link_url: '/dashboard/revenue#attribution-watchdog',
            metadata: { provider: incident.provider, incident_type: incident.incident_type },
          });
          alertsSent++;
        }
      }
    }

    // ── 2) Stage checks → new incidents ──
    for (const { snapshot, score } of providers) {
      const candidate = classifyStageFailure(snapshot, settings, now);
      if (!candidate) continue;

      // Suppression: live incident of the same type, or snoozed ignore
      const existing = liveIncidents.find(
        (i) => i.provider === snapshot.partnerName && i.incident_type === candidate.type,
      );
      let suppressedReason: string | undefined;
      if (existing) {
        if (existing.status === 'ignored') {
          const snoozed =
            existing.ignored_until && new Date(existing.ignored_until).getTime() > now.getTime();
          if (snoozed) suppressedReason = `ignoriert bis ${existing.ignored_until}`;
        } else {
          suppressedReason = `bereits ${existing.status}`;
        }
      }

      const risk = estimateRevenueRisk(snapshot, settings);
      candidates.push({
        provider: snapshot.partnerName,
        incidentType: candidate.type,
        healthScore: score.score,
        revenueRisk: risk.amount,
        suppressed: !!suppressedReason,
        suppressedReason,
      });
      if (suppressedReason) continue;

      incidentsOpened++;
      if (dryRun) continue;

      const W = resolveExpectedWindow({
        expectedConversionDays: snapshot.expectedConversionDays,
        category: snapshot.category,
      });

      const { error: insertError } = await supabase.from('attribution_incidents').insert({
        provider: snapshot.partnerName,
        network: snapshot.network,
        market: snapshot.market,
        category: snapshot.category,
        incident_type: candidate.type,
        status: 'open',
        detected_at: now.toISOString(),
        clicks_since_last_conversion: snapshot.clicksSinceLastEvent,
        last_conversion_at: snapshot.lastEventAt,
        health_score: score.score,
        suspected_cause: candidate.causeLabel,
        revenue_risk_estimate: risk.amount,
        metadata: {
          expected_window_days: W,
          risk_method: risk.method,
          clicks_30d: snapshot.clicks30d,
          conversions_180d: snapshot.conversions180d,
          tracking_status: snapshot.trackingStatus,
        },
      });

      if (insertError) {
        // 23505 = another run already inserted (unique index race) — fine.
        if (insertError.code !== '23505') {
          errors.push(`insert ${snapshot.partnerName}: ${insertError.message}`);
        }
        incidentsOpened--;
        continue;
      }

      const lastConvText = snapshot.lastEventAt
        ? `am ${new Date(snapshot.lastEventAt).toLocaleDateString('de-DE')}`
        : '(noch nie konvertiert)';
      await sendAlertWithActions(
        {
          type: 'attribution_watchdog',
          severity: score.band === 'critical' ? 'critical' : 'warning',
          title: `Attribution-Ausfall vermutet: ${snapshot.partnerName}`,
          message:
            `${snapshot.partnerName} (${snapshot.network ?? 'direkt'}): ${snapshot.clicksSinceLastEvent} Klicks seit letzter Conversion ${lastConvText} — erwartet innerhalb von ${W} Tagen. ` +
            `Verdacht: ${candidate.causeLabel}. Geschätztes Umsatzrisiko: ~$${risk.amount.toFixed(0)}. ` +
            `Health Score: ${score.score ?? 'k. A.'}/100.`,
          source: 'attribution-watchdog',
          link_url: '/dashboard/revenue#attribution-watchdog',
          metadata: {
            provider: snapshot.partnerName,
            incident_type: candidate.type,
            health_score: score.score,
            revenue_risk: risk.amount,
          },
        },
        [
          { label: 'Watchdog öffnen', href: '/dashboard/revenue#attribution-watchdog' },
          { label: 'Funnel prüfen', href: '/dashboard/funnel' },
          { label: 'Links verwalten', href: '/dashboard/links' },
        ],
      );
      alertsSent++;
    }

    if (!dryRun) {
      await finishAudit(supabase, auditId, 'success', startTime, providers.length, undefined, {
        incidents_opened: incidentsOpened,
        incidents_resolved: incidentsResolved,
        alerts_sent: alertsSent,
        unmatched_cta_providers: unmatchedCtaProviders,
        candidates_suppressed: candidates.filter((c) => c.suppressed).length,
      });
    }

    return {
      ok: errors.length === 0,
      dryRun,
      providersChecked: providers.length,
      incidentsOpened,
      incidentsResolved,
      alertsSent,
      unmatchedCtaProviders,
      candidates,
      ...(dryRun && {
        providers: providers.map((p) => ({
          provider: p.snapshot.partnerName,
          network: p.snapshot.network,
          trackingStatus: p.snapshot.trackingStatus,
          band: p.score.band,
          score: p.score.score,
          lifetimeClicks: p.snapshot.lifetimeClicks,
          clicks30d: p.snapshot.clicks30d,
          clicksSinceLastEvent: p.snapshot.clicksSinceLastEvent,
          lastEventAt: p.snapshot.lastEventAt,
          windowDays: p.score.expectedWindowDays,
        })),
      }),
      errors,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    logger.error('[attribution-watchdog] run failed', { error: msg });
    if (!dryRun) await finishAudit(supabase, auditId, 'error', startTime, 0, msg);
    return {
      ok: false,
      dryRun,
      providersChecked: 0,
      incidentsOpened: 0,
      incidentsResolved: 0,
      alertsSent: 0,
      unmatchedCtaProviders: [],
      candidates: [],
      errors: [msg],
    };
  }
}

// ── Incident status updates (widget buttons) ────────────────────────────────

export async function updateIncidentStatus(
  id: string,
  status: 'confirmed' | 'resolved' | 'ignored',
  note?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServiceClient();
    const settings = await loadWatchdogSettings(supabase);
    const now = new Date();

    const update: Record<string, unknown> = {
      status,
      updated_at: now.toISOString(),
    };
    if (note) update.resolution_note = note;
    if (status === 'resolved') update.resolved_at = now.toISOString();
    if (status === 'ignored') {
      update.ignored_until = new Date(
        now.getTime() + settings.ignoreSnoozeDays * 24 * 60 * 60 * 1000,
      ).toISOString();
    }

    const { error } = await supabase.from('attribution_incidents').update(update).eq('id', id);
    if (error) {
      logger.error('[attribution-watchdog] status update failed', { error: error.message });
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/revenue');
    return { success: true };
  } catch (err) {
    logger.error('[attribution-watchdog] status update failed', err);
    return { success: false, error: 'Internal error' };
  }
}
