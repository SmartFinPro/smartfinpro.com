// lib/comparison/topics/au/robo-advisors.ts
// TopicConfig for "Best Robo-Advisors & Micro-Investing Apps (Australia)" —
// registered under 'au:personal-finance/robo-advisors'. Shares the
// 'personal-finance/robo-advisors' slug with US/CA for hreflang clustering,
// but is a fully independent, AU-specific editorial config (providers,
// currency, regulators, ownership model). Pure module — no React/server imports.
//
// The 7 candidates span two structurally different products: true robo-
// advisors with a % management fee (Stockspot, InvestSMART) and flat-fee
// micro-investing apps (Raiz, Spaceship, CommSec Pocket, Sharesies, Pearler
// Micro). `managementFee` holds an EFFECTIVE % computed at each product's
// natural reference balance so the cost slider stays honest — the real
// mechanics (flat $/mo, tiered %, brokerage-per-trade) are documented in
// `fee_structure_note` per row and surfaced verbatim in detailRows/FAQ.
//
// AU-specific compliance axis: CHESS-sponsored (own HIN, direct ownership) vs.
// custodial/pooled-fund (beneficial ownership via a nominee/trust) — the
// single most-asked trust question in this category (see SEO addendum §4 AU
// rule + Morningstar AU explainer in `sources`). All 7 operate under an ASIC
// AFSL, several via an Authorised Representative chain rather than their own
// licence (documented per row in `afsl_or_licence`).

import { z } from 'zod';
import type { TopicConfig } from './../types';
import type { ProductForComparison } from '@/lib/comparison/types';

export const auRoboAdvisorsAttributesSchema = z
  .object({
    fee_structure_note: z.string(), // full real pricing mechanics — never just the effective %
    ownership_model: z.enum(['chess', 'custodial']),
    ethical_option: z.boolean(),
    super_option: z.boolean(),
    round_ups: z.boolean(),
    auto_invest: z.boolean().nullable(), // null = not explicitly confirmed by the provider at research time
    afsl_or_licence: z.string(),
    portfolio_count: z.number().nullable(),
    app_rating: z.number().nullable(),
    app_rating_note: z.string(), // source + count, since ratings come from different stores/count bases
  })
  .passthrough();

const attr = (p: ProductForComparison, k: string): boolean => p.attributes?.[k] === true;
const attrStr = (p: ProductForComparison, k: string): string =>
  typeof p.attributes?.[k] === 'string' ? (p.attributes[k] as string) : '';
const attrNum = (p: ProductForComparison, k: string): number | null =>
  typeof p.attributes?.[k] === 'number' ? (p.attributes[k] as number) : null;
const yesNo = (b: boolean) => (b ? 'Yes' : 'No');
const aud = (n: number) => (n ? `A$${Math.round(n).toLocaleString('en-AU')}` : 'A$0');
const pct = (n: number) => (n ? `${n.toFixed(2)}%` : '0%');
const OWNERSHIP_LABEL: Record<string, string> = { chess: 'CHESS-sponsored (own HIN)', custodial: 'Custodial (pooled/nominee)' };

