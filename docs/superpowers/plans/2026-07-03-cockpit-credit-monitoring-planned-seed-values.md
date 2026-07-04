# Slice 6 — Planned TopicConfig Design + Seed Values (pre-migration draft)

> Written by the controlling (Sonnet) session, translating the Fable-5 source matrix
> (`2026-07-03-cockpit-credit-monitoring-source-matrix.md`) into concrete schema + seed
> values, with the 6 flagged pre-seed manual verifications (source matrix §7) resolved
> below in §11 via direct WebSearch/WebFetch. **Nothing here has been written to code or
> the database yet.** This is the input for the mandatory Fable-5 pre-migration review
> checkpoint (required — this is the most compliance-sensitive topic of the rollout so
> far per the source matrix's own assessment).

## 0a. Fable-5 pre-migration review outcome: APPROVE WITH 12 CHANGES (applied below)

No blocking concerns — the cost model was code-verified as an honest collapse to
`monthlyFee×12×years`, and all 5 disclosure calls (IdentityIQ/LifeLock/Experian/Credit
Karma/IdentityForce-parent) plus the PrivacyGuard-exclusion and Identity-Guard-no-slot
calls were confirmed correctly calibrated against the source matrix. 12 changes applied:

1. **Invented `bbb_accredited: true` for Experian and Credit Karma — both corrected to
   `false`.** Neither is a BBB-accredited business (independently re-verified via direct
   BBB WebFetch below). An F/B- grade alongside `accredited: true` is an internal
   contradiction that should have been self-flagging. Aura (A+, accredited) and myFICO
   (A+, accredited) verified genuinely true and stand as-is.
2. **Experian's `bbb_rating` re-verified directly (not blind-seeded from the source
   matrix's 03.07 snapshot):** confirmed **F** stands (35 unanswered + 78 unresolved
   complaints, not accredited) — matches the matrix, no change to the letter grade
   itself, only to `bbb_accredited` (change 1).
   **Credit Karma's `bbb_rating` corrected from the matrix's `F` to `B-`** — a fresh
   direct BBB fetch (`source_type: regulator`, `confidence: high`) shows B- (2,579
   complaints, not accredited), superseding the matrix's F snapshot.
3. **Two false `best_for` superlatives corrected:** IdentityIQ's "Lowest-price 3-bureau
   entry" is false (LifeLock $19.99 and IDShield $19.95 are both cheaper 3-bureau plans)
   — replaced with its real, honest USP: **"$1M insurance at every tier"** (its $8.49
   entry plan includes the same $1M coverage as its top tier, unlike every competitor
   that gates insurance by tier). IDShield's "Best restoration + coverage" is corrected
   to **"Best restoration (licensed private investigators)"** since the coverage half
   died with the §11.6 $1M-not-$3M correction.
4. **Credit Karma `family_plan` corrected from `n/a` to `false`** (schema is
   `z.boolean()`, `n/a` would fail Zod validation) + `family_plan_note: 'Free individual
   accounts — no family tier concept'`.
5. **New schema field `monthly_fee_note: z.string().optional()`** added to §2 — carries
   Aura's renewal-parity-unconfirmed caveat and LifeLock's "Feb-2026 restructure prices
   at renewal parity; legacy plans renewed ~40-70% higher" note, so the seeded prices
   don't read as unconditional guarantees.
6. **`compareRows`/`detailRows` were missing entirely** (required, non-optional
   `TopicConfig` fields per `types.ts`) — added in new §6a below.
7. **IDShield `id_theft_insurance_note` must disclose a genuine cross-source structure
   conflict**: some sources state "$1M individual / $3M family" (used as the seed),
   others describe "up to $3M on all plans with a $1M stolen-funds sub-limit,
   AIG-underwritten." The conservative $1M individual seed stands; the note discloses
   both readings.
8. **Experian's pending-suit disclosure must be date-stamped** ("as of March 2026,
   discovery ongoing") and must appear directly on the top-pick card copy/deep_dive
   (not buried only in a detail row) — naming an active-CFPB-litigation defendant "Best
   overall" is only defensible with adjacent, visible disclosure.
