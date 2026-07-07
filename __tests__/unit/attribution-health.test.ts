// __tests__/unit/attribution-health.test.ts
// Attribution Watchdog — pure scoring/classification logic.
//
// All watchdog decision logic is unit-tested here because dev reads the
// PROD Supabase: seeding failure scenarios against the real DB is not
// possible. The action module only assembles snapshots; every branch that
// decides "incident or not" lives in lib/attribution/health-score.ts.

import { describe, it, expect } from 'vitest';
import {
  resolveExpectedWindow,
  computeHealthScore,
  classifyStageFailure,
  estimateRevenueRisk,
  DEFAULT_THRESHOLDS,
  DEFAULT_CONVERSION_WINDOW_DAYS,
  type ProviderSnapshot,
  type WatchdogThresholds,
} from '@/lib/attribution/health-score';

const NOW = new Date('2026-07-07T12:00:00Z');

function daysAgo(days: number): string {
  return new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
}

/** A healthy, verified, converting provider as baseline. */
function makeSnapshot(overrides: Partial<ProviderSnapshot> = {}): ProviderSnapshot {
  return {
    partnerName: 'Test Partner',
    network: 'cj',
    market: 'us',
    category: 'trading', // window = 14
    active: true,
    trackingStatus: 'verified',
    postbackSupported: true,
    expectedConversionDays: null,
    commissionValue: 100,
    lifetimeClicks: 500,
    clicks30d: 100,
    clicks180d: 400,
    clickIdShare30d: 1,
    firstClickAt: daysAgo(180),
    clicksSinceLastEvent: 10,
    lastEventAt: daysAgo(5),
    conversions30d: 3,
    conversions180d: 12,
    revenueBearingEvents180d: 10,
    revenue180d: 1200,
    connectorConfigured: true,
    connectorSyncOk: true,
    ctaClicks30d: 80,
    goClicks30d: 100,
    ...overrides,
  };
}

const T: WatchdogThresholds = { ...DEFAULT_THRESHOLDS, globalEpc: 2 };

// ── Window resolution ───────────────────────────────────────────────────────

describe('resolveExpectedWindow', () => {
  it('prefers the per-provider override', () => {
    expect(resolveExpectedWindow({ expectedConversionDays: 60, category: 'trading' })).toBe(60);
  });

  it('falls back to the category default', () => {
    expect(resolveExpectedWindow({ expectedConversionDays: null, category: 'gold-investing' })).toBe(45);
    expect(resolveExpectedWindow({ expectedConversionDays: null, category: 'ai-tools' })).toBe(7);
  });

  it('uses the global default for unknown/missing categories', () => {
    expect(resolveExpectedWindow({ expectedConversionDays: null, category: 'unknown-cat' })).toBe(
      DEFAULT_CONVERSION_WINDOW_DAYS,
    );
    expect(resolveExpectedWindow({ expectedConversionDays: null, category: null })).toBe(
      DEFAULT_CONVERSION_WINDOW_DAYS,
    );
  });
});

// ── Health score ────────────────────────────────────────────────────────────

describe('computeHealthScore', () => {
  it('scores a fully healthy provider ≥ 80 (healthy band)', () => {
    const r = computeHealthScore(makeSnapshot(), T, NOW);
    expect(r.score).not.toBeNull();
    expect(r.score!).toBeGreaterThanOrEqual(80);
    expect(r.band).toBe('healthy');
  });

  it('returns score null + band n/a below the traffic floor — never 0', () => {
    const r = computeHealthScore(makeSnapshot({ lifetimeClicks: 5 }), T, NOW);
    expect(r.score).toBeNull();
    expect(r.band).toBe('na');
  });

  it('does not penalize a new provider still inside its window', () => {
    const fresh = makeSnapshot({
      lastEventAt: null,
      conversions30d: 0,
      conversions180d: 0,
      revenue180d: 0,
      firstClickAt: daysAgo(5), // window 14 → grace
      clicksSinceLastEvent: 50,
      lifetimeClicks: 60,
      clicks30d: 60,
      clicks180d: 60,
    });
    const r = computeHealthScore(fresh, T, NOW);
    const recency = r.components.find((c) => c.key === 'recency')!;
    const clicksSince = r.components.find((c) => c.key === 'clicks_since')!;
    expect(recency.applicable).toBe(false);
    expect(clicksSince.applicable).toBe(false);
    // Verified config + subid + active should keep the band out of critical
    expect(r.band).not.toBe('critical');
  });

  it('penalizes a stalled provider (no events for 4× window despite traffic)', () => {
    const stalled = makeSnapshot({ lastEventAt: daysAgo(70), clicksSinceLastEvent: 300 });
    const r = computeHealthScore(stalled, T, NOW);
    const recency = r.components.find((c) => c.key === 'recency')!;
    expect(recency.applicable).toBe(true);
    expect(recency.earned).toBe(0); // > 4 × 14 days
    expect(r.score!).toBeLessThan(80);
  });

  it('marks sync as n/a for direct providers instead of penalizing', () => {
    const direct = makeSnapshot({ network: 'direct', connectorConfigured: false, connectorSyncOk: null });
    const r = computeHealthScore(direct, T, NOW);
    const sync = r.components.find((c) => c.key === 'sync')!;
    expect(sync.applicable).toBe(false);
  });

  it('redistributes weights: n/a components do not drag the score down', () => {
    // Same provider, once with failing sync (applicable) and once without connector (n/a)
    const failingSync = computeHealthScore(makeSnapshot({ connectorSyncOk: false }), T, NOW);
    const noConnector = computeHealthScore(
      makeSnapshot({ connectorConfigured: false, connectorSyncOk: null }),
      T,
      NOW,
    );
    expect(noConnector.score!).toBeGreaterThan(failingSync.score!);
  });
});

