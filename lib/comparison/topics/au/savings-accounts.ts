// lib/comparison/topics/au/savings-accounts.ts
// TopicConfig for "Best High-Interest Savings Accounts (Australia)" —
// registered under 'au:savings/savings-accounts'. AU-specific editorial
// config; shares the 'savings/savings-accounts' slug with UK for structural
// consistency (not hreflang — savings is not a shared US category). Pure
// module — no React/server imports.
//
// Cost model: mirrors high-yield-savings.ts (US) — all 7 accounts carry $0
// monthly fees, so 'banking' cost collapses to $0 for every row (honest: no
// fees). The real comparison signal lives in specColumns (max rate p.a.).
//
// AU-specific nuance: every "bonus rate" account has a base/fallback rate
// that applies the instant a monthly condition is missed — often near 0%.
// `max_rate_pct` alone is a marketing headline; `rate_type` + `rate_conditions`
// + `base_rate_pct` are surfaced everywhere the max rate is, per SEO addendum
// §3 (no bare volatile-rate claims without conditions attached).

import { z } from 'zod';
import type { TopicConfig } from './../types';
import type { ProductForComparison } from '@/lib/comparison/types';

export const auSavingsAttributesSchema = z
  .object({
    max_rate_pct: z.number(), // headline rate a new customer is likely to see
    base_rate_pct: z.number(), // fallback rate if the bonus condition is missed (or the ongoing flat rate)
    rate_type: z.enum(['standard', 'conditional', 'intro']),
    rate_conditions: z.string(), // ALWAYS shown alongside max_rate_pct
    intro_period_months: z.number().nullable(),
    max_balance_for_rate: z.number().nullable(), // bonus/rate ceiling; null = no stated cap in this rollout
    min_deposit: z.number(),
    linked_account_required: z.boolean(),
    adi_fcs: z.boolean(), // true = APRA-licensed ADI with Financial Claims Scheme protection
    fcs_shared_licence_note: z.string().optional(), // e.g. Ubank shares NAB's ADI licence
    app_rating: z.number().nullable(),
    app_rating_note: z.string(),
  })
  .passthrough();

const attrNum = (p: ProductForComparison, k: string): number =>
  typeof p.attributes?.[k] === 'number' ? (p.attributes[k] as number) : 0;
const attrNumOrNull = (p: ProductForComparison, k: string): number | null =>
  typeof p.attributes?.[k] === 'number' ? (p.attributes[k] as number) : null;
const attrStr = (p: ProductForComparison, k: string): string =>
  typeof p.attributes?.[k] === 'string' ? (p.attributes[k] as string) : '';
const attrBool = (p: ProductForComparison, k: string): boolean => p.attributes?.[k] === true;
const yesNo = (b: boolean) => (b ? 'Yes' : 'No');
const aud = (n: number) => (n ? `A$${Math.round(n).toLocaleString('en-AU')}` : 'A$0');
const pct = (n: number) => `${n.toFixed(2)}% p.a.`;
const RATE_TYPE_LABEL: Record<string, string> = { standard: 'Unconditional', conditional: 'Conditional bonus', intro: 'Introductory' };

