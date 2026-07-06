// lib/comparison/topics/gold-investing.ts
// TopicConfig for "Best Gold Investing Platforms" + the Zod schema that guards its
// `attributes` JSONB. Pure module — no React, no server imports.
//
// Compares two structurally different businesses: 5 gold IRA specialists (phone-quoted
// premiums, no published price list) and 4 online bullion dealers (live prices, no
// account fees). See docs/superpowers/plans/2026-07-05-cockpit-gold-investing-source-matrix.md
// and .../2026-07-05-cockpit-gold-investing-planned-seed-values.md (incl. the Fable-5
// pre-migration review outcome) for full sourcing.
//
// Cost model: reuses `kind: 'banking'` with EVERY candidate seeded at `monthlyFee: 0` --
// the same fix class the Slice-7/8 pre-migration reviews found; applied preventively
// here from the start. No specColumn/compareRow declares a cost winner — two
// economically incompatible pricing models (IRA flat fees + non-published phone
// premiums vs. live online premiums with no account fees) make an honest cost winner
// impossible.
//
// `review_score`/`review_count` are nullable in the schema (Slice-7/8 nullable pattern +
// shared-UI `reviewCount === 0` guard) though no candidate in this slice actually needs
// `null` — all 9 have a seedable review basis. Kept for schema consistency with sibling
// topics.
//
// Attribution Gate: NONE of the 9 ranked candidates has any `affiliate_links` row in prod
// (DB-audited 2026-07-05) — only the excluded Silver Gold Bull does, and its
// `tracking_status = 'unverified'`. So every candidate resolves to 'review' or 'visit',
// matching every prior slice in this rollout.
//
// Silver Gold Bull is NOT a ranked candidate (no independent 2026 editorial ranking
// includes it) — covered only in the buyerGuide, mirroring the Mimecast/Microsoft
// Defender buyerGuide-only pattern from Slice 8.

import { z } from 'zod';
import type { TopicConfig } from './types';
import type { ProductForComparison } from '@/lib/comparison/types';

/** Gold-investing-specific facts stored in product_attributes.attributes. Validated per row. */
export const goldInvestingAttributesSchema = z
  .object({
    segment: z.enum(['gold_ira_specialist', 'online_bullion_dealer']),
    starting_price_headline: z.string(), // short, feeds specColumn + homepage tile
    starting_price_note: z.string(), // full detail, detailRow only
    min_investment_note: z.string(), // e.g. "$50,000 (IRA & cash)" or "No account minimum"
    min_investment_usd: z.number(), // real numeric CASH-floor minimum in dollars — feeds the "Lowest minimum" sort/chip
    storage_note: z.string(),
    core_features_note: z.string(),
    target_user_note: z.string(),
    founded_year: z.number(),
    bbb_rating_note: z.string(), // e.g. "A+, 0 complaints/3yr" — BBB is a regulator-adjacent source, not a review score
    analyst_leader: z.boolean(), // true only for a verified, named, non-paid-PR editorial recognition
    analyst_leader_note: z.string().optional(),
    clean_incident_record: z.boolean(), // drives the matcher directly, not just prose
    review_score: z.number().nullable(),
    review_count: z.number().nullable(),
    review_source: z.string(),
    review_note: z.string().optional(),
    regulatory_history_note: z.string(),
    editorial_consensus_note: z.string(),
  })
  .passthrough();

const attr = (p: ProductForComparison, k: string): boolean => p.attributes?.[k] === true;
const attrStr = (p: ProductForComparison, k: string): string =>
  typeof p.attributes?.[k] === 'string' ? (p.attributes[k] as string) : '';
/** null (genuinely unrated) is distinct from 0 (worst possible) — never coerced. */
const attrNumOrNull = (p: ProductForComparison, k: string): number | null =>
  typeof p.attributes?.[k] === 'number' ? (p.attributes[k] as number) : null;
