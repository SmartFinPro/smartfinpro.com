// lib/comparison/topics/robo-advisors.ts
// TopicConfig for "Best Robo-Advisors" + the Zod schema that guards its
// `attributes` JSONB. Pure module — no React, no server imports.

import { z } from 'zod';
import type { TopicConfig } from './types';
import type { ProductForComparison } from '@/lib/comparison/types';

/** Robo-specific facts stored in product_attributes.attributes. Validated per row. */
export const roboAttributesSchema = z
  .object({
    tlh: z.boolean(), // tax-loss harvesting
    human_advisor: z.boolean(),
    account_types: z.array(z.string()).min(1),
    sipc: z.boolean(),
    frac: z.boolean(), // fractional shares
    sri: z.boolean(), // socially-responsible investing
    crypto: z.boolean(),
  })
  .passthrough(); // tolerate forward-compatible extra keys

const attr = (p: ProductForComparison, k: string): boolean => p.attributes?.[k] === true;
const accountTypes = (p: ProductForComparison): string[] =>
  Array.isArray(p.attributes?.account_types) ? (p.attributes.account_types as string[]) : [];
const yesNo = (b: boolean) => (b ? 'Yes' : 'No');
const pct = (n: number) => (n ? `${n}%` : '0%');
const usd = (n: number) => (n ? `$${Math.round(n).toLocaleString('en-US')}` : '$0');

