// lib/comparison/topics/credit-monitoring.ts
// TopicConfig for "Best Credit Monitoring Services" + the Zod schema that guards
// its `attributes` JSONB. Pure module — no React, no server imports.
//
// Cost model note: credit monitoring is an unbounded, ongoing monthly
// subscription (unlike Credit Repair's fixed-length program) — reuses `kind:
// 'banking'` verbatim (fx_fee_pct/atm_fee seeded at 0 for every row), which
// collapses `annualCost = monthlyFee*12 + 0 + 0` to an honest
// `monthlyFee * 12 * years`, matching the `trading-platforms.ts` "amount-hidden
// banking cost model" pattern. Unlike trading-platforms, `cost` IS enabled as
// a sort/priority-chip here: the multi-year spread ($0-$2,094 over 5 years) is
// real information, not a dead commission tie — Credit Karma's $0 is a genuine,
// permanent price (not a teaser), alongside real 1-bureau free tiers at
// Experian and myFICO. See the "Free tier" compareRow + methodology paragraph
// for the mandatory free-tier-honesty treatment.
//
// Ranked field is 8: Aura, LifeLock, IdentityForce, Experian IdentityWorks,
// IdentityIQ, myFICO, IDShield, Credit Karma. PrivacyGuard is excluded (no
// citable consumer-review base — no Trustpilot profile, ~1-star ConsumerAffairs
// on a tiny sample — with no compensating strength the way LifeLock/Experian's
// market leadership provides); mentioned in buyerGuide only. Identity Guard
// gets no ranked slot (it IS Aura — acquired 2019, same corporate product
// line; a second slot would be false diversity); footnoted under Aura's
// `deep_dive`. See
// docs/superpowers/plans/2026-07-03-cockpit-credit-monitoring-source-matrix.md
// and .../2026-07-03-cockpit-credit-monitoring-planned-seed-values.md (incl.
// §0a, the Fable-5 pre-migration review outcome) for full sourcing.
//
// Disclosed, not excluded (Freedom-Debt-Relief pattern — none of these is a
// Credit-Pros-style manipulated-data case or a Lexington-style adjudicated/
// dissolved-entity case): IdentityIQ ($8.77M Caldwell autorenewal class-action
// settlement + $1 trial mechanics + BBB grade seeded `null`, not the stale
// "A+" some search results still show), LifeLock (FTC $12M 2010 + $100M 2015
// contempt settlement), Experian (CFPB $3M 2017 + CAN-SPAM $650k 2023 + an
// ACTIVE CFPB FCRA suit, in discovery per the most recent docket entry
// verified (January 2026) and still unresolved as of our July 2026 review —
// phrased as pending, no finding, disclosed directly on its top-pick card per
// §0a-8), Credit Karma (FTC $3M dark-patterns settlement 2023), and
// IdentityForce's parent TransUnion (CFPB consent order 2017 + a 2022 suit
// dismissed with prejudice 2025 — attributed to the parent, never the
// product).
//
// `bbb_rating` is a nullable tri-state: `null` (IdentityIQ only — BBB profile
// is "being updated, no report available", NOT the same as a real "NR") is
// distinct from the literal string `'NR'` (IdentityForce's actual, current BBB
// status). Never conflate the two — mirrors the `trading-platforms.ts`
// `extended_hours` null-vs-'none' precedent exactly.

import { z } from 'zod';
import type { TopicConfig } from './types';
import type { ProductForComparison } from '@/lib/comparison/types';

/** Credit-monitoring-specific facts stored in product_attributes.attributes. Validated per row. */
export const creditMonitoringAttributesSchema = z
  .object({
    free_tier: z.enum(['none', 'partial', 'full']), // full = Credit Karma (entire product), partial = Experian/myFICO (1-bureau free layer)
    free_tier_note: z.string().optional(),
    bureaus_monitored: z.number(), // bureau count of the SEEDED plan: 1, 2, or 3
    monitoring_scope_note: z.string(),
    monthly_fee_note: z.string().optional(), // intro-vs-renewal caveats (Aura/LifeLock); annual-vs-monthly-billing caveats (IdentityIQ)
    id_theft_insurance: z.number(), // headline $ of the SEEDED (individual) plan; 0 = none (Credit Karma)
    id_theft_insurance_note: z.string().optional(),
    family_plan: z.boolean(),
    family_plan_note: z.string().optional(),
    bbb_rating: z.string().nullable(), // null = IdentityIQ only ("being updated, no report available"); 'NR' = IdentityForce's real, current status
    bbb_rating_note: z.string().optional(),
    bbb_accredited: z.boolean(),
    bbb_accredited_note: z.string().optional(),
    review_score: z.number(),
    review_count: z.number(),
    review_source: z.string(), // MUST render alongside score+count, never a bare number
    review_note: z.string().optional(),
    score_model: z.enum(['fico', 'vantagescore', 'none']),
    regulatory_history_note: z.string(),
  })
  .passthrough();

