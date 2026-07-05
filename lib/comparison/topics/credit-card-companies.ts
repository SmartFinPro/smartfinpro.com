// lib/comparison/topics/credit-card-companies.ts
// TopicConfig for "Best Credit Card Companies" (US). Pure module — no React, no server imports.

import { z } from 'zod';
import type { TopicConfig } from './types';
import type { ProductForComparison } from '@/lib/comparison/types';

export const creditCardCompaniesAttributesSchema = z
  .object({
    best_card: z.string(),
    max_welcome_bonus_value: z.number(),
    max_welcome_bonus_desc: z.string(),
    min_annual_fee: z.number(),
    max_annual_fee: z.number(),
    min_credit_score: z.number(),
    min_credit_label: z.string(),
    has_travel_cards: z.boolean(),
    has_cashback_cards: z.boolean(),
    has_secured_card: z.boolean(),
    has_student_card: z.boolean(),
    has_business_card: z.boolean(),
    has_balance_transfer: z.boolean(),
    network: z.string(),
    app_store_rating: z.number().optional(),
    review_source: z.string(),
    regulatory_note: z.string().optional(),
  })
  .passthrough();

const attr = (p: ProductForComparison, k: string): boolean => p.attributes?.[k] === true;
const yesNo = (b: boolean) => (b ? 'Yes' : 'No');

const creditScoreLabel = (score: number): string => {
  if (score === 0) return 'None required';
  if (score < 580) return `Poor (${score}+)`;
  if (score < 670) return `Fair (${score}+)`;
  if (score < 740) return `Good (${score}+)`;
  return `Excellent (${score}+)`;
};

const bonusLabel = (v: string | number | null): string => {
  const n = Number(v);
  if (!n) return 'No bonus';
  return `$${n.toLocaleString('en-US')} value`;
};

const annualFeeRange = (p: ProductForComparison): string => {
  const min = p.attributes?.min_annual_fee as number;
  const max = p.attributes?.max_annual_fee as number;
  if (!max) return '$0';
  if (min === 0) return `$0–$${max.toLocaleString('en-US')}`;
  return `$${min}–$${max.toLocaleString('en-US')}`;
};

