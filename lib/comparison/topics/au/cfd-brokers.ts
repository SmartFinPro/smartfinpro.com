// lib/comparison/topics/au/cfd-brokers.ts
// TopicConfig for "Best CFD Trading Platforms (Australia)" — registered
// under 'au:trading/cfd-brokers'. Shares the 'trading/cfd-brokers' slug with
// uk for hreflang clustering; fully independent AU-specific editorial
// content. Pure module — no React/server imports.
//
// Cost model deviation from the original rollout-plan sketch (fee-on-amount):
// CFD spreads across these 7 providers are quoted in genuinely incompatible
// units — index "points" (IG/Pepperstone/IC Markets: "from 1 point", no
// clean $-per-point contract-spec found), floating spreads (Plus500), and a
// real % commission (Interactive Brokers only: 0.005-0.01% index, 0.05%
// shares). Forcing these into one $-cost ranking would manufacture a false
// ordinal the SEO addendum's "no unbelegte cost claims" rule forbids — same
// reasoning ai-tools-finance.ts documents for its 4 incompatible pricing
// models. Uses `kind: 'banking'` with monthly_fee=0 seeded uniformly (the
// established $0-is-honest pattern); real cost differentiation lives in the
// spread/loss-rate specColumns and compareRows instead, never in the
// cost-slider figure.
//
// Regulatory notes (SEO addendum §4/§14 — disclose, don't silently exclude,
// mirroring how the US shortlist treated Freedom Debt Relief/Lexington Law):
// IC Markets has an ACTIVE consolidated Federal Court class action (Bain and
// Anor v International Capital Markets Pty Ltd, VID1088/2023) and eToro is
// subject to ASIC's first-ever Design & Distribution Obligations Federal
// Court enforcement action (filed Nov 2023, hearing continued into 2026, no
// judgment yet) — both disclosed plainly per-row and neither is ranked as a
// top pick while unresolved.

import { z } from 'zod';
import type { TopicConfig } from './../types';
import type { ProductForComparison } from '@/lib/comparison/types';

export const auCfdBrokersAttributesSchema = z
  .object({
    asic_afsl: z.string(),
    spread_note: z.string(), // qualitative — units genuinely differ across providers, see file header
    cfd_range_note: z.string(), // instrument count/coverage description
    min_deposit_aud: z.number().nullable(),
    max_leverage: z.string(), // e.g. "30:1 FX majors, 20:1 indices/gold, 5:1 shares, 2:1 crypto" — ASIC PIO caps
    platforms: z.array(z.string()).min(1),
    retail_loss_pct: z.number().nullable(),
    retail_loss_note: z.string(), // "as at" date / source caveat — required whenever retail_loss_pct is non-null
    trustpilot_rating: z.number().nullable(),
    trustpilot_count: z.number().nullable(),
    trustpilot_note: z.string(),
    regulatory_note: z.string().optional(), // material, sourced legal/compliance history — empty string if none
  })
  .passthrough();

const attrStr = (p: ProductForComparison, k: string): string =>
  typeof p.attributes?.[k] === 'string' ? (p.attributes[k] as string) : '';
const attrNumOrNull = (p: ProductForComparison, k: string): number | null =>
  typeof p.attributes?.[k] === 'number' ? (p.attributes[k] as number) : null;
const attrArr = (p: ProductForComparison, k: string): string[] =>
  Array.isArray(p.attributes?.[k]) ? (p.attributes[k] as string[]) : [];