const attr = (p: ProductForComparison, k: string): boolean => p.attributes?.[k] === true;
const attrNum = (p: ProductForComparison, k: string): number =>
  typeof p.attributes?.[k] === 'number' ? (p.attributes[k] as number) : 0;
const attrStr = (p: ProductForComparison, k: string): string =>
  typeof p.attributes?.[k] === 'string' ? (p.attributes[k] as string) : '';
const usd = (n: number) =>
  `$${n.toLocaleString('en-US', { minimumFractionDigits: n % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 })}`;
const yesNo = (b: boolean) => (b ? 'Yes' : 'No');

const FREE_TIER_ORDINAL: Record<string, number> = { none: 0, partial: 1, full: 2 };
const FREE_TIER_BY_ORDINAL = ['none', 'partial', 'full'] as const;
const freeTierOrdinal = (p: ProductForComparison) => FREE_TIER_ORDINAL[attrStr(p, 'free_tier')] ?? 0;
const FREE_TIER_LABEL: Record<string, string> = {
  none: 'No',
  partial: 'Yes (1-bureau)',
  full: 'Entire product free',
};
const freeTierLabelForType = (freeTier: string) => FREE_TIER_LABEL[freeTier] ?? 'No';
const freeTierLabel = (p: ProductForComparison) => freeTierLabelForType(attrStr(p, 'free_tier'));

const BBB_ORDINAL: Record<string, number> = { NR: 0, C: 1, 'C+': 2, 'B-': 3, B: 4, 'B+': 5, 'A-': 6, A: 7, 'A+': 8 };
/** null (in-flux, no report available) sits below every real grade including NR — never asserted as equal to NR or as A+. */
const bbbOrdinal = (p: ProductForComparison): number => {
  const v = p.attributes?.bbb_rating;
  if (v === null) return -1;
  return typeof v === 'string' ? (BBB_ORDINAL[v] ?? -1) : -1;
};
/** null renders '—' (profile in flux), distinct from the literal string 'NR' (a real, current BBB status). */
const bbbLabel = (p: ProductForComparison): string => {
  const v = p.attributes?.bbb_rating;
  if (v === null) return '—';
  return typeof v === 'string' && v ? v : '—';
};

