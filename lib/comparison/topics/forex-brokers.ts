// lib/comparison/topics/forex-brokers.ts
// TopicConfig for "Best Forex Brokers" (US) + the Zod schema that guards its
// `attributes` JSONB. Pure module — no React, no server imports.
//
// Cost model note: unlike trading-platforms (a $0 tie across the board), forex
// brokers have a real, volume-scaling cost — spread + any per-lot commission,
// expressed as a % of traded notional. Uses `kind: 'fee-on-amount'` (see
// lib/comparison/cost.ts) with the DEFAULT feeAccessor (no override needed):
// `management_fee` stores the combined round-turn cost rate as a % of
// notional (spread-in-pips x 0.01% + commission-%). Per the Fable-5
// pre-migration review (see
// docs/superpowers/plans/2026-07-03-cockpit-forex-brokers-planned-seed-values.md
// §0a), all 5 rates are standardized on ForexBrokers.com 2026 MEASURED
// averages — including OANDA, whose official 1.4-pip figure is documented
// only in `eur_usd_spread_note`, never seeded as the ranking value, to avoid
// mixing one marketing-published number with four independently-measured
// ones.
//
// The "EUR/USD spread" specColumn (Fable Change 2) shows ALL-IN round-turn
// cost per $100k notional (`managementFee * 1000`), not spread alone —
// spread-only would crown FOREX.com tightest while hiding its $7/lot
// commission, contradicting the "lowest all-in cost" sort (which correctly
// picks Interactive Brokers).
//
// `max_leverage` is never scored (all 5 sit at the CFTC 50:1 cap on majors —
// zero discriminating power) — informational text only in compareRows.
// Charles Schwab's cell reads "up to 50:1 (US cap)" (Fable Change 4), since
// Schwab publishes no leverage figure of its own; this is inferred from the
// CFTC/NFA regulatory ceiling, not a Schwab disclosure.
//
// Charles Schwab has no dedicated forex review — `review_slug` is null and
// its rating/review_count are reused from `charles-schwab-review.mdx` (the
// existing trading-platforms review of the same company/platform). Fable
// Change 3: this carries an explicit caveat (see `rating_note` /
// `confidence: 'medium'`) since that rating measures Schwab's overall
// brokerage, not forex specifically — verified independently that the
// cockpit's JSON-LD (`generateComparisonItemListSchema`,
// lib/seo/schema.ts:417) never emits `aggregateRating` per item, so there is
// no schema-integrity risk from the reuse.
//
// IG US LLC officially rebranded to tastyfx in June 2024 (same legal entity)
// — the old `content/us/forex/ig-markets-review.mdx` page now 301-redirects
// to `tastyfx-review` (next.config.ts) and is NOT a separate cockpit
// candidate. Plus500 US is excluded entirely (CFTC-registered futures
// broker, not spot-forex — its core attributes don't map to this schema).

import { z } from 'zod';
import type { TopicConfig } from './types';
import type { ProductForComparison } from '@/lib/comparison/types';

/** Forex-broker-specific facts stored in product_attributes.attributes. Validated per row. */
export const forexBrokersAttributesSchema = z
  .object({
    eur_usd_spread_pips: z.number(), // representative round-turn EUR/USD spread (measured avg)
    eur_usd_spread_note: z.string().optional(),
    commission_per_lot: z.number(), // round-turn USD per 100k-unit standard lot, 0 if spread-only
    commission_per_lot_note: z.string().optional(),
    max_leverage: z.number(), // on majors (US retail cap is 50:1)
    max_leverage_note: z.string().optional(),
    micro_lots: z.boolean(),
    micro_lots_note: z.string().optional(),
    demo_account: z.boolean(),
    tradingview_integration: z.boolean(),
    mt4_support: z.boolean(),
    mt5_support: z.boolean(),
    currency_pairs_count: z.number(),
    nfa_cftc_regulated: z.boolean(),
    rating_note: z.string().optional(),
  })
  .passthrough();

const attr = (p: ProductForComparison, k: string): boolean => p.attributes?.[k] === true;
const attrNum = (p: ProductForComparison, k: string): number =>
  typeof p.attributes?.[k] === 'number' ? (p.attributes[k] as number) : 0;
