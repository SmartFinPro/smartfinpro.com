import { describe, it, expect } from 'vitest';
import { computeCohorts, weekStartUtc, type CohortClick, type CohortRevenueEvent } from '@/lib/cohorts/aggregate';

// 2026-03-02 is a Monday (UTC) → cohort week start = itself.
// 2026-03-09 is the following Monday.
const clicks: CohortClick[] = [
  { clickId: 'a', clickedAt: '2026-03-02T10:00:00Z' }, // cohort 2026-03-02
  { clickId: 'b', clickedAt: '2026-03-03T10:00:00Z' }, // cohort 2026-03-02
  { clickId: 'c', clickedAt: '2026-03-10T10:00:00Z' }, // cohort 2026-03-09
];

const events: CohortRevenueEvent[] = [
  { clickId: 'a', receivedAt: '2026-03-04T10:00:00Z', valueUsd: 10, eventType: 'approved' }, // age 0
  { clickId: 'a', receivedAt: '2026-03-12T10:00:00Z', valueUsd: 20, eventType: 'approved' }, // age 1 (10 days)
  { clickId: 'b', receivedAt: '2026-03-03T11:00:00Z', valueUsd: 5, eventType: 'approved' },  // age 0
  { clickId: 'c', receivedAt: '2026-03-10T11:00:00Z', valueUsd: 100, eventType: 'approved' },// age 0
  { clickId: 'a', receivedAt: '2026-03-04T12:00:00Z', valueUsd: 999, eventType: 'qualified' }, // NOT approved → ignored
  { clickId: 'zzz', receivedAt: '2026-03-04T10:00:00Z', valueUsd: 777, eventType: 'approved' }, // unknown click → ignored
];

describe('weekStartUtc', () => {
  it('maps any day to the Monday (UTC) of its ISO week', () => {
    expect(weekStartUtc('2026-03-02T10:00:00Z')).toBe('2026-03-02'); // Monday
    expect(weekStartUtc('2026-03-08T23:59:00Z')).toBe('2026-03-02'); // Sunday → same week
    expect(weekStartUtc('2026-03-09T00:00:00Z')).toBe('2026-03-09'); // next Monday
  });
});

describe('computeCohorts', () => {
  const result = computeCohorts(clicks, events); // no nowIso → all cohorts mature

  it('buckets clicks into weekly cohorts with correct sizes', () => {
    expect(result.cohorts.map((c) => c.cohort)).toEqual(['2026-03-02', '2026-03-09']);
    expect(result.cohorts[0].size).toBe(2); // a + b
    expect(result.cohorts[1].size).toBe(1); // c
  });

  it('computes cumulative revenue per age bucket (only approved, known clicks)', () => {
    const A = result.cohorts[0];
    // age0 = e1(10) + e3(5) = 15; age1 += e2(20) = 35; flat thereafter
    expect(A.cumulativeRevenueUsd[0]).toBe(15);
    expect(A.cumulativeRevenueUsd[1]).toBe(35);
    expect(A.cumulativeRevenueUsd[4]).toBe(35);
    const B = result.cohorts[1];
    expect(B.cumulativeRevenueUsd[0]).toBe(100);
    expect(B.cumulativeRevenueUsd[5]).toBe(100);
  });

  it('derives LTV per click via division by cohort size', () => {
    expect(result.cohorts[0].ltvPerClick[0]).toBeCloseTo(7.5);  // 15 / 2
    expect(result.cohorts[0].ltvPerClick[1]).toBeCloseTo(17.5); // 35 / 2
    expect(result.cohorts[1].ltvPerClick[0]).toBeCloseTo(100);  // 100 / 1
  });

  it('excludes non-approved events and events for unknown clicks', () => {
    // 999 (qualified) and 777 (unknown click) must not appear anywhere
    expect(result.kpis.totalApprovedRevenueUsd).toBe(135); // 10+20+5+100
    const allRev = result.cohorts.flatMap((c) => c.cumulativeRevenueUsd);
    expect(allRev).not.toContain(999);
    expect(Math.max(...allRev)).toBeLessThan(777);
  });

  it('computes headline KPIs', () => {
    expect(result.kpis.totalClicks).toBe(3);
    expect(result.kpis.convertingClicks).toBe(3); // a, b, c
    expect(result.kpis.conversionRate).toBeCloseTo(1);
    expect(result.kpis.avgLtvPerClick).toBeCloseTo(45); // 135 / 3
    // W4 (all mature): mean of A.ltv[4]=17.5 and B.ltv[4]=100
    expect(result.kpis.avgLtvPerClickAtW4).toBeCloseTo(58.75);
  });

  it('treats a cohort with clicks but no events as zero (missing conversions = 0)', () => {
    const r = computeCohorts(
      [{ clickId: 'x', clickedAt: '2026-03-02T10:00:00Z' }],
      [],
    );
    expect(r.cohorts[0].size).toBe(1);
    expect(r.cohorts[0].cumulativeRevenueUsd.every((v) => v === 0)).toBe(true);
    expect(r.cohorts[0].ltvPerClick.every((v) => v === 0)).toBe(true);
    expect(r.kpis.conversionRate).toBe(0);
    expect(r.kpis.avgLtvPerClick).toBe(0);
  });

  it('drops events older than maxAgeWeeks', () => {
    const r = computeCohorts(
      [{ clickId: 'a', clickedAt: '2026-03-02T10:00:00Z' }],
      [{ clickId: 'a', receivedAt: '2026-03-30T10:00:00Z', valueUsd: 50, eventType: 'approved' }], // age 4 (28 days)
      { maxAgeWeeks: 1 },
    );
    expect(r.kpis.totalApprovedRevenueUsd).toBe(0); // age 4 > maxAge 1 → dropped
  });

  it('respects W4 maturity when nowIso is provided', () => {
    // now = 2026-04-10: cohort 2026-03-02 mature (start+5w=Apr 6 ≤ now),
    //                    cohort 2026-03-09 NOT mature (start+5w=Apr 13 > now)
    const r = computeCohorts(clicks, events, { nowIso: '2026-04-10T00:00:00Z' });
    expect(r.kpis.avgLtvPerClickAtW4).toBeCloseTo(17.5); // only cohort A counts
  });

  it('handles empty input safely', () => {
    const r = computeCohorts([], []);
    expect(r.cohorts).toEqual([]);
    expect(r.kpis.totalClicks).toBe(0);
    expect(r.kpis.conversionRate).toBe(0);
    expect(r.kpis.avgLtvPerClick).toBe(0);
    expect(r.kpis.avgLtvPerClickAtW4).toBe(0);
  });
});
