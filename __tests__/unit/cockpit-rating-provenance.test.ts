// __tests__/unit/cockpit-rating-provenance.test.ts
// Guards the rating-provenance suppression. The cockpit shows two different
// numbers side by side: the audited 0-10 score, which drives the ranking, and
// star ratings from the generic rating/review_count columns, which carry no
// source, no as-of date and no market scope. Where the second kind cannot be
// attributed, TopicConfig.ratingsUnsourced removes every rating-driven
// control. These tests exist so it cannot silently come back.

import { describe, expect, it } from 'vitest';
import { orderProducts } from '@/lib/comparison/cost';
import { visiblePriorityChips, visibleSortOptions } from '@/lib/comparison/topics/types';
import type { TopicConfig } from '@/lib/comparison/topics/types';
import type { ProductForComparison } from '@/lib/comparison/types';
import { tradingPlatformsConfig } from '@/lib/comparison/topics/trading-platforms';

function makeProduct(over: Partial<ProductForComparison>): ProductForComparison {
  return {
    slug: 'x',
    score: 5,
    rating: 4,
    reviewCount: 100,
    managementFee: 0,
    accountMinimum: 0,
    isTopPick: false,
    ...over,
  } as ProductForComparison;
}

const base = {
  costModel: { kind: 'banking', amountDefault: 0, yearsDefault: 3 },
  sortOptions: [
    { value: 'smart', label: 'Smart rank', metric: (p: ProductForComparison) => p.score },
    { value: 'rating', label: 'Best rated', metric: (p: ProductForComparison) => p.rating * 100 },
  ],
  priorityChips: [
    { id: 'cost', label: 'Lowest cost', icon: 'Coins', sort: 'cost' },
    { id: 'rating', label: 'Top rated', icon: 'Star', sort: 'rating' },
  ],
} as unknown as TopicConfig;

const sourced = { ...base } as TopicConfig;
const unsourced = { ...base, ratingsUnsourced: true } as TopicConfig;

describe('visibleSortOptions', () => {
  it('leaves a topic with attributable ratings untouched', () => {
    expect(visibleSortOptions(sourced).map((o) => o.value)).toEqual(['smart', 'rating']);
  });

  it('drops the rating sort where ratings are unsourced', () => {
    expect(visibleSortOptions(unsourced).map((o) => o.value)).toEqual(['smart']);
  });
});

describe('visiblePriorityChips', () => {
  it('leaves a topic with attributable ratings untouched', () => {
    expect(visiblePriorityChips(sourced).map((c) => c.id)).toEqual(['cost', 'rating']);
  });

  it('drops chips that trigger a rating sort, keeping the rest', () => {
    expect(visiblePriorityChips(unsourced).map((c) => c.id)).toEqual(['cost']);
  });
});

describe('orderProducts with a suppressed rating sort', () => {
  // The UI never offers the option, but ?sort=rating is a hand-editable URL.
  // It must fall through to the audited score rather than quietly ranking by
  // the very number the page refuses to display.
  const products = [
    makeProduct({ slug: 'low-score-high-rating', score: 1, rating: 5 }),
    makeProduct({ slug: 'high-score-low-rating', score: 9, rating: 1 }),
  ];
  const inputs = { amount: 0, years: 3 };

  it('honours ?sort=rating where the rating is attributable', () => {
    const out = orderProducts(products, sourced, inputs, 'rating');
    expect(out[0].slug).toBe('low-score-high-rating');
  });

  it('falls back to the audited score where the rating is unsourced', () => {
    const out = orderProducts(products, unsourced, inputs, 'rating');
    expect(out[0].slug).toBe('high-score-low-rating');
  });
});

describe('us/trading trading-platforms', () => {
  // Fidelity leads this field at 9.6 on the audited score while carrying 4.5
  // stars above Interactive Brokers' 4.8 — the ranking and the stars
  // contradict each other, and only the ranking is sourced.
  it('is flagged as unsourced so no star surface renders', () => {
    expect(tradingPlatformsConfig.ratingsUnsourced).toBe(true);
  });

  it('exposes no rating sort or chip to the reader', () => {
    expect(visibleSortOptions(tradingPlatformsConfig).some((o) => o.value === 'rating')).toBe(false);
    expect(visiblePriorityChips(tradingPlatformsConfig).some((c) => c.sort === 'rating')).toBe(false);
  });

  it('still ranks by the audited score', () => {
    expect(tradingPlatformsConfig.sortOptions.find((o) => o.value === 'smart')).toBeDefined();
  });
});
