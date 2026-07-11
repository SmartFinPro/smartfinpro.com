// lib/comparison/topics/uk/forex-brokers.ts
// TopicConfig for "Best Forex Brokers (UK)" — registered under
// 'uk:forex/forex-brokers'. Shares the 'forex/forex-brokers' slug with
// us/ca/au for hreflang clustering; fully independent UK-specific editorial
// content. Pure module — no React/server imports.
//
// Cost model mirrors ca/forex-brokers.ts / au/forex-brokers.ts exactly:
// 'fee-on-amount' with the DEFAULT feeAccessor (p.managementFee) —
// management_fee stores the combined round-turn cost rate as a % of
// notional. costLabel defaults to "Cost on volume" (formatCostLabel) —
// correct for this kind, no override.
//
// Editorial disclosure (SEO addendum §14): every one of these 7 brokers
// carries a real, sourced 2024-2026 regulatory or legal matter at the
// group/parent level — Saxo's ~£37-40M Danish AML fine, XTB's Polish MiFID
// II fine, Pepperstone's self-reported ASIC leverage-cap breach, CMC's
// Australian class action, StoneX/FOREX.com's US exchange-level fines,
// Admirals' Estonian regulator fines and licence restructuring. None of
// these are UK FCA enforcement actions against the UK-regulated entity
// itself — disclosed with that scope distinction preserved. The FCA
// actively warns about clone firms impersonating Admirals — only the
// verified FRN 595450 entity is linked here.

import { z } from 'zod';
import type { TopicConfig } from './../types';
import type { ProductForComparison } from '@/lib/comparison/types';

export const ukForexBrokersAttributesSchema = z
  .object({
    fca_frn: z.string(),
    avg_spread_eurusd_pips: z.number(),
    commission_round_turn_gbp: z.number(), // per standard lot, 0 if spread-only account
    account_type_note: z.string(), // which account type the spread/commission figures are for
    max_leverage: z.string(), // e.g. "30:1" — FCA cap on FX majors
    platforms: z.array(z.string()).min(1),
    trustpilot_rating: z.number().nullable(),
    trustpilot_count: z.number().nullable(),
    trustpilot_note: z.string(),
    regulatory_note: z.string().optional(), // material, sourced legal/compliance history — empty string if none
  })
  .passthrough();

const attrStr = (p: ProductForComparison, k: string): string =>
  typeof p.attributes?.[k] === 'string' ? (p.attributes[k] as string) : '';
const attrNum = (p: ProductForComparison, k: string): number =>
  typeof p.attributes?.[k] === 'number' ? (p.attributes[k] as number) : 0;
const attrArr = (p: ProductForComparison, k: string): string[] =>
  Array.isArray(p.attributes?.[k]) ? (p.attributes[k] as string[]) : [];
const gbp = (n: number) => `£${n.toFixed(2)}`;

