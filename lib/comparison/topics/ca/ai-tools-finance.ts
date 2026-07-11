// lib/comparison/topics/ca/ai-tools-finance.ts
// TopicConfig for "Best AI Tools for Finance & Business (Canada)" —
// registered under 'ca:ai-tools/ai-tools-finance'. Shares the
// 'ai-tools/ai-tools-finance' slug with us/uk/au for hreflang clustering;
// fully independent CA-specific editorial content. Pure module — no
// React/server imports.
//
// Unlike the AU/US configs (which lean B2B accounting-software AI), the
// CA-approved shortlist is deliberately consumer-facing AI tools — general
// assistants (ChatGPT, Perplexity) and AI-branded budgeting apps (Monarch,
// Copilot, Moka, Wealthsimple), plus one Canadian fintech (KOHO) whose "AI"
// claim is internal infrastructure, not a customer-facing feature. Cost
// model 'banking' with monthly_fee seeded as a CAD-converted estimate where
// no native CAD price exists (mirrors the au/ai-tools-finance.ts Dext
// precedent) — pricing_model/starting_price_note are always shown alongside,
// never replacing the raw number, since none of these are like-for-like
// purchases.
//
// Editorial disclosure (SEO addendum §14): KOHO's "Kortex AI" is real but is
// internal fraud/compliance infrastructure (built on AWS Bedrock), not a
// feature Canadians directly see or use in-app — disclosed plainly rather
// than presented as a customer-facing AI product. Moka's AI-feature
// positioning is thin and largely absorbed into its ongoing moka.ai →
// intelligentinvesting.ai platform migration — disclosed, ranked last, not
// excluded. Wealthsimple's September 2025 data breach (SINs and government
// IDs exposed for ~30,000 customers via a third-party supply-chain attack)
// and OpenAI's active tracker-privacy class action are disclosed in full.

import { z } from 'zod';
import type { TopicConfig } from './../types';
import type { ProductForComparison } from '@/lib/comparison/types';

export const caAiToolsFinanceAttributesSchema = z
  .object({
    pricing_model: z.enum(['freemium', 'flat_subscription']),
    starting_price_note: z.string(), // full pricing mechanics, always shown alongside the headline price
    target_segment: z.enum(['budgeting', 'general_assistant', 'fraud_security']),
    ai_features_note: z.string(),
    free_tier_or_trial: z.boolean(),
    review_score: z.number().nullable(),
    review_count: z.number().nullable(),
    review_source: z.string(),
    review_note: z.string().optional(),
    regulatory_note: z.string().optional(), // material, sourced compliance/security history — empty if none
  })
  .passthrough();

const attr = (p: ProductForComparison, k: string): boolean => p.attributes?.[k] === true;
const attrStr = (p: ProductForComparison, k: string): string =>
  typeof p.attributes?.[k] === 'string' ? (p.attributes[k] as string) : '';
const attrNumOrNull = (p: ProductForComparison, k: string): number | null =>
  typeof p.attributes?.[k] === 'number' ? (p.attributes[k] as number) : null;
const yesNo = (b: boolean) => (b ? 'Yes' : 'No');
const cad = (n: number) => (n ? `C$${n}/mo` : 'Free');

const PRICING_MODEL_LABEL: Record<string, string> = {
  freemium: 'Freemium',
  flat_subscription: 'Flat subscription',
};
const SEGMENT_LABEL: Record<string, string> = {
  budgeting: 'AI budgeting',
  general_assistant: 'General AI assistant',
  fraud_security: 'AI fraud & security infrastructure',
};

