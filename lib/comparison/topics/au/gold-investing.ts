// lib/comparison/topics/au/gold-investing.ts
// TopicConfig for "Best Gold Investing Platforms (Australia)" — registered
// under 'au:gold-investing/platforms'. Shares the 'gold-investing/platforms'
// slug with us/ca for hreflang clustering; fully independent AU-specific
// editorial content. Pure module — no React/server imports.
//
// Cost model: 'banking' with monthly_fee=0 seeded for all 7 (banking@0
// pattern, mirrors gold-investing.ts (US) — no honest monthly "cost" figure
// exists for a bullion dealer; the real comparison signal lives in
// specColumns (premium over spot, storage fee, accreditation)).
//
// AU-specific compliance axis (SEO addendum §4): direct bullion ownership is
// explicitly NOT an ASIC-regulated financial product (per ASIC Moneysmart) —
// no AFSL is required to sell it, and AFCA generally does not apply. The only
// overlapping regulator is AUSTRAC (AML/CTF), not a consumer-protection
// regime. `accreditation` distinguishes government mint / LBMA refiner /
// unaccredited retail dealer — never claim securities-style regulation that
// doesn't exist for this category.
//
// Editorial disclosure (not silent exclusion — matches how the US shortlist
// treated Freedom Debt Relief/Lexington Law): Gold Stackers carries a
// specific, dated (Feb 2026) non-delivery/refund-refusal complaint — kept in
// the ranked field per the approved candidate shortlist, but ranked last with
// prominent, factual disclosure rather than silently dropped or hidden.

import { z } from 'zod';
import type { TopicConfig } from './../types';
import type { ProductForComparison } from '@/lib/comparison/types';

export const auGoldInvestingAttributesSchema = z
  .object({
    premium_over_spot_pct: z.number().nullable(), // null = not independently confirmed at research time
    premium_note: z.string(),
    storage_fee_pct: z.number().nullable(), // null where the provider uses a flat-fee (not %) model — see storage_note
    storage_note: z.string(),
    buyback_available: z.boolean(),
    accreditation: z.enum(['government_mint', 'lbma_refiner', 'authorised_distributor', 'retail_dealer']),
    accreditation_note: z.string(),
    years_in_business: z.number().nullable(),
    trustpilot_rating: z.number().nullable(),
    trustpilot_count: z.number().nullable(),
    trustpilot_note: z.string(),
    regulatory_note: z.string().optional(), // material, sourced compliance history — empty if none
  })
  .passthrough();

const attrStr = (p: ProductForComparison, k: string): string =>
  typeof p.attributes?.[k] === 'string' ? (p.attributes[k] as string) : '';
const attrNumOrNull = (p: ProductForComparison, k: string): number | null =>
  typeof p.attributes?.[k] === 'number' ? (p.attributes[k] as number) : null;
const attrBool = (p: ProductForComparison, k: string): boolean => p.attributes?.[k] === true;
const yesNo = (b: boolean) => (b ? 'Yes' : 'No');
const pctOrDash = (n: number | null) => (n === null ? 'Not confirmed' : `${n.toFixed(2)}%`);
const ACCRED_LABEL: Record<string, string> = {
  government_mint: 'Government mint',
  lbma_refiner: 'LBMA-accredited refiner',
  authorised_distributor: 'Authorised mint distributor',
  retail_dealer: 'Retail bullion dealer',
};

