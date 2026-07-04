// lib/comparison/topics/ai-tools-finance.ts
// TopicConfig for "Best AI Tools for Finance" + the Zod schema that guards its
// `attributes` JSONB. Pure module — no React, no server imports.
//
// This is the first slice comparing structurally heterogeneous product types
// (personal budgeting apps, an LLM chatbot's finance feature, AI accounting
// software, a charting platform's beta AI copilot, an AI stock-scoring tool, a
// regulated AI investing-automation platform, and B2B spend-management
// software) rather than one homogeneous category. The field has 4 genuinely
// incompatible pricing structures (flat subscription / bundle-tier where the
// AI feature is incidental to a much larger subscription / per-user B2B /
// freemium) — a single "lowest cost" comparison across all 8 would be
// dishonest (a $20 ChatGPT Plus subscription and a $15/user Ramp seat are not
// the same kind of number). See docs/superpowers/plans/
// 2026-07-04-cockpit-ai-tools-finance-source-matrix.md and
// .../2026-07-04-cockpit-ai-tools-finance-planned-seed-values.md (incl. §0a,
// the Fable-5 pre-migration review outcome) for full sourcing.
//
// Cost model: reuses `kind: 'banking'` with EVERY candidate seeded at
// `monthlyFee: 0` — matches trading-platforms.ts's $0-commission precedent
// exactly. The frozen cockpit-card/table/compare components render a cost
// figure unconditionally regardless of sortOptions/priorityChips config (a
// real finding from the pre-migration review, not assumed) — seeding a
// uniform $0 is the zero-shared-code way to make that figure inert rather
// than dishonest. The real, non-comparable pricing lives in the "Starting
// price"/"Pricing model" columns instead; a FAQ entry explains the $0.
//
// `review_score`/`review_count` are nullable — ChatGPT's finance feature
// launched 7 weeks before this review with no feature-specific review base
// (borrowing the app-wide App Store rating would measure a different
// surface and imply false precision), and Composer's App Store rating could
// not be independently confirmed. Rendering a null score through the shared
// UI required a small, additive fix to cockpit-card.tsx/cockpit-table.tsx/
// cockpit-compare.tsx: `reviewCount === 0` now renders "Not yet rated"/"—"
// instead of "0.0 from 0 reviews" (a false worst-rated claim) — this is a new
// code path that never triggers for any existing topic (all have nonzero
// review counts), so it changes behavior for nobody else.
//
// `free_tier_trial` is FEATURE-scoped, not product-scoped: Ramp has a
// genuinely free base tier, but Ramp Agents (the AI feature compared on this
// page) require the paid Plus tier — seeded `'none'`, matching the same logic
// already applied to ChatGPT (free ChatGPT lacks the Finances feature).
//
// Truewind (originally shortlisted as a 9th candidate) is excluded from the
// ranked field: a live browser check against G2 (WebFetch 403s, matching this
// rollout's established WAF-block pattern) shows exactly 4 reviews, not the
// "114+" an aggregator site reported — below every threshold this rollout has
// used to reject a too-small sample (myFICO's 4-review Trustpilot sample was
// rejected on the same basis in Slice 6). Covered in the buyerGuide instead.

import { z } from 'zod';
import type { TopicConfig } from './types';
import type { ProductForComparison } from '@/lib/comparison/types';

