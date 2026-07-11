// lib/comparison/topics/uk/savings-accounts.ts
// TopicConfig for "Best Savings Accounts & Cash ISAs (UK)" — registered
// under 'uk:savings/savings-accounts'. Shares the 'savings/savings-accounts'
// slug with au for structural consistency (not a real hreflang cluster —
// savings is not a shared US category). Pure module — no React/server
// imports.
//
// UK-specific nuance (mirrors au/savings-accounts.ts): every "bonus rate"
// account has a base/fallback rate that applies the instant a monthly
// condition is missed. max_rate_pct alone is a marketing headline;
// rate_type + rate_conditions + base_rate_pct are surfaced everywhere the
// max rate is shown, per SEO addendum §3 (no bare volatile-rate claims
// without conditions attached). UK terminology uses AER (Annual Equivalent
// Rate), never APY.
//
// FSCS £120,000 (SEO addendum §4): this is the UK BANK-DEPOSIT protection
// scheme, raised from £85,000 effective 1 December 2025 — a DIFFERENT
// scheme from the £85,000 investment-protection limit used on the
// investing-apps page. All 7 candidates here hold full standalone UK
// banking licences; Paragon Bank shares its licence with its "Spring"
// savings brand, so a customer's combined balance across both brands
// counts toward the same £120,000 cap — disclosed via
// fscs_shared_licence_note.
//
// Editorial disclosure (SEO addendum §14): Marcus's UK Trustpilot score is
// genuinely weak (2.9/5) with 2025 sudden-account-closure complaints —
// disclosed, not top-ranked despite a strong MSE-listed fixed rate.
// Shawbrook's legacy 2021 timeshare mis-selling case (Financial Ombudsman
// ruling upheld on High Court judicial review in 2023) predates this
// research window but is disclosed for transparency. Two "award" claims
// (Charter Savings Bank's "Which? Recommended"/"Moneynet Provider of the
// Year") could not be independently confirmed via a canonical source at
// research time and are deliberately NOT asserted as fact on this page.

import { z } from 'zod';
import type { TopicConfig } from './../types';
import type { ProductForComparison } from '@/lib/comparison/types';

