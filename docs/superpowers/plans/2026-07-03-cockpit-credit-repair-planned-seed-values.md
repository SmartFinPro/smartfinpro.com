# Slice 5 — Planned TopicConfig Design + Seed Values (pre-migration draft)

> Written by the controlling (Sonnet) session, translating the Fable-5 source matrix
> (`2026-07-03-cockpit-credit-repair-source-matrix.md`) into concrete schema + seed
> values. **Nothing here has been written to code or the database yet.** This is the
> input for the mandatory Fable-5 pre-migration review checkpoint. Owner has already
> confirmed via AskUserQuestion: (1) Lexington Law excluded entirely, (2) The Credit
> Pros excluded entirely, (3) build a new shared `CostModelDef` kind rather than
> force-fit an existing one, (4) fix `best-credit-repair-companies.mdx`'s compliance/
> accuracy problems within this slice.

## 0. Ranked field: 6 candidates (confirmed, not re-litigating)

Credit Saint · Sky Blue Credit · The Credit People · Safeport Law · MSI Credit
Solutions · Credit Firm. Lexington Law, The Credit Pros, and the now-defunct Ovation
Credit Services (LendingTree shut it down 2023-06-30) are excluded — no backfill
(matches the Forex slice's 7→5 precedent: a smaller, fully-sourced field beats a
padded one with weak rows).

## 1. Cost model — NEW shared `CostModelDef` kind: `'monthly-plus-setup'`

Credit repair pricing is a flat monthly subscription + an optional one-time
setup/first-work fee — none of the 3 existing kinds honestly fit (`compounding-fee`
needs a growing balance that doesn't exist here; `banking` scales with *years* and
implies an ongoing service, but credit repair runs 3-12 *months* and ends;
`fee-on-amount` needs a %-of-amount relationship that doesn't exist — forcing it via
`flatFeeAccessor` would leave both sliders inert, a broken-feeling UI).

**Shared-code changes required (cross-topic, same scope as the Slice-1
`fee-on-amount` precedent):**

1. `lib/comparison/topics/types.ts` — add `'monthly-plus-setup'` to `CostModelDef.kind`,
   add one new optional accessor:
   ```ts
   export interface CostModelDef {
     kind: 'compounding-fee' | 'banking' | 'fee-on-amount' | 'monthly-plus-setup';
     growthRate?: number;
     feeAccessor?: (p) => number | null;
     flatFeeAccessor?: (p) => number | null;
     /** `monthly-plus-setup` only: one-time setup/first-work fee. Defaults to 0. */
     setupFeeAccessor?: (p: Pick<ProductForComparison, 'attributes'>) => number | null;
     amountLabel: string; amountMin: number; amountMax: number; amountStep: number; amountDefault: number;
     yearsLabel: string; yearsMin: number; yearsMax: number; yearsDefault: number;
   }
   ```
