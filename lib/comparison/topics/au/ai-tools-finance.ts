// lib/comparison/topics/au/ai-tools-finance.ts
// TopicConfig for "Best AI Tools for Finance & Business (Australia)" —
// registered under 'au:ai-tools/ai-tools-finance'. AU-specific editorial
// config sharing the slug with us/uk/ca for hreflang clustering. Pure
// module — no React/server imports.
//
// Mirrors ai-tools-finance.ts (US): 7 structurally heterogeneous products
// (freemium consumer budgeting apps, bundled-into-a-bigger-SaaS accounting
// AI, per-user/usage OCR, a bundle-tier expense-policy agent, a freemium
// recruitment-AI). Cost model 'banking' with monthly_fee seeded at each
// product's real cheapest AI-gating price (not forced to a fake common $0 —
// unlike the US config, several AU candidates have a genuine, comparable
// AUD/month price point) — a single "cheapest" comparison across 4 pricing
// models would still be dishonest, so `pricing_model`/`starting_price_note`
// are always shown alongside, never replaced by the raw number.
//
// Editorial disclosure (SEO addendum §14): Airwallex is the subject of an
// active AUSTRAC-ordered external audit into suspected AML/CTF compliance
// failures — disclosed in full, not top-ranked. Frollo's review score is
// null (source conflict, 4.6 vs 3.1, could not be resolved) rather than
// guessed. WeMoney's AI-feature claim is weaker/less independently
// verifiable than its peers — disclosed rather than inflated.

import { z } from 'zod';
import type { TopicConfig } from './../types';
import type { ProductForComparison } from '@/lib/comparison/types';

