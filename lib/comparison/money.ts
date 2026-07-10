// lib/comparison/money.ts
// Market-aware money + cost-label formatting for the Comparison Cockpit.
// Pure module (no React / no server imports) — consumed by both the server
// route and the 'use client' cockpit components (same constraint as cost.ts).

import { marketConfig, type Market } from '@/lib/i18n/config';
import type { CostModelDef } from './topics/types';
import type { CostInputs } from './cost';

/**
 * "£1,234" / "C$1,234" / "A$1,234" / "$1,234" per marketConfig.
 * Infinity renders as "∞" — the monthly-plus-setup "uncapped setup fee"
 * sentinel from costOverTime (lib/comparison/cost.ts) must survive formatting.
 */
export function formatMoney(n: number, market: Market): string {
  const cfg = marketConfig[market] ?? marketConfig.us;
  return `${cfg.currencySymbol}${Math.round(n).toLocaleString(cfg.locale)}`;
}

/**
 * Label for the live-cost cell/column/row. `fee-on-amount` is a ONE-TIME cost
 * on the chosen amount (spread/settlement/broker fee) — labelling it
 * "N-yr cost" is factually wrong (SEO addendum §11). Topics can override via
 * `costModel.costLabel` (e.g. "Spread cost", "Est. broker fee").
 */
export function formatCostLabel(
  cm: Pick<CostModelDef, 'kind' | 'costLabel'>,
  inputs: CostInputs,
): string {
  if (cm.costLabel) return cm.costLabel;
  if (cm.kind === 'monthly-plus-setup') return `${inputs.amount}-mo cost`;
  if (cm.kind === 'fee-on-amount') return 'Cost on volume';
  return `${inputs.years}-yr cost`;
}