export const caAiToolsFinanceConfig: TopicConfig = {
  slug: 'ai-tools-finance',
  category: 'ai-tools',
  label: 'AI Tools for Finance',
  h1: (y) => `Best AI tools for finance & business in Canada (${y})`,
  metaTitle: (y) => `Best AI Finance Tools Canada (${y})`,
  metaDescription: (y) =>
    `Compare AI-powered finance and business tools for Canadians in ${y}: budgeting, general AI assistants and fraud-security infrastructure — independent, sourced.`,
  intro:
    'Independent, side-by-side comparison of AI tools for Canadian budgeting, research and general use — genuinely different products, never forced into one price-based ranking.',
  publishedDate: '2026-07-11',
  attributesSchema: caAiToolsFinanceAttributesSchema,

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
      format: (v) => cad(Number(v)),
    },
    {
      key: 'freeTier',
      label: 'Free access',
      accessor: (p) => (attr(p, 'free_tier_or_trial') ? 1 : 0),
      format: (v) => yesNo(!!Number(v)),
      winner: 'max',
    },
  ],

  filters: [
    { key: 'budgeting', label: 'AI budgeting', predicate: (p) => attrStr(p, 'target_segment') === 'budgeting' },
    { key: 'assistant', label: 'General AI assistant', predicate: (p) => attrStr(p, 'target_segment') === 'general_assistant' },
    { key: 'freeTier', label: 'Free access', predicate: (p) => attr(p, 'free_tier_or_trial') },
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
        { value: 'budgeting', label: 'Budgeting & spending insights' },
        { value: 'assistant', label: 'General research or Q&A' },
      ],
      award: (p, a) => {
        const map: Record<string, string[]> = { budgeting: ['budgeting'], assistant: ['general_assistant'] };
        return { matched: (map[a] ?? []).includes(attrStr(p, 'target_segment')), reason: 'Matches your use case' };
      },
    },
    {
      id: 'free',
      label: 'Want free access?',
      weight: 12,
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: "Doesn't matter" },
      ],
      award: (p, a) => (a === 'yes' ? { matched: attr(p, 'free_tier_or_trial'), reason: 'Free access available' } : { matched: true }),
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
    { key: 'price', label: 'Starting price', accessor: (p) => cad(p.monthlyFee) },
    { key: 'pricingModel', label: 'Pricing model', accessor: (p) => PRICING_MODEL_LABEL[attrStr(p, 'pricing_model')] ?? '—' },
    { key: 'segment', label: 'Best for', accessor: (p) => SEGMENT_LABEL[attrStr(p, 'target_segment')] ?? '—' },
    { key: 'freeTier', label: 'Free access', accessor: (p) => yesNo(attr(p, 'free_tier_or_trial')), score: (p) => (attr(p, 'free_tier_or_trial') ? 1 : 0) },
    {
      key: 'rating',
      label: 'Consumer review score',
      accessor: (p) => {
        const score = attrNumOrNull(p, 'review_score');
        return score === null ? 'Not yet rated' : `${score}/5 (${(attrNumOrNull(p, 'review_count') ?? 0).toLocaleString('en-CA')} ${attrStr(p, 'review_source')} reviews)`;
      },
      score: (p) => attrNumOrNull(p, 'review_score') ?? 0,
    },
  ],

  detailRows: [
    { key: 'priceNote', label: 'Pricing detail', accessor: (p) => attrStr(p, 'starting_price_note') || '—' },
    { key: 'aiFeatures', label: 'AI features', accessor: (p) => attrStr(p, 'ai_features_note') || '—' },
    { key: 'reviewNote', label: 'Review detail', accessor: (p) => attrStr(p, 'review_note') || '—' },
    { key: 'regulatory', label: 'Regulatory / security history', accessor: (p) => attrStr(p, 'regulatory_note') || 'No material issues found at research time.' },
  ],

  verdict: {
    intro:
      "ChatGPT is our top pick — the most-used AI tool among Canadians for money management per a BMO report, with a dedicated personal-finance experience for budgeting Q&A and document analysis. Monarch Money is the best dedicated AI budgeting app, with a genuinely AI-branded assistant delivering weekly summaries, spending-trend detection and cash-flow forecasting, backed by the strongest independent review scores in this comparison. Copilot Money is the best pick for Apple users, with automatic categorization and cash-flow visualization plus Apple Design Award recognition.",
    picks: [
      { slug: 'chatgpt', label: 'Best overall / most used' },
      { slug: 'monarch-money', label: 'Best dedicated AI budgeting app' },
      { slug: 'copilot-money', label: 'Best for Apple users' },
    ],
  },
  methodology:
    "These 7 tools solve genuinely different problems — from general-purpose AI research to AI-branded budgeting to internal fraud-detection infrastructure — so we don't force them into a single price-based ranking. \"Starting price\" shows each vendor's cheapest plan unlocking the relevant AI feature, labelled with its pricing model, converted to an approximate CAD figure where no native CAD price exists (all 7 except KOHO bill in USD). We disclose real, sourced security incidents and legal disputes plainly rather than omitting them — a tool involved in an active lawsuit or a recent data breach is not treated as a top pick while that risk remains live. We also disclose where an \"AI\" claim is weaker or more indirect than marketing suggests, rather than inflating it. Rankings never depend on commissions — every provider on this page is currently a visit-only listing.",
  buyerGuide: [
    {
      h3: 'AI tool ≠ financial adviser',
      body: 'None of these 7 tools is a licensed financial adviser, and none provides personalised financial advice under Canadian securities law — they summarize, categorize, forecast or answer questions. Always verify an AI-generated number or suggestion before acting on it financially.',
    },
    {
      h3: 'Most of these bill in USD, not CAD',
      body: 'Only KOHO publishes native CAD pricing. ChatGPT, Perplexity, Monarch Money and Copilot Money all bill in USD, with your card issuer applying currency conversion at checkout — the CAD figures shown here are estimates, not fixed prices. Confirm the actual charge on your statement before assuming the CAD estimate is exact.',
    },
    {
      h3: 'KOHO\'s "Kortex AI" — what it actually is',
      body: 'Kortex AI is real, but it\'s internal infrastructure (built on AWS Bedrock) that KOHO uses for fraud investigation, anti-money-laundering monitoring and security operations — not a feature you interact with directly in the KOHO app. We disclose this distinction plainly rather than implying it\'s a customer-facing AI product like the other 6 candidates.',
    },
    {
      h3: 'Why Moka is ranked last, not excluded',
      body: 'Moka\'s parent company (Mogo, renamed Orion Digital Corp in December 2025) is actively migrating the platform from moka.ai to intelligentinvesting.ai, and its AI-feature positioning is largely absorbed into that broader rebrand rather than a distinct, independently verifiable "Moka AI" product. Combined with a poor Trustpilot score and billing complaints, we keep Moka on this list per the approved shortlist but rank it last with this disclosure.',
    },
  ],
  faq: [
    {
      q: 'What is the best AI finance tool in Canada?',
      a: 'ChatGPT is our top pick as the most-used AI tool among Canadians for money management, per a BMO report. Monarch Money is the best dedicated AI budgeting app with the strongest review scores in this comparison, and Copilot Money is the best pick for Apple users. We re-verify pricing and features regularly, and the ranking never depends on commissions.',
    },
    {
      q: 'Is my financial data safe if I use an AI budgeting app?',
      a: 'It depends on the provider — always review a vendor\'s specific data-handling disclosures. Wealthsimple disclosed a real data breach in September 2025 (a third-party supply-chain attack exposing SINs and IDs for about 30,000 customers, under 1% of its user base); OpenAI (ChatGPT) faces an active class-action lawsuit alleging undisclosed tracker use on chat content. We disclose both plainly rather than omitting them.',
    },
    {
      q: 'Do these tools bill in Canadian dollars?',
      a: 'Only KOHO publishes native CAD pricing. ChatGPT, Perplexity, Monarch Money and Copilot Money all bill in USD — the CAD prices shown here are estimated conversions, and your actual charge depends on your card issuer\'s exchange rate at the time of billing.',
    },
    {
      q: 'What is KOHO\'s "Kortex AI"?',
      a: "It's internal AI infrastructure KOHO uses for fraud investigation and compliance monitoring, built on AWS Bedrock — not a feature Canadians directly use inside the KOHO app. We disclose this distinction because it's easy to assume otherwise from marketing language.",
    },
    {
      q: 'How current is this data?',
      a: 'Every price, feature and regulatory disclosure on this page was researched against official vendor sources on 11 July 2026. AI features in this category are shipping fast — confirm current pricing and terms on the vendor\'s own site before subscribing.',
    },
  ],
  compliance: {
    notice:
      'AI-powered finance tools are not financial advisers and none of the tools on this page provides personalised financial advice. AI-generated categorisation, summaries or forecasts can be wrong — verify before relying on them for a financial decision.',
    regulators: [],
  },

  sources: [
    { label: 'FCAC — Financial Consumer Agency of Canada', url: 'https://www.canada.ca/en/financial-consumer-agency.html' },
    { label: 'OPC — Office of the Privacy Commissioner of Canada', url: 'https://www.priv.gc.ca/en/' },
  ],
  relatedLinks: [
    { label: 'Canada AI tools hub', href: '/ca/ai-tools' },
    { label: 'Best cybersecurity for SMBs (Canada)', href: '/ca/cybersecurity/best/cybersecurity-smb' },
    { label: 'How SmartFinPro reviews products', href: '/methodology' },
  ],
};
