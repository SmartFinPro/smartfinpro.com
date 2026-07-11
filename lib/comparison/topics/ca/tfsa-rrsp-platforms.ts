// lib/comparison/topics/ca/tfsa-rrsp-platforms.ts
// TopicConfig for "Best TFSA/RRSP Investing Platforms (Canada)" —
// registered under 'ca:tax-efficient-investing/tfsa-rrsp-platforms'.
// CA-exclusive category and topic (self-directed/DIY discount brokerages,
// distinct from the managed-portfolio robo-advisors page on the same site).
// Pure module — no React/server imports.
//
// Cost model: 'banking' — monthly_fee holds the monthly-ized registered-
// account maintenance fee (waivable at a balance/trade threshold per
// provider, documented in fee_waiver_note); commission-per-trade is a
// separate, non-recurring cost shown in specColumns/compareRows as
// `winner:'min'` since it can't drive a honest recurring-cost calculator
// (matches the US trading-platforms.ts precedent for commission display).

import { z } from 'zod';
import type { TopicConfig } from './../types';
import type { ProductForComparison } from '@/lib/comparison/types';

export const caTfsaRrspAttributesSchema = z
  .object({
    commission_per_trade_cad: z.number(),
    fee_waiver_note: z.string(),
    account_types: z.array(z.string()).min(1),
    cipf_protected: z.boolean(),
    research_tools_note: z.string(),
    trustpilot_rating: z.number().nullable(),
    trustpilot_count: z.number().nullable(),
    trustpilot_note: z.string(),
    regulatory_note: z.string().optional(), // material, sourced compliance history — empty if none
  })
  .passthrough();

const attrStr = (p: ProductForComparison, k: string): string =>
  typeof p.attributes?.[k] === 'string' ? (p.attributes[k] as string) : '';
const attrNumOrNull = (p: ProductForComparison, k: string): number | null =>
  typeof p.attributes?.[k] === 'number' ? (p.attributes[k] as number) : null;
const attrNum = (p: ProductForComparison, k: string): number =>
  typeof p.attributes?.[k] === 'number' ? (p.attributes[k] as number) : 0;
const attrBool = (p: ProductForComparison, k: string): boolean => p.attributes?.[k] === true;
const attrArr = (p: ProductForComparison, k: string): string[] =>
  Array.isArray(p.attributes?.[k]) ? (p.attributes[k] as string[]) : [];
const yesNo = (b: boolean) => (b ? 'Yes' : 'No');
const cad = (n: number) => (n ? `C$${n.toFixed(2)}` : 'C$0 (commission-free)');

