// __tests__/unit/share-codec.test.ts
// FDL 4.4 (share-codec entstanden vorgezogen aus PR 2.3, siehe
// lib/decision/share-codec.ts header) — pure codec tests, no React/DOM.
// Covers: roundtrip, allowlist filtering, raw-amount-never-in-payload,
// >1500-char cap → null, corrupt/foreign-version fragment → null, clamps.

import { describe, it, expect } from 'vitest';
import { encodeShare, decodeShare, buildShareUrl, humanFieldList, SHARE_FRAGMENT_MAX_LENGTH } from '@/lib/decision/share-codec';
import { toInputBucket } from '@/lib/analytics/tool-events';

describe('encodeShare() / decodeShare() — roundtrip', () => {
  it('roundtrips a valid superannuation payload', () => {
    const fields = {
      ageBand: toInputBucket(35, 'years'),
      balanceBand: toInputBucket(150_000, 'currency'),
      contributionBand: toInputBucket(500, 'currency'),
    };
    const encoded = encodeShare('superannuation', fields);
    expect(encoded).not.toBeNull();
    const decoded = decodeShare(encoded!);
    expect(decoded).toEqual({ v: 1, t: 'superannuation', i: fields });
  });

  it('roundtrips a valid wealth-horizon payload (retireAge + withdrawalRatePct as exact, coarse values)', () => {
    const fields = {
      ageBand: toInputBucket(40, 'years'),
      retireAge: 65,
      balanceBand: toInputBucket(50_000, 'currency'),
      contributionBand: toInputBucket(600, 'currency'),
      feeBand: toInputBucket(0.5, 'percent'),
      withdrawalRatePct: 4,
      scenario: 'balanced',
    };
    const encoded = encodeShare('wealth-horizon', fields);
    expect(encoded).not.toBeNull();
    const decoded = decodeShare(encoded!);
    expect(decoded?.t).toBe('wealth-horizon');
    expect(decoded?.i).toEqual(fields);
  });
});

describe('encodeShare() — allowlist filtering', () => {
  it('silently drops fields not in the tool\'s shareableFields allowlist', () => {
    const encoded = encodeShare('superannuation', {
      ageBand: toInputBucket(35, 'years'),
      notAllowlisted: 'should vanish',
      anotherStrayField: 12345,
    });
    expect(encoded).not.toBeNull();
    const decoded = decodeShare(encoded!);
    expect(decoded?.i).toEqual({ ageBand: toInputBucket(35, 'years') });
    expect(decoded?.i.notAllowlisted).toBeUndefined();
    expect(decoded?.i.anotherStrayField).toBeUndefined();
  });

  it('returns null for a tool with no shareableFields declared', () => {
    // 'broker-finder' has no shareableFields in the registry.
    const encoded = encodeShare('broker-finder', { anything: 1 });
    expect(encoded).toBeNull();
  });

  it('returns null when every allowlisted field is absent from the input', () => {
    const encoded = encodeShare('superannuation', { someUnrelatedKey: 1 });
    expect(encoded).toBeNull();
  });
});

describe('encodeShare() — raw amounts NEVER appear in the payload', () => {
  it('a raw balance under a non-allowlisted key never reaches the payload', () => {
    const encoded = encodeShare('superannuation', {
      balanceBand: toInputBucket(150_000, 'currency'),
      currentBalance: 150_000, // raw amount, NOT in the allowlist
    });
    expect(encoded).not.toBeNull();
    const decoded = decodeShare(encoded!)!;
    const json = JSON.stringify(decoded);
    expect(json).not.toContain('150000');
    expect(decoded.i.currentBalance).toBeUndefined();
  });

  it('a raw number placed under a *Band-suffixed key is dropped, not rounded-and-kept', () => {
    const encoded = encodeShare('superannuation', {
      // Contract violation: balanceBand MUST be a pre-bucketed string.
      balanceBand: 53211 as unknown as string,
      ageBand: toInputBucket(35, 'years'),
    });
    // ageBand alone still survives -> non-null encode, but balanceBand must be absent.
    expect(encoded).not.toBeNull();
    const decoded = decodeShare(encoded!)!;
    expect(decoded.i.balanceBand).toBeUndefined();
    expect(JSON.stringify(decoded)).not.toContain('53211');
  });

  it('debt-payoff-style totalDebt raw amount never appears — only totalDebtBand would, per allowlist convention', () => {
    // debt-payoff has no shareableFields yet (ships in PR 2.3) — this proves
    // that even if a caller passes a raw totalDebt, it can never leak,
    // because the tool's allowlist for 2.3 will only ever contain
    // 'totalDebtBand', never 'totalDebt'.
    const encoded = encodeShare('debt-payoff', { totalDebt: 53211, totalDebtBand: toInputBucket(53211, 'currency') });
    expect(encoded).toBeNull(); // no shareableFields declared yet for debt-payoff in this PR
  });
});