export const auGoldInvestingConfig: TopicConfig = {
  slug: 'platforms',
  category: 'gold-investing',
  label: 'Gold Investing Platforms',
  h1: (y) => `Best gold investing platforms in Australia (${y})`,
  metaTitle: (y) => `Best Gold Dealers Australia (${y})`,
  metaDescription: (y) =>
    `Compare Australian gold bullion dealers of ${y} by premium over spot, storage fees and accreditation — independent, expert-reviewed, sourced.`,
  intro:
    'Independent, side-by-side comparison of Australian physical gold bullion dealers — ranked by premium over spot, storage fees and accreditation, with regulatory context most comparison sites skip.',
  publishedDate: '2026-07-10',
  attributesSchema: auGoldInvestingAttributesSchema,

  specColumns: [
    {
      key: 'premium',
      label: 'Premium over spot',
      accessor: (p) => attrNumOrNull(p, 'premium_over_spot_pct') ?? 999,
      format: (v) => (Number(v) === 999 ? 'Not confirmed' : `${Number(v).toFixed(1)}%`),
      winner: 'min',
    },
    {
      key: 'storage',
      label: 'Storage fee',
      accessor: (p) => attrNumOrNull(p, 'storage_fee_pct') ?? 999,
      format: (v) => (Number(v) === 999 ? 'See detail' : `${Number(v).toFixed(2)}% p.a.`),
      winner: 'min',
    },
    {
      key: 'accreditation',
      label: 'Accreditation',
      accessor: (p) => attrStr(p, 'accreditation'),
      format: (v) => ACCRED_LABEL[String(v)] ?? String(v),
    },
    {
      key: 'buyback',
      label: 'Buyback',
      accessor: (p) => (attrBool(p, 'buyback_available') ? 1 : 0),
      format: (v) => yesNo(!!Number(v)),
      winner: 'max',
    },
  ],

  filters: [
    { key: 'govMint', label: 'Government mint', predicate: (p) => attrStr(p, 'accreditation') === 'government_mint' },
    { key: 'lbma', label: 'LBMA-accredited refiner', predicate: (p) => attrStr(p, 'accreditation') === 'lbma_refiner' },
    { key: 'buyback', label: 'Offers buyback', predicate: (p) => attrBool(p, 'buyback_available') },
  ],

  priorityChips: [
    { id: 'trust', label: 'Highest accreditation', icon: 'Shield', sort: 'trust' },
    { id: 'rating', label: 'Top rated', icon: 'Star', sort: 'rating' },
    { id: 'history', label: 'Longest track record', icon: 'Clock', sort: 'history' },
  ],

  matcher: [
    {
      id: 'trust',
      label: 'How important is government/LBMA backing to you?',
      weight: 16,
      options: [
        { value: 'high', label: 'Very important' },
        { value: 'low', label: "Doesn't matter" },
      ],
      award: (p, a) =>
        a === 'high'
          ? { matched: attrStr(p, 'accreditation') === 'government_mint' || attrStr(p, 'accreditation') === 'lbma_refiner', reason: 'Government mint or LBMA-accredited refiner' }
          : { matched: true },
    },
    {
      id: 'buyback',
      label: 'Want a published buyback option?',
      weight: 10,
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: "Doesn't matter" },
      ],
      award: (p, a) => (a === 'yes' ? { matched: attrBool(p, 'buyback_available'), reason: 'Offers buyback' } : { matched: true }),
    },
  ],

  sortOptions: [
    { value: 'smart', label: 'Smart rank', metric: (p) => p.score },
    { value: 'trust', label: 'Highest accreditation first', metric: (p) => (attrStr(p, 'accreditation') === 'government_mint' ? 2000 : attrStr(p, 'accreditation') === 'lbma_refiner' ? 1000 : 0) + p.score },
    { value: 'rating', label: 'Best rated', metric: (p) => (attrNumOrNull(p, 'trustpilot_rating') ?? 0) * 100 + p.score },
    { value: 'history', label: 'Longest track record', metric: (p) => (attrNumOrNull(p, 'years_in_business') ?? 0) + p.score },
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
    { key: 'premium', label: 'Premium over spot', accessor: (p) => pctOrDash(attrNumOrNull(p, 'premium_over_spot_pct')) },
    { key: 'storage', label: 'Storage', accessor: (p) => attrStr(p, 'storage_note') || '—' },
    { key: 'buyback', label: 'Buyback', accessor: (p) => yesNo(attrBool(p, 'buyback_available')), score: (p) => (attrBool(p, 'buyback_available') ? 1 : 0) },
    { key: 'accreditation', label: 'Accreditation', accessor: (p) => ACCRED_LABEL[attrStr(p, 'accreditation')] ?? '—', score: (p) => (attrStr(p, 'accreditation') === 'government_mint' ? 2 : attrStr(p, 'accreditation') === 'lbma_refiner' ? 1 : 0) },
    { key: 'history', label: 'Years in business', accessor: (p) => { const y = attrNumOrNull(p, 'years_in_business'); return y === null ? 'Not confirmed' : `${y}+ years`; }, score: (p) => attrNumOrNull(p, 'years_in_business') ?? 0 },
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
    { key: 'premiumNote', label: 'Premium detail', accessor: (p) => attrStr(p, 'premium_note') || '—' },
    { key: 'accreditationNote', label: 'Accreditation detail', accessor: (p) => attrStr(p, 'accreditation_note') || '—' },
    { key: 'regulatory', label: 'Regulatory / dispute history', accessor: (p) => attrStr(p, 'regulatory_note') || 'No material issues found at research time.' },
  ],

  verdict: {
    intro:
      "The Perth Mint is our top pick — Australia's only government-owned mint, LBMA Good Delivery-accredited, with a resolved and transparently disclosed 2023-25 AUSTRAC compliance matter behind it. Ainslie Bullion is the most established independent dealer (operating since 1974) with a clean complaint record, and As Good As Gold Australia has the strongest independently corroborated customer rating in this comparison.",
    picks: [
      { slug: 'perth-mint', label: 'Best overall / government-backed' },
      { slug: 'ainslie-bullion', label: 'Most established independent dealer' },
      { slug: 'as-good-as-gold-australia', label: 'Highest-rated by customers' },
    ],
  },
  methodology:
    "We compare each dealer's premium over spot, storage fee structure, buyback availability and accreditation (government mint, LBMA-accredited refiner, authorised distributor, or unaccredited retail dealer) from official pricing pages and disclosures, cross-checked against independent review platforms. Physical bullion is NOT an ASIC-regulated financial product in Australia — no dealer here requires an AFSL, and AFCA dispute resolution generally does not apply — so we weight accreditation, track record and complaint history more heavily than a typical regulated-product comparison. We disclose real, sourced regulatory and complaint history plainly rather than silently omitting a candidate, and note explicitly wherever a figure (premium %, exact rating) could not be independently confirmed at research time. Rankings never depend on commissions — every provider on this page is currently a visit-only listing.",
  buyerGuide: [
    {
      h3: 'Bullion is not a regulated financial product',
      body: "ASIC Moneysmart is explicit: direct physical precious metals investing is not regulated by ASIC as a financial product, unlike shares, managed funds or gold ETFs. No AFSL is required to sell bullion, and buyers generally cannot access AFCA if a dispute arises. Your only real protection is AUSTRAC's AML/CTF reporting-entity regime (identity verification, not consumer protection) plus ordinary consumer law.",
    },
    {
      h3: 'Premium over spot and storage — the two numbers that matter',
      body: "The premium over spot (the markup you pay above the live gold price) and any ongoing storage fee (if you don't take physical delivery) are the two real cost drivers. Several dealers in this comparison could not have their current premium independently confirmed at research time — always get a live, dated quote before buying.",
    },
    {
      h3: 'Allocated vs. unallocated vs. take-delivery storage',
      body: "Unallocated storage is usually free but means you own a claim on a pooled holding rather than a specific serialised item — a counterparty-risk trade-off. Allocated storage costs more (typically well under 1% p.a.) but the specific bar or coin is legally yours and segregated. Taking physical delivery avoids storage fees entirely but shifts security and insurance risk to you.",
    },
    {
      h3: 'How to spot a legitimate dealer',
      body: 'Look for AUSTRAC reporting-entity registration (legally mandatory — ask directly, as there is no public per-dealer lookup), sourcing from LBMA Good Delivery-accredited refiners or authorised mint distributorship, a genuine published buyback policy, and an established operating history with a real physical address. Be wary of anything marketed as "digital gold" with passive-return or referral-bonus promises — ASIC has specifically warned this pattern is associated with unlicensed schemes.',
    },
    {
      h3: 'Why is Gold Stackers ranked last, not excluded?',
      body: 'A specific, dated (February 2026) customer complaint describes a fully-paid silver order left undelivered for weeks with no tracking, followed by a refusal to refund and an offer to liquidate at buy-back price instead — the most concerning record we found among the 7 dealers researched for this page. We disclose it plainly rather than silently dropping the candidate, and rank it last as a result. If you\'re considering Gold Stackers, get a clear delivery timeline and dispute-resolution process in writing before paying.',
    },
  ],
  faq: [
    {
      q: 'Is buying gold bullion regulated in Australia?',
      a: "Not as a financial product. ASIC Moneysmart explicitly states direct physical precious metals investing is not ASIC-regulated — no dealer needs an AFSL, and AFCA generally does not cover bullion disputes. The overlapping regulation is AUSTRAC's AML/CTF reporting-entity regime, which governs identity verification, not consumer protection. This is true of every dealer on this page, not just some.",
    },
    {
      q: 'What is the best gold dealer in Australia?',
      a: "The Perth Mint is our top pick — it's Australia's only government-owned mint (Western Australian Government) and an LBMA Good Delivery-accredited refiner, the strongest accreditation combination in this comparison. Ainslie Bullion is the most established independent dealer (since 1974) with a clean complaint record, and As Good As Gold Australia has the strongest independently corroborated customer rating.",
    },
    {
      q: 'What is a typical premium over spot price?',
      a: "It varies by dealer, product and live gold price, and several current figures could not be independently confirmed for this comparison at research time — always get a live, dated quote directly from the dealer before buying rather than relying on a historical percentage.",
    },
    {
      q: 'Should I choose allocated storage, unallocated storage, or take delivery?',
      a: 'Take delivery avoids ongoing fees but puts security and insurance on you. Unallocated storage is usually free but means pooled, not individually-owned, holdings. Allocated storage costs a fee (typically well under 1% p.a., though a couple of dealers use a flat annual fee instead of a percentage) but the specific item is legally yours and segregated from the dealer\'s own assets.',
    },
    {
      q: 'How current is this data?',
      a: 'Every fee, accreditation and complaint reference on this page was researched against official sources and independent review platforms on 10 July 2026. Premiums over spot change with the live gold price, effectively daily — always confirm a current quote directly with the dealer before purchasing.',
    },
  ],
  compliance: {
    notice:
      'Not financial advice. Physical bullion is not an ASIC-regulated financial product — no dealer on this page requires an AFSL and AFCA dispute resolution generally does not apply. Confirm current pricing directly with the dealer before purchasing.',
    regulators: [],
  },

  sources: [
    { label: 'ASIC Moneysmart — check before you invest', url: 'https://moneysmart.gov.au/check-and-report-scams/check-before-you-invest' },
    { label: 'ASIC — digital gold vault warning', url: 'https://www.asic.gov.au/about-asic/news-centre/news-items/asic-warns-consumers-of-suspicious-investment-opportunities-in-digital-gold-vaults/' },
    { label: 'LBMA — Good Delivery current list (gold)', url: 'https://www.lbma.org.uk/good-delivery/gold-current-list' },
  ],
  relatedLinks: [
    { label: 'Australia gold investing hub', href: '/au/gold-investing' },
    { label: 'Best super funds (Australia)', href: '/au/superannuation/best/super-funds' },
    { label: 'How SmartFinPro reviews products', href: '/methodology' },
  ],
};
