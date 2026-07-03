// lib/comparison/topics/credit-repair-companies.ts
// TopicConfig for "Best Credit Repair Companies" + the Zod schema that guards
// its `attributes` JSONB. Pure module — no React, no server imports.
//
// Cost model note: credit repair pricing is a flat monthly subscription plus
// an optional one-time setup/first-work fee — uses the new `kind:
// 'monthly-plus-setup'` (see lib/comparison/cost.ts). `monthlyFee` (existing
// generic column) is the recurring fee; `setupFeeAccessor` reads
// `attributes.setup_fee` (null for MSI, whose real setup cost is
// case-by-case and never seeded as a misleading dollar figure). The generic
// "amount" slider is repurposed as a MONTHS-in-program dial (3-12), not a
// dollar amount.
//
// Ranked field is 6, not the original 9-candidate shortlist: Lexington Law is
// excluded entirely (per owner decision — its convicted entity, John C. Heath
// PC, was dissolved in Chapter 11; a successor, Oquirrh Mountain Law Group,
// bought the tradename and continues operating under the same damaged brand —
// a structural disqualifier, not a disclosure-eligible one, per the Fable-5
// research at docs/superpowers/plans/2026-07-03-cockpit-credit-repair-source-matrix.md).
// The Credit Pros is excluded (confirmed fake-review pattern + 47 mostly-TCPA
// federal suits). Ovation Credit Services is outright defunct since 2023
// (LendingTree shutdown) — not a judgment call, a factual correction.
//
// The Credit People's headline `rating`/`reviewCount` seeds from BestCompany
// (4.3/300), not Trustpilot's count-less 1.8 "Poor" figure — the same
// "score+source+count always together" rule this research applied to reject
// Sky Blue Credit's 2-review Trustpilot sample would be broken inconsistently
// by using Trustpilot's count-less number here instead. The 1.8 "Poor" figure
// is disclosed in both `cons` and the review-source note, not hidden.
//
// `nacso` is a tri-state (`boolean | null`), matching debt-relief's `afcc`
// pattern — only MSI Credit Solutions has a confirmed NACSO membership
// against a primary source; the rest are `null` (unconfirmed), never a false
// `true` or `false`.

import { z } from 'zod';
import type { TopicConfig } from './types';
import type { ProductForComparison } from '@/lib/comparison/types';

/** Credit-repair-specific facts stored in product_attributes.attributes. Validated per row. */
export const creditRepairAttributesSchema = z
  .object({
    setup_fee: z.number().nullable(), // null = variable/no fixed price (MSI)
    setup_fee_note: z.string().optional(),
    monthly_fee_note: z.string().optional(), // e.g. Safeport's cross-source price conflict
    dispute_scope_note: z.string(),
    guarantee_type: z.enum(['unconditional_refund', 'conditional_refund', 'partial_refund', 'none']),
    guarantee_note: z.string(),
    states_note: z.string(),
    bbb_rating: z.string(),
    bbb_rating_note: z.string().optional(), // e.g. Credit Firm's A+/A source disagreement
    bbb_accredited: z.boolean(),
    review_score: z.number(),
    review_count: z.number(),
    review_source: z.string(), // MUST render alongside score+count, never a bare number
    nacso: z.boolean().nullable(),
    attorney_led: z.boolean(),
    regulatory_history_note: z.string(),
  })
  .passthrough();

const attr = (p: ProductForComparison, k: string): boolean => p.attributes?.[k] === true;
const attrTri = (p: ProductForComparison, k: string): boolean | null =>
  typeof p.attributes?.[k] === 'boolean' ? (p.attributes[k] as boolean) : null;
const attrNum = (p: ProductForComparison, k: string): number =>
  typeof p.attributes?.[k] === 'number' ? (p.attributes[k] as number) : 0;
const attrNumOrNull = (p: ProductForComparison, k: string): number | null =>
  typeof p.attributes?.[k] === 'number' ? (p.attributes[k] as number) : null;
const attrStr = (p: ProductForComparison, k: string): string =>
  typeof p.attributes?.[k] === 'string' ? (p.attributes[k] as string) : '';