2. `lib/comparison/cost.ts` `costOverTime()` — new branch, purely additive (existing
   3 branches untouched, byte-for-byte):
   ```ts
   if (model.kind === 'monthly-plus-setup') {
     const setup = model.setupFeeAccessor?.(p) ?? 0;
     const monthly = p.monthlyFee ?? 0;
     return Math.round(setup + monthly * inputs.amount); // inputs.amount = months here
   }
   ```
   The existing generic `amount` slider is repurposed as a **months** dial for this
   kind only (`amountLabel: 'Months in program'`, `amountMin: 3, amountMax: 12`) — no
   `CostInputs` interface change needed, since each kind already defines its own
   semantics for the same two generic slider inputs (`banking`'s "amount" differs from
   `fee-on-amount`'s "amount" already). `years` is unused/inert for this kind, matching
   how `fee-on-amount` leaves it unused.
3. `components/marketing/cockpit-decision-bar.tsx` — **this is frozen shared UI
   (Guardrail 1)**, discovered during design that it hardcodes `cm.kind !== 'banking'`
   and `cm.kind !== 'fee-on-amount'` checks to decide which slider to show, AND always
   formats the amount value via a local `usd()` helper (`$${amount}`). For
   `monthly-plus-setup`: the amount slider must stay visible (relabeled "months"), the
   years slider must hide (no years dimension here), and the displayed value must read
   "6 months" not "$6". Two small, purely additive edits (new conditions gated on the
   new kind string only — zero behavior change for the 3 existing kinds):
   ```tsx
   // value display: only this kind gets a non-dollar format
   <b>{cm.kind === 'monthly-plus-setup' ? `${amount} months` : usd(amount)}</b>
   ...
   // years slider: hide for both fee-on-amount (existing) AND monthly-plus-setup (new)
   {cm.kind !== 'fee-on-amount' && cm.kind !== 'monthly-plus-setup' && ( ... )}
   ```
   **This touches a Guardrail-1 frozen file** — flagging explicitly per the routing
   rule ("Phase E multi-market plumbing"-style shared change) for Fable-5 sign-off,
   even though the edit is additive-only.

**Required regression check before merge:** `robo-advisors` (`compounding-fee`),
`business-bank-accounts`/`trading-platforms` (`banking`), `debt-relief-companies`
(`fee-on-amount`) must render byte-identical cost figures after this change — a
dedicated regression pass on all 4 existing live topic pages, not just tsc/build.

**Real numbers (6-month program, entry/core plan) — genuine 3.4x spread, unlike
trading-platforms' inert $0 tie:**

| Provider | Setup | Monthly | 6-month total |
|---|---|---|---|
| Credit Firm | $0 | $49.99 | **$300** |
| Sky Blue Credit (Full Service) | $0 | $99 | **$594** |
| The Credit People (Standard) | $19 | $99 | **$613** |
| Safeport Law | *pending manual price re-verify* | *pending* | **~$594-909** |
| MSI Credit Solutions | variable (footnote, not seeded as $) | $98 | **$588 + variable setup** |
| Credit Saint (Polish tier) | $99 | $79.99 | **$579** |

## 2. Attribute schema (JSONB `attributes`, Zod-validated)

```ts
export const creditRepairAttributesSchema = z.object({
  setup_fee: z.number().nullable(),        // null = variable/no fixed price (MSI)
  setup_fee_note: z.string().optional(),
  dispute_scope_note: z.string(),
  guarantee_type: z.enum(['unconditional_refund', 'conditional_refund', 'partial_refund', 'none']),
  guarantee_note: z.string(),
  states_note: z.string(),
  bbb_rating: z.string(),                  // 'A-', 'C+', 'A+', 'NR' (not rated)
  bbb_accredited: z.boolean(),
  review_score: z.number(),                // headline consumer-review star, 0-5
  review_count: z.number(),
  review_source: z.string(),               // MUST render alongside score+count, never a bare number
  nacso: z.boolean().nullable(),            // tri-state, matches debt-relief's `afcc` pattern
  attorney_led: z.boolean(),
  regulatory_history_note: z.string(),      // disclose even when clean — "no actions found" is itself a fact
}).passthrough();
```

Top-level fields used: `monthlyFee` (existing generic column, reused as-is — the
recurring subscription fee), `accountMinimum` unused/0 for this topic (no deposit
concept), `managementFee` unused (0) for this topic (no %-rate concept), `rating`/
`reviewCount` (headline stars — see §3 open question), `review_slug`, `external_url`,
`is_affiliate`, `score`, `display_order`, `is_top_pick`, `best_for`, `source_type`,
`confidence`, `data_verified_at`.

## 3. Open judgment call for Fable-5: The Credit People's headline rating

This is the one place I'm not confident enough to decide unilaterally — flagging for
your review rather than picking silently, since The Credit People is also this slice's
only genuinely monetized candidate (existing affiliate_links row), which raises the
stakes on getting this right rather than convenient.

The source matrix found two wildly divergent numbers: **Trustpilot 1.8/5 "Poor"**
(official source, but no exact review count given, "small sample" per the matrix) vs.
**BestCompany 4.3/300+** (editorial/aggregator source, real count). The site's own
*existing* MDX review currently claims "Trustpilot 4.6 from 12,847 reviews" — the
matrix calls this "not verifiable, presumably fabricated" and flags it as a mandatory
content fix regardless of which number the cockpit seeds.

Two options:
- **(a) Seed BestCompany 4.3/300 as the headline rating**, and put the Trustpilot 1.8
  "Poor" figure explicitly in `cons` and a `review_source` note as a transparency
  caveat (matches the debt-relief precedent of disclosing rather than picking the
  flattering number and staying silent about the other one).
- **(b) Seed Trustpilot 1.8 as the headline rating** (lower review count precision,
  but it's the more official-sourced, direct-from-platform number, and it's more
  internally consistent with the BBB C+/non-accredited picture already seeded for this
  candidate) — more conservative for a monetized candidate, at the cost of not having
  an exact review count to cite.

My tentative lean is (a), since a headline rating needs a real, citable count and (a)
still surfaces the negative signal honestly in cons rather than hiding it — but this
is exactly the kind of call I'd rather have your sign-off on before it goes into a
live seed migration for the one monetized row in the topic.

## 4. Per-candidate seed values

| Field | Credit Saint | Sky Blue Credit | The Credit People | Safeport Law | MSI Credit Solutions | Credit Firm |
|---|---|---|---|---|---|---|
| `display_order` | 1 | 2 | 3 | 4 | 5 | 6 |
| `is_top_pick` | true | false | false | false | false | false |
| `best_for` | Best overall | Best guarantee | Lowest entry cost | Attorney-led | Couples/custom pricing | Cheapest overall |
| `score` | 9.0 | 8.8 | 8.2 | 8.4 | 8.0 | 8.3 |
| `monthlyFee` | 79.99 (Polish tier; Remodel 109.99, Clean Slate 139.99 in notes) | 99 (Full Service; Basic 79, Premium 119 in notes) | 99 (Standard; Premium 119, flat-rate $599/6mo in notes) | *pending manual verify — likely 99* | 98 (individual; couples 69/person) | 49.99 |
| `attributes.setup_fee` | 99 | 0 | 19 | *pending manual verify* | null (variable, footnote) | 0 |
| `attributes.bbb_rating` | A- | A+ (not accredited) | C+ (not accredited) | A- | C+ (not accredited) | A+/A (sources differ, not accredited) |
| `attributes.bbb_accredited` | true | false | false | true | false | false |
| `attributes.review_score`/`_count`/`_source` | 4.6 / 643 / Trustpilot (note: >20% 1-star) | 4.3 / 497 / Google (Trustpilot sample too small to use, 2 reviews) | **see §3 open question** | 4.7 / 734 / Birdeye (no Trustpilot profile exists) | 4.8 / 2225 / Google (largest sample in field) | 2.5 / ~50 / Trustpilot (range 46-61 across snapshots) |
| `attributes.guarantee_type` | conditional_refund | unconditional_refund | partial_refund | conditional_refund | conditional_refund | none |
| `attributes.nacso` | null (claimed by aggregators only) | null | null | null (not claimed) | **true** (only confirmed member) | null |
| `attributes.attorney_led` | false | false | false | **true** | false | false (attorney-founded, not attorney-led today) |
| `is_affiliate` | false (no link) | false (no link) | **true** (`the-credit-people`, but bare homepage URL — no tracking params) | false (no link) | false (no link) | false (no link) |
| `review_slug` | `credit-saint-review` | null (no existing review) | `the-credit-people-review` | null (no existing review) | null (no existing review) | null (no existing review) |
| `external_url` (ALL 6, standing rule) | `https://www.creditsaint.com/` | `https://www.skybluecredit.com/` | `https://www.thecreditpeople.com/` | `https://www.safeportlaw.com/` | `https://msicredit.com/` | `https://www.creditfirm.net/` |
| resulting `ctaMode` | review | visit | **review** (Gate 5 — bare homepage URL, no attribution possible) | visit | visit | visit |

All `*_note` fields carry the full caveat text from the source matrix (states
availability gaps, guarantee fine print, setup-fee ambiguity, regulatory disclosure)
— not duplicated here in full, see the source matrix for verbatim text.

## 5. specColumns (4 headline columns)

1. **Monthly fee** — `p.monthlyFee`, format `$X.XX/mo`, `winner: 'min'`, sortKey `cost`.
2. **Setup fee** — `attributes.setup_fee`, format `$X` or `'Variable'` if null, `winner: 'min'` (nulls excluded from the min comparison, not coerced to 0).
3. **BBB rating** — `attributes.bbb_rating`, ordinal-mapped for `winner: 'max'` (A+ > A- > B+ > C+ > NR).
4. **Money-back guarantee** — `attributes.guarantee_type`, ordinal (`unconditional_refund` > `conditional_refund` > `partial_refund` > `none`), `winner: 'max'`.

Rejected candidate: NACSO/accreditation as a headline column — only 1 of 6 has a
confirmed membership (MSI), the rest are honestly `null` (unknown, not false), so this
column would show 5 "—" cells and 1 checkmark — informational-only in
compareRows/detailRows instead, matching the debt-relief `afcc` tri-state precedent.

## 6. filters / priorityChips / sortOptions / matcher

```ts
filters: [
  { key: 'bbbAccredited', label: 'BBB accredited', predicate: (p) => attrBool(p, 'bbb_accredited') },
  { key: 'attorneyLed', label: 'Attorney-led', predicate: (p) => attrBool(p, 'attorney_led') },
  { key: 'unconditionalGuarantee', label: 'Unconditional money-back guarantee', predicate: (p) => attrStr(p, 'guarantee_type') === 'unconditional_refund' },
  { key: 'noSetupFee', label: 'No setup fee', predicate: (p) => attrNum(p, 'setup_fee') === 0 },
  { key: 'lowCost', label: 'Under $80/month', predicate: (p) => p.monthlyFee < 80 },
],

priorityChips: [
  { id: 'cost', label: 'Lowest cost', icon: 'Coins', sort: 'cost' },
  { id: 'guarantee', label: 'Best guarantee', icon: 'Star', sort: 'guarantee' },
  { id: 'rating', label: 'Top rated', icon: 'Star', sort: 'rating' },
  { id: 'attorney', label: 'Attorney-led', icon: 'Users', sort: 'attorney' },
],

sortOptions: [
  { value: 'smart', label: 'Smart rank', metric: (p) => p.score },
  { value: 'cost', label: 'Lowest cost on your program length', metric: () => 0 }, // special-cased in orderProducts
  { value: 'guarantee', label: 'Best money-back guarantee', metric: (p) => guaranteeOrdinal(p) * 10 + p.score },
  { value: 'rating', label: 'Best rated', metric: (p) => attrNum(p, 'review_score') * 100 + p.score },
  { value: 'attorney', label: 'Attorney-led', metric: (p) => (attrBool(p, 'attorney_led') ? 1000 : 0) + p.score },
],

matcher: [
  { id: 'cost', label: 'Want the lowest monthly cost?', weight: 14,
    award: (p, a) => a === 'yes' ? { matched: p.monthlyFee < 80, reason: 'Low monthly fee' } : { matched: true } },
  { id: 'guarantee', label: 'Want an unconditional money-back guarantee?', weight: 12,
    award: (p, a) => a === 'yes' ? { matched: attrStr(p, 'guarantee_type') === 'unconditional_refund', reason: 'Unconditional guarantee' } : { matched: true } },
  { id: 'attorney', label: 'Prefer an attorney-led service?', weight: 10,
    award: (p, a) => a === 'yes' ? { matched: attrBool(p, 'attorney_led'), reason: 'Attorney-led' } : { matched: true } },
],
```

## 7. Verdict picks

- **Best overall:** Credit Saint — ConsumerAffairs #1 overall consensus, 90-day
  guarantee, longest BBB-accredited track record (since 2007).
- **Best money-back guarantee:** Sky Blue Credit — unconditional 90-day refund, "no
  strings" (not tied to a removal outcome, unlike most competitors' conditional
  guarantees).
