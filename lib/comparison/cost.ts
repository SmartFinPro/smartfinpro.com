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
 *   A `flatFeeAccessor` overrides this with a fixed dollar total for
 *   providers whose true cost isn't a % of the balance at all (e.g. a
 *   non-profit DMP's setup + monthly fees) — never silently shows $0.
 * - `monthly-plus-setup` (credit repair): a one-time setup fee plus a flat
 *   monthly subscription × `inputs.amount`, where `amount` is repurposed as a
 *   MONTHS count for this kind (not a dollar figure) — `years` is unused.
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
    const flat = model.flatFeeAccessor?.(p);
    if (flat != null) return Math.round(flat);
    const feeRate = (model.feeAccessor?.(p) ?? p.managementFee ?? 0) / 100;
    return feeRate <= 0 ? 0 : Math.round(inputs.amount * feeRate);
  }
  if (model.kind === 'monthly-plus-setup') {
    const setupResult = model.setupFeeAccessor?.(p);
    // A defined accessor returning null means "genuinely unknown/variable for
    // this row" (e.g. MSI's case-by-case setup fee), not "no setup fee at
    // all" — Infinity is a real, non-NaN number that mathematically can
    // never win a min/max cost comparison, without poisoning Math.min/Math.max
    // for the other rows (same pattern as debt-relief's non-profit-DMP fee
    // sentinel). Renders as "$∞" via toLocaleString, an honest "uncapped".
    if (model.setupFeeAccessor && setupResult == null) return Infinity;
    const setup = setupResult ?? 0;
    const monthly = p.monthlyFee ?? 0;
    return Math.round(setup + monthly * inputs.amount);
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