/** AI-tools-for-finance-specific facts stored in product_attributes.attributes. Validated per row. */
export const aiToolsFinanceAttributesSchema = z
  .object({
    pricing_model: z.enum(['flat_subscription', 'bundle_tier', 'per_user', 'freemium']),
    starting_price_headline: z.string(), // SHORT — feeds the homepage Best-X tile verbatim via specColumns[0]
    starting_price_note: z.string(), // full sentence, detailRow only
    target_segment: z.enum(['budgeting', 'llm_assistant', 'accounting', 'spend_management', 'stock_research', 'charting', 'automated_investing']),
    ai_features_note: z.string(),
    free_tier_trial: z.enum(['none', 'trial', 'free_tier']), // feature-scoped: 'free_tier'/'trial' only if the AI FEATURE is covered, not just the base product
    free_tier_trial_note: z.string(),
    review_score: z.number().nullable(),
    review_count: z.number().nullable(),
    review_source: z.string(), // MUST render alongside score+count, never a bare number; explicit note when review_score is null
    review_note: z.string().optional(),
    regulated_entity: z.boolean(), // true = Composer only
    regulated_entity_note: z.string().optional(),
    regulatory_history_note: z.string(),
  })
  .passthrough();

const attr = (p: ProductForComparison, k: string): boolean => p.attributes?.[k] === true;
const attrStr = (p: ProductForComparison, k: string): string =>
  typeof p.attributes?.[k] === 'string' ? (p.attributes[k] as string) : '';
const attrNum = (p: ProductForComparison, k: string): number =>
  typeof p.attributes?.[k] === 'number' ? (p.attributes[k] as number) : 0;
/** null (genuinely unrated) is distinct from 0 (worst possible) — never coerced. */
const attrNumOrNull = (p: ProductForComparison, k: string): number | null =>
  typeof p.attributes?.[k] === 'number' ? (p.attributes[k] as number) : null;
const yesNo = (b: boolean) => (b ? 'Yes' : 'No');

const FREE_TIER_TRIAL_ORDINAL: Record<string, number> = { none: 0, trial: 1, free_tier: 2 };
const FREE_TIER_TRIAL_BY_ORDINAL = ['none', 'trial', 'free_tier'] as const;
const freeTierTrialOrdinal = (p: ProductForComparison) => FREE_TIER_TRIAL_ORDINAL[attrStr(p, 'free_tier_trial')] ?? 0;
const FREE_TIER_TRIAL_LABEL: Record<string, string> = {
  none: 'No',
  trial: 'Trial',
  free_tier: 'Free tier',
};
const freeTierTrialLabel = (p: ProductForComparison) => FREE_TIER_TRIAL_LABEL[attrStr(p, 'free_tier_trial')] ?? 'No';

const PRICING_MODEL_LABEL: Record<string, string> = {
  flat_subscription: 'Flat subscription',
  bundle_tier: 'Bundled in a larger subscription',
  per_user: 'Per-user (business)',
  freemium: 'Freemium',
};

const SEGMENT_LABEL: Record<string, string> = {
  budgeting: 'AI budgeting',
  llm_assistant: 'AI finance assistant',
  accounting: 'AI accounting',
  spend_management: 'Business spend management',
  stock_research: 'AI stock research',
  charting: 'AI charting (beta)',
  automated_investing: 'AI investing automation',
};

