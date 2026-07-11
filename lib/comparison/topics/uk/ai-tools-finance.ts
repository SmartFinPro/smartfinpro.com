// lib/comparison/topics/uk/ai-tools-finance.ts
// TopicConfig for "Best AI Tools for Finance & Business (UK)" — registered
// under 'uk:ai-tools/ai-tools-finance'. Shares the 'ai-tools/ai-tools-finance'
// slug with us/ca/au for hreflang clustering; fully independent UK-specific
// editorial content. Pure module — no React/server imports.
//
// The UK shortlist is consumer AI-budgeting apps (Emma, Plum, Cleo, Snoop,
// Moneybox), one enterprise B2B tool (Microsoft Copilot for Finance) and one
// sole-trader tax tool (ANNA Money) — a different mix from AU/US (B2B
// accounting-software AI) and CA (general assistants + budgeting apps). Cost
// model 'banking' with monthly_fee seeded at each product's real cheapest
// AI-gating GBP price (all 7 publish native GBP pricing, unlike several CA
// candidates) — pricing_model/starting_price_note always shown alongside.
//
// Editorial disclosure (SEO addendum §14): Cleo's US parent agreed to a
// $17M FTC settlement in March 2025 over deceptive cash-advance marketing
// and subscription dark patterns — a US action, no parallel UK/FCA finding
// identified, disclosed with that scope distinction. Snoop is disclosed as
// no longer independent (acquired by Vanquis Banking Group, July 2023),
// though it continues under its own brand. ANNA Money's e-money safeguarding
// (not FSCS) is disclosed explicitly, distinct from the FSCS-backed apps on
// this page. Emma's FCA FRN-to-permission mapping is flagged as needing
// direct verification rather than asserted with false confidence. Microsoft
// Copilot for Finance's £24.70/user/month figure is disclosed as the base
// Copilot licence price, not a standalone "Copilot for Finance" SKU price.

import { z } from 'zod';
import type { TopicConfig } from './../types';
import type { ProductForComparison } from '@/lib/comparison/types';

export const ukAiToolsFinanceAttributesSchema = z
  .object({
    pricing_model: z.enum(['freemium', 'flat_subscription', 'bundle_tier']),
    starting_price_note: z.string(), // full pricing mechanics, always shown alongside the headline price
    target_segment: z.enum(['budgeting', 'coaching_chatbot', 'tax_compliance', 'enterprise_finance']),
    ai_features_note: z.string(),
    free_tier_or_trial: z.boolean(),
    review_score: z.number().nullable(),
    review_count: z.number().nullable(),
    review_source: z.string(),
    review_note: z.string().optional(),
    regulatory_note: z.string().optional(), // material, sourced compliance history — empty if none
  })
  .passthrough();

const attr = (p: ProductForComparison, k: string): boolean => p.attributes?.[k] === true;
const attrStr = (p: ProductForComparison, k: string): string =>
  typeof p.attributes?.[k] === 'string' ? (p.attributes[k] as string) : '';
const attrNumOrNull = (p: ProductForComparison, k: string): number | null =>
  typeof p.attributes?.[k] === 'number' ? (p.attributes[k] as number) : null;
const yesNo = (b: boolean) => (b ? 'Yes' : 'No');
const gbp = (n: number) => (n ? `£${n.toFixed(2)}/mo` : 'Free');

const PRICING_MODEL_LABEL: Record<string, string> = {
  freemium: 'Freemium',
  flat_subscription: 'Flat subscription',
  bundle_tier: 'Bundled in a paid tier',
};
const SEGMENT_LABEL: Record<string, string> = {
  budgeting: 'AI budgeting',
  coaching_chatbot: 'AI money-coach chatbot',
  tax_compliance: 'AI tax & compliance',
  enterprise_finance: 'Enterprise finance AI',
};

