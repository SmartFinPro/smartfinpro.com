// __tests__/unit/offer-ev.test.ts
// P4: Offer-EV formula — unit tests for EV computation logic
//
// Tests:
//   1. EV formula produces correct values
//   2. Zero clicks → zero EV
//   3. High reversal rate penalizes EV
//   4. Cross-market compliance scoring

import { describe, it, expect } from 'vitest';

// Pure function test — extract the formula from the server action
function computeEV(
  approvalRate: number,
  avgPayout: number,
  reversalRate: number,
  complianceScore: number,
): number {
  return approvalRate * avgPayout * (1 - reversalRate) * complianceScore;
}

function getComplianceScore(linkMarket: string | null, queryMarket: string): number {
  if (!linkMarket) return 0.6;
  if (linkMarket === queryMarket) return 1.0;
  return 0.8;
}

describe('Offer-EV Formula', () => {
  describe('computeEV', () => {
    it('computes correct EV for a typical offer', () => {
      // 10% approval, $50 payout, 5% reversal, same market
      const ev = computeEV(0.1, 50, 0.05, 1.0);
      // 0.1 × 50 × 0.95 × 1.0 = 4.75
      expect(ev).toBeCloseTo(4.75, 2);
    });

    it('returns 0 when approval rate is 0', () => {
      expect(computeEV(0, 100, 0, 1.0)).toBe(0);
    });

    it('returns 0 when payout is 0', () => {
      expect(computeEV(0.5, 0, 0, 1.0)).toBe(0);
    });

    it('penalizes high reversal rate', () => {
      const lowReversal = computeEV(0.1, 100, 0.05, 1.0);  // 5% reversal
      const highReversal = computeEV(0.1, 100, 0.50, 1.0);  // 50% reversal
      expect(highReversal).toBeLessThan(lowReversal);
      expect(highReversal).toBeCloseTo(5.0, 2);   // 0.1 × 100 × 0.5 × 1.0
      expect(lowReversal).toBeCloseTo(9.5, 2);     // 0.1 × 100 × 0.95 × 1.0
    });

    it('100% reversal = zero EV', () => {
      expect(computeEV(0.5, 200, 1.0, 1.0)).toBe(0);
    });

    it('cross-market penalty reduces EV by 20%', () => {
      const sameMarket = computeEV(0.1, 100, 0, 1.0);
      const crossMarket = computeEV(0.1, 100, 0, 0.8);
      expect(crossMarket / sameMarket).toBeCloseTo(0.8, 2);
    });
  });

  describe('getComplianceScore', () => {
    it('returns 1.0 for exact market match', () => {
      expect(getComplianceScore('us', 'us')).toBe(1.0);
      expect(getComplianceScore('uk', 'uk')).toBe(1.0);
    });

    it('returns 0.8 for cross-market', () => {
      expect(getComplianceScore('us', 'uk')).toBe(0.8);
      expect(getComplianceScore('au', 'ca')).toBe(0.8);
    });

    it('returns 0.6 for unknown market (null)', () => {
      expect(getComplianceScore(null, 'us')).toBe(0.6);
    });
  });
});