export const caTfsaRrspPlatformsConfig: TopicConfig = {
  slug: 'tfsa-rrsp-platforms',
  category: 'tax-efficient-investing',
  label: 'TFSA/RRSP Investing Platforms',
  h1: (y) => `Best TFSA & RRSP investing platforms in Canada (${y})`,
  metaTitle: (y) => `Best TFSA/RRSP Platforms Canada (${y})`,
  metaDescription: (y) =>
    `Compare Canadian self-directed TFSA and RRSP brokerages of ${y} by commission, account fees and CIRO/CIPF protection — independent, sourced.`,
  intro:
    'Independent, side-by-side comparison of self-directed Canadian discount brokerages for TFSA and RRSP investing — ranked by commission, account fees and features. For managed/robo-advisor portfolios, see our separate robo-advisors comparison.',
  publishedDate: '2026-07-11',
  attributesSchema: caTfsaRrspAttributesSchema,

  specColumns: [
    {
      key: 'commission',
      label: 'Commission per trade',
      accessor: (p) => attrNum(p, 'commission_per_trade_cad'),
      format: (v) => cad(Number(v)),
      winner: 'min',
    },
    {
      key: 'accountFee',
      label: 'Account fee',
      accessor: (p) => p.monthlyFee,
      format: (v) => (Number(v) ? `C$${(Number(v) * 12).toFixed(0)}/yr` : 'C$0'),
      winner: 'min',
    },
    {
      key: 'accountTypes',
      label: 'Account types',
      accessor: (p) => attrArr(p, 'account_types').length,
      format: (v) => `${v}`,
      winner: 'max',
    },
  ],

  filters: [
    { key: 'freeTrades', label: 'Commission-free trading', predicate: (p) => attrNum(p, 'commission_per_trade_cad') === 0 },
    { key: 'noFee', label: 'No account fee', predicate: (p) => p.monthlyFee === 0 },
    { key: 'fhsa', label: 'FHSA supported', predicate: (p) => attrArr(p, 'account_types').includes('FHSA') },
  ],

  priorityChips: [
    { id: 'cost', label: 'Lowest cost', icon: 'Coins', sort: 'cost' },
    { id: 'research', label: 'Best research tools', icon: 'Search', sort: 'research' },
    { id: 'rating', label: 'Top rated', icon: 'Star', sort: 'rating' },
  ],

  matcher: [
    {
      id: 'commission',
      label: 'How often do you trade?',
      weight: 14,
      options: [
        { value: 'often', label: 'Frequently' },
        { value: 'rarely', label: 'Rarely / buy-and-hold' },
      ],
      award: (p, a) =>
        a === 'often'
          ? { matched: attrNum(p, 'commission_per_trade_cad') === 0, reason: 'Commission-free trading' }
          : { matched: true },
    },
    {
      id: 'fhsa',
      label: 'Need an FHSA?',
      weight: 10,
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: "Doesn't matter" },
      ],
      award: (p, a) => (a === 'yes' ? { matched: attrArr(p, 'account_types').includes('FHSA'), reason: 'FHSA supported' } : { matched: true }),
    },
  ],

  sortOptions: [
    { value: 'smart', label: 'Smart rank', metric: (p) => p.score },
    { value: 'cost', label: 'Lowest cost', metric: (p) => -attrNum(p, 'commission_per_trade_cad') * 10 - p.monthlyFee + p.score },
    { value: 'research', label: 'Best research tools', metric: (p) => p.score },
    { value: 'rating', label: 'Best rated', metric: (p) => (attrNumOrNull(p, 'trustpilot_rating') ?? 0) * 100 + p.score },
  ],

  costModel: {
    kind: 'banking',
    amountLabel: 'Representative usage',
    amountMin: 0,
    amountMax: 0,
    amountStep: 1,
    amountDefault: 0,
    yearsLabel: 'Years',
    yearsMin: 1,
    yearsMax: 5,
    yearsDefault: 3,
  },

  compareRows: [
    { key: 'commission', label: 'Commission per trade', accessor: (p) => cad(attrNum(p, 'commission_per_trade_cad')), score: (p) => -attrNum(p, 'commission_per_trade_cad') },
    { key: 'accountFee', label: 'Account fee', accessor: (p) => (p.monthlyFee ? `C$${(p.monthlyFee * 12).toFixed(0)}/yr` : 'C$0'), score: (p) => -p.monthlyFee },
    { key: 'waiver', label: 'Fee waiver', accessor: (p) => attrStr(p, 'fee_waiver_note') || '—' },
    { key: 'accounts', label: 'Account types', accessor: (p) => attrArr(p, 'account_types').join(', ') || '—', score: (p) => attrArr(p, 'account_types').length },
    { key: 'research', label: 'Research tools', accessor: (p) => attrStr(p, 'research_tools_note') || '—' },
    { key: 'cipf', label: 'CIPF protected', accessor: (p) => yesNo(attrBool(p, 'cipf_protected')), score: (p) => (attrBool(p, 'cipf_protected') ? 1 : 0) },
    {
      key: 'rating',
      label: 'Consumer rating',
      accessor: (p) => {
        const r = attrNumOrNull(p, 'trustpilot_rating');
        return r === null ? 'Not yet rated' : `${r}/5 (${attrStr(p, 'trustpilot_note')})`;
      },
      score: (p) => attrNumOrNull(p, 'trustpilot_rating') ?? 0,
    },
  ],

  detailRows: [
    { key: 'regulatory', label: 'Regulatory / compliance notes', accessor: (p) => attrStr(p, 'regulatory_note') || 'No material issues found at research time.' },
  ],

  verdict: {
    intro:
      'Wealthsimple wins this comparison outright: zero commissions, zero account fee, and broader account-type support than any other candidate. Qtrade Direct Investing is worth watching closely — as of October 2025 it eliminated both its trading commissions and its CAD account fee, on top of a run of independent satisfaction awards. Frequent traders, however, will find the lowest ongoing cost structure at Questrade.',
    picks: [
      { slug: 'wealthsimple-trade', label: 'Best overall' },
      { slug: 'qtrade-direct-investing', label: 'Most improved / best research' },
      { slug: 'questrade-self-directed', label: 'Best for active traders' },
    ],
  },
  methodology:
    "We compare each brokerage's commission per trade, account maintenance fee and waiver conditions, account-type support and research tools from official pricing pages, verifying CIRO/CIPF protection directly for each. Commission-per-trade is shown as a standalone figure rather than folded into the recurring-cost calculator, since it's a per-transaction cost, not a subscription — the calculator instead reflects each account's ongoing maintenance fee. We disclose material service or regulatory issues plainly rather than omitting them. Rankings never depend on commissions — every provider on this page is currently a visit-only listing.",
  buyerGuide: [
    {
      h3: 'Commission-free trading — what changed',
      body: "As of 2025, three of the seven (Wealthsimple, Questrade, and Qtrade as of October 2025) charge $0 commission on Canadian and US stock/ETF trades. The four bank-owned brokers (TD, RBC, BMO, Scotia) still charge C$9.95–$9.99 per trade standard, dropping to C$3.95–$7.00 at high volume (150+ trades/quarter).",
    },
    {
      h3: 'Account fees and how to avoid them',
      body: 'Most bank brokers waive their C$25/quarter-equivalent registered-account fee once your balance passes C$15,000–$25,000, or with a minimum number of trades per year. RBC has recently eliminated its account fee entirely regardless of balance — a genuine, verified improvement over older reviews that may still cite a fee. TFSA accounts specifically are fee-free at several providers even below the general threshold.',
    },
    {
      h3: 'This page is DIY, not managed',
      body: 'This comparison covers self-directed brokerages where you choose your own investments — for a managed, algorithm-run portfolio instead, see our separate robo-advisors comparison. Some names (Wealthsimple, Questrade) offer both product types under different sub-brands; we scope this page to the self-directed product specifically.',
    },
    {
      h3: 'Research tools vary meaningfully',
      body: "TD Direct Investing and Qtrade both bundle Morningstar research; Qtrade adds Recognia technical analysis and a portfolio-planning suite. Questrade's Questrade Edge includes TipRanks-powered analyst ratings. If you plan to research investments on-platform rather than elsewhere, this is a real differentiator beyond price.",
    },
  ],
  faq: [
    {
      q: 'What is the best TFSA/RRSP platform in Canada?',
      a: 'For most people, Wealthsimple: zero commissions, zero account fee, and the widest account-type support here. Qtrade Direct Investing deserves a mention too, having eliminated both commissions and its CAD account fee in October 2025, plus a run of satisfaction awards. Frequent traders come out ahead at Questrade instead, with the lowest ongoing cost. We re-verify pricing regularly, and the ranking never depends on commissions.',
    },
    {
      q: 'Is my money protected at these brokerages?',
      a: 'Yes — all 7 are CIRO-regulated investment dealers and CIPF members, protecting client cash and securities up to $1M per account category (a separate $1M for registered retirement accounts) if the dealer becomes insolvent. This does not protect against market losses.',
    },
    {
      q: 'Are trades really commission-free now?',
      a: "At Wealthsimple, Questrade and Qtrade, yes, on Canadian and US stock/ETF trades. The four bank-owned brokers (TD, RBC, BMO, Scotia) still charge a standard commission, though it drops meaningfully at high trading volume. Options trading carries a per-contract fee everywhere, and FX conversion spreads apply to USD trades regardless of provider.",
    },
    {
      q: 'TFSA vs RRSP vs FHSA — which should I choose?',
      a: 'This is a mechanical, not personalized, answer: TFSA offers tax-free growth and withdrawal (2026 room: C$7,000); RRSP offers a tax deduction now with taxable withdrawals later (2026 limit: C$33,810 or 18% of prior-year income); FHSA combines both benefits but only for a first-home purchase (C$8,000/year, C$40,000 lifetime). Consult the CRA or a financial advisor for which fits your personal situation.',
    },
    {
      q: 'How current is this data?',
      a: 'Every commission, fee and account-type figure on this page was verified against official pricing pages on 11 July 2026. Several providers changed pricing significantly in late 2025 (Qtrade\'s fee elimination, RBC\'s account-fee removal) — confirm current terms on the provider\'s site before opening an account.',
    },
  ],
  compliance: {
    notice:
      'Not financial advice. Investment values can fall as well as rise. CIPF protects client cash and securities up to $1M per category if a member firm becomes insolvent — it does not protect against market losses.',
    regulators: ['CIRO', 'CIPF'],
  },

  sources: [
    { label: 'CIRO — Dealers We Regulate', url: 'https://www.ciro.ca/office-investor/dealers-we-regulate' },
    { label: 'CIPF — About CIPF Coverage', url: 'https://www.cipf.ca/cipf-coverage/about-cipf-coverage' },
    { label: 'CRA — TFSA contribution room', url: 'https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/tax-free-savings-account/contributing/calculate-room.html' },
  ],
  relatedLinks: [
    { label: 'Canada tax-efficient investing hub', href: '/ca/tax-efficient-investing' },
    { label: 'Best robo-advisors (Canada)', href: '/ca/personal-finance/best/robo-advisors' },
    { label: 'How SmartFinPro reviews products', href: '/methodology' },
  ],
};
