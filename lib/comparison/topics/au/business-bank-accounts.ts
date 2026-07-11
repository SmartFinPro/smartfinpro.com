// lib/comparison/topics/au/business-bank-accounts.ts
// TopicConfig for "Best Business Bank Accounts (Australia)" — AU-specific
// editorial content (providers, currency, regulators) sharing the
// 'business-banking/business-bank-accounts' slug with US/UK/CA for hreflang
// clustering. Registered under the market-prefixed key 'au:business-banking/
// business-bank-accounts' (lib/comparison/topics/index.ts) — never served to
// another market. Pure module — no React, no server imports.
//
// AU-specific compliance axis: ADI (APRA-licensed bank) vs. non-ADI (AFSL
// fintech). Only ADIs carry Financial Claims Scheme (FCS) protection to
// A$250,000 per account holder per ADI — Zeller/Wise/Airwallex safeguard
// funds via trust/segregation instead, never government-guaranteed. This is
// the single most important trust signal on the page (SEO addendum §4 AU
// banking rule) and drives its own filter + spec column + compliance notice.
//
// Judo Bank is a Business Savings/Term Deposit product, NOT a transaction
// account — included per the researched shortlist (source: docs/superpowers/
// specs/2026-07-10-best-x-au-ca-uk-country-shortlist.md) because it's a real,
// popular candidate for "where do I park business cash", but flagged with an
// explicit hasTransactionAccount=false everywhere it could otherwise mislead
// a reader comparing day-to-day banking.

import { z } from 'zod';
import type { TopicConfig } from './../types';
import type { ProductForComparison } from '@/lib/comparison/types';

export const auBusinessBankAttributesSchema = z
  .object({
    adi_status: z.boolean(), // APRA-licensed Authorised Deposit-taking Institution
    fcs_protected: z.boolean(), // Financial Claims Scheme deposit guarantee to A$250,000
    protection_note: z.string(), // renders alongside fcs_protected — explains the safeguarding model when false
    interest_rate_pct: z.number(), // % p.a. on business balance held in THIS account, 0 if none
    has_transaction_account: z.boolean(), // false = savings/term-deposit-only product (Judo)
    afsl_or_licence: z.string(), // AFSL number or ADI licence reference, for the trust strip
    setup_time_note: z.string(),
    trustpilot_rating: z.number().nullable(),
    trustpilot_count: z.number().nullable(),
  })
  .passthrough();

const attr = (p: ProductForComparison, k: string): boolean => p.attributes?.[k] === true;
const attrNum = (p: ProductForComparison, k: string): number =>
  typeof p.attributes?.[k] === 'number' ? (p.attributes[k] as number) : 0;
const attrStr = (p: ProductForComparison, k: string): string =>
  typeof p.attributes?.[k] === 'string' ? (p.attributes[k] as string) : '';
const yesNo = (b: boolean) => (b ? 'Yes' : 'No');
const aud = (n: number) => `A$${Math.round(n).toLocaleString('en-AU')}`;
const perMonth = (n: number) => (n ? `${aud(n)}/mo` : 'A$0/mo');
const pct = (n: number) => (n ? `${n.toFixed(2)}%` : '—');
const txt = (s: string | number | null) => {
  const v = s == null ? '' : String(s).trim();
  return v ? v : '—';
};

