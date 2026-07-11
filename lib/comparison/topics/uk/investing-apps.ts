// lib/comparison/topics/uk/investing-apps.ts
// TopicConfig for "Best Investing Apps / Stocks & Shares ISA Platforms
// (UK)" — registered under 'uk:personal-finance/investing-apps'. No
// "best-" prefix and no cross-market slug clash since the topic slug itself
// (investing-apps) is UK-specific; no us/ca/au hreflang cluster exists for
// this exact slug (US uses 'robo-advisors', CA uses both 'robo-advisors'
// and 'tfsa-rrsp-platforms'). Pure module — no React/server imports.
//
// Cost model: 'compounding-fee' with management_fee storing an effective %
// figure — straightforward for the 3 percentage-fee platforms (HL, AJ Bell,
// Moneyfarm), 0% for the 3 zero-platform-fee apps (Trading 212, InvestEngine,
// Freetrade Basic), and a DISCLOSED effective-% conversion for interactive
// investor's flat £4.99-11.99/month fee (mirrors the ca/robo-advisors.ts
// Nest Wealth flat-fee precedent) — ii's real cost is FIXED regardless of
// balance, so it's actually the cheapest option above roughly £17-20k and
// more expensive below that threshold; disclosed explicitly, never
// presented as a simple percentage comparable to the others.
//
// UK-specific compliance axis (SEO addendum §4): FSCS investment protection
// is £85,000 per person per firm — this is UNCHANGED and is a DIFFERENT
// scheme from the £120,000 UK bank-deposit FSCS limit (effective 1 December
// 2025) used on the savings-accounts and business-bank-accounts pages.
// Never conflate the two on this page.
//
// Editorial disclosure (SEO addendum §14): Hargreaves Lansdown faces an
// unconfirmed, HL-disputed ransomware breach claim (APT73/Bashe, Jan+Apr
// 2026) — disclosed as a disputed claim, not a proven incident. Freetrade
// carries a real 2022 FCA Second Supervisory Notice (misleading financial
// promotions) predating its 2025 IG Group acquisition — disclosed in full.
// Trading 212 tops the Which? 2026 survey on raw score but is explicitly
// NOT a "Which? Recommended Provider" due to its CFD-arm risk warning —
// this nuance is preserved rather than glossed over.

import { z } from 'zod';
import type { TopicConfig } from './../types';
import type { ProductForComparison } from '@/lib/comparison/types';

