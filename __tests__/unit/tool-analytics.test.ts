// __tests__/unit/tool-analytics.test.ts
// Pure aggregation for /dashboard/analytics/tools (tool_v1), tested without
// any Supabase/server context — see lib/analytics/tool-analytics-aggregate.ts.

import { describe, it, expect } from 'vitest';
import {
  aggregateFunnel,
  aggregateHealth,
  aggregateMobileDropoff,
  aggregateVolume,
  buildKpis,
  funnelDedupeKey,
  median,
  ratePct,
  emptyToolAnalyticsData,
  type ToolEventRow,
  type ToolManifestEntry,
} from '@/lib/analytics/tool-analytics-aggregate';

function row(overrides: Partial<ToolEventRow> & { eventName: string }): ToolEventRow {
  return {
    sessionId: 'sess-1',
    eventValue: null,
    deviceType: 'desktop',
    occurredAt: '2026-07-01T10:00:00.000Z',
    toolId: 'money-leak-scanner',
    market: 'us',
    variantPath: '/tools/money-leak-scanner',
    ...overrides,
  };
}

// ── ratePct / median (helpers) ──────────────────────────────────────────────

describe('ratePct()', () => {
  it('division by zero → 0', () => {
    expect(ratePct(5, 0)).toBe(0);
    expect(ratePct(0, 0)).toBe(0);
  });
  it('rounds to 1 decimal, percent scale', () => {
    expect(ratePct(1, 3)).toBe(33.3);
    expect(ratePct(1, 2)).toBe(50);
  });
});

describe('median()', () => {
  it('empty array → null', () => {
    expect(median([])).toBeNull();
  });
  it('odd count → middle value', () => {
    expect(median([5, 1, 3])).toBe(3);
  });
  it('even count → average of the two middle values', () => {
    expect(median([1, 2, 3, 4])).toBe(2.5);
  });
});

describe('funnelDedupeKey()', () => {
  it('combines sessionId, toolId, market, variantPath in order', () => {
    const key = funnelDedupeKey({ sessionId: 's1', toolId: 'x', market: 'us', variantPath: '/tools/x' });
    expect(key).toBe('s1|x|us|/tools/x');
  });
});

// ── aggregateFunnel ──────────────────────────────────────────────────────────

