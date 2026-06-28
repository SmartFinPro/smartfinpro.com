// lib/comparison/ranking.ts
// Pure ranking logic shared by the server page (initial SSR sort + schema
// order) and the client engine (live re-rank). No React / no server imports.
// Keeping the formulas here guarantees SSR order === client default order.

import type { ProductForComparison, Usage, SortKey } from './types';

/** Default usage baseline — server SSR uses this so the initial HTML order
 *  matches the client's first render exactly. */
export const DEFAULT_USAGE: Usage = { fxSpend: 500, atmCount: 4 };

type CostInputs = Pick<ProductForComparison, 'monthlyFee' | 'fxFeePct' | 'atmFee'>;

/** Annual cost for the user given their usage. */
export function annualCost(p: CostInputs, u: Usage): number {
  return p.monthlyFee * 12 + u.fxSpend * 12 * (p.fxFeePct / 100) + u.atmCount * 12 * p.atmFee;
}

/** Smart-Rank — blends editorial score, personal cost, signup bonus, popularity.
 *  Calibrated on a 0-10 `score`. */
export function smartRank(p: ProductForComparison, costYr: number): number {
  return p.score - costYr / 500 + p.signupBonus / 2000 + p.clicks / 8000;
}

/** Ranking value for a given sort mode. Higher = better. */
export function rankValue(p: ProductForComparison, usage: Usage, sort: SortKey): number {
  const cost = annualCost(p, usage);
  switch (sort) {
    case 'cost':
      return -cost;
    case 'rating':
      return p.rating * 100 + p.score;
    case 'bonus':
      return p.signupBonus + p.score / 10;
    case 'apy':
      return p.apy * 100 + p.score;
    case 'team':
      return (p.hasSubAccounts ? 1000 : 0) + p.score;
    case 'travel':
      return -p.fxFeePct * 1000 - cost + p.score;
    case 'smart':
    default:
      return smartRank(p, cost);
  }
}

/**
 * Sort a copy of `products` by the given sort mode, then pin the editorial
 * top pick (`isTopPick`) to position #1 ("Top pick immer #1"). Pure — never
 * mutates the input array.
 */
export function rankProducts(
  products: ProductForComparison[],
  usage: Usage,
  sort: SortKey = 'smart',
): ProductForComparison[] {
  const sorted = products
    .slice()
    .sort((a, b) => rankValue(b, usage, sort) - rankValue(a, usage, sort));

  const pinIdx = sorted.findIndex((p) => p.isTopPick);
  if (pinIdx > 0) {
    const [pinned] = sorted.splice(pinIdx, 1);
    sorted.unshift(pinned);
  }
  return sorted;
}
