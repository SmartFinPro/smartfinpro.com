// lib/attribution/health-score.ts
// ============================================================================
// Attribution Watchdog — pure scoring & classification (NO IO, no supabase,
// no 'use server'). All decision logic lives here so it is unit-testable:
// dev reads the PROD database, seeding test scenarios is not possible.
//
// Consumers: lib/actions/attribution-watchdog.ts (assembles ProviderSnapshot
// from DB), components/dashboard/attribution-health-widget.tsx (labels).
// ============================================================================

// ── Expected conversion window ──────────────────────────────────────────────

/** Category defaults in days; per-provider override via
 *  affiliate_links.expected_conversion_days wins. */
export const CATEGORY_CONVERSION_WINDOWS: Record<string, number> = {
  'gold-investing': 45,
  'debt-relief': 30,
  'credit-repair': 30,
  'business-banking': 21,
  trading: 14,
  forex: 14,
  'personal-finance': 14,
  'ai-tools': 7,
  cybersecurity: 7,
  'credit-score': 7,
};

export const DEFAULT_CONVERSION_WINDOW_DAYS = 14;

export function resolveExpectedWindow(link: {
  expectedConversionDays: number | null;
  category: string | null;
}): number {
  if (link.expectedConversionDays && link.expectedConversionDays > 0) {
    return link.expectedConversionDays;
  }
  if (link.category && CATEGORY_CONVERSION_WINDOWS[link.category]) {
    return CATEGORY_CONVERSION_WINDOWS[link.category];
  }
  return DEFAULT_CONVERSION_WINDOW_DAYS;
}

// ── Types ───────────────────────────────────────────────────────────────────

export type HealthBand = 'healthy' | 'warning' | 'critical' | 'na';

export type IncidentType =
  | 'cta_no_go'
  | 'clicks_no_postback'
  | 'postback_no_revenue'
  | 'conversion_stalled';

export type IncidentStatus = 'open' | 'confirmed' | 'resolved' | 'ignored';

/** One provider's aggregated metrics, assembled by the action module. */
export interface ProviderSnapshot {
  partnerName: string;
  network: string | null;
  market: string | null;
  category: string | null;
  active: boolean;
  /** affiliate_links.tracking_status: verified | dashboard_only | unverified | inactive */
  trackingStatus: string | null;
  postbackSupported: boolean;
  expectedConversionDays: number | null;
  /** CPA amount from affiliate_links.commission_value (max across links) */
  commissionValue: number;
  // Click metrics (link_clicks)
  lifetimeClicks: number;
  clicks30d: number;
  clicks180d: number;
  /** Share of 30d clicks that carry a click_id (0..1); null when 0 clicks in 30d */
  clickIdShare30d: number | null;
  firstClickAt: string | null;
  /** Clicks recorded after the last conversion signal (lifetime clicks if never converted) */
  clicksSinceLastEvent: number;
  // Conversion metrics (conversion_events / conversions)
  /** max(conversion_events.occurred_at) — ANY funnel signal counts as data flow */
  lastEventAt: string | null;
  conversions30d: number;
  conversions180d: number;
  /** Sum of positive event values / approved commissions in 180d */
  revenue180d: number;
  // Network sync (api_connectors)
  connectorConfigured: boolean;
  /** last_sync_status==='success' AND last_sync_at < 48h; null when no connector */
  connectorSyncOk: boolean | null;
  // CTA stage (cta_analytics, display-name matched)
  /** null = no confident 1:1 name match — never raises cta_no_go */
  ctaClicks30d: number | null;
  goClicks30d: number;
}

export interface WatchdogThresholds {
  minClicksIncident: number;
  minClicksScore: number;
  assumedBaselineCr: number;
  /** Site-wide EPC fallback for providers with own history gaps; null if unknown */
  globalEpc: number | null;
}

export const DEFAULT_THRESHOLDS: WatchdogThresholds = {
  minClicksIncident: 50,
  minClicksScore: 20,
  assumedBaselineCr: 0.005,
  globalEpc: null,
};