export const ukAiToolsFinanceConfig: TopicConfig = {
  slug: 'ai-tools-finance',
  category: 'ai-tools',
  label: 'AI Tools for Finance',
  h1: (y) => `Best AI tools for finance & business in the UK (${y})`,
  metaTitle: (y) => `Best UK AI Finance Tools (${y})`,
  metaDescription: (y) =>
    `Compare AI-powered finance and business tools for the UK in ${y}: budgeting, tax automation and enterprise finance — independent, sourced.`,
  intro:
    'Independent, side-by-side comparison of AI tools for UK budgeting, sole-trader tax automation and enterprise finance — genuinely different products, never forced into one price-based ranking.',
  publishedDate: '2026-07-11',
  attributesSchema: ukAiToolsFinanceAttributesSchema,

  specColumns: [
    {
      key: 'segment',
      label: 'Segment',
      accessor: (p) => attrStr(p, 'target_segment'),
      format: (v) => SEGMENT_LABEL[String(v)] ?? String(v),
    },
    {
      key: 'price',
      label: 'Starting price',
      accessor: (p) => p.monthlyFee,
      format: (v) => gbp(Number(v)),
    },
    {
      key: 'freeTier',
      label: 'Free access to AI feature',
      accessor: (p) => (attr(p, 'free_tier_or_trial') ? 1 : 0),
      format: (v) => yesNo(!!Number(v)),
      winner: 'max',
    },
  ],

  filters: [
    { key: 'budgeting', label: 'Personal budgeting', predicate: (p) => attrStr(p, 'target_segment') === 'budgeting' },
    { key: 'tax', label: 'Tax & compliance', predicate: (p) => attrStr(p, 'target_segment') === 'tax_compliance' },
    { key: 'enterprise', label: 'Enterprise finance', predicate: (p) => attrStr(p, 'target_segment') === 'enterprise_finance' },
    { key: 'freeTier', label: 'Free AI access', predicate: (p) => attr(p, 'free_tier_or_trial') },
  ],

  priorityChips: [
    { id: 'budgeting', label: 'Best for budgeting', icon: 'Wallet', sort: 'budgeting' },
    { id: 'free', label: 'Free tier first', icon: 'Percent', sort: 'free' },
    { id: 'rating', label: 'Top rated', icon: 'Star', sort: 'rating' },
  ],

  matcher: [
    {
      id: 'segment',
      label: 'What do you need AI help with?',
      weight: 16,
      options: [
        { value: 'budgeting', label: 'Personal budgeting & saving' },
        { value: 'tax', label: 'Sole-trader tax & compliance' },
        { value: 'enterprise', label: 'Enterprise finance automation' },
      ],
      award: (p, a) => {
        const map: Record<string, string[]> = {
          budgeting: ['budgeting', 'coaching_chatbot'],
          tax: ['tax_compliance'],
          enterprise: ['enterprise_finance'],
        };
        return { matched: (map[a] ?? []).includes(attrStr(p, 'target_segment')), reason: 'Matches your use case' };
      },
    },
    {
      id: 'free',
      label: 'Want free access to the AI feature?',
      weight: 12,
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: "Doesn't matter" },
      ],
      award: (p, a) => (a === 'yes' ? { matched: attr(p, 'free_tier_or_trial'), reason: 'Free AI access' } : { matched: true }),
    },
  ],

  sortOptions: [
    { value: 'smart', label: 'Smart rank', metric: (p) => p.score },
    { value: 'budgeting', label: 'Best for budgeting', metric: (p) => (attrStr(p, 'target_segment') === 'budgeting' ? 1000 : 0) + p.score },
    { value: 'free', label: 'Free tier first', metric: (p) => (attr(p, 'free_tier_or_trial') ? 1000 : 0) + p.score },
    { value: 'rating', label: 'Best rated', metric: (p) => (attrNumOrNull(p, 'review_score') ?? 0) * 100 + p.score },
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
    { key: 'price', label: 'Starting price', accessor: (p) => gbp(p.monthlyFee) },
    { key: 'pricingModel', label: 'Pricing model', accessor: (p) => PRICING_MODEL_LABEL[attrStr(p, 'pricing_model')] ?? '—' },
    { key: 'segment', label: 'Best for', accessor: (p) => SEGMENT_LABEL[attrStr(p, 'target_segment')] ?? '—' },
    { key: 'freeTier', label: 'Free AI access', accessor: (p) => yesNo(attr(p, 'free_tier_or_trial')), score: (p) => (attr(p, 'free_tier_or_trial') ? 1 : 0) },
    {
      key: 'rating',
      label: 'Consumer review score',
      accessor: (p) => {
        const score = attrNumOrNull(p, 'review_score');
        return score === null ? 'Not yet rated' : `${score}/5 (${(attrNumOrNull(p, 'review_count') ?? 0).toLocaleString('en-GB')} ${attrStr(p, 'review_source')} reviews)`;
      },
      score: (p) => attrNumOrNull(p, 'review_score') ?? 0,
    },
  ],

  detailRows: [
    { key: 'priceNote', label: 'Pricing detail', accessor: (p) => attrStr(p, 'starting_price_note') || '—' },
    { key: 'aiFeatures', label: 'AI features', accessor: (p) => attrStr(p, 'ai_features_note') || '—' },
    { key: 'reviewNote', label: 'Review detail', accessor: (p) => attrStr(p, 'review_note') || '—' },
    { key: 'regulatory', label: 'Regulatory history', accessor: (p) => attrStr(p, 'regulatory_note') || 'No material regulatory history found at research time.' },
  ],

  verdict: {
    intro:
      "Emma is our top pick — a clean regulatory record, genuinely useful AI subscription/duplicate-payment detection, and a large, established UK user base. Plum offers the best automated saving and investing, with FSCS-protected investments and no disclosed regulatory issues. ANNA Money is the best pick for sole traders, with AI receipt-scanning and a live HMRC tax estimate recognised for Making Tax Digital.",
    picks: [
      { slug: 'emma', label: 'Best overall' },
      { slug: 'plum', label: 'Best for automated saving & investing' },
      { slug: 'anna-money', label: 'Best for sole traders' },
    ],
  },
  methodology:
    "These 7 tools solve genuinely different problems — from personal budgeting to sole-trader tax automation to enterprise Excel reconciliation — so we don't force them into a single price-based ranking. \"Starting price\" shows each vendor's cheapest plan that unlocks the AI feature being compared, labelled with its pricing model, since these are not like-for-like purchases. We disclose real, sourced regulatory history plainly rather than omitting it — a tool whose parent company settled a US enforcement action, or whose funds are safeguarded rather than FSCS-protected, is disclosed with that distinction preserved rather than glossed over. Rankings never depend on commissions — every provider on this page is currently a visit-only listing.",
  buyerGuide: [
    {
      h3: 'AI tool ≠ financial adviser',
      body: 'None of these 7 tools is a licensed financial adviser, and none provides personalised financial advice regulated as such. They automate categorisation, subscription detection, tax estimation or Excel reconciliation. Always verify an AI-generated figure before relying on it for a financial decision.',
    },
    {
      h3: 'Not every app protects your money the same way',
      body: "Plum's investments are FSCS-protected up to £85,000. ANNA Money's funds are e-money safeguarded via PayrNet — a real, materially different (and lower-assurance) protection than FSCS. Check the regulatory detail for each provider rather than assuming uniform protection across all 7.",
    },
    {
      h3: 'Reading Cleo\'s disclosed US settlement honestly',
      body: "In March 2025, the US FTC secured a $17 million settlement against Cleo AI over deceptive cash-advance marketing, undisclosed express fees, and subscription-cancellation dark patterns. This is a US enforcement action — no parallel UK/FCA finding was identified — but it concerns Cleo's cash-advance product, which remains part of its offering, so we disclose it in full rather than omit it because it happened in another jurisdiction.",
    },
    {
      h3: "Microsoft Copilot for Finance's real cost",
      body: 'The £24.70/user/month figure is the entry price for the base Microsoft 365 Copilot licence that includes the Finance agents — not a separately-priced "Copilot for Finance" product. Additional finance-specific agents may require further licensing, and industry guidance suggests a realistic all-in cost of £35-55/user/month for UK SMEs once rollout and governance costs are included.',
    },
  ],
  faq: [
    {
      q: 'What is the best AI finance tool in the UK?',
      a: "Emma is our top pick for its clean regulatory record and genuinely useful AI subscription detection. Plum is best for automated saving and investing with FSCS-protected investments, and ANNA Money is best for sole traders with AI receipt-scanning and live HMRC tax estimates. We re-verify pricing and features regularly, and the ranking never depends on commissions.",
    },
    {
      q: 'Are any of these tools regulated financial advisers?',
      a: 'No. None of the 7 tools provides regulated personalised financial advice — they automate categorisation, subscription detection, tax estimation or enterprise reconciliation, which sit outside FCA advice permissions.',
    },
    {
      q: 'Is my money protected if I use one of these apps?',
      a: "It depends on the provider. Plum's investments are FSCS-protected up to £85,000. ANNA Money's funds are e-money safeguarded via PayrNet — a different, lower-assurance protection than FSCS. Always check a provider's specific protection structure before connecting significant funds.",
    },
    {
      q: 'Why isn\'t Cleo the top pick despite its scale and popularity?',
      a: "Cleo's US parent agreed to a $17 million FTC settlement in March 2025 over deceptive cash-advance marketing and subscription-cancellation dark patterns. We disclose this plainly rather than omitting it, and don't feature Cleo as a top pick while weighing this alongside its genuine strengths — you should factor this into your own decision.",
    },
    {
      q: 'How current is this data?',
      a: 'Every price, feature and regulatory disclosure on this page was researched against official vendor sources on 11 July 2026. AI features in this category are shipping fast — confirm current pricing and terms on the vendor\'s own site before subscribing.',
    },
  ],
  compliance: {
    notice:
      'AI-powered finance tools are not financial advisers and none of the tools on this page provides personalised financial advice. AI-generated categorisation, estimates or reconciliation can be wrong — verify before relying on it for a financial decision.',
    regulators: ['FCA'],
  },

  sources: [
    { label: 'FCA Register', url: 'https://register.fca.org.uk/' },
    { label: 'Open Banking — regulated providers', url: 'https://www.openbanking.org.uk/regulated-providers/' },
  ],
  relatedLinks: [
    { label: 'UK AI tools hub', href: '/uk/ai-tools' },
    { label: 'Best cybersecurity for SMBs (UK)', href: '/uk/cybersecurity/best/cybersecurity-smb' },
    { label: 'How SmartFinPro reviews products', href: '/methodology' },
  ],
};