- **Lowest cost / cheapest overall:** Credit Firm — $49.99/mo, no setup fee, cheapest
  in the field by a wide margin, though the only ranked candidate with no money-back
  guarantee at all (explicit trade-off, disclosed in cons).

## 8. Compliance

Credit repair is federally regulated primarily by CROA (Credit Repair Organizations
Act) — prohibits charging for services before they're performed, requires a written
contract and a 3-day cancellation right, and requires accurate representations about
what credit repair can/cannot do (cannot remove accurate negative information, cannot
create a new credit identity). No FCTC/SIPC/FDIC-style badge applies here; the
correct regulator reference is the FTC (CROA enforcement) and the CFPB (as demonstrated
by the Lexington Law case itself).

```ts
compliance: {
  notice: 'Not legal advice · credit repair cannot remove accurate negative information from your credit report, and results vary by individual credit history. Free self-help alternatives exist (disputing errors directly with bureaus via annualcreditreport.com costs nothing).',
  regulators: ['FTC', 'CFPB'],
},
```

## 9. buyerGuide content (per Fable's recommendation — AEO/E-E-A-T, not new ranking slots)

- Georgia's attorney-exception context (explains Safeport's attorney-led model and
  Credit Saint's GA exclusion — commercial credit-repair services are restricted
  under Georgia law, with a carve-out for licensed attorneys).