export const auAiToolsFinanceAttributesSchema = z
  .object({
    pricing_model: z.enum(['freemium', 'flat_subscription', 'bundle_tier', 'per_user_usage']),
    starting_price_note: z.string(), // full pricing mechanics, always shown alongside the headline price
    target_segment: z.enum(['budgeting', 'accounting_automation', 'bookkeeping_ocr', 'payroll_hr', 'spend_management']),
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
const aud = (n: number) => (n ? `A$${n}/mo` : 'Free');

const PRICING_MODEL_LABEL: Record<string, string> = {
  freemium: 'Freemium',
  flat_subscription: 'Flat subscription',
  bundle_tier: 'Bundled in a paid tier',
  per_user_usage: 'Per-user / usage-based',
};
const SEGMENT_LABEL: Record<string, string> = {
  budgeting: 'AI budgeting',
  accounting_automation: 'AI accounting automation',
  bookkeeping_ocr: 'AI receipt/bookkeeping OCR',
  payroll_hr: 'AI payroll & HR',
  spend_management: 'AI spend management',
};

export const auAiToolsFinanceConfig: TopicConfig = {
  slug: 'ai-tools-finance',
  category: 'ai-tools',
  label: 'AI Tools for Finance',
  h1: (y) => `Best AI tools for finance & business in Australia (${y})`,
  metaTitle: (y) => `Best AI Finance Tools Australia (${y})`,
  metaDescription: (y) =>
    `Compare AI-powered finance and business tools for Australia in ${y}: budgeting, accounting automation, bookkeeping and payroll — independent, sourced.`,
  intro:
    'Independent, side-by-side comparison of AI tools for Australian personal budgeting, accounting automation and business finance — five genuinely different use cases, never forced into one price-based ranking.',
  publishedDate: '2026-07-11',
  attributesSchema: auAiToolsFinanceAttributesSchema,

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
      format: (v) => aud(Number(v)),
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
    { key: 'accounting', label: 'Accounting & bookkeeping', predicate: (p) => ['accounting_automation', 'bookkeeping_ocr'].includes(attrStr(p, 'target_segment')) },
    { key: 'business', label: 'Payroll, HR & spend', predicate: (p) => ['payroll_hr', 'spend_management'].includes(attrStr(p, 'target_segment')) },
    { key: 'freeTier', label: 'Free AI access', predicate: (p) => attr(p, 'free_tier_or_trial') },
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
        { value: 'accounting', label: 'Accounting & bookkeeping' },
        { value: 'business', label: 'Payroll, HR or spend management' },
      ],
      award: (p, a) => {
        const map: Record<string, string[]> = {
          budgeting: ['budgeting'],
          accounting: ['accounting_automation', 'bookkeeping_ocr'],
          business: ['payroll_hr', 'spend_management'],
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
    { value: 'business', label: 'Best for business', metric: (p) => (['payroll_hr', 'spend_management', 'accounting_automation', 'bookkeeping_ocr'].includes(attrStr(p, 'target_segment')) ? 1000 : 0) + p.score },
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
    { key: 'price', label: 'Starting price', accessor: (p) => aud(p.monthlyFee) },
    { key: 'pricingModel', label: 'Pricing model', accessor: (p) => PRICING_MODEL_LABEL[attrStr(p, 'pricing_model')] ?? '—' },
    { key: 'segment', label: 'Best for', accessor: (p) => SEGMENT_LABEL[attrStr(p, 'target_segment')] ?? '—' },
    { key: 'freeTier', label: 'Free AI access', accessor: (p) => yesNo(attr(p, 'free_tier_or_trial')), score: (p) => (attr(p, 'free_tier_or_trial') ? 1 : 0) },
    {
      key: 'rating',
      label: 'Consumer review score',
      accessor: (p) => {
        const score = attrNumOrNull(p, 'review_score');
        return score === null ? attrStr(p, 'review_source') : `${score}/5 (${(attrNumOrNull(p, 'review_count') ?? 0).toLocaleString('en-AU')} ${attrStr(p, 'review_source')} reviews)`;
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
      "Xero takes the top spot here: its JAX AI assistant covers bank reconciliation, cashflow insights and natural-language Q&A, and ships free on every plan — even the cheapest — from Australia's largest accounting-software incumbent. For teams that want AI without paying anything, Employment Hero gives the most generous free allowance among the seven (50 free AI-screened interviews, no subscription needed). And on independent review data, Dext comes out ahead for AI-powered receipt and bookkeeping automation.",
    picks: [
      { slug: 'xero-jax', label: 'Best overall' },
      { slug: 'employment-hero', label: 'Best free AI tier' },
      { slug: 'dext', label: 'Best for accountants & bookkeepers' },
    ],
  },
  methodology:
    "These 7 tools solve genuinely different problems — from personal budgeting to bookkeeping OCR to AI-screened recruitment — so we don't force them into a single price-based ranking. \"Starting price\" shows each vendor's cheapest plan that unlocks the AI feature being compared, labelled with its pricing model (freemium, flat subscription, bundled-into-a-tier, or per-user/usage), since these are not like-for-like dollar figures. We evaluate each tool within its own use case using editorial consensus, feature substance and review data where a credible sample exists — where review data conflicted across sources and couldn't be resolved (Frollo), we say so rather than publish a guessed number. We disclose real, sourced regulatory history plainly rather than omitting it — a fund or fintech under active regulatory review is not treated as a top pick while that review remains open. Rankings never depend on commissions — every provider on this page is currently a visit-only listing.",
  buyerGuide: [
    {
      h3: 'AI tool ≠ financial adviser',
      body: 'None of these 7 tools is a licensed financial adviser, and none provides personalised financial advice — they automate categorisation, reconciliation, expense-policy checks or interview screening. ASIC has stated that existing, technology-neutral obligations apply regardless of whether AI is used; there is no special AI exemption or extra protection.',
    },
    {
      h3: 'Four pricing models, not one',
      body: "Comparing a free Frollo budgeting app to a $99/month Airwallex plan as if they were the same purchase would be misleading. Freemium tools (Frollo, WeMoney) monetise elsewhere; bundled AI (Xero, MYOB, Airwallex) is gated behind an existing paid tier; per-user/usage tools (Dext) scale with your team size. Use the segment filters to compare within your actual use case.",
    },
    {
      h3: 'Open banking and the Consumer Data Right',
      body: "Frollo and WeMoney connect to your bank accounts under Australia's Consumer Data Right (CDR) framework, the specific consent and security regime governing bank-data sharing in Australia — a more relevant protection to understand than general AI regulation for these two tools specifically.",
    },
    {
      h3: 'Why Airwallex is disclosed, not hidden',
      body: "AUSTRAC has ordered an external audit of Airwallex's Australian Designated Business Group over suspected AML/CTF compliance failures. Airwallex remains a real, operating Melbourne-founded fintech and is kept in this comparison, but we disclose the audit in full and don't rank it as a top pick while it remains open.",
    },
  ],
  faq: [
    {
      q: 'What is the best AI finance tool in Australia?',
      a: "For most Australian users, the answer is Xero: its JAX AI assistant comes free with every plan, even the $35/month entry tier. If budget is the only constraint, Employment Hero is worth a look first — 50 AI-screened interviews are free with no subscription attached. Dext, meanwhile, posts the strongest independent review score of the group for AI-powered bookkeeping. Pricing and features are re-verified regularly, and nothing here is ranked based on commission.",
    },
    {
      q: 'Are any of these tools regulated financial advisers?',
      a: "No. None of the 7 tools provides personalised financial advice — they automate categorisation, reconciliation, expense-policy review or recruitment screening, which sit outside AFSL advice obligations. ASIC's position is that ordinary, technology-neutral rules apply regardless of AI use.",
    },
    {
      q: 'Is my bank data safe if I connect it to an AI budgeting app?',
      a: "Frollo and WeMoney operate under Australia's Consumer Data Right (CDR) framework, the regulated open-banking consent and security regime. For business tools (Xero, MYOB, Dext, Airwallex), the data flowing to AI is transaction/receipt data rather than direct bank-credential access — always review a vendor's specific data-handling disclosures before connecting financial accounts.",
    },
    {
      q: 'Why isn\'t Airwallex the top pick despite its scale and funding?',
      a: "Airwallex is the subject of an active, AUSTRAC-ordered external audit into suspected AML/CTF compliance failures. We disclose this plainly rather than omitting it, and don't feature Airwallex as a top pick while the audit remains open — you should weigh this alongside your own risk tolerance.",
    },
    {
      q: 'How current is this data?',
      a: 'Every price, feature and regulatory disclosure on this page was researched against official vendor sources on 11 July 2026. AI features in this category are shipping fast — several vendors updated their AI offering within weeks of this research — so we re-verify this comparison regularly; confirm current pricing on the vendor\'s own site before subscribing.',
    },
  ],
  compliance: {
    notice:
      'AI-powered finance tools are not financial advisers and none of the tools on this page provides personalised financial advice. AI-generated categorisation, insights or screening can be wrong — verify before relying on it for a financial decision.',
    regulators: [],
  },

  sources: [
    { label: 'AUSTRAC — Airwallex AML/CTF audit order', url: 'https://www.austrac.gov.au/new-and-media/news/austrac-orders-audit-airwallex-suspected-amlctf-compliance-failures' },
    { label: 'OAIC / CDR — Consumer Data Right', url: 'https://www.cdr.gov.au/' },
  ],
  relatedLinks: [
    { label: 'Australia AI tools hub', href: '/au/ai-tools' },
    { label: 'Best cybersecurity for SMBs (Australia)', href: '/au/cybersecurity/best/cybersecurity-smb' },
    { label: 'How SmartFinPro reviews products', href: '/methodology' },
  ],
};