describe('aggregateFunnel()', () => {
  it('division-by-zero rates → 0 when there are views but no downstream events', () => {
    const rows = aggregateFunnel([row({ eventName: 'tool_view' })]);
    expect(rows).toHaveLength(1);
    const r = rows[0];
    expect(r.views).toBe(1);
    expect(r.completionRate).toBe(0);
    expect(r.qdr).toBe(0);
    expect(r.resultToActionRate).toBe(0);
    expect(r.shareReportRate).toBe(0);
    expect(r.scenarioComparesPerResultSession).toBe(0);
    expect(r.returnWithinSessionRate).toBe(0);
    expect(r.ttfvMedianMs).toBeNull();
  });

  it('no rows at all → empty array (no crash)', () => {
    expect(aggregateFunnel([])).toEqual([]);
  });

  it('dedupe scope: same session×tool×market×path counts 1 view even if tool_view fires twice', () => {
    const rows = aggregateFunnel([
      row({ eventName: 'tool_view', sessionId: 's1' }),
      row({ eventName: 'tool_view', sessionId: 's1' }),
    ]);
    expect(rows[0].views).toBe(1);
  });

  it('different sessions count as separate views', () => {
    const rows = aggregateFunnel([
      row({ eventName: 'tool_view', sessionId: 's1' }),
      row({ eventName: 'tool_view', sessionId: 's2' }),
    ]);
    expect(rows[0].views).toBe(2);
  });

  it('different market or variantPath is a separate funnel scope even for the same session/tool', () => {
    const rows = aggregateFunnel([
      row({ eventName: 'tool_view', sessionId: 's1', market: 'us' }),
      row({ eventName: 'tool_view', sessionId: 's1', market: 'uk' }),
    ]);
    expect(rows).toHaveLength(2);
    expect(rows.find((r) => r.market === 'us')?.views).toBe(1);
    expect(rows.find((r) => r.market === 'uk')?.views).toBe(1);
  });

  it('computes completionRate, qdr, resultToActionRate, shareReportRate from full funnel', () => {
    const rows = aggregateFunnel([
      row({ eventName: 'tool_view', sessionId: 's1' }),
      row({ eventName: 'tool_view', sessionId: 's2' }),
      row({ eventName: 'tool_first_result', sessionId: 's1', eventValue: 4000 }),
      row({ eventName: 'tool_qualified_decision', sessionId: 's1' }),
      row({ eventName: 'tool_next_action_click', sessionId: 's1' }),
      row({ eventName: 'tool_result_share', sessionId: 's1' }),
    ]);
    const r = rows[0];
    expect(r.views).toBe(2);
    expect(r.firstResults).toBe(1);
    expect(r.qualified).toBe(1);
    expect(r.completionRate).toBe(50); // 1/2
    expect(r.qdr).toBe(50); // 1/2
    expect(r.resultToActionRate).toBe(100); // 1/1
    expect(r.shareReportRate).toBe(100); // 1/1
    expect(r.ttfvMedianMs).toBe(4000);
  });

  it('ttfvMedianMs: median across multiple first-result sessions, odd count', () => {
    const rows = aggregateFunnel([
      row({ eventName: 'tool_first_result', sessionId: 's1', eventValue: 1000 }),
      row({ eventName: 'tool_first_result', sessionId: 's2', eventValue: 5000 }),
      row({ eventName: 'tool_first_result', sessionId: 's3', eventValue: 3000 }),
    ]);
    expect(rows[0].ttfvMedianMs).toBe(3000);
  });

  it('ttfvMedianMs: even count averages the two middle values', () => {
    const rows = aggregateFunnel([
      row({ eventName: 'tool_first_result', sessionId: 's1', eventValue: 1000 }),
      row({ eventName: 'tool_first_result', sessionId: 's2', eventValue: 2000 }),
      row({ eventName: 'tool_first_result', sessionId: 's3', eventValue: 3000 }),
      row({ eventName: 'tool_first_result', sessionId: 's4', eventValue: 4000 }),
    ]);
    expect(rows[0].ttfvMedianMs).toBe(2500);
  });

  it('scenarioComparesPerResultSession: total scenario compares ÷ distinct result sessions', () => {
    const rows = aggregateFunnel([
      row({ eventName: 'tool_first_result', sessionId: 's1' }),
      row({ eventName: 'tool_scenario_compare', sessionId: 's1' }),
      row({ eventName: 'tool_scenario_compare', sessionId: 's1' }),
    ]);
    expect(rows[0].scenarioComparesPerResultSession).toBe(2);
  });

  it('returnWithinSessionRate: funnel key with tool_view on 2 distinct calendar days counts as returning', () => {
    const rows = aggregateFunnel([
      row({ eventName: 'tool_view', sessionId: 's1', occurredAt: '2026-07-01T09:00:00.000Z' }),
      row({ eventName: 'tool_view', sessionId: 's1', occurredAt: '2026-07-02T09:00:00.000Z' }),
      row({ eventName: 'tool_view', sessionId: 's2', occurredAt: '2026-07-01T09:00:00.000Z' }),
    ]);
    // 2 distinct funnel keys (s1, s2); only s1 returned on a second day → 1/2 = 50%
    expect(rows[0].views).toBe(2);
    expect(rows[0].returnWithinSessionRate).toBe(50);
  });
});

// ── aggregateMobileDropoff ───────────────────────────────────────────────────

