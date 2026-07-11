// lib/comparison/topics/ca/robo-advisors.ts
// TopicConfig for "Best Robo-Advisors & Investing Apps (Canada)" —
// registered under 'ca:personal-finance/robo-advisors'. Shares the
// 'personal-finance/robo-advisors' slug with us/au for hreflang clustering;
// fully independent CA-specific editorial config. Pure module — no
// React/server imports.
//
// CA-specific regulatory nuance (SEO addendum §4): CIRO is the investment-
// dealer regulator; CIPF protects client assets to $1M/category if a MEMBER
// FIRM becomes insolvent. Several candidates (Justwealth, Nest Wealth, CI
// Direct Investing) are provincially-registered PORTFOLIO MANAGERS, not CIRO
// dealers themselves — their CIPF protection flows through a separate
// CIRO/CIPF-member custodian, not the portfolio manager directly. Disclosed
// per row via `regulator_type`/`custodian_note`, never conflated.
//
// Editorial disclosure (not silent exclusion): Moka's pricing is mid-
// transition (Mogo → Orion Digital rebrand, moka.ai → intelligentinvesting.ai)
// with a live discrepancy between legacy ($1-4/mo) and current-site ($20/mo)
// figures — disclosed, ranked last. CI Direct Investing's operational status
// (previously ambiguous) is confirmed live/operational under new Mubadala
// Capital ownership (CI Financial take-private, Aug 2025) — disclosed.

import { z } from 'zod';
import type { TopicConfig } from './../types';
import type { ProductForComparison } from '@/lib/comparison/types';

export const caRoboAdvisorsAttributesSchema = z
  .object({
    account_types: z.array(z.string()).min(1),
    regulator_type: z.enum(['ciro_dealer', 'portfolio_manager']),
    custodian_note: z.string(), // required when regulator_type='portfolio_manager' — names the CIRO/CIPF custodian
    cipf_protected: z.boolean(),
    auto_rebalancing: z.boolean(),
    tax_loss_harvesting: z.boolean(),
    tlh_note: z.string().optional(),
    trustpilot_rating: z.number().nullable(),
    trustpilot_count: z.number().nullable(),
    trustpilot_note: z.string(),
    regulatory_note: z.string().optional(), // material, sourced ownership/status/compliance history — empty if none
  })
  .passthrough();

const attr = (p: ProductForComparison, k: string): boolean => p.attributes?.[k] === true;
const attrStr = (p: ProductForComparison, k: string): string =>
  typeof p.attributes?.[k] === 'string' ? (p.attributes[k] as string) : '';
const attrNumOrNull = (p: ProductForComparison, k: string): number | null =>
  typeof p.attributes?.[k] === 'number' ? (p.attributes[k] as number) : null;
const attrArr = (p: ProductForComparison, k: string): string[] =>
  Array.isArray(p.attributes?.[k]) ? (p.attributes[k] as string[]) : [];
const yesNo = (b: boolean) => (b ? 'Yes' : 'No');
const cad = (n: number) => (n ? `C$${n.toLocaleString('en-CA')}` : 'C$0');
const pct = (n: number) => `${n.toFixed(2)}%`;
const REGULATOR_LABEL: Record<string, string> = { ciro_dealer: 'CIRO investment dealer', portfolio_manager: 'Portfolio manager (custodian is CIRO-regulated)' };

