// lib/comparison/topics/ca/business-bank-accounts.ts
// TopicConfig for "Best Business Bank Accounts (Canada)" — registered under
// 'ca:business-banking/business-bank-accounts'. Shares the
// 'business-banking/business-bank-accounts' slug with us/uk/au for hreflang
// clustering; fully independent CA-specific editorial config. Pure module —
// no React/server imports.
//
// CA-specific compliance axis (SEO addendum §4): CDIC insures deposits at
// member banks to $100,000 per eligible category — automatic, no
// enrollment. Float is NOT a bank and NOT itself a CDIC member; CAD/USD
// funds sit in a trust account AT SCOTIABANK (the actual CDIC member),
// giving indirect protection capped at $100,000 COMBINED across both
// currencies — a materially different structure than a direct bank
// relationship, disclosed explicitly via `cdic_note`, never glossed over.
//
// Editorial disclosure (SEO addendum §14, same policy as prior slices): TD
// carries a real, material 2025 compliance record — a ~US$3.09B US
// anti-money-laundering guilty plea/penalty and a C$5.5M FCAC fine for
// inaccurate cost-of-borrowing disclosure (including small-business loans)
// — disclosed in full, not top-ranked.

import { z } from 'zod';
import type { TopicConfig } from './../types';
import type { ProductForComparison } from '@/lib/comparison/types';