export const ukForexBrokersConfig: TopicConfig = {
  slug: 'forex-brokers',
  category: 'forex',
  label: 'Forex Brokers',
  h1: (y) => `Best forex brokers in the UK (${y})`,
  metaTitle: (y) => `Best UK Forex Trading Brokers (${y})`,
  metaDescription: (y) =>
    `Compare FCA-regulated forex brokers in the UK for ${y} by all-in trading cost, leverage, platforms and regulatory record — independent, sourced.`,
  intro:
    'Independent, side-by-side comparison of FCA-regulated forex brokers for UK retail traders — ranked by all-in trading cost on your own annual volume, leverage, platforms and regulatory record.',
  publishedDate: '2026-07-11',
  attributesSchema: ukForexBrokersAttributesSchema,

  specColumns: [
    {
      key: 'spread',
      label: 'Avg. EUR/USD spread',
      accessor: (p) => attrNum(p, 'avg_spread_eurusd_pips'),
      format: (v) => `${Number(v).toFixed(2)} pips`,
      winner: 'min',
    },
    {
      key: 'commission',
      label: 'Commission (round-turn)',
      accessor: (p) => attrNum(p, 'commission_round_turn_gbp'),
      format: (v) => gbp(Number(v)),
      winner: 'min',
    },
    {
      key: 'leverage',
      label: 'Max leverage',
      accessor: (p) => attrStr(p, 'max_leverage'),
      format: (v) => String(v),
    },
    {
      key: 'platforms',
      label: 'Platforms',
      accessor: (p) => attrArr(p, 'platforms').length,
      format: (v) => `${v}`,
      winner: 'max',
    },
  ],

  filters: [
    { key: 'mt4', label: 'MetaTrader 4', predicate: (p) => attrArr(p, 'platforms').includes('MT4') },
    { key: 'mt5', label: 'MetaTrader 5', predicate: (p) => attrArr(p, 'platforms').includes('MT5') },
    { key: 'tradingview', label: 'TradingView', predicate: (p) => attrArr(p, 'platforms').includes('TradingView') },
  ],

  priorityChips: [
    { id: 'cost', label: 'Lowest cost', icon: 'Coins', sort: 'cost' },
    { id: 'spread', label: 'Tightest spread', icon: 'TrendingUp', sort: 'spread' },
    { id: 'rating', label: 'Top rated', icon: 'Star', sort: 'rating' },
    { id: 'platforms', label: 'Most platforms', icon: 'Layers', sort: 'platforms' },
  ],

  matcher: [
    {
      id: 'volume',
      label: 'How do you trade?',
      weight: 14,
      options: [
        { value: 'active', label: 'Frequently / scalping' },
        { value: 'casual', label: 'Occasionally' },
      ],
      award: (p, a) =>
        a === 'active'
          ? { matched: attrNum(p, 'avg_spread_eurusd_pips') <= 0.5, reason: 'Tight spreads for frequent trading' }
          : { matched: true },
    },
    {
      id: 'platform',
      label: 'Which platform do you want?',
      weight: 12,
      options: [
        { value: 'mt', label: 'MetaTrader 4/5' },
        { value: 'any', label: "Doesn't matter" },
      ],
      award: (p, a) =>
        a === 'mt'
          ? { matched: attrArr(p, 'platforms').includes('MT4') || attrArr(p, 'platforms').includes('MT5'), reason: 'MetaTrader support' }
          : { matched: true },
    },
  ],

  sortOptions: [
    { value: 'smart', label: 'Smart rank', metric: (p) => p.score },
    { value: 'cost', label: 'Lowest cost on volume', metric: () => 0 },
    { value: 'spread', label: 'Tightest spread', metric: (p) => -attrNum(p, 'avg_spread_eurusd_pips') * 100 + p.score },
    { value: 'rating', label: 'Best rated', metric: (p) => p.rating * 100 + p.score },
    { value: 'platforms', label: 'Most platforms', metric: (p) => attrArr(p, 'platforms').length * 100 + p.score },
  ],

  costModel: {
    kind: 'fee-on-amount',
    amountLabel: 'Annual trading volume (notional)',
    amountMin: 120_000,
    amountMax: 12_000_000,
    amountStep: 60_000,
    amountDefault: 1_200_000,
    yearsLabel: 'Years',
    yearsMin: 1,
    yearsMax: 1,
    yearsDefault: 1,
  },

  compareRows: [
    { key: 'spread', label: 'Avg. EUR/USD spread', accessor: (p) => `${attrNum(p, 'avg_spread_eurusd_pips').toFixed(2)} pips`, score: (p) => -attrNum(p, 'avg_spread_eurusd_pips') },
    { key: 'commission', label: 'Commission (round-turn)', accessor: (p) => gbp(attrNum(p, 'commission_round_turn_gbp')), score: (p) => -attrNum(p, 'commission_round_turn_gbp') },
    { key: 'leverage', label: 'Max leverage', accessor: (p) => attrStr(p, 'max_leverage') },
    { key: 'platforms', label: 'Platforms', accessor: (p) => attrArr(p, 'platforms').join(', ') || '—', score: (p) => attrArr(p, 'platforms').length },
    { key: 'frn', label: 'FCA FRN', accessor: (p) => attrStr(p, 'fca_frn') || '—' },
  ],

  detailRows: [
    { key: 'accountNote', label: 'Account type (spread/commission basis)', accessor: (p) => attrStr(p, 'account_type_note') || '—' },
    { key: 'trustpilotNote', label: 'Rating source note', accessor: (p) => attrStr(p, 'trustpilot_note') || '—' },
    { key: 'regulatory', label: 'Regulatory history', accessor: (p) => attrStr(p, 'regulatory_note') || 'No material regulatory history found at research time.' },
  ],

  verdict: {
    intro:
      "Cost is where Pepperstone wins outright — an average 0.12 pips on EUR/USD through its Razor account, the lowest of any broker we researched, notwithstanding a self-reported and since-remediated 2023 leverage-cap breach. Traders who want breadth should look at IG instead: 17,000+ instruments and a history as the largest FCA spread-betting provider dating back to 1974. CMC Markets rounds out the shortlist as the steadiest long-standing option, FCA-regulated since 2001, with 330+ FX pairs and FSCS coverage.",
    picks: [
      { slug: 'pepperstone-forex-uk', label: 'Lowest cost' },
      { slug: 'ig-forex-uk', label: 'Widest market range' },
      { slug: 'cmc-markets-forex-uk', label: 'Best established choice' },
    ],
  },
  methodology:
    "We compare each broker's spread and commission on their standard or raw/ECN account, converted to an all-in cost rate on your own annual trading volume, alongside FCA authorisation, leverage caps, platform choice and consumer rating. Regulatory and legal history is sourced from the FCA, ASIC, Danish FSA, Polish KNF, CFTC and other primary regulators, and disclosed plainly rather than omitted — several matters found during research are group/parent-level actions in other jurisdictions, not UK FCA enforcement against the UK entity, and we preserve that distinction rather than conflating them. Rankings never depend on commissions — every provider on this page is currently a visit-only listing.",
  buyerGuide: [
    {
      h3: 'FCA leverage caps and negative balance protection',
      body: 'The FCA caps leverage for retail clients at 30:1 on major FX pairs (lower on other asset classes), and requires FCA-authorised brokers to hold client funds in segregated accounts and provide negative balance protection. This applies to all 7 brokers on this page — check the FRN against the FCA Register if you want to verify a broker independently.',
    },
    {
      h3: 'Spread-only vs. raw spread + commission',
      body: 'Spread-only accounts (no separate commission) are simpler but usually cost more per trade than a raw/ECN account, which pairs a near-zero spread with a flat or percentage commission. Active and high-volume traders generally save money on a raw account; occasional traders may prefer the simplicity of a spread-only account.',
    },
    {
      h3: 'Verify Admirals against the genuine FRN before trading',
      body: 'The FCA has repeatedly warned about fraudulent clone websites impersonating Admirals (Admiral Markets UK Ltd) — always confirm you\'re dealing with the genuine entity, FRN 595450, via the FCA Register before depositing funds, since clone sites offer no FSCS or Financial Ombudsman protection.',
    },
    {
      h3: 'Reading disclosed regulatory history honestly',
      body: "Every broker on this page has a real, sourced regulatory or legal matter in its recent history at the group or parent-company level — Saxo's Danish parent was fined for AML compliance failures, XTB's Polish parent was fined for MiFID II product-governance failures, Pepperstone self-reported and remediated an ASIC leverage-cap breach, CMC faces an active Australian Federal Court class action, and StoneX (FOREX.com's parent) has multiple US exchange-level fines. None of these are UK FCA enforcement actions against the UK-regulated entity specifically — we disclose each with that scope distinction preserved.",
    },
  ],
  faq: [
    {
      q: 'What is the best forex broker in the UK in 2026?',
      a: "On cost, Pepperstone wins outright — the lowest overall trading cost of any broker we researched via its Razor account. IG is the better fit for market range, as the UK's largest FCA spread-betting provider, while CMC Markets offers the steadiest track record, FCA-regulated since 2001. Pricing and features are re-verified regularly, and the ranking is never influenced by commissions.",
    },
    {
      q: 'Are these brokers actually regulated in the UK?',
      a: 'Yes — all 7 hold FCA authorisation, independently verifiable via the FCA Register FRN shown for each. FCA-regulated brokers must segregate client funds, cap retail leverage at 30:1 on major FX pairs, and provide negative balance protection.',
    },
    {
      q: 'How is the cost comparison calculated?',
      a: "We convert each broker's spread and commission into an all-in cost rate, then apply it to your own estimated annual trading volume using the slider above — the ranking updates live. This reflects genuine trading costs, not account fees, since none of these brokers charge a monthly account fee.",
    },
    {
      q: 'Why does the FCA warn about clone firms impersonating Admirals?',
      a: 'Fraudsters have repeatedly set up fake websites mimicking Admirals\' branding to solicit deposits with no genuine regulatory protection. The real, FCA-authorised entity is Admiral Markets UK Ltd, FRN 595450 — always verify this exact FRN on the FCA Register before depositing funds with any site claiming to be Admirals.',
    },
    {
      q: 'How current is this data?',
      a: 'Every spread, commission, FRN and regulatory disclosure on this page was verified against official sources on 11 July 2026. Spreads fluctuate with market conditions and are shown as typical/average figures — confirm live pricing on the broker\'s own site before trading.',
    },
  ],
  compliance: {
    notice:
      'Not financial advice. Forex trading carries a high risk of loss for retail investors. FCA-regulated brokers cap retail leverage and require negative balance protection — confirm current terms before trading.',
    regulators: ['FCA'],
  },

  sources: [
    { label: 'FCA Register', url: 'https://register.fca.org.uk/' },
    { label: 'FCA — Admirals clone-firm warning', url: 'https://www.fca.org.uk/news/warnings/admiral-markets-ltd-clone' },
  ],
  relatedLinks: [
    { label: 'UK forex hub', href: '/uk/forex' },
    { label: 'Best CFD trading platforms (UK)', href: '/uk/trading/best/cfd-brokers' },
    { label: 'How SmartFinPro reviews products', href: '/methodology' },
  ],
};
