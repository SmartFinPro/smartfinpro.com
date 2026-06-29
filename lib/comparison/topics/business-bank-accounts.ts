// lib/comparison/topics/business-bank-accounts.ts
// TopicConfig for "Best Business Bank Accounts" (US). Pure module — no React,
// no server imports. Migrated 1:1 from the legacy banking comparison: the data
// lives in FLAT top-level ProductForComparison fields (monthlyFee, fxFeePct,
// fdicCoverage, flags.*, …), NOT in an `attributes` JSONB — so the schema is
// permissive and every accessor reads a top-level field.

import { z } from 'zod';
import type { TopicConfig } from './types';
import type { ProductForComparison } from '@/lib/comparison/types';

/** Business-banking rows carry their facts in top-level columns, not `attributes`.
 *  Keep the schema permissive so mapCockpitRow's per-row validation always passes. */
export const businessBankAttributesSchema = z.object({}).passthrough();

const yesNo = (b: boolean) => (b ? 'Yes' : 'No');
const usd = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`;
const money = (n: number) => (n ? usd(n) : '—'); // signup bonus
const perMonth = (n: number) => (n ? `${usd(n)}/mo` : '$0/mo'); // monthly fee headline
const pct = (n: number) => (n ? `${n}%` : '—'); // fx fee / apy
const txt = (s: string | number | null) => {
  const v = s == null ? '' : String(s).trim();
  return v ? v : '—';
};

export const businessBankAccountsConfig: TopicConfig = {
  slug: 'business-bank-accounts',
  category: 'business-banking',
  label: 'Business Bank Accounts',
  h1: (y) => `Best business bank accounts in ${y}`,
  metaTitle: (y) => `Best Business Bank Accounts (${y}) — Compared & Ranked`,
  metaDescription: (y) =>
    `Compare the best US business bank accounts of ${y}: monthly fees, FDIC coverage, sub-accounts, ATM & wire support, plus a live multi-year cost calculator.`,
  intro:
    'Independent, side-by-side comparison of the leading US business checking accounts — ranked by fees, FDIC coverage and features, with a live cost projection over your chosen time horizon.',
  publishedDate: '2026-06-29',
  attributesSchema: businessBankAttributesSchema,

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
      key: 'fdic',
      label: 'FDIC coverage',
      accessor: (p) => p.fdicCoverage,
      format: (v) => txt(v),
      // free text ("$5M (sweep)" vs "Standard ($250k)") — no winner highlight.
    },
    {
      key: 'freeAtm',
      label: 'Free ATM',
      accessor: (p) => (p.flags.freeAtm ? 1 : 0),
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
    { key: 'freeAtm', label: 'Free / refunded ATM', predicate: (p) => p.flags.freeAtm },
    { key: 'noFx', label: 'No foreign fee', predicate: (p) => p.flags.noFx },
    { key: 'subAccounts', label: 'Sub-accounts', predicate: (p) => p.flags.subAccounts },
    { key: 'interest', label: 'Earns interest', predicate: (p) => p.flags.interest },
    { key: 'bonus', label: 'Signup bonus', predicate: (p) => p.flags.bonus },
  ],

  priorityChips: [
    { id: 'cost', label: 'Lowest cost', icon: 'Coins', sort: 'cost' },
    { id: 'fee', label: 'No monthly fee', icon: 'Wallet', sort: 'fee' },
    { id: 'rating', label: 'Top rated', icon: 'Star', sort: 'rating' },
    { id: 'team', label: 'Best for teams', icon: 'Users', sort: 'team' },
  ],

  matcher: [
    {
      id: 'monthly',
      label: 'Want to avoid monthly fees?',
      weight: 14,
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: "Doesn't matter" },
      ],
      award: (p, a) =>
        a === 'yes' ? { matched: p.flags.noMonthly, reason: 'No monthly fee' } : { matched: true },
    },
    {
      id: 'team',
      label: 'Need sub-accounts for budgeting or a team?',
      weight: 12,
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: "Doesn't matter" },
      ],
      award: (p, a) =>
        a === 'yes' ? { matched: p.hasSubAccounts, reason: 'Sub-accounts' } : { matched: true },
    },
    {
      id: 'entity',
      label: "What's your business structure?",
      weight: 10,
      options: [
        { value: 'sole-prop', label: 'Sole proprietor / freelancer' },
        { value: 'llc', label: 'LLC' },
        { value: 'c-corp', label: 'C-Corp / startup' },
      ],
      award: (p, a) => ({ matched: p.entityTypes.includes(a), reason: 'Supports your entity type' }),
    },
  ],

  sortOptions: [
    { value: 'smart', label: 'Smart rank', metric: (p) => p.score },
    { value: 'cost', label: 'Lowest 3-yr cost', metric: () => 0 }, // special-cased in orderProducts
    { value: 'fee', label: 'Lowest monthly fee', metric: (p) => -p.monthlyFee },
    { value: 'rating', label: 'Best rated', metric: (p) => p.rating * 100 + p.score },
    { value: 'team', label: 'Best for teams', metric: (p) => (p.hasSubAccounts ? 1000 : 0) + p.score },
    { value: 'apy', label: 'Highest APY', metric: (p) => p.apy * 100 + p.score },
  ],

  costModel: {
    kind: 'banking',
    amountLabel: 'Representative usage', // banking cost ignores amount; slider hidden in the decision bar
    amountMin: 0,
    amountMax: 10_000,
    amountStep: 250,
    amountDefault: 500, // matches DEFAULT_USAGE.fxSpend so the displayed assumption is consistent
    yearsLabel: 'Time horizon (years)',
    yearsMin: 1,
    yearsMax: 5,
    yearsDefault: 3,
  },

  compareRows: [
    { key: 'fee', label: 'Monthly fee', accessor: (p) => perMonth(p.monthlyFee), score: (p) => -p.monthlyFee },
    { key: 'fdic', label: 'FDIC coverage', accessor: (p) => txt(p.fdicCoverage) }, // free text → no score
    { key: 'atm', label: 'Free ATM', accessor: (p) => yesNo(p.flags.freeAtm), score: (p) => (p.flags.freeAtm ? 1 : 0) },
    { key: 'fx', label: 'Foreign fee', accessor: (p) => pct(p.fxFeePct), score: (p) => -p.fxFeePct },
    { key: 'sub', label: 'Sub-accounts', accessor: (p) => yesNo(p.hasSubAccounts), score: (p) => (p.hasSubAccounts ? 1 : 0) },
    { key: 'apy', label: 'APY on balance', accessor: (p) => pct(p.apy), score: (p) => p.apy },
    { key: 'bonus', label: 'Signup bonus', accessor: (p) => money(p.signupBonus), score: (p) => p.signupBonus },
  ],

  detailRows: [
    { key: 'wires', label: 'Wire transfers', accessor: (p) => txt(p.wireTransfers) },
    { key: 'card', label: 'Card network', accessor: (p) => txt(p.cardNetwork) },
    { key: 'entity', label: 'Entity types', accessor: (p) => p.entityTypes.join(', ') || '—' },
    { key: 'cash', label: 'Cash deposits', accessor: (p) => yesNo(p.supportsCashDeposits) },
    { key: 'intl', label: 'International wires', accessor: (p) => yesNo(p.supportsIntlWires) },
    { key: 'lending', label: 'Lending available', accessor: (p) => yesNo(p.hasLending) },
    { key: 'books', label: 'Built-in bookkeeping', accessor: (p) => yesNo(p.hasBookkeeping) },
    { key: 'apps', label: 'Apps', accessor: (p) => p.apps.join(', ') || '—' },
    { key: 'integr', label: 'Integrations', accessor: (p) => p.integrations.join(', ') || '—' },
  ],

  verdict: {
    intro: "Our editors' picks for the best US business bank accounts right now.",
    picks: [
      { slug: 'mercury', label: 'Best overall' },
      { slug: 'novo', label: 'Best for freelancers' },
      { slug: 'relay', label: 'Best for teams' },
    ],
  },
  methodology:
    "We compare monthly fees, FDIC and sweep-network coverage, ATM and wire policies, foreign-transaction fees, sub-account support and integrations from each provider's official disclosures, re-verified quarterly. The cost projection assumes a representative usage profile (about 4 out-of-network ATM withdrawals and $500 of foreign spend per month) over your chosen time horizon. Rankings never depend on commissions.",
  buyerGuide: [
    {
      h3: 'Monthly fees & minimums',
      body: 'Most modern business accounts are $0/mo with no minimum balance — watch for premium tiers that charge a monthly fee to unlock cashback, tax tools or higher limits.',
    },
    {
      h3: 'FDIC coverage & sweep networks',
      body: 'Standard FDIC insurance is $250,000 per depositor. Several providers extend coverage into the millions by sweeping deposits across partner banks — this matters if you hold a large operating balance.',
    },
    {
      h3: 'Sub-accounts & team controls',
      body: 'Sub-accounts let you separate taxes, payroll and profit (Profit First). Roles and permissions matter once more than one person touches the money.',
    },
    {
      h3: 'Cash, wires & foreign fees',
      body: 'Fully digital banks often can’t accept cash deposits and may charge for wires or foreign transactions. Match these to how your business actually moves money.',
    },
  ],
  faq: [
    {
      q: 'What is the best business bank account in 2026?',
      a: 'Mercury is our top overall pick for 2026 — $0 monthly fees with up to $5M in FDIC coverage through its partner-bank sweep network. Novo is best for freelancers and solopreneurs, and Relay is best for teams that need multiple sub-accounts. We re-verify fees and features quarterly, and the ranking never depends on commissions.',
    },
    {
      q: 'How is the multi-year cost calculated?',
      a: 'We apply each account’s monthly fee plus a representative usage profile (about 4 out-of-network ATM withdrawals and $500 of foreign spend per month) across your chosen time horizon. Move the horizon slider to see the dollar impact — the ranking updates live.',
    },
    {
      q: 'How does SmartFinPro rank business bank accounts?',
      a: 'Our Smart Rank blends our independent score, your projected cost, fees and ratings. The order never depends on commissions.',
    },
    {
      q: 'Are these accounts FDIC-insured?',
      a: 'Yes. Deposits are held at FDIC-member partner banks and insured to $250,000 per depositor; several providers extend coverage into the millions through partner-bank sweep networks.',
    },
    {
      q: 'Are these affiliate links?',
      a: 'Some are. A green “View offer” may earn us a commission at no cost to you, and only ever appears for partners whose tracking we have verified. It never affects the ranking.',
    },
  ],
  compliance: {
    notice: 'Not financial advice · banking products provided by partner banks, Member FDIC.',
    regulators: ['FDIC'],
  },
};