export interface ComponentResult {
  key: 'config' | 'recency' | 'clicks_since' | 'cr_baseline' | 'subid' | 'sync' | 'active';
  label: string;
  earned: number;
  max: number;
  applicable: boolean;
  reason: string;
}

export interface HealthScoreResult {
  /** 0–100, or null when traffic is below minClicksScore (band 'na') */
  score: number | null;
  band: HealthBand;
  expectedWindowDays: number;
  components: ComponentResult[];
}

export interface IncidentCandidate {
  type: IncidentType;
  causeLabel: string;
}

export interface RevenueRiskEstimate {
  amount: number;
  method: 'epc' | 'commission_x_cr' | 'global_epc';
}

// ── German labels (shared between widget + alerts) ─────────────────────────

export const INCIDENT_CAUSE_LABELS: Record<IncidentType, string> = {
  cta_no_go:
    'CTA-Klicks kommen an, aber keine /go-Klicks — Routing oder Link prüfen',
  clicks_no_postback:
    'Klicks laufen auf, aber keine Postbacks — SubID-/Postback-Konfiguration prüfen',
  postback_no_revenue: 'Postbacks kommen an, aber ohne Umsatzwerte',
  conversion_stalled: 'Keine Conversion mehr trotz laufendem Traffic',
};

export const BAND_LABELS: Record<HealthBand, string> = {
  healthy: 'Gesund',
  warning: 'Beobachten',
  critical: 'Kritisch',
  na: 'k. A.',
};

const COMPONENT_LABELS: Record<ComponentResult['key'], string> = {
  config: 'Postback/Tracking-Konfiguration',
  recency: 'Letzte Conversion',
  clicks_since: 'Klicks seit letzter Conversion',
  cr_baseline: 'Conversion-Rate vs. Baseline',
  subid: 'SubID-Übergabe (click_id)',
  sync: 'Netzwerk-Sync',
  active: 'Provider aktiv',
};

// ── Helpers ─────────────────────────────────────────────────────────────────

const DAY_MS = 24 * 60 * 60 * 1000;

function daysSince(iso: string | null, now: Date): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return (now.getTime() - t) / DAY_MS;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// ── Health score ────────────────────────────────────────────────────────────

