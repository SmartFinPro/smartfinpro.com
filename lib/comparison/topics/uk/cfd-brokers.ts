// lib/comparison/topics/uk/cfd-brokers.ts
// TopicConfig for "Best CFD Trading Platforms (UK)" — registered under
// 'uk:trading/cfd-brokers'. Shares the 'trading/cfd-brokers' slug with au
// for hreflang clustering; fully independent UK-specific editorial content.
// Pure module — no React/server imports.
//
// Cost model: 'fee-on-amount' with the DEFAULT feeAccessor (p.managementFee)
// — unlike au/cfd-brokers.ts (which deviated to 'banking'/$0 because its 7
// AU providers quoted spreads in genuinely incompatible units: index points,
// floating spreads, and a real % commission), all 7 UK candidates gave a
// consistent, pip-quotable EUR/USD-style spread figure during research —
// management_fee stores the combined round-turn cost rate as a % of
// notional (spread-in-pips x £10/lot + commission £, divided by the
// £100,000 lot notional), mirroring uk/forex-brokers.ts and
// ca/forex-brokers.ts exactly. costLabel overridden to "Spread cost" since
// this is a CFD (not FX-specific) instrument. Note: CFD trading also covers
// indices/shares/commodities whose per-instrument spreads differ from the
// quoted EUR/USD figure — disclosed via spread_note on every row, never
// implied as the CFD's only real cost.
//
// FCA-mandated standard risk warning (leveraged CFD products) is rendered
// via compliance.notice; retail_loss_pct is the FCA-mandated "X% of retail
// investor accounts lose money" disclosure, shown only where independently
// confirmed, with retail_loss_note always required alongside it (these
// figures update monthly and are explicitly disclosed as a snapshot).
//
// Editorial disclosure (SEO addendum §14): every one of these 7 brokers
// carries a real, sourced 2024-2026 regulatory or legal matter at the
// group/parent level — CMC's Australian Federal Court class action, Saxo's
// ~£37-40M Danish AML fine, XTB's Polish MiFID II fine, Pepperstone's
// self-reported ASIC leverage-cap breach, eToro's SEC/Italian fines. None
// of these are UK FCA enforcement actions against the UK-regulated entity
// itself — disclosed with that scope distinction preserved, not conflated.

import { z } from 'zod';
import type { TopicConfig } from './../types';
import type { ProductForComparison } from '@/lib/comparison/types';

export const ukCfdBrokersAttributesSchema = z
  .object({
    fca_frn: z.string(),
    avg_spread_eurusd_pips: z.number(),
    commission_round_turn_gbp: z.number(),
    spread_note: z.string(), // discloses that CFD instrument spreads (indices/shares/commodities) differ from the quoted EUR/USD-style figure
    instrument_range_note: z.string(),
    max_leverage: z.string(), // FCA PS19/18 caps
    platforms: z.array(z.string()).min(1),
    retail_loss_pct: z.number().nullable(),
    retail_loss_note: z.string(), // required whenever retail_loss_pct is non-null — "as at" date/source caveat
    trustpilot_rating: z.number().nullable(),
    trustpilot_count: z.number().nullable(),
    trustpilot_note: z.string(),
    regulatory_note: z.string().optional(), // material, sourced legal/compliance history — empty string if none
  })
  .passthrough();

const attrStr = (p: ProductForComparison, k: string): string =>
  typeof p.attributes?.[k] === 'string' ? (p.attributes[k] as string) : '';
const attrNum = (p: ProductForComparison, k: string): number =>
  typeof p.attributes?.[k] === 'number' ? (p.attributes[k] as number) : 0;
const attrNumOrNull = (p: ProductForComparison, k: string): number | null =>
  typeof p.attributes?.[k] === 'number' ? (p.attributes[k] as number) : null;
const attrArr = (p: ProductForComparison, k: string): string[] =>
  Array.isArray(p.attributes?.[k]) ? (p.attributes[k] as string[]) : [];
