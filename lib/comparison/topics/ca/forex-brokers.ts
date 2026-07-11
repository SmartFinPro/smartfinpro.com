// lib/comparison/topics/ca/forex-brokers.ts
// TopicConfig for "Best Forex Brokers (Canada)" — registered under
// 'ca:forex/forex-brokers'. Shares the 'forex/forex-brokers' slug with
// us/uk/au for hreflang clustering; fully independent CA-specific editorial
// content. Pure module — no React/server imports.
//
// Cost model mirrors forex-brokers.ts (US) / au/forex-brokers.ts exactly:
// 'fee-on-amount' with the DEFAULT feeAccessor (p.managementFee) —
// management_fee stores the combined round-turn cost rate as a % of
// notional. costLabel defaults to "Cost on volume" (formatCostLabel) —
// correct for this kind, no override.
//
// Regulatory structure note (SEO addendum §4): Friedberg Direct and AvaTrade
// Canada are the SAME CIRO dealer member (Friedberg Mercantile Group Ltd.) —
// AvaTrade licenses its technology/branding to Friedberg for the Canadian
// market rather than holding its own CIRO registration. Both are kept as
// separate shortlist rows (distinct consumer-facing brands/platforms) but
// this shared-entity relationship is disclosed explicitly on both, not
// glossed over as two independently-regulated firms.
//
// Editorial disclosure (SEO addendum §14, same policy as AU slices): several
// 2024-2026 NFA/FINRA/CFTC enforcement actions surfaced during research
// target the US entities of these global brokers (OANDA Corporation, StoneX/
// GAIN Capital, Interactive Brokers LLC), not confirmed against the specific
// CIRO-regulated Canadian entity. Disclosed plainly with that scope caveat
// rather than either omitted or misattributed to the Canadian entity.
// Questrade's April 2025 Quebec class action (currency-conversion fee
// non-disclosure) is a live, Canada-specific matter and disclosed as such.

import { z } from 'zod';
import type { TopicConfig } from './../types';
import type { ProductForComparison } from '@/lib/comparison/types';

export const caForexBrokersAttributesSchema = z
  .object({
    ciro_member: z.string(), // the actual CIRO dealer member name (may differ from the brand name)
    avg_spread_eurusd_pips: z.number(),
    commission_round_turn_cad: z.number(), // per standard lot, 0 if spread-only account
    account_type_note: z.string(), // which account type the spread/commission figures are for
    max_leverage: z.string(), // e.g. "50:1" — CIRO cap on FX majors
    platforms: z.array(z.string()).min(1),
    trustpilot_rating: z.number().nullable(),
    trustpilot_count: z.number().nullable(),
    trustpilot_note: z.string(), // scope caveat — most Trustpilot pages are global/brand-aggregate, not CA-entity-specific
    regulatory_note: z.string().optional(), // material, sourced legal/compliance history — empty string if none
  })
  .passthrough();

const attrStr = (p: ProductForComparison, k: string): string =>
  typeof p.attributes?.[k] === 'string' ? (p.attributes[k] as string) : '';
const attrNum = (p: ProductForComparison, k: string): number =>
  typeof p.attributes?.[k] === 'number' ? (p.attributes[k] as number) : 0;
const attrArr = (p: ProductForComparison, k: string): string[] =>
  Array.isArray(p.attributes?.[k]) ? (p.attributes[k] as string[]) : [];
const cad = (n: number) => `C$${n.toFixed(2)}`;

