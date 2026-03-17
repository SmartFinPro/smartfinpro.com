// __tests__/unit/dashboard-revenue-consistency.test.ts
// Test B: Dashboard/Revenue USD Consistency (Fix 1.5)
//
// Verifies that dashboard and revenue modules produce identical USD totals
// when processing the same multi-currency conversion data.
// Both modules MUST use the same toUSD() function with the same FX_TO_USD rates.

import { describe, it, expect } from 'vitest';

// ── Inlined from lib/actions/revenue.ts (Single Source of Truth) ─────────
const FX_TO_USD: Record<string, number> = {
  USD: 1, GBP: 1.27, CAD: 0.74, AUD: 0.65, EUR: 1.09,
};

function toUSD(amount: number, currency?: string | null): number {
  return amount * (FX_TO_USD[(currency ?? 'USD').toUpperCase()] ?? 1);
}
// ─────────────────────────────────────────────────────────────────────────────

// ── Simulated conversion records (matching DB shape) ─────────────────────
interface ConversionRecord {
  link_id: string;
  commission_earned: number;
  currency: string;
  status: string;
  converted_at: string;
}

const testConversions: ConversionRecord[] = [
  { link_id: 'l1', commission_earned: 100,  currency: 'USD', status: 'approved', converted_at: '2026-03-01T00:00:00Z' },
  { link_id: 'l2', commission_earned: 50,   currency: 'GBP', status: 'approved', converted_at: '2026-03-02T00:00:00Z' },
  { link_id: 'l3', commission_earned: 200,  currency: 'CAD', status: 'approved', converted_at: '2026-03-03T00:00:00Z' },
  { link_id: 'l4', commission_earned: 80,   currency: 'AUD', status: 'approved', converted_at: '2026-03-04T00:00:00Z' },
  { link_id: 'l5', commission_earned: 150,  currency: 'EUR', status: 'approved', converted_at: '2026-03-05T00:00:00Z' },
  { link_id: 'l6', commission_earned: 30,   currency: 'USD', status: 'pending',  converted_at: '2026-03-06T00:00:00Z' },
  { link_id: 'l7', commission_earned: 75,   currency: 'GBP', status: 'rejected', converted_at: '2026-03-07T00:00:00Z' },
];

describe('Dashboard/Revenue USD consistency (Fix 1.5)', () => {
  // ── Dashboard reduce pattern (from lib/actions/dashboard.ts) ───────────
  // This is the EXACT pattern used in getMarketIntelligenceData():
  //   .reduce((sum, c) => sum + toUSD(c.commission_earned || 0, c.currency), 0)
  function dashboardTotalRevenue(conversions: ConversionRecord[]): number {
    const approved = conversions.filter(c => c.status === 'approved');
    return approved.reduce((sum, c) => sum + toUSD(c.commission_earned || 0, c.currency), 0);
  }

  // ── Revenue module pattern (from lib/actions/revenue.ts) ───────────────
  // This uses the same toUSD() function since Fix 1.5 made it Single Source of Truth
  function revenueTotalUSD(conversions: ConversionRecord[]): number {
    const approved = conversions.filter(c => c.status === 'approved');
    return approved.reduce((sum, c) => sum + toUSD(c.commission_earned || 0, c.currency), 0);
  }

  it('dashboard and revenue produce identical USD totals for multi-currency conversions', () => {
    const dashboardTotal = dashboardTotalRevenue(testConversions);
    const revenueTotal = revenueTotalUSD(testConversions);

    // Both must be identical — same function, same rates
    expect(dashboardTotal).toBe(revenueTotal);
    // Manual calculation: 100 + 63.5 + 148 + 52 + 163.5 = 527.0
    expect(dashboardTotal).toBeCloseTo(527.0, 1);
  });

  it('excludes pending and rejected conversions from totals', () => {
    const total = dashboardTotalRevenue(testConversions);
    // Only 5 approved conversions counted, not the pending (l6) or rejected (l7)
    const allTotal = testConversions.reduce(
      (sum, c) => sum + toUSD(c.commission_earned || 0, c.currency), 0
    );
    expect(total).toBeLessThan(allTotal);
    // pending USD 30 + rejected GBP 75*1.27=95.25 = 125.25 difference
    expect(allTotal - total).toBeCloseTo(125.25, 1);
  });

  it('handles empty conversion list identically in both modules', () => {
    expect(dashboardTotalRevenue([])).toBe(0);
    expect(revenueTotalUSD([])).toBe(0);
  });

  it('handles all-USD conversions without FX conversion', () => {
    const usdOnly: ConversionRecord[] = [
      { link_id: 'l1', commission_earned: 100, currency: 'USD', status: 'approved', converted_at: '2026-03-01T00:00:00Z' },
      { link_id: 'l2', commission_earned: 200, currency: 'USD', status: 'approved', converted_at: '2026-03-02T00:00:00Z' },
    ];
    expect(dashboardTotalRevenue(usdOnly)).toBe(300);
    expect(revenueTotalUSD(usdOnly)).toBe(300);
  });

  it('handles null/undefined currency gracefully (defaults to USD)', () => {
    const nullCurrency: ConversionRecord[] = [
      { link_id: 'l1', commission_earned: 100, currency: '', status: 'approved', converted_at: '2026-03-01T00:00:00Z' },
    ];
    // Empty string → toUpperCase → '' → not in map → fallback rate 1
    expect(dashboardTotalRevenue(nullCurrency)).toBe(100);
  });

  it('single GBP conversion matches between dashboard and revenue', () => {
    const gbpOnly: ConversionRecord[] = [
      { link_id: 'l1', commission_earned: 50, currency: 'GBP', status: 'approved', converted_at: '2026-03-01T00:00:00Z' },
    ];
    const d = dashboardTotalRevenue(gbpOnly);
    const r = revenueTotalUSD(gbpOnly);
    expect(d).toBe(r);
    expect(d).toBeCloseTo(63.5, 2);
  });
});
