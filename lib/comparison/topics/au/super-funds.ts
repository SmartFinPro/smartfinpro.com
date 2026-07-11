// lib/comparison/topics/au/super-funds.ts
// TopicConfig for "Best Superannuation Funds (Australia)" — registered under
// 'au:superannuation/super-funds'. AU-exclusive category and topic. Pure
// module — no React/server imports.
//
// HARD COMPLIANCE STOP (do not remove without legal review): under the
// Corporations Act Part 7.7A "conflicted remuneration" ban (part of the
// Future of Financial Advice reforms), commission-based referral
// arrangements on superannuation product recommendations are PROHIBITED in
// Australia. This topic is visit-only by design (is_affiliate=false,
// external_url only, no /go links) — do NOT flip any row on this topic to
// is_affiliate=true or attach an affiliate_link_id without a legal review
// confirming a lawful, non-conflicted monetisation model exists. See rollout
// plan risk register ("AU-Super-Monetarisierung").
//
// Cost model: 'compounding-fee' — genuinely fits: managementFee is each
// fund's total annual fee % on APRA's standard $50,000 representative-member
// benchmark (the industry-mandated RG 97 comparison figure), growthRate
// approximates a long-term balanced-option return.
//
// Editorial disclosure (SEO addendum §14, same policy as AU-1/AU-2): the
// largest fund (AustralianSuper) has an ACTIVE, unresolved ASIC Federal Court
// case over death-benefit claims handling and a confirmed member financial
// loss in an April 2025 credential-stuffing attack — disclosed in full via
// `regulatory_note`, not top-ranked while unresolved.

import { z } from 'zod';
import type { TopicConfig } from './../types';
import type { ProductForComparison } from '@/lib/comparison/types';

export const auSuperFundsAttributesSchema = z
  .object({
    total_fee_aud_on_50k: z.number(), // RG 97 standardised "cost of product" example, $50,000 balance
    flat_admin_fee_aud: z.number().nullable(),
    default_option: z.string(), // MySuper default investment option name
    ten_year_return_pct: z.number().nullable(),
    return_period_note: z.string(), // exact period the return figure covers
    members_millions: z.number().nullable(),
    aum_billions_aud: z.number().nullable(),
    aum_note: z.string(), // as-at date / source caveat
    award_note: z.string(),
    mysuper_authorised: z.boolean(),
    regulatory_note: z.string().optional(), // material, sourced compliance/incident history — empty if none
  })
  .passthrough();

const attrStr = (p: ProductForComparison, k: string): string =>
  typeof p.attributes?.[k] === 'string' ? (p.attributes[k] as string) : '';
const attrNumOrNull = (p: ProductForComparison, k: string): number | null =>
  typeof p.attributes?.[k] === 'number' ? (p.attributes[k] as number) : null;
const attrBool = (p: ProductForComparison, k: string): boolean => p.attributes?.[k] === true;
const yesNo = (b: boolean) => (b ? 'Yes' : 'No');
const aud = (n: number) => `A$${n.toFixed(0)}`;
const pct = (n: number) => `${n.toFixed(2)}%`;