export const caRoboAdvisorsConfig: TopicConfig = {
  slug: 'robo-advisors',
  category: 'personal-finance',
  label: 'Robo-Advisors',
  h1: (y) => `Best robo-advisors & investing apps in Canada (${y})`,
  metaTitle: (y) => `Best Robo-Advisors Canada (${y})`,
  metaDescription: (y) =>
    `Compare Canadian robo-advisors of ${y} by management fee, account minimums, CIRO/CIPF protection and account-type support — independent, sourced.`,
  intro:
    'Independent, side-by-side comparison of Canadian robo-advisors — ranked by management fee, account-type support and regulatory structure, with a live multi-year cost projection on your own balance.',
  publishedDate: '2026-07-11',
  attributesSchema: caRoboAdvisorsAttributesSchema,

  specColumns: [
    {
      key: 'managementFee',
      label: 'Management fee',
      accessor: (p) => p.managementFee,
      format: (v) => pct(Number(v)),
      winner: 'min',
      sortKey: 'fee',
    },
    {
      key: 'accountMinimum',
      label: 'Minimum',
      accessor: (p) => p.accountMinimum,
      format: (v) => cad(Number(v)),
      winner: 'min',
      sortKey: 'min',
    },
    {
      key: 'accountTypes',
      label: 'Account types',
      accessor: (p) => attrArr(p, 'account_types').length,
      format: (v) => `${v}`,
      winner: 'max',
    },
    {
      key: 'tlh',
      label: 'Tax-loss harvesting',
      accessor: (p) => (attr(p, 'tax_loss_harvesting') ? 1 : 0),
      format: (v) => yesNo(!!Number(v)),
      winner: 'max',
    },
  ],

  filters: [
    { key: 'noMin', label: 'No minimum balance', predicate: (p) => p.accountMinimum === 0 },
    { key: 'fhsa', label: 'FHSA supported', predicate: (p) => attrArr(p, 'account_types').includes('FHSA') },
    { key: 'resp', label: 'RESP supported', predicate: (p) => attrArr(p, 'account_types').includes('RESP') },
    { key: 'ciroDealer', label: 'Direct CIRO dealer', predicate: (p) => attrStr(p, 'regulator_type') === 'ciro_dealer' },
  ],

  priorityChips: [
    { id: 'cost', label: 'Lowest fee', icon: 'Coins', sort: 'cost' },
    { id: 'accounts', label: 'Most account types', icon: 'Layers', sort: 'accounts' },
    { id: 'rating', label: 'Top rated', icon: 'Star', sort: 'rating' },
  ],

  matcher: [
    {
      id: 'minimum',
      label: 'How much do you want to start with?',
      weight: 14,
      options: [
        { value: 'zero', label: 'As little as possible' },
        { value: 'some', label: 'C$1,000+' },
        { value: 'any', label: "Doesn't matter" },
      ],
      award: (p, a) => {
        if (a === 'zero') return { matched: p.accountMinimum === 0, reason: 'No minimum balance' };
        if (a === 'some') return { matched: p.accountMinimum <= 1000, reason: 'Low minimum' };
        return { matched: true };
      },
    },
    {
      id: 'accountType',
      label: 'Which account do you need?',
      weight: 12,
      options: [
        { value: 'fhsa', label: 'FHSA' },
        { value: 'resp', label: 'RESP' },
        { value: 'any', label: "Doesn't matter" },
      ],
      award: (p, a) => {
        if (a === 'any') return { matched: true };
        return { matched: attrArr(p, 'account_types').includes(a.toUpperCase()), reason: `${a.toUpperCase()} supported` };
      },
    },
  ],

  sortOptions: [
    { value: 'smart', label: 'Smart rank', metric: (p) => p.score },
    { value: 'cost', label: 'Lowest projected cost', metric: () => 0 },
    { value: 'accounts', label: 'Most account types', metric: (p) => attrArr(p, 'account_types').length * 100 + p.score },
    { value: 'rating', label: 'Best rated', metric: (p) => (attrNumOrNull(p, 'trustpilot_rating') ?? 0) * 100 + p.score },
  ],

  costModel: {
    kind: 'compounding-fee',
    growthRate: 0.06,
    amountLabel: 'Amount invested',
    amountMin: 0,
    amountMax: 500_000,
    amountStep: 5000,
    amountDefault: 50_000,
    yearsLabel: 'Years',
    yearsMin: 1,
    yearsMax: 30,
    yearsDefault: 10,
  },

  compareRows: [
    { key: 'fee', label: 'Management fee', accessor: (p) => pct(p.managementFee), score: (p) => -p.managementFee },
    { key: 'min', label: 'Minimum to start', accessor: (p) => cad(p.accountMinimum), score: (p) => -p.accountMinimum },
    { key: 'accounts', label: 'Account types', accessor: (p) => attrArr(p, 'account_types').join(', ') || '—', score: (p) => attrArr(p, 'account_types').length },
    { key: 'regulator', label: 'Regulatory structure', accessor: (p) => REGULATOR_LABEL[attrStr(p, 'regulator_type')] ?? '—' },
    { key: 'rebalance', label: 'Auto-rebalancing', accessor: (p) => yesNo(attr(p, 'auto_rebalancing')), score: (p) => (attr(p, 'auto_rebalancing') ? 1 : 0) },
    { key: 'tlh', label: 'Tax-loss harvesting', accessor: (p) => (attr(p, 'tax_loss_harvesting') ? `Yes — ${attrStr(p, 'tlh_note') || 'see detail'}` : 'No'), score: (p) => (attr(p, 'tax_loss_harvesting') ? 1 : 0) },
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
    { key: 'custodian', label: 'CIPF custodian (if portfolio manager)', accessor: (p) => attrStr(p, 'custodian_note') || '—' },
    { key: 'regulatory', label: 'Ownership / regulatory notes', accessor: (p) => attrStr(p, 'regulatory_note') || 'No material issues found at research time.' },
  ],

  verdict: {
    intro:
      "Wealthsimple is our top pick — the broadest account-type support (including FHSA and RESP) with a $0 minimum and daily rebalancing. Questwealth Portfolios (Questrade) offers the lowest management fee in this comparison, and Justwealth has the widest registered-account menu of all, including RDSP, which none of the other 6 candidates support.",
    picks: [
      { slug: 'wealthsimple-invest', label: 'Best overall' },
      { slug: 'questwealth-portfolios', label: 'Best value / lowest fee' },
      { slug: 'justwealth', label: 'Best for RESP & families' },
    ],
  },
  methodology:
    "We compare each provider's management fee, account minimum, account-type support, auto-rebalancing and tax-loss harvesting from official pricing pages, and verify CIRO/CIPF protection status directly — noting explicitly where a provider is a provincially-registered portfolio manager (CIPF protection flows through a separate custodian) rather than a CIRO dealer itself. We disclose material ownership changes, status ambiguities and service-continuity concerns plainly rather than omitting them. The cost projection assumes 6% p.a. growth over your chosen time horizon. Rankings never depend on commissions — every provider on this page is currently a visit-only listing.",
  buyerGuide: [
    {
      h3: 'CIRO dealer vs. portfolio manager — the distinction that matters',
      body: 'Wealthsimple, Questwealth (Questrade) and RBC InvestEase are themselves, or use as direct custodian, CIRO-member investment dealers. Justwealth, Nest Wealth, CI Direct Investing and Moka are provincially-registered portfolio managers — your assets sit with a separate CIRO/CIPF-member custodian (often CI Investment Services, Fidelity Clearing Canada, or National Bank Independent Network). CIPF protection still applies in both cases, but through a different relationship — worth understanding, not a reason to avoid either structure.',
    },
    {
      h3: 'TFSA, RRSP, FHSA — mechanics, not advice',
      body: "TFSA contributions are after-tax with fully tax-free growth and withdrawal (2026 room: C$7,000). RRSP contributions are tax-deductible with tax-deferred growth, taxed on withdrawal (2026 limit: C$33,810 or 18% of prior-year earned income). FHSA combines both benefits but only for a qualifying first-home purchase (C$8,000/year, C$40,000 lifetime). Not every provider here supports every account type — check the account-types row for your specific need, and consult the CRA or a financial advisor for which account fits your situation.",
    },
    {
      h3: 'Fee structures: percentage vs. flat',
      body: "Most providers charge a percentage management fee (0.20%–0.60%) plus the underlying ETF MER. Nest Wealth uses a flat monthly fee instead, which can be cheaper at larger balances but relatively expensive on small ones — model your own balance with the calculator above rather than comparing headline percentages alone.",
    },
    {
      h3: 'Why Moka is disclosed, not just listed',
      body: 'Moka\'s parent company (Mogo) renamed itself Orion Digital Corp in December 2025, and the consumer platform is mid-transition from moka.ai to intelligentinvesting.ai. Current official pricing shows a $20/month membership fee, a significant change from Moka\'s historic $1-4/month round-up-app pricing found on older review sites — we disclose this discrepancy rather than publish a single confident number, and rank Moka last while its pricing remains unsettled.',
    },
  ],
  faq: [
    {
      q: 'What is the best robo-advisor in Canada?',
      a: "Wealthsimple is our top pick for its broadest account-type support (including FHSA and RESP), $0 minimum and daily rebalancing. Questwealth Portfolios offers the lowest management fee, and Justwealth has the widest registered-account menu of any candidate, including RDSP. We re-verify fees and features regularly, and the ranking never depends on commissions.",
    },
    {
      q: 'Is my money protected with a Canadian robo-advisor?',
      a: 'All 7 candidates ultimately rely on CIRO/CIPF protection (up to $1M per account category if a member firm becomes insolvent) — either directly, as a CIRO dealer themselves, or indirectly through a CIRO/CIPF-member custodian if the provider is a provincially-registered portfolio manager. CIPF does not protect against market losses, only against the firm holding your assets becoming insolvent.',
    },
    {
      q: 'How is the multi-year cost calculated?',
      a: "We apply each provider's management fee (as a % of your balance) across your chosen time horizon, assuming 6% p.a. portfolio growth and compounding fees. Move the amount and years sliders to see the dollar impact on your own numbers — the ranking updates live.",
    },
    {
      q: 'Is CI Direct Investing (formerly WealthBar) still operating?',
      a: 'Yes — confirmed operational and accepting new clients as of this page\'s last verification. CI Financial (its parent) completed a take-private acquisition by Mubadala Capital in August 2025, and CI Direct Investing continues to operate with actively-maintained client disclosures. We disclose the ownership change for transparency.',
    },
    {
      q: 'How current is this data?',
      a: 'Every fee, account type and regulatory status on this page was verified against official provider pages and CIRO/CIPF sources on 11 July 2026. Fee structures and ownership can change — confirm current terms on the provider\'s site before investing, especially for Moka given its active platform transition.',
    },
  ],
  compliance: {
    notice:
      'Not financial advice. Investment values can fall as well as rise. CIPF protects client assets up to $1M per category if a member firm becomes insolvent — it does not protect against market losses. Confirm current fees before investing.',
    regulators: ['CIRO', 'CIPF'],
  },

  sources: [
    { label: 'CIRO — Dealers We Regulate', url: 'https://www.ciro.ca/office-investor/dealers-we-regulate' },
    { label: 'CIPF — About CIPF Coverage', url: 'https://www.cipf.ca/cipf-coverage/about-cipf-coverage' },
    { label: 'CRA — TFSA contribution room', url: 'https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/tax-free-savings-account/contributing/calculate-room.html' },
  ],
  relatedLinks: [
    { label: 'Canada personal finance hub', href: '/ca/personal-finance' },
    { label: 'Best TFSA/RRSP investing platforms', href: '/ca/tax-efficient-investing/best/tfsa-rrsp-platforms' },
    { label: 'How SmartFinPro reviews products', href: '/methodology' },
  ],
};
