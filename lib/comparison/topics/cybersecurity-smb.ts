// lib/comparison/topics/cybersecurity-smb.ts
// TopicConfig for "Best Cybersecurity for SMBs" + the Zod schema that guards its
// `attributes` JSONB. Pure module — no React, no server imports.
//
// Like ai-tools-finance.ts (Slice 7), this compares structurally heterogeneous
// product types across 4 security layers — endpoint protection, password
// management, network/SASE, and email security — with 3 incompatible pricing
// units (per-device/year, per-user/month, quote-only). See docs/superpowers/
// plans/2026-07-05-cockpit-cybersecurity-smb-source-matrix.md and
// .../2026-07-05-cockpit-cybersecurity-smb-planned-seed-values.md (incl. §0b,
// the Fable-5 pre-migration review outcome) for full sourcing.
//
// Cost model: reuses `kind: 'banking'` with EVERY candidate seeded at
// `monthlyFee: 0` — the same fix class the Slice-7 pre-migration review found;
// applied preventively here from the start. No specColumn/compareRow declares
// a cost winner — three incompatible units make a single "cheapest" claim
// dishonest.
//
// `review_score`/`review_count` are nullable for 5 of the 9 candidates
// (Sophos, Bitwarden, NordLayer, Check Point SASE, Proofpoint) — reuses the
// exact nullable pattern + shared-UI `reviewCount === 0` guard already shipped
// in Slice 7 (cockpit-card/table/compare). Zero additional shared-code change
// needed this slice.
//
// Attribution Gate: all 15 cybersecurity-adjacent `affiliate_links` rows in
// prod carry `tracking_status = 'unverified'`, so zero `offer` CTAs are
// possible anywhere on this page — every candidate resolves to `review` or
// `visit`, matching every prior slice in this rollout.
//
// Check Point SASE (slug `perimeter-81` in the DB, unchanged) is a relabel-only
// fix this slice: `partner_name` updates to "Check Point SASE (formerly
// Perimeter 81)"; `tracking_status`/`cpa_value` are untouched per the owner's
// standing rule against silently changing tracking status. NordLayer is a new
// cockpit candidate with no DB affiliate_links row of its own — it is
// deliberately NOT aliased to the existing `nordvpn`/`nordvpn-business` CJ
// rows, which point to a consumer VPN product, not NordLayer's business tier.

import { z } from 'zod';
import type { TopicConfig } from './types';
import type { ProductForComparison } from '@/lib/comparison/types';

