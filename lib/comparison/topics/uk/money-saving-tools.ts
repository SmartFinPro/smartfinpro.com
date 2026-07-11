// lib/comparison/topics/uk/money-saving-tools.ts
// TopicConfig for "Best Cost-of-Living / Money-Saving Tools (UK)" —
// registered under 'uk:cost-of-living/money-saving-tools'. UK-exclusive
// category/topic (no US/CA/AU equivalent on this site). Pure module — no
// React/server imports.
//
// Cost model: 'banking' with monthly_fee=0 seeded for all 7 — every provider
// here is free to the consumer (comparison sites and cashback portals earn
// retailer commission; the two budgeting apps have a free core tier, with
// optional paid tiers disclosed in starting_price_note rather than reflected
// in the cost figure).
//
// Ownership transparency (SEO addendum §4): MoneySuperMarket and Quidco
// share the same FTSE 250 parent (MONY Group, which also owns
// MoneySavingExpert) — disclosed via business_model_note so readers don't
// assume two fully independent recommendations.
//
// Editorial disclosure (SEO addendum §14): TopCashback and Quidco both carry
// a genuine, recurring pattern of cashback payout delays and tracking
// failures — an industry-wide issue (retailer-side tracking-pixel
// reliability), disclosed for both rather than singling out either. Chip's
// FSCS claim is disclosed precisely: funds are held via partner bank
// ClearBank, and the £120,000 protection is aggregated across all
// ClearBank-held products, not per product.

import { z } from 'zod';
import type { TopicConfig } from './../types';
import type { ProductForComparison } from '@/lib/comparison/types';

export const ukMoneySavingToolsAttributesSchema = z
  .object({
    tool_type: z.enum(['energy_comparison', 'multi_category_comparison', 'cashback_portal', 'budgeting_app']),
    business_model_note: z.string(),
    key_feature_note: z.string(),
    ofgem_accredited: z.boolean().nullable(), // null = not applicable (cashback portals, budgeting apps)
    trustpilot_rating: z.number().nullable(),
    trustpilot_count: z.number().nullable(),
    trustpilot_note: z.string(),
    regulatory_note: z.string().optional(), // material, sourced compliance/ownership history — empty if none
  })
  .passthrough();

const attrStr = (p: ProductForComparison, k: string): string =>
  typeof p.attributes?.[k] === 'string' ? (p.attributes[k] as string) : '';
const attrNumOrNull = (p: ProductForComparison, k: string): number | null =>
  typeof p.attributes?.[k] === 'number' ? (p.attributes[k] as number) : null;
const attrBoolOrNull = (p: ProductForComparison, k: string): boolean | null =>
  typeof p.attributes?.[k] === 'boolean' ? (p.attributes[k] as boolean) : null;
const yesNo = (b: boolean) => (b ? 'Yes' : 'No');

const TYPE_LABEL: Record<string, string> = {
  energy_comparison: 'Energy comparison',
  multi_category_comparison: 'Multi-category comparison',
  cashback_portal: 'Cashback portal',
  budgeting_app: 'Budgeting app',
};

