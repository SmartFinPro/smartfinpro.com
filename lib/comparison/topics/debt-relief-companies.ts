// lib/comparison/topics/debt-relief-companies.ts
// TopicConfig for "Best Debt Relief Companies" + the Zod schema that guards its
// `attributes` JSONB. Pure module — no React, no server imports.
//
// Cost model note: debt-relief fees are a one-time % of enrolled debt, not a
// recurring or compounding charge — uses `kind: 'fee-on-amount'` (see
// lib/comparison/cost.ts). `management_fee` stores each provider's
// `fee_pct_mid` (the midpoint of its sourced fee range) per the source matrix
// at docs/superpowers/plans/2026-07-02-cockpit-debt-relief-source-matrix.md.
//
// GreenPath is a non-profit Debt Management Plan (DMP), not a settlement
// service — it charges no % settlement fee but repays 100% of principal over
// 36-60 months, and its real cost (setup + monthly fees) is a FIXED dollar
// total, not a % of enrolled debt. Fable-5 checkpoint review (Slice 1) caught
// that a naive `management_fee = 0` would (a) falsely "win" the lowest-fee
// column against real settlement providers and (b) show a false $0 in the
// cost calculator. Fix: `is_nonprofit_dmp` routes GreenPath's Fee/CompareRow
// accessors to Infinity/-Infinity sentinels (mathematically excludes it from
// ever winning a min/max comparison without poisoning the other rows' Math.min
// /Math.max), and `costModel.flatFeeAccessor` shows its real fixed-dollar DMP
// cost instead of a fee%-of-amount figure. The `is_nonprofit_dmp` attribute +
// a dedicated filter pill let users self-select; pros/cons and deep_dive carry
// the "no debt reduction" trade-off explicitly.

import { z } from 'zod';
import type { TopicConfig } from './types';
import type { ProductForComparison } from '@/lib/comparison/types';

/** Debt-relief-specific facts stored in product_attributes.attributes. Validated per row. */
export const debtReliefAttributesSchema = z
  .object({
    fee_pct_min: z.number().min(0).max(100),
    fee_pct_max: z.number().min(0).max(100),
    min_debt: z.number().min(0),
    program_months_min: z.number().min(1),
    program_months_max: z.number().min(1),
    // AADR (formerly AFCC) accredited. Nullable: several candidates only claim
    // membership in a differently-named/unclear body (e.g. "ACDR") — nullable
    // lets the seed honestly record "unknown" instead of a false true/false.
    afcc: z.boolean().nullable(),
    iapda: z.boolean(),
    free_consult: z.boolean(),
    is_nonprofit_dmp: z.boolean(),
    states_note: z.string(),
    /** Non-profit DMP only: fixed dollar program cost (setup + monthly fees
     *  over a typical program), independent of enrolled-debt amount. */
    dmp_flat_total: z.number().min(0).optional(),
  })
  .passthrough();

const attr = (p: ProductForComparison, k: string): boolean => p.attributes?.[k] === true;
/** Tri-state accreditation (true/false/unknown) — `null` renders as "—", never a false "No". */
const attrTri = (p: ProductForComparison, k: string): boolean | null =>
  typeof p.attributes?.[k] === 'boolean' ? (p.attributes[k] as boolean) : null;
const attrNum = (p: ProductForComparison, k: string): number =>
  typeof p.attributes?.[k] === 'number' ? (p.attributes[k] as number) : 0;
const attrStr = (p: ProductForComparison, k: string): string =>
  typeof p.attributes?.[k] === 'string' ? (p.attributes[k] as string) : '';
const yesNo = (b: boolean) => (b ? 'Yes' : 'No');
const triLabel = (b: boolean | null) => (b === null ? '—' : yesNo(b));
const usd = (n: number) => (n ? `$${Math.round(n).toLocaleString('en-US')}` : '$0');
const programLength = (p: ProductForComparison) =>
  Math.round((attrNum(p, 'program_months_min') + attrNum(p, 'program_months_max')) / 2);
/** GreenPath's DMP isn't a % of enrolled debt at all — Infinity/-Infinity are
 *  real, non-NaN numbers that mathematically can never win a min/max column
 *  comparison, without poisoning Math.min/Math.max for the other rows. */
const feeSortValue = (p: ProductForComparison) => (attr(p, 'is_nonprofit_dmp') ? Infinity : p.managementFee);