9. **myFICO `review_note` needs dual disclosure**: Trustpilot's n=4 sample explicitly
   rejected as too small (same rule as Slice 5's Sky Blue Credit), AND Reviews.io is a
   merchant-invited platform that structurally skews higher than organic Trustpilot —
   both caveats, not just the substitution. Aura's `review_note` gets the same
   channel-caveat treatment as Experian's row: its organic BBB customer-review channel
   (1.11/5 from 115 reviews, 198 complaints/3yrs) diverges sharply from its curated
   Trustpilot 4.3 — both are disclosed, not just the flattering one.
10. **Matcher entries were missing the required `options` array** (`MatcherQuestionDef`)
    — added standard `yes`/"Doesn't matter" pairs to all three questions in §6.
11. **`display_order` realigned to the score-derived order** (was following the source
    matrix's presentation order instead): Experian(1) · Aura(2) · LifeLock(3) ·
    IDShield(4) · myFICO(5) · IdentityForce(6) · Credit Karma(7) · IdentityIQ(8) — this
    also correctly lands IdentityIQ last, matching Urteil 1's position-cap instruction
    ("the thinnest editorial consensus... position accordingly"). §11 cross-references
    to "§11.5" for Trustpilot-count resolutions corrected to §11.3 throughout.
12. **Image asset + manifest note carried into the implementation checklist**:
    `/public/images/comparison/credit-monitoring.webp` needed (manifest entry already
    exists in `manifest.ts` — only the image file itself is outstanding).

## 0. Ranked field: 8 candidates (per Fable-5 recommendation, not re-litigating)

Aura · LifeLock · IdentityForce · Experian IdentityWorks · IdentityIQ · myFICO · IDShield
· Credit Karma. PrivacyGuard is excluded (no defensible consumer-review basis — no
Trustpilot profile, ~1-star ConsumerAffairs on a tiny sample — plus its Trilegiant/
Affinion parent's $30M/46-state deceptive-enrollment settlement has no compensating
strength the way LifeLock/Experian's market leadership does); mentioned in buyerGuide
only. Identity Guard gets no slot (it *is* Aura — acquired 2019, same corporate product
line; a second slot would be false diversity); mentioned as a footnote under Aura's
`deepDive`. No backfill to 9 (Forex 7→5, Credit Repair 9→6 precedent: a fully-sourced
8-row field beats a padded 9th).

## 1. Cost model — existing `banking` kind, ZERO shared-code change

Credit monitoring is an unbounded, ongoing monthly subscription (unlike Credit Repair's
fixed-length program) — `banking`'s `annualCost = monthlyFee×12 + fxSpend-term +
atmFee-term` collapses honestly to `monthlyFee × 12 × years` once `fx_fee_pct` and
`atm_fee` are seeded at 0 (both unused/undefined for every row → default 0 at the DB
level), matching the `trading-platforms.ts` "amount-hidden banking cost model" pattern
exactly. `monthly-plus-setup` (Slice 5's kind) was considered and rejected: its months
dial (3-12) implies an ending program, but monitoring subscriptions run indefinitely; a
dead all-$0 setup-fee column would be the same unhonest-UI smell Slice 5 itself flagged
for cost-model misuse.

**Unlike `trading-platforms`, `cost` IS enabled as a sort option / priority chip here** —
the spread is real information ($0 to $2,094 over 5 years), not a dead 9-way tie:

| Provider (seed plan, cheapest 3-bureau tier where available) | Monthly | 1yr | 3yr | 5yr |
|---|---|---|---|---|
| Credit Karma (free, 2-bureau) | **$0** | $0 | $0 | $0 |
| Aura Individual | $15.00 | $180 | $540 | $900 |
| LifeLock Advanced | $19.99 | $240 | $720 | $1,199 |
| IDShield Individual 3-Bureau | $19.95 | $239 | $718 | $1,197 |
| IdentityIQ Secure Pro | $22.99 | $276 | $828 | $1,379 |
| Experian IdentityWorks Premium | $24.99 | $300 | $900 | $1,499 |
| myFICO Advanced | $29.95 | $359 | $1,078 | $1,797 |
| IdentityForce UltraSecure+Credit | $34.90 | $419 | $1,256 | $2,094 |

```ts
costModel: {
  kind: 'banking',
  amountLabel: 'Representative usage', // ignored — no per-provider dollar-amount dimension (matches trading-platforms)
  amountMin: 0, amountMax: 0, amountStep: 1, amountDefault: 0,
  yearsLabel: 'Time horizon (years)',
  yearsMin: 1, yearsMax: 5, yearsDefault: 1, // 1yr is the natural anchor for a subscription (vs 3yr for banking/robo)
},
```

**Free-tier honesty (the core requirement of this slice):** Credit Karma's $0 is a real,
permanent price (not a teaser) and a genuine differentiator, alongside real (if
1-bureau) free tiers at Experian and myFICO. Two mandatory measures, both included below:
(1) a `compareRows` "Free tier" row (tri-state text, not just a filter) so it reads
honestly at a glance; (2) a `methodology` paragraph explicitly stating the $0s are real
prices, not commission-tie artifacts, and flagging that Aura/LifeLock intro pricing may
rise at renewal (§11.1 below).

## 2. Attribute schema (JSONB `attributes`, Zod-validated)

```ts
export const creditMonitoringAttributesSchema = z.object({
  free_tier: z.enum(['none', 'partial', 'full']), // full = Credit Karma (entire product), partial = Experian/myFICO (1-bureau free layer)
  free_tier_note: z.string().optional(),
  bureaus_monitored: z.number(), // bureau count of the SEEDED plan: 1, 2, or 3
  monitoring_scope_note: z.string(),
  monthly_fee_note: z.string().optional(), // (§0a-5) intro-vs-renewal caveats (Aura/LifeLock); annual-vs-monthly-billing caveats (IdentityIQ)
  id_theft_insurance: z.number(), // headline $ of the SEEDED (individual) plan; 0 = none (Credit Karma)
  id_theft_insurance_note: z.string().optional(),
  family_plan: z.boolean(),
  family_plan_note: z.string().optional(), // (§0a-4) e.g. Credit Karma's "free individual accounts, no family tier concept"
  bbb_rating: z.string().nullable(), // null = IdentityIQ only (BBB profile "being updated, no report available")
  bbb_rating_note: z.string().optional(),
  bbb_accredited: z.boolean(),
  bbb_accredited_note: z.string().optional(),
  review_score: z.number(),
  review_count: z.number(),
  review_source: z.string(), // MUST render alongside score+count, never a bare number
  review_note: z.string().optional(),
  score_model: z.enum(['fico', 'vantagescore', 'none']), // myFICO's core USP vs Credit Karma's core weakness
  regulatory_history_note: z.string(), // disclose even when clean — "no actions found" is itself a fact
}).passthrough();
```

Top-level fields reused as-is: `monthlyFee` (recurring subscription fee), `fxFeePct`/
`atmFee` seeded at 0 (drive the `banking` cost model to the honest `monthlyFee×12×years`
collapse), `accountMinimum`/`managementFee` unused (0, no deposit/AUM concept here),
`rating`/`reviewCount` mirror `attributes.review_score`/`review_count` at the top level
(existing convention from prior topics), `review_slug` (null for all 8 — no existing
review MDX per source-matrix Befund #8), `external_url`, `is_affiliate` (false for all
8 — no `affiliate_links` rows exist, §5 below), `score`, `display_order`, `is_top_pick`,
`best_for`, `source_type`, `confidence`, `data_verified_at`.

## 3. specColumns (4 headline columns, per Fable-5 source matrix's own recommendation)

1. **Monthly price** — `p.monthlyFee`, format `$X.XX/mo`, `winner: 'min'`, sortKey `cost`.
2. **Bureaus monitored** — `attributes.bureaus_monitored`, ordinal (3 > 2 > 1), `winner: 'max'`.
3. **ID theft insurance** — `attributes.id_theft_insurance`, format `$X` or `'None'` if 0, `winner: 'max'`.
4. **Free tier** — ordinal (`full` > `partial` > `none`), `winner: 'max'`, format renders the tri-state label.

## 4. Attribution gate — 0 affiliate links, all `external_url` visit CTAs

DB-verified 2026-07-03 via `mcp__smartfinpro__list_affiliate_links` (72 rows total):
**zero** rows match any of the 10 researched candidates, in `personal-finance` or any
other category. All 8 ranked candidates get `is_affiliate: false`, `external_url` set to
the bare official homepage (never a tracked link, standing rule since Slice 3), no
`affiliate_links` rows created (Guardrail 6). `ctaMode` resolves to `'visit'` for all 8
(no `review_slug` exists for any candidate — Befund #8, no prior review content).
**Monetization is a follow-up task, not a slice blocker**: real affiliate programs exist
(Experian CJ/Awin ~$12-31, Aura direct ~$65+, LifeLock Impact 20%, IdentityForce CJ $35,
myFICO CJ/ShareASale up to $100) — pursue only after network-link + SubID + postback
verification per the Mercury pattern; IdentityIQ (Awin ~$40) only after explicit owner
sign-off given its disclosure obligations (§11.2 below).

## 5. Per-candidate seed values

| Field | Aura | LifeLock | IdentityForce | Experian IdentityWorks | IdentityIQ | myFICO | IDShield | Credit Karma |
|---|---|---|---|---|---|---|---|---|
| `display_order` (§0a-11, score-aligned) | 2 | 3 | 6 | **1** | 8 | 5 | 4 | 7 |
| `is_top_pick` | false | false | false | **true** | false | false | false | false |
| `best_for` (§0a-3) | Best for families | Best brand recognition | Highest insurance coverage | Best overall | **$1M insurance at every tier** | Real FICO scores | **Best restoration (licensed private investigators)** | Best free |
| `score` | 9.0 | 8.6 | 7.8 | 9.2 | 7.2 | 8.0 | 8.4 | 7.6 |
| `monthlyFee` (seed plan) | 15.00 (Individual) | 19.99 (Advanced, 3B) | 34.90 (UltraSecure+Credit) | 24.99 (Premium) | 22.99 (Secure Pro, monthly billing — §11.2) | 29.95 (Advanced) | 19.95 (Individual 3-Bureau) | **0** |
| `attributes.monthly_fee_note` (§0a-5, new field) | Current monthly-billing list price; renewal-vs-intro parity is not confirmed by third-party sources (§11.1) | Feb-2026 plan restructure prices at renewal parity for new plans; legacy pre-2026 plans renewed ~40-70% higher | — | — | Official site lists annual-billing equivalents ($21.49); $22.99 is the real monthly-billing rate (§11.2) | — | — | — |
| `attributes.free_tier` | none | none | none | **partial** | none | **partial** | none | **full** |
| `attributes.bureaus_monitored` | 3 | 3 | 3 | 3 | 3 | 3 | 3 | **2** |
| `attributes.id_theft_insurance` | 1,000,000 | 1,000,000 | **2,000,000** (highest) | 1,000,000 | 1,000,000 | 1,000,000 | 1,000,000 (individual — §11.6, NOT the $3M family figure) | **0** |
| `attributes.id_theft_insurance_note` | — | Million Dollar Protection Package; stolen-funds reimbursement sub-limit is $5k on Advanced (not the full $1M) | Lloyd's-underwritten, no deductible; UltraSecure (no-credit tier) is $1M, not $2M | — | $1M in ALL plans incl. the $8.49 entry tier — the field's best price-to-insurance ratio | Includes 24/7 restoration; sub-limits apply (e.g. $10k unauthorized EFTs) per policy FAQ | **(§0a-7) Sources conflict: some describe "$1M individual / $3M family" (seeded), others "up to $3M on all plans with a $1M stolen-funds sub-limit" (AIG-underwritten) — confirm directly with IDShield before enrolling** | — |
| `attributes.family_plan` | true | true | true | true | false | **false** | true | **false** (§0a-4, corrected from `n/a`) |
| `attributes.family_plan_note` | — | — | — | — | — | — | — | Free individual accounts — no family tier concept |
| `attributes.bbb_rating` | A+ | **A+** (§0a-2/§11.4 resolved) | **NR** (§0a-2/§11.4 resolved — explicitly "not a BBB Accredited Business") | F (§0a-2, re-verified directly) | **null** (§11 Urteil 1 — in-flux, not A+) | A+ | A+ | **B-** (§0a-2, corrected from matrix's stale F snapshot via direct BBB re-fetch) |
| `attributes.bbb_accredited` | true | true | false | **false** (§0a-1, corrected from an invented `true`) | true (since 2026-05-13, 7 weeks old — footnoted) | true | true (since 1995 — longest in field) | **false** (§0a-1, corrected from an invented `true`) |
| `attributes.review_score`/`_count`/`_source` | 4.3 / 1,103 / Trustpilot (§11.3) | 4.8 / 13,668 / Trustpilot | 3.5 / 904 / Trustpilot (§11.3 — count confirmed, score conflict disclosed in note) | 4.1 / ~94,000 / Trustpilot (paying-customer caveat — §7) | 3.9 / 424 / Trustpilot (§11.3) | **4.8 / 114 / Reviews.io** (§11.3 — Trustpilot's own n=4 sample rejected as too small, same rule that rejected Sky Blue Credit's n=2 in Slice 5) | 4.7 / 673 / Trustpilot (§11.3) | 1.2 / 875 / Trustpilot (US profile specifically — UK/CA profiles are separate, larger, and NOT this product) |
| `attributes.review_note` (§0a-9) | (§0a-9) Organic BBB customer reviews are far harsher: 1.11/5 from 115 reviews, 198 complaints/3yrs — Trustpilot's curated 4.3 and BBB's organic 1.11 are both disclosed | — | — | Experian is a paying Trustpilot customer with active reputation management (99% of negative reviews answered within 48h); organic channels (BBB/ConsumerAffairs) score markedly worse | — | (§0a-9) Trustpilot sample (n=4) rejected as too small to be meaningful — same rule that rejected Sky Blue Credit's n=2 sample in Slice 5; Reviews.io is a merchant-invited platform that structurally skews higher than organic Trustpilot, so 4.8/114 should be read as a curated, not fully independent, figure | — | US Trustpilot profile only (875) — sharply worse than app-store ratings (millions of positive reviews); both channels disclosed |
| `attributes.score_model` | vantagescore | vantagescore | vantagescore | fico | vantagescore | **fico** (only one) | vantagescore | vantagescore |
| `is_affiliate` | false (no link) | false | false | false | false | false | false | false |
| `review_slug` | null | null | null | null | null | null | null | null |
| `external_url` (ALL 8, standing rule) | `https://www.aura.com/` | `https://lifelock.norton.com/` | `https://www.identityforce.com/` | `https://www.experian.com/protection/` | `https://www.identityiq.com/` | `https://www.myfico.com/` | `https://www.idshield.com/` | `https://www.creditkarma.com/` |
| resulting `ctaMode` | visit | visit | visit | visit | visit | visit | visit | visit |

**(§0a-8) Experian's top-pick card requirement:** because Experian carries the "Best
overall" `is_top_pick` badge, its `regulatory_history_note`/`deep_dive` copy must
date-stamp the active CFPB suit ("as of March 2026, discovery ongoing — no finding of
wrongdoing has been made") and this disclosure must be visible directly on the
candidate card (deep_dive/cons), not buried only in a `detailRows` note — naming an
active-CFPB-litigation defendant "Best overall" is only defensible with adjacent,
visible disclosure at implementation time.

All `*_note` fields carry the full caveat text from the source matrix + §11 resolutions
(intro-vs-renewal pricing, BBB freshness/parent-profile caveats, Trustpilot
paying-customer/reputation-management caveats, regulatory settlements) — not duplicated
here in full; see the source matrix + §11 for verbatim text going into the migration.

**Disclosure requirements carried into `regulatory_history_note`/`deep_dive`/`cons`
(Freedom-Debt-Relief pattern — disclose, don't exclude, per source matrix Urteil 1):**
- **IdentityIQ**: $8.77M Caldwell v. Identity Intelligence Group class-action settlement
  (CA Automatic Renewal Law, class period 2019-03-22 to 2023-08-20, final approval
  2025-09-19) + ongoing billing-complaint pattern. $1 trial NEVER labeled "free" anywhere
  (card copy, alt text, JSON-LD) — it's a pre-authorized $1 charge that converts to full
  price after 7 days.
- **LifeLock**: FTC $12M settlement (2010, deceptive "guarantees") + FTC $100M contempt
  settlement (2015, largest FTC order-enforcement amount in agency history at the time)
  for violating the 2010 order. 11 years clean since; ownership changed (Symantec/Norton
  2017, now Gen Digital).
- **Experian**: CFPB $3M (2017, deceptive credit-score marketing) + DOJ/FTC $650K CAN-SPAM
  (2023) + **active** CFPB v. Experian FCRA suit ("sham investigations" of disputes,
  filed 2025-01-07, motion to dismiss denied 2025-10-22, discovery ongoing as of
  2026-01-26) — phrased as "pending, no finding" per the source matrix's explicit
  instruction, never as an established violation.
- **Credit Karma**: FTC $3M consent order (finalized Jan 2023) for deceptive
  "pre-approved" credit-card dark patterns (Feb 2018-Apr 2021). The $0 price IS the
  monetization mechanism (lead-gen to lenders) — explained plainly in buyerGuide, not
  hidden.
- **Aura**: March 2026 data breach (~900K contact records, vishing + ShinyHunters,
  <20K active + <15K former customers with any real exposure, no SSN/passwords/financial
  data per Aura) — disclosed in `cons` despite being ironic for an identity-protection
  vendor; Aura's incident response is also noted (transparency cuts both ways).
- **IdentityForce**: parent TransUnion's CFPB consent order (Jan 2017, $13.9M restitution
  + $3M penalty) + a 2022 CFPB dark-patterns suit **dismissed with prejudice
  2025-02-28** (no re-filing possible, no payment, no admission) — attributed to the
  *parent*, not the product, per the source matrix's explicit instruction.

## 6. filters / priorityChips / sortOptions / matcher

```ts
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

sortOptions: [
  { value: 'smart', label: 'Smart rank', metric: (p) => p.score },
  { value: 'cost', label: 'Lowest yearly cost', metric: () => 0 }, // special-cased in orderProducts
  { value: 'insurance', label: 'Highest ID theft insurance', metric: (p) => attrNum(p, 'id_theft_insurance') / 1000 + p.score },
  { value: 'rating', label: 'Best rated', metric: (p) => attrNum(p, 'review_score') * 100 + p.score },
  { value: 'free', label: 'Free tier first', metric: (p) => freeTierOrdinal(p) * 1000 + p.score },
],

matcher: [
  { id: 'budget', label: 'Want a genuinely free option?', weight: 14,
    options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: "Doesn't matter" }],
    award: (p, a) => a === 'yes' ? { matched: attrStr(p, 'free_tier') === 'full', reason: 'Completely free' } : { matched: true } },
  { id: 'family', label: 'Need to cover your whole family?', weight: 12,
    options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: "Doesn't matter" }],
    award: (p, a) => a === 'yes' ? { matched: attr(p, 'family_plan'), reason: 'Family plan available' } : { matched: true } },
  { id: 'fico', label: 'Want the real FICO Score lenders use?', weight: 10,
    options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: "Doesn't matter" }],
    award: (p, a) => a === 'yes' ? { matched: attrStr(p, 'score_model') === 'fico', reason: 'Real FICO Score' } : { matched: true } },
],
```

`freeTierOrdinal`: `full`→2, `partial`→1, `none`→0 (mirrors the `bbbOrdinal`/
`guaranteeOrdinal` local-const pattern from `credit-repair-companies.ts`). **(§0a-10)**
`options` arrays added to all 3 matcher questions — the design draft omitted them, but
`MatcherQuestionDef.options` is required (`types.ts`); would not have compiled.

## 6a. compareRows / detailRows (§0a-6 — required fields, missing from the initial draft)

```ts
compareRows: [
  { key: 'monthly', label: 'Monthly fee', accessor: (p) => p.monthlyFee === 0 ? 'Free' : `${usd(p.monthlyFee)}/mo`, score: (p) => -p.monthlyFee },
  { key: 'freeTier', label: 'Free tier', accessor: (p) => freeTierLabel(p), score: (p) => freeTierOrdinal(p) },
  { key: 'bureaus', label: 'Bureaus monitored', accessor: (p) => `${attrNum(p, 'bureaus_monitored')}-Bureau`, score: (p) => attrNum(p, 'bureaus_monitored') },
  { key: 'insurance', label: 'ID theft insurance', accessor: (p) => attrNum(p, 'id_theft_insurance') === 0 ? 'None' : usd(attrNum(p, 'id_theft_insurance')), score: (p) => attrNum(p, 'id_theft_insurance') },
  { key: 'family', label: 'Family plan', accessor: (p) => yesNo(attr(p, 'family_plan')), score: (p) => (attr(p, 'family_plan') ? 1 : 0) },
  { key: 'scoreModel', label: 'Credit score model', accessor: (p) => attrStr(p, 'score_model') === 'fico' ? 'Real FICO Score' : 'VantageScore' }, // informational only — NOT a "better/worse" axis, no `score` prop (matches trading-platforms' cash_sweep_apy precedent)
  { key: 'bbb', label: 'BBB rating', accessor: (p) => bbbLabel(p), score: bbbOrdinal }, // null → '—' (in-flux, e.g. IdentityIQ), distinct from the real 'NR' status (IdentityForce)
  { key: 'rating', label: 'Consumer review score', accessor: (p) => `${attrNum(p, 'review_score')}/5 (${attrNum(p, 'review_count')} ${attrStr(p, 'review_source')} reviews)`, score: (p) => attrNum(p, 'review_score') },
],

detailRows: [
  { key: 'regulatory', label: 'Regulatory history', accessor: (p) => attrStr(p, 'regulatory_history_note') || '—' },
  { key: 'monitoring', label: 'Monitoring scope', accessor: (p) => attrStr(p, 'monitoring_scope_note') || '—' },
  { key: 'pricingNote', label: 'Pricing detail', accessor: (p) => attrStr(p, 'monthly_fee_note') || '—' },
  { key: 'insuranceNote', label: 'Insurance detail', accessor: (p) => attrStr(p, 'id_theft_insurance_note') || '—' },
  { key: 'bbbNote', label: 'BBB detail', accessor: (p) => attrStr(p, 'bbb_rating_note') || attrStr(p, 'bbb_accredited_note') || '—' },
  { key: 'reviewNote', label: 'Review detail', accessor: (p) => attrStr(p, 'review_note') || '—' },
],
```

`bbbLabel`/`bbbOrdinal` must handle `null` distinctly from the string `'NR'` — `null`
renders `'—'` (BBB profile in flux / no report available, IdentityIQ only) while `'NR'`
renders literally `'NR'` (a real, current BBB-issued status, IdentityForce) — mirrors
the `trading-platforms.ts` `extendedHours` null-vs-`'none'` precedent exactly. `usd`,
`yesNo`, `attr`, `attrStr`, `attrNum` are the standard local-const accessors already
established in every prior `attributes`-JSONB topic file.

## 7. Verdict picks

- **Best overall:** Experian IdentityWorks — Money's #1 "Best Overall" pick for credit
  monitoring specifically (not just identity theft protection broadly), a genuine
  permanent free tier, daily 3-bureau monitoring on Premium, and the strongest
  bureau-native data access (CreditLock) of the field. The pending CFPB suit is
  disclosed, not hidden, and doesn't outweigh the category-leading editorial consensus.
- **Best free:** Credit Karma — the only completely free product in the field (not a
  freemium teaser), used by ~130M Americans, listed in every editorial source checked.
- **Best for families:** Aura — 3-bureau monitoring on every tier (no gating by plan,
  unique in this field), fastest alerting per Money.com, family plan covers 5 adults +
  unlimited kids.

## 8. Compliance

Credit monitoring/identity-theft-protection products are not FDIC/SIPC-insured
financial products; the relevant regulators are the FTC (deceptive-practices
enforcement — LifeLock, Credit Karma) and the CFPB (Experian, TransUnion/IdentityForce).

```ts
compliance: {
  notice: 'Not financial or legal advice · credit monitoring detects fraud after it happens — it does not prevent identity theft. Free self-help alternatives exist: AnnualCreditReport.com for free reports from all three bureaus, and free credit freezes directly with Equifax, Experian and TransUnion.',
  regulators: ['FTC', 'CFPB'],
},
```

## 9. buyerGuide content (AEO/E-E-A-T, per source matrix §8 mandatory topics)

- **VantageScore vs. FICO** — the core free-vs-paid trade-off: most free tiers
  (Credit Karma, and the free layers of Experian/myFICO) show VantageScore, while
  myFICO uniquely sells the actual FICO Score (in 28+ versions) that most lenders use
  for mortgage/auto decisions — the two scores can differ meaningfully for the same
  person.
- **AnnualCreditReport.com + free bureau freezes** — the CROA-adjacent consumer-rights
  baseline (matches Slice 5's Georgia-law E-E-A-T paragraph): every consumer is entitled
  to a free report from each bureau and a free security freeze; monitoring is
  convenience, not something otherwise unavailable for free.
- **"Monitoring detects, it doesn't prevent"** — sets expectations correctly: no
  service in this comparison can stop identity theft from happening, only shorten the
  time to discover it and provide recovery/insurance support after the fact.
- **PrivacyGuard + Identity Guard context** — PrivacyGuard's cheapest-monthly-3-bureau-
  refresh USP acknowledged honestly alongside why it isn't ranked (no citable review
  base); Identity Guard's relationship to Aura explained (same company, cheaper
  sister-brand without the VPN/antivirus bundle).
- **Credit Karma's business model** — plainly explained: free because Credit Karma is
  paid by lenders when users apply for offers shown in the app; this is disclosed, not
  hidden, and is the reason its $0 doesn't need a hidden catch.

## 10. Content-hygiene fixes required in this slice

None. No credit-monitoring review MDX exists (source matrix Befund #8 — confirmed, a
pleasant contrast to Slice 5's fabrication discovery). Optional (non-blocking) internal
linking: `content/us/credit-score/free-credit-score-check.mdx` and
`content/us/credit-score/index.mdx` are thematically adjacent — add reciprocal links if
convenient during implementation, not a migration gate.

## 11. Pre-seed verification — RESOLVED (migration gate cleared)

All 6 items flagged in the source matrix §7 resolved via WebSearch + targeted WebFetch
(BBB profiles; Trustpilot itself confirmed WAF-blocked to WebFetch, consistent with the
FOREX.com/Safeport/credit-saint precedent — resolved via aggregator cross-reference
instead, same method as Slice 5):

1. **Aura + LifeLock list vs. renewal pricing — partially resolved, disclosed
   conservatively.** LifeLock: multiple sources confirm Advanced's $19.99/month is a
   genuine, ongoing monthly-billing rate (not a first-year-only teaser) — the cheaper
   $199.99/yr figure is simply the standard annual-prepay discount, not a renewal trap.
   Seeded at $19.99, `confidence: high`. Aura: sources genuinely conflict — one says
   renewal parity is standard "unless there's a general price increase," another says
   "renewal prices increase after your first year" — no third-party source states a
   concrete renewal number. Seeded at the current real monthly-billing list price
   ($15.00), `confidence: medium`, with `price_note` disclosing that renewal-vs-intro
   parity is unconfirmed (errs toward the verifiable current price rather than guessing
   a renewal figure, matching the Safeport conservative-disclosure precedent).
2. **IdentityIQ monthly-billing price — resolved.** Confirmed $22.99/month as the real
   monthly-billing rate for Secure Pro (vs. $18.49/mo-equivalent if paid annually, and
   the original $21.49 figure was itself an annual-equivalent, not a monthly-billing
   price) — seeded at $22.99, `confidence: high` (supersedes the source matrix's
   placeholder). Trustpilot review count: aggregator consensus lands on 424 (range
   424-450 across snapshots per the same page-count fluctuation pattern seen for Credit
   Firm in Slice 5) — seeded at 424 with a note disclosing the range.
3. **Trustpilot counts — resolved for all 5 flagged candidates**, cross-referenced
   against the live page listing (`?page=N of M`) rather than a single AI summary:
   Aura 1,103 (score re-checked at 4.3, not the matrix's 4.1 — likely a snapshot-timing
   difference; 84% five-star share matches exactly across both checks, confirming same
   underlying data), IDShield 673 (score 4.7 retained from the matrix — Trustpilot's
   rounded-star display doesn't expose a precise decimal via search), IdentityForce 904
   (score conflict found and disclosed: matrix's directly-fetched 3.5 vs. a fresh
   search's imprecise "4-star" bucket summary — seeded conservatively at 3.5 per the
   Safeport rule of preferring the more conservative figure on a genuine conflict, with
   both noted), Credit Karma 875 (**US profile specifically** — confirmed distinct from
   the UK profile's 11,621 and Canada's 4,207, avoiding a market-conflation error),
   myFICO: Trustpilot itself is only 4 reviews — **too small a sample, rejected under
   the same rule that rejected Sky Blue Credit's 2-review Trustpilot sample in Slice
   5** — Reviews.io's 114-review, 4.8/5 base used as the headline instead, `confidence:
   medium`. LifeLock's ~13,668 cross-checked and confirmed exactly against the live
   Trustpilot page count.
4. **BBB grades — resolved via direct WebFetch of both profiles** (WebSearch could not
   extract the letter grade for either): **LifeLock/Gen Digital = A+**, accredited since
   2021-03-04 (Tempe AZ profile). **IdentityForce = NR (Not Rated)**, explicitly **not**
   a BBB Accredited Business — the profile's own rating-reason text notes it is
   "placing TransUnion on N/R to review complaints," directly tying the parent-company
   disclosure already required in §5 to the BBB status itself.
5. **Experian Premium 3-bureau monitoring frequency — resolved.** Confirmed daily
   monitoring across all three bureaus on Premium (not a slower cadence for Equifax/
   TransUnion as the source matrix worried) — simplifies the seed value to a single
   "daily, all 3 bureaus" claim, `confidence: high`.
6. **IDShield trial terms + insurance structure — resolved, with a real correction.**
   30-day trial confirmed (card not charged for 30 days, cancel anytime),
   `confidence: high`. Insurance structure genuinely corrected from the matrix's
   ambiguous "up to $3M" framing: **$3M applies to the family plan only — the
   Individual 3-Bureau plan (the seeded plan) carries $1M**, not $3M. Seeding the
   individual-tier plan at the family-tier insurance figure would have been a real
   accuracy bug feeding a `winner: 'max'` specColumn — caught here before seeding, not
   after. IdentityForce's $2M remains correctly the field's individual-plan maximum.

All 8 candidates now have a defensible, sourced seed value — migration gate is cleared,
proceeding to the Fable-5 pre-migration review.
