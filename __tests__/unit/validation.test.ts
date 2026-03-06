// __tests__/unit/validation.test.ts
// Tests central Zod schemas and validate() helper from lib/validation/index.ts
//
// We test schemas directly via .safeParse() (Zod v4 compatible in Node/vitest)
// and the validate() helper separately. Both guard every API route.

import { describe, it, expect } from 'vitest';
import {
  TrackSchema,
  TrackCtaSchema,
  SubscribeSchema,
  WebVitalsSchema,
  VALID_MARKETS,
  assertValidMarket,
} from '@/lib/validation';

// ─────────────────────────────────────────────────────────────────────────────
// VALID_MARKETS constant
// ─────────────────────────────────────────────────────────────────────────────
describe('VALID_MARKETS', () => {
  it('contains exactly the 4 expected markets in correct order', () => {
    expect([...VALID_MARKETS]).toEqual(['us', 'uk', 'ca', 'au']);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// assertValidMarket
// ─────────────────────────────────────────────────────────────────────────────
describe('assertValidMarket()', () => {
  it.each(['us', 'uk', 'ca', 'au'])('returns true for "%s"', (market) => {
    expect(assertValidMarket(market)).toBe(true);
  });

  it.each(['de', 'fr', 'eu', 'US', 'UK', ''])('returns false for "%s"', (market) => {
    expect(assertValidMarket(market)).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TrackSchema  (POST /api/track)
// ─────────────────────────────────────────────────────────────────────────────
describe('TrackSchema', () => {
  it('accepts a valid pageview payload', () => {
    const r = TrackSchema.safeParse({
      type: 'pageview',
      sessionId: 'sess-abc-12345678',
      data: { pagePath: '/trading/etoro' },
    });
    expect(r.success).toBe(true);
  });

  it('accepts all four valid event types', () => {
    const types = ['pageview', 'event', 'scroll', 'time_on_page'] as const;
    for (const type of types) {
      const r = TrackSchema.safeParse({ type, sessionId: '12345678', data: {} });
      expect(r.success).toBe(true);
    }
  });

  it('defaults data to {} when omitted', () => {
    const r = TrackSchema.safeParse({ type: 'event', sessionId: '12345678' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.data).toEqual({});
  });

  it('rejects an unknown event type', () => {
    const r = TrackSchema.safeParse({ type: 'click', sessionId: '12345678', data: {} });
    expect(r.success).toBe(false);
  });

  it('rejects sessionId shorter than 8 characters', () => {
    const r = TrackSchema.safeParse({ type: 'pageview', sessionId: 'short', data: {} });
    expect(r.success).toBe(false);
  });

  it('rejects sessionId longer than 128 characters', () => {
    const r = TrackSchema.safeParse({
      type: 'pageview',
      sessionId: 'x'.repeat(129),
      data: {},
    });
    expect(r.success).toBe(false);
  });

  it('rejects missing type field', () => {
    const r = TrackSchema.safeParse({ sessionId: '12345678', data: {} });
    expect(r.success).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TrackCtaSchema  (POST /api/track-cta)
// ─────────────────────────────────────────────────────────────────────────────
describe('TrackCtaSchema', () => {
  it('accepts a valid slug + provider', () => {
    const r = TrackCtaSchema.safeParse({
      slug: 'trading/forex/etoro-review',
      provider: 'eToro',
    });
    expect(r.success).toBe(true);
  });

  it('accepts a slug with hyphens, underscores and numbers', () => {
    const r = TrackCtaSchema.safeParse({
      slug: 'uk/personal-finance/best-savings-accounts-2026',
      provider: 'Marcus',
    });
    expect(r.success).toBe(true);
  });

  it('rejects a slug with uppercase letters', () => {
    const r = TrackCtaSchema.safeParse({ slug: 'Trading/eToro', provider: 'eToro' });
    expect(r.success).toBe(false);
  });

  it('rejects an empty slug', () => {
    const r = TrackCtaSchema.safeParse({ slug: '', provider: 'eToro' });
    expect(r.success).toBe(false);
  });

  it('rejects a slug with spaces', () => {
    const r = TrackCtaSchema.safeParse({ slug: 'trading etoro', provider: 'eToro' });
    expect(r.success).toBe(false);
  });

  it('rejects an invalid market code', () => {
    const r = TrackCtaSchema.safeParse({ slug: 'trading/etoro', provider: 'eToro', market: 'de' });
    expect(r.success).toBe(false);
  });

  it('accepts all valid market codes', () => {
    for (const market of VALID_MARKETS) {
      const r = TrackCtaSchema.safeParse({ slug: 'trading/etoro', provider: 'eToro', market });
      expect(r.success).toBe(true);
    }
  });

  it('defaults variant to "primary" when omitted', () => {
    const r = TrackCtaSchema.safeParse({ slug: 'trading/etoro', provider: 'eToro' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.variant).toBe('primary');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SubscribeSchema  (POST /api/subscribe)
// ─────────────────────────────────────────────────────────────────────────────
describe('SubscribeSchema', () => {
  it('accepts a valid email', () => {
    const r = SubscribeSchema.safeParse({ email: 'user@example.com' });
    expect(r.success).toBe(true);
  });

  it('lowercases the email via transform (clean input without spaces)', () => {
    // Note: Zod validates email format BEFORE running transforms.
    // Input must be a structurally valid email first.
    const r = SubscribeSchema.safeParse({ email: 'USER@Example.COM' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.email).toBe('user@example.com');
  });

  it('rejects an email with leading/trailing spaces (email() validates first)', () => {
    // Zod email() validator runs BEFORE transform — spaces make it invalid.
    // Clients must trim before sending to the API.
    const r = SubscribeSchema.safeParse({ email: '  user@example.com  ' });
    expect(r.success).toBe(false);
  });

  it('rejects an invalid email address', () => {
    const r = SubscribeSchema.safeParse({ email: 'not-an-email' });
    expect(r.success).toBe(false);
  });

  it('rejects an email without a domain', () => {
    const r = SubscribeSchema.safeParse({ email: 'user@' });
    expect(r.success).toBe(false);
  });

  it('rejects missing email field', () => {
    const r = SubscribeSchema.safeParse({ leadMagnet: 'guide' });
    expect(r.success).toBe(false);
  });

  it('accepts optional leadMagnet, source and market fields', () => {
    const r = SubscribeSchema.safeParse({
      email: 'test@test.com',
      leadMagnet: 'trading-guide',
      source: '/uk/trading',
      market: 'uk',
    });
    expect(r.success).toBe(true);
  });

  it('rejects email longer than 254 characters', () => {
    const r = SubscribeSchema.safeParse({ email: 'a'.repeat(250) + '@b.com' });
    expect(r.success).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// WebVitalsSchema  (POST /api/web-vitals)
// ─────────────────────────────────────────────────────────────────────────────
describe('WebVitalsSchema', () => {
  it('accepts a valid LCP metric (uppercase)', () => {
    const r = WebVitalsSchema.safeParse({ name: 'LCP', value: 1800 });
    expect(r.success).toBe(true);
  });

  it('accepts lowercase metric names', () => {
    const r = WebVitalsSchema.safeParse({ name: 'cls', value: 0.08 });
    expect(r.success).toBe(true);
  });

  it.each(['LCP', 'INP', 'CLS', 'FCP', 'TTFB', 'FID'])(
    'accepts the standard metric "%s"',
    (name) => {
      const r = WebVitalsSchema.safeParse({ name, value: 100 });
      expect(r.success).toBe(true);
    },
  );

  it('rejects an unknown metric name', () => {
    const r = WebVitalsSchema.safeParse({ name: 'TBT', value: 200 });
    expect(r.success).toBe(false);
  });

  it('rejects a negative value', () => {
    const r = WebVitalsSchema.safeParse({ name: 'LCP', value: -1 });
    expect(r.success).toBe(false);
  });

  it('rejects a non-finite value (Infinity)', () => {
    const r = WebVitalsSchema.safeParse({ name: 'LCP', value: Infinity });
    expect(r.success).toBe(false);
  });

  it('accepts a zero value (CLS = 0 is perfect)', () => {
    const r = WebVitalsSchema.safeParse({ name: 'CLS', value: 0 });
    expect(r.success).toBe(true);
  });

  it('accepts optional rating field', () => {
    const r = WebVitalsSchema.safeParse({ name: 'LCP', value: 2400, rating: 'needs-improvement' });
    expect(r.success).toBe(true);
  });

  it('rejects an invalid rating value', () => {
    const r = WebVitalsSchema.safeParse({ name: 'LCP', value: 2400, rating: 'average' });
    expect(r.success).toBe(false);
  });

  it('rejects missing name field', () => {
    const r = WebVitalsSchema.safeParse({ value: 1500 });
    expect(r.success).toBe(false);
  });
});
