// lib/comparison/topics/uk/remortgage-brokers.ts
// TopicConfig for "Best Remortgage Lenders & Brokers (UK)" — registered
// under 'uk:remortgaging/remortgage-brokers'. UK-exclusive category/topic
// (no US/CA/AU equivalent on this site). Pure module — no React/server
// imports.
//
// Cost model: 'fee-on-amount' with a flatFeeAccessor returning the real,
// disclosed broker fee (£0 for the 6 fee-free candidates; Tembo Money's
// remortgage service is also free, though its NEW-purchase mortgage service
// charges up to £499-749 — disclosed but not applied here since this page
// is specifically about remortgaging). Mirrors the ca/mortgage-brokers.ts
// flatFeeAccessor pattern exactly. costLabel overridden to "Broker fee".
//
// Business-model honesty (SEO addendum §4): MoneySuperMarket Mortgages and
// Uswitch Mortgages are PURE comparison/lead-gen tools, not brokers — they
// hand consumers off to L&C and Mojo Mortgages respectively for actual
// advice. Uswitch and Mojo are both owned by RVU (itself under Zoopla
// Property Group, majority-owned by Silver Lake Partners) — a materially
// non-independent relationship, disclosed via business_model_note rather
// than presented as two separate comparison engines.
//
// Editorial disclosure (SEO addendum §14): Habito's April 2026 acquisition
// by Monzo (still operating under its own brand/FCA authorisation) and
// Better.co.uk's May-June 2025 sale from its US parent (Better Home &
// Finance Holding, whose own Nasdaq-listed stock saw a 93% drop and a 2025
// debt restructuring) to UK proptech firm OneDome are both disclosed —
// the Better.co.uk UK entity itself carries no direct fallout from its
// former US parent's turmoil, and this distinction is preserved.

import { z } from 'zod';
import type { TopicConfig } from './../types';
import type { ProductForComparison } from '@/lib/comparison/types';