describe('aggregateMobileDropoff()', () => {
  it('null when desktop views < 50', () => {
    const events: ToolEventRow[] = [row({ eventName: 'tool_view', deviceType: 'desktop', sessionId: 's1' })];
    const rows = aggregateMobileDropoff(events);
    expect(rows[0].value).toBeNull();
  });

  it('computes 1 − completion(mobile) / completion(desktop) once desktop views ≥ 50', () => {
    const events: ToolEventRow[] = [];
    for (let i = 0; i < 50; i++) {
      events.push(row({ eventName: 'tool_view', deviceType: 'desktop', sessionId: `d-view-${i}` }));
    }
    // 50% desktop completion (25 of 50 get a first result)
    for (let i = 0; i < 25; i++) {
      events.push(row({ eventName: 'tool_first_result', deviceType: 'desktop', sessionId: `d-view-${i}` }));
    }
    for (let i = 0; i < 20; i++) {
      events.push(row({ eventName: 'tool_view', deviceType: 'mobile', sessionId: `m-view-${i}` }));
    }
    // 25% mobile completion (5 of 20 get a first result)
    for (let i = 0; i < 5; i++) {
      events.push(row({ eventName: 'tool_first_result', deviceType: 'mobile', sessionId: `m-view-${i}` }));
    }
    const rows = aggregateMobileDropoff(events);
    // completionDesktop = 0.5, completionMobile = 0.25 → dropoff = 1 - 0.25/0.5 = 0.5 = 50%
    expect(rows[0].value).toBe(50);
  });

  it('ignores unknown/other device types', () => {
    const events: ToolEventRow[] = [row({ eventName: 'tool_view', deviceType: 'tablet', sessionId: 's1' })];
    const rows = aggregateMobileDropoff(events);
    expect(rows).toEqual([]);
  });
});

// ── aggregateHealth ──────────────────────────────────────────────────────────

describe('aggregateHealth()', () => {
  const manifest: ToolManifestEntry[] = [
    { toolId: 'money-leak-scanner', path: '/tools/money-leak-scanner', market: 'us' },
    { toolId: 'money-leak-scanner', path: '/uk/tools/money-leak-scanner', market: 'uk' },
    { toolId: 'broker-finder', path: '/tools/broker-finder', market: 'ca' },
    { toolId: 'debt-payoff', path: '/tools/debt-payoff-calculator', market: 'us' },
  ];

  it('classifies all 4 statuses correctly', () => {
    const events: ToolEventRow[] = [
      row({ eventName: 'tool_view', toolId: 'money-leak-scanner', market: 'us', variantPath: '/tools/money-leak-scanner' }),
    ];
    const pageviews = new Map<string, number>([
      ['/tools/money-leak-scanner', 10], // has events → reporting (even though pageviews present)
      ['/uk/tools/money-leak-scanner', 8], // 0 events, ≥5 pageviews → silent
      ['/tools/broker-finder', 2], // 0 events, 1-4 pageviews → low_traffic
      // debt-payoff path absent from pageviews map entirely → 0 pageviews → no_traffic
    ]);

    const health = aggregateHealth(manifest, events, pageviews);
    expect(health).toHaveLength(4);
    const byToolMarket = (toolId: string, market: string) =>
      health.find((h) => h.toolId === toolId && h.market === market)!;

    expect(byToolMarket('money-leak-scanner', 'us').status).toBe('reporting');
    expect(byToolMarket('money-leak-scanner', 'uk').status).toBe('silent');
    expect(byToolMarket('broker-finder', 'ca').status).toBe('low_traffic');
    expect(byToolMarket('debt-payoff', 'us').status).toBe('no_traffic');
  });

  it('events>0 wins even with 0 recorded pageviews (proven reporting beats pageview-derived status)', () => {
    const events: ToolEventRow[] = [
      row({ eventName: 'tool_view', toolId: 'debt-payoff', market: 'us', variantPath: '/tools/debt-payoff-calculator' }),
    ];
    const health = aggregateHealth(manifest, events, new Map());
    expect(health.find((h) => h.toolId === 'debt-payoff')!.status).toBe('reporting');
  });

  it('empty manifest → empty health array, no crash', () => {
    expect(aggregateHealth([], [], new Map())).toEqual([]);
  });
});

// ── aggregateVolume ──────────────────────────────────────────────────────────

