import { describe, expect, it } from 'vitest';
import { buildDecisionBridgeData } from '@/lib/comparison/bridge';
import type { BestXManifestEntry } from '@/lib/comparison/topics/manifest';
import type { ProductForComparison } from '@/lib/comparison/types';

// Minimal-but-complete ProductForComparison factory — bridge.ts only reads a
// handful of these fields, but the type has no optional properties, so every
// fixture needs the full shape.
function makeProduct(overrides: Partial<ProductForComparison> & { slug: string; displayName: string }): ProductForComparison {
  return {
    initial: overrides.displayName.charAt(0).toUpperCase(),
    tagline: '',
    logoUrl: null,
    verified: true,
    score: 8,
    rating: 4.5,
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
    subScores: {},
    effectiveApr: null,
    cashback: null,
    cardNetwork: null,
    wireTransfers: null,
    fdicCoverage: null,
    apps: [],
    verdict: null,
    flags: {
      noMonthly: false,
      freeAtm: false,
      noFx: false,
      cashback: false,
      bonus: false,
      subAccounts: false,
      interest: false,
      applePay: false,
    },
    entityTypes: [],
    supportsCashDeposits: false,
    supportsIntlWires: false,
    hasBookkeeping: false,
    hasLending: false,
    hasSubAccounts: false,
    integrations: [],
    ctaMode: 'review',
    reviewSlug: null,
    externalUrl: null,
    isTopPick: false,
    bestFor: null,
    displayOrder: 0,
    topic: 'trading-platforms',
    managementFee: 0,
    accountMinimum: 0,
    attributes: {},
    deepDive: null,
    sourceType: null,
    confidence: null,
    sourceUrl: null,
    dataVerifiedAt: null,
    offerAttribution: null,
    market: 'us',
    category: 'trading',
    ...overrides,
  };
}

const tradingEntry: BestXManifestEntry = {
  market: 'us',
  category: 'trading',
  topic: 'trading-platforms',
  label: 'Best Trading Platforms',
  blurb: '',
  icon: 'TrendingUp',
  image: '',
};

const legacyEntry: BestXManifestEntry = {
  market: 'us',
  category: 'trading',
  topic: 'old-engine',
  label: 'Best Old Engine',
  blurb: '',
  icon: 'TrendingUp',
  image: '',
  legacy: true,
};

// A second, unregistered topic used to prove "invalid override" falls
// through to auto-resolution instead of failing.
const secondEntry: BestXManifestEntry = {
  market: 'us',
  category: 'personal-finance',
  topic: 'robo-advisors',
  label: 'Best Robo-Advisors',
  blurb: '',
  icon: 'Sparkles',
  image: '',
};

const nineProducts: ProductForComparison[] = [
  makeProduct({ slug: 'fidelity', displayName: 'Fidelity', score: 9.6, reviewSlug: 'fidelity-review', sourceType: 'official', confidence: 'high', dataVerifiedAt: '2026-07-01' }),
  makeProduct({ slug: 'schwab', displayName: 'Charles Schwab', score: 9.3, reviewSlug: 'schwab-review', sourceType: 'official', confidence: 'high', dataVerifiedAt: '2026-06-15' }),
  makeProduct({ slug: 'ibkr', displayName: 'Interactive Brokers', score: 9.2, reviewSlug: null, sourceType: 'editorial', confidence: 'medium', dataVerifiedAt: null }),
  makeProduct({ slug: 'p4', displayName: 'Provider 4', score: 9.0 }),
  makeProduct({ slug: 'p5', displayName: 'Provider 5', score: 8.9 }),
  makeProduct({ slug: 'p6', displayName: 'Provider 6', score: 8.6 }),
  makeProduct({ slug: 'p7', displayName: 'Provider 7', score: 8.5 }),
  makeProduct({
    slug: 'etoro',
    displayName: 'eToro',
    score: 8.3,
    reviewSlug: 'etoro-review',
    subScores: { fees: 8.8, ux: 8.4, support: 7.8, features: 8.0 },
    confidence: 'low',
    sourceType: 'user_reviews',
    dataVerifiedAt: '2026-07-03',
  }),
  makeProduct({ slug: 'merrill', displayName: 'Merrill Edge', score: 8.0, reviewSlug: null, sourceType: 'official', confidence: 'medium', dataVerifiedAt: '2026-05-20' }),
];

