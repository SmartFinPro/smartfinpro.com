// lib/comparison/topics/au/forex-brokers.ts
// TopicConfig for "Best Forex Brokers (Australia)" — registered under
// 'au:forex/forex-brokers'. Shares the 'forex/forex-brokers' slug with
// us/uk/ca for hreflang clustering; fully independent AU-specific editorial
// content. Pure module — no React/server imports.
//
// Cost model mirrors forex-brokers.ts (US) exactly: 'fee-on-amount' with the
// DEFAULT feeAccessor (p.managementFee) — management_fee stores the combined
// round-turn cost rate as a % of notional (spread-in-pips x $10/lot +
// commission $, divided by the $100,000 lot notional). costLabel defaults to
// "Cost on volume" (formatCostLabel) — correct for this kind, no override.
//
// Regulatory notes surfaced honestly per SEO addendum §4/§14 (no unbelegte
// claims, but also no silent omission of real, sourced legal/compliance
// history): IC Markets has an ACTIVE Federal Court of Australia class action
// (Echo Law, filed re: CFD sales practices, opt-out passed Dec 2025);
// Pepperstone self-reported and REMEDIATED a 2023 ASIC leverage-cap breach
// (ASIC media release 23-298MR, 1,500+ clients compensated) — disclosed, not
// disqualifying, mirroring how the US shortlist treated Freedom Debt
// Relief/Americor (disclose, don't silently exclude).

import { z } from 'zod';
import type { TopicConfig } from './../types';
import type { ProductForComparison } from '@/lib/comparison/types';

export const auForexBrokersAttributesSchema = z
  .object({
    asic_afsl: z.string(),
    avg_spread_eurusd_pips: z.number(),
    commission_round_turn_aud: z.number(), // per standard lot, 0 if spread-only account
    account_type_note: z.string(), // which account type the spread/commission figures are for
    max_leverage: z.string(), // e.g. "30:1" — ASIC cap on FX majors
    platforms: z.array(z.string()).min(1),
    trustpilot_rating: z.number().nullable(),
    trustpilot_count: z.number().nullable(),
    trustpilot_note: z.string(), // scope caveat — most Trustpilot pages are global/brand-aggregate, not AU-entity-specific
    retail_loss_pct: z.number().nullable(), // ASIC-mandated disclosure; null where not independently confirmed from a live PDS
    regulatory_note: z.string().optional(), // material, sourced legal/compliance history — empty string if none
  })
  .passthrough();

const attr = (p: ProductForComparison, k: string): boolean => p.attributes?.[k] === true;
const attrStr = (p: ProductForComparison, k: string): string =>
  typeof p.attributes?.[k] === 'string' ? (p.attributes[k] as string) : '';
const attrNum = (p: ProductForComparison, k: string): number =>
  typeof p.attributes?.[k] === 'number' ? (p.attributes[k] as number) : 0;
const attrNumOrNull = (p: ProductForComparison, k: string): number | null =>
  typeof p.attributes?.[k] === 'number' ? (p.attributes[k] as number) : null;
const attrArr = (p: ProductForComparison, k: string): string[] =>
  Array.isArray(p.attributes?.[k]) ? (p.attributes[k] as string[]) : [];
const yesNo = (b: boolean) => (b ? 'Yes' : 'No');
const pct = (n: number) => `${n.toFixed(3)}%`;
const aud = (n: number) => `A$${n.toFixed(2)}`;