export const auSuperFundsConfig: TopicConfig = {
  slug: 'super-funds',
  category: 'superannuation',
  label: 'Superannuation Funds',
  h1: (y) => `Best superannuation funds in Australia (${y})`,
  metaTitle: (y) => `Best Super Funds Australia (${y})`,
  metaDescription: (y) =>
    `Compare Australian superannuation funds of ${y} by fees on a $50,000 balance, 10-year returns and APRA performance-test status — independent, sourced.`,
  intro:
    "Independent, side-by-side comparison of APRA-regulated Australian superannuation funds — ranked by the industry-standard $50,000 fee example, long-term returns and regulatory record. General information only, not personal financial advice.",
  publishedDate: '2026-07-11',
  attributesSchema: auSuperFundsAttributesSchema,

  specColumns: [
    {
      key: 'fee',
      label: 'Fees on A$50,000',
      accessor: (p) => p.managementFee,
      format: (v) => pct(Number(v)),
      winner: 'min',
      sortKey: 'fee',
    },
    {
      key: 'return',
      label: '10-yr return p.a.',
      accessor: (p) => attrNumOrNull(p, 'ten_year_return_pct') ?? -1,
      format: (v) => (Number(v) < 0 ? 'Not confirmed' : `${Number(v).toFixed(2)}%`),
      winner: 'max',
    },
    {
      key: 'aum',
      label: 'Funds under management',
      accessor: (p) => attrNumOrNull(p, 'aum_billions_aud') ?? 0,
      format: (v) => (Number(v) ? `A$${Number(v).toFixed(0)}bn+` : 'Not confirmed'),
      winner: 'max',
    },
    {
      key: 'mysuper',
      label: 'MySuper authorised',
      accessor: (p) => (attrBool(p, 'mysuper_authorised') ? 1 : 0),
      format: (v) => yesNo(!!Number(v)),
    },
  ],

  filters: [
    { key: 'lowFee', label: 'Below-median fee (< 0.8% on $50k)', predicate: (p) => p.managementFee < 0.8 },
    { key: 'award', label: 'Recent fund-of-the-year award', predicate: (p) => attrStr(p, 'award_note').length > 0 },
  ],

  priorityChips: [
    { id: 'fee', label: 'Lowest fee', icon: 'Coins', sort: 'fee' },
    { id: 'return', label: 'Best 10-yr return', icon: 'TrendingUp', sort: 'return' },
    { id: 'size', label: 'Largest fund', icon: 'Building', sort: 'size' },
  ],

  matcher: [
    {
      id: 'priority',
      label: "What matters most to you in a super fund?",
      weight: 16,
      options: [
        { value: 'fee', label: 'Lowest fees' },
        { value: 'return', label: 'Best long-term performance' },
        { value: 'either', label: "Doesn't matter" },
      ],
      award: (p, a) => {
        if (a === 'fee') return { matched: p.managementFee < 0.8, reason: 'Below-median fee' };
        if (a === 'return') return { matched: (attrNumOrNull(p, 'ten_year_return_pct') ?? 0) >= 8, reason: 'Strong 10-year return' };
        return { matched: true };
      },
    },
    {
      id: 'clean',
      label: 'Want to avoid a fund with active regulatory action?',
      weight: 12,
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: "Doesn't matter" },
      ],
      award: (p, a) => (a === 'yes' ? { matched: !attrStr(p, 'regulatory_note'), reason: 'No material regulatory history found' } : { matched: true }),
    },
  ],

  sortOptions: [
    { value: 'smart', label: 'Smart rank', metric: (p) => p.score },
    { value: 'fee', label: 'Lowest fee on $50k', metric: (p) => -p.managementFee * 1000 + p.score },
    { value: 'return', label: 'Best 10-yr return', metric: (p) => (attrNumOrNull(p, 'ten_year_return_pct') ?? 0) * 100 + p.score },
    { value: 'size', label: 'Largest fund', metric: (p) => (attrNumOrNull(p, 'aum_billions_aud') ?? 0) + p.score },
  ],

  costModel: {
    kind: 'compounding-fee',
    growthRate: 0.07,
    amountLabel: 'Super balance',
    amountMin: 0,
    amountMax: 500_000,
    amountStep: 5000,
    amountDefault: 50_000,
    yearsLabel: 'Years',
    yearsMin: 1,
    yearsMax: 30,
    yearsDefault: 10,
  },

  compareRows: [
    { key: 'fee', label: 'Fees on A$50,000 (RG 97 example)', accessor: (p) => `${aud(attrNumOrNull(p, 'total_fee_aud_on_50k') ?? 0)}/yr (${pct(p.managementFee)})`, score: (p) => -p.managementFee },
    { key: 'admin', label: 'Flat admin fee', accessor: (p) => { const v = attrNumOrNull(p, 'flat_admin_fee_aud'); return v === null ? 'Tiered / see PDS' : `${aud(v)}/yr`; } },
    { key: 'default', label: 'Default (MySuper) option', accessor: (p) => attrStr(p, 'default_option') || '—' },
    { key: 'return', label: '10-year return', accessor: (p) => { const v = attrNumOrNull(p, 'ten_year_return_pct'); return v === null ? 'Not confirmed' : `${v.toFixed(2)}% p.a. (${attrStr(p, 'return_period_note')})`; }, score: (p) => attrNumOrNull(p, 'ten_year_return_pct') ?? 0 },
    { key: 'members', label: 'Members', accessor: (p) => { const v = attrNumOrNull(p, 'members_millions'); return v === null ? 'Not confirmed' : `${v.toFixed(1)}M+`; } },
    { key: 'aum', label: 'Funds under management', accessor: (p) => `${attrStr(p, 'aum_note')}` },
    { key: 'award', label: 'Recent award', accessor: (p) => attrStr(p, 'award_note') || 'None found at research time' },
  ],

  detailRows: [
    { key: 'mysuper', label: 'MySuper authorised', accessor: (p) => yesNo(attrBool(p, 'mysuper_authorised')) },
    { key: 'regulatory', label: 'Regulatory / incident history', accessor: (p) => attrStr(p, 'regulatory_note') || 'No material regulatory history found at research time.' },
  ],

  verdict: {
    intro:
      'Aware Super is our top pick — the only fund in this comparison named SuperRatings Fund of the Year in both 2025 and 2026, with strong 10-year performance, falling admin fees, and no material regulatory history found. Australian Retirement Trust is the strongest value pick with a below-median fee and multiple 2025/26 awards, and Hostplus has the best long-term track record — ranked #1 for 10, 15 and 20-year MySuper performance by SuperRatings.',
    picks: [
      { slug: 'aware-super', label: 'Best overall' },
      { slug: 'australian-retirement-trust', label: 'Best value' },
      { slug: 'hostplus', label: 'Best long-term performance' },
    ],
  },
  methodology:
    "We compare each fund's total fee on APRA's standardised $50,000-balance example (the RG 97 disclosure every super PDS must publish, the only apples-to-apples fee figure across funds with different fee structures), 10-year net returns on the default MySuper option, scale, recent independent awards (SuperRatings, Canstar, Money magazine) and regulatory record — sourced from each fund's PDS/fees page and APRA/ASIC/regulator releases. All 7 funds hold APRA MySuper authorisation and passed APRA's 2025 annual performance test. We disclose material regulatory or security history plainly rather than omitting it, and a fund with an active, unresolved matter is not treated as a top pick while it remains open. This page is general information only, not personal financial advice, and carries no commission-based CTAs — direct referral commissions on superannuation are prohibited in Australia under the Corporations Act's conflicted-remuneration rules.",
  buyerGuide: [
    {
      h3: 'What APRA regulation actually covers',
      body: "All 7 funds are APRA-regulated RSE licensees with an APRA MySuper-authorised default option. APRA runs an annual performance test that funds must pass or face restrictions on accepting new members after two consecutive failures — all 7 funds' MySuper products passed in 2025. This is prudential safety/performance regulation, not personal financial advice, and doesn't replace getting advice tailored to your own circumstances.",
    },
    {
      h3: 'Why the $50,000 fee example is the number that matters',
      body: "Funds structure fees differently — flat dollar amounts, percentage-of-balance, tiered caps, and sometimes a performance fee — making raw percentages misleading to compare directly. ASIC's Regulatory Guide 97 requires every fund to publish a standardised dollar example at a $50,000 balance, which is the one genuinely comparable figure across all 7 funds here.",
    },
    {
      h3: 'MySuper vs. Choice investment options',
      body: '"MySuper" is the low-cost default every fund must offer for members who don\'t actively pick an investment strategy — this is what APRA\'s performance test assesses, and what every figure on this page describes. "Choice" investment options (including some funds\' own named "Growth" or ESG options) sit outside MySuper, often cost more, and are tested separately with a materially higher historical failure rate — check which category any option you\'re considering falls into.',
    },
    {
      h3: 'Reading disclosed regulatory and security history honestly',
      body: 'AustralianSuper — the largest fund in this comparison — faces an active, unresolved ASIC Federal Court case alleging failures in processing death benefit claims, and was the only fund among several targeted in an April 2025 credential-stuffing attack to have a confirmed member financial loss. We disclose this in full rather than omitting it because of the fund\'s scale, and it is not our top pick while the matter remains open. Separately, UniSuper experienced a severe 2024 cloud-infrastructure outage that locked members out of online accounts for over a week — a resolved operational incident, disclosed for transparency.',
    },
  ],
  faq: [
    {
      q: 'What is the best superannuation fund in Australia?',
      a: 'Aware Super is our top pick — the only fund in this comparison named SuperRatings Fund of the Year in both 2025 and 2026, with strong 10-year performance and no material regulatory history found. Australian Retirement Trust offers the strongest value on fees, and Hostplus has the best long-term track record. This is general information, not personal financial advice — your own circumstances matter.',
    },
    {
      q: 'How protected is my money in a super fund?',
      a: "All 7 funds are APRA-regulated RSE licensees, and their default MySuper options passed APRA's 2025 annual performance test. That's prudential regulation of the fund's safety and performance — it doesn't guarantee investment returns, which can fall as well as rise.",
    },
    {
      q: 'Why do fee percentages look so different between funds?',
      a: "Funds use different fee structures — flat dollar admin fees, percentage-of-balance fees, tiered caps, and sometimes performance fees — so raw percentages alone can mislead. We use APRA's mandated $50,000-balance example, the one standardised, genuinely comparable dollar figure every fund must publish.",
    },
    {
      q: 'Can SmartFinPro earn a commission for super fund sign-ups?',
      a: "No. Commission-based referral arrangements on superannuation recommendations are prohibited in Australia under the Corporations Act's conflicted-remuneration rules. Every link on this page goes directly to the fund's own official site — this comparison carries no monetised CTAs.",
    },
    {
      q: 'How current is this data?',
      a: 'Every fee, return figure and regulatory disclosure on this page was researched against official fund PDS/fee pages and regulator sources on 11 July 2026. Fee schedules typically update each 1 July and return figures are stated for the period ending 30 June 2025 — always confirm current figures in the fund\'s live PDS before making a decision.',
    },
  ],
  compliance: {
    notice:
      'General information only, not personal financial advice. Commission-based referral arrangements on superannuation recommendations are prohibited in Australia — this page carries no monetised CTAs, only direct links to each fund\'s official site. Investment returns can fall as well as rise.',
    regulators: ['APRA'],
  },

  sources: [
    { label: 'ATO — APRA YourSuper comparison tool', url: 'https://www.ato.gov.au/calculators-and-tools/super-yoursuper-comparison-tool' },
    { label: 'APRA — annual superannuation performance test', url: 'https://www.apra.gov.au/annual-superannuation-performance-test' },
    { label: 'ASIC Moneysmart — how super works', url: 'https://moneysmart.gov.au/how-super-works' },
  ],
  relatedLinks: [
    { label: 'Australia personal finance hub', href: '/au/personal-finance' },
    { label: 'Best robo-advisors & micro-investing', href: '/au/personal-finance/best/robo-advisors' },
    { label: 'How SmartFinPro reviews products', href: '/methodology' },
  ],
};
