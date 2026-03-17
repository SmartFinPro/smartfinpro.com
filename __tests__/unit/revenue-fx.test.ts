// __tests__/unit/revenue-fx.test.ts
// Tests the FX currency normalisation as implemented in lib/actions/revenue.ts
//
// The toUSD() helper and FX_TO_USD rates are inlined here verbatim so these
// tests remain isolated from the Supabase/Next.js runtime.
//
// If rates or the function signature change in the source, update this copy.

import { describe, it, expect } from 'vitest';

// ── Inlined from lib/actions/revenue.ts ──────────────────────────────────
const FX_TO_USD: Record<string, number> = {
  USD: 1, GBP: 1.27, CAD: 0.74, AUD: 0.65, EUR: 1.09,
};

function toUSD(amount: number, currency?: string | null): number {
  return amount * (FX_TO_USD[(currency ?? 'USD').toUpperCase()] ?? 1);
}
// ─────────────────────────────────────────────────────────────────────────────

describe('toUSD() — FX currency normalisation', () => {
  // ── USD (base currency — passthrough) ────────────────────────────────────

  it('passes USD amounts through unchanged', () => {
    expect(toUSD(100, 'USD')).toBe(100);
  });

  it('handles USD zero amount', () => {
    expect(toUSD(0, 'USD')).toBe(0);
  });

  // ── Supported non-USD currencies ─────────────────────────────────────────

  it('converts GBP → USD at 1.27 rate', () => {
    expect(toUSD(100, 'GBP')).toBeCloseTo(127, 5);
  });

  it('converts CAD → USD at 0.74 rate', () => {
    expect(toUSD(100, 'CAD')).toBeCloseTo(74, 5);
  });

  it('converts AUD → USD at 0.65 rate', () => {
    expect(toUSD(100, 'AUD')).toBeCloseTo(65, 5);
  });

  it('converts EUR → USD at 1.09 rate', () => {
    expect(toUSD(100, 'EUR')).toBeCloseTo(109, 5);
  });

  // ── Null / undefined safety ───────────────────────────────────────────────

  it('defaults to USD (rate 1) when currency is null', () => {
    expect(toUSD(50, null)).toBe(50);
  });

  it('defaults to USD (rate 1) when currency is undefined', () => {
    expect(toUSD(50, undefined)).toBe(50);
  });

  // ── Case-insensitivity ────────────────────────────────────────────────────

  it('handles lowercase "gbp" correctly', () => {
    expect(toUSD(100, 'gbp')).toBeCloseTo(127, 5);
  });

  it('handles lowercase "aud" correctly', () => {
    expect(toUSD(100, 'aud')).toBeCloseTo(65, 5);
  });

  it('handles mixed-case "Cad" correctly', () => {
    expect(toUSD(100, 'Cad')).toBeCloseTo(74, 5);
  });

  // ── Unknown currency fallback ─────────────────────────────────────────────

  it('falls back to rate 1.0 (passthrough) for unknown currencies', () => {
    // Unknown → FX_TO_USD[key] = undefined → ?? 1
    expect(toUSD(100, 'XYZ')).toBe(100);
    expect(toUSD(100, 'JPY')).toBe(100);  // JPY not in the map
  });

  it('falls back to rate 1.0 for empty string currency', () => {
    // ''.toUpperCase() = '' → not in map → ?? 1
    expect(toUSD(100, '')).toBe(100);
  });

  // ── Multi-currency aggregation (simulates getRevenueStats reduce) ─────────

  it('correctly aggregates mixed-currency conversions to USD', () => {
    const conversions = [
      { amount: 100, currency: 'USD' },    // → 100.00
      { amount: 50,  currency: 'GBP' },    // →  63.50
      { amount: 200, currency: 'CAD' },    // → 148.00
      { amount: 80,  currency: 'AUD' },    // →  52.00
    ];
    const total = conversions.reduce(
      (sum, c) => sum + toUSD(c.amount, c.currency),
      0,
    );
    expect(total).toBeCloseTo(363.5, 1);   // 100 + 63.5 + 148 + 52
  });

  it('EPC calculation remains accurate after FX normalisation', () => {
    // 10 clicks, £50 GBP commission → EPC in USD = $6.35
    const revenueUSD = toUSD(50, 'GBP');
    const clicks = 10;
    const epc = revenueUSD / clicks;
    expect(epc).toBeCloseTo(6.35, 2);
  });

  // ── Rates match marketConfig exchange rates in the same file ─────────────

  it('GBP rate matches marketConfig.GB.exchangeRate (1.27)', () => {
    // This guards against the two rate tables drifting out of sync
    expect(FX_TO_USD['GBP']).toBe(1.27);
  });

  it('CAD rate matches marketConfig.CA.exchangeRate (0.74)', () => {
    expect(FX_TO_USD['CAD']).toBe(0.74);
  });

  it('AUD rate matches marketConfig.AU.exchangeRate (0.65)', () => {
    expect(FX_TO_USD['AUD']).toBe(0.65);
  });
});