export const ukRemortgageBrokersAttributesSchema = z
  .object({
    business_model: z.enum(['whole_of_market_broker', 'comparison_lead_gen', 'specialist_broker']),
    business_model_note: z.string(),
    lender_panel_note: z.string(),
    broker_fee_gbp: z.number(), // 0 = fee-free for remortgages; real figure otherwise
    consumer_fee_note: z.string(),
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
const attrNum = (p: ProductForComparison, k: string): number =>
  typeof p.attributes?.[k] === 'number' ? (p.attributes[k] as number) : 0;
const MODEL_LABEL: Record<string, string> = {
  whole_of_market_broker: 'Whole-of-market broker',
  comparison_lead_gen: 'Comparison / lead-gen tool',
  specialist_broker: 'Specialist broker',
};

export const ukRemortgageBrokersConfig: TopicConfig = {
  slug: 'remortgage-brokers',
  category: 'remortgaging',
  label: 'Remortgage Brokers',
  h1: (y) => `Best remortgage lenders & brokers in the UK (${y})`,
  metaTitle: (y) => `Best UK Remortgage Brokers (${y})`,
  metaDescription: (y) =>
    `Compare UK remortgage brokers and comparison platforms of ${y} by lender panel, broker fees and true editorial independence, sourced, verified.`,
  intro:
    "Independent, side-by-side comparison of UK remortgage brokers and comparison platforms: most are genuinely free, but \"whole-of-market\" claims and true independence vary more than the marketing suggests.",
  publishedDate: '2026-07-11',
  attributesSchema: ukRemortgageBrokersAttributesSchema,

  specColumns: [
    {
      key: 'model',
      label: 'Business model',
      accessor: (p) => attrStr(p, 'business_model'),
      format: (v) => MODEL_LABEL[String(v)] ?? String(v),
    },
    {
      key: 'fee',
      label: 'Broker fee',
      accessor: (p) => attrNum(p, 'broker_fee_gbp'),
      format: (v) => (Number(v) ? `£${Number(v)}` : 'Free'),
      winner: 'min',
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
    { key: 'wholeOfMarket', label: 'Whole-of-market broker', predicate: (p) => attrStr(p, 'business_model') === 'whole_of_market_broker' },
    { key: 'free', label: 'Free to use', predicate: (p) => attrNum(p, 'broker_fee_gbp') === 0 },
  ],

  priorityChips: [
    { id: 'rating', label: 'Top rated', icon: 'Star', sort: 'rating' },
    { id: 'panel', label: 'Widest lender panel', icon: 'Layers', sort: 'panel' },
  ],

  matcher: [
    {
      id: 'independence',
      label: 'Do you want a genuinely independent broker (not tied to a sister comparison site)?',
      weight: 14,
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: "Doesn't matter" },
      ],
      award: (p, a) => (a === 'yes' ? { matched: attrStr(p, 'business_model') !== 'comparison_lead_gen', reason: 'Genuinely independent broker' } : { matched: true }),
    },
    {
      id: 'free',
      label: 'Want a completely free service?',
      weight: 10,
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: "Doesn't matter" },
      ],
      award: (p, a) => (a === 'yes' ? { matched: attrNum(p, 'broker_fee_gbp') === 0, reason: 'Free to use' } : { matched: true }),
    },
  ],

  sortOptions: [
    { value: 'smart', label: 'Smart rank', metric: (p) => p.score },
    { value: 'rating', label: 'Best rated', metric: (p) => (attrNumOrNull(p, 'trustpilot_rating') ?? 0) * 100 + p.score },
    { value: 'panel', label: 'Widest lender panel', metric: (p) => p.score },
  ],

  costModel: {
    kind: 'fee-on-amount',
    flatFeeAccessor: (p) => (typeof p.attributes?.broker_fee_gbp === 'number' ? p.attributes.broker_fee_gbp : 0),
    costLabel: 'Broker fee',
    amountLabel: 'Mortgage amount',
    amountMin: 100_000,
    amountMax: 1_000_000,
    amountStep: 25_000,
    amountDefault: 250_000,
    yearsLabel: 'Term (years)',
    yearsMin: 1,
    yearsMax: 5,
    yearsDefault: 2,
  },

  compareRows: [
    { key: 'model', label: 'Business model', accessor: (p) => attrStr(p, 'business_model_note') || MODEL_LABEL[attrStr(p, 'business_model')] || '—' },
    { key: 'lenders', label: 'Lender panel', accessor: (p) => attrStr(p, 'lender_panel_note') || '—' },
    { key: 'fee', label: 'Cost to you', accessor: (p) => attrStr(p, 'consumer_fee_note') || (attrNum(p, 'broker_fee_gbp') ? `£${attrNum(p, 'broker_fee_gbp')}` : '£0, paid by the lender') },
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
      "L&C (London & Country) Mortgages is the UK's largest fee-free broker, and that scale (plus a strong Trustpilot rating and a transparent \"how we're paid\" disclosure) earns it our overall pick. Prefer a fully digital, whole-of-market experience? Habito fits, with a 95+ lender panel, and now operates under Monzo's ownership (an April 2026 acquisition) while keeping its own brand. Complex cases (guarantor mortgages, shared ownership, income-boosting products) are where generalist brokers often struggle, and that's exactly where Tembo Money specialises.",
    picks: [
      { slug: 'lc-mortgages', label: 'Best overall' },
      { slug: 'habito', label: 'Best digital, whole-of-market broker' },
      { slug: 'tembo-money', label: 'Best for complex/specialist cases' },
    ],
  },
  methodology:
    "We compare each platform's business model (whole-of-market broker, comparison/lead-gen tool, or specialist broker), lender panel breadth, fee structure and consumer rating from official disclosures and independent review platforms. We disclose explicitly where a platform is a pure comparison tool that hands consumers off to a broker, and where that broker is a corporate sister company rather than a genuinely independent partner: a materially different relationship than an editorially independent recommendation. We disclose real, sourced regulatory, acquisition and ownership history plainly rather than omitting it. Rankings never depend on commissions. Every provider on this page is currently a visit-only listing.",
  buyerGuide: [
    {
      h3: 'Broker, comparison tool, or both?',
      body: 'Habito, L&C, Better.co.uk, Mojo and Tembo are genuine brokers: a qualified adviser reviews your circumstances and recommends specific products. MoneySuperMarket Mortgages and Uswitch Mortgages are pure comparison/lead-gen tools: they don\'t give advice themselves, and hand you off to a broker (L&C for MoneySuperMarket; Mojo for Uswitch) to actually complete. Worth knowing which type of service you\'re using before assuming it\'s independent advice.',
    },
    {
      h3: 'Uswitch and Mojo share the same ultimate owner',
      body: 'Uswitch Mortgages hands consumers to Mojo Mortgages for advice, and both are owned by RVU (part of Zoopla Property Group, majority-owned by US private-equity firm Silver Lake Partners since 2018). Uswitch states it doesn\'t earn money directly from these referrals, but the two are corporate affiliates, not independently competing services, worth knowing if you assumed you were comparing two unrelated options.',
    },
    {
      h3: 'Remortgaging is usually free, but not always',
      body: "Most brokers on this page charge nothing for remortgage advice, earning a commission from the lender instead. Tembo Money's remortgage service is also free, though its standard (new-purchase) mortgage service charges £499, rising to £749 for complex cases like its income-boosting products, a genuine exception worth knowing if you're a first-time buyer rather than remortgaging specifically.",
    },
    {
      h3: 'Reading disclosed acquisitions and ownership changes honestly',
      body: "Habito was acquired by Monzo, completing 30 April 2026, but continues operating under its own brand and FCA authorisation; you don't need a Monzo account to use it. Better.co.uk was sold by its struggling US parent (Better Home & Finance Holding, whose Nasdaq-listed stock fell 93% and underwent a 2025 debt restructuring) to UK proptech firm OneDome in mid-2025: the UK entity itself carries no direct fallout from that US turmoil, and we disclose the ownership change for transparency without implying the UK service is troubled.",
    },
  ],
  faq: [
    {
      q: 'What is the best remortgage broker in the UK?',
      a: "L&C (London & Country) Mortgages suits most borrowers best: the UK's largest fee-free broker, with a strong Trustpilot rating behind it. If a fully digital, whole-of-market experience matters more to you, Habito is the stronger choice, and Tembo Money handles complex cases that generalist brokers often can't place. Lender panels and features are re-verified regularly, and the ranking never depends on commissions.",
    },
    {
      q: 'Do I have to pay a remortgage broker in the UK?',
      a: 'For most brokers on this page, no, advice is free, funded by a commission from the lender when your remortgage completes. The one exception among these 7 is Tembo Money\'s standard (new-purchase) mortgage service, which charges £499-749; its remortgage service specifically is free like the others.',
    },
    {
      q: 'What is the difference between a broker and a comparison site for remortgaging?',
      a: "A broker (Habito, L&C, Better.co.uk, Mojo, Tembo) gives you actual advice from a qualified adviser reviewing your circumstances. A comparison site (MoneySuperMarket Mortgages, Uswitch Mortgages) doesn't give advice itself: it hands you off to a broker to complete, and in Uswitch's case, that broker (Mojo) is a corporate sister company under the same parent group.",
    },
    {
      q: 'Is my remortgage broker whole-of-market?',
      a: '"Whole-of-market" claims vary in how strictly they\'re verified: check the lender panel size for each provider on this page, since even the largest panels (95-100+ lenders) don\'t cover every UK lender, and some direct-only lenders are excluded from every broker\'s panel.',
    },
    {
      q: 'How current is this data?',
      a: 'Every business-model detail, fee and disclosure on this page was verified against official sources on 11 July 2026. UK mortgage rates change frequently: get a live, dated quote directly from the broker before relying on any historical rate figure.',
    },
  ],
  compliance: {
    notice:
      "Not financial advice. Mortgage brokering in the UK is FCA-regulated. Your home may be repossessed if you do not keep up repayments on your mortgage. Rates and lender panels change frequently.",
    regulators: ['FCA'],
  },

  sources: [
    { label: 'FCA Register', url: 'https://register.fca.org.uk/' },
    { label: 'MoneySavingExpert: remortgage guide', url: 'https://www.moneysavingexpert.com/mortgages/remortgage-guide/' },
  ],
  relatedLinks: [
    { label: 'UK savings hub', href: '/uk/savings' },
    { label: 'Best business bank accounts (UK)', href: '/uk/business-banking/best/business-bank-accounts' },
    { label: 'How SmartFinPro reviews products', href: '/methodology' },
  ],
};