export const auSavingsAccountsConfig: TopicConfig = {
  slug: 'savings-accounts',
  category: 'savings',
  label: 'High-Interest Savings',
  h1: (y) => `Best high-interest savings accounts in Australia (${y})`,
  metaTitle: (y) => `Best Savings Accounts Australia (${y})`,
  metaDescription: (y) =>
    `Compare Australian high-interest savings accounts of ${y} by rate, bonus conditions and FCS protection — independent, expert-reviewed, verified rates.`,
  intro:
    "Independent, side-by-side comparison of Australia's top savings accounts — ranked by rate, bonus conditions and APRA/FCS protection, with every conditional and introductory rate shown alongside its real fallback.",
  publishedDate: '2026-07-10',
  attributesSchema: auSavingsAttributesSchema,

  specColumns: [
    {
      key: 'maxRate',
      label: 'Max rate (p.a.)',
      accessor: (p) => attrNum(p, 'max_rate_pct'),
      format: (v) => pct(Number(v)),
      winner: 'max',
      sortKey: 'rate',
    },
    {
      key: 'baseRate',
      label: 'Fallback rate',
      accessor: (p) => attrNum(p, 'base_rate_pct'),
      format: (v) => pct(Number(v)),
      winner: 'max',
    },
    {
      key: 'rateType',
      label: 'Rate type',
      accessor: (p) => attrStr(p, 'rate_type'),
      format: (v) => RATE_TYPE_LABEL[String(v)] ?? String(v),
    },
    {
      key: 'adi',
      label: 'FCS protected',
      accessor: (p) => (attrBool(p, 'adi_fcs') ? 1 : 0),
      format: (v) => yesNo(!!Number(v)),
      winner: 'max',
    },
  ],

  filters: [
    { key: 'unconditional', label: 'No conditions', predicate: (p) => attrStr(p, 'rate_type') === 'standard' },
    { key: 'noMinDeposit', label: 'No minimum deposit', predicate: (p) => attrNum(p, 'min_deposit') === 0 },
    { key: 'noLinkedAccount', label: 'No linked account required', predicate: (p) => !attrBool(p, 'linked_account_required') },
  ],

  priorityChips: [
    { id: 'rate', label: 'Highest rate', icon: 'TrendingUp', sort: 'rate' },
    { id: 'simple', label: 'No conditions', icon: 'Check', sort: 'simple' },
    { id: 'rating', label: 'Top rated app', icon: 'Star', sort: 'rating' },
  ],

  matcher: [
    {
      id: 'discipline',
      label: 'Can you reliably meet a monthly deposit/growth condition?',
      weight: 16,
      options: [
        { value: 'yes', label: 'Yes, every month' },
        { value: 'no', label: 'I want no conditions at all' },
      ],
      award: (p, a) =>
        a === 'no'
          ? { matched: attrStr(p, 'rate_type') === 'standard', reason: 'No monthly conditions' }
          : { matched: true },
    },
    {
      id: 'switch',
      label: 'Willing to switch banks again in a few months for a better rate?',
      weight: 10,
      options: [
        { value: 'yes', label: 'Yes, I rate-hop' },
        { value: 'no', label: 'No, I want to stay put' },
      ],
      award: (p, a) =>
        a === 'no'
          ? { matched: attrStr(p, 'rate_type') !== 'intro', reason: 'No introductory cliff' }
          : { matched: true },
    },
  ],

  sortOptions: [
    { value: 'smart', label: 'Smart rank', metric: (p) => p.score },
    { value: 'rate', label: 'Highest max rate', metric: (p) => attrNum(p, 'max_rate_pct') * 100 + p.score },
    { value: 'simple', label: 'No conditions first', metric: (p) => (attrStr(p, 'rate_type') === 'standard' ? 1000 : 0) + p.score },
    { value: 'rating', label: 'Best rated app', metric: (p) => (attrNumOrNull(p, 'app_rating') ?? 0) * 100 + p.score },
  ],

  costModel: {
    kind: 'banking',
    amountLabel: 'Balance',
    amountMin: 1000,
    amountMax: 250_000,
    amountStep: 1000,
    amountDefault: 25_000,
    yearsLabel: 'Years',
    yearsMin: 1,
    yearsMax: 10,
    yearsDefault: 3,
  },

  compareRows: [
    { key: 'maxRate', label: 'Max rate (p.a.)', accessor: (p) => pct(attrNum(p, 'max_rate_pct')), score: (p) => attrNum(p, 'max_rate_pct') },
    { key: 'baseRate', label: 'Fallback rate', accessor: (p) => pct(attrNum(p, 'base_rate_pct')), score: (p) => attrNum(p, 'base_rate_pct') },
    { key: 'conditions', label: 'Conditions', accessor: (p) => attrStr(p, 'rate_conditions') || '—' },
    { key: 'cap', label: 'Rate applies up to', accessor: (p) => { const c = attrNumOrNull(p, 'max_balance_for_rate'); return c === null ? 'No stated cap' : aud(c); } },
    { key: 'minDeposit', label: 'Minimum deposit', accessor: (p) => aud(attrNum(p, 'min_deposit')), score: (p) => -attrNum(p, 'min_deposit') },
    { key: 'linked', label: 'Linked account required', accessor: (p) => yesNo(attrBool(p, 'linked_account_required')), score: (p) => (attrBool(p, 'linked_account_required') ? 0 : 1) },
    { key: 'fcs', label: 'FCS protected', accessor: (p) => (attrBool(p, 'adi_fcs') ? 'Yes — to A$250,000' : 'No'), score: (p) => (attrBool(p, 'adi_fcs') ? 1 : 0) },
  ],

  detailRows: [
    { key: 'fcsNote', label: 'FCS / licence note', accessor: (p) => attrStr(p, 'fcs_shared_licence_note') || '—' },
    {
      key: 'rating',
      label: 'App rating',
      accessor: (p) => {
        const r = attrNumOrNull(p, 'app_rating');
        return r === null ? 'Not verified' : `${r}/5 (${attrStr(p, 'app_rating_note')})`;
      },
    },
  ],

  verdict: {
    intro:
      'A 4-month introductory rate paired with the highest unconditional fallback in the field — 5.00% p.a., no deposit or growth conditions attached — puts Bankwest Easy Saver at the top of this list. If you would rather have a rate that never depends on your behaviour, AMP Bank GO Save is fully unconditional from day one. And Rabobank simply pays the highest headline rate of the seven, for savers willing to switch banks again once the 4-month window closes.',
    picks: [
      { slug: 'bankwest-easy-saver', label: 'Best overall' },
      { slug: 'amp-go-save', label: 'Best unconditional rate' },
      { slug: 'rabobank-hisa', label: 'Highest headline rate' },
    ],
  },
  methodology:
    "We compare each account's maximum advertised rate, its unconditional fallback rate, the exact monthly conditions required, and APRA/FCS protection from official rate sheets, re-verified regularly given how often savings rates change. We never show a maximum rate without its conditions and fallback rate alongside it. All 7 accounts carry $0 monthly fees, so the cost calculator reflects savings — not fees — earned over your chosen balance and time horizon. Rankings never depend on commissions.",
  buyerGuide: [
    {
      h3: 'Conditional vs. unconditional rates',
      body: 'Bonus-rate accounts (ING, Ubank, Judo) only pay their headline rate if you meet a monthly condition — a minimum deposit, a balance-growth requirement, or a set number of card transactions. Miss it once, and the whole month reverts to a much lower base rate, sometimes near 0%. Unconditional accounts (AMP GO Save, Macquarie\'s ongoing rate) pay the same rate every month regardless of behaviour.',
    },
    {
      h3: 'Introductory rates have a cliff',
      body: 'Rabobank, Bankwest and Macquarie pay their highest rate for a fixed introductory window (often 4 months) before reverting to a lower ongoing rate. These can genuinely be the best choice for a rate-hopper willing to switch again — just don\'t assume the advertised headline rate is what you\'ll earn a year from now.',
    },
    {
      h3: 'FCS protection — read the fine print on the brand',
      body: 'All 7 accounts are protected by the government Financial Claims Scheme up to A$250,000 per account holder — but that limit applies per banking licence, not per brand. Ubank shares National Australia Bank\'s licence and Bankwest shares Commonwealth Bank\'s — if you also hold money directly with NAB or CommBank, your combined balance across both brands counts toward the same $250,000 cap.',
    },
    {
      h3: 'Rate caps on large balances',
      body: 'Several bonus rates only apply up to a stated balance (often A$100,000–$250,000) — above that ceiling, the rate drops sharply. If you\'re depositing a large sum, check the cap before assuming the headline rate applies to your whole balance.',
    },
  ],
  faq: [
    {
      q: 'What is the best savings account in Australia right now?',
      a: "Right now, that is Bankwest Easy Saver — it combines a strong 4-month introductory rate with the highest unconditional fallback rate we found (5.00% p.a.). Want a rate that holds steady regardless of your behaviour instead? AMP Bank GO Save pays a flat 5.10% p.a. with zero conditions attached, the strongest unconditional option available. All rates are variable and were verified as of 10 July 2026 — confirm the provider's current rate before opening an account.",
    },
    {
      q: 'Is my savings account protected if the bank fails?',
      a: 'Yes — all 7 accounts are with APRA-licensed Authorised Deposit-taking Institutions (ADIs) and are covered by the government Financial Claims Scheme up to A$250,000 per account holder per ADI. Note that this limit is shared across brands on the same banking licence (e.g. Ubank + NAB, Bankwest + Commonwealth Bank).',
    },
    {
      q: 'Why did my interest rate suddenly drop?',
      a: "Most likely you missed a bonus condition (a minimum monthly deposit, required balance growth, or a set number of card transactions) and reverted to the account's base rate for that month, or an introductory period ended. Check the conditions column for your account — this is the single most common savings-account complaint we see in customer reviews.",
    },
    {
      q: 'Are these savings account rates guaranteed?',
      a: 'No. All savings account interest rates are variable and can change at any time, including after Reserve Bank of Australia cash rate movements. The rates shown were verified against each provider\'s official rate sheet on 10 July 2026 — confirm the current rate on the provider\'s site before depositing.',
    },
    {
      q: 'How current is this data?',
      a: 'Every rate, condition and fee on this page was verified against the provider\'s official pricing page on 10 July 2026. Savings rates change frequently — we re-verify this comparison regularly, but you should always confirm the live rate before opening an account.',
    },
  ],
  compliance: {
    notice:
      'Not financial advice. Savings account interest rates are variable and can change at any time. Deposits are Financial Claims Scheme protected up to A$250,000 per account holder per ADI — confirm which licence your provider shares before assuming full separate coverage.',
    regulators: ['APRA'],
  },

  sources: [
    { label: 'Financial Claims Scheme — fcs.gov.au', url: 'https://www.fcs.gov.au/' },
    { label: 'APRA — Register of Authorised Deposit-taking Institutions', url: 'https://www.apra.gov.au/register-of-authorised-deposit-taking-institutions' },
    { label: 'ASIC Moneysmart — savings accounts', url: 'https://moneysmart.gov.au/saving/savings-accounts' },
  ],
  relatedLinks: [
    { label: 'Australia savings hub', href: '/au/savings' },
    { label: 'Best business bank accounts (Australia)', href: '/au/business-banking/best/business-bank-accounts' },
    { label: 'How SmartFinPro reviews products', href: '/methodology' },
  ],
};