// ── Stage classification ────────────────────────────────────────────────────

describe('classifyStageFailure', () => {
  it('returns null for a healthy provider (bad performance ≠ incident)', () => {
    expect(classifyStageFailure(makeSnapshot(), T, NOW)).toBeNull();
  });

  it('detects cta_no_go and gives it precedence over clicks_no_postback', () => {
    const snap = makeSnapshot({
      ctaClicks30d: 40,
      goClicks30d: 0,
      // also satisfies clicks_no_postback conditions:
      clicksSinceLastEvent: 200,
      lastEventAt: daysAgo(60),
    });
    expect(classifyStageFailure(snap, T, NOW)?.type).toBe('cta_no_go');
  });

  it('never raises cta_no_go without a confident name match (ctaClicks30d null)', () => {
    const snap = makeSnapshot({ ctaClicks30d: null, goClicks30d: 0 });
    expect(classifyStageFailure(snap, T, NOW)).toBeNull();
  });

  it('detects clicks_no_postback beyond 2× window (the CJ-sid case)', () => {
    const snap = makeSnapshot({
      lastEventAt: null,
      conversions30d: 0,
      conversions180d: 0,
      revenue180d: 0,
      firstClickAt: daysAgo(90), // > 2 × 14
      clicksSinceLastEvent: 492,
    });
    expect(classifyStageFailure(snap, T, NOW)?.type).toBe('clicks_no_postback');
  });

  it('respects the min-clicks threshold for clicks_no_postback', () => {
    const snap = makeSnapshot({
      lastEventAt: null,
      conversions180d: 0,
      revenue180d: 0,
      firstClickAt: daysAgo(90),
      clicksSinceLastEvent: 30, // < 50
    });
    expect(classifyStageFailure(snap, T, NOW)).toBeNull();
  });

  it('does not raise clicks_no_postback for unverified tracking', () => {
    const snap = makeSnapshot({
      trackingStatus: 'dashboard_only',
      lastEventAt: null,
      conversions180d: 0,
      revenue180d: 0,
      firstClickAt: daysAgo(90),
      clicksSinceLastEvent: 200,
    });
    expect(classifyStageFailure(snap, T, NOW)).toBeNull();
  });

  it('detects postback_no_revenue when revenue-bearing events flow but revenue stays 0', () => {
    const snap = makeSnapshot({
      lastEventAt: daysAgo(3),
      conversions180d: 8,
      revenueBearingEvents180d: 4, // ftd/approved arrived…
      revenue180d: 0, // …but no value → sync/mapping problem
    });
    expect(classifyStageFailure(snap, T, NOW)?.type).toBe('postback_no_revenue');
  });

  it('does NOT raise postback_no_revenue for registration/KYC-only funnels', () => {
    const snap = makeSnapshot({
      lastEventAt: daysAgo(3),
      conversions180d: 8, // registrations + KYC events…
      revenueBearingEvents180d: 0, // …but no ftd/approved yet — normal, not a sync bug
      revenue180d: 0,
    });
    expect(classifyStageFailure(snap, T, NOW)).toBeNull();
  });

  it('detects conversion_stalled after 4× window with ongoing traffic', () => {
    const snap = makeSnapshot({ lastEventAt: daysAgo(70), clicks30d: 50, clicksSinceLastEvent: 40 });
    expect(classifyStageFailure(snap, T, NOW)?.type).toBe('conversion_stalled');
  });

  it('does not raise conversion_stalled without recent traffic', () => {
    const snap = makeSnapshot({ lastEventAt: daysAgo(70), clicks30d: 0, clicksSinceLastEvent: 40 });
    expect(classifyStageFailure(snap, T, NOW)).toBeNull();
  });
});

// ── Revenue risk ────────────────────────────────────────────────────────────

describe('estimateRevenueRisk', () => {
  it('uses own EPC when revenue history exists', () => {
    const snap = makeSnapshot({ revenue180d: 800, clicks180d: 400, clicksSinceLastEvent: 100 });
    const r = estimateRevenueRisk(snap, T);
    expect(r.method).toBe('epc');
    expect(r.amount).toBe(200); // EPC 2 × 100 clicks
  });

  it('falls back to commission × assumed CR for never-converted providers', () => {
    const snap = makeSnapshot({
      revenue180d: 0,
      conversions180d: 0,
      commissionValue: 100,
      clicksSinceLastEvent: 492,
    });
    const r = estimateRevenueRisk(snap, T);
    expect(r.method).toBe('commission_x_cr');
    expect(r.amount).toBe(246); // 492 × 100 × 0.005
  });

  it('falls back to global EPC when converted before but revenue history is unusable', () => {
    const snap = makeSnapshot({ revenue180d: 0, conversions180d: 5, clicksSinceLastEvent: 50 });
    const r = estimateRevenueRisk(snap, T);
    expect(r.method).toBe('global_epc');
    expect(r.amount).toBe(100); // 50 × globalEpc 2
  });
});
