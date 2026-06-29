import { describe, expect, it } from 'vitest';
import { orderProducts } from '@/lib/comparison/cost';
import type { TopicConfig } from '@/lib/comparison/topics/types';
import type { ProductForComparison } from '@/lib/comparison/types';

function makeProduct(over: Partial<ProductForComparison>): ProductForComparison {
  return {
    slug: 'x',
    score: 5,
    rating: 4,
    managementFee: 0.25,
    accountMinimum: 0,
    isTopPick: false,
    ...over,
  } as ProductForComparison;
}

const config = {
  costModel: { kind: 'compounding-fee', growthRate: 0.06, amountDefault: 100_000, yearsDefault: 10 },
  sortOptions: [
    { value: 'smart', label: 'Smart', metric: (p: ProductForComparison) => p.score },
    { value: 'cost', label: 'Cost', metric: () => 0 },
    { value: 'rating', label: 'Rating', metric: (p: ProductForComparison) => p.rating },
  ],
} as unknown as TopicConfig;

const inputs = { amount: 100_000, years: 10 };

describe('orderProducts', () => {
  it('pins isTopPick to index 0 even when its metric is not highest', () => {
    const products = [
      makeProduct({ slug: 'a', score: 9 }),
      makeProduct({ slug: 'pick', score: 1, isTopPick: true }),
      makeProduct({ slug: 'b', score: 7 }),
    ];
    const out = orderProducts(products, config, inputs, 'smart');
    expect(out[0].slug).toBe('pick');
  });

  it("sort 'cost' puts the lowest-cost non-pinned provider first", () => {
    const products = [
      makeProduct({ slug: 'pricey', managementFee: 0.5 }),
      makeProduct({ slug: 'free', managementFee: 0 }),
      makeProduct({ slug: 'mid', managementFee: 0.25 }),
    ];
    const out = orderProducts(products, config, inputs, 'cost');
    expect(out[0].slug).toBe('free');
  });

  it("does NOT pin isTopPick on an explicit sort ('cost') — honest order", () => {
    const products = [
      makeProduct({ slug: 'pick', managementFee: 0.5, isTopPick: true }),
      makeProduct({ slug: 'free', managementFee: 0 }),
      makeProduct({ slug: 'mid', managementFee: 0.25 }),
    ];
    const out = orderProducts(products, config, inputs, 'cost');
    expect(out[0].slug).toBe('free'); // cheapest first, top pick not forced to #1
  });

  it('does not mutate the input array', () => {
    const products = [makeProduct({ slug: 'a', score: 1 }), makeProduct({ slug: 'b', score: 9 })];
    const snapshot = products.slice();
    orderProducts(products, config, inputs, 'smart');
    expect(products).toEqual(snapshot);
    expect(products[0].slug).toBe('a');
  });
});