const attrNum = (p: ProductForComparison, k: string): number =>
  typeof p.attributes?.[k] === 'number' ? (p.attributes[k] as number) : 0;

const SEGMENT_LABEL: Record<string, string> = {
  gold_ira_specialist: 'Gold IRA specialist',
  online_bullion_dealer: 'Online bullion dealer',
};

export const goldInvestingConfig: TopicConfig = {
  slug: 'platforms',
  category: 'gold-investing',
  label: 'Gold Investing Platforms',
  h1: (y) => `Best gold investing platforms in ${y}`,
  metaTitle: (y) => `Best Gold Investing Platforms (${y})`,
  metaDescription: (y) =>
    `Compare the best gold IRA companies and online bullion dealers of ${y} — fees, storage, minimums, and real complaint history, independently sourced.`,
  intro:
    'Independent, side-by-side comparison of gold IRA specialists and online bullion dealers — two genuinely different businesses that both get called "gold investing," with real fee and complaint-history differences worth knowing before you call anyone.',
  publishedDate: '2026-07-05',
  attributesSchema: goldInvestingAttributesSchema,

  specColumns: [
    {
      key: 'segment',
      label: 'Segment',
      accessor: (p) => attrStr(p, 'segment'),
      format: (v) => SEGMENT_LABEL[String(v)] ?? String(v),
      // no winner — informational, matches cybersecurity-smb/ai-tools-finance Segment precedent
    },
    {
      key: 'price',
      label: 'Starting price',
      accessor: (p) => attrStr(p, 'starting_price_headline'),
      format: (v) => String(v),
      // no winner — two incompatible pricing models, no honest cost ordinal exists
    },
    {
      key: 'minInvestment',
      label: 'Min. investment',
      accessor: (p) => attrStr(p, 'min_investment_note'),
      format: (v) => String(v),
      sortKey: 'minInvestment',
      // no winner highlight — a lower minimum isn't universally "better," it's a fit question
    },
  ],

  filters: [
    { key: 'ira', label: 'Gold IRA specialist', predicate: (p) => attrStr(p, 'segment') === 'gold_ira_specialist' },
    { key: 'dealer', label: 'Online bullion dealer', predicate: (p) => attrStr(p, 'segment') === 'online_bullion_dealer' },
    { key: 'cleanRecord', label: 'Clean incident record', predicate: (p) => attr(p, 'clean_incident_record') },
    { key: 'analystRecognized', label: 'Analyst-recognized leader', predicate: (p) => attr(p, 'analyst_leader') },
  ],

  priorityChips: [
    { id: 'ira', label: 'Best gold IRA', icon: 'Landmark', sort: 'ira' },
    { id: 'dealer', label: 'Best online dealer', icon: 'ShoppingCart', sort: 'dealer' },
    { id: 'minInvestment', label: 'Lowest minimum', icon: 'TrendingDown', sort: 'minInvestment' },
    { id: 'rating', label: 'Top rated', icon: 'Star', sort: 'rating' },
  ],

  matcher: [
    {
      id: 'segment',
      label: 'What are you looking to do?',
      weight: 16,
      options: [
        { value: 'ira', label: 'Roll over or open a gold IRA' },
        { value: 'dealer', label: 'Buy physical gold/silver directly' },
      ],
      award: (p, a) => {
        const map: Record<string, string> = { ira: 'gold_ira_specialist', dealer: 'online_bullion_dealer' };
        return { matched: attrStr(p, 'segment') === map[a], reason: 'Matches your use case' };
      },
    },
    {
      id: 'budget',
      label: 'How much are you looking to invest?',
      weight: 10,
      options: [
        { value: 'under_50k', label: 'Under $50,000' },
        { value: 'over_50k', label: '$50,000 or more' },
      ],
      award: (p, a) =>
        a === 'under_50k'
          ? { matched: attrNum(p, 'min_investment_usd') < 50000, reason: 'Fits your budget' }
          : { matched: true },
    },
    {
      id: 'cleanRecord',
      label: 'Prefer a company with no regulatory or legal disclosures on record?',
      weight: 8,
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: "Doesn't matter" },
      ],
      award: (p, a) => (a === 'yes' ? { matched: attr(p, 'clean_incident_record'), reason: 'Clean incident record' } : { matched: true }),
    },
  ],

  sortOptions: [
    { value: 'smart', label: 'Smart rank', metric: (p) => p.score },
    { value: 'ira', label: 'Best gold IRA', metric: (p) => (attrStr(p, 'segment') === 'gold_ira_specialist' ? 1000 : 0) + p.score },
    { value: 'dealer', label: 'Best online dealer', metric: (p) => (attrStr(p, 'segment') === 'online_bullion_dealer' ? 1000 : 0) + p.score },
    { value: 'minInvestment', label: 'Lowest minimum', metric: (p) => attrNum(p, 'min_investment_usd'), dir: 'asc' },
    { value: 'rating', label: 'Top rated', metric: (p) => (attrNumOrNull(p, 'review_score') ?? 0) * 100 + p.score },
  ],

  costModel: {
    kind: 'banking',
    amountLabel: 'Representative usage', // ignored — matches Slice 7/8 precedent
    amountMin: 0,
    amountMax: 0,
    amountStep: 1,
    amountDefault: 0,
    yearsLabel: 'Time horizon (years)',
    yearsMin: 1,
    yearsMax: 5,
    yearsDefault: 3,
  },

  compareRows: [
    { key: 'price', label: 'Starting price', accessor: (p) => attrStr(p, 'starting_price_headline') }, // no score — no honest cost ordinal exists
    { key: 'segment', label: 'Segment', accessor: (p) => SEGMENT_LABEL[attrStr(p, 'segment')] ?? '—' }, // informational only
    { key: 'minInvestment', label: 'Min. investment', accessor: (p) => attrStr(p, 'min_investment_note') || '—' }, // no score — fit, not quality
    { key: 'storage', label: 'Storage', accessor: (p) => attrStr(p, 'storage_note') || '—' }, // informational only
    { key: 'bbbRating', label: 'BBB rating', accessor: (p) => attrStr(p, 'bbb_rating_note') || '—' }, // informational only — not comparable across differing complaint volumes without context
    {
      key: 'rating',
      label: 'Consumer review score',
      accessor: (p) => {
        const score = attrNumOrNull(p, 'review_score');
        return score === null ? attrStr(p, 'review_source') : `${score}/5 (${(attrNumOrNull(p, 'review_count') ?? 0).toLocaleString('en-US')} ${attrStr(p, 'review_source')} reviews)`;
      },
      score: (p) => attrNumOrNull(p, 'review_score') ?? 0,
    },
  ],

  detailRows: [
    { key: 'priceNote', label: 'Pricing detail', accessor: (p) => attrStr(p, 'starting_price_note') || '—' },
    { key: 'storageNote', label: 'Storage detail', accessor: (p) => attrStr(p, 'storage_note') || '—' },
    { key: 'coreFeaturesNote', label: 'Core features', accessor: (p) => attrStr(p, 'core_features_note') || '—' },
    { key: 'targetUserNote', label: 'Best for', accessor: (p) => attrStr(p, 'target_user_note') || '—' },
    { key: 'regulatoryNote', label: 'Regulatory history', accessor: (p) => attrStr(p, 'regulatory_history_note') || '—' },
    { key: 'reviewNote', label: 'Review detail', accessor: (p) => attrStr(p, 'review_note') || '—' },
    { key: 'editorialConsensusNote', label: 'Editorial consensus', accessor: (p) => attrStr(p, 'editorial_consensus_note') || '—' },
  ],

  verdict: {
    intro:
      "Our top pick, Augusta Precious Metals, has the cleanest complaint record in this comparison but requires a $50,000 minimum — smaller budgets should look at Birch Gold or Noble Gold instead. Nine platforms here split into two genuinely different businesses: gold IRA specialists who quote premiums by phone, and online bullion dealers who show live prices.",
    picks: [
      { slug: 'augusta', label: 'Best overall / cleanest complaint record (requires $50,000 minimum)' },
      { slug: 'birch-gold', label: 'Lowest IRA minimum ($5,000) + a real published fee number before you call' },
      { slug: 'noble-gold', label: 'Lowest cash entry point ($2,000) + segregated-only storage' },
      { slug: 'american-hartford-gold', label: 'Mid-range IRA minimum, most-discussed complaint pattern (read the disclosure first)' },
      { slug: 'goldco', label: 'Best known brand for IRA rollovers' },
      { slug: 'apmex', label: 'Best online dealer for selection + professional storage' },
      { slug: 'jm-bullion', label: '3x Bullion Dealer of the Year (public vote)' },
      { slug: 'money-metals-exchange', label: 'Best for automated recurring purchases + in-house storage' },
      { slug: 'sd-bullion', label: 'Largest review base among dealers (read the pricing disclosure first)' },
    ],
  },
  methodology:
    "These nine platforms split into two genuinely different businesses: gold IRA specialists, who don't publish metal premiums and require a phone call for any real number, and online bullion dealers, who show live prices but charge no account fees. We don't force a single price-based ranking across that divide — \"starting price\" describes each vendor's pricing model in its own terms, and the real IRA cost (the premium over spot, not the account fee) is simply not public for any of the five IRA specialists in this comparison. We rank using published fee transparency where it exists, BBB and independent review-platform standing (always shown with its source and count, since this industry's review scores vary enormously by platform — one dealer scores in the 4s on one platform and barely above 4 on another), and a documented regulatory/complaint history that we disclose rather than omit. We do not cite paid-newswire \"rankings\" (a real pattern in this industry, where several widely-repeated \"#1\" claims trace back to sponsored press releases rather than independent analysis) — every superlative on this page is sourced to a named, verifiable outlet or record.",
  buyerGuide: [
    {
      h3: 'Gold IRA vs. online bullion dealer: which do you actually need?',
      body: "A gold IRA specialist rolls over retirement funds into IRS-eligible metals held at a third-party depository, with an account custodian and annual fees but no published metal premium. An online bullion dealer sells you physical metal directly, with a live, published price but no retirement-account structure. If you're moving retirement savings, you need an IRA specialist; if you just want to hold physical metal outside a retirement account, an online dealer is simpler and its pricing is actually visible before you commit.",
    },
    {
      h3: "Why doesn't this page compare prices directly?",
      body: "Gold IRA companies quote premiums by phone and don't publish them — this is industry-standard, not unique to any one company on this page, but it means a real head-to-head price comparison across the five IRA specialists isn't possible from public information. We show each one's published account-fee structure where it exists instead, and are explicit when a number is an editorial estimate rather than a confirmed figure.",
    },
    {
      h3: "The industry's real risk: undisclosed markups on retirement savings",
      body: 'The CFTC, FINRA, and NASAA have jointly warned about high-pressure precious-metals sales tactics targeting retirees, and there are real enforcement precedents in this industry — TMTE/Metals.com\'s $185 million CFTC-plus-30-state settlement and Safeguard Metals\' $51 million-plus judgment, among others. None of the 9 candidates on this page is a party to those specific cases, but the sales mechanics regulators have flagged — celebrity endorsements, "free silver" promotions, fear-based marketing to retirees — are common across this space, including some candidates here.',
    },
    {
      h3: 'Where does Silver Gold Bull fit?',
      body: "Silver Gold Bull isn't ranked here — no independent 2026 editorial ranking includes it among the leading gold-investing platforms. It has a solid Trustpilot base (around 4.5/5 from roughly 4,900 reviews) and an A+ BBB record, but the honest caveats are Canadian-based storage logistics for US customers and materially less editorial visibility than the ranked field. See our existing Silver Gold Bull review for the full picture.",
    },
    {
      h3: "A published fee doesn't mean a low total cost",
      body: 'The metal premium, not the account fee, is where most of an IRA specialist\'s revenue — and most of the industry\'s documented markup complaints — comes from. A company with a clean, published $235/year fee schedule (like Birch Gold) can still charge whatever premium it wants on the metal itself, same as every other IRA specialist in this segment. A low account fee is not the same thing as a low total cost.',
    },
  ],
  faq: [
    {
      q: "Why can't I see gold IRA prices on this page the way I can for the online dealers?",
      a: "Gold IRA companies don't publish their metal premiums — every one of the five specialists here (Augusta, Goldco, American Hartford Gold, Birch Gold, Noble Gold) requires a phone call to get a real quote. This is standard across the entire industry, not something unique to any one company. What we can and do show is each company's published account fee structure (where one exists), storage terms, and complaint history — the premium itself simply isn't public information anywhere.",
    },
    {
      q: 'Which of these companies has had a real security or financial disclosure I should know about?',
      a: 'JM Bullion disclosed a 2020 card-skimming data breach that led to a roughly $14.8 million class-action settlement; Goldco reached a $2 million TCPA settlement (finalized March 2026) over unsolicited marketing texts; American Hartford Gold has been the subject of a 2023 MSNBC investigative report and a law-firm investigation into markup practices on specialty coins; and SD Bullion is currently facing an active (unresolved) false-advertising class action over its "lowest price" claims. We disclose all four directly on their respective cards rather than omitting them.',
    },
    {
      q: 'Is a lower minimum investment always the better deal?',
      a: "No — a lower minimum is a fit question, not a quality signal. Noble Gold's $2,000 cash floor and Birch Gold's $5,000 IRA floor make them accessible to smaller budgets, but Augusta's $50,000 minimum comes with the cleanest complaint record in this comparison. Choose based on how much hand-holding, storage structure, and complaint history matter to you — not just the entry price.",
    },
    {
      q: "Why isn't Silver Gold Bull ranked here if SmartFinPro already has a relationship with it?",
      a: "No independent 2026 editorial ranking includes Silver Gold Bull among top gold-investing platforms, so we don't force it into the ranked field just because a relationship exists. It has a solid Trustpilot record and an A+ BBB rating, and we cover it honestly in the buyer's guide above with its real caveats (Canadian-based storage logistics for US customers, thinner editorial coverage) rather than either excluding it entirely or artificially ranking it.",
    },
    {
      q: 'Are any of these affiliate links?',
      a: "Where we have an active, verified affiliate relationship, the destination link is disclosed as such on the individual candidate's card. As of this comparison's publish date, none of the nine ranked candidates has a verified, monetized tracking link in place — every link here currently routes to either the company's own review page or its official site, not a tracked affiliate URL.",
    },
    {
      q: 'What should I watch out for when a gold IRA company quotes me a price by phone?',
      a: 'Get the exact markup over spot price in writing before you buy, insist on standard bullion coins/bars rather than "specialty" or "exclusive" numismatic pieces (which can carry markups of 45-100% or more), and ask directly what the buyback price would be on the same day. Regulators (the CFTC, FINRA, and NASAA jointly) have specifically warned about high-pressure sales tactics targeting retirees in this industry — a legitimate company will let you take the quote away and think it over.',
    },
  ],
  compliance: {
    notice:
      "Precious-metals dealers are not investment advisers and are largely outside SEC/FINRA oversight. Dealer premiums over spot are the industry's real cost and are often only quoted by phone; \"free silver\" promotions are typically priced into those markups rather than being a true discount. The CFTC, FINRA, and NASAA have jointly warned retirees about high-pressure precious-metals sales tactics — verify any specific markup or fee in writing before purchasing.",
    regulators: [],
  },
};