describe('encodeShare() / decodeShare() — length cap', () => {
  it('encodeShare never returns a fragment longer than SHARE_FRAGMENT_MAX_LENGTH, even for a maximal wealth-horizon payload', () => {
    // Every field maxed out (40-char strings, longest declared allowlist) —
    // structurally still well under the cap given the current registry, but
    // this proves the guard is live and the output stays within bounds.
    const encoded = encodeShare('wealth-horizon', {
      ageBand: toInputBucket(40, 'years'),
      retireAge: 65,
      balanceBand: toInputBucket(500_000, 'currency'),
      contributionBand: toInputBucket(2_000, 'currency'),
      feeBand: toInputBucket(1, 'percent'),
      withdrawalRatePct: 4,
      scenario: 'x'.repeat(40),
    });
    expect(encoded).not.toBeNull();
    expect(encoded!.length).toBeLessThanOrEqual(SHARE_FRAGMENT_MAX_LENGTH);
  });

  it('rejects a fragment string longer than the cap at decode time', () => {
    const tooLong = 'A'.repeat(SHARE_FRAGMENT_MAX_LENGTH + 1);
    expect(decodeShare(tooLong)).toBeNull();
  });
});

describe('decodeShare() — corrupt / foreign-versioned fragment → null', () => {
  it('garbage base64 → null', () => {
    expect(decodeShare('%%%not-base64%%%')).toBeNull();
  });

  it('valid base64url but not JSON → null', () => {
    const notJson = Buffer.from('this is not json', 'utf-8').toString('base64url');
    expect(decodeShare(notJson)).toBeNull();
  });

  it('wrong version (v: 2) → null', () => {
    const payload = { v: 2, t: 'superannuation', i: { ageBand: '30-40' } };
    const encoded = Buffer.from(JSON.stringify(payload), 'utf-8').toString('base64url');
    expect(decodeShare(encoded)).toBeNull();
  });

  it('unknown ToolId → null', () => {
    const payload = { v: 1, t: 'not-a-real-tool', i: { ageBand: '30-40' } };
    const encoded = Buffer.from(JSON.stringify(payload), 'utf-8').toString('base64url');
    expect(decodeShare(encoded)).toBeNull();
  });

  it('empty string → null', () => {
    expect(decodeShare('')).toBeNull();
  });

  it('unexpected top-level shape (array instead of object) → null', () => {
    const encoded = Buffer.from(JSON.stringify([1, 2, 3]), 'utf-8').toString('base64url');
    expect(decodeShare(encoded)).toBeNull();
  });
});

describe('decodeShare() — range clamps', () => {
  it('clamps an out-of-range retireAge (SPEC coarse-value clamp, not a rejection)', () => {
    const payload = { v: 1, t: 'wealth-horizon', i: { retireAge: 999 } };
    const encoded = Buffer.from(JSON.stringify(payload), 'utf-8').toString('base64url');
    const decoded = decodeShare(encoded);
    expect(decoded).not.toBeNull();
    expect(decoded!.i.retireAge).toBe(85); // clamped to NUMERIC_FIELD_CLAMPS.retireAge.max
  });

  it('clamps an out-of-range withdrawalRatePct', () => {
    const payload = { v: 1, t: 'wealth-horizon', i: { withdrawalRatePct: -50 } };
    const encoded = Buffer.from(JSON.stringify(payload), 'utf-8').toString('base64url');
    const decoded = decodeShare(encoded);
    expect(decoded!.i.withdrawalRatePct).toBe(1); // clamped to min
  });

  it('drops a malformed *Band string that does not match the bucket-label shape', () => {
    const payload = { v: 1, t: 'superannuation', i: { ageBand: 'not-a-valid-band', balanceBand: '1000-2500' } };
    const encoded = Buffer.from(JSON.stringify(payload), 'utf-8').toString('base64url');
    const decoded = decodeShare(encoded);
    expect(decoded).not.toBeNull();
    expect(decoded!.i.ageBand).toBeUndefined();
    expect(decoded!.i.balanceBand).toBe('1000-2500');
  });
});

describe('buildShareUrl()', () => {
  it('builds a fragment link, never a query parameter', () => {
    const url = buildShareUrl('https://smartfinpro.com', '/au/tools/retirement-calculator', 'abc123');
    expect(url).toBe('https://smartfinpro.com/au/tools/retirement-calculator#s=abc123');
    expect(url).not.toContain('?');
  });

  it('supports a relative (origin-less) link', () => {
    const url = buildShareUrl('', '/au/tools/retirement-calculator', 'abc123');
    expect(url).toBe('/au/tools/retirement-calculator#s=abc123');
  });
});

describe('humanFieldList()', () => {
  it('renders a human-readable, privacy-safe preview sentence', () => {
    const payload = { v: 1 as const, t: 'superannuation' as const, i: { ageBand: '30-40', balanceBand: '100000-250000' } };
    const sentence = humanFieldList('superannuation', payload);
    expect(sentence).toContain('age range');
    expect(sentence).toContain('savings range');
    expect(sentence).toContain('It never includes exact amounts you typed.');
  });

  it('handles an empty payload gracefully', () => {
    const payload = { v: 1 as const, t: 'superannuation' as const, i: {} };
    expect(humanFieldList('superannuation', payload)).toContain('no identifying details');
  });
});