/** Cybersecurity-SMB-specific facts stored in product_attributes.attributes. Validated per row. */
export const cybersecuritySmbAttributesSchema = z
  .object({
    segment: z.enum(['endpoint_edr', 'password_management', 'network_sase', 'email_security']),
    product_type: z.string(),
    pricing_basis: z.enum(['per_device_year', 'per_user_month', 'quote_based']),
    starting_price_headline: z.string(), // SHORT — feeds the homepage Best-X tile verbatim via specColumns[1]
    starting_price_note: z.string(), // full sentence, detailRow only
    core_features_note: z.string(),
    target_user_note: z.string(),
    mdr_option: z.boolean(),
    analyst_leader: z.boolean(),
    analyst_leader_note: z.string().optional(),
    clean_incident_record: z.boolean(), // drives the matcher directly, not just prose
    review_score: z.number().nullable(),
    review_count: z.number().nullable(),
    review_source: z.string(), // MUST render alongside score+count, never a bare number; user-facing text even when score is null
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
const yesNo = (b: boolean) => (b ? 'Yes' : 'No');

const SEGMENT_LABEL: Record<string, string> = {
  endpoint_edr: 'Endpoint & EDR',
  password_management: 'Password management',
  network_sase: 'Network & SASE',
  email_security: 'Email security',
};

const PRICING_BASIS_LABEL: Record<string, string> = {
  per_device_year: 'Per device / year',
  per_user_month: 'Per user / month',
  quote_based: 'Quote-based',
};

export const cybersecuritySmbConfig: TopicConfig = {
  slug: 'cybersecurity-smb',
  category: 'cybersecurity',
  label: 'Cybersecurity for SMBs',
  h1: (y) => `Best cybersecurity tools for small businesses in ${y}`,
  metaTitle: (y) => `Best Cybersecurity for SMBs (${y}) — Compared`,
  metaDescription: (y) =>
    `Compare the best cybersecurity tools for small businesses in ${y}: endpoint protection, password managers, network and email security — independently tested.`,
  intro:
    'Independent, side-by-side comparison across four security layers — endpoints, passwords, network access, and email — because no SMB buys just one tool, and no single winner exists across all four.',
  publishedDate: '2026-07-05',
  attributesSchema: cybersecuritySmbAttributesSchema,

  specColumns: [
    {
      key: 'segment',
      label: 'Segment',
      accessor: (p) => attrStr(p, 'segment'),
      format: (v) => SEGMENT_LABEL[String(v)] ?? String(v),
      // no winner — informational, matches ai-tools-finance's Segment column precedent
    },
    {
      key: 'price',
      label: 'Starting price',
      accessor: (p) => attrStr(p, 'starting_price_headline'),
      format: (v) => String(v),
      // no winner — 3 incompatible pricing units, no honest cost ordinal exists
    },
    {
      key: 'pricingBasis',
      label: 'Pricing basis',
      accessor: (p) => attrStr(p, 'pricing_basis'),
      format: (v) => PRICING_BASIS_LABEL[String(v)] ?? String(v),
      // no winner — informational only
    },
  ],

  filters: [
    { key: 'endpoint', label: 'Endpoint & EDR', predicate: (p) => attrStr(p, 'segment') === 'endpoint_edr' },
    { key: 'password', label: 'Password management', predicate: (p) => attrStr(p, 'segment') === 'password_management' },
    { key: 'network', label: 'Network & SASE', predicate: (p) => attrStr(p, 'segment') === 'network_sase' },
    { key: 'email', label: 'Email security', predicate: (p) => attrStr(p, 'segment') === 'email_security' },
    { key: 'analystLeader', label: 'Analyst-recognized leader', predicate: (p) => attr(p, 'analyst_leader') },
  ],

  priorityChips: [
    { id: 'endpoint', label: 'Best for endpoint protection', icon: 'Shield', sort: 'endpoint' },
    { id: 'password', label: 'Best password manager', icon: 'KeyRound', sort: 'password' },
    { id: 'network', label: 'Best network/SASE', icon: 'Network', sort: 'network' },
    { id: 'email', label: 'Best email security', icon: 'Mail', sort: 'email' },
    { id: 'rating', label: 'Top rated', icon: 'Star', sort: 'rating' },
  ],

  matcher: [
    {
      id: 'segment',
      label: 'What do you need to protect?',
      weight: 16,
      options: [
        { value: 'endpoint', label: 'Devices & endpoints' },
        { value: 'password', label: 'Passwords & logins' },
        { value: 'network', label: 'Network access (remote/hybrid teams)' },
        { value: 'email', label: 'Email & phishing' },
      ],
      award: (p, a) => {
        const map: Record<string, string> = {
          endpoint: 'endpoint_edr',
          password: 'password_management',
          network: 'network_sase',
          email: 'email_security',
        };
        return { matched: attrStr(p, 'segment') === map[a], reason: 'Matches your use case' };
      },
    },
    {
      id: 'mdr',
      label: 'Do you want a managed detection & response (MDR) option, not just software?',
      weight: 10,
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: "Doesn't matter" },
      ],
      award: (p, a) => (a === 'yes' ? { matched: attr(p, 'mdr_option'), reason: 'Managed MDR option available' } : { matched: true }),
    },
    {
      id: 'cleanRecord',
      label: 'Prefer a vendor with no security incidents or major outages on record?',
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
    { value: 'endpoint', label: 'Best for endpoint protection', metric: (p) => (attrStr(p, 'segment') === 'endpoint_edr' ? 1000 : 0) + p.score },
    { value: 'password', label: 'Best password manager', metric: (p) => (attrStr(p, 'segment') === 'password_management' ? 1000 : 0) + p.score },
    { value: 'network', label: 'Best network/SASE', metric: (p) => (attrStr(p, 'segment') === 'network_sase' ? 1000 : 0) + p.score },
    { value: 'email', label: 'Best email security', metric: (p) => (attrStr(p, 'segment') === 'email_security' ? 1000 : 0) + p.score },
    { value: 'rating', label: 'Top rated', metric: (p) => (attrNumOrNull(p, 'review_score') ?? 0) * 100 + p.score },
  ],

  costModel: {
    kind: 'banking',
    amountLabel: 'Representative usage', // ignored — matches ai-tools-finance/trading-platforms pattern
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
    { key: 'pricingBasis', label: 'Pricing basis', accessor: (p) => PRICING_BASIS_LABEL[attrStr(p, 'pricing_basis')] ?? '—' }, // informational only
    { key: 'segment', label: 'Segment', accessor: (p) => SEGMENT_LABEL[attrStr(p, 'segment')] ?? '—' }, // informational only
    { key: 'mdrOption', label: 'Managed MDR option', accessor: (p) => yesNo(attr(p, 'mdr_option')) }, // informational only — different products, a single Yes doesn't make others unfair
    { key: 'analystLeader', label: 'Analyst recognition', accessor: (p) => attrStr(p, 'analyst_leader_note') || '—' }, // informational only — not comparable across segments
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
    { key: 'coreFeaturesNote', label: 'Core features', accessor: (p) => attrStr(p, 'core_features_note') || '—' },
    { key: 'targetUserNote', label: 'Best for', accessor: (p) => attrStr(p, 'target_user_note') || '—' },
    { key: 'regulatoryNote', label: 'Regulatory history', accessor: (p) => attrStr(p, 'regulatory_history_note') || '—' },
    { key: 'reviewNote', label: 'Review detail', accessor: (p) => attrStr(p, 'review_note') || '—' },
    { key: 'editorialConsensusNote', label: 'Editorial consensus', accessor: (p) => attrStr(p, 'editorial_consensus_note') || '—' },
  ],

  verdict: {
    intro:
      "Nine tools, four security layers — endpoints, passwords, network access, and email. Most SMBs need one tool per layer, not a single winner. Our top pick, CrowdStrike, is the strongest analyst-backed choice on this page — but it leans enterprise; smaller teams without dedicated security staff may prefer Bitdefender.",
    picks: [
      { slug: 'crowdstrike', label: 'Best overall / best brand-name EDR' },
      { slug: 'bitdefender', label: 'Best endpoint protection for most SMBs' },
      { slug: 'sentinelone', label: 'Best autonomous EDR' },
      { slug: 'sophos', label: 'Best with a managed MDR option' },
      { slug: 'onepassword', label: 'Best business password manager' },
      { slug: 'bitwarden', label: 'Best value password manager' },
      { slug: 'nordlayer', label: 'Best business VPN/ZTNA entry point' },
      { slug: 'perimeter-81', label: 'Best full SASE platform' },
      { slug: 'proofpoint', label: 'Best email security' },
    ],
  },
  methodology:
    "These nine tools protect four different layers of a small business — endpoints, passwords, network access, and email — so we don't force them into a single price-based ranking. \"Starting price\" shows each vendor's cheapest SMB-suitable plan in its own unit (per device or per user, per year or per month) alongside a \"pricing basis\" label; these are not like-for-like dollar figures, and two vendors (Sophos, Check Point SASE) only sell through a sales-assisted quote. We rank within each of the four segments using analyst consensus (Gartner Magic Quadrant, G2 Grid), a credible review sample where one exists, and editorial roundup consensus — not a cross-category cost comparison. Where a candidate lacks a credible, independently confirmed review score (Sophos, Bitwarden, NordLayer, Check Point SASE, Proofpoint), we say so rather than borrow an unrelated number. Even top-rated vendors have had real incidents — from CrowdStrike's July 2024 global outage to SEC settlements against Check Point and Mimecast — and we disclose them on the relevant cards rather than omit them. Rankings never depend on commissions — every link on this page currently resolves to a review or a plain visit, never a tracked paid referral.",
  buyerGuide: [
    {
      h3: "Why isn't there one overall winner?",
      body: "This page compares endpoint protection, password managers, network/SASE tools, and email security side by side, but they solve different problems for different budgets. Comparing a $59.99/device/year CrowdStrike plan to a $4/user/month Bitwarden seat as if they were the same kind of purchase would be misleading — use the segment filters to compare within your actual use case, and expect to buy more than one of these categories, not just the single top-ranked tool.",
    },
    {
      h3: 'Proofpoint vs. Mimecast: when the cheaper, simpler option wins',
      body: "Mimecast isn't ranked on this page — it has no SmartFinPro content or link, and Proofpoint's December 2025 acquisition of the SMB-focused Hornetsecurity ($1.8B, its largest deal ever) narrowed the price/simplicity gap that used to favor Mimecast for smaller teams. Mimecast still has a credible review base (G2 4.3/5 from roughly 470 sellers) and remains SMB-friendlier than Proofpoint's enterprise-first core product for teams that want simpler administration — but it also carries its own disclosures: an October 2024 SEC civil settlement ($990,000, the same day and same type of settlement Check Point received) and a January 2021 certificate compromise attributed to the same SolarWinds-era state actors (SVR/NOBELIUM).",
    },
    {
      h3: 'Layer your defenses',
      body: 'Most SMBs need at least two or three of these categories together — an endpoint tool, a password manager, and either network or email security depending on how the team works — not a single "best" tool covering everything. None of the nine tools on this page does more than one of these four jobs well.',
    },
    {
      h3: "CrowdStrike's July 2024 outage, explained",
      body: 'On July 19, 2024, a faulty content update to CrowdStrike\'s Falcon sensor caused a global IT outage affecting airlines, banks, hospitals, and emergency services. As of January 2026: a shareholder lawsuit was dismissed (the court found plaintiffs had not shown intent to deceive), Delta Air Lines\' roughly $500M lawsuit is still active, and a dismissed passenger class action is on appeal. This was a service outage, not a data breach — CrowdStrike\'s detection technology and its seven-year run as a Gartner Magic Quadrant Leader were not affected by it.',
    },
    {
      h3: 'Microsoft Defender for Business: the bundled option',
      body: "Microsoft Defender for Business ships bundled with many Microsoft 365 Business plans and shows up in nearly every SMB security roundup as the \"you may already have this\" option. It isn't a ranked candidate here — SmartFinPro has no review or affiliate relationship for it — but it's worth checking what your existing Microsoft 365 plan already includes before buying a separate endpoint tool.",
    },
  ],
  faq: [
    {
      q: 'Why are there no price comparisons across all nine tools?',
      a: "It isn't a meaningful number for this category. These nine tools use three fundamentally different pricing structures — per device per year, per user per month, and quote-only sales cycles — so a single dollar figure would misrepresent the real cost. Instead, we show each tool's starting price with its pricing basis labeled, and let you filter and sort by security layer instead.",
    },
    {
      q: "Which of these tools has a managed (MDR) option if I don't have in-house security staff?",
      a: 'Sophos and CrowdStrike (via Falcon Complete) both offer a managed detection-and-response service, where the vendor\'s own team handles monitoring and response rather than your team running the software alone. Use the "managed MDR option" matcher question to filter for this directly.',
    },
    {
      q: 'Is Check Point SASE the same product as Perimeter 81?',
      a: "Yes. Check Point acquired Perimeter 81 in September 2023 for roughly $490 million. The product was renamed twice since (briefly \"Quantum SASE,\" then \"Harmony SASE\") and is now called Check Point SASE — its features were substantially expanded after the acquisition, not discontinued, though it lost its self-service pricing and now sells through a demo-based sales cycle.",
    },
    {
      q: 'Are any of these affiliate links?',
      a: 'Check Point SASE, formerly Perimeter 81, has an affiliate relationship in our system. But no click from this page is currently attributed as a paid referral — every button on this page resolves to a review or a plain visit link, and rankings never depend on commissions.',
    },
    {
      q: "Why doesn't this page include Mimecast or Microsoft Defender as ranked candidates?",
      a: "Mimecast is covered in the buyer's guide instead of a ranked slot — Proofpoint's late-2025 acquisition of the SMB-focused Hornetsecurity narrowed the gap that used to favor Mimecast for smaller teams, and SmartFinPro has no content or link for it. Microsoft Defender for Business is mentioned as the \"you may already have this\" bundled option, but it isn't a ranked candidate for the same reason.",
    },
    {
      q: 'Has any tool on this page had a security incident?',
      a: "Yes, several — disclosed directly on the relevant cards rather than omitted. CrowdStrike had a 2024 service outage (not a data breach); Check Point and Proofpoint's parent companies have their own disclosed incidents; NordLayer's parent company (Nord Security) disclosed a 2018 consumer-product server compromise. A security vendor having a disclosed incident is common in this industry and isn't treated as disqualifying unless it reflects a pattern of enforcement action.",
    },
  ],
  compliance: {
    notice:
      "Cybersecurity tools are not regulated financial products, and no financial regulator endorses these rankings. Even top-rated vendors have had real incidents — from CrowdStrike's July 2024 global outage to breaches and SEC settlements at security vendors themselves. Layer your defenses, and verify current SOC 2/ISO 27001 attestations directly with each vendor before buying.",
    regulators: [],
  },
};