export const ukSavingsAttributesSchema = z
  .object({
    max_rate_pct: z.number(), // headline AER a new customer is likely to see
    base_rate_pct: z.number(), // fallback/standard AER if the bonus condition is missed or not chosen
    rate_type: z.enum(['standard', 'conditional', 'intro', 'fixed_term']),
    rate_conditions: z.string(), // ALWAYS shown alongside max_rate_pct
    cash_isa_available: z.boolean(),
    cash_isa_note: z.string(),
    min_deposit: z.number(),
    fscs_full: z.boolean(), // true = full UK banking licence, £120,000 FSCS protection applies
    fscs_shared_licence_note: z.string().optional(), // e.g. Paragon shares its licence with the Spring brand
    trustpilot_rating: z.number().nullable(),
    trustpilot_count: z.number().nullable(),
    trustpilot_note: z.string(),
    regulatory_note: z.string().optional(), // material, sourced compliance/complaint history — empty if none
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
const pct = (n: number) => `${n.toFixed(2)}% AER`;
const RATE_TYPE_LABEL: Record<string, string> = { standard: 'Unconditional', conditional: 'Conditional bonus', intro: 'Introductory (new customers)', fixed_term: 'Fixed term' };

export const ukSavingsAccountsConfig: TopicConfig = {
  slug: 'savings-accounts',
  category: 'savings',
  label: 'Savings Accounts & Cash ISAs',
  h1: (y) => `Best savings accounts & Cash ISAs in the UK (${y})`,
  metaTitle: (y) => `Best UK Savings Accounts & ISAs (${y})`,
  metaDescription: (y) =>
    `Compare UK savings accounts and Cash ISAs of ${y} by AER, bonus conditions and FSCS protection — independent, expert-reviewed, verified rates.`,
  intro:
    "Independent, side-by-side comparison of the UK's savings accounts and Cash ISAs — ranked by AER, bonus conditions and FSCS protection, with every conditional and introductory rate shown alongside its real fallback.",
  publishedDate: '2026-07-11',
  attributesSchema: ukSavingsAttributesSchema,

  specColumns: [
    {
      key: 'maxRate',
      label: 'Max rate (AER)',
      accessor: (p) => attrNum(p, 'max_rate_pct'),
      format: (v) => pct(Number(v)),
      winner: 'max',
    },
    {
      key: 'baseRate',
      label: 'Base/fallback rate',
      accessor: (p) => attrNum(p, 'base_rate_pct'),
      format: (v) => pct(Number(v)),
      winner: 'max',
    },
    {
      key: 'cashIsa',
      label: 'Cash ISA available',
      accessor: (p) => (attrBool(p, 'cash_isa_available') ? 1 : 0),
      format: (v) => yesNo(!!Number(v)),
      winner: 'max',
    },
  ],

  filters: [
    { key: 'cashIsa', label: 'Cash ISA available', predicate: (p) => attrBool(p, 'cash_isa_available') },
    { key: 'noConditions', label: 'No bonus conditions', predicate: (p) => attrStr(p, 'rate_type') === 'standard' },
    { key: 'noMinDeposit', label: 'No minimum deposit', predicate: (p) => attrNum(p, 'min_deposit') === 0 },
  ],

  priorityChips: [
    { id: 'rate', label: 'Highest rate', icon: 'TrendingUp', sort: 'rate' },
    { id: 'isa', label: 'Cash ISA', icon: 'Shield', sort: 'isa' },
    { id: 'rating', label: 'Top rated', icon: 'Star', sort: 'rating' },
  ],

  matcher: [
    {
      id: 'isa',
      label: 'Do you want a Cash ISA?',
      weight: 14,
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: "Doesn't matter" },
      ],
      award: (p, a) => (a === 'yes' ? { matched: attrBool(p, 'cash_isa_available'), reason: 'Cash ISA available' } : { matched: true }),
    },
    {
      id: 'conditions',
      label: 'Want a rate with no monthly conditions to meet?',
      weight: 10,
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: "Doesn't matter" },
      ],
      award: (p, a) => (a === 'yes' ? { matched: attrStr(p, 'rate_type') === 'standard', reason: 'No bonus conditions required' } : { matched: true }),
    },
  ],

  sortOptions: [
    { value: 'smart', label: 'Smart rank', metric: (p) => p.score },
    { value: 'rate', label: 'Highest rate', metric: (p) => attrNum(p, 'max_rate_pct') * 100 + p.score },
    { value: 'isa', label: 'Cash ISA first', metric: (p) => (attrBool(p, 'cash_isa_available') ? 1000 : 0) + p.score },
    { value: 'rating', label: 'Best rated', metric: (p) => (attrNumOrNull(p, 'trustpilot_rating') ?? 0) * 100 + p.score },
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
    yearsMax: 5,
    yearsDefault: 3,
  },

  compareRows: [
    { key: 'maxRate', label: 'Max rate (AER)', accessor: (p) => `${pct(attrNum(p, 'max_rate_pct'))} (${RATE_TYPE_LABEL[attrStr(p, 'rate_type')] ?? '—'})`, score: (p) => attrNum(p, 'max_rate_pct') },
    { key: 'conditions', label: 'Rate conditions', accessor: (p) => attrStr(p, 'rate_conditions') || '—' },
    { key: 'baseRate', label: 'Base/fallback rate', accessor: (p) => pct(attrNum(p, 'base_rate_pct')) },
    { key: 'isa', label: 'Cash ISA', accessor: (p) => (attrBool(p, 'cash_isa_available') ? attrStr(p, 'cash_isa_note') || 'Available' : 'Not offered'), score: (p) => (attrBool(p, 'cash_isa_available') ? 1 : 0) },
    { key: 'fscs', label: 'FSCS protection', accessor: (p) => (attrBool(p, 'fscs_full') ? `Full FSCS, £120,000${attrStr(p, 'fscs_shared_licence_note') ? ' — ' + attrStr(p, 'fscs_shared_licence_note') : ''}` : 'Not independently confirmed') },
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
      "Atom Bank is our top pick — the strongest independently corroborated customer rating in this comparison (4.8-5.0/5 on Trustpilot), a competitive Reward-tier rate, and a Cash ISA option. Charter Savings Bank has the best unconditional easy-access rate of the 7 (4.21% AER, no bonus conditions), and Shawbrook Bank is the most consistently well-reviewed long-running fixed-rate option, a fixture of UK best-buy tables since 2017.",
    picks: [
      { slug: 'atom-bank', label: 'Best overall' },
      { slug: 'charter-savings-bank', label: 'Best unconditional easy-access rate' },
      { slug: 'shawbrook-bank', label: 'Best long-running fixed-rate option' },
    ],
  },
  methodology:
    "We compare each bank's headline AER, the exact conditions required to earn it, the fallback rate that applies when a condition is missed, Cash ISA availability and FSCS protection status from official rate pages, cross-checked against MoneySavingExpert and Which? where a canonical figure could be independently confirmed. We never show a bonus or introductory rate without its conditions attached — a rate that requires no withdrawals in a given month, or applies only for 12 months to new customers, is materially different from an unconditional rate, and we label each accordingly. We disclose real, sourced regulatory and complaint history plainly rather than omitting it. Rankings never depend on commissions — every provider on this page is currently a visit-only listing.",
  buyerGuide: [
    {
      h3: 'FSCS £120,000 — bank deposits, not investments',
      body: 'Since 1 December 2025, UK bank deposits are FSCS-protected up to £120,000 per person, per authorised firm — all 7 banks on this page hold a full UK banking licence and this protection applies. This is a different, higher scheme from the £85,000 limit that covers investments (shares, funds, ETFs) on our separate investing-apps comparison — never assume the two figures are interchangeable.',
    },
    {
      h3: 'Bonus rates almost always have a catch',
      body: "Atom Bank's top Reward rate (4.75-4.85% AER) requires making no withdrawal in a given month, dropping to 2.50% the moment you do. Chase UK's Boosted Saver (4.5% AER) only applies for 12 months to new customers, before reverting to the Standard Saver rate. Zopa's higher rate requires an active Biscuit current account. Always check the base/fallback rate — not just the headline — before choosing an account based on rate alone.",
    },
    {
      h3: 'Not every bank offers a Cash ISA',
      body: 'Chase UK does not currently offer a Cash ISA — a genuine gap if tax-free savings matter to you. The other 6 all offer at least one Cash ISA product, though rates and terms (easy-access vs. fixed) vary. Cash ISA allowances are separate from Stocks & Shares ISA allowances but share the same overall £20,000 annual limit across all ISA types combined.',
    },
    {
      h3: 'Reading disclosed issues honestly',
      body: "Marcus's UK Trustpilot score is genuinely weak (2.9/5), driven by 2025 complaints about sudden account closures — disclosed plainly despite Marcus's competitive MoneySavingExpert-listed fixed rate. Shawbrook carries a legacy 2021 timeshare mis-selling case (Financial Ombudsman ruling upheld on High Court judicial review in 2023) that predates this research window but is disclosed for transparency, as related claims reportedly continue.",
    },
  ],
  faq: [
    {
      q: 'What is the best savings account in the UK right now?',
      a: 'Atom Bank is our top pick, combining the strongest customer rating in this comparison with a competitive Reward-tier rate and Cash ISA availability. Charter Savings Bank has the best unconditional easy-access rate (4.21% AER, no conditions), and Shawbrook Bank is the most consistently well-reviewed long-running fixed-rate option. We re-verify rates regularly, and the ranking never depends on commissions.',
    },
    {
      q: 'Is my money protected if my savings bank fails?',
      a: 'Yes — all 7 banks on this page hold a full UK banking licence, so deposits are FSCS-protected up to £120,000 per person, per bank (raised from £85,000 in December 2025). Paragon Bank shares its licence with its Spring savings brand, so a combined balance across both counts toward the same £120,000 cap — check the FSCS row for each provider\'s specific position.',
    },
    {
      q: 'Do all of these banks offer a Cash ISA?',
      a: 'No — Chase UK does not currently offer a Cash ISA. The other 6 (Marcus, Zopa, Atom, Paragon, Charter Savings Bank and Shawbrook) all offer at least one Cash ISA product, with rates and terms varying between easy-access and fixed options.',
    },
    {
      q: 'What does "AER" mean and how is it different from a headline savings rate?',
      a: "AER (Annual Equivalent Rate) shows what you'd earn over a full year including the effect of compounding, letting you compare accounts with different interest-payment frequencies on a like-for-like basis. Always check whether a headline AER is unconditional, requires a monthly condition (like Atom Bank's no-withdrawal rule), or is a time-limited introductory rate — we label each account's rate type explicitly.",
    },
    {
      q: 'How current is this data?',
      a: 'Every rate and disclosure on this page was verified against official bank rate pages, MoneySavingExpert and the Bank of England on 11 July 2026, when the Bank of England base rate stood at 3.75%. Savings rates change frequently — confirm the current rate directly with the provider before opening an account.',
    },
  ],
  compliance: {
    notice:
      'Not financial advice. FSCS protects UK bank deposits up to £120,000 per person, per authorised firm — a different scheme from investment protection. Savings rates change frequently; confirm current terms before opening an account.',
    regulators: ['FCA', 'FSCS'],
  },

  sources: [
    { label: 'FSCS — deposit protection increase to £120,000', url: 'https://www.fscs.org.uk/media/press/2025/nov/fscs-welcomes-higher-deposit-protection-limit-of-120000--giving-people-confidence-their-money-is-protected/' },
    { label: 'Bank of England — monetary policy summary', url: 'https://www.bankofengland.co.uk/monetary-policy-summary-and-minutes' },
    { label: 'MoneySavingExpert — savings accounts best buys', url: 'https://www.moneysavingexpert.com/savings/savings-accounts-best-interest/' },
  ],
  relatedLinks: [
    { label: 'UK savings hub', href: '/uk/savings' },
    { label: 'Best investing apps & Stocks & Shares ISAs (UK)', href: '/uk/personal-finance/best/investing-apps' },
    { label: 'How SmartFinPro reviews products', href: '/methodology' },
  ],
};
