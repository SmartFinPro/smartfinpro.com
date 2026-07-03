// lib/comparison/topics/trading-platforms.ts
// TopicConfig for "Best Trading Platforms" (US) + the Zod schema that guards
// its `attributes` JSONB. Pure module — no React, no server imports.
//
// Cost model note: all 9 candidates charge $0 stock/ETF commission and no
// AUM-style recurring fee — there is no compounding balance to project, so
// this config reuses `kind: 'banking'` verbatim (monthly_fee/fx_fee_pct/
// atm_fee all default to 0 at the DB level for every row), matching the
// `business-bank-accounts.ts` "amount-hidden banking cost model" pattern
// already established for a topic with no real per-provider cost delta. Per
// the Fable-5 pre-migration review (see
// docs/superpowers/plans/2026-07-03-cockpit-trading-platforms-planned-seed-values.md
// §9), this is accepted with three conditions, all honored here: (1) no
// `'cost'` sortOption / "Lowest cost" priorityChip (a 9-way $0 tie would read
// as a broken control), (2) the FAQ explicitly explains why the multi-year
// cost is $0 for every provider, (3) the inert $0 display + hidden amount
// slider is accepted as-is for this slice.
//
// `cash_sweep_apy` is deliberately NEVER scored/winner-highlighted anywhere
// (no specColumn, no `score` on its compareRow, no sortOption, no matcher
// question) — it's informational-only free text with a qualifier
// (default/opt-in/paid-tier), because the raw APY numbers are volatile,
// partly editorial-sourced, and not a fair apples-to-apples "winner" claim
// per the source matrix
// (docs/superpowers/plans/2026-07-03-cockpit-trading-platforms-source-matrix.md).
//
// `extended_hours` is a tri-state (`'classic' | 'overnight' | null`) — `null`
// (eToro only) means "not established for US accounts", never a claimed
// `'none'`. The ordinal accessor and display formatter both branch on `null`
// explicitly, distinct from `'none'` (unused today, kept for future topics).

import { z } from 'zod';
import type { TopicConfig } from './types';
import type { ProductForComparison } from '@/lib/comparison/types';

/** Trading-platform-specific facts stored in product_attributes.attributes. Validated per row. */
export const tradingPlatformsAttributesSchema = z
  .object({
    options_fee: z.number(), // round-trip (open+close) $/contract headline value
    options_fee_note: z.string().optional(),
    fractional_shares: z.boolean(),
    fractional_shares_note: z.string().optional(),
    crypto_trading: z.boolean(),
    crypto_note: z.string().optional(),
    futures_trading: z.boolean(),
    paper_trading: z.boolean(),
    extended_hours: z.enum(['none', 'classic', 'overnight']).nullable(),
    extended_hours_note: z.string().optional(),
    tradingview_integration: z.boolean(),
    cash_sweep_apy: z.number(), // % — NEVER used with `winner`/`score` anywhere
    cash_sweep_note: z.string().optional(),
    sipc_insured: z.boolean(),
  })
  .passthrough();

const attr = (p: ProductForComparison, k: string): boolean => p.attributes?.[k] === true;
const attrNum = (p: ProductForComparison, k: string): number =>
  typeof p.attributes?.[k] === 'number' ? (p.attributes[k] as number) : 0;
const attrStr = (p: ProductForComparison, k: string): string =>
  typeof p.attributes?.[k] === 'string' ? (p.attributes[k] as string) : '';
const extendedHours = (p: ProductForComparison): 'none' | 'classic' | 'overnight' | null => {
  const v = p.attributes?.extended_hours;
  return v === 'none' || v === 'classic' || v === 'overnight' ? v : null;
};
/** null → 0 (not established), 'none' → 0, 'classic' → 1, 'overnight' → 2. */
const extHoursOrdinal = (p: ProductForComparison): number => {
  const v = extendedHours(p);
  if (v === 'overnight') return 2;
  if (v === 'classic') return 1;
  return 0;
};
/** null must render as "—", never "No" — conflating it with 'none' would falsely assert a claim. */
const extHoursLabel = (p: ProductForComparison): string => {
  const v = extendedHours(p);
  if (v === 'overnight') return '24/5 overnight';
  if (v === 'classic') return 'Classic (pre/after-market)';
  if (v === 'none') return 'No';
  return '—';
};
const yesNo = (b: boolean) => (b ? 'Yes' : 'No');
const usd = (n: number) => (n ? `$${n.toLocaleString('en-US', { minimumFractionDigits: n % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 })}` : '$0');
const usdFee = (n: number) => (n === 0 ? '$0' : `$${n.toFixed(2)}`);