export const auBusinessBankAccountsConfig: TopicConfig = {
  slug: 'business-bank-accounts',
  category: 'business-banking',
  label: 'Business Bank Accounts',
  h1: (y) => `Best business bank accounts in Australia (${y})`,
  metaTitle: (y) => `Best Business Bank Accounts Australia (${y})`,
  metaDescription: (y) =>
    `Compare Australian business bank accounts of ${y} by monthly fee, APRA/FCS protection and accounting integrations, independent, expert-reviewed.`,
  intro:
    'Independent, side-by-side comparison of business bank accounts for Australian sole traders and companies, ranked by monthly fee, APRA/FCS protection and features, with a live multi-year cost projection.',
  publishedDate: '2026-07-10',
  attributesSchema: auBusinessBankAttributesSchema,

  specColumns: [
    {
      key: 'monthlyFee',
      label: 'Monthly fee',
      accessor: (p) => p.monthlyFee,
      format: (v) => perMonth(Number(v)),
      winner: 'min',
      sortKey: 'fee',
    },
    {
      key: 'protection',
      label: 'FCS protected',
      accessor: (p) => (attr(p, 'fcs_protected') ? 1 : 0),
      format: (v) => (Number(v) ? 'Yes (ADI)' : 'No (safeguarded)'),
      winner: 'max',
    },
    {
      key: 'intl',
      label: 'International payments',
      accessor: (p) => (p.supportsIntlWires ? 1 : 0),
      format: (v) => yesNo(!!Number(v)),
      winner: 'max',
    },
    {
      key: 'subAccounts',
      label: 'Sub-accounts',
      accessor: (p) => (p.hasSubAccounts ? 1 : 0),
      format: (v) => yesNo(!!Number(v)),
      winner: 'max',
    },
  ],

  filters: [
    { key: 'noMonthly', label: 'No monthly fee', predicate: (p) => p.flags.noMonthly },
    { key: 'adi', label: 'APRA-licensed bank', predicate: (p) => attr(p, 'adi_status') },
    { key: 'intl', label: 'International payments', predicate: (p) => p.supportsIntlWires },
    { key: 'subAccounts', label: 'Sub-accounts', predicate: (p) => p.hasSubAccounts },
    { key: 'interest', label: 'Earns interest', predicate: (p) => attrNum(p, 'interest_rate_pct') > 0 },
  ],

  priorityChips: [
    { id: 'cost', label: 'Lowest cost', icon: 'Coins', sort: 'cost' },
    { id: 'protection', label: 'ADI protected', icon: 'Wallet', sort: 'protection' },
    { id: 'rating', label: 'Top rated', icon: 'Star', sort: 'rating' },
    { id: 'intl', label: 'Best for international', icon: 'Users', sort: 'intl' },
  ],

  matcher: [
    {
      id: 'adi',
      label: 'Want your balance government-guaranteed (FCS)?',
      weight: 16,
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: "Doesn't matter" },
      ],
      award: (p, a) => (a === 'yes' ? { matched: attr(p, 'fcs_protected'), reason: 'FCS-protected ADI' } : { matched: true }),
    },
    {
      id: 'intl',
      label: 'Pay or get paid internationally?',
      weight: 14,
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: "Doesn't matter" },
      ],
      award: (p, a) => (a === 'yes' ? { matched: p.supportsIntlWires, reason: 'International payments' } : { matched: true }),
    },
    {
      id: 'monthly',
      label: 'Want to avoid monthly fees?',
      weight: 10,
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: "Doesn't matter" },
      ],
      award: (p, a) => (a === 'yes' ? { matched: p.flags.noMonthly, reason: 'No monthly fee' } : { matched: true }),
    },
  ],

  sortOptions: [
    { value: 'smart', label: 'Smart rank', metric: (p) => p.score },
    { value: 'cost', label: 'Lowest 3-yr cost', metric: () => 0 },
    { value: 'fee', label: 'Lowest monthly fee', metric: (p) => -p.monthlyFee },
    { value: 'rating', label: 'Best rated', metric: (p) => p.rating * 100 + p.score },
    { value: 'protection', label: 'ADI protected first', metric: (p) => (attr(p, 'fcs_protected') ? 1000 : 0) + p.score },
    { value: 'intl', label: 'Best for international', metric: (p) => (p.supportsIntlWires ? 1000 : 0) + p.score },
  ],

  costModel: {
    kind: 'banking',
    amountLabel: 'Representative usage',
    amountMin: 0,
    amountMax: 10_000,
    amountStep: 250,
    amountDefault: 500,
    yearsLabel: 'Time horizon (years)',
    yearsMin: 1,
    yearsMax: 5,
    yearsDefault: 3,
  },

  compareRows: [
    { key: 'fee', label: 'Monthly fee', accessor: (p) => perMonth(p.monthlyFee), score: (p) => -p.monthlyFee },
    { key: 'adi', label: 'APRA-licensed ADI', accessor: (p) => yesNo(attr(p, 'adi_status')), score: (p) => (attr(p, 'adi_status') ? 1 : 0) },
    { key: 'fcs', label: 'FCS protection', accessor: (p) => (attr(p, 'fcs_protected') ? `Yes, to A$250,000` : attrStr(p, 'protection_note') || 'Not FCS-protected') },
    { key: 'interest', label: 'Interest on balance', accessor: (p) => pct(attrNum(p, 'interest_rate_pct')), score: (p) => attrNum(p, 'interest_rate_pct') },
    { key: 'intl', label: 'International payments', accessor: (p) => yesNo(p.supportsIntlWires), score: (p) => (p.supportsIntlWires ? 1 : 0) },
    { key: 'sub', label: 'Sub-accounts', accessor: (p) => yesNo(p.hasSubAccounts), score: (p) => (p.hasSubAccounts ? 1 : 0) },
    { key: 'txn', label: 'Transaction account', accessor: (p) => yesNo(attr(p, 'has_transaction_account')) },
  ],

  detailRows: [
    { key: 'wires', label: 'International details', accessor: (p) => txt(p.wireTransfers) },
    { key: 'card', label: 'Card', accessor: (p) => txt(p.cardNetwork) },
    { key: 'integr', label: 'Accounting integrations', accessor: (p) => p.integrations.join(', ') || '—' },
    { key: 'licence', label: 'Licence', accessor: (p) => attrStr(p, 'afsl_or_licence') || '—' },
    { key: 'setup', label: 'Setup time', accessor: (p) => attrStr(p, 'setup_time_note') || '—' },
  ],

  verdict: {
    intro:
      'An APRA-licensed bank, a $0 account, FCS protection, Xero/MYOB feeds, same-day EFTPOS settlement: Tyro checks every box and is the pick for most businesses. Setup speed is where Zeller wins instead: under 5 minutes, provided you are comfortable with its non-ADI trust structure rather than a bank licence. For international payments specifically, Airwallex is the strongest of the seven.',
    picks: [
      { slug: 'tyro-business', label: 'Best overall' },
      { slug: 'zeller-business', label: 'Fastest setup' },
      { slug: 'airwallex-business', label: 'Best for international payments' },
    ],
  },
  methodology:
    "We compare monthly fees, APRA/ADI licensing status, Financial Claims Scheme (FCS) protection, international payment support, sub-accounts and accounting integrations from each provider's official pricing and disclosure pages, re-verified quarterly. The cost projection assumes a representative usage profile over your chosen time horizon. Rankings never depend on commissions; every provider on this page is currently a visit-only listing (no tracked affiliate link yet).",
  buyerGuide: [
    {
      h3: 'ADI vs. non-ADI: the most important distinction',
      body: 'Only APRA-licensed Authorised Deposit-taking Institutions (ADIs) (Judo, Tyro, ANZ and NAB here) carry Financial Claims Scheme protection to A$250,000 per account holder. Zeller, Wise and Airwallex are AFSL-licensed payment providers, not banks: your funds are held in a segregated trust or safeguarding arrangement instead of a government-guaranteed deposit. Both models are legal and widely used, but the risk profile is genuinely different.',
    },
    {
      h3: 'Monthly fees are mostly zero now',
      body: '$0/month has become the standard for Australian business accounts. Watch instead for per-transaction fees on assisted/counter transactions (ANZ, NAB) and setup/processing fees on payment-heavy features (Wise\'s one-off setup fee, Zeller\'s EFTPOS rate).',
    },
    {
      h3: 'International payments',
      body: 'If you pay overseas suppliers or get paid by overseas clients, a multi-currency account (Airwallex, Wise) with mid-market FX pricing will beat a traditional bank\'s international wire fees and margin by a wide margin. Domestic-only accounts (Judo, Tyro, Zeller) skip this entirely.',
    },
    {
      h3: 'Sub-accounts & bookkeeping',
      body: 'Multiple named sub-accounts make it easy to set aside GST, PAYG and profit separately. Xero/MYOB bank feeds save manual reconciliation, so check this before assuming a "does everything" account already covers what your bookkeeper uses.',
    },
    {
      h3: 'Where to park idle cash',
      body: "If you're holding a large cash buffer rather than transacting daily, a business savings account with a genuine ADI (Judo Business Savings, for example) can pay meaningfully more interest than leaving the balance in a $0-interest transaction account. Just note it typically isn't a day-to-day transacting account.",
    },
  ],
  faq: [
    {
      q: 'What is the best business bank account in Australia in 2026?',
      a: 'Tyro, for most businesses: it is a genuine APRA-licensed bank offering a $0/month account with FCS protection, Xero/MYOB feeds and same-day EFTPOS settlement. Need to open an account today? Zeller takes under 5 minutes, though it operates as a non-ADI trust structure rather than a licensed bank. If you are paying or getting paid overseas, Airwallex is the standout. Fees and features are re-verified quarterly, and commissions never influence the ranking.',
    },
    {
      q: 'Is my money protected if my business bank goes under?',
      a: 'Only if your provider is an APRA-licensed ADI. The Financial Claims Scheme guarantees deposits up to A$250,000 per account holder per ADI; Judo, Tyro, ANZ and NAB qualify. Zeller, Wise and Airwallex are not banks: they safeguard client funds via segregated trust accounts or bank guarantees instead, which is not the same as a government-guaranteed deposit.',
    },
    {
      q: 'How is the multi-year cost calculated?',
      a: "We apply each account's monthly fee across your chosen time horizon. Move the horizon slider to see the dollar impact: the ranking updates live. This account category has few or no other recurring costs for typical usage, so monthly fee is the main driver.",
    },
    {
      q: 'Do I need an ABN to open a business bank account?',
      a: 'Most providers require an ABN and, for companies, an ACN plus registration documents. Sole traders can generally open an account with just an ABN. Requirements vary by provider, so check the exact document list before applying.',
    },
    {
      q: 'How current is this data?',
      a: 'Every fee, rate and feature on this page was verified against the provider\'s official pricing or disclosure page on 10 July 2026 and is re-checked quarterly. Rates and fees can change, so confirm the current terms on the provider\'s site before opening an account.',
    },
  ],
  compliance: {
    notice:
      'Not financial advice. Only APRA-licensed ADIs on this page carry Financial Claims Scheme protection to A$250,000; non-ADI providers safeguard funds differently. Confirm current terms before opening an account.',
    regulators: ['APRA', 'ASIC'],
  },

  sources: [
    { label: 'APRA: Register of Authorised Deposit-taking Institutions', url: 'https://www.apra.gov.au/register-of-authorised-deposit-taking-institutions' },
    { label: 'Financial Claims Scheme: fcs.gov.au', url: 'https://www.fcs.gov.au/' },
    { label: 'ASIC Moneysmart: bank accounts', url: 'https://moneysmart.gov.au/banking' },
  ],
  relatedLinks: [
    { label: 'Australia business banking hub', href: '/au/business-banking' },
    { label: 'Best robo-advisors & micro-investing (AU)', href: '/au/personal-finance/best/robo-advisors' },
    { label: 'How SmartFinPro reviews products', href: '/methodology' },
  ],
};