describe('buildDecisionBridgeData', () => {
  it('resolves state A via product-match (reviewSlug hits) — rank/leader/spread match the field exactly', () => {
    const map = new Map([[tradingEntry.topic, nineProducts]]);
    const result = buildDecisionBridgeData([tradingEntry], map, 'etoro-review');

    expect(result).not.toBeNull();
    expect(result!.fieldCount).toBe(9);
    expect(result!.leader).toEqual({ name: 'Fidelity', score: 9.6 });
    expect(result!.scoreMin).toBeCloseTo(8.0);
    expect(result!.scoreMax).toBeCloseTo(9.6);
    expect(result!.position).not.toBeNull();
    expect(result!.position!.rank).toBe(8); // index 7 + 1, same order as getCockpitData
    expect(result!.position!.name).toBe('eToro');
    expect(result!.position!.slug).toBe('etoro');
    expect(result!.field).toHaveLength(9);
    expect(result!.field[7].isYou).toBe(true);
    expect(result!.field.filter((f) => f.isYou)).toHaveLength(1);
  });

  it('aggregates fieldBestSubScores as the max per key across the whole field', () => {
    const products = [
      makeProduct({ slug: 'a', displayName: 'A', score: 9, subScores: { fees: 9, ux: 5 } }),
      makeProduct({ slug: 'b', displayName: 'B', score: 8, reviewSlug: 'b-review', subScores: { fees: 4, ux: 9.5 } }),
    ];
    const map = new Map([[tradingEntry.topic, products]]);
    const result = buildDecisionBridgeData([tradingEntry], map, 'b-review');
    expect(result!.fieldBestSubScores).toEqual({ fees: 9, ux: 9.5 });
  });

  it('confidenceMix counts high/medium/low across the field and ignores null confidences', () => {
    const map = new Map([[tradingEntry.topic, nineProducts]]);
    const result = buildDecisionBridgeData([tradingEntry], map, 'nonexistent-slug');
    // high: fidelity, schwab, merrill(medium)... recompute precisely from fixtures:
    // high: fidelity, schwab (2) | medium: ibkr, merrill (2) | low: etoro (1) | null: p4-p7 (4, uncounted)
    expect(result!.confidenceMix).toEqual({ high: 2, medium: 2, low: 1 });
  });

  it('officialSourceCount counts only sourceType === "official"; lastVerified is the max dataVerifiedAt', () => {
    const map = new Map([[tradingEntry.topic, nineProducts]]);
    const result = buildDecisionBridgeData([tradingEntry], map, 'nonexistent-slug');
    expect(result!.officialSourceCount).toBe(3); // fidelity, schwab, merrill
    expect(result!.lastVerified).toBe('2026-07-03'); // etoro's date is the latest
  });

  it('no product-match, single non-legacy topic with data → state B (position null, rest populated)', () => {
    const map = new Map([[tradingEntry.topic, nineProducts]]);
    const result = buildDecisionBridgeData([tradingEntry, legacyEntry], map, 'no-such-review-slug');
    expect(result).not.toBeNull();
    expect(result!.position).toBeNull();
    expect(result!.fieldCount).toBe(9);
  });

  it('ambiguous market/category (2+ non-legacy topics with data), no match → null', () => {
    const otherProducts = [makeProduct({ slug: 'x', displayName: 'X', score: 7 })];
    const map = new Map([
      [tradingEntry.topic, nineProducts],
      [secondEntry.topic, otherProducts],
    ]);
    const result = buildDecisionBridgeData([tradingEntry, secondEntry], map, 'no-such-review-slug');
    expect(result).toBeNull();
  });

  it('empty field (0 rows for the only candidate topic) → null', () => {
    const map = new Map([[tradingEntry.topic, []]]);
    expect(buildDecisionBridgeData([tradingEntry], map, 'anything')).toBeNull();
  });

  it('leader.score <= 0 (loader coercion of a missing score) → whole topic unusable → null', () => {
    const products = [makeProduct({ slug: 'a', displayName: 'A', score: 0 }), makeProduct({ slug: 'b', displayName: 'B', score: -1 })];
    const map = new Map([[tradingEntry.topic, products]]);
    expect(buildDecisionBridgeData([tradingEntry], map, 'anything')).toBeNull();
  });

  it('position.score <= 0 (but leader is fine) → degrades to state B, not null', () => {
    const products = [
      makeProduct({ slug: 'leader', displayName: 'Leader', score: 9 }),
      makeProduct({ slug: 'zero', displayName: 'Zero', score: 0, reviewSlug: 'zero-review' }),
    ];
    const map = new Map([[tradingEntry.topic, products]]);
    const result = buildDecisionBridgeData([tradingEntry], map, 'zero-review');
    expect(result).not.toBeNull();
    expect(result!.position).toBeNull();
  });

  it('no candidate manifest entries at all (or only legacy) → null', () => {
    expect(buildDecisionBridgeData([legacyEntry], new Map(), 'anything')).toBeNull();
    expect(buildDecisionBridgeData([], new Map(), 'anything')).toBeNull();
  });

  it('valid cockpitTopic override locks the topic — even when that topic itself resolves to null', () => {
    // Override names a registered, non-legacy manifest entry with an EMPTY
    // field. Per spec, a valid override's outcome is final — it must NOT
    // fall through to a different topic that happens to have data.
    const map = new Map([
      [tradingEntry.topic, [] as ProductForComparison[]],
      [secondEntry.topic, nineProducts],
    ]);
    const result = buildDecisionBridgeData([tradingEntry, secondEntry], map, 'anything', tradingEntry.topic);
    expect(result).toBeNull();
  });

  it('invalid cockpitTopic override (topic not in the manifest for this market/category) falls through to auto-resolution', () => {
    const map = new Map([[tradingEntry.topic, nineProducts]]);
    const result = buildDecisionBridgeData([tradingEntry], map, 'nonexistent-slug', 'not-a-real-topic');
    expect(result).not.toBeNull();
    expect(result!.topic).toBe('trading-platforms');
  });

  it('product-match wins over the frontmatter override when the override points elsewhere and is itself invalid for this pairing', () => {
    // secondEntry belongs to a different category than tradingEntry, so an
    // override of "robo-advisors" is not a valid entry within the
    // [tradingEntry] candidate set passed in — falls through, then finds the
    // etoro match via stage 2.
    const map = new Map([[tradingEntry.topic, nineProducts]]);
    const result = buildDecisionBridgeData([tradingEntry], map, 'etoro-review', 'robo-advisors');
    expect(result!.position!.slug).toBe('etoro');
  });
});
