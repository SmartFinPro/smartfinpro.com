// lib/comparison/topics/ca/gold-investing.ts
// TopicConfig for "Best Gold Investing Platforms (Canada)" — registered
// under 'ca:gold-investing/platforms'. Shares the 'gold-investing/platforms'
// slug with us/au for hreflang clustering; fully independent CA-specific
// editorial content. Pure module — no React/server imports.
//
// Cost model: 'banking' — monthly_fee=0 for direct-bullion dealers (banking@0
// pattern, mirrors gold-investing.ts (US) / au/gold-investing.ts — no honest
// monthly "cost" figure exists for a bullion dealer). management_fee is
// reused for the two non-dealer products (BMG's fund MER, the Mint's ETR
// service fee) since those genuinely do charge an ongoing % fee, unlike a
// bullion dealer's one-time premium.
//
// product_type distinguishes three genuinely different structures on this
// page (CA-specific, not present in the AU/US gold configs): direct_bullion
// (you own physical metal via the dealer), fund_wrapper (BMG — a mutual fund
// holding allocated bullion, RRSP/TFSA-native), and etr_security (the Royal
// Canadian Mint's Gold Exchange-Traded Receipts — a TSX-listed direct legal
// claim on Mint-vaulted gold, bought through any brokerage). Comparing these
// on a single "premium over spot" column would be misleading, so premium_
// over_spot_pct is null for the latter two with an explanatory premium_note.
//
// CA-specific compliance axis (SEO addendum §4): direct bullion ownership is
// not a CIRO/OSC-regulated security in Canada (unlike BMG's fund wrapper,
// which IS an OSC-regulated mutual fund, or the Mint's ETR, a TSX-listed
// security) — no securities regulation applies to a dealer selling you a
// gold coin. FINTRAC (AML/CTF reporting) is the only overlapping regime, and
// even that wasn't independently confirmed per-dealer at research time.
//
// Editorial disclosure (not silent exclusion — matches how the US shortlist
// treated Freedom Debt Relief/Lexington Law): Canadian Bullion Services
// carries active, recent (2025-2026) non-delivery and unanswered-refund
// complaints and is not BBB-accredited — kept in the ranked field per the
// approved candidate shortlist, ranked last, with prominent factual
// disclosure. GoldMoney's 2024 British Virgin Islands corporate continuance
// was a disclosed, shareholder-voted redomiciliation of a public company
// (TSX: XAU), NOT a fraud/shell-company red flag — but its real, recent
// (2024-2025) customer account-freeze and forced-liquidation complaints are
// disclosed plainly rather than omitted.

import { z } from 'zod';
import type { TopicConfig } from './../types';
import type { ProductForComparison } from '@/lib/comparison/types';