export const creditMonitoringConfig: TopicConfig = {
  slug: 'credit-monitoring',
  category: 'personal-finance',
  label: 'Credit Monitoring',
  h1: (y) => `Best credit monitoring services in ${y}`,
  metaTitle: (y) => `Best Credit Monitoring Services (${y})`,
  metaDescription: (y) =>
    `Compare the best US credit monitoring services of ${y}: monthly cost, bureaus monitored, ID theft insurance and free tiers — independently sourced.`,
  intro:
    'Independent, side-by-side comparison of the leading US credit monitoring and identity theft protection services — ranked by monthly cost, bureau coverage, insurance and free-tier honesty, with a live yearly cost calculator.',
  publishedDate: '2026-07-03',
  attributesSchema: creditMonitoringAttributesSchema,

  specColumns: [
    {
      key: 'monthlyFee',
      label: 'Monthly price',
      accessor: (p) => p.monthlyFee,
      format: (v) => (Number(v) === 0 ? 'Free' : `${usd(Number(v))}/mo`),
      winner: 'min',
      sortKey: 'cost',
    },
    {
      key: 'bureaus',
      label: 'Bureaus monitored',
      accessor: (p) => attrNum(p, 'bureaus_monitored'),
      format: (v) => `${Number(v)}-Bureau`,
      winner: 'max',
    },
    {
      key: 'insurance',
      label: 'ID theft insurance',
      accessor: (p) => attrNum(p, 'id_theft_insurance'),
      format: (v) => (Number(v) === 0 ? 'None' : usd(Number(v))),
      winner: 'max',
    },
    {
      key: 'freeTier',
      label: 'Free tier',
      accessor: freeTierOrdinal,
      format: (v) => freeTierLabelForType(FREE_TIER_BY_ORDINAL[Number(v)] ?? 'none'),
      winner: 'max',
    },
  ],

  filters: [
    { key: 'freeTier', label: 'Has a free tier', predicate: (p) => attrStr(p, 'free_tier') !== 'none' },
    { key: 'threeBureau', label: '3-bureau monitoring', predicate: (p) => attrNum(p, 'bureaus_monitored') === 3 },
    { key: 'familyPlan', label: 'Family plan available', predicate: (p) => attr(p, 'family_plan') },
    { key: 'realFico', label: 'Real FICO Score (not VantageScore)', predicate: (p) => attrStr(p, 'score_model') === 'fico' },
    { key: 'bbbAccredited', label: 'BBB accredited', predicate: (p) => attr(p, 'bbb_accredited') },
  ],

  priorityChips: [
    { id: 'cost', label: 'Lowest cost', icon: 'Coins', sort: 'cost' },
    { id: 'insurance', label: 'Highest insurance', icon: 'ShieldCheck', sort: 'insurance' },
    { id: 'rating', label: 'Top rated', icon: 'Star', sort: 'rating' },
    { id: 'free', label: 'Free tier', icon: 'Gift', sort: 'free' },
  ],

  matcher: [
    {
      id: 'budget',
      label: 'Want a genuinely free option?',
      weight: 14,
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: "Doesn't matter" },
      ],
      award: (p, a) =>
        a === 'yes' ? { matched: attrStr(p, 'free_tier') === 'full', reason: 'Completely free' } : { matched: true },
    },
    {
      id: 'family',
      label: 'Need to cover your whole family?',
      weight: 12,
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: "Doesn't matter" },
      ],
      award: (p, a) => (a === 'yes' ? { matched: attr(p, 'family_plan'), reason: 'Family plan available' } : { matched: true }),
    },
    {
      id: 'fico',
      label: 'Want the real FICO Score lenders use?',
      weight: 10,
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: "Doesn't matter" },
      ],
      award: (p, a) =>
        a === 'yes' ? { matched: attrStr(p, 'score_model') === 'fico', reason: 'Real FICO Score' } : { matched: true },
    },
  ],

  sortOptions: [
    { value: 'smart', label: 'Smart rank', metric: (p) => p.score },
    { value: 'cost', label: 'Lowest yearly cost', metric: () => 0 }, // special-cased in orderProducts
    { value: 'insurance', label: 'Highest ID theft insurance', metric: (p) => attrNum(p, 'id_theft_insurance') / 1000 + p.score },
    { value: 'rating', label: 'Best rated', metric: (p) => attrNum(p, 'review_score') * 100 + p.score },
    { value: 'free', label: 'Free tier first', metric: (p) => freeTierOrdinal(p) * 1000 + p.score },
  ],

  costModel: {
    kind: 'banking',
    amountLabel: 'Representative usage', // ignored — no per-provider dollar-amount dimension (matches trading-platforms.ts)
    amountMin: 0,
    amountMax: 0,
    amountStep: 1,
    amountDefault: 0,
    yearsLabel: 'Time horizon (years)',
    yearsMin: 1,
    yearsMax: 5,
    yearsDefault: 1, // yearly cost is the natural anchor for an ongoing subscription
  },

  compareRows: [
    { key: 'monthly', label: 'Monthly fee', accessor: (p) => (p.monthlyFee === 0 ? 'Free' : `${usd(p.monthlyFee)}/mo`), score: (p) => -p.monthlyFee },
    { key: 'freeTier', label: 'Free tier', accessor: freeTierLabel, score: (p) => freeTierOrdinal(p) },
    { key: 'bureaus', label: 'Bureaus monitored', accessor: (p) => `${attrNum(p, 'bureaus_monitored')}-Bureau`, score: (p) => attrNum(p, 'bureaus_monitored') },
    {
      key: 'insurance',
      label: 'ID theft insurance',
      accessor: (p) => (attrNum(p, 'id_theft_insurance') === 0 ? 'None' : usd(attrNum(p, 'id_theft_insurance'))),
      score: (p) => attrNum(p, 'id_theft_insurance'),
    },
    { key: 'family', label: 'Family plan', accessor: (p) => yesNo(attr(p, 'family_plan')), score: (p) => (attr(p, 'family_plan') ? 1 : 0) },
    // Informational only — FICO vs VantageScore is a preference, not a ranking axis. No `score` prop (matches trading-platforms' cash_sweep_apy precedent).
    { key: 'scoreModel', label: 'Credit score model', accessor: (p) => (attrStr(p, 'score_model') === 'fico' ? 'Real FICO Score' : 'VantageScore') },
    { key: 'bbb', label: 'BBB rating', accessor: bbbLabel, score: bbbOrdinal },
    {
      key: 'rating',
      label: 'Consumer review score',
      accessor: (p) => `${attrNum(p, 'review_score')}/5 (${attrNum(p, 'review_count').toLocaleString('en-US')} ${attrStr(p, 'review_source')} reviews)`,
      score: (p) => attrNum(p, 'review_score'),
    },
  ],

  detailRows: [
    { key: 'regulatory', label: 'Regulatory history', accessor: (p) => attrStr(p, 'regulatory_history_note') || '—' },
    { key: 'monitoring', label: 'Monitoring scope', accessor: (p) => attrStr(p, 'monitoring_scope_note') || '—' },
    { key: 'pricingNote', label: 'Pricing detail', accessor: (p) => attrStr(p, 'monthly_fee_note') || '—' },
    { key: 'freeTierNote', label: 'Free tier detail', accessor: (p) => attrStr(p, 'free_tier_note') || '—' },
    { key: 'insuranceNote', label: 'Insurance detail', accessor: (p) => attrStr(p, 'id_theft_insurance_note') || '—' },
    { key: 'familyPlanNote', label: 'Family plan detail', accessor: (p) => attrStr(p, 'family_plan_note') || '—' },
    { key: 'bbbNote', label: 'BBB detail', accessor: (p) => attrStr(p, 'bbb_rating_note') || attrStr(p, 'bbb_accredited_note') || '—' },
    { key: 'reviewNote', label: 'Review detail', accessor: (p) => attrStr(p, 'review_note') || '—' },
  ],

  verdict: {
    intro: "Our editors' picks for the best US credit monitoring services right now.",
    picks: [
      { slug: 'experian-identityworks', label: 'Best overall' },
      { slug: 'credit-karma', label: 'Best free' },
      { slug: 'aura', label: 'Best for families' },
    ],
  },
  methodology:
    "We compare monthly cost, bureau coverage, ID theft insurance, family-plan availability, free-tier honesty, BBB standing and consumer reviews from each provider's official pricing pages and BBB/consumer-review records, re-verified quarterly. Cost projections use each provider's cheapest plan with three-bureau monitoring at list price, times your chosen time horizon — Credit Karma's $0 is a genuinely free, permanent price (two bureaus, VantageScore, no insurance), not a teaser or a commission-tie artifact the way a $0 trading commission can be; Experian and myFICO also offer real, permanent (if 1-bureau) free tiers. Aura and LifeLock advertise current list prices for monthly billing, but renewal-vs-first-year pricing parity isn't independently confirmed for every provider — check the pricing detail row before committing to a multi-year comparison. We disclose regulatory and litigation history directly on a candidate's card rather than omitting it, including one active, unresolved federal lawsuit (Experian) — phrased as pending with no finding of wrongdoing, never presented as an established violation. Consumer review scores always show the source and count alongside the number; where a platform's sample is too small to be meaningful (as with myFICO's 4-review Trustpilot profile) we disclose that and use a larger, credibly-sourced alternative instead. Rankings never depend on commissions — no candidate in this comparison currently has an affiliate relationship with SmartFinPro.",
  buyerGuide: [
    {
      h3: 'VantageScore vs. FICO Score',
      body: "Credit Karma's free tier shows your VantageScore 3.0, while Experian's and myFICO's free tiers actually include a real FICO 8 — but only for one bureau (Experian and Equifax, respectively). myFICO is the only paid service here that sells the full range of FICO Scores (in over 28 versions, covering the bureaus and score versions most lenders pull for mortgage and auto-loan decisions), where the free tiers only give you one version from one bureau. VantageScore and FICO use different models and can differ by 20+ points for the same person at the same moment, so a free score — VantageScore or a single-bureau FICO 8 — is a useful trend indicator but not a substitute for the specific FICO Score a lender will actually pull.",
    },
    {
      h3: 'Free self-help alternatives',
      body: 'Every US consumer is entitled to a free credit report from each of the three bureaus via AnnualCreditReport.com, and a free security freeze directly with Equifax, Experian and TransUnion. A paid monitoring service buys convenience, consolidated alerts and (on most plans) insurance — not something that is otherwise unavailable for free.',
    },
    {
      h3: 'Monitoring detects, it doesn’t prevent',
      body: 'No service in this comparison can stop identity theft from happening in the first place — monitoring shortens the time between a fraudulent account or hard inquiry appearing and you finding out about it, and the insurance/restoration benefits help with the cleanup afterward. Think of it as a smoke detector, not a fireproof safe.',
    },
    {
      h3: 'Why PrivacyGuard and Identity Guard aren’t ranked here',
      body: "PrivacyGuard offers the cheapest monthly tri-bureau report refresh in the category ($24.99), but it has no Trustpilot profile and its only organic review base (ConsumerAffairs) sits around 1 star on a small sample — not enough to honestly fill a comparison row, especially alongside its parent Trilegiant/Affinion's $30 million, 46-state-plus-DC settlement over deceptive enrollment practices. Identity Guard isn't a separate company — it was acquired by Aura's parent in 2019 and operates as a cheaper sister brand (from $8.99/mo) without Aura's VPN/antivirus bundle. We give one ranked slot per company, not per brand name, so it appears as a note under Aura rather than its own row.",
    },
    {
      h3: "How Credit Karma stays free",
      body: 'Credit Karma is free because it earns revenue when users apply for credit cards or loans offered inside the app — you are shown the product, not billed for the monitoring itself. This is a disclosed business model, not a hidden catch, and the FTC fined Credit Karma $3 million in 2023 for a period when some of those in-app credit-card offers were deceptively marketed as "pre-approved."',
    },
  ],
  faq: [
    {
      q: 'How is the yearly cost calculated?',
      a: "We multiply each provider's monthly fee by 12 and by your chosen time horizon (1-5 years) — there's no separate setup fee or percentage-of-balance charge in this category, just a flat recurring subscription. Move the years slider to see the multi-year total; Credit Karma stays at $0 in every scenario since it's a genuinely free product.",
    },
    {
      q: 'How does SmartFinPro rank credit monitoring services?',
      a: 'Our Smart Rank blends our independent score, cost, insurance coverage and consumer ratings. The order never depends on commissions — none of the 8 services in this comparison currently has an affiliate relationship with SmartFinPro.',
    },
    {
      q: 'Is a free credit monitoring service as good as a paid one?',
      a: "It depends what you need. Credit Karma, Experian's free tier and myFICO's free tier all give you a real, permanently free credit score and basic monitoring — but none of them include ID theft insurance, and Credit Karma only covers two bureaus with VantageScore rather than the FICO Score most lenders actually use. If you want three-bureau coverage, insurance, or real FICO Scores, you'll need a paid plan.",
    },
    {
      q: 'Which service has the highest ID theft insurance?',
      a: "IdentityForce's UltraSecure+Credit plan carries up to $2 million in ID theft insurance, the highest individual-plan figure in this comparison, underwritten through Lloyd's with no deductible. IDShield advertises up to $3 million, but that figure applies to its family plan — its individual plan (the one we compare here) carries $1 million, the same level offered by Aura, LifeLock, Experian, IdentityIQ and myFICO. Credit Karma, being free, includes no insurance at all.",
    },
    {
      q: 'What happened with Experian’s active CFPB lawsuit?',
      a: 'The CFPB sued Experian in January 2025, alleging its dispute-investigation process amounted to "sham investigations" that failed consumers under the Fair Credit Reporting Act. Experian’s motion to dismiss was denied in October 2025, and the case was in discovery per the most recent docket entry we verified (January 2026) — no court has made a finding of wrongdoing, and the case remains active and unresolved as of our July 2026 review. We disclose this directly because Experian is our "Best overall" pick; the litigation doesn’t change its category-leading feature set and genuine free tier, but you should know about it before enrolling.',
    },
    {
      q: 'Are Aura and IdentityIQ safe to use despite their disclosed issues?',
      a: "Both are included with disclosure rather than excluded, because neither issue is the kind that disqualifies a company in our methodology (an adjudicated illegal business model, or manipulated review data). Aura's March 2026 data breach exposed contact information (not SSNs, passwords or financial data, per Aura) for a limited subset of customers, and it disclosed the incident with a documented response plan. IdentityIQ settled an $8.77 million class-action lawsuit over unclear auto-renewal terms — a private settlement with no admission of wrongdoing, not a government enforcement action — and its $1 \"trial\" pre-authorizes your card for the full monthly fee after 7 days, so never treat it as free. Both companies' underlying review bases are intact and unmanipulated.",
    },
  ],
  compliance: {
    notice:
      'Not financial or legal advice · credit monitoring detects fraud after it happens — it does not prevent identity theft. Free self-help alternatives exist: AnnualCreditReport.com for free reports from all three bureaus, and free credit freezes directly with Equifax, Experian and TransUnion.',
    regulators: ['FTC', 'CFPB'],
  },
};