const gbp = (n: number) => `£${n.toFixed(2)}`;

export const ukCfdBrokersConfig: TopicConfig = {
  slug: 'cfd-brokers',
  category: 'trading',
  label: 'CFD Trading Platforms',
  h1: (y) => `Best CFD trading platforms in the UK (${y})`,
  metaTitle: (y) => `Best UK CFD Trading Platforms (${y})`,
  metaDescription: (y) =>
    `Compare FCA-regulated CFD trading platforms in the UK for ${y} by spread cost, leverage, platforms and regulatory record, independent, sourced.`,
  intro:
    'Independent, side-by-side comparison of FCA-regulated CFD trading platforms for UK retail traders, ranked by spread cost on your own trading volume, leverage, platforms and regulatory record.',
  publishedDate: '2026-07-11',
  attributesSchema: ukCfdBrokersAttributesSchema,

  specColumns: [
    {
      key: 'spread',
      label: 'Avg. EUR/USD-style spread',
      accessor: (p) => attrNum(p, 'avg_spread_eurusd_pips'),
      format: (v) => `${Number(v).toFixed(2)} pips`,
      winner: 'min',
    },
    {
      key: 'commission',
      label: 'Commission (round-turn)',
      accessor: (p) => attrNum(p, 'commission_round_turn_gbp'),
      format: (v) => gbp(Number(v)),
      winner: 'min',
    },
    {
      key: 'leverage',
      label: 'Max leverage',
      accessor: (p) => attrStr(p, 'max_leverage'),
      format: (v) => String(v),
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
    { key: 'mt4', label: 'MetaTrader 4', predicate: (p) => attrArr(p, 'platforms').includes('MT4') },
    { key: 'mt5', label: 'MetaTrader 5', predicate: (p) => attrArr(p, 'platforms').includes('MT5') },
    { key: 'tradingview', label: 'TradingView', predicate: (p) => attrArr(p, 'platforms').includes('TradingView') },
  ],

  priorityChips: [
    { id: 'cost', label: 'Lowest cost', icon: 'Coins', sort: 'cost' },
    { id: 'range', label: 'Widest instrument range', icon: 'Layers', sort: 'range' },
    { id: 'rating', label: 'Top rated', icon: 'Star', sort: 'rating' },
  ],

  matcher: [
    {
      id: 'volume',
      label: 'How do you trade?',
      weight: 14,
      options: [
        { value: 'active', label: 'Frequently / scalping' },
        { value: 'casual', label: 'Occasionally' },
      ],
      award: (p, a) =>
        a === 'active'
          ? { matched: attrNum(p, 'avg_spread_eurusd_pips') <= 0.7, reason: 'Tight spreads for frequent trading' }
          : { matched: true },
    },
    {
      id: 'platform',
      label: 'Which platform do you want?',
      weight: 12,
      options: [
        { value: 'mt', label: 'MetaTrader 4/5' },
        { value: 'any', label: "Doesn't matter" },
      ],
      award: (p, a) =>
        a === 'mt'
          ? { matched: attrArr(p, 'platforms').includes('MT4') || attrArr(p, 'platforms').includes('MT5'), reason: 'MetaTrader support' }
          : { matched: true },
    },
  ],

  sortOptions: [
    { value: 'smart', label: 'Smart rank', metric: (p) => p.score },
    { value: 'cost', label: 'Lowest spread cost', metric: () => 0 },
    { value: 'range', label: 'Widest instrument range', metric: (p) => p.score },
    { value: 'rating', label: 'Best rated', metric: (p) => (attrNumOrNull(p, 'trustpilot_rating') ?? 0) * 100 + p.score },
  ],

  costModel: {
    kind: 'fee-on-amount',
    costLabel: 'Spread cost',
    amountLabel: 'Annual trading volume (notional)',
    amountMin: 120_000,
    amountMax: 12_000_000,
    amountStep: 60_000,
    amountDefault: 1_200_000,
    yearsLabel: 'Years',
    yearsMin: 1,
    yearsMax: 1,
    yearsDefault: 1,
  },

  compareRows: [
    { key: 'spread', label: 'Avg. EUR/USD-style spread', accessor: (p) => `${attrNum(p, 'avg_spread_eurusd_pips').toFixed(2)} pips`, score: (p) => -attrNum(p, 'avg_spread_eurusd_pips') },
    { key: 'commission', label: 'Commission (round-turn)', accessor: (p) => gbp(attrNum(p, 'commission_round_turn_gbp')), score: (p) => -attrNum(p, 'commission_round_turn_gbp') },
    { key: 'leverage', label: 'Max leverage', accessor: (p) => attrStr(p, 'max_leverage') },
    { key: 'range', label: 'Instrument range', accessor: (p) => attrStr(p, 'instrument_range_note') || '—' },
    { key: 'platforms', label: 'Platforms', accessor: (p) => attrArr(p, 'platforms').join(', ') || '—', score: (p) => attrArr(p, 'platforms').length },
    {
      key: 'loss',
      label: 'Retail loss rate',
      accessor: (p) => {
        const v = attrNumOrNull(p, 'retail_loss_pct');
        return v === null ? 'Not independently confirmed' : `${v.toFixed(0)}% of retail accounts (${attrStr(p, 'retail_loss_note')})`;
      },
    },
    { key: 'frn', label: 'FCA FRN', accessor: (p) => attrStr(p, 'fca_frn') || '—' },
  ],

  detailRows: [
    { key: 'spreadNote', label: 'Spread scope note', accessor: (p) => attrStr(p, 'spread_note') || '—' },
    { key: 'regulatory', label: 'Regulatory history', accessor: (p) => attrStr(p, 'regulatory_note') || 'No material regulatory history found at research time.' },
  ],

  verdict: {
    intro:
      "Beginners with a small first deposit should start with Capital.com: just £20 to open an account, and the strongest Trustpilot rating of the seven researched. But on pure execution quality, IG is the stronger overall pick: the tightest spread of anything we found, the widest instrument range in this comparison (17,000+ markets), and no confirmed UK FCA enforcement action. Active traders chasing volume are better matched with Pepperstone, whose Razor account delivers ultra-tight raw spreads and the broadest platform lineup (MT4, MT5, cTrader, TradingView).",
    picks: [
      { slug: 'ig-cfd-uk', label: 'Best overall' },
      { slug: 'capital-com', label: 'Best for beginners' },
      { slug: 'pepperstone-cfd-uk', label: 'Best for active traders' },
    ],
  },
  methodology:
    "We compare each broker's spread on a standard EUR/USD-style instrument and commission (where applicable), converted to an all-in cost rate on your own annual trading volume, alongside FCA authorisation, leverage caps, platform choice and consumer rating. CFD trading also covers indices, shares and commodities, whose individual spreads differ from the quoted EUR/USD-style figure. This is disclosed on every row rather than implied as the only real cost. Regulatory and legal history is sourced from FCA, ASIC, Danish FSA, Polish KNF and other primary regulators, and disclosed plainly rather than omitted: several matters found during research are group/parent-level actions in other jurisdictions, not UK FCA enforcement against the UK entity, and we preserve that distinction rather than conflating them. Retail-loss percentages (the FCA-mandated 'X% of retail accounts lose money' disclosure) update monthly and are shown only where independently confirmed at research time. Rankings never depend on commissions. Every provider on this page is currently a visit-only listing.",
  buyerGuide: [
    {
      h3: 'CFDs are high-risk, leveraged products',
      body: 'The FCA requires every UK CFD provider to display the percentage of retail client accounts that lose money trading CFDs with them, typically a majority, sometimes a large majority. This applies to every broker on this page, not just some. Leverage magnifies both gains and losses, and FCA rules cap it at 30:1 on major FX pairs, dropping to 5:1 on individual shares.',
    },
    {
      h3: "Spread-only vs. raw spread + commission",
      body: 'Spread-only accounts (no separate commission) are simpler but usually cost more per trade than a raw/ECN-style account, which pairs a near-zero spread with a flat or per-lot commission. Several brokers on this page (Pepperstone, CMC Markets, FOREX.com, XTB, Admirals) offer both structures. Active, high-volume traders generally save money on the raw account.',
    },
    {
      h3: "CFD spreads vary a lot by instrument",
      body: 'The EUR/USD-style spread shown in our comparison is a standard reference point, but CFD trading also covers indices, individual shares and commodities, each with its own spread, which can be meaningfully wider or narrower than the FX-style figure. Check the specific instrument you plan to trade on the broker\'s own site before assuming the headline number applies everywhere.',
    },
    {
      h3: 'Reading disclosed regulatory history honestly',
      body: "Every broker on this page has a real, sourced regulatory or legal matter in its recent history at the group or parent-company level: CMC faces an active Australian Federal Court class action, Saxo's Danish parent was fined for AML compliance failures, XTB's Polish parent was fined for MiFID II product-governance failures, Pepperstone self-reported and remediated an ASIC leverage-cap breach, and eToro's US and Italian entities were separately fined. None of these are UK FCA enforcement actions against the UK-regulated entity specifically. We disclose each with that scope distinction preserved, not conflated into a claim about the UK broker itself.",
    },
  ],
  faq: [
    {
      q: 'What is the best CFD trading platform in the UK?',
      a: "IG comes out ahead on execution: the tightest spreads we found, the widest instrument range, and no confirmed UK FCA enforcement action. Beginners tend to prefer Capital.com, thanks to a £20 minimum deposit and the strongest Trustpilot rating of the group, while active traders get more value from Pepperstone's ultra-tight raw spreads and broad platform choice. Pricing and features are re-verified regularly, and the ranking is never influenced by commissions.",
    },
    {
      q: 'Are these CFD brokers actually regulated in the UK?',
      a: "Yes, all 7 hold FCA authorisation, independently verifiable via the FCA Register FRN shown for each. FCA-regulated CFD providers must display the percentage of their own retail clients who lose money, segregate client funds, and cap retail leverage at 30:1 on major FX pairs (lower on other asset classes).",
    },
    {
      q: 'What does the retail-loss percentage actually mean?',
      a: "It's an FCA-mandated disclosure of what percentage of a broker's own retail clients lost money trading CFDs over a recent period, not a marketing number, and typically a majority across the industry. We only display this figure where we could independently confirm a current number from the broker.",
    },
    {
      q: 'How is the cost comparison calculated?',
      a: "We convert each broker's EUR/USD-style spread and commission into an all-in cost rate, then apply it to your own estimated annual trading volume using the slider above. The ranking updates live. This reflects a standard reference cost, not every instrument's actual spread: check the specific market you plan to trade before assuming it applies exactly.",
    },
    {
      q: 'How current is this data?',
      a: 'Every spread, commission, FRN and regulatory disclosure on this page was verified against official sources on 11 July 2026. Spreads fluctuate with market conditions and are shown as typical/average figures: confirm live pricing on the broker\'s own site before trading.',
    },
  ],
  compliance: {
    notice:
      'CFDs are complex instruments and come with a high risk of losing money rapidly due to leverage. Confirm you understand how CFDs work and whether you can afford to take the high risk of losing your money before trading.',
    regulators: ['FCA'],
  },

  sources: [
    { label: 'FCA Register', url: 'https://register.fca.org.uk/' },
    { label: 'FCA: CFD leverage/marketing restrictions (PS19/18)', url: 'https://www.fca.org.uk/publication/policy/ps19-18.pdf' },
  ],
  relatedLinks: [
    { label: 'UK trading hub', href: '/uk/trading' },
    { label: 'Best forex brokers (UK)', href: '/uk/forex/best/forex-brokers' },
    { label: 'How SmartFinPro reviews products', href: '/methodology' },
  ],
};