export const caGoldInvestingAttributesSchema = z
  .object({
    product_type: z.enum(['direct_bullion', 'fund_wrapper', 'etr_security']),
    premium_over_spot_pct: z.number().nullable(), // null = not applicable (fund/security) or not independently confirmed
    premium_note: z.string(),
    storage_note: z.string(),
    buyback_available: z.boolean(),
    registered_account_note: z.string(), // RRSP/TFSA eligibility mechanics — varies a lot on this page
    accreditation: z.enum(['government_mint', 'lbma_affiliate', 'osc_regulated_fund', 'retail_dealer']),
    accreditation_note: z.string(),
    years_in_business: z.number().nullable(),
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
const attrBool = (p: ProductForComparison, k: string): boolean => p.attributes?.[k] === true;
const yesNo = (b: boolean) => (b ? 'Yes' : 'No');
const pctOrDash = (n: number | null) => (n === null ? 'Not applicable / not confirmed' : `${n.toFixed(2)}%`);
const ACCRED_LABEL: Record<string, string> = {
  government_mint: 'Government mint / Crown corporation',
  lbma_affiliate: 'LBMA Affiliate Member',
  osc_regulated_fund: 'OSC-regulated mutual fund',
  retail_dealer: 'Retail bullion dealer',
};
const PRODUCT_LABEL: Record<string, string> = {
  direct_bullion: 'Direct physical bullion',
  fund_wrapper: 'Mutual fund (bullion-backed)',
  etr_security: 'TSX-listed security (ETR)',
};

export const caGoldInvestingConfig: TopicConfig = {
  slug: 'platforms',
  category: 'gold-investing',
  label: 'Gold Investing Platforms',
  h1: (y) => `Best gold investing platforms in Canada (${y})`,
  metaTitle: (y) => `Best Gold Dealers in Canada (${y})`,
  metaDescription: (y) =>
    `Compare Canadian gold investing platforms of ${y} by premium over spot, storage, RRSP/TFSA eligibility and accreditation — independent, sourced.`,
  intro:
    'Independent, side-by-side comparison of Canadian gold investing platforms — physical bullion dealers, an RRSP-eligible bullion fund, and a TSX-listed gold security — ranked by cost, storage and accreditation.',
  publishedDate: '2026-07-11',
  attributesSchema: caGoldInvestingAttributesSchema,

  specColumns: [
    {
      key: 'productType',
      label: 'Product type',
      accessor: (p) => attrStr(p, 'product_type'),
      format: (v) => PRODUCT_LABEL[String(v)] ?? String(v),
    },
    {
      key: 'premium',
      label: 'Premium over spot',
      accessor: (p) => attrNumOrNull(p, 'premium_over_spot_pct') ?? 999,
      format: (v) => (Number(v) === 999 ? 'N/A — see detail' : `${Number(v).toFixed(1)}%`),
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
    { key: 'directBullion', label: 'Direct physical bullion', predicate: (p) => attrStr(p, 'product_type') === 'direct_bullion' },
    { key: 'registered', label: 'RRSP/TFSA-eligible', predicate: (p) => !attrStr(p, 'registered_account_note').toLowerCase().includes('not eligible') },
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
      label: 'How important is government/regulated-security backing?',
      weight: 16,
      options: [
        { value: 'high', label: 'Very important' },
        { value: 'low', label: "Doesn't matter" },
      ],
      award: (p, a) =>
        a === 'high'
          ? { matched: attrStr(p, 'accreditation') === 'government_mint' || attrStr(p, 'accreditation') === 'osc_regulated_fund', reason: 'Government mint or OSC-regulated fund' }
          : { matched: true },
    },
    {
      id: 'registered',
      label: 'Do you want to hold this in an RRSP or TFSA?',
      weight: 14,
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: "Doesn't matter" },
      ],
      award: (p, a) =>
        a === 'yes'
          ? { matched: !attrStr(p, 'registered_account_note').toLowerCase().includes('not eligible'), reason: 'RRSP/TFSA-eligible' }
          : { matched: true },
    },
  ],

  sortOptions: [
    { value: 'smart', label: 'Smart rank', metric: (p) => p.score },
    { value: 'trust', label: 'Highest accreditation first', metric: (p) => (attrStr(p, 'accreditation') === 'government_mint' ? 2000 : attrStr(p, 'accreditation') === 'osc_regulated_fund' ? 1500 : attrStr(p, 'accreditation') === 'lbma_affiliate' ? 1000 : 0) + p.score },
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
    { key: 'productType', label: 'Product type', accessor: (p) => PRODUCT_LABEL[attrStr(p, 'product_type')] ?? '—' },
    { key: 'premium', label: 'Premium over spot', accessor: (p) => pctOrDash(attrNumOrNull(p, 'premium_over_spot_pct')) },
    { key: 'storage', label: 'Storage', accessor: (p) => attrStr(p, 'storage_note') || '—' },
    { key: 'registered', label: 'RRSP/TFSA eligibility', accessor: (p) => attrStr(p, 'registered_account_note') || '—' },
    { key: 'buyback', label: 'Buyback', accessor: (p) => yesNo(attrBool(p, 'buyback_available')), score: (p) => (attrBool(p, 'buyback_available') ? 1 : 0) },
    { key: 'accreditation', label: 'Accreditation', accessor: (p) => ACCRED_LABEL[attrStr(p, 'accreditation')] ?? '—', score: (p) => (attrStr(p, 'accreditation') === 'government_mint' ? 3 : attrStr(p, 'accreditation') === 'osc_regulated_fund' ? 2 : attrStr(p, 'accreditation') === 'lbma_affiliate' ? 1 : 0) },
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
    { key: 'premiumNote', label: 'Premium / fee detail', accessor: (p) => attrStr(p, 'premium_note') || '—' },
    { key: 'accreditationNote', label: 'Accreditation detail', accessor: (p) => attrStr(p, 'accreditation_note') || '—' },
    { key: 'regulatory', label: 'Regulatory / dispute history', accessor: (p) => attrStr(p, 'regulatory_note') || 'No material issues found at research time.' },
  ],

  verdict: {
    intro:
      "Silver Gold Bull is our top pick — a BBB A+ rating with zero complaints in the last 3 years, LBMA Affiliate Membership, and the strongest independently corroborated review score in this comparison. BMG (Bullion Management Group) is the best pick for RRSP/TFSA investors, since it's the only Canadian gold product structured as an OSC-regulated mutual fund holding allocated bullion, purpose-built for registered accounts. The Royal Canadian Mint's Gold Exchange-Traded Receipts are the most trust-anchored option — a direct legal claim on Mint-vaulted gold, backed by the Government of Canada, traded on the TSX through any brokerage.",
    picks: [
      { slug: 'silver-gold-bull-ca', label: 'Best overall' },
      { slug: 'bmg-bullionfund', label: 'Best for RRSP/TFSA' },
      { slug: 'rcm-gold-etr', label: 'Most trust-anchored / government-backed' },
    ],
  },
  methodology:
    "We compare each platform's premium over spot (or management fee, for the fund and security products), storage structure, RRSP/TFSA eligibility, buyback availability and accreditation from official pricing pages and disclosures, cross-checked against independent review platforms (Trustpilot, BBB) where available. Direct physical bullion is not a CIRO/OSC-regulated security in Canada — unlike BMG's fund wrapper (an OSC-regulated mutual fund) or the Royal Canadian Mint's ETR (a TSX-listed security) — so for bullion dealers we weight accreditation, track record and complaint history more heavily than a typical regulated-product comparison. We disclose real, sourced regulatory and complaint history plainly rather than silently omitting a candidate, and note explicitly wherever a figure could not be independently confirmed at research time. Rankings never depend on commissions — every provider on this page is currently a visit-only listing.",
  buyerGuide: [
    {
      h3: 'Three genuinely different ways to own gold on this page',
      body: "Five of these seven are direct bullion dealers — you own a specific coin or bar, either taking delivery or paying for storage. BMG is different: it's a mutual fund (OSC-regulated, like any other Canadian fund) that itself holds allocated bullion — you own fund units, priced at NAV, not a per-oz premium. The Royal Canadian Mint's Gold ETR is different again: a TSX-listed security representing a direct legal and beneficial interest in Mint-vaulted gold, bought through a normal brokerage account like a stock. These aren't directly comparable on premium alone — check the 'product type' column first.",
    },
    {
      h3: 'RRSP and TFSA eligibility varies a lot',
      body: "BMG's BullionFund products are purpose-built for registered accounts (RRSP, RRIF, TFSA, RESP, RDSP all eligible). The Mint's Gold ETR trades like any other security and is RRSP/TFSA-eligible through a self-directed brokerage. Among the direct-bullion dealers, Sprott Money requires opening a Questrade account as third-party custodian before it can process a registered-account order — a real extra step worth knowing about upfront, not a limitation unique to Sprott but a mechanic several bullion dealers share.",
    },
    {
      h3: 'Why Canadian Bullion Services is ranked last, not excluded',
      body: 'Multiple recent (2025-2026) customer reports describe months-long non-delivery after payment, unreturned calls, and refund requests going unanswered — a materially worse pattern than any other dealer researched for this page, and the company is not BBB-accredited. We disclose this plainly rather than silently dropping the candidate, and rank it last as a result. If you\'re considering Canadian Bullion Services, get a clear delivery timeline in writing and consider paying by a method that preserves dispute rights.',
    },
    {
      h3: 'Reading GoldMoney\'s 2024 corporate move honestly',
      body: "GoldMoney Inc. (TSX: XAU) shifted its corporate registration from British Columbia to the British Virgin Islands in September 2024 — a disclosed, shareholder-approved move by a real, currently-operating public company (not a covert shell restructuring), driven by capital-return efficiency. Separately and more relevant to a retail buyer, GoldMoney has drawn real, recent (2024-2025) customer complaints about account freezes and at least one case of unilateral liquidation of a customer's holdings — disclosed here because it bears directly on custody risk, distinct from the corporate-domicile question.",
    },
  ],
  faq: [
    {
      q: 'What is the best gold investing platform in Canada?',
      a: "Silver Gold Bull is our top pick — BBB A+ with zero complaints in 3 years and LBMA Affiliate Membership. BMG is the best pick for RRSP/TFSA investors as an OSC-regulated bullion fund built for registered accounts, and the Royal Canadian Mint's Gold ETR is the most trust-anchored option, backed directly by the Government of Canada. We re-verify pricing and features regularly, and the ranking never depends on commissions.",
    },
    {
      q: 'Is buying gold bullion regulated in Canada?',
      a: "Direct physical bullion dealing is not itself a CIRO- or OSC-regulated securities activity — no securities license is required to sell you a gold coin. The exceptions on this page are BMG (an OSC-regulated mutual fund) and the Royal Canadian Mint's Gold ETR (a TSX-listed security). FINTRAC's anti-money-laundering reporting regime can apply to bullion dealers, but this governs identity verification, not consumer protection.",
    },
    {
      q: 'Can I hold gold in my RRSP or TFSA?',
      a: "Yes, through several routes on this page: BMG's BullionFund products are purpose-built for registered accounts, and the Royal Canadian Mint's Gold ETR is RRSP/TFSA-eligible through any self-directed brokerage. Some direct-bullion dealers (e.g. Sprott Money) support registered-account purchases via a third-party custodian brokerage — check the registered-account row for each provider's specific mechanism.",
    },
    {
      q: 'What is a typical premium over spot price?',
      a: "It varies by dealer, product and the live gold price, and several current figures could not be independently confirmed for this comparison at research time — always get a live, dated quote directly from the dealer before buying. Premium doesn't apply the same way to BMG (priced at fund NAV) or the Mint's ETR (priced as a traded security), which instead charge a management/service fee.",
    },
    {
      q: 'How current is this data?',
      a: 'Every fee, accreditation and complaint reference on this page was researched against official sources and independent review platforms on 11 July 2026. Premiums over spot change with the live gold price, effectively daily — always confirm a current quote directly with the provider before purchasing.',
    },
  ],
  compliance: {
    notice:
      'Not financial advice. Direct physical bullion is not a CIRO- or OSC-regulated security in Canada; BMG and the Royal Canadian Mint ETR are regulated products. Confirm current pricing directly with the provider before purchasing.',
    regulators: ['OSC'],
  },

  sources: [
    { label: 'FINTRAC — MSB registry search', url: 'https://fintrac-canafe.canada.ca/msb-esm/reg-eng' },
    { label: 'OSC — check registration', url: 'https://www.osc.ca/en/investors/protect-yourself/check-registration' },
    { label: 'Royal Canadian Mint — Gold ETR information statement', url: 'https://www.reserves.mint.ca/media/1521/gold-etr-information-statement.pdf' },
  ],
  relatedLinks: [
    { label: 'Canada personal finance hub', href: '/ca/personal-finance' },
    { label: 'Best TFSA/RRSP investing platforms', href: '/ca/tax-efficient-investing/best/tfsa-rrsp-platforms' },
    { label: 'How SmartFinPro reviews products', href: '/methodology' },
  ],
};