export const ukMoneySavingToolsConfig: TopicConfig = {
  slug: 'money-saving-tools',
  category: 'cost-of-living',
  label: 'Money-Saving Tools',
  h1: (y) => `Best money-saving tools in the UK (${y})`,
  metaTitle: (y) => `Best UK Money-Saving Tools (${y})`,
  metaDescription: (y) =>
    `Compare UK cost-of-living tools of ${y}: energy comparison sites, cashback portals and free budgeting apps, independent, expert-reviewed and sourced.`,
  intro:
    'Independent, side-by-side comparison of UK cost-of-living tools (energy and multi-category comparison sites, cashback portals, and budgeting apps), all genuinely free to use.',
  publishedDate: '2026-07-11',
  attributesSchema: ukMoneySavingToolsAttributesSchema,

  specColumns: [
    {
      key: 'type',
      label: 'Tool type',
      accessor: (p) => attrStr(p, 'tool_type'),
      format: (v) => TYPE_LABEL[String(v)] ?? String(v),
    },
    {
      key: 'ofgem',
      label: 'Ofgem accredited',
      accessor: (p) => {
        const v = attrBoolOrNull(p, 'ofgem_accredited');
        return v === null ? -1 : v ? 1 : 0;
      },
      format: (v) => (Number(v) === -1 ? 'N/A' : yesNo(Number(v) === 1)),
    },
    {
      key: 'rating',
      label: 'Consumer rating',
      accessor: (p) => attrNumOrNull(p, 'trustpilot_rating') ?? 0,
      format: (v) => (Number(v) === 0 ? 'Not yet rated' : `${Number(v).toFixed(1)}/5`),
      winner: 'max',
    },
  ],

  filters: [
    { key: 'comparison', label: 'Comparison site', predicate: (p) => ['energy_comparison', 'multi_category_comparison'].includes(attrStr(p, 'tool_type')) },
    { key: 'cashback', label: 'Cashback portal', predicate: (p) => attrStr(p, 'tool_type') === 'cashback_portal' },
    { key: 'budgeting', label: 'Budgeting app', predicate: (p) => attrStr(p, 'tool_type') === 'budgeting_app' },
  ],

  priorityChips: [
    { id: 'rating', label: 'Top rated', icon: 'Star', sort: 'rating' },
    { id: 'cashback', label: 'Cashback first', icon: 'Coins', sort: 'cashback' },
  ],

  matcher: [
    {
      id: 'goal',
      label: 'What do you want to cut?',
      weight: 16,
      options: [
        { value: 'bills', label: 'Energy/broadband bills' },
        { value: 'shopping', label: 'Everyday shopping' },
        { value: 'spending', label: 'Overall spending visibility' },
      ],
      award: (p, a) => {
        const map: Record<string, string[]> = {
          bills: ['energy_comparison', 'multi_category_comparison'],
          shopping: ['cashback_portal'],
          spending: ['budgeting_app'],
        };
        return { matched: (map[a] ?? []).includes(attrStr(p, 'tool_type')), reason: 'Matches your goal' };
      },
    },
  ],

  sortOptions: [
    { value: 'smart', label: 'Smart rank', metric: (p) => p.score },
    { value: 'rating', label: 'Best rated', metric: (p) => (attrNumOrNull(p, 'trustpilot_rating') ?? 0) * 100 + p.score },
    { value: 'cashback', label: 'Cashback portals first', metric: (p) => (attrStr(p, 'tool_type') === 'cashback_portal' ? 1000 : 0) + p.score },
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
    yearsMax: 3,
    yearsDefault: 1,
  },

  compareRows: [
    { key: 'type', label: 'Tool type', accessor: (p) => TYPE_LABEL[attrStr(p, 'tool_type')] ?? '—' },
    { key: 'model', label: 'How it makes money', accessor: (p) => attrStr(p, 'business_model_note') || '—' },
    { key: 'feature', label: 'Key feature', accessor: (p) => attrStr(p, 'key_feature_note') || '—' },
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
    { key: 'regulatory', label: 'Regulatory / ownership history', accessor: (p) => attrStr(p, 'regulatory_note') || 'No material issues found at research time.' },
  ],

  verdict: {
    intro:
      "By sheer scale, nothing beats TopCashback among cashback portals, with 15M+ UK members, though a recurring payout-delay complaint pattern common across the cashback industry is disclosed below rather than glossed over. For an all-round pick, MoneySuperMarket is our top choice: a broad, Ofgem-accredited multi-category comparison hub with a strong Trustpilot rating and no confirmed CMA or FCA enforcement action. And on pure customer satisfaction, Compare the Market leads outright, with 4.9/5 on Trustpilot across 124,500+ reviews: the highest independently corroborated score of the seven.",
    picks: [
      { slug: 'moneysupermarket', label: 'Best overall' },
      { slug: 'topcashback', label: 'Best cashback portal' },
      { slug: 'compare-the-market', label: 'Highest customer satisfaction' },
    ],
  },
  methodology:
    "We compare each tool's business model (comparison commission, cashback-portal revenue share, or app subscription), Ofgem accreditation where relevant, key cost-of-living-relevant features and consumer rating from official disclosures and independent review platforms. We disclose real, sourced ownership relationships and complaint patterns plainly rather than omitting them: shared parent ownership between two \"comparison\" sites, or a recurring industry-wide payout-delay pattern at cashback portals, are both disclosed rather than glossed over. Rankings never depend on commissions. Every provider on this page is currently a visit-only listing.",
  buyerGuide: [
    {
      h3: 'How free comparison and cashback sites actually make money',
      body: 'Energy/multi-category comparison sites earn a commission from the supplier you switch to: this does not change the price you pay for the product itself. Cashback portals (TopCashback, Quidco) share a slice of the commission retailers pay them directly with you as cashback. Neither model costs you anything extra to use.',
    },
    {
      h3: 'Two of these share the same parent company',
      body: "MoneySuperMarket and Quidco are both owned by the same FTSE 250 group (MONY Group, which also owns MoneySavingExpert), worth knowing if you're comparing them as though they were two fully independent recommendations, rather than sister products under one parent.",
    },
    {
      h3: 'Cashback payout delays are a real, industry-wide pattern',
      body: "Both TopCashback and Quidco have recurring, documented complaints about cashback claims being delayed for months or declined outright, particularly on larger purchases. This stems from how retailer-side tracking pixels work across the cashback industry broadly (not a defect unique to either platform), but it's a genuine friction point worth expecting, not assuming away.",
    },
    {
      h3: "Chip's FSCS protection: the precise mechanics",
      body: "Chip is not a bank. Its savings products (Instant Access, Cash ISA, Prize Savings Account) are held via partner bank ClearBank, the actual FSCS-protected institution. Protection is up to £120,000 per person, aggregated across all of your ClearBank-held products through Chip, not £120,000 per individual product, a distinction worth understanding before assuming broader coverage than actually applies.",
    },
  ],
  faq: [
    {
      q: 'What is the best money-saving tool in the UK?',
      a: 'MoneySuperMarket is the strongest all-rounder here: a broad, Ofgem-accredited comparison hub with no confirmed enforcement action. TopCashback wins on scale, as the largest cashback portal in this comparison, while Compare the Market posts the highest independently corroborated customer satisfaction score. Features are re-verified regularly, and the ranking never depends on commissions.',
    },
    {
      q: 'Do comparison sites and cashback portals really cost nothing to use?',
      a: "Correct, comparison sites earn commission from the supplier you switch to (not from you), and cashback portals share a slice of retailer commission with you as cashback. Neither changes the price of the product itself.",
    },
    {
      q: 'Are cashback payouts reliable?',
      a: 'Mostly, but both TopCashback and Quidco have a real, recurring pattern of payout delays and occasional declined claims, largely due to how retailer tracking works across the cashback industry generally, not a defect unique to either platform. Expect this as a normal friction point, and keep records of your purchases in case a claim needs to be raised.',
    },
    {
      q: 'Is my money protected if I save through Chip?',
      a: "Chip itself is not a bank: your savings sit with partner bank ClearBank, which is FSCS-protected up to £120,000 per person. That protection is aggregated across all your ClearBank-held products via Chip, not per individual product.",
    },
    {
      q: 'How current is this data?',
      a: 'Every feature, ownership relationship and disclosure on this page was researched against official sources on 11 July 2026. Confirm current terms on the provider\'s own site before switching or signing up.',
    },
  ],
  compliance: {
    notice:
      'Not financial advice. Comparison and cashback services are free to use, funded by retailer/supplier commission: this does not change the price you pay. Confirm current terms before switching.',
    regulators: [],
  },

  sources: [
    { label: 'Ofgem: Confidence Code accredited sites', url: 'https://www.ofgem.gov.uk/decision/confidence-code-code-practice-online-domestic-price-comparison-services' },
    { label: 'Citizens Advice: comparing energy prices', url: 'https://www.citizensadvice.org.uk/consumer/energy/energy-supply/get-a-better-energy-deal/compare-energy-tariffs/' },
  ],
  relatedLinks: [
    { label: 'UK savings hub', href: '/uk/savings' },
    { label: 'Best AI tools for finance (UK)', href: '/uk/ai-tools/best/ai-tools-finance' },
    { label: 'How SmartFinPro reviews products', href: '/methodology' },
  ],
};
