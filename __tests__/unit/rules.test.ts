import { describe, it, expect } from 'vitest';
import { getRule } from '@/lib/rules';
import { RULE_PACKS } from '@/lib/rules/index';

describe('getRule boundaries', () => {
  it('AU concessional cap flips exactly on 2026-07-01', () => {
    expect(getRule('au', 'concessionalCap', '2026-06-30')).toBe(30000);
    expect(getRule('au', 'concessionalCap', '2026-07-01')).toBe(32500);
  });
  it('AU super guarantee is 12% since 2025-07-01', () => {
    expect(getRule('au', 'superGuaranteeRate', '2025-06-30')).toBe(0.115);
    expect(getRule('au', 'superGuaranteeRate', '2026-07-12')).toBe(0.12);
  });
  it('CA 2026 limits', () => {
    expect(getRule('ca', 'rrspLimit', '2026-07-12')).toBe(33810);
    expect(getRule('ca', 'tfsaCumulative', '2026-07-12')).toBe(109000);
  });
  it('UK CGT + ISA', () => {
    expect(getRule('uk', 'cgtBasicRate', '2026-07-12')).toBe(0.18);
    expect(getRule('uk', 'cashIsaAllowance', '2027-04-06')).toBe(12000); // zukunftsdatiert
    expect(getRule('uk', 'cashIsaAllowance', '2026-07-12')).toBe(20000);
  });
  it('US 2026 retirement limits', () => {
    expect(getRule('us', 'k401Limit', '2026-01-01')).toBe(24500);
    expect(getRule('us', 'iraLimit', '2026-01-01')).toBe(7500);
  });
});

describe('rule pack integrity', () => {
  it('windows per key are sorted and non-overlapping; every entry has source + verifiedAt', () => {
    for (const [market, pack] of Object.entries(RULE_PACKS)) {
      for (const [key, entries] of Object.entries(pack)) {
        for (let i = 0; i < entries.length; i++) {
          const e = entries[i];
          expect(e.sourceUrl, `${market}.${key}[${i}] sourceUrl`).toMatch(/^https:\/\//);
          expect(e.verifiedAt, `${market}.${key}[${i}] verifiedAt`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
          if (i > 0) {
            // NOTE: vitest's toBeLessThanOrEqual requires number|bigint (see
            // @vitest/expect assertTypes) and throws on ISO-date strings, so
            // the window-overlap check below asserts the same string
            // comparison as a boolean instead of using that matcher directly.
            expect(
              (entries[i - 1].effectiveTo ?? '9999') <= e.effectiveFrom,
              `${market}.${key} overlap`
            ).toBe(true);
            expect(entries[i - 1].effectiveFrom < e.effectiveFrom).toBe(true);
          }
        }
      }
    }
  });
});
