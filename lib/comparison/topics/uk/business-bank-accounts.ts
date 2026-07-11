// lib/comparison/topics/uk/business-bank-accounts.ts
// TopicConfig for "Best Business Bank Accounts (UK)" — registered under
// 'uk:business-banking/business-bank-accounts'. Shares the
// 'business-banking/business-bank-accounts' slug with us/ca/au for hreflang
// clustering; fully independent UK-specific editorial config. Pure module —
// no React/server imports.
//
// UK-specific compliance axis (SEO addendum §4): the FSCS bank-deposit
// protection limit rose to £120,000 on 1 December 2025 (from £85,000) —
// but it applies ONLY to funds held with a full UK banking licence.
// E-money institutions (Tide's legacy rails, Wise) use SAFEGUARDING
// instead — a materially different, lower-assurance protection mechanism,
// not FSCS-backed. Revolut Business is TRANSITIONAL: it received a full UK
// banking licence in March 2026, but migration is phased — pre-March-2026
// accounts may still sit on the legacy e-money entity until actively
// migrated. `fscs_status` and `fscs_note` disclose the exact position per
// provider rather than a blanket "FSCS-protected" claim.
//
// Editorial disclosure (SEO addendum §14): Starling (£28.96M, Oct 2024),
// Monzo (£21.09M, Jul 2025) and Barclays (£42M combined, 2025) all carry
// real, confirmed FCA financial-crime enforcement fines — disclosed in
// full via regulatory_note, not top-ranked while treated as risk factors.
// Revolut's Which? "worst for fraud complaints" ranking (2 consecutive
// years) and its EU arm's 2025 ECB restriction are disclosed with the
// UK/EU entity distinction preserved.

import { z } from 'zod';
import type { TopicConfig } from './../types';
import type { ProductForComparison } from '@/lib/comparison/types';

export const ukBusinessBankAttributesSchema = z
  .object({
    fscs_status: z.enum(['full_fscs', 'safeguarded', 'transitional']),
    fscs_note: z.string(), // required — the exact protection mechanics for this provider
    interest_rate_note: z.string(),
    intl_payments_note: z.string(),
    accounting_integrations: z.array(z.string()),
    trustpilot_rating: z.number().nullable(),
    trustpilot_count: z.number().nullable(),
    trustpilot_note: z.string(),
    regulatory_note: z.string().optional(), // material, sourced compliance/complaint history — empty if none
  })
  .passthrough();

const attrStr = (p: ProductForComparison, k: string): string =>
  typeof p.attributes?.[k] === 'string' ? (p.attributes[k] as string) : '';
const attrNumOrNull = (p: ProductForComparison, k: string): number | null =>
  typeof p.attributes?.[k] === 'number' ? (p.attributes[k] as number) : null;
const attrArr = (p: ProductForComparison, k: string): string[] =>
  Array.isArray(p.attributes?.[k]) ? (p.attributes[k] as string[]) : [];
const gbp = (n: number) => (n ? `£${n.toFixed(2)}/mo` : 'Free');

const FSCS_LABEL: Record<string, string> = {
  full_fscs: 'Full FSCS (£120k)',
  safeguarded: 'Safeguarded (not FSCS)',
  transitional: 'Transitional — see detail',
};