- CROA rights primer (the free self-help alternative: disputing directly with bureaus
  via annualcreditreport.com costs nothing; no company can legally charge for results
  in advance).
- NACSO context: no AADR/IAPDA-equivalent trust mark exists for this industry —
  NACSO is the closest analog but is a thin, self-regulating trade body without
  independently verifiable membership rosters; only MSI's membership could be
  confirmed against a primary source.

## 10. Content-hygiene fixes required in this slice (owner-approved scope)

1. **`content/us/credit-repair/best-credit-repair-companies.mdx`** — remove the
   defunct Ovation Credit (#7) and Lexington Law (#2, dead `/go/lexington-law` CTA)
   entries entirely; fix the false "All 7 companies A+ BBB rated" claim (real: The
   Credit People C+, MSI C+); fix the unverifiable "Trustpilot 4.6/12,847" claim for
   The Credit People to the real, sourced figure (see §3).
2. **`content/us/credit-repair/lexington-law-review.mdx`** — add a compliance-notice
   block (CFPB judgment, entity dissolution/successor purchase, current $139.95
   pricing replacing the stale $89-$139 + $99 setup figures); remove the dead
   `/go/lexington-law` CTA (no `affiliate_links` row exists, and promoting it would
   contradict the exclusion decision); page stays live as an informational/warning
   page rather than being deleted (real search demand for "Lexington Law review" is
   informational intent, matching how the tastyfx/IG-US redirect was handled rather
   than deletion in Slice 4).
3. **`content/us/credit-repair/the-credit-people-review.mdx`** — correct the
   guarantee description ("90-day money-back" overstates it; real terms: cancel
   anytime, refund of the last two monthly payments), correct pricing tiers ($99/$119
   + $599 flat-rate option, not the stale $79-$119), correct BBB/Trustpilot figures to
   the real, sourced ones.
4. **`content/us/credit-repair/credit-saint-review.mdx`** — expand the incomplete
   state-exclusion list (GA, KS, LA, SC, VT — not just GA/SC as currently stated);
   correct the first-work fee (MDX currently says $49; multi-source 2025/2026
   consensus is $99/$195 depending on tier).

## 11. Pre-seed verification still needed (flagged, not yet done)

Three facts are WAF-blocked from automated verification and need a one-time manual
browser check before the seed migration is finalized: (1) Safeport Law's current
monthly fee + setup fee (safeportlaw.com), (2) Credit Saint's exact state-exclusion
list + guarantee refund scope (creditsaint.com/terms-of-service), (3) The Credit
People's $19 setup fee (thecreditpeople.com checkout flow). Everything else in the
source matrix is `confidence: high` or `medium` with a real source, safe to seed as-is.