export const aiToolsFinanceConfig: TopicConfig = {
  slug: 'ai-tools-finance',
  category: 'ai-tools',
  label: 'AI Tools for Finance',
  h1: (y) => `Best AI tools for finance in ${y}`,
  metaTitle: (y) => `Best AI Tools for Finance (${y}) — Compared & Ranked`,
  metaDescription: (y) =>
    `Compare the best AI-powered finance tools of ${y}: budgeting apps, AI investing automation, business spend management and more — independent, sourced, and honest about what's comparable and what isn't.`,
  intro:
    "Independent, side-by-side comparison of AI tools across personal budgeting, investing & research, and business finance — three genuinely different use cases, never forced into one price-based ranking.",
  publishedDate: '2026-07-04',
  attributesSchema: aiToolsFinanceAttributesSchema,

  specColumns: [
    {
      key: 'segment',
      label: 'Segment',
      accessor: (p) => attrStr(p, 'target_segment'),
      format: (v) => SEGMENT_LABEL[String(v)] ?? String(v),
      // no winner — informational, matches trading-platforms' score_model-style precedent
    },
    {
      key: 'price',
      label: 'Starting price',
      accessor: (p) => attrStr(p, 'starting_price_headline'),
      format: (v) => String(v),
      // no winner at all — no honest cost ordinal exists across 4 incompatible pricing models
    },
    {
      key: 'freeTier',
      label: 'Free tier / trial (AI features)',
      accessor: freeTierTrialOrdinal,
      format: (v) => FREE_TIER_TRIAL_LABEL[FREE_TIER_TRIAL_BY_ORDINAL[Number(v)] ?? 'none'] ?? 'No',
      winner: 'max',
    },
  ],

  filters: [
    { key: 'budgeting', label: 'Personal budgeting', predicate: (p) => attrStr(p, 'target_segment') === 'budgeting' },
    { key: 'investing', label: 'Investing & stock research', predicate: (p) => ['stock_research', 'charting', 'automated_investing'].includes(attrStr(p, 'target_segment')) },
    { key: 'business', label: 'Business & accounting', predicate: (p) => ['accounting', 'spend_management'].includes(attrStr(p, 'target_segment')) },
    { key: 'freeTier', label: 'Has a free tier', predicate: (p) => attrStr(p, 'free_tier_trial') === 'free_tier' },
    { key: 'regulated', label: 'SEC/FINRA-regulated entity', predicate: (p) => attr(p, 'regulated_entity') },
  ],

  priorityChips: [
    { id: 'budgeting', label: 'Best for budgeting', icon: 'Wallet', sort: 'budgeting' },
    { id: 'business', label: 'Best for business', icon: 'Users', sort: 'business' },
    { id: 'free', label: 'Free tier first', icon: 'Percent', sort: 'free' },
    { id: 'rating', label: 'Top rated', icon: 'Star', sort: 'rating' },
  ],

  matcher: [
    {
      id: 'segment',
      label: 'What do you need AI help with?',
      weight: 16,
      options: [
        { value: 'budgeting', label: 'Personal budgeting' },
        { value: 'investing', label: 'Investing & stock research' },
        { value: 'business', label: 'Business finance / accounting' },
      ],
      award: (p, a) => {
        const map: Record<string, string[]> = {
          budgeting: ['budgeting'],
          investing: ['stock_research', 'charting', 'automated_investing'],
          business: ['accounting', 'spend_management'],
        };
        return { matched: (map[a] ?? []).includes(attrStr(p, 'target_segment')), reason: 'Matches your use case' };
      },
    },
    {
      id: 'free',
      label: 'Want a genuinely free tier?',
      weight: 12,
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: "Doesn't matter" },
      ],
      award: (p, a) => (a === 'yes' ? { matched: attrStr(p, 'free_tier_trial') === 'free_tier', reason: 'Free tier available' } : { matched: true }),
    },
    {
      id: 'regulated',
      label: 'Prefer a regulated, SIPC-protected provider?',
      weight: 8,
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: "Doesn't matter" },
      ],
      award: (p, a) => (a === 'yes' ? { matched: attr(p, 'regulated_entity'), reason: 'SEC/FINRA-regulated' } : { matched: true }),
    },
  ],

  sortOptions: [
    { value: 'smart', label: 'Smart rank', metric: (p) => p.score },
    { value: 'budgeting', label: 'Best for budgeting', metric: (p) => (attrStr(p, 'target_segment') === 'budgeting' ? 1000 : 0) + p.score },
    { value: 'business', label: 'Best for business', metric: (p) => (['accounting', 'spend_management'].includes(attrStr(p, 'target_segment')) ? 1000 : 0) + p.score },
    { value: 'free', label: 'Free tier first', metric: (p) => (attrStr(p, 'free_tier_trial') === 'free_tier' ? 1000 : 0) + p.score },
    { value: 'rating', label: 'Best rated', metric: (p) => (attrNumOrNull(p, 'review_score') ?? 0) * 100 + p.score },
  ],

  costModel: {
    kind: 'banking',
    amountLabel: 'Representative usage', // ignored — matches trading-platforms.ts pattern
    amountMin: 0,
    amountMax: 0,
    amountStep: 1,
    amountDefault: 0,
    yearsLabel: 'Time horizon (years)',
    yearsMin: 1,
    yearsMax: 5,
    yearsDefault: 3,
  },

  compareRows: [
    { key: 'price', label: 'Starting price', accessor: (p) => attrStr(p, 'starting_price_headline') }, // short headline, no score — no honest cost ordinal exists
    { key: 'pricingModel', label: 'Pricing model', accessor: (p) => PRICING_MODEL_LABEL[attrStr(p, 'pricing_model')] ?? '—' }, // informational only, no score
    { key: 'segment', label: 'Best for', accessor: (p) => SEGMENT_LABEL[attrStr(p, 'target_segment')] ?? '—' }, // informational only, no score
    { key: 'freeTier', label: 'Free tier / trial (AI features)', accessor: freeTierTrialLabel, score: (p) => freeTierTrialOrdinal(p) },
    { key: 'regulated', label: 'Regulated entity', accessor: (p) => yesNo(attr(p, 'regulated_entity')) }, // informational only — a single true doesn't make this unfair
    {
      key: 'rating',
      label: 'Consumer review score',
      accessor: (p) => {
        const score = attrNumOrNull(p, 'review_score');
        return score === null ? attrStr(p, 'review_source') : `${score}/5 (${(attrNumOrNull(p, 'review_count') ?? 0).toLocaleString('en-US')} ${attrStr(p, 'review_source')} reviews)`;
      },
      score: (p) => attrNumOrNull(p, 'review_score') ?? 0,
    },
  ],

  detailRows: [
    { key: 'priceNote', label: 'Pricing detail', accessor: (p) => attrStr(p, 'starting_price_note') || '—' },
    { key: 'aiFeatures', label: 'AI features', accessor: (p) => attrStr(p, 'ai_features_note') || '—' },
    { key: 'freeTierNote', label: 'Free tier / trial detail', accessor: (p) => attrStr(p, 'free_tier_trial_note') || '—' },
    { key: 'regulatedNote', label: 'Regulated-entity detail', accessor: (p) => attrStr(p, 'regulated_entity_note') || '—' },
    { key: 'regulatory', label: 'Regulatory history', accessor: (p) => attrStr(p, 'regulatory_history_note') || '—' },
    { key: 'reviewNote', label: 'Review detail', accessor: (p) => attrStr(p, 'review_note') || '—' },
  ],

  verdict: {
    intro: "Our editors' picks for the best AI tools for finance right now — across three very different use cases.",
    picks: [
      { slug: 'monarch', label: 'Best overall / best AI budgeting app' },
      { slug: 'ramp', label: 'Best for business spend management' },
      { slug: 'composer', label: 'Best AI investing automation' },
    ],
  },
  methodology:
    "These eight tools solve different problems — from personal budgeting to corporate spend automation to AI-assisted investing — so we don't force them into a single price-based ranking. \"Starting price\" shows each vendor's cheapest plan that unlocks the AI features described, labeled with its pricing model (flat subscription, bundle tier, per-user, or freemium); these are not like-for-like dollar figures. ChatGPT and QuickBooks bundle their AI features inside a much broader subscription; Ramp charges per user and its free tier does not include the AI agents compared here. We evaluate each tool within its own use case (budgeting, investing & research, or business & accounting) using editorial consensus, feature substance, and review data where a credible sample exists — never a cross-category cost comparison. Consumer review scores always show the source and count alongside the number; where no credible score exists (ChatGPT's finance feature launched 7 weeks before this review, and Composer's app-store rating could not be independently confirmed), we say so rather than borrow an unrelated number. Rankings never depend on commissions — none of these 8 tools currently has an affiliate relationship with SmartFinPro.",
  buyerGuide: [
    {
      h3: 'AI tool ≠ financial adviser',
      body: "None of these tools — except Composer's regulated brokerage/advisory entities — is registered with the SEC or FINRA. AI-generated analysis, budgeting suggestions, and stock scores can all be wrong; never make an investment or financial decision based solely on AI output.",
    },
    {
      h3: 'Three use cases, not one hierarchy',
      body: "This page compares personal budgeting apps, investing & research tools, and business finance software side by side, but they solve different problems for different people. Comparing a $20/month ChatGPT Plus subscription to a $15/user Ramp seat as if they were the same kind of purchase would be misleading — use the segment filters to compare within your actual use case.",
    },
    {
      h3: 'Data privacy: which perimeter gets your financial data',
      body: "Purpose-built budgeting apps (Monarch, Copilot) have a narrower data perimeter than a general-purpose LLM (ChatGPT) — a compromised ChatGPT account could expose your linked balances, transactions and debt profile alongside everything else in your chat history. OpenAI disclosed a data breach in March 2023 exposing some subscribers' chat titles and limited payment data; enable multi-factor authentication regardless of which tool you choose.",
    },
    {
      h3: "Why isn't Truewind ranked here?",
      body: "Truewind is a YC-backed AI accounting platform ($13M Series A, January 2025) with genuine traction, but its G2 review page shows only 4 reviews at the time of this comparison — too small a sample to rank fairly alongside tools with hundreds or thousands of reviews. It's an emerging category worth watching, not yet a fair comparison row.",
    },
    {
      h3: "\"AI feature\" doesn't always mean a standalone product",
      body: "ChatGPT's Finances feature and QuickBooks' Intuit Assist are both AI capabilities bundled inside a much larger subscription — you're paying for a general-purpose LLM or a full accounting suite, and the AI feature is one part of it. The \"starting price\" for these two reflects the whole subscription, not a price for the AI feature alone.",
    },
  ],
  faq: [
    {
      q: 'How is the cost comparison calculated?',
      a: "It isn't a meaningful number for this category. These 8 tools use four fundamentally different pricing structures — flat subscriptions, AI features bundled into a larger subscription, per-user business pricing, and free tiers — so a single dollar figure would misrepresent the real cost. Instead, we show each tool's starting price with its pricing model labeled, and let you filter by use case and free-tier availability.",
    },
    {
      q: 'Which of these tools is actually free?',
      a: "TradingView, Composer and Ramp all have genuine free base tiers. TradingView's AI Chart Copilot works during its free public beta; Composer's free tier covers strategy building and backtesting (live automated trading requires the paid Trading Pass); Ramp's free tier covers core expense management, but Ramp Agents — the AI features compared here — require the paid Plus tier. Monarch and Copilot Money offer time-limited trials, not ongoing free plans. ChatGPT's Finances feature and QuickBooks' AI features have no free access at all.",
    },
    {
      q: 'Is Composer regulated?',
      a: "Yes — uniquely on this page. Composer Technologies Inc. is an SEC-registered Investment Adviser, and Composer Securities LLC is a FINRA- and SIPC-member broker-dealer with a clean disclosure record. Every other tool on this page is unregulated software, not a registered financial adviser or broker.",
    },
    {
      q: "Why isn't Truewind ranked?",
      a: 'Truewind is a genuine, YC-backed AI accounting platform, but its G2 review page showed only 4 reviews at research time — too small a sample to rank fairly. We cover it in the buyer\'s guide instead of giving it a ranked slot.',
    },
    {
      q: 'Are these affiliate links?',
      a: 'No. None of the 8 tools in this comparison currently has an affiliate relationship with SmartFinPro — every link is a bare visit or review link, and the ranking never depends on commissions.',
    },
  ],
  compliance: {
    notice:
      "AI-powered finance tools are not financial advisers. None of the tools on this page — except Composer's regulated brokerage/advisory entities — is registered with the SEC or FINRA, and AI-generated analysis can be wrong. Never make investment decisions based solely on AI output.",
    regulators: [],
  },
};