export const ukBusinessBankAccountsConfig: TopicConfig = {
  slug: 'business-bank-accounts',
  category: 'business-banking',
  label: 'Business Bank Accounts',
  h1: (y) => `Best business bank accounts in the UK (${y})`,
  metaTitle: (y) => `Best UK Business Bank Accounts (${y})`,
  metaDescription: (y) =>
    `Compare UK business bank accounts of ${y} by monthly fee, FSCS protection and accounting integrations — independent, expert-reviewed, sourced.`,
  intro:
    'Independent, side-by-side comparison of business bank accounts for UK small businesses — ranked by monthly fee, FSCS protection status and features, with a live multi-year cost projection.',
  publishedDate: '2026-07-11',
  attributesSchema: ukBusinessBankAttributesSchema,

  specColumns: [
    {
      key: 'monthlyFee',
      label: 'Monthly fee',
      accessor: (p) => p.monthlyFee,
      format: (v) => gbp(Number(v)),
      winner: 'min',
      sortKey: 'fee',
    },
    {
      key: 'fscs',
      label: 'FSCS protection',
      accessor: (p) => (attrStr(p, 'fscs_status') === 'full_fscs' ? 2 : attrStr(p, 'fscs_status') === 'transitional' ? 1 : 0),
      format: (v) => FSCS_LABEL[Number(v) === 2 ? 'full_fscs' : Number(v) === 1 ? 'transitional' : 'safeguarded'],
      winner: 'max',
    },
    {
      key: 'integrations',
      label: 'Accounting integrations',
      accessor: (p) => attrArr(p, 'accounting_integrations').length,
      format: (v) => `${v}`,
      winner: 'max',
    },
  ],

  filters: [
    { key: 'noMonthly', label: 'No monthly fee', predicate: (p) => p.flags.noMonthly },
    { key: 'fullFscs', label: 'Full FSCS protection', predicate: (p) => attrStr(p, 'fscs_status') === 'full_fscs' },
    { key: 'accounting', label: 'Accounting software sync', predicate: (p) => attrArr(p, 'accounting_integrations').length > 0 },
  ],

  priorityChips: [
    { id: 'cost', label: 'Lowest cost', icon: 'Coins', sort: 'cost' },
    { id: 'protection', label: 'Strongest protection', icon: 'Shield', sort: 'protection' },
    { id: 'rating', label: 'Top rated', icon: 'Star', sort: 'rating' },
  ],

  matcher: [
    {
      id: 'protection',
      label: 'Want funds under full FSCS bank protection?',
      weight: 16,
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: "Doesn't matter" },
      ],
      award: (p, a) => (a === 'yes' ? { matched: attrStr(p, 'fscs_status') === 'full_fscs', reason: 'Full FSCS protection' } : { matched: true }),
    },
    {
      id: 'accounting',
      label: 'Do you need accounting software sync?',
      weight: 12,
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: "Doesn't matter" },
      ],
      award: (p, a) => (a === 'yes' ? { matched: attrArr(p, 'accounting_integrations').length > 0, reason: 'Accounting software integration' } : { matched: true }),
    },
  ],

  sortOptions: [
    { value: 'smart', label: 'Smart rank', metric: (p) => p.score },
    { value: 'cost', label: 'Lowest 3-yr cost', metric: () => 0 },
    { value: 'fee', label: 'Lowest monthly fee', metric: (p) => -p.monthlyFee },
    { value: 'protection', label: 'Strongest protection first', metric: (p) => (attrStr(p, 'fscs_status') === 'full_fscs' ? 1000 : 0) + p.score },
    { value: 'rating', label: 'Best rated', metric: (p) => (attrNumOrNull(p, 'trustpilot_rating') ?? 0) * 100 + p.score },
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
    { key: 'fee', label: 'Monthly fee', accessor: (p) => gbp(p.monthlyFee), score: (p) => -p.monthlyFee },
    { key: 'fscs', label: 'FSCS protection', accessor: (p) => `${FSCS_LABEL[attrStr(p, 'fscs_status')] ?? '—'} — ${attrStr(p, 'fscs_note')}`, score: (p) => (attrStr(p, 'fscs_status') === 'full_fscs' ? 2 : attrStr(p, 'fscs_status') === 'transitional' ? 1 : 0) },
    { key: 'interest', label: 'Interest on balance', accessor: (p) => attrStr(p, 'interest_rate_note') || 'None' },
    { key: 'intl', label: 'International payments', accessor: (p) => attrStr(p, 'intl_payments_note') || '—' },
    { key: 'integrations', label: 'Accounting integrations', accessor: (p) => attrArr(p, 'accounting_integrations').join(', ') || 'None', score: (p) => attrArr(p, 'accounting_integrations').length },
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
    { key: 'regulatory', label: 'Regulatory / compliance notes', accessor: (p) => attrStr(p, 'regulatory_note') || 'No material issues found at research time.' },
  ],

  verdict: {
    intro:
      "Starling Bank Business is our top pick — a full UK banking licence with unambiguous £120,000 FSCS protection, free UK transfers, and a genuinely useful free Making Tax Digital tool. Mettle by NatWest is the best value with a completely free account (including free FreeAgent accounting software) and full FSCS backing via NatWest's banking licence. Monzo Business offers the strongest accounting-software integration breadth (Xero, QuickBooks, FreeAgent, Sage) — though we disclose a real 2025 FCA fine for both Monzo and Starling below, and encourage weighing it alongside each bank's other genuine strengths.",
    picks: [
      { slug: 'starling-business', label: 'Best overall' },
      { slug: 'mettle-natwest', label: 'Best value' },
      { slug: 'monzo-business', label: 'Best accounting integration' },
    ],
  },
  methodology:
    "We compare each provider's monthly fee, FSCS protection status, interest rate, international payment support and accounting-software integrations from official pricing pages, distinguishing explicitly between full UK banking licences (FSCS £120,000), e-money safeguarding (not FSCS-backed), and providers mid-transition between the two. We disclose real, sourced regulatory and compliance history plainly — a bank with a confirmed FCA enforcement fine is not automatically excluded, but the fine is disclosed in full and weighed against the provider's other strengths rather than hidden. Rankings never depend on commissions — every provider on this page is currently a visit-only listing.",
  buyerGuide: [
    {
      h3: 'FSCS £120,000 vs. safeguarding — the distinction that matters most',
      body: "Since 1 December 2025, UK bank deposits are FSCS-protected up to £120,000 per person, per authorised firm — but ONLY at firms with a full UK banking licence (Starling, Monzo, Barclays, Mettle/NatWest). Tide and Wise are e-money institutions: your funds sit in SAFEGUARDED accounts (segregated, but not FSCS-insured) — a real, lower-assurance protection mechanism, not a technicality. Revolut Business is transitional: it gained a full banking licence in March 2026, but pre-March accounts may remain on the legacy e-money entity until actively migrated — check your account's current status in-app rather than assuming full protection applies.",
    },
    {
      h3: 'Reading the disclosed FCA fines honestly',
      body: "Starling Bank was fined £28,959,426 by the FCA in October 2024 for financial-crime screening failures (54,000+ accounts opened for high-risk customers in breach of a regulatory requirement). Monzo Bank was fined £21,091,300 in July 2025 for anti-money-laundering system failures spanning 2018-2022. Barclays was fined a combined £42 million in 2025 across two financial-crime risk-management cases. All three banks state the underlying issues have since been remediated — we disclose the fines in full so you can weigh them against each bank's current strengths, rather than presenting any of the three as risk-free.",
    },
    {
      h3: 'Free accounts still cost you something',
      body: 'Tide, Starling, Mettle and Monzo\'s Lite tier are free — but "free" providers typically monetise through FX fees on international payments, paid add-on tiers, or interest earned on customer balances. Wise and Revolut are explicit fee-per-transaction models instead. Neither approach is inherently better — check the international-payments row if you trade overseas, since fees there vary the most.',
    },
    {
      h3: 'Why Revolut Business is disclosed, not top-ranked',
      body: 'Revolut ranked as the UK\'s worst firm for fraud/scam complaints escalated to the Financial Ombudsman for two consecutive years (2024 and 2025), per Which? research, and its EU (Lithuania-licensed) arm had its business activities restricted by the European Central Bank in July 2025 pending an independent risk review — a matter concerning the EU entity specifically, not the new UK bank, but disclosed given the shared brand. Combined with its still-transitional FSCS status, we do not rank Revolut as a top pick while these factors remain current.',
    },
  ],
  faq: [
    {
      q: 'What is the best business bank account in the UK?',
      a: 'Starling Bank Business is our top pick — a full UK banking licence with unambiguous £120,000 FSCS protection and free UK transfers. Mettle by NatWest offers the best value with a completely free account including free FreeAgent accounting software, and Monzo Business has the strongest accounting-integration breadth. We disclose real 2025 FCA fines against Starling, Monzo and Barclays in full — weigh these alongside each bank\'s other strengths.',
    },
    {
      q: 'Is my UK business banking money protected up to £120,000?',
      a: "Only at providers with a full UK banking licence — Starling, Monzo, Barclays and Mettle (via NatWest) all qualify. Tide and Wise are e-money institutions using safeguarding, not FSCS protection — a materially different, lower-assurance mechanism. Revolut Business is transitional following its March 2026 banking licence: check your specific account's migration status in-app rather than assuming full protection.",
    },
    {
      q: 'How is the multi-year cost calculated?',
      a: "We apply each account's monthly fee across your chosen time horizon. Move the horizon slider to see the dollar impact — the ranking updates live. Most accounts on this page have few other recurring costs for typical domestic usage, so monthly fee is the main driver; international-payment fees can matter more if you trade overseas.",
    },
    {
      q: 'Why aren\'t Starling and Monzo excluded given their FCA fines?',
      a: 'Financial-crime control failures are serious and disclosed in full on this page — but both banks remain FCA-authorised, state the underlying issues have been remediated, and offer genuinely strong products otherwise. We disclose the fines plainly rather than silently omitting them, and let you weigh the risk alongside each bank\'s other strengths, consistent with our approach across every comparison on this site.',
    },
    {
      q: 'How current is this data?',
      a: 'Every fee, protection status and disclosure on this page was verified against official provider pages, the FCA Register and FSCS/Bank of England sources on 11 July 2026. Revolut Business\'s FSCS migration status changes as accounts are moved onto the new banking entity — confirm your own account\'s current status directly before relying on this page.',
    },
  ],
  compliance: {
    notice:
      "Not financial advice. UK bank deposits are FSCS-protected up to £120,000 per person, per authorised firm — this applies only to full banking licences, not e-money safeguarding. Confirm current protection status before opening an account.",
    regulators: ['FCA', 'FSCS'],
  },

  sources: [
    { label: 'FSCS — deposit protection increase to £120,000', url: 'https://www.fscs.org.uk/media/press/2025/nov/fscs-welcomes-higher-deposit-protection-limit-of-120000--giving-people-confidence-their-money-is-protected/' },
    { label: 'FCA Register', url: 'https://register.fca.org.uk/' },
    { label: 'FCA — Starling Bank fine, October 2024', url: 'https://www.fca.org.uk/news/press-releases/fca-fines-starling-bank-failings-financial-crime-systems-and-controls' },
  ],
  relatedLinks: [
    { label: 'UK business banking hub', href: '/uk/business-banking' },
    { label: 'How SmartFinPro reviews products', href: '/methodology' },
  ],
};