export function computeHealthScore(
  snap: ProviderSnapshot,
  thresholds: WatchdogThresholds,
  now: Date,
): HealthScoreResult {
  const W = resolveExpectedWindow({
    expectedConversionDays: snap.expectedConversionDays,
    category: snap.category,
  });

  const components: ComponentResult[] = [];
  const add = (
    key: ComponentResult['key'],
    max: number,
    applicable: boolean,
    earned: number,
    reason: string,
  ) => {
    components.push({ key, label: COMPONENT_LABELS[key], max, applicable, earned: applicable ? earned : 0, reason });
  };

  // 1) Postback/tracking config (max 20, always applicable)
  {
    let earned = 0;
    let reason = 'Kein Tracking konfiguriert';
    if (snap.trackingStatus === 'verified') {
      earned = 20;
      reason = 'Tracking verifiziert';
    } else if (snap.trackingStatus === 'dashboard_only') {
      earned = 10;
      reason = 'Nur Dashboard-Attribution (kein S2S)';
    } else if (snap.postbackSupported) {
      earned = 5;
      reason = 'Postback möglich, aber nicht verifiziert';
    }
    add('config', 20, true, earned, reason);
  }

  // 2) Last conversion recency (max 25)
  {
    const sinceEvent = daysSince(snap.lastEventAt, now);
    const sinceFirstClick = daysSince(snap.firstClickAt, now);

    if (sinceEvent === null && (sinceFirstClick === null || sinceFirstClick < W)) {
      // Never converted, but still inside the grace window (or no traffic yet)
      add('recency', 25, false, 0, `Noch im Conversion-Fenster (${W} Tage) — keine Bewertung`);
    } else {
      const days = sinceEvent ?? sinceFirstClick ?? 0;
      let earned = 0;
      if (days <= W) earned = 25;
      else if (days <= 2 * W) earned = 15;
      else if (days <= 4 * W) earned = 5;
      const basis = sinceEvent === null ? 'seit erstem Klick (nie konvertiert)' : 'seit letzter Conversion';
      add('recency', 25, true, earned, `${Math.round(days)} Tage ${basis}, Fenster ${W} Tage`);
    }
  }

  // 3) Clicks since last conversion vs expected clicks-per-conversion (max 20)
  {
    const baselineCr = snap.clicks180d > 0 && snap.conversions180d > 0
      ? snap.conversions180d / snap.clicks180d
      : null;
    if (baselineCr === null) {
      add('clicks_since', 20, false, 0, 'Keine historische Conversion-Baseline');
    } else {
      const expectedClicksPerConv = 1 / baselineCr;
      const ratio = snap.clicksSinceLastEvent / expectedClicksPerConv;
      let earned = 0;
      if (ratio <= 1.5) earned = 20;
      else if (ratio <= 3) earned = 10;
      else if (ratio <= 5) earned = 5;
      add(
        'clicks_since',
        20,
        true,
        earned,
        `${snap.clicksSinceLastEvent} Klicks seit letzter Conversion, erwartet ~${Math.round(expectedClicksPerConv)}/Conversion`,
      );
    }
  }

  // 4) CR(30d) vs CR(180d) baseline (max 15) — needs a stable baseline
  {
    if (snap.conversions180d < 10 || snap.clicks30d === 0 || snap.clicks180d === 0) {
      add('cr_baseline', 15, false, 0, 'Baseline instabil (<10 Conversions in 180 Tagen)');
    } else {
      const cr30 = snap.conversions30d / snap.clicks30d;
      const cr180 = snap.conversions180d / snap.clicks180d;
      let earned = 0;
      if (cr180 === 0 || cr30 >= 0.6 * cr180) earned = 15;
      else if (cr30 >= 0.3 * cr180) earned = 8;
      add(
        'cr_baseline',
        15,
        true,
        earned,
        `CR 30d ${(cr30 * 100).toFixed(2)}% vs. 180d ${(cr180 * 100).toFixed(2)}%`,
      );
    }
  }

  // 5) SubID/click_id sanity (max 10)
  {
    if (snap.clickIdShare30d === null) {
      add('subid', 10, false, 0, 'Keine Klicks in den letzten 30 Tagen');
    } else {
      let earned = 0;
      if (snap.clickIdShare30d >= 0.95) earned = 10;
      else if (snap.clickIdShare30d >= 0.8) earned = 5;
      add('subid', 10, true, earned, `${Math.round(snap.clickIdShare30d * 100)}% der Klicks mit click_id`);
    }
  }

  // 6) Network sync freshness (max 5) — pull-based networks only
  {
    if (!snap.connectorConfigured || snap.connectorSyncOk === null) {
      add('sync', 5, false, 0, 'Kein Netzwerk-Connector (Postback ist push-basiert)');
    } else {
      add(
        'sync',
        5,
        true,
        snap.connectorSyncOk ? 5 : 0,
        snap.connectorSyncOk ? 'Letzter Sync erfolgreich (<48h)' : 'Letzter Sync fehlgeschlagen oder >48h her',
      );
    }
  }

  // 7) Provider active (max 5, always applicable)
  {
    const ok = snap.active && snap.trackingStatus !== 'inactive';
    add('active', 5, true, ok ? 5 : 0, ok ? 'Aktiv' : 'Deaktiviert');
  }

  // ── Aggregate ──
  if (snap.lifetimeClicks < thresholds.minClicksScore) {
    return {
      score: null,
      band: 'na',
      expectedWindowDays: W,
      components,
    };
  }

  const applicableMax = components.filter((c) => c.applicable).reduce((a, c) => a + c.max, 0);
  const earned = components.reduce((a, c) => a + c.earned, 0);
  const score = applicableMax > 0 ? Math.round((earned / applicableMax) * 100) : null;

  let band: HealthBand = 'na';
  if (score !== null) {
    band = score >= 80 ? 'healthy' : score >= 50 ? 'warning' : 'critical';
  }

  return { score, band, expectedWindowDays: W, components };
}