export const tradingPlatformsConfig: TopicConfig = {
  slug: 'trading-platforms',
  category: 'trading',
  label: 'Trading Platforms',
  h1: (y) => `Best trading platforms in ${y}`,
  metaTitle: (y) => `Best Trading Platforms (${y}) — Compared & Ranked`,
  metaDescription: (y) =>
    `Compare the best US trading platforms of ${y}: options fees, minimum deposit, crypto access and TradingView support — independent and data-driven.`,
  intro:
    'Independent, side-by-side comparison of the leading US trading platforms — ranked by options fees, minimum deposit and features, with the honest fee and cash-sweep details behind each broker.',
  publishedDate: '2026-07-03',
  attributesSchema: tradingPlatformsAttributesSchema,

  specColumns: [
    {
      key: 'optionsFee',
      label: 'Options fee (round-trip)',
      accessor: (p) => attrNum(p, 'options_fee'),
      format: (v) => usdFee(Number(v)),
      winner: 'min',
      sortKey: 'fee',
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
      key: 'extendedHours',
      label: 'Extended hours',
      accessor: (p) => extHoursOrdinal(p),
      format: (v) => {
        const n = Number(v);
        if (n === 2) return '24/5 overnight';
        if (n === 1) return 'Classic (pre/after-market)';
        return '—';
      },
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
    { key: 'fractional', label: 'Fractional shares', predicate: (p) => attr(p, 'fractional_shares') },
    { key: 'crypto', label: 'Crypto trading', predicate: (p) => attr(p, 'crypto_trading') },
    { key: 'futures', label: 'Futures trading', predicate: (p) => attr(p, 'futures_trading') },
    { key: 'paperTrading', label: 'Paper trading', predicate: (p) => attr(p, 'paper_trading') },
    { key: 'tradingview', label: 'TradingView integration', predicate: (p) => attr(p, 'tradingview_integration') },
    { key: 'overnight', label: '24/5 overnight trading', predicate: (p) => extendedHours(p) === 'overnight' }, // eToro's null is conservatively excluded, never asserted false
    { key: 'noMin', label: 'No minimum deposit', predicate: (p) => p.accountMinimum === 0 },
  ],

  priorityChips: [
    { id: 'fee', label: 'Cheapest options', icon: 'Percent', sort: 'fee' },
    { id: 'min', label: 'No minimum', icon: 'Wallet', sort: 'min' },
    { id: 'rating', label: 'Top rated', icon: 'Star', sort: 'rating' },
    { id: 'active', label: 'Best for active trading', icon: 'TrendingUp', sort: 'active' },
  ], // NOTE: no 'cost' chip — banned per the cost-model conditions above (9-way $0 tie)

  matcher: [
    {
      id: 'options',
      label: 'Do you trade options frequently?',
      weight: 14,
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: "Doesn't matter" },
      ],
      award: (p, a) =>
        a === 'yes' ? { matched: attrNum(p, 'options_fee') <= 1.0, reason: 'Low/no options fee' } : { matched: true },
    },
    {
      id: 'crypto',
      label: 'Want to trade crypto on the same platform?',
      weight: 10,
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: "Doesn't matter" },
      ],
      award: (p, a) =>
        a === 'yes' ? { matched: attr(p, 'crypto_trading'), reason: 'Crypto trading' } : { matched: true },
    },
    {
      id: 'active',
      label: 'Want futures trading or native TradingView charting?',
      weight: 10,
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: "Doesn't matter" },
      ],
      award: (p, a) =>
        a === 'yes'
          ? { matched: attr(p, 'futures_trading') || attr(p, 'tradingview_integration'), reason: 'Futures/TradingView' }
          : { matched: true },
    },
  ],

  sortOptions: [
    { value: 'smart', label: 'Smart rank', metric: (p) => p.score },
    { value: 'fee', label: 'Cheapest options (round-trip)', metric: (p) => -attrNum(p, 'options_fee') },
    { value: 'min', label: 'Lowest minimum deposit', metric: (p) => -p.accountMinimum },
    { value: 'rating', label: 'Best rated', metric: (p) => p.rating * 100 + p.score },
    {
      value: 'active',
      label: 'Best for active trading',
      metric: (p) =>
        extHoursOrdinal(p) * 10 +
        (attr(p, 'futures_trading') ? 8 : 0) +
        (attr(p, 'tradingview_integration') ? 8 : 0) +
        p.score,
    },
  ], // NOTE: no 'cost' sortOption — banned per the cost-model conditions above

  costModel: {
    kind: 'banking',
    amountLabel: 'Representative usage', // ignored — no per-provider differentiation possible ($0 stock/ETF commission across the board)
    amountMin: 0,
    amountMax: 0,
    amountStep: 1,
    amountDefault: 0,
    yearsLabel: 'Time horizon (years)',
    yearsMin: 1,
    yearsMax: 5,
    yearsDefault: 3,
  },

  compareRows: [
    { key: 'fee', label: 'Options fee (round-trip)', accessor: (p) => usdFee(attrNum(p, 'options_fee')), score: (p) => -attrNum(p, 'options_fee') },
    { key: 'min', label: 'Minimum deposit', accessor: (p) => usd(p.accountMinimum), score: (p) => -p.accountMinimum },
    { key: 'fractional', label: 'Fractional shares', accessor: (p) => yesNo(attr(p, 'fractional_shares')), score: (p) => (attr(p, 'fractional_shares') ? 1 : 0) },
    { key: 'crypto', label: 'Crypto trading', accessor: (p) => yesNo(attr(p, 'crypto_trading')), score: (p) => (attr(p, 'crypto_trading') ? 1 : 0) },
    { key: 'futures', label: 'Futures trading', accessor: (p) => yesNo(attr(p, 'futures_trading')), score: (p) => (attr(p, 'futures_trading') ? 1 : 0) },
    { key: 'paper', label: 'Paper trading', accessor: (p) => yesNo(attr(p, 'paper_trading')), score: (p) => (attr(p, 'paper_trading') ? 1 : 0) },
    { key: 'hours', label: 'Extended hours', accessor: (p) => extHoursLabel(p), score: (p) => extHoursOrdinal(p) },
    { key: 'tradingview', label: 'TradingView integration', accessor: (p) => yesNo(attr(p, 'tradingview_integration')), score: (p) => (attr(p, 'tradingview_integration') ? 1 : 0) },
    // cash_sweep_apy: informational only — accessor renders the qualifier-bearing note text,
    // NEVER the bare percentage alone, and this row deliberately carries NO `score` prop.
    { key: 'sweep', label: 'Cash sweep APY', accessor: (p) => attrStr(p, 'cash_sweep_note') || `${attrNum(p, 'cash_sweep_apy')}%` },
    { key: 'sipc', label: 'SIPC insured', accessor: (p) => yesNo(attr(p, 'sipc_insured')), score: (p) => (attr(p, 'sipc_insured') ? 1 : 0) },
  ],

  detailRows: [
    { key: 'optionsNote', label: 'Options fee detail', accessor: (p) => attrStr(p, 'options_fee_note') || '—' },
    { key: 'fractionalNote', label: 'Fractional shares detail', accessor: (p) => attrStr(p, 'fractional_shares_note') || '—' },
    { key: 'cryptoNote', label: 'Crypto trading detail', accessor: (p) => attrStr(p, 'crypto_note') || '—' },
    { key: 'hoursNote', label: 'Extended hours detail', accessor: (p) => attrStr(p, 'extended_hours_note') || '—' },
  ],

  verdict: {
    intro: "Our editors' picks for the best US trading platforms right now.",
    picks: [
      { slug: 'fidelity', label: 'Best overall' },
      { slug: 'interactive-brokers', label: 'Best for active & advanced traders' },
      { slug: 'robinhood', label: 'Best for beginners' },
    ],
  },
  methodology:
    "We compare options fees, minimum deposit, asset access (fractional shares, crypto, futures), paper trading, extended-hours trading, TradingView integration, cash-sweep yield and SIPC coverage from each broker's official pricing pages, re-verified quarterly. Every one of these 9 brokers charges $0 commission on US stock and ETF trades and no monthly account fee, so the multi-year cost projection is $0 for all of them — there is no AUM-style recurring or compounding fee here to project, unlike a robo-advisor's management fee. The real cost differences that matter — options-contract fees for active traders, and the yield (or lack of it) on uninvested cash — are shown directly in the fee column and cash-sweep row instead of a misleading cost slider. Rankings never depend on commissions.",
  buyerGuide: [
    {
      h3: 'Options fees',
      body: 'Nearly every $0-commission broker still charges a small per-contract options fee. We show the round-trip (open + close) cost, since some brokers only charge on the open leg — a broker with a higher-looking open fee (like tastytrade\'s capped structure) can end up cheaper overall for active, multi-leg traders.',
    },
    {
      h3: 'Minimum deposit',
      body: 'Most US brokers have no minimum to open an account. eToro is the one exception in this list, requiring a $100 minimum first deposit for US customers even though its account minimum is technically $0.',
    },
    {
      h3: 'Idle cash yield (cash sweep)',
      body: "The interest rate your uninvested cash earns varies enormously — from an automatic ~3% at Fidelity to 0.01% at several big-name brokers unless you opt into a paid tier or manually buy a money-market fund. This is often the largest real cost difference between brokers that all charge $0 commission, and it moves with interest-rate cycles, so we re-verify it regularly.",
    },
    {
      h3: 'Extended hours, crypto & futures access',
      body: "If you want to trade outside the standard 9:30am-4pm ET session, trade crypto on the same platform as your stocks, or trade futures, check these columns carefully — access varies widely, and a couple of brokers' crypto offerings are still in a phased rollout rather than fully live for every customer.",
    },
  ],
  faq: [
    {
      q: 'How is the multi-year cost calculated?',
      a: "For this category, it isn't a meaningful number — every broker on this list charges $0 commission on US stock and ETF trades and no monthly account fee, so there's no AUM-style recurring fee to compound over time the way a robo-advisor's management fee would. Rather than show a misleading multi-year projection, we surface the two costs that actually differ between these brokers directly: the options-contract fee (in the fee column) and the interest rate on your uninvested cash (in the cash-sweep row).",
    },
    {
      q: 'How does SmartFinPro rank trading platforms?',
      a: 'Our Smart Rank blends our independent score, options fees, minimum deposit and ratings. The order never depends on commissions.',
    },
    {
      q: 'Are these affiliate links?',
      a: 'Some are. A green "View offer" may earn us a commission at no cost to you, and only ever appears for partners whose tracking we have verified. It never affects the ranking.',
    },
    {
      q: 'Are these trading platforms SIPC-insured?',
      a: 'Yes — all 9 brokers on this list are SIPC members, protecting your cash and securities up to $500,000 (including $250,000 for cash) if the brokerage itself fails. SIPC does not protect against market losses, and crypto holdings are excluded from SIPC coverage at every broker that offers crypto trading.',
    },
    {
      q: 'Which broker has the cheapest options trading?',
      a: "eToro charges $0 per options contract for US customers — the only true $0 options broker in this list. Robinhood's combined pass-through fee is $0.04/contract ($0.08 round-trip), and tastytrade's capped fee structure ($1.00 to open, $0 to close, capped at $10/leg) makes it the cheapest broker in the group for active, multi-leg options traders despite a higher nominal open fee.",
    },
    {
      q: "Which brokers support 24/5 or overnight trading?",
      a: 'Interactive Brokers has the broadest overnight session (10,000+ US stocks and ETFs, Sunday-Friday 8pm-3:50am ET), followed by Charles Schwab, Robinhood, Webull, E*TRADE and tastytrade, which all offer some form of 24/5 or overnight trading. Fidelity and Merrill Edge offer only classic pre-market and after-hours sessions. eToro\'s extended-hours availability for US accounts is not yet established, so we show it as "—" rather than claim it either way.',
    },
  ],
  compliance: {
    notice:
      'Not investment advice · brokerage products carry investment risk. Options and futures trading involve substantial risk and are not suitable for all investors.',
    regulators: ['SEC', 'FINRA', 'SIPC'],
  },
};
