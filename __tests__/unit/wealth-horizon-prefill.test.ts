// __tests__/unit/wealth-horizon-prefill.test.ts
// FDL 4.4 — pure mapping tests for lib/decision/wealth-horizon-prefill.ts.

import { describe, it, expect } from 'vitest';
import { buildWealthHorizonPrefill, bandMidpoint } from '@/lib/decision/wealth-horizon-prefill';
import { encodeShare, decodeShare } from '@/lib/decision/share-codec';
import { toInputBucket } from '@/lib/analytics/tool-events';
import type { SharePayload } from '@/lib/decision/share-codec';

function payload(t: SharePayload['t'], i: SharePayload['i']): SharePayload {
  return { v: 1, t, i };
}

describe('bandMidpoint()', () => {
  it('parses a range band to its midpoint', () => {
    expect(bandMidpoint('1000-2500')).toBe(1750);
  });
  it('parses an "lt" band to half the edge', () => {
    expect(bandMidpoint('lt100')).toBe(50);
  });
  it('parses a "gte" band to the edge itself', () => {
    expect(bandMidpoint('gte1000000')).toBe(1_000_000);
  });
  it('returns null for "invalid"', () => {
    expect(bandMidpoint('invalid')).toBeNull();
  });
  it('returns null for a malformed string', () => {
    expect(bandMidpoint('not-a-band')).toBeNull();
  });
});

describe('buildWealthHorizonPrefill() — source tool gating', () => {
  it('returns null for a wealth-horizon-sourced payload (this bridge is widgets → WH only)', () => {
    const p = payload('wealth-horizon', { ageBand: '30-40' });
    expect(buildWealthHorizonPrefill(p)).toBeNull();
  });

  it('returns null for an unrelated tool', () => {
    const p = payload('debt-payoff', { ageBand: '30-40' } as SharePayload['i']);
    expect(buildWealthHorizonPrefill(p)).toBeNull();
  });

  it('returns null when no usable fields are present', () => {
    const p = payload('superannuation', {});
    expect(buildWealthHorizonPrefill(p)).toBeNull();
  });
});

describe('buildWealthHorizonPrefill() — superannuation source', () => {
  it('maps ageBand + balanceBand + contributionBand onto currentAge/startingAmount/monthlyContribution', () => {
    const p = payload('superannuation', {
      ageBand: toInputBucket(35, 'years'),
      balanceBand: toInputBucket(150_000, 'currency'),
      contributionBand: toInputBucket(500, 'currency'),
    });
    const prefill = buildWealthHorizonPrefill(p);
    expect(prefill).not.toBeNull();
    expect(prefill!.currentAge).toBeGreaterThanOrEqual(18);
    expect(prefill!.currentAge).toBeLessThanOrEqual(80);
    expect(prefill!.startingAmount).toBeGreaterThan(0);
    expect(prefill!.monthlyContribution).toBeGreaterThan(0);
    // every mapped value is representable on the WH slider it lands on
    expect(prefill!.startingAmount! % 1_000).toBe(0);
    expect(prefill!.monthlyContribution! % 50).toBe(0);
  });

  it('clamps startingAmount to the WH slider max (0–1,000,000)', () => {
    const p = payload('superannuation', { balanceBand: 'gte1000000' });
    const prefill = buildWealthHorizonPrefill(p);
    expect(prefill!.startingAmount).toBe(1_000_000);
  });

  it('clamps monthlyContribution to the WH slider max (0–5,000)', () => {
    const p = payload('superannuation', { contributionBand: 'gte1000000' });
    const prefill = buildWealthHorizonPrefill(p);
    expect(prefill!.monthlyContribution).toBe(5_000);
  });
});

describe('buildWealthHorizonPrefill() — tfsa-rrsp source (no monthly-contribution field on that widget)', () => {
  it('maps only ageBand + balanceBand — never sets monthlyContribution', () => {
    const p = payload('tfsa-rrsp', {
      ageBand: toInputBucket(45, 'years'),
      balanceBand: toInputBucket(30_000, 'currency'),
    });
    const prefill = buildWealthHorizonPrefill(p);
    expect(prefill).not.toBeNull();
    expect(prefill!.currentAge).toBeDefined();
    expect(prefill!.startingAmount).toBeDefined();
    expect(prefill!.monthlyContribution).toBeUndefined();
  });
});

describe('buildWealthHorizonPrefill() — isa source (no age/balance field on that widget)', () => {
  it('maps only contributionBand — never sets currentAge or startingAmount', () => {
    const p = payload('isa', { contributionBand: toInputBucket(833, 'currency') });
    const prefill = buildWealthHorizonPrefill(p);
    expect(prefill).not.toBeNull();
    expect(prefill!.monthlyContribution).toBeDefined();
    expect(prefill!.currentAge).toBeUndefined();
    expect(prefill!.startingAmount).toBeUndefined();
  });
});

describe('end-to-end: encodeShare → decodeShare → buildWealthHorizonPrefill', () => {
  it('a superannuation widget share link prefills Wealth Horizon without ever carrying the raw balance', () => {
    const encoded = encodeShare('superannuation', {
      ageBand: toInputBucket(50, 'years'),
      balanceBand: toInputBucket(420_000, 'currency'),
      contributionBand: toInputBucket(1_200, 'currency'),
    });
    expect(encoded).not.toBeNull();
    expect(encoded).not.toContain('420000');

    const decoded = decodeShare(encoded!);
    expect(decoded).not.toBeNull();

    const prefill = buildWealthHorizonPrefill(decoded!);
    expect(prefill).not.toBeNull();
    expect(prefill!.startingAmount).toBeGreaterThan(0);
  });
});