const usd = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: n % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 })}`;
const triLabel = (b: boolean | null) => (b === null ? '—' : b ? 'Yes' : 'No');

const BBB_ORDINAL: Record<string, number> = { NR: 0, C: 1, 'C+': 2, 'B-': 3, B: 4, 'B+': 5, 'A-': 6, A: 7, 'A+': 8 };
const bbbOrdinal = (p: ProductForComparison) => BBB_ORDINAL[attrStr(p, 'bbb_rating')] ?? -1;

const GUARANTEE_ORDINAL: Record<string, number> = { none: 0, partial_refund: 1, conditional_refund: 2, unconditional_refund: 3 };
const guaranteeOrdinal = (p: ProductForComparison) => GUARANTEE_ORDINAL[attrStr(p, 'guarantee_type')] ?? 0;
const GUARANTEE_LABEL: Record<string, string> = {
  none: 'No refund guarantee',
  partial_refund: 'Conditional refund (setup fee only)',
  conditional_refund: 'Conditional refund (if no deletions)',
  unconditional_refund: 'Unconditional refund',
};
const guaranteeLabelForType = (guaranteeType: string) => GUARANTEE_LABEL[guaranteeType] ?? '—';
const guaranteeLabel = (p: ProductForComparison) => guaranteeLabelForType(attrStr(p, 'guarantee_type'));

export const creditRepairCompaniesConfig: TopicConfig = {
  slug: 'companies',
  category: 'credit-repair',
  label: 'Credit Repair Companies',
  h1: (y) => `Best credit repair companies in ${y}`,
  metaTitle: (y) => `Best Credit Repair Companies (${y}) — Compared & Ranked`,
  metaDescription: (y) =>
    `Compare the best US credit repair companies of ${y}: monthly fees, setup costs, money-back guarantees and BBB ratings — independent, sourced, and honest about compliance history.`,
  intro:
    'Independent, side-by-side comparison of the leading US credit repair companies — ranked by monthly cost, setup fees, money-back guarantee strength and BBB standing, with a live cost calculator on your own program length.',
  publishedDate: '2026-07-03',
  attributesSchema: creditRepairAttributesSchema,

  specColumns: [
    {
      key: 'monthlyFee',
      label: 'Monthly fee',
      accessor: (p) => p.monthlyFee,
      format: (v) => `${usd(Number(v))}/mo`,
      winner: 'min',
      sortKey: 'cost',
    },
    {
      key: 'setupFee',
      label: 'Setup fee',
      accessor: (p) => attrNumOrNull(p, 'setup_fee'),
      format: (v) => (v === null ? 'Variable' : usd(Number(v))),
      winner: 'min',
    },
    {
      key: 'bbb',
      label: 'BBB rating',
      accessor: bbbOrdinal,
      format: (v) => Object.keys(BBB_ORDINAL).find((k) => BBB_ORDINAL[k] === Number(v)) ?? '—',
      winner: 'max',
    },
    {
      key: 'guarantee',
      label: 'Money-back guarantee',
      accessor: guaranteeOrdinal,
      format: (v) => {
        const entry = Object.entries(GUARANTEE_ORDINAL).find(([, n]) => n === Number(v));
        return entry ? guaranteeLabelForType(entry[0]) : '—';
      },
      winner: 'max',
    },
  ],

  filters: [
    { key: 'bbbAccredited', label: 'BBB accredited', predicate: (p) => attr(p, 'bbb_accredited') },
    { key: 'attorneyLed', label: 'Attorney-led', predicate: (p) => attr(p, 'attorney_led') },
    { key: 'unconditionalGuarantee', label: 'Unconditional money-back guarantee', predicate: (p) => attrStr(p, 'guarantee_type') === 'unconditional_refund' },
    { key: 'noSetupFee', label: 'No setup fee', predicate: (p) => attrNumOrNull(p, 'setup_fee') === 0 },
    { key: 'lowCost', label: 'Under $80/month', predicate: (p) => p.monthlyFee < 80 },
  ],

  priorityChips: [
    { id: 'cost', label: 'Lowest cost', icon: 'Coins', sort: 'cost' },
    { id: 'guarantee', label: 'Best guarantee', icon: 'Star', sort: 'guarantee' },
    { id: 'rating', label: 'Top rated', icon: 'Star', sort: 'rating' },
    { id: 'attorney', label: 'Attorney-led', icon: 'Users', sort: 'attorney' },
  ],

  matcher: [
    {
      id: 'cost',
      label: 'Want the lowest monthly cost?',
      weight: 14,
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: "Doesn't matter" },
      ],
      award: (p, a) => (a === 'yes' ? { matched: p.monthlyFee < 80, reason: 'Low monthly fee' } : { matched: true }),
    },
    {
      id: 'guarantee',
      label: 'Want an unconditional money-back guarantee?',
      weight: 12,
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: "Doesn't matter" },
      ],
      award: (p, a) =>
        a === 'yes'
          ? { matched: attrStr(p, 'guarantee_type') === 'unconditional_refund', reason: 'Unconditional guarantee' }
          : { matched: true },
    },
    {
      id: 'attorney',
      label: 'Prefer an attorney-led service?',
      weight: 10,
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: "Doesn't matter" },
      ],
      award: (p, a) => (a === 'yes' ? { matched: attr(p, 'attorney_led'), reason: 'Attorney-led' } : { matched: true }),
    },
  ],

  sortOptions: [
    { value: 'smart', label: 'Smart rank', metric: (p) => p.score },
    { value: 'cost', label: 'Lowest cost on your program length', metric: () => 0 }, // special-cased in orderProducts
    { value: 'guarantee', label: 'Best money-back guarantee', metric: (p) => guaranteeOrdinal(p) * 10 + p.score },
    { value: 'rating', label: 'Best rated', metric: (p) => attrNum(p, 'review_score') * 100 + p.score },
    { value: 'attorney', label: 'Attorney-led', metric: (p) => (attr(p, 'attorney_led') ? 1000 : 0) + p.score },
  ],

  costModel: {
    kind: 'monthly-plus-setup',
    setupFeeAccessor: (p) => attrNumOrNull(p as ProductForComparison, 'setup_fee'),
    amountLabel: 'Months in program',
    amountMin: 3,
    amountMax: 12,
    amountStep: 1,
    amountDefault: 6,
    yearsLabel: 'Unused',
    yearsMin: 1,
    yearsMax: 1,
    yearsDefault: 1,
  },

  compareRows: [
    { key: 'monthly', label: 'Monthly fee', accessor: (p) => `${usd(p.monthlyFee)}/mo`, score: (p) => -p.monthlyFee },
    {
      key: 'setup',
      label: 'Setup fee',
      accessor: (p) => (attrNumOrNull(p, 'setup_fee') === null ? 'Variable' : usd(attrNumOrNull(p, 'setup_fee') as number)),
      score: (p) => -(attrNumOrNull(p, 'setup_fee') ?? 0),
    },
    { key: 'guarantee', label: 'Money-back guarantee', accessor: guaranteeLabel, score: guaranteeOrdinal },
    { key: 'bbb', label: 'BBB rating', accessor: (p) => attrStr(p, 'bbb_rating'), score: bbbOrdinal },
    { key: 'bbbAccredited', label: 'BBB accredited', accessor: (p) => triLabel(attr(p, 'bbb_accredited')), score: (p) => (attr(p, 'bbb_accredited') ? 1 : 0) },
    {
      key: 'rating',
      label: 'Consumer review score',
      accessor: (p) => `${attrNum(p, 'review_score')}/5 (${attrNum(p, 'review_count')} ${attrStr(p, 'review_source')} reviews)`,
      score: (p) => attrNum(p, 'review_score'),
    },
    { key: 'attorney', label: 'Attorney-led', accessor: (p) => triLabel(attr(p, 'attorney_led')), score: (p) => (attr(p, 'attorney_led') ? 1 : 0) },
    { key: 'nacso', label: 'NACSO member', accessor: (p) => triLabel(attrTri(p, 'nacso')), score: (p) => (attrTri(p, 'nacso') === true ? 1 : 0) },
  ],

  detailRows: [
    { key: 'disputeScope', label: 'Dispute scope', accessor: (p) => attrStr(p, 'dispute_scope_note') || '—' },
    { key: 'guaranteeNote', label: 'Guarantee detail', accessor: (p) => attrStr(p, 'guarantee_note') || '—' },
    { key: 'states', label: 'State availability', accessor: (p) => attrStr(p, 'states_note') || '—' },
    { key: 'regulatory', label: 'Regulatory history', accessor: (p) => attrStr(p, 'regulatory_history_note') || '—' },
    { key: 'pricingNote', label: 'Pricing detail', accessor: (p) => attrStr(p, 'monthly_fee_note') || attrStr(p, 'setup_fee_note') || '—' },
  ],

  verdict: {
    intro: "Our editors' picks for the best US credit repair companies right now.",
    picks: [
      { slug: 'credit-saint', label: 'Best overall' },
      { slug: 'sky-blue-credit', label: 'Best money-back guarantee' },
      { slug: 'credit-firm', label: 'Cheapest overall' },
    ],
  },
  methodology:
    "We compare monthly fees, setup/first-work fees, money-back guarantee terms, BBB rating and accreditation, dispute scope, and regulatory history from each company's official pricing pages and BBB/consumer-review records, re-verified quarterly. Consumer review scores always show the source and review count alongside the number — several companies in this category have wildly divergent scores across platforms (small or manipulated samples), so a bare star rating without its source is not trustworthy. We disclose regulatory and litigation history directly on a candidate's card rather than omitting it; two shortlisted companies (Lexington Law, still operating under a successor entity after its predecessor's $2.7B CFPB judgment and Chapter 11 dissolution, and The Credit Pros, with a confirmed fake-review pattern and an unusual volume of federal litigation) were excluded from the ranked field entirely rather than featured with a disclaimer, because their compliance and reputation problems are current and structural, not historical footnotes. Rankings never depend on commissions.",
  buyerGuide: [
    {
      h3: 'The CROA advance-fee rule',
      body: 'The federal Credit Repair Organizations Act (CROA) prohibits any credit repair company from charging you before it has fully performed the promised services — this is the same law Lexington Law\'s predecessor entity was found to have violated on an industry-wide scale. CROA also guarantees a 3-day right to cancel any contract with no penalty, and requires a written contract disclosing your legal rights before you pay anything.',
    },
    {
      h3: 'What credit repair can and cannot do',
      body: 'No company, regardless of price or marketing claims, can legally remove accurate negative information from your credit report — only inaccurate, outdated, or unverifiable items can be disputed and removed. You can dispute errors yourself, for free, directly with the credit bureaus via annualcreditreport.com; credit repair companies are paying for convenience and expertise in navigating that process, not for outcomes no self-directed disputer could also achieve.',
    },
    {
      h3: 'Why some states restrict credit repair services',
      body: "Several states, including Georgia, place additional restrictions on commercial credit repair organizations, with an exception for licensed attorneys — this is why Safeport Law's attorney-led model exists and why Credit Saint excludes Georgia from its service area entirely. Always confirm a company operates in your state before enrolling.",
    },
    {
      h3: 'Is there an industry accreditation that matters?',
      body: 'Unlike debt relief (AADR, IAPDA), there is no broadly-recognized, independently-audited accreditation body for credit repair. NACSO (National Association of Credit Services Organizations) is the closest analog, but it is a thin, self-regulating trade association without a reliably published, independently verifiable member list — treat NACSO membership as a mild positive signal, not a certification of quality.',
    },
  ],
  faq: [
    {
      q: 'How is the multi-month cost calculated?',
      a: "We combine each company's one-time setup fee (where one applies) with its monthly subscription fee, multiplied by your chosen program length in months. This is a subscription-style cost, not a percentage of your debt or credit-limit exposure — move the months slider to see the total for a shorter or longer program.",
    },
    {
      q: 'How does SmartFinPro rank credit repair companies?',
      a: 'Our Smart Rank blends our independent score, cost, money-back guarantee strength and consumer ratings. The order never depends on commissions.',
    },
    {
      q: 'Are these affiliate links?',
      a: 'One is. A green "View offer" may earn us a commission at no cost to you, and only ever appears for partners whose tracking we have verified. It never affects the ranking.',
    },
    {
      q: 'What happened to Lexington Law?',
      a: "Lexington Law's predecessor entity, John C. Heath, Attorney at Law PC, was found liable for a $2.7 billion CFPB judgment (2023) for illegally charging advance fees, and was dissolved in Chapter 11 bankruptcy. A successor company, Oquirrh Mountain Law Group, purchased the Lexington Law tradename and continues operating under the same brand today, subject to a 10-year telemarketing ban running through roughly 2033. We do not include it in our ranked comparison — read our full Lexington Law review for the compliance details.",
    },
    {
      q: "Why isn't The Credit Pros or Ovation Credit Services listed?",
      a: 'The Credit Pros has a confirmed pattern of incentivized/fake reviews (its Trustpilot score has been suspended for this) plus an unusually high volume of federal litigation, mostly TCPA telemarketing claims. Ovation Credit Services stopped operating entirely in mid-2023 when its parent company, LendingTree, shut it down. Neither is a fit for an honest, current comparison.',
    },
    {
      q: 'Is a money-back guarantee the same at every company?',
      a: "No — they vary significantly. Sky Blue Credit offers an unconditional 90-day refund with no strings attached. Most competitors' guarantees are conditional on no items being deleted within 90 days, and some only refund the setup fee rather than monthly payments already made. Credit Firm, the cheapest company in this comparison, offers no money-back guarantee at all. Check the guarantee type column and each company's detail row before enrolling.",
    },
  ],
  compliance: {
    notice:
      'Not legal advice · credit repair cannot remove accurate negative information from your credit report, and results vary by individual credit history. Free self-help alternatives exist — disputing errors directly with the credit bureaus via annualcreditreport.com costs nothing.',
    regulators: ['FTC', 'CFPB'],
  },
};
