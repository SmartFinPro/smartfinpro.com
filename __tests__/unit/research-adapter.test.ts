// __tests__/unit/research-adapter.test.ts
// P5 adapter tests — buildResearchView: status-aware, deterministic ordering
// over Cockpit rows. Fixtures only (no DB). Covers the five step-2 criteria:
//   • only `audited` gets a score + rank
//   • ties resolve deterministically
//   • provisional / unavailable are never ranked
//   • invalid data degrades, no product is ever lost
//   • Merrill Edge (no review) is handled — audited & rankable, reviewHref null

import { describe, it, expect } from 'vitest';
import type { FieldSource, FilterKey, ProductForComparison } from '@/lib/comparison/types';
import { buildResearchView } from '@/lib/research/adapter';

const REQUIRED = ['optionsFee', 'minDeposit', 'extendedHours', 'tradingview'] as const;

const src = (over: Partial<FieldSource> = {}): FieldSource => ({
  sourceUrl: 'https://example.com/pricing',
  sourceType: 'official',
  verifiedAt: '2026-07-03',
  ...over,
});
const fullSources = (): Record<string, FieldSource> =>
  Object.fromEntries(REQUIRED.map((k) => [k, src()]));

const FLAGS: Record<FilterKey, boolean> = {
  noMonthly: false,
  freeAtm: false,
  noFx: false,
  cashback: false,
  bonus: false,
  subAccounts: false,
  interest: false,
  applePay: false,
};

/** Full ProductForComparison fixture — sane defaults, override what a test needs. */
function makeProduct(over: Partial<ProductForComparison> = {}): ProductForComparison {
  return {
    slug: 'provider',
    displayName: 'Provider',
    initial: 'P',
    tagline: '',
    logoUrl: null,
    verified: true,
    score: 8,
    rating: 0,
    reviewCount: 0,
    monthlyFee: 0,
    signupBonus: 0,
    fxFeePct: 0,
    atmFee: 0,
    apy: 0,
    clicks: 0,
    badges: [],
    chips: [],
    pros: [],
    cons: [],
    subScores: { pricing: 9 },
    effectiveApr: null,
    cashback: null,
    cardNetwork: null,
    wireTransfers: null,
    fdicCoverage: null,
    apps: [],
    verdict: null,
    flags: FLAGS,
    entityTypes: [],
    supportsCashDeposits: false,
    supportsIntlWires: false,
    hasBookkeeping: false,
    hasLending: false,
    hasSubAccounts: false,
    integrations: [],
    ctaMode: 'review',
    reviewSlug: 'provider-review',
    externalUrl: null,
    isTopPick: false,
    bestFor: null,
    displayOrder: 0,
    topic: 'trading-platforms',
    managementFee: 0,
    accountMinimum: 0,
    attributes: {},
    deepDive: null,
    sourceType: 'official',
    confidence: 'high',
    sourceUrl: 'https://example.com',
    dataVerifiedAt: '2026-07-03',
    offerAttribution: null,
    // Research-layer provenance (optional) — audited-complete by default.
    researchStatus: 'audited',
    methodologyVersion: 'trading-platforms-v1',
    confidenceReason: 'Verified against official pages.',
    fieldSources: fullSources(),
    market: 'us',
    category: 'trading',
    ...over,
  };
}