describe('aggregateVolume()', () => {
  it('groups rows by (day, eventName)', () => {
    const events: ToolEventRow[] = [
      row({ eventName: 'tool_view', occurredAt: '2026-07-01T08:00:00.000Z' }),
      row({ eventName: 'tool_view', occurredAt: '2026-07-01T09:30:00.000Z' }),
      row({ eventName: 'tool_view', occurredAt: '2026-07-02T08:00:00.000Z' }),
      row({ eventName: 'tool_start', occurredAt: '2026-07-01T08:00:00.000Z' }),
    ];
    const volume = aggregateVolume(events);
    const find = (day: string, eventName: string) => volume.find((v) => v.day === day && v.eventName === eventName);
    expect(find('2026-07-01', 'tool_view')?.rows).toBe(2);
    expect(find('2026-07-02', 'tool_view')?.rows).toBe(1);
    expect(find('2026-07-01', 'tool_start')?.rows).toBe(1);
  });

  it('flags tool_input_change warning only above the 5,000/day threshold', () => {
    const under = Array.from({ length: 5_000 }, (_, i) =>
      row({ eventName: 'tool_input_change', sessionId: `s${i}`, occurredAt: '2026-07-01T08:00:00.000Z' }),
    );
    const over = Array.from({ length: 5_001 }, (_, i) =>
      row({ eventName: 'tool_input_change', sessionId: `s${i}`, occurredAt: '2026-07-02T08:00:00.000Z' }),
    );
    const volume = aggregateVolume([...under, ...over]);
    const day1 = volume.find((v) => v.day === '2026-07-01')!;
    const day2 = volume.find((v) => v.day === '2026-07-02')!;
    expect(day1.rows).toBe(5_000);
    expect(day1.warning).toBe(false);
    expect(day2.rows).toBe(5_001);
    expect(day2.warning).toBe(true);
  });

  it('never flags a warning for event names without a defined threshold', () => {
    const many = Array.from({ length: 10_000 }, (_, i) =>
      row({ eventName: 'tool_view', sessionId: `s${i}`, occurredAt: '2026-07-01T08:00:00.000Z' }),
    );
    const volume = aggregateVolume(many);
    expect(volume[0].warning).toBe(false);
  });

  it('empty input → empty array', () => {
    expect(aggregateVolume([])).toEqual([]);
  });
});

// ── buildKpis / emptyToolAnalyticsData ──────────────────────────────────────

describe('buildKpis()', () => {
  it('sums views/qualified across funnel rows and derives overall QDR', () => {
    const funnel = aggregateFunnel([
      row({ eventName: 'tool_view', sessionId: 's1', toolId: 'a' }),
      row({ eventName: 'tool_view', sessionId: 's2', toolId: 'a' }),
      row({ eventName: 'tool_qualified_decision', sessionId: 's1', toolId: 'a' }),
      row({ eventName: 'tool_view', sessionId: 's3', toolId: 'b' }),
    ]);
    const kpis = buildKpis(funnel, []);
    expect(kpis.views).toBe(3);
    expect(kpis.qualified).toBe(1);
    expect(kpis.qdr).toBe(33.3);
  });

  it('0 views → qdr 0, not NaN/Infinity', () => {
    const kpis = buildKpis([], []);
    expect(kpis.qdr).toBe(0);
    expect(kpis.views).toBe(0);
  });

  it('counts health statuses', () => {
    const health = aggregateHealth(
      [
        { toolId: 'a', path: '/a', market: 'us' },
        { toolId: 'b', path: '/b', market: 'us' },
      ],
      [row({ eventName: 'tool_view', toolId: 'a', variantPath: '/a' })],
      new Map([['/b', 6]]),
    );
    const kpis = buildKpis([], health);
    expect(kpis.expectedTotal).toBe(2);
    expect(kpis.reportingCount).toBe(1);
    expect(kpis.silentCount).toBe(1);
  });
});

describe('emptyToolAnalyticsData()', () => {
  it('renders a fully valid, empty, crash-proof shape (0 events real-world case)', () => {
    const data = emptyToolAnalyticsData(7);
    expect(data.funnel).toEqual([]);
    expect(data.health).toEqual([]);
    expect(data.volume).toEqual([]);
    expect(data.mobileDropoff).toEqual([]);
    expect(data.annotations).toEqual([]);
    expect(data.kpis.qdr).toBe(0);
    expect(data.kpis.views).toBe(0);
  });
});