export const auForexBrokersConfig: TopicConfig = {
  slug: 'forex-brokers',
  category: 'forex',
  label: 'Forex Brokers',
  h1: (y) => `Best forex brokers in Australia (${y})`,
  metaTitle: (y) => `Best Forex Brokers Australia (${y})`,
  metaDescription: (y) =>
    `Compare ASIC-regulated forex brokers in Australia for ${y} by all-in trading cost, leverage, platforms and regulatory record — independent, sourced.`,
  intro:
    'Independent, side-by-side comparison of ASIC-regulated forex brokers for Australian retail traders — ranked by all-in trading cost on your own annual volume, leverage, platforms and regulatory record.',
  publishedDate: '2026-07-10',
  attributesSchema: auForexBrokersAttributesSchema,

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
      accessor: (p) => attrNum(p, 'commission_round_turn_aud'),
      format: (v) => aud(Number(v)),
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
    { key: 'noMin', label: 'No minimum deposit', predicate: (p) => p.accountMinimum === 0 },
    { key: 'mt4', label: 'MetaTrader 4', predicate: (p) => attrArr(p, 'platforms').includes('MT4') },
    { key: 'mt5', label: 'MetaTrader 5', predicate: (p) => attrArr(p, 'platforms').includes('MT5') },
    { key: 'ctrader', label: 'cTrader', predicate: (p) => attrArr(p, 'platforms').includes('cTrader') },
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
          ? { matched: attrNum(p, 'avg_spread_eurusd_pips') <= 0.1, reason: 'Tight raw spreads for frequent trading' }
          : { matched: true },
    },
    {
      id: 'platform',
      label: 'Which platform do you want?',
      weight: 12,
      options: [
        { value: 'mt', label: 'MetaTrader 4/5' },
        { value: 'ctrader', label: 'cTrader' },
        { value: 'any', label: "Doesn't matter" },
      ],
      award: (p, a) => {
        if (a === 'mt') return { matched: attrArr(p, 'platforms').includes('MT4') || attrArr(p, 'platforms').includes('MT5'), reason: 'MetaTrader support' };
        if (a === 'ctrader') return { matched: attrArr(p, 'platforms').includes('cTrader'), reason: 'cTrader support' };
        return { matched: true };
      },
    },
    {
      id: 'deposit',
      label: 'Want no minimum deposit?',
      weight: 8,
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: "Doesn't matter" },
      ],
      award: (p, a) => (a === 'yes' ? { matched: p.accountMinimum === 0, reason: 'No minimum deposit' } : { matched: true }),
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
    { key: 'commission', label: 'Commission (round-turn)', accessor: (p) => aud(attrNum(p, 'commission_round_turn_aud')), score: (p) => -attrNum(p, 'commission_round_turn_aud') },
    { key: 'leverage', label: 'Max leverage', accessor: (p) => attrStr(p, 'max_leverage') },
    { key: 'platforms', label: 'Platforms', accessor: (p) => attrArr(p, 'platforms').join(', ') || '—', score: (p) => attrArr(p, 'platforms').length },
    { key: 'minDeposit', label: 'Min. deposit', accessor: (p) => (p.accountMinimum ? `A$${p.accountMinimum}` : 'No minimum'), score: (p) => -p.accountMinimum },
    {
      key: 'loss',
      label: 'Retail loss rate',
      accessor: (p) => {
        const v = attrNumOrNull(p, 'retail_loss_pct');
        return v === null ? 'Not independently confirmed' : `${v.toFixed(1)}% of retail accounts`;
      },
    },
    { key: 'afsl', label: 'ASIC AFSL', accessor: (p) => attrStr(p, 'asic_afsl') || '—' },
  ],

  detailRows: [
    { key: 'accountNote', label: 'Account type (spread/commission basis)', accessor: (p) => attrStr(p, 'account_type_note') || '—' },
    { key: 'trustpilotNote', label: 'Rating source note', accessor: (p) => attrStr(p, 'trustpilot_note') || '—' },
    { key: 'regulatory', label: 'Regulatory history', accessor: (p) => attrStr(p, 'regulatory_note') || 'No material regulatory history found at research time.' },
  ],

  verdict: {
    intro:
      'Tightest raw spreads, the broadest platform lineup of the group (MT4, MT5, cTrader and native TradingView), and a 2023 leverage-cap matter it self-reported and fully remediated under ASIC oversight — Pepperstone leads on that combination. Traders prioritising cost above all else should look at Fusion Markets, which pairs no minimum deposit with the lowest commission in the field. For a long, clean track record, CMC Markets is the safer bet: dual ASIC licences and no regulatory red flags found.',
    picks: [
      { slug: 'pepperstone-au', label: 'Best overall' },
      { slug: 'fusion-markets', label: 'Best value / lowest cost' },
      { slug: 'cmc-markets-forex-au', label: 'Best long-track-record choice' },
    ],
  },
  methodology:
    "We compare each broker's spread and commission on their raw/ECN account (or standard spread-only account where no raw tier exists), converted to an all-in cost rate on your own annual trading volume, alongside ASIC AFSL licensing, leverage caps, platform choice and consumer rating. Regulatory and legal history is sourced directly from ASIC media releases and court filings where it exists, and disclosed plainly rather than omitted — a disclosed, resolved compliance matter is treated differently from an unresolved one. Retail loss percentages (ASIC's mandated 'X% of retail accounts lose money' disclosure) are shown only where independently confirmed from a live source; where a broker's current figure could not be verified, we say so rather than publish an unconfirmed number. Rankings never depend on commissions — every provider on this page is currently a visit-only listing.",
  buyerGuide: [
    {
      h3: 'ASIC leverage caps and negative balance protection',
      body: 'ASIC caps leverage for retail clients at 30:1 on major FX pairs (lower on other asset classes), and requires ASIC-licensed brokers to hold client funds in segregated trust accounts and provide negative balance protection. This applies to all 7 brokers on this page — check the AFSL number against ASIC\'s public register if you want to verify a broker independently.',
    },
    {
      h3: 'Spread-only vs. raw spread + commission',
      body: 'Spread-only accounts (no separate commission) are simpler but usually cost more per trade than a raw/ECN account, which pairs a near-zero spread with a flat or percentage commission. Active and high-volume traders generally save money on a raw account; occasional traders may prefer the simplicity of a spread-only account.',
    },
    {
      h3: 'What the retail-loss disclosure means',
      body: "ASIC-regulated brokers must disclose what percentage of their own retail clients lost money over a trailing period — a regulator-mandated warning, not a marketing claim. Historically this figure runs high across the industry (well above half of retail accounts), underscoring that leveraged forex trading is high-risk. We show this figure only where we could independently confirm a current number.",
    },
    {
      h3: 'Reading disclosed regulatory history honestly',
      body: "One broker on this page (IC Markets) has an active Federal Court class action related to past CFD sales practices; another (Pepperstone) self-reported and fully remediated a 2023 leverage-cap breach under ASIC oversight, compensating affected clients. We disclose both plainly in the detail view rather than omitting them — a resolved, transparently-handled compliance matter is materially different from an active, unresolved legal action, and we describe each accordingly rather than treating them the same.",
    },
  ],
  faq: [
    {
      q: 'What is the best forex broker in Australia in 2026?',
      a: "Pepperstone, on balance: it combines the tightest raw spreads with the broadest platform choice — MT4, MT5, cTrader and native TradingView. Cost-focused traders tend to prefer Fusion Markets, which has no minimum deposit and the lowest commission of the seven. CMC Markets is the pick for anyone prioritising a long, clean regulatory track record — dual ASIC licences, no red flags found. Pricing and features are re-verified regularly, and commissions never determine the ranking.",
    },
    {
      q: 'Are these brokers actually regulated in Australia?',
      a: 'Yes — all 7 hold an ASIC Australian Financial Services Licence (AFSL), independently verifiable on ASIC\'s public Professional Registers Search. ASIC-licensed brokers must segregate client funds, cap retail leverage at 30:1 on major FX pairs, and provide negative balance protection.',
    },
    {
      q: 'What does the retail-loss percentage actually mean?',
      a: "It's a regulator-mandated disclosure of what percentage of a broker's own retail clients lost money over a recent period — not a marketing number, and historically a majority-or-more figure across the industry. We only display this figure where we could independently confirm a current number from the broker; where we could not, we say so rather than publish an unverified figure.",
    },
    {
      q: 'How is the cost comparison calculated?',
      a: "We convert each broker's spread and commission into an all-in cost rate, then apply it to your own estimated annual trading volume using the slider above — the ranking updates live. This reflects genuine trading costs, not account fees, since none of these brokers charge a monthly account fee.",
    },
    {
      q: 'How current is this data?',
      a: 'Every spread, commission, licence number and regulatory disclosure on this page was verified against official sources on 10 July 2026. Spreads fluctuate with market conditions and are shown as typical/average figures — confirm live pricing on the broker\'s own site before trading.',
    },
  ],
  compliance: {
    notice:
      'Not financial advice. Forex and CFD trading carries a high risk of loss for retail investors. ASIC-regulated brokers cap retail leverage and require negative balance protection — confirm current terms before trading.',
    regulators: ['ASIC'],
  },

  sources: [
    { label: 'ASIC — Professional Registers Search (AFSL lookup)', url: 'https://www.asic.gov.au/online-services/search-asic-registers/professional-registers-search/' },
    { label: 'ASIC Moneysmart — CFDs investment warning', url: 'https://moneysmart.gov.au/investment-warnings/contracts-for-difference-cfds' },
    { label: 'ASIC media release 23-298MR — CFD leverage breach remediation', url: 'https://www.asic.gov.au/about-asic/news-centre/find-a-media-release/2023-releases/23-298mr-asic-oversees-more-than-17-4-million-in-compensation-to-retail-investors-by-otc-derivative-issuers/' },
  ],
  relatedLinks: [
    { label: 'Australia forex hub', href: '/au/forex' },
    { label: 'Best CFD trading platforms (Australia)', href: '/au/trading/best/cfd-brokers' },
    { label: 'How SmartFinPro reviews products', href: '/methodology' },
  ],
};