const attrStr = (p: ProductForComparison, k: string): string =>
  typeof p.attributes?.[k] === 'string' ? (p.attributes[k] as string) : '';
const yesNo = (b: boolean) => (b ? 'Yes' : 'No');
const usd = (n: number) => (n ? `$${n.toLocaleString('en-US')}` : '$0');
/** All-in round-turn cost per $100k notional — the same rate the cost calculator uses. */
const allInCostPer100k = (p: ProductForComparison) => p.managementFee * 1000;

export const forexBrokersConfig: TopicConfig = {
  slug: 'forex-brokers',
  category: 'forex',
  label: 'Forex Brokers',
  h1: (y) => `Best forex brokers in ${y}`,
  metaTitle: (y) => `Best Forex Brokers (${y}) — Compared & Ranked`,
  metaDescription: (y) =>
    `Compare the best US forex brokers of ${y}: spreads, commissions, minimum deposit and platform support — independent, NFA/CFTC-regulated, and data-driven.`,
  intro:
    'Independent, side-by-side comparison of the leading NFA/CFTC-regulated US forex brokers — ranked by all-in trading cost, minimum deposit and platform features, with a live cost calculator on your own trading volume.',
  publishedDate: '2026-07-03',
  attributesSchema: forexBrokersAttributesSchema,

  specColumns: [
    {
      key: 'allInCost',
      label: 'All-in cost per $100k traded',
      accessor: allInCostPer100k,
      format: (v) => `$${Number(v).toFixed(2)}`,
      winner: 'min',
      sortKey: 'cost',
    },
    {
      key: 'minDeposit',
      label: 'Minimum deposit',
      accessor: (p) => p.accountMinimum,
      format: (v) => usd(Number(v)),
      winner: 'min',
      sortKey: 'min',
    },
    {
      key: 'pairs',
      label: 'Currency pairs',
      accessor: (p) => attrNum(p, 'currency_pairs_count'),
      format: (v) => `${v}+`,
      winner: 'max',
    },
    {
      key: 'tradingview',
      label: 'TradingView integration',
      accessor: (p) => (attr(p, 'tradingview_integration') ? 1 : 0),
      format: (v) => (Number(v) ? 'Yes' : 'No'),
      winner: 'max',
    },
  ],

  filters: [
    { key: 'micro', label: 'Micro lots', predicate: (p) => attr(p, 'micro_lots') },
    { key: 'tradingview', label: 'TradingView integration', predicate: (p) => attr(p, 'tradingview_integration') },
    { key: 'mt', label: 'MetaTrader 4/5', predicate: (p) => attr(p, 'mt4_support') || attr(p, 'mt5_support') },
    { key: 'demo', label: 'Demo account', predicate: (p) => attr(p, 'demo_account') },
    { key: 'noMin', label: 'No minimum deposit', predicate: (p) => p.accountMinimum === 0 },
  ],

  priorityChips: [
    { id: 'cost', label: 'Lowest cost', icon: 'Coins', sort: 'cost' },
    { id: 'min', label: 'No minimum', icon: 'Wallet', sort: 'min' },
    { id: 'rating', label: 'Top rated', icon: 'Star', sort: 'rating' },
    { id: 'mt', label: 'Best for MetaTrader', icon: 'LineChart', sort: 'mt' },
  ],

  matcher: [
    {
      id: 'cost',
      label: 'Do you want the lowest all-in trading cost?',
      weight: 14,
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: "Doesn't matter" },
      ],
      award: (p, a) =>
        a === 'yes' ? { matched: p.managementFee <= 0.01, reason: 'Low all-in cost' } : { matched: true },
    },
    {
      id: 'mt',
      label: 'Do you trade on MetaTrader 4/5?',
      weight: 10,
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: "Doesn't matter" },
      ],
      award: (p, a) =>
        a === 'yes'
          ? { matched: attr(p, 'mt4_support') || attr(p, 'mt5_support'), reason: 'MetaTrader support' }
          : { matched: true },
    },
    {
      id: 'beginner',
      label: 'Just starting out (want a $0 minimum + a demo account)?',
      weight: 10,
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: "Doesn't matter" },
      ],
      award: (p, a) =>
        a === 'yes'
          ? { matched: p.accountMinimum === 0 && attr(p, 'demo_account'), reason: '$0 minimum + demo account' }
          : { matched: true },
    },
  ],

  sortOptions: [
    { value: 'smart', label: 'Smart rank', metric: (p) => p.score },
    { value: 'cost', label: 'Lowest all-in cost on your volume', metric: () => 0 }, // special-cased in orderProducts
    { value: 'min', label: 'Lowest minimum deposit', metric: (p) => -p.accountMinimum },
    { value: 'rating', label: 'Best rated', metric: (p) => p.rating * 100 + p.score },
    {
      value: 'mt',
      label: 'Best for MetaTrader',
      metric: (p) => (attr(p, 'mt4_support') || attr(p, 'mt5_support') ? 1000 : 0) + p.score,
    },
  ],

  costModel: {
    kind: 'fee-on-amount',
    amountLabel: 'Annual trading volume (notional)',
    amountMin: 120_000,
    amountMax: 24_000_000,
    amountStep: 120_000,
    amountDefault: 1_200_000,
    yearsLabel: 'Time horizon (years)', // inert for fee-on-amount, kept for UI consistency
    yearsMin: 1,
    yearsMax: 5,
    yearsDefault: 3,
  },

  compareRows: [
    { key: 'cost', label: 'All-in cost per $100k traded', accessor: (p) => `$${allInCostPer100k(p).toFixed(2)}`, score: (p) => -allInCostPer100k(p) },
    { key: 'spread', label: 'EUR/USD spread (round-turn)', accessor: (p) => `${attrNum(p, 'eur_usd_spread_pips')} pips` },
    { key: 'commission', label: 'Commission per lot', accessor: (p) => usd(attrNum(p, 'commission_per_lot')) },
    { key: 'min', label: 'Minimum deposit', accessor: (p) => usd(p.accountMinimum), score: (p) => -p.accountMinimum },
    { key: 'leverage', label: 'Max leverage (majors)', accessor: (p) => attrStr(p, 'max_leverage_note') || `${attrNum(p, 'max_leverage')}:1 (majors)` },
    { key: 'micro', label: 'Micro lots', accessor: (p) => yesNo(attr(p, 'micro_lots')), score: (p) => (attr(p, 'micro_lots') ? 1 : 0) },
    { key: 'demo', label: 'Demo account', accessor: (p) => yesNo(attr(p, 'demo_account')), score: (p) => (attr(p, 'demo_account') ? 1 : 0) },
    { key: 'tradingview', label: 'TradingView integration', accessor: (p) => yesNo(attr(p, 'tradingview_integration')), score: (p) => (attr(p, 'tradingview_integration') ? 1 : 0) },
    { key: 'mt4', label: 'MetaTrader 4', accessor: (p) => yesNo(attr(p, 'mt4_support')), score: (p) => (attr(p, 'mt4_support') ? 1 : 0) },
    { key: 'mt5', label: 'MetaTrader 5', accessor: (p) => yesNo(attr(p, 'mt5_support')), score: (p) => (attr(p, 'mt5_support') ? 1 : 0) },
    { key: 'pairs', label: 'Currency pairs', accessor: (p) => `${attrNum(p, 'currency_pairs_count')}+`, score: (p) => attrNum(p, 'currency_pairs_count') },
    { key: 'regulated', label: 'NFA/CFTC regulated', accessor: (p) => yesNo(attr(p, 'nfa_cftc_regulated')), score: (p) => (attr(p, 'nfa_cftc_regulated') ? 1 : 0) },
  ],

  detailRows: [
    { key: 'spreadNote', label: 'Spread detail', accessor: (p) => attrStr(p, 'eur_usd_spread_note') || '—' },
    { key: 'commissionNote', label: 'Commission detail', accessor: (p) => attrStr(p, 'commission_per_lot_note') || '—' },
    { key: 'microNote', label: 'Micro lots detail', accessor: (p) => attrStr(p, 'micro_lots_note') || '—' },
    { key: 'ratingNote', label: 'Rating detail', accessor: (p) => attrStr(p, 'rating_note') || '—' },
  ],

  verdict: {
    intro: "Our editors' picks for the best US forex brokers right now.",
    picks: [
      { slug: 'tastyfx', label: 'Best overall' },
      { slug: 'interactive-brokers-forex', label: 'Best for active/high-volume traders' },
      { slug: 'oanda', label: 'Best for beginners' },
    ],
  },
  methodology:
    "We compare EUR/USD spreads, per-lot commissions, minimum deposit, platform support (MetaTrader 4/5, TradingView) and currency-pair selection from each broker's official pricing pages and ForexBrokers.com's 2026 independently-measured spread averages, re-verified quarterly. The all-in cost figure combines spread and commission into a single round-turn rate as a percentage of traded notional, so a broker with a tight headline spread but a hidden per-lot commission (or vice versa) can't misleadingly appear cheapest — use the live cost calculator to see the dollar impact on your own annual trading volume. Max leverage is shown for reference only and never scored: all 5 brokers sit at the CFTC's 50:1 cap on major pairs, so it has no discriminating power. Rankings never depend on commissions.",
  buyerGuide: [
    {
      h3: 'All-in trading cost',
      body: "Forex brokers make money from the spread (the gap between buy and sell price), a per-lot commission, or both. A broker advertising a razor-thin spread can still be more expensive once you add its commission — always compare the combined, all-in round-turn cost, not spread or commission in isolation.",
    },
    {
      h3: 'US regulatory limits',
      body: 'Only NFA-member, CFTC-regulated brokers can legally serve US retail forex clients — this excludes many well-known global brokers. US retail leverage is capped at 50:1 on major currency pairs (sometimes lower on minors and exotics) by CFTC/NFA rule, regardless of which broker you choose.',
    },
    {
      h3: 'Platform support',
      body: "If you already trade on MetaTrader 4 or 5, or rely on TradingView's charting and screening tools, check platform support before minimum deposit or spread — a broker without your preferred platform means rebuilding your workflow from scratch.",
    },
    {
      h3: 'Micro lots and minimum deposit',
      body: 'Micro-lot support (trading in 1,000-unit increments instead of full 100,000-unit standard lots) lets you size positions much more precisely on a small account — valuable for beginners and anyone risk-managing a modest balance.',
    },
  ],
  faq: [
    {
      q: 'How is the all-in cost calculated?',
      a: "We combine each broker's measured EUR/USD spread and any per-lot commission into a single round-turn rate, expressed as a percentage of traded notional, then apply that rate to your chosen annual trading volume. This is a cost-per-volume-traded figure, not a recurring account fee — it scales with how much you actually trade, not with a time horizon.",
    },
    {
      q: 'How does SmartFinPro rank forex brokers?',
      a: 'Our Smart Rank blends our independent score, all-in trading cost, minimum deposit and ratings. The order never depends on commissions.',
    },
    {
      q: 'Are these affiliate links?',
      a: 'Some are. A green "View offer" may earn us a commission at no cost to you, and only ever appears for partners whose tracking we have verified. It never affects the ranking.',
    },
    {
      q: 'Why isn\'t leverage a ranking factor?',
      a: "All five brokers here are capped at 50:1 on major currency pairs by CFTC/NFA rule — the same regulatory ceiling applies regardless of broker, so it has no discriminating power. We show it for reference in the compare table, but it never affects the ranking or the winner highlight.",
    },
    {
      q: 'What happened to IG US?',
      a: 'IG US LLC officially rebranded its forex platform to tastyfx in June 2024 — same company, same regulatory registration, new name. Old links to our IG US review now redirect to our tastyfx review.',
    },
    {
      q: 'Is Charles Schwab a good fit for forex trading specifically?',
      a: "Schwab's thinkorswim platform supports forex, but it's the weakest forex offering in this comparison: no micro lots (10,000-unit minimum position size), no TradingView integration, and no MetaTrader 4/5 support. Its rating here is reused from our overall Charles Schwab brokerage review, not a forex-specific assessment — it's a reasonable choice if you already bank and trade equities with Schwab, less so if forex is your primary focus.",
    },
  ],
  compliance: {
    notice:
      'Not investment advice · retail forex trading is highly leveraged and carries a high risk of loss; most retail accounts lose money. Forex balances are not SIPC-protected or FDIC-insured.',
    regulators: ['NFA', 'CFTC'],
  },
};
