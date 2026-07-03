// lib/comparison/cost.ts
// Pure cost + ranking for the Comparison Cockpit. No React / no server imports.
// Deliberately does NOT touch lib/comparison/ranking.ts — the legacy engine
// keeps its banking ranking; the Cockpit ranks config-driven (D3 = build alongside).

import type { ProductForComparison } from './types';
import type { CostModelDef, TopicConfig } from './topics/types';
import { annualCost, DEFAULT_USAGE } from './ranking';

export interface CostInputs {
  amount: number;
  years: number;
}

export type CockpitSortKey = string;

/**
 * Total cost the user pays over N years.
 * - `compounding-fee` (robo): each year the balance grows at `growthRate`, then
 *   the management fee is charged on the year-end balance and removed.
 * - `banking`: the legacy annual cost × years.
 * - `fee-on-amount` (debt-relief): a one-time fee% of the enrolled amount,
 *   independent of `years` — there is no compounding balance to project.
 */
export function costOverTime(
  p: Pick<ProductForComparison, 'managementFee' | 'monthlyFee' | 'fxFeePct' | 'atmFee' | 'attributes'>,
  model: CostModelDef,
  inputs: CostInputs,
): number {
  if (model.kind === 'banking') {
    return Math.round(annualCost(p, DEFAULT_USAGE) * Math.max(1, inputs.years));
  }
  if (model.kind === 'fee-on-amount') {
    const feeRate = (model.feeAccessor?.(p) ?? p.managementFee ?? 0) / 100;
    return feeRate <= 0 ? 0 : Math.round(inputs.amount * feeRate);
  }
  const feeRate = (p.managementFee ?? 0) / 100;
  const growth = model.growthRate ?? 0.06;
  if (feeRate <= 0) return 0;
  let balance = inputs.amount;
  let totalFees = 0;
  for (let y = 0; y < inputs.years; y++) {
    balance *= 1 + growth;
    const fee = balance * feeRate;
    totalFees += fee;
    balance -= fee;
  }
  return Math.round(totalFees);
}

/**
 * Order products by a config sort option (or live cost), pinning the editor's
 * top pick to index 0. Pure — never mutates the input array.
 */
export function orderProducts(
  products: ProductForComparison[],
  config: TopicConfig,
  inputs: CostInputs,
  sort: CockpitSortKey,
  dir: 'asc' | 'desc' = 'desc',
): ProductForComparison[] {
  const opt = config.sortOptions.find((o) => o.value === sort);
  const metric = (p: ProductForComparison): number =>
    sort === 'cost'
      ? -costOverTime(p, config.costModel, inputs)
      : opt
        ? opt.metric(p)
        : p.score;
  const sign = (opt?.dir ?? dir) === 'asc' ? -1 : 1;
  const sorted = products.slice().sort((a, b) => sign * (metric(b) - metric(a)));
  // Pin the editor's top pick to #1 ONLY on Smart Rank. Explicit sorts
  // (cost/fee/rating/team/apy + the priority chips) must sort honestly so
  // "Lowest cost" really shows the cheapest first. The top-pick badge still shows.
  const pin = sort === 'smart' ? sorted.findIndex((p) => p.isTopPick) : -1;
  if (pin > 0) {
    const [top] = sorted.splice(pin, 1);
    sorted.unshift(top);
  }
  return sorted;
}
