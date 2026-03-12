// __tests__/unit/bandit.test.ts
// P5: Thompson Sampling — unit tests for pure algorithm logic
//
// Tests:
//   1. Beta sampling produces values in [0, 1]
//   2. Arm selection picks the best arm consistently
//   3. Warmup threshold constant is correct
//   4. Degenerate cases (empty arms, single arm, zero params)
//   5. Strong prior arm beats weak prior arm over many samples

import { describe, it, expect } from 'vitest';
import { betaSample, selectArm, BANDIT_WARMUP_THRESHOLD } from '@/lib/bandit/thompson-sampling';
import type { BanditArm } from '@/lib/bandit/thompson-sampling';

describe('Thompson Sampling', () => {
  describe('betaSample', () => {
    it('produces values in [0, 1]', () => {
      for (let i = 0; i < 1000; i++) {
        const sample = betaSample(2, 3);
        expect(sample).toBeGreaterThanOrEqual(0);
        expect(sample).toBeLessThanOrEqual(1);
      }
    });

    it('returns 0.5 for degenerate parameters (alpha <= 0 or beta <= 0)', () => {
      expect(betaSample(0, 1)).toBe(0.5);
      expect(betaSample(1, 0)).toBe(0.5);
      expect(betaSample(-1, 2)).toBe(0.5);
    });

    it('Beta(1,1) mean is approximately 0.5', () => {
      const N = 5000;
      let sum = 0;
      for (let i = 0; i < N; i++) sum += betaSample(1, 1);
      const mean = sum / N;
      expect(mean).toBeGreaterThan(0.4);
      expect(mean).toBeLessThan(0.6);
    });

    it('Beta(10,2) mean is approximately 0.83', () => {
      const N = 5000;
      let sum = 0;
      for (let i = 0; i < N; i++) sum += betaSample(10, 2);
      const mean = sum / N;
      // Theoretical mean = 10/(10+2) = 0.833
      expect(mean).toBeGreaterThan(0.78);
      expect(mean).toBeLessThan(0.88);
    });
  });

  describe('selectArm', () => {
    it('returns -1 for empty array', () => {
      expect(selectArm([])).toBe(-1);
    });

    it('returns 0 for single arm', () => {
      const arms: BanditArm[] = [
        { linkId: 'a', alpha: 1, betaParam: 1, totalShown: 10 },
      ];
      expect(selectArm(arms)).toBe(0);
    });

    it('strongly favors arm with better posterior', () => {
      const arms: BanditArm[] = [
        { linkId: 'weak', alpha: 2, betaParam: 20, totalShown: 100 },    // ~0.09 expected
        { linkId: 'strong', alpha: 50, betaParam: 5, totalShown: 100 },  // ~0.91 expected
      ];

      let strongWins = 0;
      const N = 200;
      for (let i = 0; i < N; i++) {
        if (selectArm(arms) === 1) strongWins++;
      }
      // Strong arm should win > 95% of the time
      expect(strongWins / N).toBeGreaterThan(0.95);
    });

    it('explores both arms when posteriors are similar', () => {
      const arms: BanditArm[] = [
        { linkId: 'a', alpha: 5, betaParam: 5, totalShown: 50 },
        { linkId: 'b', alpha: 5, betaParam: 5, totalShown: 50 },
      ];

      let aWins = 0;
      const N = 500;
      for (let i = 0; i < N; i++) {
        if (selectArm(arms) === 0) aWins++;
      }
      // Should be roughly 50/50 (within 35-65% range)
      expect(aWins / N).toBeGreaterThan(0.35);
      expect(aWins / N).toBeLessThan(0.65);
    });

    it('handles 3+ arms correctly', () => {
      const arms: BanditArm[] = [
        { linkId: 'a', alpha: 1, betaParam: 10, totalShown: 50 },   // worst
        { linkId: 'b', alpha: 10, betaParam: 1, totalShown: 50 },   // best
        { linkId: 'c', alpha: 3, betaParam: 5, totalShown: 50 },    // middle
      ];

      let bWins = 0;
      const N = 200;
      for (let i = 0; i < N; i++) {
        if (selectArm(arms) === 1) bWins++;
      }
      // Arm b should dominate
      expect(bWins / N).toBeGreaterThan(0.8);
    });
  });

  describe('BANDIT_WARMUP_THRESHOLD', () => {
    it('is 100', () => {
      expect(BANDIT_WARMUP_THRESHOLD).toBe(100);
    });
  });
});