export const caBusinessBankAttributesSchema = z
  .object({
    fee_waiver_note: z.string(), // full mechanics of how the monthly fee is waived, if at all
    interest_rate_pct: z.number(),
    cdic_protected: z.boolean(),
    cdic_note: z.string(), // required — names the actual CDIC member institution when the brand itself isn't a bank
    intl_payments: z.boolean(),
    intl_payments_note: z.string(),
    accounting_integrations: z.array(z.string()),
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
const attrBool = (p: ProductForComparison, k: string): boolean => p.attributes?.[k] === true;
const attrArr = (p: ProductForComparison, k: string): string[] =>
  Array.isArray(p.attributes?.[k]) ? (p.attributes[k] as string[]) : [];
const yesNo = (b: boolean) => (b ? 'Yes' : 'No');
const cad = (n: number) => (n ? `C$${n}/mo` : 'C$0/mo');
const pct = (n: number) => (n ? `${n.toFixed(2)}%` : '0%');

export const caBusinessBankAccountsConfig: TopicConfig = {
  slug: 'business-bank-accounts',
  category: 'business-banking',
  label: 'Business Bank Accounts',
  h1: (y) => `Best business bank accounts in Canada (${y})`,
  metaTitle: (y) => `Best Business Bank Accounts Canada (${y})`,
  metaDescription: (y) =>
    `Compare Canadian business bank accounts of ${y} by monthly fee, CDIC protection and accounting integrations — independent, expert-reviewed, sourced.`,
  intro:
    'Independent, side-by-side comparison of business bank accounts for Canadian small businesses — ranked by monthly fee, CDIC protection and features, with a live multi-year cost projection.',
  publishedDate: '2026-07-11',
  attributesSchema: caBusinessBankAttributesSchema,

  specColumns: [
    {
      key: 'monthlyFee',
      label: 'Monthly fee',
      accessor: (p) => p.monthlyFee,
      format: (v) => cad(Number(v)),
      winner: 'min',
      sortKey: 'fee',
    },
    {
      key: 'cdic',
      label: 'CDIC protected',
      accessor: (p) => (attrBool(p, 'cdic_protected') ? 1 : 0),
      format: (v) => (Number(v) ? 'Yes — direct' : 'Indirect (trust)'),
      winner: 'max',
    },
    {
      key: 'integrations',
      label: 'Accounting integrations',
      accessor: (p) => attrArr(p, 'accounting_integrations').length,
      format: (v) => `${v}`,
      winner: 'max',
    },
    {
      key: 'intl',
      label: 'International payments',
      accessor: (p) => (attrBool(p, 'intl_payments') ? 1 : 0),
      format: (v) => yesNo(!!Number(v)),
      winner: 'max',
    },
  ],

  filters: [
    { key: 'noMonthly', label: 'No monthly fee', predicate: (p) => p.flags.noMonthly },
    { key: 'cdicDirect', label: 'Direct CDIC-insured bank', predicate: (p) => attrBool(p, 'cdic_protected') },
    { key: 'accounting', label: 'Accounting software sync', predicate: (p) => attrArr(p, 'accounting_integrations').length > 0 },
    { key: 'intl', label: 'International payments', predicate: (p) => attrBool(p, 'intl_payments') },
  ],

  priorityChips: [
    { id: 'cost', label: 'Lowest cost', icon: 'Coins', sort: 'cost' },
    { id: 'integrations', label: 'Best accounting sync', icon: 'Layers', sort: 'integrations' },
    { id: 'rating', label: 'Top rated', icon: 'Star', sort: 'rating' },
  ],

  matcher: [
    {
      id: 'protection',
      label: 'Want funds directly insured by a CDIC-member bank?',
      weight: 16,
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: "Doesn't matter" },
      ],
      award: (p, a) => (a === 'yes' ? { matched: attrBool(p, 'cdic_protected'), reason: 'Direct CDIC-insured bank' } : { matched: true }),
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
    { value: 'integrations', label: 'Best accounting sync', metric: (p) => attrArr(p, 'accounting_integrations').length * 100 + p.score },
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
    { key: 'fee', label: 'Monthly fee', accessor: (p) => cad(p.monthlyFee), score: (p) => -p.monthlyFee },
    { key: 'waiver', label: 'Fee waiver', accessor: (p) => attrStr(p, 'fee_waiver_note') || '—' },
    { key: 'interest', label: 'Interest on balance', accessor: (p) => pct(attrNumOrNull(p, 'interest_rate_pct') ?? 0), score: (p) => attrNumOrNull(p, 'interest_rate_pct') ?? 0 },
    { key: 'cdic', label: 'CDIC protection', accessor: (p) => (attrBool(p, 'cdic_protected') ? `Yes — ${attrStr(p, 'cdic_note') || 'direct'}` : attrStr(p, 'cdic_note') || 'Not directly CDIC-insured') },
    { key: 'intl', label: 'International payments', accessor: (p) => (attrBool(p, 'intl_payments') ? attrStr(p, 'intl_payments_note') || 'Yes' : 'No'), score: (p) => (attrBool(p, 'intl_payments') ? 1 : 0) },
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
      'RBC is our top pick — a full CDIC-insured bank with the largest branch network and genuine accounting automation (RBC PayEdge). EQ Bank is the best value with a completely free account and a strong interest rate, and Float has the best accounting-software integration of any candidate (QuickBooks, Xero and NetSuite), though its CDIC protection runs indirectly through a Scotiabank trust account rather than a direct bank relationship.',
    picks: [
      { slug: 'rbc-business', label: 'Best overall' },
      { slug: 'eq-bank-business', label: 'Best value' },
      { slug: 'float-business', label: 'Best accounting integration' },
    ],
  },
  methodology:
    "We compare each provider's monthly fee and waiver conditions, interest rate, CDIC protection structure, international payment support and accounting-software integrations from official pricing pages, distinguishing explicitly between direct CDIC-member banks and fintechs whose funds sit in a trust account at a CDIC member (a materially different structure). We disclose real, sourced regulatory and compliance history plainly — a provider under active regulatory scrutiny is not treated as a top pick. Rankings never depend on commissions — every provider on this page is currently a visit-only listing.",
  buyerGuide: [
    {
      h3: 'CDIC protection — and the fintech nuance',
      body: "Standard banks (RBC, TD, BMO, EQ/Equitable, Scotiabank, National Bank) are CDIC members — deposits are automatically insured up to $100,000 per eligible category, no enrollment needed. Float is different: it's a registered Money Services Business, not a bank, so customer funds sit in a trust account AT SCOTIABANK (the actual CDIC member) in the business's name, giving indirect protection capped at $100,000 combined across CAD and USD — a lower, differently-structured ceiling than a direct bank account. This is worth understanding clearly, not treating as equivalent to a bank relationship.",
    },
    {
      h3: 'Monthly fees are mostly small or waivable',
      body: 'Entry-tier fees at the Big banks now run C$5–10/month, often waivable at a minimum balance ($8,000–$45,000 depending on the bank and tier) or with a linked business credit card. EQ Bank and Float charge nothing at all, trading branch access (EQ) or direct-bank-CDIC-status (Float) for the free tier.',
    },
    {
      h3: 'Accounting integrations vary a lot',
      body: "Float offers the deepest integration (QuickBooks Online, Xero, NetSuite). BMO has a formal Xero partnership plus QuickBooks. RBC and TD offer embedded-banking add-ons (RBC PayEdge, TD Embedded Banking via FISPAN) that go beyond simple bank feeds but are separate products from the base account. EQ Bank currently has no accounting software integration at all — a real gap if you want automated bookkeeping.",
    },
    {
      h3: 'Reading TD\'s disclosed compliance history honestly',
      body: 'TD Bank pleaded guilty and paid approximately US$3.09 billion in a US anti-money-laundering case (finalized 2024, still relevant through 2025-26), and Canada\'s FCAC separately fined TD C$5.5 million in September 2025 for inaccurate cost-of-borrowing disclosure across several loan products, including small-business loans. We disclose this in full rather than omitting it, and TD is not our top pick as a result — you should weigh this alongside your own risk tolerance and TD\'s other genuine strengths (embedded accounting automation, historically long branch hours).',
    },
  ],
  faq: [
    {
      q: 'What is the best business bank account in Canada?',
      a: 'RBC is our top pick — a full CDIC-insured bank with the largest branch network and genuine accounting automation. EQ Bank offers the best value with a completely free account and strong interest rate, and Float has the deepest accounting-software integration, though its CDIC protection is indirect via a Scotiabank trust account. We re-verify fees and features regularly, and the ranking never depends on commissions.',
    },
    {
      q: 'Is my business banking money protected in Canada?',
      a: "It depends on the structure. Direct CDIC-member banks (RBC, TD, BMO, EQ/Equitable, Scotiabank, National Bank) automatically insure deposits up to $100,000 per eligible category. Float is not a bank — funds sit in a trust account at Scotiabank (the actual CDIC member), giving indirect protection capped at $100,000 combined across CAD and USD, a materially different and lower ceiling than a direct bank account.",
    },
    {
      q: 'How is the multi-year cost calculated?',
      a: "We apply each account's monthly fee across your chosen time horizon. Move the horizon slider to see the dollar impact — the ranking updates live. Most accounts on this page have few other recurring costs for typical usage, so monthly fee is the main driver.",
    },
    {
      q: 'Why isn\'t TD the top pick despite being a major bank?',
      a: 'TD carries a real, disclosed 2025 compliance record: a roughly US$3.09 billion US anti-money-laundering penalty and a C$5.5 million FCAC fine for inaccurate cost-of-borrowing disclosure, including on small-business loans. We disclose this in full rather than omitting it, and it is not our top pick while this remains part of its recent record.',
    },
    {
      q: 'How current is this data?',
      a: 'Every fee, rate and disclosure on this page was verified against official provider pricing pages on 11 July 2026. Several providers have fee-schedule changes landing close to this date (BMO effective March 2026, National Bank effective August 2026) — confirm current terms on the provider\'s site before opening an account.',
    },
  ],
  compliance: {
    notice:
      'Not financial advice. CDIC insures deposits at member banks up to $100,000 per eligible category — Float\'s protection is indirect via a Scotiabank trust account, not a direct CDIC-insured deposit. Confirm current terms before opening an account.',
    regulators: ['CDIC'],
  },

  sources: [
    { label: 'CDIC — What\'s covered', url: 'https://www.cdic.ca/depositors/whats-covered/' },
    { label: 'OSFI — banks it supervises', url: 'https://www.osfi-bsif.gc.ca/en/supervision/financial-institutions/banks' },
    { label: 'FCAC — TD administrative monetary penalty', url: 'https://www.canada.ca/en/financial-consumer-agency/news/2025/09/fcac-announces-an-administrative-monetary-penalty-paid-by-the-toronto-dominion-bank.html' },
  ],
  relatedLinks: [
    { label: 'Canada business banking hub', href: '/ca/business-banking' },
    { label: 'Best robo-advisors & investing apps (Canada)', href: '/ca/personal-finance/best/robo-advisors' },
    { label: 'How SmartFinPro reviews products', href: '/methodology' },
  ],
};