export const caForexBrokersConfig: TopicConfig = {
  slug: 'forex-brokers',
  category: 'forex',
  label: 'Forex Brokers',
  h1: (y) => `Best forex brokers in Canada (${y})`,
  metaTitle: (y) => `Best Forex Brokers Canada (${y})`,
  metaDescription: (y) =>
    `Compare CIRO-regulated forex brokers in Canada for ${y} by all-in trading cost, leverage, platforms and regulatory record — independent, sourced.`,
  intro:
    'Independent, side-by-side comparison of CIRO-regulated forex brokers for Canadian retail traders — ranked by all-in trading cost on your own annual volume, leverage, platforms and regulatory record.',
  publishedDate: '2026-07-11',
  attributesSchema: caForexBrokersAttributesSchema,

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
      accessor: (p) => attrNum(p, 'commission_round_turn_cad'),
      format: (v) => cad(Number(v)),
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
          ? { matched: attrNum(p, 'avg_spread_eurusd_pips') <= 0.2, reason: 'Tight raw spreads for frequent trading' }
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
    { key: 'commission', label: 'Commission (round-turn)', accessor: (p) => cad(attrNum(p, 'commission_round_turn_cad')), score: (p) => -attrNum(p, 'commission_round_turn_cad') },
    { key: 'leverage', label: 'Max leverage', accessor: (p) => attrStr(p, 'max_leverage') },
    { key: 'platforms', label: 'Platforms', accessor: (p) => attrArr(p, 'platforms').join(', ') || '—', score: (p) => attrArr(p, 'platforms').length },
    { key: 'minDeposit', label: 'Min. deposit', accessor: (p) => (p.accountMinimum ? cad(p.accountMinimum) : 'No minimum'), score: (p) => -p.accountMinimum },
    { key: 'ciro', label: 'CIRO dealer member', accessor: (p) => attrStr(p, 'ciro_member') || '—' },
  ],

  detailRows: [
    { key: 'accountNote', label: 'Account type (spread/commission basis)', accessor: (p) => attrStr(p, 'account_type_note') || '—' },
    { key: 'trustpilotNote', label: 'Rating source note', accessor: (p) => attrStr(p, 'trustpilot_note') || '—' },
    { key: 'regulatory', label: 'Regulatory history', accessor: (p) => attrStr(p, 'regulatory_note') || 'No material regulatory history found at research time.' },
  ],

  verdict: {
    intro:
      'Active traders get the tightest pass-through spreads and lowest all-in cost from Interactive Brokers Canada, a direct CIRO/CIPF member and our top pick for that reason. CMC Markets Canada is the best all-round choice instead, pairing 330+ tradable pairs with no minimum deposit and no Canada-specific regulatory issues found. Beginners tend to do best with OANDA Canada, which offers genuinely native CAD accounts and a Toronto office.',
    picks: [
      { slug: 'interactive-brokers-ca', label: 'Best for active traders' },
      { slug: 'cmc-markets-ca', label: 'Best overall' },
      { slug: 'oanda-ca', label: 'Best for beginners' },
    ],
  },
  methodology:
    "We compare each broker's spread and commission on their raw/ECN account (or standard spread-only account where no raw tier exists), converted to an all-in cost rate on your own annual trading volume, alongside CIRO dealer membership, leverage caps, platform choice and consumer rating. Regulatory and legal history is sourced directly from CIRO, NFA, FINRA and CFTC records where it exists, and disclosed plainly rather than omitted — several enforcement actions found during research target a broker's US entity specifically, and we say so rather than imply the Canadian CIRO-regulated entity itself was sanctioned. Rankings never depend on commissions — every provider on this page is currently a visit-only listing.",
  buyerGuide: [
    {
      h3: 'CIRO membership and CIPF protection',
      body: "Canada has a single national regulator for investment dealers: CIRO (Canadian Investment Regulatory Organization, formed 2023 from the merger of IIROC and the MFDA). Every broker on this page is either a direct CIRO dealer member or operates through one — check the 'CIRO dealer member' row, since the regulated entity name sometimes differs from the consumer-facing brand (notably Friedberg Direct and AvaTrade Canada, see below). CIRO members must segregate client funds and are covered by CIPF up to $1M CAD per account category if the firm becomes insolvent.",
    },
    {
      h3: 'Friedberg Direct and AvaTrade Canada — the same regulated entity',
      body: 'AvaTrade Canada is not independently CIRO-registered. Canadian AvaTrade accounts are opened and held by Friedberg Mercantile Group Ltd. (trading as Friedberg Direct), which licenses AvaTrade\'s trading technology and branding for the Canadian market. Both are listed here as distinct consumer-facing products, but they share the same regulated entity, the same fund segregation, and the same CIPF coverage — worth knowing if you\'re choosing between the two.',
    },
    {
      h3: 'Spread-only vs. raw spread + commission',
      body: 'Spread-only accounts (no separate commission) are simpler but usually cost more per trade than a raw/ECN account, which pairs a near-zero spread with a flat or per-lot commission. Active and high-volume traders generally save money on a raw account; occasional traders may prefer the simplicity of a spread-only account.',
    },
    {
      h3: 'Reading disclosed regulatory history honestly',
      body: "Several enforcement actions surfaced during research — a US NFA fine against OANDA Corporation, US FINRA fines against Interactive Brokers LLC, and US NFA/CFTC fines against StoneX Markets LLC (FOREX.com's parent) — target each broker's US entity, not confirmed against the CIRO-regulated Canadian entity specifically. We disclose these plainly with that scope caveat. Separately, Questrade was named in an April 2025 Quebec class action alleging non-disclosure of currency-conversion fees — a live, Canada-specific matter, disclosed as such.",
    },
  ],
  faq: [
    {
      q: 'What is the best forex broker in Canada in 2026?',
      a: 'Interactive Brokers Canada, if you trade often — spreads and all-in cost undercut every other candidate, backed by a direct CIRO/CIPF membership. CMC Markets Canada suits a broader range of traders, with 330+ pairs, no minimum deposit, and no Canada-specific regulatory issues found. Beginners fit best with OANDA Canada, running native CAD accounts from a Toronto office. We re-verify pricing and features regularly; the ranking never depends on commissions.',
    },
    {
      q: 'Are these brokers actually regulated in Canada?',
      a: 'Yes — every broker on this page is a CIRO dealer member (Canadian Investment Regulatory Organization) either directly or, in the case of AvaTrade Canada, through Friedberg Mercantile Group Ltd., which holds the CIRO membership. CIRO members must segregate client funds and are covered by CIPF up to $1M CAD per account category.',
    },
    {
      q: 'What leverage can I get trading forex in Canada?',
      a: 'CIRO caps retail leverage similarly to other major regulators — typically up to 50:1 on major currency pairs like USD/CAD, with lower caps on some minor and cross pairs. Confirm the exact per-pair leverage table with your chosen broker before trading.',
    },
    {
      q: 'How is the cost comparison calculated?',
      a: "We convert each broker's spread and commission into an all-in cost rate, then apply it to your own estimated annual trading volume using the slider above — the ranking updates live. This reflects genuine trading costs, not account fees, since none of these brokers charge a monthly account fee.",
    },
    {
      q: 'How current is this data?',
      a: 'Every spread, commission and regulatory disclosure on this page was verified against official sources on 11 July 2026. Spreads fluctuate with market conditions and are shown as typical/average figures — confirm live pricing on the broker\'s own site before trading.',
    },
  ],
  compliance: {
    notice:
      'Not financial advice. Forex trading carries a high risk of loss for retail investors. CIRO-regulated brokers segregate client funds and are covered by CIPF up to $1M CAD per account category — CIPF does not protect against trading losses.',
    regulators: ['CIRO', 'CIPF'],
  },

  sources: [
    { label: 'CIRO — Dealers We Regulate', url: 'https://www.ciro.ca/office-investor/dealers-we-regulate' },
    { label: 'CIPF — About CIPF Coverage', url: 'https://www.cipf.ca/cipf-coverage/about-cipf-coverage' },
    { label: 'NFA — BASIC broker/firm lookup', url: 'https://www.nfa.futures.org/BasicNet/' },
  ],
  relatedLinks: [
    { label: 'Canada forex hub', href: '/ca/forex' },
    { label: 'Best TFSA/RRSP investing platforms', href: '/ca/tax-efficient-investing/best/tfsa-rrsp-platforms' },
    { label: 'How SmartFinPro reviews products', href: '/methodology' },
  ],
};