export const roboAdvisorsConfig: TopicConfig = {
  slug: 'robo-advisors',
  category: 'personal-finance',
  label: 'Robo-Advisors',
  h1: (y) => `Best robo-advisors in ${y}`,
  metaTitle: (y) => `Best Robo-Advisors (${y}) — Compared & Ranked`,
  metaDescription: (y) =>
    `Compare the best robo-advisors of ${y} side by side: management fees, account minimums, tax-loss harvesting and a live multi-year cost projection. Independent, data-driven, no fluff.`,
  intro:
    'Independent, side-by-side comparison of the leading US robo-advisors — ranked by fees, minimums and features, with a live multi-year cost projection on your own balance.',
  attributesSchema: roboAttributesSchema,

  specColumns: [
    {
      key: 'managementFee',
      label: 'Management fee',
      accessor: (p) => p.managementFee,
      format: (v) => pct(Number(v)),
      winner: 'min',
    },
    {
      key: 'accountMinimum',
      label: 'Minimum',
      accessor: (p) => p.accountMinimum,
      format: (v) => usd(Number(v)),
      winner: 'min',
    },
    {
      key: 'tlh',
      label: 'Tax-loss harvesting',
      accessor: (p) => (attr(p, 'tlh') ? 1 : 0),
      format: (v) => (Number(v) ? 'Yes' : 'No'),
      winner: 'max',
    },
    {
      key: 'human',
      label: 'Human advisor',
      accessor: (p) => (attr(p, 'human_advisor') ? 1 : 0),
      format: (v) => (Number(v) ? 'Yes' : 'No'),
      winner: 'max',
    },
  ],

  filters: [
    { key: 'tlh', label: 'Tax-loss harvesting', predicate: (p) => attr(p, 'tlh') },
    { key: 'human_advisor', label: 'Human advisor', predicate: (p) => attr(p, 'human_advisor') },
    { key: 'noMin', label: 'No minimum', predicate: (p) => p.accountMinimum === 0 },
    { key: 'sri', label: 'Socially responsible', predicate: (p) => attr(p, 'sri') },
    { key: 'crypto', label: 'Crypto', predicate: (p) => attr(p, 'crypto') },
  ],

  priorityChips: [
    { id: 'cost', label: 'Lowest cost', icon: 'Coins', sort: 'cost' },
    { id: 'fee', label: 'Lowest fee', icon: 'Percent', sort: 'fee' },
    { id: 'min', label: 'No minimum', icon: 'Wallet', sort: 'min' },
    { id: 'rating', label: 'Top rated', icon: 'Star', sort: 'rating' },
  ],

  matcher: [
    {
      id: 'tax',
      label: 'Want automated tax-loss harvesting?',
      weight: 14,
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: "Doesn't matter" },
      ],
      award: (p, a) =>
        a === 'yes' ? { matched: attr(p, 'tlh'), reason: 'Tax-loss harvesting' } : { matched: true },
    },
    {
      id: 'human',
      label: 'Want access to a human advisor?',
      weight: 12,
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: "Doesn't matter" },
      ],
      award: (p, a) =>
        a === 'yes' ? { matched: attr(p, 'human_advisor'), reason: 'Human advisor' } : { matched: true },
    },
    {
      id: 'min',
      label: 'How much are you starting with?',
      weight: 10,
      options: [
        { value: 'small', label: 'Under $500' },
        { value: 'big', label: '$500+' },
      ],
      award: (p, a) =>
        a === 'small' ? { matched: p.accountMinimum <= 500, reason: 'Low / no minimum' } : { matched: true },
    },
  ],

  sortOptions: [
    { value: 'smart', label: 'Smart rank', metric: (p) => p.score },
    { value: 'cost', label: 'Lowest 10-yr cost', metric: () => 0 }, // special-cased in orderProducts
    { value: 'fee', label: 'Lowest fee', metric: (p) => -p.managementFee },
    { value: 'min', label: 'Lowest minimum', metric: (p) => -p.accountMinimum },
    { value: 'rating', label: 'Best rated', metric: (p) => p.rating * 100 + p.score },
  ],

  costModel: {
    kind: 'compounding-fee',
    growthRate: 0.06,
    amountLabel: 'Amount invested',
    amountMin: 0,
    amountMax: 1_000_000,
    amountStep: 5000,
    amountDefault: 100_000,
    yearsLabel: 'Years',
    yearsMin: 1,
    yearsMax: 30,
    yearsDefault: 10,
  },

  compareRows: [
    {
      key: 'fee',
      label: 'Management fee',
      accessor: (p) => pct(p.managementFee),
      winner: (a, b) => parseFloat(b) - parseFloat(a), // lower fee wins → higher score for smaller %
    },
    { key: 'min', label: 'Account minimum', accessor: (p) => usd(p.accountMinimum) },
    { key: 'tlh', label: 'Tax-loss harvesting', accessor: (p) => yesNo(attr(p, 'tlh')) },
    { key: 'human', label: 'Human advisor', accessor: (p) => yesNo(attr(p, 'human_advisor')) },
    { key: 'sipc', label: 'SIPC insured', accessor: (p) => yesNo(attr(p, 'sipc')) },
  ],

  detailRows: [
    { key: 'types', label: 'Account types', accessor: (p) => accountTypes(p).join(', ') || '—' },
    { key: 'frac', label: 'Fractional shares', accessor: (p) => yesNo(attr(p, 'frac')) },
    { key: 'crypto', label: 'Crypto', accessor: (p) => yesNo(attr(p, 'crypto')) },
  ],

  verdict: {
    intro: "Our editors' picks for the best robo-advisors right now.",
    picks: [],
  },
  methodology:
    "We compare management fees, account minimums, account types, tax features and SIPC coverage from each provider's official disclosures, re-verified quarterly. Rankings never depend on commissions.",
  buyerGuide: [
    {
      h3: 'Management fees',
      body: 'The annual % a robo charges on your balance — small differences compound massively over decades. Use the cost slider to see the dollar impact on your amount.',
    },
    {
      h3: 'Account minimums',
      body: 'Some robos start at $0, others require $500–$5,000. Match the minimum to what you can invest today.',
    },
    {
      h3: 'Tax-loss harvesting',
      body: 'Automated TLH can offset taxable gains; valuable in taxable accounts, irrelevant inside IRAs.',
    },
  ],
  faq: [
    {
      q: 'How is the multi-year cost calculated?',
      a: 'We compound your amount at 6% a year and apply each robo-advisor’s management fee to the year-end balance, summing the fees over your chosen horizon. Move the sliders to see your own number — the ranking updates live.',
    },
    {
      q: 'How does SmartFinPro rank robo-advisors?',
      a: 'Our Smart Rank blends our independent score, your projected cost, fees and ratings. The order never depends on commissions.',
    },
    {
      q: 'Are these affiliate links?',
      a: 'Some are. A green “View offer” may earn us a commission at no cost to you, and only ever appears for partners whose tracking we have verified. It never affects the ranking.',
    },
    {
      q: 'Are robo-advisors safe?',
      a: 'Reputable US robo-advisors are SIPC-insured up to $500,000 (including $250,000 for cash), which protects against broker failure — not market losses. Your capital is still at risk.',
    },
  ],
  compliance: {
    notice: 'Not investment advice · capital at risk.',
    regulators: ['SEC', 'SIPC'],
  },
};