// ── Silent failure classification ──────────────────────────────────────────

/**
 * At most ONE incident candidate per provider — the most upstream failure
 * wins. Bad performance without a broken stage is NOT an incident.
 */
export function classifyStageFailure(
  snap: ProviderSnapshot,
  thresholds: WatchdogThresholds,
  now: Date,
): IncidentCandidate | null {
  const W = resolveExpectedWindow({
    expectedConversionDays: snap.expectedConversionDays,
    category: snap.category,
  });
  const sinceEvent = daysSince(snap.lastEventAt, now);
  const sinceFirstClick = daysSince(snap.firstClickAt, now);
  const sinceSignal = sinceEvent ?? sinceFirstClick;

  // 1) CTA clicks arrive but /go never fires → routing/link broken.
  //    Only for a confident 1:1 name match (ctaClicks30d !== null).
  if (snap.ctaClicks30d !== null && snap.ctaClicks30d > 0 && snap.goClicks30d === 0) {
    return { type: 'cta_no_go', causeLabel: INCIDENT_CAUSE_LABELS.cta_no_go };
  }

  // 2) Verified tracking, plenty of clicks, no postback signal beyond 2× window.
  if (
    snap.trackingStatus === 'verified' &&
    snap.clicksSinceLastEvent >= thresholds.minClicksIncident &&
    sinceSignal !== null &&
    sinceSignal > 2 * W
  ) {
    return { type: 'clicks_no_postback', causeLabel: INCIDENT_CAUSE_LABELS.clicks_no_postback };
  }

  // 3) Events keep arriving but carry no revenue → sync/mapping problem.
  if (
    sinceEvent !== null &&
    sinceEvent <= 2 * W &&
    snap.conversions180d > 0 &&
    snap.revenue180d === 0
  ) {
    return { type: 'postback_no_revenue', causeLabel: INCIDENT_CAUSE_LABELS.postback_no_revenue };
  }

  // 4) Provider used to convert, traffic continues, signal stopped for >4× window.
  if (sinceEvent !== null && sinceEvent > 4 * W && snap.clicks30d > 0) {
    return { type: 'conversion_stalled', causeLabel: INCIDENT_CAUSE_LABELS.conversion_stalled };
  }

  return null;
}

// ── Revenue risk ────────────────────────────────────────────────────────────

export function estimateRevenueRisk(
  snap: ProviderSnapshot,
  thresholds: WatchdogThresholds,
): RevenueRiskEstimate {
  const clicks = Math.max(0, snap.clicksSinceLastEvent);

  // Own history first: EPC over the 180d baseline window.
  if (snap.revenue180d > 0 && snap.clicks180d > 0) {
    return { amount: round2(clicks * (snap.revenue180d / snap.clicks180d)), method: 'epc' };
  }

  // Never converted: CPA × assumed baseline CR.
  if (snap.conversions180d === 0 && snap.commissionValue > 0) {
    return {
      amount: round2(clicks * snap.commissionValue * thresholds.assumedBaselineCr),
      method: 'commission_x_cr',
    };
  }

  // Converted before but revenue history unusable → site-wide EPC.
  if (thresholds.globalEpc !== null && thresholds.globalEpc > 0) {
    return { amount: round2(clicks * thresholds.globalEpc), method: 'global_epc' };
  }

  return {
    amount: round2(clicks * snap.commissionValue * thresholds.assumedBaselineCr),
    method: 'commission_x_cr',
  };
}