describe('buildResearchView — status tiers & ranking', () => {
  const products = [
    makeProduct({ slug: 'etoro', score: 9.0, reviewSlug: 'etoro-review' }), // audited
    makeProduct({ slug: 'fidelity', score: 9.4, isTopPick: true, reviewSlug: 'fidelity-review' }), // audited #1
    makeProduct({
      slug: 'robinhood',
      score: 8.6,
      reviewSlug: 'robinhood-review',
      fieldSources: (() => {
        const s = fullSources();
        delete s.tradingview; // missing required source → provisional
        return s;
      })(),
    }),
    makeProduct({ slug: 'webull', score: 8.9, researchStatus: 'unavailable' }), // hard-suppress
    makeProduct({ slug: 'merrill-edge', score: 8.8, reviewSlug: null }), // audited, no review
  ];

  const view = buildResearchView(products, REQUIRED);

  it('never loses a product', () => {
    expect(view).toHaveLength(products.length);
    expect(new Set(view.map((r) => r.product.slug))).toEqual(
      new Set(['etoro', 'fidelity', 'robinhood', 'webull', 'merrill-edge']),
    );
  });

  it('orders audited first, then provisional, then unavailable', () => {
    const statuses = view.map((r) => r.research.status);
    const firstProvisional = statuses.indexOf('provisional');
    const firstUnavailable = statuses.indexOf('unavailable');
    const lastAudited = statuses.lastIndexOf('audited');
    expect(lastAudited).toBeLessThan(firstProvisional);
    expect(firstProvisional).toBeLessThan(firstUnavailable);
  });

  it('ranks only audited products, by BEST-X score desc', () => {
    const audited = view.filter((r) => r.research.status === 'audited');
    expect(audited.map((r) => r.product.slug)).toEqual(['fidelity', 'etoro', 'merrill-edge']);
    expect(audited.map((r) => r.rank)).toEqual([1, 2, 3]);
    expect(audited.map((r) => r.displayScore)).toEqual([9.4, 9.0, 8.8]);
  });

  it('never ranks or scores provisional / unavailable', () => {
    for (const r of view.filter((x) => x.research.status !== 'audited')) {
      expect(r.rank).toBeNull();
      expect(r.displayScore).toBeNull();
    }
  });

  it('handles Merrill Edge (no review): audited & ranked, reviewHref null', () => {
    const merrill = view.find((r) => r.product.slug === 'merrill-edge')!;
    expect(merrill.research.status).toBe('audited');
    expect(merrill.rank).toBe(3);
    expect(merrill.reviewHref).toBeNull();
  });

  it('builds internal review hrefs for products that have a review', () => {
    const fidelity = view.find((r) => r.product.slug === 'fidelity')!;
    expect(fidelity.reviewHref).toBe('/us/trading/fidelity-review');
  });
});

describe('buildResearchView — deterministic tie-breaking', () => {
  it('breaks equal scores by top-pick, then slug', () => {
    const products = [
      makeProduct({ slug: 'zebra', score: 9.0, isTopPick: false, reviewSlug: 'zebra-review' }),
      makeProduct({ slug: 'alpha', score: 9.0, isTopPick: false, reviewSlug: 'alpha-review' }),
      makeProduct({ slug: 'omega', score: 9.0, isTopPick: true, reviewSlug: 'omega-review' }),
    ];
    const view = buildResearchView(products, REQUIRED);
    // omega (top-pick) first; then alpha < zebra by slug.
    expect(view.map((r) => r.product.slug)).toEqual(['omega', 'alpha', 'zebra']);
    expect(view.map((r) => r.rank)).toEqual([1, 2, 3]);
  });

  it('is deterministic regardless of input order', () => {
    const base = [
      makeProduct({ slug: 'alpha', score: 9.0, reviewSlug: 'a' }),
      makeProduct({ slug: 'omega', score: 9.0, isTopPick: true, reviewSlug: 'o' }),
      makeProduct({ slug: 'zebra', score: 9.0, reviewSlug: 'z' }),
    ];
    const a = buildResearchView(base, REQUIRED).map((r) => r.product.slug);
    const b = buildResearchView([...base].reverse(), REQUIRED).map((r) => r.product.slug);
    expect(a).toEqual(b);
  });
});

describe('buildResearchView — degradation without loss', () => {
  it('an out-of-range score becomes unavailable but stays in the view', () => {
    const view = buildResearchView([makeProduct({ slug: 'broken', score: 42 })], REQUIRED);
    expect(view).toHaveLength(1);
    expect(view[0].research.status).toBe('unavailable');
    expect(view[0].rank).toBeNull();
    expect(view[0].displayScore).toBeNull();
  });

  it('an empty field returns an empty view (no throw)', () => {
    expect(buildResearchView([], REQUIRED)).toEqual([]);
  });
});