export const debtReliefCompaniesConfig: TopicConfig = {
  slug: 'companies',
  category: 'debt-relief',
  label: 'Debt Relief Companies',
  h1: (y) => `Best debt relief companies in ${y}`,
  metaTitle: (y) => `Best Debt Relief Companies (${y}) — Compared & Ranked`,
  metaDescription: (y) =>
    `Compare the best debt relief companies of ${y}: settlement fees, minimum enrolled debt, program length and accreditation — plus a live cost calculator on your own balance.`,
  intro:
    'Independent, side-by-side comparison of the leading US debt relief companies — settlement services ranked by fees, minimum debt and accreditation, alongside a non-profit debt management alternative, with a live cost projection on your own enrolled balance.',
  publishedDate: '2026-07-03',
  attributesSchema: debtReliefAttributesSchema,

  specColumns: [
    {
      key: 'fee',
      label: 'Settlement fee',
      accessor: feeSortValue,
      format: (v) => (v === Infinity ? 'No % fee (DMP)' : `${v}%`),
      winner: 'min',
      sortKey: 'fee',
    },
    {
      key: 'minDebt',
      label: 'Min. enrolled debt',
      accessor: (p) => attrNum(p, 'min_debt'),
      format: (v) => usd(Number(v)),
      winner: 'min',
      sortKey: 'min',
    },
    {
      key: 'afcc',
      label: 'AADR accredited',
      accessor: (p) => (attrTri(p, 'afcc') === true ? 1 : attrTri(p, 'afcc') === false ? 0 : -1),
      format: (v) => (Number(v) < 0 ? '—' : Number(v) ? 'Yes' : 'No'),
      winner: 'max',
    },
    {
      key: 'iapda',
      label: 'IAPDA accredited',
      accessor: (p) => (attr(p, 'iapda') ? 1 : 0),
      format: (v) => (Number(v) ? 'Yes' : 'No'),
      winner: 'max',
    },
  ],

  filters: [
    { key: 'afcc', label: 'AADR (ex-AFCC) accredited', predicate: (p) => attr(p, 'afcc') },
    { key: 'iapda', label: 'IAPDA accredited', predicate: (p) => attr(p, 'iapda') },
    { key: 'nonprofit', label: 'Non-profit (no settlement)', predicate: (p) => attr(p, 'is_nonprofit_dmp') },
    { key: 'lowMin', label: 'Low minimum debt', predicate: (p) => attrNum(p, 'min_debt') <= 7_500 },
    { key: 'freeConsult', label: 'Free consultation', predicate: (p) => attr(p, 'free_consult') },
  ],

  priorityChips: [
    { id: 'cost', label: 'Lowest cost', icon: 'Coins', sort: 'cost' },
    { id: 'fee', label: 'Lowest fee', icon: 'Percent', sort: 'fee' },
    { id: 'min', label: 'Lowest minimum', icon: 'Wallet', sort: 'min' },
    { id: 'rating', label: 'Top rated', icon: 'Star', sort: 'rating' },
  ],

  matcher: [
    {
      id: 'settlement',
      label: 'Want to avoid a debt settlement mark (protect your credit score)?',
      weight: 14,
      options: [
        { value: 'yes', label: 'Yes, avoid settlement' },
        { value: 'no', label: "Doesn't matter" },
      ],
      award: (p, a) =>
        a === 'yes' ? { matched: attr(p, 'is_nonprofit_dmp'), reason: 'Non-profit debt management' } : { matched: true },
    },
    {
      id: 'accredited',
      label: 'Want double accreditation (AADR + IAPDA)?',
      weight: 12,
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: "Doesn't matter" },
      ],
      award: (p, a) =>
        a === 'yes' ? { matched: attr(p, 'afcc') && attr(p, 'iapda'), reason: 'AADR + IAPDA accredited' } : { matched: true },
    },
    {
      id: 'debt',
      label: 'How much debt do you need to resolve?',
      weight: 10,
      options: [
        { value: 'small', label: 'Under $10,000' },
        { value: 'big', label: '$10,000+' },
      ],
      award: (p, a) =>
        a === 'small' ? { matched: attrNum(p, 'min_debt') <= 7_500, reason: 'Low minimum enrollment' } : { matched: true },
    },
  ],

  sortOptions: [
    { value: 'smart', label: 'Smart rank', metric: (p) => p.score },
    { value: 'cost', label: 'Lowest cost on your balance', metric: () => 0 }, // special-cased in orderProducts
    // GreenPath (is_nonprofit_dmp) has no % settlement fee to compare — feeSortValue
    // returns Infinity for it, so it sorts last on "Lowest fee" rather than falsely
    // topping the list with a $0 that isn't really the same metric. Use the
    // "Non-profit (no settlement)" filter to find it directly.
    { value: 'fee', label: 'Lowest fee', metric: (p) => -feeSortValue(p) },
    { value: 'min', label: 'Lowest minimum debt', metric: (p) => -attrNum(p, 'min_debt') },
    { value: 'rating', label: 'Best rated', metric: (p) => p.rating * 100 + p.score },
  ],

  costModel: {
    kind: 'fee-on-amount',
    // GreenPath's real cost is a fixed dollar total (setup + monthly fees),
    // not a % of enrolled debt — flatFeeAccessor shows that instead of a
    // misleading $0 (see Fable-5 checkpoint note in the file header).
    flatFeeAccessor: (p) =>
      typeof p.attributes?.dmp_flat_total === 'number' ? p.attributes.dmp_flat_total : null,
    amountLabel: 'Enrolled debt',
    amountMin: 5_000,
    amountMax: 100_000,
    amountStep: 1_000,
    amountDefault: 20_000,
    yearsLabel: 'Program length (years)',
    yearsMin: 2,
    yearsMax: 4,
    yearsDefault: 3,
  },

  compareRows: [
    { key: 'fee', label: 'Settlement fee', accessor: (p) => (attr(p, 'is_nonprofit_dmp') ? 'No % fee (DMP)' : `${p.managementFee}%`), score: (p) => -feeSortValue(p) },
    { key: 'min', label: 'Min. enrolled debt', accessor: (p) => usd(attrNum(p, 'min_debt')), score: (p) => -attrNum(p, 'min_debt') },
    { key: 'program', label: 'Typical program length', accessor: (p) => `${programLength(p)} months`, score: (p) => -programLength(p) },
    { key: 'afcc', label: 'AADR (ex-AFCC) accredited', accessor: (p) => triLabel(attrTri(p, 'afcc')), score: (p) => (attrTri(p, 'afcc') === true ? 1 : 0) },
    { key: 'iapda', label: 'IAPDA accredited', accessor: (p) => yesNo(attr(p, 'iapda')), score: (p) => (attr(p, 'iapda') ? 1 : 0) },
    { key: 'model', label: 'Program type', accessor: (p) => (attr(p, 'is_nonprofit_dmp') ? 'Non-profit debt management (DMP)' : 'For-profit debt settlement') },
  ],

  detailRows: [
    { key: 'states', label: 'State availability', accessor: (p) => attrStr(p, 'states_note') || '—' },
    { key: 'consult', label: 'Free consultation', accessor: (p) => yesNo(attr(p, 'free_consult')) },
    { key: 'range', label: 'Fee range', accessor: (p) => (attr(p, 'is_nonprofit_dmp') ? 'No % fee (DMP)' : `${attrNum(p, 'fee_pct_min')}%–${attrNum(p, 'fee_pct_max')}%`) },
  ],

  verdict: {
    intro: "Our editors' picks for the best debt relief companies right now.",
    picks: [],
  },
  methodology:
    "We compare settlement fees, minimum enrolled debt, program length, and industry accreditation (AADR — formerly AFCC — and IAPDA) from each provider's official disclosures and BBB/Trustpilot records, re-verified quarterly. We flag regulatory history where it exists. Where a provider's own site doesn't publish an exact fee percentage (e.g. CuraDebt), we show the industry-standard range as a transparent estimate rather than inventing false precision. Rankings never depend on commissions.",
  buyerGuide: [
    {
      h3: 'Settlement fees',
      body: 'Most for-profit debt settlement companies charge 15-25% of your enrolled debt, collected only after a debt is successfully settled — never upfront. Small differences compound on larger balances, so compare the dollar impact with the cost slider.',
    },
    {
      h3: 'Debt settlement vs. debt management',
      body: "Settlement companies negotiate to pay less than you owe, at the cost of missed payments hurting your credit short-term. Non-profit debt management plans (DMPs) like GreenPath repay 100% of principal over 3-5 years with reduced interest — no credit-score hit from missed payments, but no debt reduction either.",
    },
    {
      h3: 'Accreditation',
      body: 'AADR (formerly AFCC) and IAPDA membership signal adherence to industry best practices and consumer protection standards. Double-accredited providers have passed a stricter compliance bar.',
    },
    {
      h3: 'State availability',
      body: 'Not every provider operates in every state — check availability before enrolling, since regulations on debt settlement vary significantly by state.',
    },
  ],
  faq: [
    {
      q: 'How is the cost calculated?',
      a: "We apply each provider's settlement fee percentage to your enrolled debt amount — this is a one-time fee, not a recurring charge, so it doesn't change with a program-length slider. Move the amount slider to see your own number.",
    },
    {
      q: 'How does SmartFinPro rank debt relief companies?',
      a: 'Our Smart Rank blends our independent score, your projected cost, fees and ratings. The order never depends on commissions.',
    },
    {
      q: 'Are these affiliate links?',
      a: 'Some are. A green "View offer" may earn us a commission at no cost to you, and only ever appears for partners whose tracking we have verified. It never affects the ranking.',
    },
    {
      q: 'Will debt settlement hurt my credit score?',
      a: "Yes, typically — settlement requires stopping payments to creditors, which can lower your score before it recovers. Non-profit debt management plans (DMPs) avoid this by repaying the full balance instead of settling for less.",
    },
    {
      q: 'Does every company on this list have a clean regulatory history?',
      a: "No — where a provider has a documented CFPB or other regulatory action, we disclose it directly in that provider's card and deep-dive rather than omitting it. Check the pros/cons and details before enrolling.",
    },
  ],
  compliance: {
    notice: 'Not a lender · debt settlement can negatively impact your credit score and may involve tax consequences on forgiven debt.',
    regulators: [],
  },
};