export const ukInvestingAppsAttributesSchema = z
  .object({
    fee_structure: z.enum(['percentage', 'flat_monthly', 'zero_platform']),
    fee_note: z.string(), // full fee mechanics, always shown alongside management_fee
    dealing_fee_gbp: z.number().nullable(), // null = not applicable (managed/robo, no per-trade dealing)
    investment_universe_note: z.string(),
    fscs_protected: z.boolean(), // always true for FCA-regulated UK investment firms — shown for clarity, not conditionally
    which_survey_note: z.string(),
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
const attrBool = (p: ProductForComparison, k: string): boolean => p.attributes?.[k] === true;
const gbp = (n: number) => `£${n.toFixed(2)}`;
const pct = (n: number) => `${n.toFixed(2)}%`;

const FEE_STRUCTURE_LABEL: Record<string, string> = {
  percentage: '% of assets',
  flat_monthly: 'Flat monthly fee',
  zero_platform: 'No platform fee',
};

export const ukInvestingAppsConfig: TopicConfig = {
  slug: 'investing-apps',
  category: 'personal-finance',
  label: 'Investing Apps & Stocks & Shares ISAs',
  h1: (y) => `Best investing apps & Stocks & Shares ISA platforms in the UK (${y})`,
  metaTitle: (y) => `Best UK Investing Apps & ISAs (${y})`,
  metaDescription: (y) =>
    `Compare UK investing apps and Stocks & Shares ISA platforms of ${y} by platform fees, dealing costs and FSCS protection, independent, sourced.`,
  intro:
    'Independent, side-by-side comparison of UK investing apps and Stocks & Shares ISA platforms, ranked by fee structure, dealing costs and features, with a live multi-year cost projection on your own portfolio.',
  publishedDate: '2026-07-11',
  attributesSchema: ukInvestingAppsAttributesSchema,

  specColumns: [
    {
      key: 'managementFee',
      label: 'Platform fee',
      accessor: (p) => p.managementFee,
      format: (v) => pct(Number(v)),
      winner: 'min',
      sortKey: 'fee',
    },
    {
      key: 'dealing',
      label: 'Dealing fee',
      accessor: (p) => attrNumOrNull(p, 'dealing_fee_gbp') ?? -1,
      format: (v) => (Number(v) === -1 ? 'N/A (managed)' : Number(v) === 0 ? 'Free' : gbp(Number(v))),
      winner: 'min',
    },
    {
      key: 'universe',
      label: 'Investment universe',
      accessor: (p) => attrStr(p, 'investment_universe_note'),
      format: (v) => String(v),
    },
  ],

  filters: [
    { key: 'freeDealing', label: 'Free dealing', predicate: (p) => attrNumOrNull(p, 'dealing_fee_gbp') === 0 },
    { key: 'zeroFee', label: 'No platform fee', predicate: (p) => attrStr(p, 'fee_structure') === 'zero_platform' },
    { key: 'managed', label: 'Managed / robo portfolio', predicate: (p) => attrNumOrNull(p, 'dealing_fee_gbp') === null },
  ],

  priorityChips: [
    { id: 'cost', label: 'Lowest cost', icon: 'Coins', sort: 'cost' },
    { id: 'universe', label: 'Widest investment universe', icon: 'Layers', sort: 'universe' },
    { id: 'rating', label: 'Top rated', icon: 'Star', sort: 'rating' },
  ],

  matcher: [
    {
      id: 'style',
      label: 'How do you want to invest?',
      weight: 16,
      options: [
        { value: 'diy', label: 'Pick my own shares/funds' },
        { value: 'managed', label: 'Managed / done-for-you portfolio' },
      ],
      award: (p, a) =>
        a === 'managed'
          ? { matched: attrNumOrNull(p, 'dealing_fee_gbp') === null, reason: 'Managed/robo portfolio' }
          : { matched: attrNumOrNull(p, 'dealing_fee_gbp') !== null, reason: 'Self-directed dealing available' },
    },
    {
      id: 'dealing',
      label: 'Do you trade often?',
      weight: 12,
      options: [
        { value: 'often', label: 'Frequently' },
        { value: 'rarely', label: 'Rarely / buy-and-hold' },
      ],
      award: (p, a) =>
        a === 'often'
          ? { matched: attrNumOrNull(p, 'dealing_fee_gbp') === 0, reason: 'Free dealing' }
          : { matched: true },
    },
  ],

  sortOptions: [
    { value: 'smart', label: 'Smart rank', metric: (p) => p.score },
    { value: 'cost', label: 'Lowest cost', metric: () => 0 },
    { value: 'universe', label: 'Widest investment universe', metric: (p) => p.score },
    { value: 'rating', label: 'Best rated', metric: (p) => (attrNumOrNull(p, 'trustpilot_rating') ?? 0) * 100 + p.score },
  ],

  costModel: {
    kind: 'compounding-fee',
    growthRate: 0.06,
    amountLabel: 'ISA/portfolio balance',
    amountMin: 1_000,
    amountMax: 250_000,
    amountStep: 1_000,
    amountDefault: 20_000,
    yearsLabel: 'Years',
    yearsMin: 1,
    yearsMax: 10,
    yearsDefault: 5,
  },

  compareRows: [
    { key: 'fee', label: 'Platform fee', accessor: (p) => `${pct(p.managementFee)} (${FEE_STRUCTURE_LABEL[attrStr(p, 'fee_structure')] ?? '—'})`, score: (p) => -p.managementFee },
    { key: 'feeNote', label: 'Fee mechanics', accessor: (p) => attrStr(p, 'fee_note') || '—' },
    { key: 'dealing', label: 'Dealing fee', accessor: (p) => { const v = attrNumOrNull(p, 'dealing_fee_gbp'); return v === null ? 'N/A (managed)' : v === 0 ? 'Free' : gbp(v); } },
    { key: 'universe', label: 'Investment universe', accessor: (p) => attrStr(p, 'investment_universe_note') || '—' },
    { key: 'which', label: 'Which? survey status', accessor: (p) => attrStr(p, 'which_survey_note') || 'Not included in the survey reviewed' },
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
    { key: 'regulatory', label: 'Regulatory / dispute history', accessor: (p) => attrStr(p, 'regulatory_note') || 'No material issues found at research time.' },
  ],

  verdict: {
    intro:
      "Satisfaction and cost pull in different directions here. AJ Bell earned the highest raw Which? customer-satisfaction score of any platform tested (81%), 2026 Recommended Provider status, and one of the strongest Trustpilot ratings around (4.9/5), our overall pick. Trading 212 wins on price alone: £0 platform fee, £0 dealing, just a 0.15% FX fee, and the top score in the Which? 2026 survey, though it's excluded from Recommended Provider status because its FCA authorisation carries the standard CFD-arm risk warning. For pure ETF portfolios, InvestEngine is the stronger choice, having held Recommended Provider status three years running.",
    picks: [
      { slug: 'aj-bell', label: 'Best overall' },
      { slug: 'trading-212', label: 'Lowest cost' },
      { slug: 'investengine', label: 'Best for ETF portfolios' },
    ],
  },
  methodology:
    "We compare each platform's platform/ISA fee (flat, percentage, or zero), dealing commission, investment universe breadth and independent customer-satisfaction data (Which? 2026 survey, Trustpilot) from official pricing pages and published survey results. Interactive investor's flat monthly fee is shown as an effective percentage on a representative portfolio balance for comparability, with an explicit note that its real cost doesn't change with balance size: genuinely cheaper than percentage-fee platforms above roughly £17,000-20,000, and more expensive below that. FSCS investment protection (£85,000 per person per firm) is a different scheme from the £120,000 UK bank-deposit protection referenced on our savings and business-banking pages. We never conflate the two. We disclose real, sourced regulatory and dispute history plainly rather than omitting it. Rankings never depend on commissions. Every provider on this page is currently a visit-only listing.",
  buyerGuide: [
    {
      h3: 'FSCS protection for investments is £85,000, not £120,000',
      body: 'The UK bank-deposit FSCS limit rose to £120,000 in December 2025, but that change applies to CASH held at a bank, a completely different protection scheme. Shares, funds and ETFs held with an FCA-regulated investment platform remain protected at £85,000 per person, per firm if the firm itself fails (this does not protect against normal market losses on your investments).',
    },
    {
      h3: 'Percentage fee vs. flat fee vs. zero platform fee',
      body: "Hargreaves Lansdown, AJ Bell and Moneyfarm charge a percentage of your portfolio, which scales with your balance (often capped at a maximum monthly amount). Interactive investor charges a flat monthly fee regardless of balance: cheaper at larger portfolio sizes, more expensive at smaller ones. Trading 212, InvestEngine and Freetrade's entry tier charge no platform fee at all, monetising through FX fees or premium tiers instead. Move the balance slider above to see which structure actually wins for your own portfolio size.",
    },
    {
      h3: 'Why Trading 212 tops the Which? survey but isn\'t "Recommended"',
      body: "Trading 212 scored highest overall (83%) in the Which? 2026 investment platform survey, with a perfect fees score. But Which? does not award it \"Recommended Provider\" status, because Trading 212's FCA authorisation covers CFD trading (a separate, leveraged product from ISA investing) and carries the standard high-risk warning required for that activity. This doesn't mean the ISA/investing product itself is risky, but it's a real nuance worth understanding rather than a simple #1 ranking would suggest.",
    },
    {
      h3: 'Reading disclosed issues honestly',
      body: "A ransomware group has claimed a breach of Hargreaves Lansdown's systems (January and April 2026); HL disputes any breach occurred and states it has found no evidence of a cyberattack. We present this as a disputed, unconfirmed claim, not a proven incident. Freetrade received a formal FCA Second Supervisory Notice in 2022 over misleading social-media financial promotions, predating its 2025 acquisition by IG Group, disclosed in full as part of its regulatory history.",
    },
  ],
  faq: [
    {
      q: 'What is the best investing app or Stocks & Shares ISA platform in the UK?',
      a: 'Priorities diverge sharply on this one. AJ Bell leads on customer satisfaction, with the highest Which? score of any platform tested and a strong Trustpilot rating. Trading 212 wins on cost: the lowest fee structure and the top score in the Which? survey outright, though it lacks Recommended Provider status because of its CFD-arm risk warning. InvestEngine is the better fit for pure ETF portfolios. Fees and features are re-verified regularly, and the ranking never depends on commissions.',
    },
    {
      q: 'Is my money protected if my investing platform fails?',
      a: 'Yes, up to £85,000 per person, per firm, under the Financial Services Compensation Scheme (FSCS): this covers the platform itself failing, not normal market losses on your investments. This is a different, unchanged scheme from the £120,000 UK bank-deposit protection you may have seen referenced elsewhere.',
    },
    {
      q: 'What is a Stocks & Shares ISA?',
      a: "A UK tax-free wrapper for investments: you can pay in up to £20,000 per tax year (2026/27 allowance) across all your ISAs combined, and any growth or dividends inside the wrapper are free of UK income tax and capital gains tax. This is mechanical information, not personalised advice; consult HMRC or a financial adviser for how it fits your situation.",
    },
    {
      q: 'Is interactive investor\'s flat fee cheaper than a percentage-fee platform?',
      a: "It depends entirely on your balance. Interactive investor charges the same flat monthly fee (£4.99-£11.99 depending on tier) regardless of portfolio size, so it tends to be cheaper than percentage-fee platforms above roughly £17,000-20,000, and more expensive below that threshold. Use the balance slider above to see the actual comparison for your own portfolio size.",
    },
    {
      q: 'How current is this data?',
      a: 'Every fee, dealing cost and regulatory disclosure on this page was verified against official pricing pages and the Which? 2026 investment platform survey on 11 July 2026. Confirm current terms on the provider\'s own site before investing.',
    },
  ],
  compliance: {
    notice:
      'Not financial advice. Investment values can fall as well as rise. FSCS protects investments up to £85,000 per person, per firm if the platform fails: this does not protect against market losses, and is a separate scheme from UK bank-deposit protection. Confirm current fees before investing.',
    regulators: ['FCA', 'FSCS'],
  },

  sources: [
    { label: 'FSCS: what is covered (investments)', url: 'https://www.fscs.org.uk/what-we-cover/' },
    { label: 'FCA Register', url: 'https://register.fca.org.uk/' },
    { label: 'Which?: best and worst investment platforms', url: 'https://www.which.co.uk/money/investing/investment-platforms-and-fund-supermarkets/best-investment-platforms/' },
  ],
  relatedLinks: [
    { label: 'UK personal finance hub', href: '/uk/personal-finance' },
    { label: 'Best savings accounts & Cash ISAs (UK)', href: '/uk/savings/best/savings-accounts' },
    { label: 'How SmartFinPro reviews products', href: '/methodology' },
  ],
};