export const creditCardCompaniesConfig: TopicConfig = {
  slug: 'credit-card-companies',
  category: 'personal-finance',
  label: 'Credit Card Companies',
  h1: (y) => `Best credit card companies in ${y}`,
  metaTitle: (y) => `Best Credit Card Companies (${y}) — Compared & Ranked`,
  metaDescription: (y) =>
    `Compare the best US credit card issuers of ${y}: welcome bonuses, credit score requirements, rewards types, and card lineups ranked independently. Chase, Amex, Capital One and more — no fluff.`,
  intro:
    'Independent comparison of the leading US credit card issuers — ranked by welcome bonus value, rewards richness, credit accessibility, and card lineup breadth. All $0-annual-fee options included.',
  publishedDate: '2026-07-05',
  attributesSchema: creditCardCompaniesAttributesSchema,

  specColumns: [
    {
      key: 'welcomeBonus',
      label: 'Best welcome bonus',
      accessor: (p) => (p.attributes?.max_welcome_bonus_value as number) ?? 0,
      format: bonusLabel,
      winner: 'max',
      sortKey: 'bonus',
    },
    {
      key: 'minCredit',
      label: 'Min. credit score',
      accessor: (p) => (p.attributes?.min_credit_score as number) ?? 999,
      format: (v) => creditScoreLabel(Number(v)),
      winner: 'min',
      sortKey: 'accessible',
    },
    {
      key: 'maxAnnualFee',
      label: 'Highest annual fee',
      accessor: (p) => (p.attributes?.max_annual_fee as number) ?? 0,
      format: (v) => {
        const max = Number(v);
        return max === 0 ? '$0 always' : `Up to $${max.toLocaleString('en-US')}`;
      },
      winner: 'min',
      sortKey: 'fee',
    },
  ],

  filters: [
    { key: 'forFairCredit', label: 'Fair credit OK', predicate: (p) => (p.attributes?.min_credit_score as number) <= 670 },
    { key: 'hasTravelCards', label: 'Travel rewards', predicate: (p) => attr(p, 'has_travel_cards') },
    { key: 'hasCashback', label: 'Cash back', predicate: (p) => attr(p, 'has_cashback_cards') },
    { key: 'hasSecured', label: 'Secured card', predicate: (p) => attr(p, 'has_secured_card') },
    { key: 'hasBusinessCard', label: 'Business card', predicate: (p) => attr(p, 'has_business_card') },
  ],

  priorityChips: [
    { id: 'bonus', label: 'Top bonus', icon: 'Gift', sort: 'bonus' },
    { id: 'travel', label: 'Travel rewards', icon: 'Plane', sort: 'bonus' },
    { id: 'accessible', label: 'Fair credit OK', icon: 'Users', sort: 'accessible' },
    { id: 'rating', label: 'Best rated', icon: 'Star', sort: 'rating' },
  ],

  matcher: [
    {
      id: 'credit',
      label: "What's your credit score?",
      weight: 16,
      options: [
        { value: 'excellent', label: 'Excellent (750+)' },
        { value: 'good', label: 'Good (670–749)' },
        { value: 'fair', label: 'Fair (580–669)' },
        { value: 'building', label: 'Building from scratch' },
      ],
      award: (p, a) => {
        const score = (p.attributes?.min_credit_score as number) ?? 999;
        if (a === 'excellent') return { matched: score <= 700 };
        if (a === 'good') return { matched: score <= 670, reason: 'Accessible with good credit' };
        if (a === 'fair') return { matched: score <= 580, reason: 'Fair credit accepted' };
        // building = need no credit check or secured
        return {
          matched: score === 0 || attr(p, 'has_secured_card'),
          reason: score === 0 ? 'No credit check' : 'Secured card to start',
        };
      },
    },
    {
      id: 'rewards',
      label: 'What rewards type do you prefer?',
      weight: 12,
      options: [
        { value: 'travel', label: 'Travel (points / miles)' },
        { value: 'cashback', label: 'Cash back' },
        { value: 'any', label: 'No preference' },
      ],
      award: (p, a) => {
        if (a === 'travel') return { matched: attr(p, 'has_travel_cards'), reason: 'Travel rewards cards' };
        if (a === 'cashback') return { matched: attr(p, 'has_cashback_cards'), reason: 'Cash back cards' };
        return { matched: true };
      },
    },
    {
      id: 'business',
      label: 'Do you need a business card?',
      weight: 8,
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: "Doesn't matter" },
      ],
      award: (p, a) =>
        a === 'yes' ? { matched: attr(p, 'has_business_card'), reason: 'Business cards available' } : { matched: true },
    },
  ],

  sortOptions: [
    { value: 'smart', label: 'Best overall', metric: (p) => p.score },
    { value: 'bonus', label: 'Highest welcome bonus', metric: (p) => (p.attributes?.max_welcome_bonus_value as number) ?? 0 },
    { value: 'accessible', label: 'Most accessible', metric: (p) => -((p.attributes?.min_credit_score as number) ?? 999) },
    { value: 'rating', label: 'Best rated', metric: (p) => p.rating * 100 + p.score },
    { value: 'cost', label: 'Lowest annual fee', metric: () => 0 }, // all $0-fee options exist
  ],

  costModel: {
    kind: 'banking',
    amountLabel: 'Monthly spend',
    amountMin: 500,
    amountMax: 10_000,
    amountStep: 500,
    amountDefault: 2_000,
    yearsLabel: 'Years holding card',
    yearsMin: 1,
    yearsMax: 10,
    yearsDefault: 3,
  },

  compareRows: [
    {
      key: 'bonus',
      label: 'Best welcome bonus',
      accessor: (p) => {
        const v = (p.attributes?.max_welcome_bonus_value as number) ?? 0;
        const desc = (p.attributes?.max_welcome_bonus_desc as string) ?? '';
        return v ? `$${v.toLocaleString('en-US')} — ${desc}` : 'No bonus';
      },
      score: (p) => (p.attributes?.max_welcome_bonus_value as number) ?? 0,
    },
    {
      key: 'minCredit',
      label: 'Min. credit score',
      accessor: (p) => (p.attributes?.min_credit_label as string) ?? '—',
      score: (p) => -((p.attributes?.min_credit_score as number) ?? 999),
    },
    {
      key: 'feeRange',
      label: 'Annual fee range',
      accessor: annualFeeRange,
    },
    {
      key: 'travel',
      label: 'Travel cards',
      accessor: (p) => yesNo(attr(p, 'has_travel_cards')),
      score: (p) => (attr(p, 'has_travel_cards') ? 1 : 0),
    },
    {
      key: 'cashback',
      label: 'Cash back cards',
      accessor: (p) => yesNo(attr(p, 'has_cashback_cards')),
      score: (p) => (attr(p, 'has_cashback_cards') ? 1 : 0),
    },
    {
      key: 'secured',
      label: 'Secured card',
      accessor: (p) => yesNo(attr(p, 'has_secured_card')),
      score: (p) => (attr(p, 'has_secured_card') ? 1 : 0),
    },
  ],

  detailRows: [
    { key: 'network', label: 'Card network', accessor: (p) => (p.attributes?.network as string) ?? '—' },
    { key: 'business', label: 'Business card', accessor: (p) => yesNo(attr(p, 'has_business_card')) },
    { key: 'student', label: 'Student card', accessor: (p) => yesNo(attr(p, 'has_student_card')) },
    { key: 'balanceTransfer', label: 'Balance transfer', accessor: (p) => yesNo(attr(p, 'has_balance_transfer')) },
    { key: 'bestCard', label: 'Flagship card', accessor: (p) => (p.attributes?.best_card as string) ?? '—' },
  ],

  verdict: {
    intro: "Our editors' picks for the best credit card issuers in the US right now.",
    picks: [
      { slug: 'cc-chase', label: 'Best overall' },
      { slug: 'cc-american-express', label: 'Best premium travel' },
      { slug: 'cc-capital-one', label: 'Best for any credit score' },
      { slug: 'cc-citi', label: 'Best for balance transfers' },
      { slug: 'cc-discover', label: 'Best for beginners' },
      { slug: 'cc-opensky', label: 'Best no credit check' },
    ],
  },

  methodology:
    "We rank credit card issuers by editorial score (weighted blend of welcome bonus value, rewards richness, credit accessibility, card lineup breadth, and consumer app ratings), sourced from official issuer disclosures and verified app store data as of July 2026. Rankings never depend on commissions.",

  buyerGuide: [
    {
      h3: 'Welcome bonuses',
      body: 'Most issuers offer $300–$1,500+ in sign-up value if you meet a minimum spend in 60–90 days. Chase and Amex consistently run the highest-value offers — but only if you have the credit score to qualify.',
    },
    {
      h3: 'Credit score requirements',
      body: 'Chase and Amex want good-to-excellent credit (690–750+). Capital One, Discover, and Bank of America have mid-tier options for fair credit (580–669). Credit One Bank and OpenSky serve bad credit and no-credit applicants respectively.',
    },
    {
      h3: 'Travel vs. cash back',
      body: 'Travel cards (Chase UR, Amex MR, Capital One Venture, Citi ThankYou) can deliver 2–3× more value than face value when points are transferred to airline/hotel partners. Cash back is simpler: 1.5–2% on everything, no tracking required.',
    },
    {
      h3: 'Annual fees',
      body: "Every issuer on this list offers at least one no-annual-fee card. Premium cards ($95–$695/yr) charge the fee for lounge access, travel credits, and concierge perks that offset the cost if you travel regularly — verify the math before paying.",
    },
    {
      h3: 'Secured and starter cards',
      body: 'If you have no credit history or bad credit, secured cards (Capital One, Discover, OpenSky) require a deposit as collateral. Credit One Bank offers unsecured bad-credit cards with no deposit, but annual fees and high APRs apply.',
    },
  ],

  faq: [
    {
      q: 'Which credit card company has the best rewards?',
      a: "Chase and American Express consistently offer the most valuable rewards ecosystems. Chase Ultimate Rewards transfer to 14+ airlines and hotels; Amex Membership Rewards transfer to 21 partners. For pure cash back, Citi Double Cash (2% on everything) and Capital One Quicksilver (1.5%) are the simplest picks.",
    },
    {
      q: 'Can I get approved with fair credit?',
      a: 'Yes — Capital One, Discover, and Bank of America offer cards for fair credit (580–669 FICO). For bad credit or no credit history, OpenSky requires no credit check, and Credit One Bank issues unsecured cards to rebuilding applicants. Secured cards from Discover or Capital One are the fastest path to improving your score.',
    },
    {
      q: "What is Chase's 5/24 rule?",
      a: "Chase will automatically deny most applications if you've opened 5 or more credit cards across any issuer in the past 24 months. This is the main reason applicants with great credit scores get rejected by Chase — and why Chase cards are best applied for before exploring other issuers.",
    },
    {
      q: 'Is American Express accepted everywhere?',
      a: "Amex acceptance has improved significantly — over 99% of US merchants who take credit cards now accept Amex. Some small businesses still decline it due to slightly higher merchant fees. Internationally, Amex acceptance lags Visa and Mastercard in some regions, so carrying a backup Visa or Mastercard is advisable when traveling abroad.",
    },
    {
      q: 'Do affiliate links affect these rankings?',
      a: 'No. Our ranking is based on our independent editorial score — welcome bonus value, credit accessibility, rewards breadth, and consumer ratings. Whether or not a company has an affiliate relationship with us has zero effect on its position.',
    },
    {
      q: 'How often is this comparison updated?',
      a: 'We verify welcome bonus values, credit score requirements, and annual fees quarterly. The most recent verification was July 2026.',
    },
  ],

  compliance: {
    notice: 'Not financial advice · credit approval not guaranteed · terms vary by applicant.',
    regulators: ['OCC', 'FDIC', 'CFPB'],
  },
};