export const auCfdBrokersConfig: TopicConfig = {
  slug: 'cfd-brokers',
  category: 'trading',
  label: 'CFD Trading Platforms',
  h1: (y) => `Best CFD trading platforms in Australia (${y})`,
  metaTitle: (y) => `Best CFD Brokers Australia (${y})`,
  metaDescription: (y) =>
    `Compare ASIC-regulated CFD trading platforms in Australia for ${y} by instrument range, leverage caps and regulatory record, independent, sourced.`,
  intro:
    'Independent, side-by-side comparison of ASIC-regulated CFD trading platforms for Australian retail traders, ranked by instrument range, leverage, platform choice and regulatory record. CFDs are complex, high-risk leveraged instruments; a majority of retail accounts lose money trading them.',
  publishedDate: '2026-07-10',
  attributesSchema: auCfdBrokersAttributesSchema,

  specColumns: [
    {
      key: 'range',
      label: 'Instrument range',
      accessor: (p) => attrStr(p, 'cfd_range_note'),
      format: (v) => String(v),
    },
    {
      key: 'leverage',
      label: 'Max leverage',
      accessor: (p) => attrStr(p, 'max_leverage'),
      format: (v) => String(v),
    },
    {
      key: 'loss',
      label: 'Retail loss rate',
      accessor: (p) => attrNumOrNull(p, 'retail_loss_pct') ?? 999,
      format: (v) => (Number(v) === 999 ? 'Not independently confirmed' : `${Number(v).toFixed(0)}%`),
      winner: 'min',
    },
    {
      key: 'platforms',
      label: 'Platforms',
      accessor: (p) => attrArr(p, 'platforms').length,
      format: (v) => `${v}`,
      winner: 'max',
    },
  ],

  filters: [
    { key: 'noMin', label: 'No minimum deposit', predicate: (p) => attrNumOrNull(p, 'min_deposit_aud') === 0 || attrNumOrNull(p, 'min_deposit_aud') === null },
    { key: 'mt4', label: 'MetaTrader 4/5', predicate: (p) => attrArr(p, 'platforms').some((x) => x.includes('MT4') || x.includes('MT5')) },
    { key: 'ctrader', label: 'cTrader', predicate: (p) => attrArr(p, 'platforms').includes('cTrader') },
  ],

  priorityChips: [
    { id: 'range', label: 'Widest range', icon: 'Layers', sort: 'range' },
    { id: 'loss', label: 'Lowest published loss rate', icon: 'Shield', sort: 'loss' },
    { id: 'rating', label: 'Top rated', icon: 'Star', sort: 'rating' },
  ],

  matcher: [
    {
      id: 'platform',
      label: 'Which platform ecosystem do you want?',
      weight: 12,
      options: [
        { value: 'mt', label: 'MetaTrader 4/5' },
        { value: 'proprietary', label: "Broker's own platform" },
        { value: 'any', label: "Doesn't matter" },
      ],
      award: (p, a) => {
        if (a === 'mt') return { matched: attrArr(p, 'platforms').some((x) => x.includes('MT4') || x.includes('MT5')), reason: 'MetaTrader support' };
        return { matched: true };
      },
    },
    {
      id: 'deposit',
      label: 'Want no minimum deposit?',
      weight: 8,
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: "Doesn't matter" },
      ],
      award: (p, a) =>
        a === 'yes'
          ? { matched: attrNumOrNull(p, 'min_deposit_aud') === 0 || attrNumOrNull(p, 'min_deposit_aud') === null, reason: 'No minimum deposit' }
          : { matched: true },
    },
  ],

  sortOptions: [
    { value: 'smart', label: 'Smart rank', metric: (p) => p.score },
    { value: 'range', label: 'Widest instrument range', metric: (p) => p.score },
    { value: 'loss', label: 'Lowest published loss rate', metric: (p) => -(attrNumOrNull(p, 'retail_loss_pct') ?? 100) + p.score },
    { value: 'rating', label: 'Best rated', metric: (p) => p.rating * 100 + p.score },
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
    yearsMax: 1,
    yearsDefault: 1,
  },

  compareRows: [
    { key: 'afsl', label: 'ASIC AFSL', accessor: (p) => attrStr(p, 'asic_afsl') || '—' },
    { key: 'range', label: 'Instrument range', accessor: (p) => attrStr(p, 'cfd_range_note') || '—' },
    { key: 'spread', label: 'Pricing model', accessor: (p) => attrStr(p, 'spread_note') || '—' },
    { key: 'leverage', label: 'Max leverage', accessor: (p) => attrStr(p, 'max_leverage') || '—' },
    { key: 'minDeposit', label: 'Min. deposit', accessor: (p) => { const v = attrNumOrNull(p, 'min_deposit_aud'); return v === null ? 'No formal minimum' : `A$${v}`; } },
    { key: 'platforms', label: 'Platforms', accessor: (p) => attrArr(p, 'platforms').join(', ') || '—', score: (p) => attrArr(p, 'platforms').length },
    {
      key: 'loss',
      label: 'Retail loss rate',
      accessor: (p) => {
        const v = attrNumOrNull(p, 'retail_loss_pct');
        return v === null ? 'Not independently confirmed' : `${v.toFixed(0)}% (${attrStr(p, 'retail_loss_note')})`;
      },
      score: (p) => -(attrNumOrNull(p, 'retail_loss_pct') ?? 100),
    },
  ],

  detailRows: [
    { key: 'rating', label: 'Consumer rating detail', accessor: (p) => attrStr(p, 'trustpilot_note') || '—' },
    { key: 'regulatory', label: 'Regulatory / legal history', accessor: (p) => attrStr(p, 'regulatory_note') || 'No material regulatory history found at research time.' },
  ],

  verdict: {
    intro:
      'Dual ASIC licences dating back to 1996, 12,000+ tradable instruments, no minimum deposit, and the cleanest regulatory record among the seven brokers reviewed here: that combination puts CMC Markets at the top. High-volume traders chasing the lowest cost per trade should look at Interactive Brokers instead, whose commission-based pricing is genuinely low for frequent, high-volume trading. Pepperstone, meanwhile, spans the widest range of platforms (MT4, MT5 and cTrader) and disclosed a 2023 compliance matter that it self-reported and has since fully remediated.',
    picks: [
      { slug: 'cmc-markets-cfd-au', label: 'Best overall' },
      { slug: 'interactive-brokers-cfd-au', label: 'Best for high-volume traders' },
      { slug: 'pepperstone-cfd-au', label: 'Best platform choice' },
    ],
  },
  methodology:
    "We compare each platform's instrument range, leverage caps, minimum deposit, platform choice and consumer rating from official sources and ASIC's own regulatory record, cross-checked against independent review platforms. CFD spreads across these 7 providers are quoted in genuinely incompatible units (index points, floating spreads, or a real percentage commission). Rather than manufacture a misleading single cost figure, we show each provider's real pricing model as text and let you compare like-for-like within your own trading style. Regulatory and legal history is sourced from ASIC media releases and Federal Court filings and disclosed plainly, including active/unresolved matters: a disclosed, resolved compliance issue is described differently from an active, ongoing one. Rankings never depend on commissions; every provider on this page is currently a visit-only listing.",
  buyerGuide: [
    {
      h3: 'ASIC leverage caps on CFDs',
      body: 'ASIC\'s product intervention order (in force since March 2021, extended through at least 2027) caps retail CFD leverage at 30:1 on major FX pairs, 20:1 on minor FX pairs, gold and major stock indices, 10:1 on other commodities and minor indices, 5:1 on shares, and 2:1 on crypto-assets. This is down from up to 500:1 before the order. All 7 providers here operate under these caps for AU retail clients.',
    },
    {
      h3: 'What the retail-loss disclosure means',
      body: "ASIC-licensed CFD issuers must disclose what percentage of their own retail clients lost money over a recent period. ASIC's own January 2026 sector review found 68% of retail CFD investors lost money in FY2024 industry-wide, totaling over $458 million including $73 million in fees. That is a useful benchmark against any single provider's published figure. We show a provider's own number only where independently confirmed; otherwise we say so rather than guess.",
    },
    {
      h3: 'Reading disclosed legal and regulatory history honestly',
      body: "Two providers on this page carry active, unresolved legal matters: IC Markets faces a consolidated Federal Court class action over past CFD sales practices, and eToro is the subject of ASIC's first Design and Distribution Obligations Federal Court enforcement action, with no judgment in either case as of publication. We disclose both factually in the detail view and do not rank either as a top pick while unresolved. Separately, Pepperstone's 2023 leverage-cap breach was self-reported and fully remediated under ASIC oversight, a materially different (resolved) situation we describe accordingly.",
    },
    {
      h3: 'Spread-based vs. commission-based pricing',
      body: "Most providers here price CFDs into the spread (the buy/sell price gap) with no separate commission. Interactive Brokers instead charges a low, transparent percentage commission with tighter raw pricing, usually cheaper for high-volume traders, but its Trader Workstation platform has a steeper learning curve than the proprietary apps most other providers offer.",
    },
  ],
  faq: [
    {
      q: 'What is the best CFD platform in Australia in 2026?',
      a: 'CMC Markets earns the top spot: a clean regulatory record, ASIC licences held since 1996, and the widest instrument range of the group with no minimum deposit required. If you trade often and care most about cost, Interactive Brokers is the better fit thanks to genuinely low commission-based pricing. Pepperstone offers the broadest platform choice among the seven. Pricing, leverage limits and regulatory status are re-verified regularly, and commissions play no role in how these rankings are ordered.',
    },
    {
      q: 'What do the ASIC leverage caps actually limit?',
      a: 'ASIC caps retail CFD leverage at 30:1 on major FX pairs, 20:1 on minor pairs/gold/major indices, 10:1 on other commodities, 5:1 on shares and 2:1 on crypto. All 7 providers on this page operate under these caps for Australian retail clients, down from up to 500:1 before the 2021 order.',
    },
    {
      q: 'Are IC Markets and eToro safe to use given their legal matters?',
      a: "Both remain ASIC-licensed and operating. IC Markets faces an active consolidated Federal Court class action over past CFD sales conduct, and eToro is subject to ASIC's first Design and Distribution Obligations enforcement action. Neither matter has reached a final judgment as of publication. We disclose both plainly and don't feature either as a top pick while the matters remain unresolved; you should weigh this alongside your own risk tolerance.",
    },
    {
      q: 'Why isn\'t there a single cost comparison figure?',
      a: 'CFD pricing across these 7 providers uses genuinely incompatible units: index points, floating spreads, or a real percentage commission. A single dollar figure would misrepresent the real cost, so we show each provider\'s actual pricing model as text instead of forcing an inaccurate ranking.',
    },
    {
      q: 'How current is this data?',
      a: 'Every licence number, leverage cap and regulatory disclosure on this page was verified against ASIC and official provider sources on 10 July 2026. Spreads and minimum deposits can change, so confirm current terms on the provider\'s own site before trading.',
    },
  ],
  compliance: {
    notice:
      'Not financial advice. CFDs are complex, leveraged instruments and a majority of retail investor accounts lose money trading them. Two providers on this page carry active, unresolved legal or regulatory matters: see individual profiles for details.',
    regulators: ['ASIC'],
  },

  sources: [
    { label: 'ASIC: Professional Registers Search (AFSL lookup)', url: 'https://www.asic.gov.au/online-services/search-asic-registers/professional-registers-search/' },
    { label: 'ASIC Moneysmart: CFDs investment warning', url: 'https://moneysmart.gov.au/investment-warnings/contracts-for-difference-cfds' },
    { label: 'ASIC media release 26-004MR: CFD sector review, Jan 2026', url: 'https://www.asic.gov.au/about-asic/news-centre/find-a-media-release/2026-releases/26-004mr-asic-secures-nearly-40-million-in-refunds-to-investors-and-drives-change-after-cfd-sector-falls-short/' },
  ],
  relatedLinks: [
    { label: 'Australia trading hub', href: '/au/trading' },
    { label: 'Best forex brokers (Australia)', href: '/au/forex/best/forex-brokers' },
    { label: 'How SmartFinPro reviews products', href: '/methodology' },
  ],
};