export const auRoboAdvisorsConfig: TopicConfig = {
  slug: 'robo-advisors',
  category: 'personal-finance',
  label: 'Robo-Advisors & Micro-Investing',
  h1: (y) => `Best robo-advisors & micro-investing apps in Australia (${y})`,
  metaTitle: (y) => `Best Robo-Advisors Australia (${y})`,
  metaDescription: (y) =>
    `Compare Australian robo-advisors and micro-investing apps of ${y} by fees, minimums, CHESS vs custodial ownership and features, independent, expert-reviewed.`,
  intro:
    'Independent, side-by-side comparison of Australian robo-advisors and micro-investing apps, ranked by effective cost, ownership model and features, with a live multi-year cost projection.',
  publishedDate: '2026-07-10',
  attributesSchema: auRoboAdvisorsAttributesSchema,

  specColumns: [
    {
      key: 'managementFee',
      label: 'Effective fee (p.a.)',
      accessor: (p) => p.managementFee,
      format: (v) => pct(Number(v)),
      winner: 'min',
      sortKey: 'fee',
    },
    {
      key: 'accountMinimum',
      label: 'Minimum',
      accessor: (p) => p.accountMinimum,
      format: (v) => aud(Number(v)),
      winner: 'min',
      sortKey: 'min',
    },
    {
      key: 'ownership',
      label: 'Ownership',
      accessor: (p) => attrStr(p, 'ownership_model'),
      format: (v) => OWNERSHIP_LABEL[String(v)] ?? String(v),
      // Intentionally no winner: CHESS vs custodial is a trade-off, not a ranking axis.
    },
    {
      key: 'super',
      label: 'Super option',
      accessor: (p) => (attr(p, 'super_option') ? 1 : 0),
      format: (v) => yesNo(!!Number(v)),
      winner: 'max',
    },
  ],

  filters: [
    { key: 'chess', label: 'CHESS-sponsored (own HIN)', predicate: (p) => attrStr(p, 'ownership_model') === 'chess' },
    { key: 'noMinimum', label: 'No minimum balance', predicate: (p) => p.accountMinimum === 0 },
    { key: 'roundUps', label: 'Round-ups', predicate: (p) => attr(p, 'round_ups') },
    { key: 'ethical', label: 'Ethical / SRI option', predicate: (p) => attr(p, 'ethical_option') },
    { key: 'super', label: 'Super product available', predicate: (p) => attr(p, 'super_option') },
  ],

  priorityChips: [
    { id: 'cost', label: 'Lowest cost', icon: 'Coins', sort: 'cost' },
    { id: 'starter', label: 'Best for beginners', icon: 'Sparkles', sort: 'starter' },
    { id: 'rating', label: 'Top rated', icon: 'Star', sort: 'rating' },
    { id: 'chess', label: 'Own HIN (CHESS)', icon: 'Shield', sort: 'chess' },
  ],

  matcher: [
    {
      id: 'ownership',
      label: 'Do you want shares held in your own name (CHESS/HIN)?',
      weight: 16,
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: "Doesn't matter" },
      ],
      award: (p, a) => (a === 'yes' ? { matched: attrStr(p, 'ownership_model') === 'chess', reason: 'CHESS-sponsored, own HIN' } : { matched: true }),
    },
    {
      id: 'starting',
      label: 'How much do you want to start with?',
      weight: 14,
      options: [
        { value: 'micro', label: 'Under $100' },
        { value: 'mid', label: '$100–$5,000' },
        { value: 'large', label: '$5,000+' },
      ],
      award: (p, a) => {
        const min = p.accountMinimum;
        const matched = a === 'micro' ? min <= 100 : a === 'mid' ? min <= 5000 : true;
        return { matched, reason: 'Fits your starting amount' };
      },
    },
    {
      id: 'super',
      label: 'Interested in a linked super product too?',
      weight: 8,
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: "Doesn't matter" },
      ],
      award: (p, a) => (a === 'yes' ? { matched: attr(p, 'super_option'), reason: 'Offers a linked super product' } : { matched: true }),
    },
  ],

  sortOptions: [
    { value: 'smart', label: 'Smart rank', metric: (p) => p.score },
    { value: 'cost', label: 'Lowest projected cost', metric: () => 0 },
    { value: 'starter', label: 'Best for beginners', metric: (p) => (p.accountMinimum <= 100 ? 1000 : 0) + p.score },
    { value: 'rating', label: 'Best rated', metric: (p) => p.rating * 100 + p.score },
    { value: 'chess', label: 'Own HIN first', metric: (p) => (attrStr(p, 'ownership_model') === 'chess' ? 1000 : 0) + p.score },
  ],

  costModel: {
    kind: 'compounding-fee',
    growthRate: 0.07,
    amountLabel: 'Amount invested',
    amountMin: 0,
    amountMax: 200_000,
    amountStep: 1000,
    amountDefault: 10_000,
    yearsLabel: 'Years',
    yearsMin: 1,
    yearsMax: 30,
    yearsDefault: 10,
  },

  compareRows: [
    { key: 'fee', label: 'Effective fee (p.a.)', accessor: (p) => pct(p.managementFee), score: (p) => -p.managementFee },
    { key: 'min', label: 'Minimum to start', accessor: (p) => aud(p.accountMinimum), score: (p) => -p.accountMinimum },
    { key: 'ownership', label: 'Ownership model', accessor: (p) => OWNERSHIP_LABEL[attrStr(p, 'ownership_model')] ?? '—', score: (p) => (attrStr(p, 'ownership_model') === 'chess' ? 1 : 0) },
    { key: 'roundUps', label: 'Round-ups', accessor: (p) => yesNo(attr(p, 'round_ups')), score: (p) => (attr(p, 'round_ups') ? 1 : 0) },
    { key: 'ethical', label: 'Ethical / SRI option', accessor: (p) => yesNo(attr(p, 'ethical_option')), score: (p) => (attr(p, 'ethical_option') ? 1 : 0) },
    { key: 'super', label: 'Linked super product', accessor: (p) => yesNo(attr(p, 'super_option')), score: (p) => (attr(p, 'super_option') ? 1 : 0) },
    {
      key: 'rating',
      label: 'App rating',
      accessor: (p) => {
        const r = attrNum(p, 'app_rating');
        return r === null ? 'Not verified' : `${r}/5 (${attrStr(p, 'app_rating_note')})`;
      },
      score: (p) => attrNum(p, 'app_rating') ?? 0,
    },
  ],

  detailRows: [
    { key: 'feeNote', label: 'How fees actually work', accessor: (p) => attrStr(p, 'fee_structure_note') || '—' },
    { key: 'portfolios', label: 'Portfolio options', accessor: (p) => { const n = attrNum(p, 'portfolio_count'); return n === null ? '—' : String(n); } },
    { key: 'licence', label: 'Licence', accessor: (p) => attrStr(p, 'afsl_or_licence') || '—' },
    { key: 'autoInvest', label: 'Auto-invest / recurring deposits', accessor: (p) => yesNo(attr(p, 'auto_invest')) },
  ],

  verdict: {
    intro:
      'Most investors are best served by Stockspot: it is the largest and longest-running robo-advisor in Australia, holds your ETFs individually under CHESS sponsorship (a genuine rarity in this category), and charges the lowest full-portfolio entry fee of the seven. If you would rather start with spare change than a lump sum, Raiz remains the best pure round-up app. And for CHESS-sponsored ownership backed by a big-four bank at a very low starting amount, CommSec Pocket is hard to beat.',
    picks: [
      { slug: 'stockspot', label: 'Best overall robo-advisor' },
      { slug: 'raiz-invest', label: 'Best for spare-change investing' },
      { slug: 'commsec-pocket', label: 'Best CHESS-sponsored starter' },
    ],
  },
  methodology:
    "We compare each provider's real fee structure, account minimum, ownership model (CHESS-sponsored vs. custodial/pooled) and features from official pricing and disclosure pages, re-verified quarterly. Because this category mixes flat-fee micro-investing apps with percentage-fee robo-advisors, the \"effective fee\" shown is each provider's own headline cost converted to an annualised percentage at a representative balance: the full real-world mechanics (flat $/month, tiered %, per-trade brokerage) are always shown in the fee detail below the effective figure, never hidden behind it. The multi-year cost projection assumes a 7% p.a. growth rate, a standard long-term diversified-portfolio assumption. Rankings never depend on commissions; every provider on this page is currently a visit-only listing.",
  buyerGuide: [
    {
      h3: 'CHESS-sponsored vs. custodial ownership',
      body: "Only Stockspot, CommSec Pocket and InvestSMART hold your ETFs on the CHESS subregister under your own Holder Identification Number (HIN): you directly own the securities. Raiz, Spaceship, Sharesies and Pearler Micro use a pooled managed-fund or custodial/nominee structure. You're the beneficial owner via a trustee, which is a normal and legal structure but a genuinely different risk and portability profile, especially if the provider is ever wound up.",
    },
    {
      h3: 'Micro-investing apps vs. true robo-advisors',
      body: 'Raiz, Spaceship, CommSec Pocket, Sharesies and Pearler Micro are built around small, automated or round-up investing with flat monthly fees, cheap at larger balances, proportionally expensive on very small ones. Stockspot and InvestSMART are closer to a traditional robo-advisor: a percentage management fee, a real minimum investment, and automatic rebalancing across a full diversified portfolio.',
    },
    {
      h3: 'Flat fees get expensive on small balances',
      body: 'A$2–6.50/month sounds trivial, but on a $2,000 balance that is 1.2%–3.9% per year, often more than a percentage-fee robo-advisor would charge on the same amount. Use the calculator above with your real starting balance, not the marketing headline.',
    },
    {
      h3: 'Linked superannuation products',
      body: 'Raiz, Spaceship, Stockspot and Pearler all offer a separate, linked super product alongside their investing app. These are different products with their own fees and PDS: comparing them properly belongs on our dedicated super funds page, not folded into this one.',
    },
    {
      h3: 'These are General Advice, not personal financial advice',
      body: 'All 7 providers operate under an ASIC Australian Financial Services Licence (several via an Authorised Representative arrangement rather than their own AFSL, shown per provider). Robo-advice and portfolio suggestions are General or Scaled Advice, not a personal recommendation, and investment values can fall as well as rise.',
    },
  ],
  faq: [
    {
      q: 'What is the best robo-advisor in Australia in 2026?',
      a: "For most people, Stockspot is the right starting point: Australia's largest and longest-running robo-advisor, with individually CHESS-sponsored holdings and the lowest full-portfolio entry fee (A$1/month up to $20,000). If spare-change investing suits your style better, Raiz is the strongest pure starter app for that. Want CHESS-sponsored ownership from a big-four bank without a large starting amount? CommSec Pocket is the strongest option. Fees and features are re-verified quarterly, and commissions never factor into the ranking.",
    },
    {
      q: 'Is my money safe if a robo-advisor or micro-investing app fails?',
      a: "It depends on the ownership model. CHESS-sponsored providers (Stockspot, CommSec Pocket, InvestSMART) hold your ETFs directly in your name: they remain yours regardless of what happens to the provider. Custodial/pooled providers (Raiz, Spaceship, Sharesies, Pearler Micro) hold assets via a trustee or nominee, separated from the provider's own funds, but the wind-down process runs through that custodian rather than being instantly and directly yours. Neither structure is covered by the government's Financial Claims Scheme, which only applies to bank deposits. These are market investments, not deposits.",
    },
    {
      q: 'How is the multi-year cost calculated?',
      a: "We convert each provider's real pricing (flat monthly fee, percentage management fee, or a mix) into an effective annual percentage at your chosen balance, then project it forward assuming 7% p.a. portfolio growth and compounding fees. Move the amount and years sliders to see the dollar impact on your own numbers: the ranking updates live.",
    },
    {
      q: 'Do I need a minimum amount to start?',
      a: "No, several apps have no minimum at all (Spaceship, Sharesies, CommSec Pocket accepts trades from A$50, Raiz and Pearler Micro from A$5). Stockspot requires A$1,000 and InvestSMART requires A$10,000, reflecting their fuller, more traditional robo-advisor model.",
    },
    {
      q: 'How current is this data?',
      a: 'Every fee, minimum and feature on this page was verified against the provider\'s official pricing or disclosure page on 10 July 2026 and is re-checked quarterly. Fee structures and promotions can change, so confirm the current terms on the provider\'s site (and its Product Disclosure Statement) before investing.',
    },
  ],
  compliance: {
    notice:
      'General advice only, not personal financial advice. Investment values can fall as well as rise and are not covered by the Financial Claims Scheme. Confirm current fees in each provider\'s PDS before investing.',
    regulators: ['ASIC'],
  },

  sources: [
    { label: 'ASIC Moneysmart: robo-advice', url: 'https://moneysmart.gov.au/financial-advice/robo-advice' },
    { label: 'ASIC: search a financial services licence', url: 'https://connectonline.asic.gov.au/' },
    { label: 'Morningstar AU: CHESS vs custodian ownership', url: 'https://www.morningstar.com.au/stocks/chess-or-custodian-making-the-right-move-with-your-broker' },
  ],
  relatedLinks: [
    { label: 'Australia personal finance hub', href: '/au/personal-finance' },
    { label: 'Best superannuation funds', href: '/au/superannuation/best/super-funds' },
    { label: 'How SmartFinPro reviews products', href: '/methodology' },
  ],
};
