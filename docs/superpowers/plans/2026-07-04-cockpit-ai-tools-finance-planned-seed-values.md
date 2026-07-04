# Slice 7 — Planned TopicConfig Design + Seed Values (pre-migration draft)

> Written by the controlling (Sonnet) session, translating the Fable-5 source matrix
> (`2026-07-04-cockpit-ai-tools-finance-source-matrix.md`) into concrete schema + seed
> values, with several of the source matrix's flagged pre-seed items resolved below via
> direct WebSearch/WebFetch/live-browser verification. **Nothing here has been written to
> code or the database yet.** This is the input for the mandatory Fable-5 pre-migration
> review checkpoint. Owner has already confirmed via AskUserQuestion: fix the 4 stale/
> fabricated existing MDX reviews (Monarch, Copilot Money, ChatGPT, QuickBooks) within
> this slice, matching the Slice-5 precedent.

## 0a. Fable-5 pre-migration review outcome: APPROVE WITH 11 CHANGES (applied below)

The review found the design's central claim — "the shared cost engine's output is never
displayed anywhere" — was **false against the frozen UI**: `cockpit-card.tsx`,
`cockpit-table.tsx` and `cockpit-compare.tsx` all unconditionally render a cost figure with
a live winner highlight and an always-clickable cost-sort header, regardless of whether a
`'cost'` sortOption/priorityChip is defined (`orderProducts` special-cases `sort ===
'cost'` before consulting `config.sortOptions`). As designed, the page would have shown
exactly the dishonest cross-model cost ranking §1 exists to avoid. Two further findings
were genuinely blocking: `review_score: null` (ChatGPT, and Composer too — the design only
handled one of the two) renders through the frozen UI as **"0.0 from 0 reviews"** — a false
worst-rated claim, not an absence of data — since `ProductForComparison.rating/reviewCount`
are non-nullable and `num()` coerces `null` → `0`; and Ramp's `free_tier_trial: 'free_tier'`
contradicted the design's own feature-scoped semantics (established by ChatGPT itself:
free tier existing as a product ≠ the free tier including the AI feature being compared) —
Ramp Agents require the paid Plus tier, so as seeded it would have won the page's one
winner column on a false "free" claim. All fixable pre-migration; none require
re-litigating field composition (8 ranked, Truewind excluded, ChatGPT-null, no-cost-
ranking editorial stance all confirmed sound).

1. **(§1, blocking) Cost figure is NOT suppressible by config alone — resolved via the
   zero-shared-code option, matching `trading-platforms.ts` exactly.** All 8 candidates
   now seed `monthlyFee: 0` (not the earlier "reference" values, which were never
   displayable safely anyway — they mixed annual/monthly bases across candidates). This
   produces a uniform, inert $0 across the field (`varies=false`, no winner highlight),
   identical to trading-platforms' $0-commission precedent. §1's claim is retracted from
   "shows no cost figure at all" to "shows an inert, uniform $0 — real information is
   surfaced via the Starting-price/Pricing-model columns instead." A mandatory FAQ entry
   (§14) now explains the $0, matching trading-platforms' condition 2.
2. **(§1) Years slider un-degenerated.** With change 1 producing a harmless uniform $0
   (not a `yearsMin===yearsMax===1` inert control), `yearsMax`/`yearsDefault` restored to
   `5`/`3` (matches business-bank-accounts/trading-platforms precedent) — the slider is
   now a normal, functioning (if inert-output) control rather than a broken-looking
   min=max range input.
3. **(§2/§5/§6, blocking) Null review score fixed at the rendering layer, for BOTH
   ChatGPT and Composer.** A `reviewCount === 0` guard was added to all three frozen
   card/table/compare components (additive-only — every existing topic has real nonzero
   `reviewCount`, so this new code path never triggers for any prior topic): renders
   "Not yet rated" (card, compare) / "—" (table) instead of tiles+"0.0"+"0 reviews".
   Composer's `review_source` is now explicitly seeded (see §5) since the compareRow
   accessor renders it when score is null.
4. **(§5, blocking) Ramp `free_tier_trial` corrected from `'free_tier'` to `'none'`.**
   Ramp's free base tier is real but does NOT include Ramp Agents (the AI feature this
   page compares) — exactly the same feature-scoping logic already applied to ChatGPT's
   free tier. The column is renamed "Free tier / trial (AI features)" for clarity; Ramp's
   genuinely-free base tier remains visible in `free_tier_trial_note`. TradingView (AI
   Copilot works on the free tier during its beta) and Composer (free tier includes the
   AI strategy-builder/backtesting) were re-checked under the same lens and confirmed
   correctly seeded as-is.
5. **(§5) Danelfin's 14-day trial — re-verified and CONFIRMED, not invented.** Direct
   WebSearch confirms a 14-day free trial on both Plus and Pro plans (plus a 30-day
   money-back guarantee), resolving the review's concern that this value lacked a source
   in the original matrix. Source added to §14.
6. **(§5) QuickBooks `free_tier_trial` corrected from `'none'` to `'trial'`.** Confirmed:
   QuickBooks Online offers a 30-day free trial (no credit card required) across all
   plan tiers, including Intuit Assist — the original `'none'` was a false negative.
7. **(§5/§9) Verdict-pick slugs fixed to PRODUCT slugs.** An explicit `slug` row is now
   in §5 for all 8 candidates (was previously only implied). `verdict.picks` corrected
   from review-slug/unverified values to the real product slugs.
8. **(§5) `display_order` realigned to score order** (Slice-6 §0a-11 precedent): Monarch
   9.2(1) · Copilot 8.8(2) · Ramp 8.6(3) · QuickBooks 8.2(4) · Danelfin 8.0(5) · Composer
   8.0(6) · ChatGPT 7.6(7) · TradingView 7.4(8).
9. **(§3) specColumn[0] shortened — it feeds the homepage Best-X tile verbatim.**
   `buildBestXIndex` renders `specColumns[0].format(...)` as the tile metric; the
   original 88-character starting-price sentence would have broken that UI (every other
   topic shows a short string like "$0"/"0.25%" there). Fixed two ways: (a) reordered so
   **Segment** (short label, e.g. "AI budgeting") is specColumn[0]; (b) added a new,
   separate short `starting_price_headline` field (e.g. "$14.99/mo") to the schema,
   distinct from the long `starting_price_note` — the headline is used in the Starting-
   price specColumn/compareRow, the full sentence stays in the detailRow only.
10. **(§5/§7/§13) Composer's two migration-gate checks — RESOLVED, not just gated.**
    Both items the review flagged as required-before-shipping are now directly verified
    (not merely scheduled): **BrokerCheck disclosure section (CRD 325118) — confirmed
    clean, zero disclosure events** (criminal, regulatory, civil-judicial, financial —
    none on record), independent of parent SoFi's own history; **Composer Technologies
    Inc.'s RIA registration (CRD 311289) — confirmed still active** post-acquisition (SEC
    Form CRS on file). The "genuine differentiator" framing is now fully earned, not
    premature. Per the review's suggestion, the note's closing sentence is softened to
    plain fact ("the only SEC/FINRA-registered entity in this comparison") rather than
    editorializing further — any additional framing lives in the buyerGuide, not the card.
11. **(§14 new) All previously-missing required `TopicConfig` fields added**: `slug:
    'ai-tools-finance'`, `category: 'ai-tools'`, `label`, `h1`, `metaTitle`,
    `metaDescription`, `intro`, `publishedDate`, `methodology` (the mandatory
    heterogeneity paragraph), `faq` (including the cost-$0 explanation), plus
    confirmation the `BEST_X_MANIFEST` entry already exists (`manifest.ts:31`, no change
    needed) and the OG image (`/images/comparison/ai-tools-finance.webp`) needs creation
    at implementation time if not already present.

**Non-blocking, applied as low-cost fixes:** priorityChip icons corrected to the
`CHIP_ICON` map's actual 5 valid icons (`Coins, Percent, Wallet, Star, Users` — no
`Briefcase`/`Gift`, which silently fall back to `Coins`); Danelfin's `starting_price_note`
rewritten to remove implementer meta-language ("sources show variance...") into clean
user-facing copy, with the sourcing caveat moved to `confidence`/this doc instead; added
ChatGPT's "US-only, preview" status explicitly to `ai_features_note`; Copilot Money's
lack of an Android app noted in a new `platforms_note` mention within `ai_features_note`
(no new schema field needed for one candidate).

## 0. Ranked field: 8 candidates (Truewind excluded — resolved below, not re-litigating)

Monarch Money · Copilot Money · ChatGPT (Finances feature) · QuickBooks Online (AI/Intuit
Assist) · TradingView · Danelfin · Composer by SoFi · Ramp.

**Truewind excluded, buyerGuide only.** The source matrix's Urteil 5 made ranked-slot 9
conditional on a live G2 review count ≥ ~10 (PrivacyGuard/Sky-Blue-Credit precedent). I
verified this directly via a real browser session against G2 (WebFetch returned 403,
matching this rollout's established WAF-block pattern for G2/BBB-style profiles) —
**G2's own page shows "Truewind Reviews (4)" and a 5.0 rating from exactly 4 reviews**,
not the "114+" figure a Tooliverse aggregator page reported (which appears to blend
multiple review sources non-transparently). 4 reviews is below every threshold this
rollout has used to reject a sample as too small (rejected: Sky Blue Credit's 2-review
Trustpilot sample in Slice 5, myFICO's 4-review Trustpilot sample in Slice 6 — this is
the same number). Per Urteil 5's own stated fallback: Truewind gets a buyerGuide
paragraph ("emerging AI bookkeeping category, YC-backed, $13M Series A — too young for a
ranked comparison row"), not a ranked slot. No backfill to 9 (Forex 7→5, Credit Repair
9→6, Credit Monitoring 9→8 precedent — a fully-sourced 8-row field beats a padded one).

## 1. Cost model — existing `banking` kind, ZERO shared-code change, but NO cost sort/winner

This is the first slice where the research itself recommends **not** using cost as a
ranking dimension at all (stronger than trading-platforms' "$0 tie, banned sort" case —
here the numbers aren't even comparable to begin with). The field has 4 genuinely
incompatible pricing structures: flat consumer/SaaS subscription (Monarch, Copilot,
TradingView, Danelfin, Composer), a bundle-tier where the AI feature is incidental to a
much larger subscription (ChatGPT's $20 Plus tier, QuickBooks' $38+ accounting suite),
per-user B2B (Ramp, $15/user/month on top of a free base tier), and quote-based/sales-
gated (Truewind — moot now, excluded). A "lowest cost" winner across all 8 would be
dishonest: $20 buys an entire LLM subscription, $15 is per-seat, and treating them as
comparable dollar figures would actively mislead.

```ts
costModel: {
  kind: 'banking',
  amountLabel: 'Representative usage', // ignored — matches trading-platforms.ts pattern
  amountMin: 0, amountMax: 0, amountStep: 1, amountDefault: 0,
  yearsLabel: 'Time horizon (years)',
  yearsMin: 1, yearsMax: 5, yearsDefault: 3, // §0a-2: restored to a normal range now that the output is a harmless uniform $0
},
```

**(§0a-1 correction) The shared cost figure IS unconditionally rendered by the frozen UI
— `cockpit-card.tsx`/`cockpit-table.tsx`/`cockpit-compare.tsx` all show it with a live
winner highlight and a working cost-sort header regardless of whether a `cost`
sortOption/priorityChip is configured.** Suppressing it entirely would require a
shared-code change to three frozen components — out of proportion for one slice. Instead,
**every candidate seeds `monthlyFee: 0`** (not a per-candidate "reference" number), exactly
matching the `trading-platforms.ts` precedent: a uniform, inert $0 across the whole field
(`varies=false`, no winner highlight, cost-sort is a real but no-op action). The genuine,
non-comparable pricing information lives entirely in the "Starting price"/"Pricing model"
specColumns and compareRows instead — the $0 is acknowledged as visible-but-meaningless in
a dedicated FAQ entry (§14), the same way trading-platforms explains its $0 tie.

## 2. Attribute schema (JSONB `attributes`, Zod-validated)

```ts
export const aiToolsFinanceAttributesSchema = z.object({
  pricing_model: z.enum(['flat_subscription', 'bundle_tier', 'per_user', 'freemium']),
  starting_price_headline: z.string(), // §0a-9: SHORT string for specColumn/compareRow, e.g. "$14.99/mo" — feeds the homepage Best-X tile verbatim, must stay short
  starting_price_note: z.string(), // free-text, ALWAYS includes the pricing-model suffix, e.g. "$14.99/mo (or $99.99/yr) — flat consumer subscription"; full detail lives in the detailRow only
  target_segment: z.enum(['budgeting', 'llm_assistant', 'accounting', 'spend_management', 'stock_research', 'charting', 'automated_investing']),
  ai_features_note: z.string(),
  free_tier_trial: z.enum(['none', 'trial', 'free_tier']), // §0a-4: feature-scoped — 'free_tier'/'trial' only if the AI FEATURE itself is covered, not just the base product
  free_tier_trial_note: z.string(),
  review_score: z.number().nullable(), // null = no citable score (ChatGPT: feature too new; ambiguous cases disclosed in review_note instead of guessing)
  review_count: z.number().nullable(),
  review_source: z.string(), // MUST render alongside score+count, never a bare number; explicit "n/a" text when review_score is null
  review_note: z.string().optional(),
  regulated_entity: z.boolean(), // true = Composer only (SEC RIA + FINRA/SIPC broker-dealer); every other candidate is unregulated software
  regulated_entity_note: z.string().optional(),
  regulatory_history_note: z.string(),
}).passthrough();
```

Top-level fields: `monthlyFee` seeded as a best-effort reference number (not displayed —
see §1), `rating`/`reviewCount` mirror `attributes.review_score`/`review_count` (existing
convention), `review_slug` set for the 4 candidates with an existing (post-fix) MDX
review, `external_url` (ALL 8, standing rule), `is_affiliate: false` (0 affiliate_links
rows exist for any of the 9 researched candidates — DB-verified 2026-07-04), `score`,
`display_order`, `is_top_pick` (Monarch only), `best_for`, `source_type`, `confidence`,
`data_verified_at`.

## 3. specColumns (3 headline columns — deliberately fewer than prior slices; a 4th
"cost" or "insurance"-style column has no honest analog here)

**(§0a-9) Reordered so column[0] is short** — `buildBestXIndex` renders
`specColumns[0].format(accessor(products[0]))` verbatim as the homepage Best-X tile
metric; every other topic shows a short string there ("$0", "0.25%"), so the long
starting-price sentence cannot be column[0]. Every column below has an explicit `format`
function (the earlier draft's prose omitted this; the actual TS must not).

1. **Segment** — `attributes.target_segment`, human-readable label via a `format` fn
   (e.g. "AI budgeting", "Business spend management"). No winner — informational, like
   `score_model` in Slice 6.
2. **Starting price** — `attributes.starting_price_headline` (the new SHORT field, e.g.
   "$14.99/mo"), rendered via `format` as-is. **No `winner` key at all** — the one column
   in the whole rollout so far with zero winner highlighting, because any highlight would
   imply comparability that doesn't exist (Urteil 2). The full sentence
   (`starting_price_note`) is reserved for the detailRow only.
3. **Free tier / trial (AI features)** — ordinal (`free_tier` > `trial` > `none`),
   `winner: 'max'` — the one column on this page with an honest apples-to-apples
   comparison, now that Ramp's mis-seed is corrected (§0a-4). Renamed from "Free tier /
   trial" to make explicit that it's scoped to the AI feature, not the base product.

## 4. Attribution gate — 0 affiliate links, all `external_url` visit/review CTAs

DB-verified 2026-07-04 via `mcp__smartfinpro__list_affiliate_links` (72 rows, all
categories checked, not just `ai-tools`): **zero** rows match any of the 9 researched
candidates (including Truewind). All 8 ranked candidates get `is_affiliate: false`,
`external_url` set to the bare official homepage (standing rule since Slice 3). 4 of the
8 (Monarch, Copilot Money, ChatGPT, QuickBooks) get `review_slug` set to their existing
(post-fix) review — `ctaMode` resolves to `'review'` for those 4, `'visit'` for the other
4 (TradingView, Danelfin, Composer, Ramp — no existing review content). Copy.ai, Jasper
AI and Systeme.io have real, active `affiliate_links` rows under `ai-tools` (confirmed via
the same DB check) but appear in **zero** finance-AI sources found during research — they
are correctly excluded from this topic entirely; their existing revenue/links are not
touched and do not factor into this slice's monetization footnote (Guardrail 6,
reclassification remains the owner's separate follow-up task per the rollout plan).
**Monetization is a follow-up task, not a slice blocker**: TradingView's own referral
program, and Monarch/Copilot/QuickBooks' likely partner programs (Impact-style/CJ) —
pursue only after network-link + SubID + postback verification per the Mercury pattern.

## 5. Per-candidate seed values

| Field | Monarch | Copilot Money | ChatGPT (Finances) | QuickBooks AI | TradingView | Danelfin | Composer by SoFi | Ramp |
|---|---|---|---|---|---|---|---|---|
| `slug` (§0a-7) | `monarch` | `copilot-money` | `chatgpt-finances` | `quickbooks-ai` | `tradingview` | `danelfin` | `composer` | `ramp` |
| `display_order` (§0a-8, score-aligned) | 1 | 2 | **7** | 4 | **8** | 5 | 6 | **3** |
| `is_top_pick` | **true** | false | false | false | false | false | false | false |
| `best_for` | Best AI budgeting app | Best for Apple users | Most versatile AI finance assistant (privacy caveats) | Best AI inside accounting software | Best AI stock charting (beta) | Best AI stock research | Best AI investing automation | Best for business spend |
| `score` | 9.2 | 8.8 | 7.6 | 8.2 | 7.4 | 8.0 | 8.0 | 8.6 |
| `monthlyFee` (§0a-1, corrected — uniform, matches trading-platforms) | **0** | **0** | **0** | **0** | **0** | **0** | **0** | **0** |
| `attributes.pricing_model` | flat_subscription | flat_subscription | bundle_tier | bundle_tier | freemium | flat_subscription | flat_subscription | per_user |
| `attributes.starting_price_headline` (§0a-9, NEW short field) | "$14.99/mo" | "$95/yr" | "$20/mo (bundle)" | "from $38/mo" | "Free–$14.95/mo" | "$22–59/mo" | "$40/mo" | "Free–$15/user/mo" |
| `attributes.starting_price_note` (full sentence, detailRow only) | "$14.99/mo or $99.99/yr — flat consumer subscription (7-day trial, card required)" | "$95/yr (≈$7.92/mo); $13/mo if billed monthly — flat consumer subscription (1-month trial)" | "$20/mo (ChatGPT Plus) — the AI finance feature is one part of a general-purpose LLM subscription, not a standalone product; Free tier does not include it" | "from $38/mo (Simple Start) — bundled inside an accounting-software subscription; higher AI-agent features require Advanced ($275/mo)" | "Free tier available; paid plans from $14.95/mo (Essential) unlock higher AI-copilot request limits" | "Plus $22/mo ($199/yr); Pro $59/mo ($499/yr) — flat SaaS subscription" | "$40/mo Trading Pass, or $32/mo billed annually ($384/yr) — flat subscription plus a live brokerage account" | "Free tier available (unlimited cards, core expense management); Ramp Agents (the AI features) require Ramp Plus, $15/user/mo" |
| `attributes.target_segment` | budgeting | budgeting | llm_assistant | accounting | charting | stock_research | automated_investing | spend_management |
| `attributes.free_tier_trial` (§0a-4/§0a-6 corrected) | trial | trial | none (Free ChatGPT lacks the feature) | **trial** (30-day, confirmed — all tiers incl. Intuit Assist) | free_tier | trial (14-day, confirmed) | free_tier (strategy-building/backtesting only, no live trading) | **none** (free base tier is real but Ramp Agents — the AI feature — require paid Plus) |
| `attributes.regulated_entity` | false | false | false | false | false | false | **true** | false |
| `attributes.regulated_entity_note` (Composer only, §0a-10 softened + both checks resolved) | — | — | — | — | — | — | "Composer Technologies Inc. is an SEC-registered Investment Adviser (CRD 311289, active registration confirmed); Composer Securities LLC is a FINRA- and SIPC-member broker-dealer (CRD 325118) with zero disclosure events on its BrokerCheck record (confirmed directly, not the parent's) — the only SEC/FINRA-registered entity in this comparison." | — |
| `attributes.review_score`/`_count`/`_source` | 4.9 / 70,000 / App Store (+ 4.7/17,600 Google Play) | 4.8 / ~24,000 / App Store | **null** (feature 7 weeks old at seed time — see §6) | 4.0 / 2,967 / G2 (channel-spread disclosed — see note) | 1.5 / ~1,205 / Trustpilot (see note) | 4.2 / ~90 / Trustpilot | **null** / n/a — App Store rating/count not independently confirmed (§0a-3: seeded null, not a guess) | 4.8 / 2,427 / G2 (channel-spread disclosed — see note) |
| `attributes.review_note` | Trustpilot profile has only ~24 reviews — too small, not used (Sky-Blue-Credit rule); App Store 4.9/70,000 + Google Play 4.7/17,600 used instead, both channels disclosed. | No usable Trustpilot profile found (the frequently-cited "4.6" is not attributable to any findable Copilot Money profile). App Store count varies slightly by source (~24,000-25,000); seeded at the more commonly-cited 24,000. | Feature launched 2026-05-15 (Pro-only), expanded to Plus 2026-06-25 — 7 weeks old at research time, no feature-specific review base exists yet. App-Store-wide ChatGPT ratings measure the entire app, not this feature, so are deliberately NOT used here to avoid a misleading borrowed score. | Extreme channel spread (Experian/Ramp pattern): G2 4.0/2,967 (B2B evaluators) vs. Trustpilot-US 1.1/1,244 (unclaimed profile, billing/support escalations) vs. Trustpilot-UK 3.9/~16,600 (managed profile). Never use one number alone — all three disclosed. | Weakest consumer score in the field: 1.5/5 from ~1,205 Trustpilot reviews (support/cancellation friction, NOT charting quality) alongside 100M+ users and uniformly positive trade-press coverage (StockBrokers.com et al.) — both sides disclosed. | Smallest still-usable sample in the field (~90 reviews) — disclosed as such, not hidden. | Trustpilot 2.9/5 from only ~25 reviews — too small, not used (Sky-Blue-Credit rule). App Store rating/count could not be independently confirmed via search; qualitative complaint pattern used instead (see regulatory/complaint note). | Channel spread: G2 4.8/2,427 (stable 12-24mo) vs. Trustpilot 3.5/5 (support/credit-limit complaints) vs. Capterra 4.9/200+ — all three disclosed, not just the flattering G2 number. |
| `attributes.regulatory_history_note` | No FTC/CFPB/SEC/state-AG enforcement actions or data breaches found. Note: "Monarch data breach 2022" news hits refer to Monarch of North Carolina (a healthcare company) — no connection to Monarch Money; not attributed here. | No enforcement actions or data breaches found. | OpenAI: Italian Garante fined €15M (Dec 2024, GDPR/training data) — **overturned in full by a Rome court on 2026-03-18**; phrase as "fined, then judicially overturned," not a standing sanction. FTC issued a Civil Investigative Demand (July 2023) — an investigation, not an enforcement action; no finding made. A March 2023 data breach exposed some ChatGPT Plus subscribers' chat titles and limited payment data — disclosed as historical precedent relevant to the finance feature's centralization risk. | Parent-level disclosure (TransUnion/Intuit-pattern): FTC Opinion + Final Order, January 2024, finding Intuit's TurboTax "free" advertising deceptive; a separate $141M multistate AG settlement, May 2022, over the same TurboTax "free" marketing. Both concern TurboTax marketing, not the QuickBooks product itself — disclosed as a parent-company footnote, not attributed to QuickBooks' AI features. | No enforcement actions found. Operates as a non-broker charting/publication platform (BBB category: "Trade Publications"), outside SEC/FINRA broker oversight — this is stated plainly, not dressed up as a compliance credential. | No enforcement actions found. Not an SEC-registered adviser; operates as a research/publisher tool ("not investment advice"). | Composer entities: no enforcement actions found; BrokerCheck disclosure section for Composer Securities LLC (CRD 325118) directly verified as clean (zero disclosure events) — see §0a-10. Parent SoFi (footnote, not attributed to Composer): FTC Final Order, Feb 2019 (misleading student-loan-savings advertising claims; no fine, cease-and-desist); SEC settled charges, Aug 2021, against SoFi Wealth LLC for breaching fiduciary duty by investing client robo-advisory assets into SoFi's own proprietary ETFs without adequate disclosure — **$300,000 penalty, censure, cease-and-desist** (resolved via direct verification, not the source matrix's original "amount not confirmed" placeholder); FINRA, 2024, $1.1M fine against SoFi Securities for customer-identification/identity-theft-prevention failures (2018-19, ~800 accounts). | No FTC/CFPB/SEC/state-AG enforcement actions found. BBB profile exists, not accredited, grade not established. Disclosed complaint pattern (not a legal finding): sudden credit-limit reductions from daily linked-bank-balance monitoring; a March 2026 BBB complaint alleging $92,453.70 released by an AP-clerk-role account despite Ramp's own documentation stating "AP Clerks cannot release payments" (an individual customer complaint, not confirmed as an error by Ramp — labeled as such). |
| `attributes.ai_features_note` | AI transaction categorization (learns from custom rules), AI Assistant for natural-language queries over your own data, recurring/subscription detection; Plaid aggregation (12,000+ institutions, read-only). | Learning AI categorization ("the more you use it, the smarter it gets"), personalized recommendations, subscription detection, investment tracking. iPhone/iPad/Mac + web; no Android app (nothing officially announced). | Account aggregation via Plaid (12,000+ institutions — Schwab, Fidelity, Chase, Robinhood, Amex, Capital One, etc.), spending/subscription/portfolio dashboard, conversational analysis of your own linked accounts. No budgeting workflow (no budgets/rules/goals) — narrower than purpose-built apps. **US-only, still in preview** (launched Pro-only 2026-05-15, expanded to Plus 2026-06-25). | Intuit Assist (conversational assistant from Simple Start), automated categorization, cash-flow forecasting, anomaly detection; higher-tier AI Agents (finance/project workflows) only on Advanced ($275/mo) — AI feature depth genuinely varies by plan. | AI Chart Copilot: **public-beta Chrome browser extension** (officially confirmed via TradingView's own blog, not a community script) — chart interpretation, indicator/trendline automation, news/earnings-catalyst summaries, natural-language screening, alert creation. Free during beta with request caps that scale by paid tier. Also ships AI news/filing summaries platform-wide. | Explainable AI Score (1-10) per US stock/ETF (probability of 3-month outperformance vs. S&P 500), 10,000+ daily features per stock, trade ideas, screener, portfolio tools, API. Performance claims ("21% alpha," "70% win rate") are vendor-reported backtests — labeled as such, never presented as independent fact. | Natural-language strategy creation/refinement, backtesting, automated rule-based execution. Explicitly self-limited in its own press release: no agentic trading — AI builds rules, execution follows deterministic, user-defined rules (a compliance-friendly framing, carried through here). | "Ramp Agents": live (not roadmap) autonomous approval of low-risk expenses, escalation of the 10-15% edge cases, real-time anomaly/fraud scanning (including AI-generated fake receipts), policy-improvement suggestions. Plus-tier only. Accuracy/detection-rate figures are vendor claims — labeled as such. |
| `attributes.free_tier_trial_note` | 7-day trial, credit card required ("your first week is on us"); no ongoing free plan. | 1-month trial; no ongoing free plan. | Free ChatGPT does not include the Finances feature at all — Plus ($20/mo) is the minimum paid tier that unlocks it. | **30-day free trial, no credit card required, confirmed to include Intuit Assist across all tiers.** | Genuine, permanent $0 tier; AI Chart Copilot works on it too during the public beta, with the lowest request cap. | 14-day trial confirmed on both Plus and Pro, plus a 30-day money-back guarantee. | Free tier covers strategy building and backtesting only — live automated execution requires the paid Trading Pass. | **Genuine, permanent free base tier (unlimited cards, core expense management) — but Ramp Agents, the AI feature compared on this page, require the paid Plus tier ($15/user/mo). The free tier itself does not include what this column measures.** |
| `is_affiliate` | false | false | false | false | false | false | false | false |
| `review_slug` | `monarch-money-review` (post-fix) | `copilot-money-review` (post-fix) | `chatgpt-for-finance-review` (post-fix) | `quickbooks-ai-review` (post-fix) | null | null | null | null |
| `external_url` (ALL 8, standing rule) | `https://www.monarch.com/` | `https://copilot.money/` | `https://openai.com/chatgpt/` | `https://quickbooks.intuit.com/` | `https://www.tradingview.com/` | `https://danelfin.com/` | `https://www.composer.trade/` | `https://ramp.com/` |
| resulting `ctaMode` | review | review | review | review | visit | visit | visit | visit |

## 6. ChatGPT's review-score handling (resolved — `null`, not a borrowed number)

The Finances feature launched 2026-05-15 (Pro-only) and expanded to Plus users on
2026-06-25 — about 7 weeks old at research time, with no feature-specific review base of
any kind. ChatGPT-the-app's overall App Store rating measures a completely different
surface (writing, coding, general chat) and borrowing it here would imply a false
precision. Seeding `review_score: null` with `review_source: 'n/a — feature too new to
rate'` and a `review_note` explaining this, rather than a bare-number, an App-Store proxy,
or an empty-string placeholder. This is a new (mild) schema pattern — `review_score`/
`review_count` are `.nullable()` in §2, matching the existing `bbb_rating` nullable
precedent from Slice 6 (a deliberate "unknown," never coerced to 0 or hidden).

## 7. filters / priorityChips / sortOptions / matcher

```ts
filters: [
  { key: 'budgeting', label: 'Personal budgeting', predicate: (p) => attrStr(p, 'target_segment') === 'budgeting' },
  { key: 'investing', label: 'Investing & stock research', predicate: (p) => ['stock_research', 'charting', 'automated_investing'].includes(attrStr(p, 'target_segment')) },
  { key: 'business', label: 'Business & accounting', predicate: (p) => ['accounting', 'spend_management'].includes(attrStr(p, 'target_segment')) },
  { key: 'freeTier', label: 'Has a free tier', predicate: (p) => attrStr(p, 'free_tier_trial') === 'free_tier' },
  { key: 'regulated', label: 'SEC/FINRA-regulated entity', predicate: (p) => attr(p, 'regulated_entity') },
],

priorityChips: [
  { id: 'budgeting', label: 'Best for budgeting', icon: 'Wallet', sort: 'budgeting' },
  { id: 'business', label: 'Best for business', icon: 'Users', sort: 'business' }, // §0a non-blocking: 'Briefcase' isn't in CHIP_ICON's valid set {Coins,Percent,Wallet,Star,Users}
  { id: 'free', label: 'Free tier first', icon: 'Percent', sort: 'free' }, // 'Gift' isn't valid either — see same map
  { id: 'rating', label: 'Top rated', icon: 'Star', sort: 'rating' },
],
// NOTE: deliberately no 'cost' chip — banned per §1 (no honest cost comparison exists)

matcher: [
  { id: 'segment', label: 'What do you need AI help with?', weight: 16,
    options: [
      { value: 'budgeting', label: 'Personal budgeting' },
      { value: 'investing', label: 'Investing & stock research' },
      { value: 'business', label: 'Business finance / accounting' },
    ],
    award: (p, a) => {
      const map = { budgeting: ['budgeting'], investing: ['stock_research', 'charting', 'automated_investing'], business: ['accounting', 'spend_management'] };
      return { matched: (map[a] ?? []).includes(attrStr(p, 'target_segment')), reason: 'Matches your use case' };
    } },
  { id: 'free', label: 'Want a genuinely free tier?', weight: 12,
    options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: "Doesn't matter" }],
    award: (p, a) => a === 'yes' ? { matched: attrStr(p, 'free_tier_trial') === 'free_tier', reason: 'Free tier available' } : { matched: true } },
  { id: 'regulated', label: 'Prefer a regulated, SIPC-protected provider?', weight: 8,
    options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: "Doesn't matter" }],
    award: (p, a) => a === 'yes' ? { matched: attr(p, 'regulated_entity'), reason: 'SEC/FINRA-regulated' } : { matched: true } },
],

sortOptions: [
  { value: 'smart', label: 'Smart rank', metric: (p) => p.score },
  { value: 'budgeting', label: 'Best for budgeting', metric: (p) => (attrStr(p, 'target_segment') === 'budgeting' ? 1000 : 0) + p.score },
  { value: 'business', label: 'Best for business', metric: (p) => (['accounting', 'spend_management'].includes(attrStr(p, 'target_segment')) ? 1000 : 0) + p.score },
  { value: 'free', label: 'Free tier first', metric: (p) => (attrStr(p, 'free_tier_trial') === 'free_tier' ? 1000 : 0) + p.score },
  { value: 'rating', label: 'Best rated', metric: (p) => (attrNumOrNull(p, 'review_score') ?? 0) * 100 + p.score },
],
// NOTE: no 'cost' sortOption anywhere — see §1.
```

## 8. compareRows / detailRows

```ts
compareRows: [
  { key: 'price', label: 'Starting price', accessor: (p) => attrStr(p, 'starting_price_headline') }, // §0a-9: short headline, not the full sentence — no `score`, no honest cost ordinal exists (§1/§3)
  { key: 'pricingModel', label: 'Pricing model', accessor: (p) => PRICING_MODEL_LABEL[attrStr(p, 'pricing_model')] }, // informational only, no score
  { key: 'segment', label: 'Best for', accessor: (p) => SEGMENT_LABEL[attrStr(p, 'target_segment')] }, // informational only, no score
  { key: 'freeTier', label: 'Free tier / trial (AI features)', accessor: freeTierTrialLabel, score: (p) => freeTierTrialOrdinal(p) },
  { key: 'regulated', label: 'Regulated entity', accessor: (p) => yesNo(attr(p, 'regulated_entity')) }, // informational only — a single true doesn't make this unfair, matches Slice-6 score_model precedent
  {
    key: 'rating',
    label: 'Consumer review score',
    accessor: (p) => {
      const score = attrNumOrNull(p, 'review_score');
      return score === null ? attrStr(p, 'review_source') : `${score}/5 (${attrNum(p, 'review_count').toLocaleString('en-US')} ${attrStr(p, 'review_source')} reviews)`;
    },
    score: (p) => attrNumOrNull(p, 'review_score') ?? 0,
  },
],

detailRows: [
  { key: 'priceNote', label: 'Pricing detail', accessor: (p) => attrStr(p, 'starting_price_note') || '—' }, // §0a fix: the full sentence now has a home — was a dead field in the earlier draft
  { key: 'aiFeatures', label: 'AI features', accessor: (p) => attrStr(p, 'ai_features_note') || '—' },
  { key: 'freeTierNote', label: 'Free tier / trial detail', accessor: (p) => attrStr(p, 'free_tier_trial_note') || '—' },
  { key: 'regulatedNote', label: 'Regulated-entity detail', accessor: (p) => attrStr(p, 'regulated_entity_note') || '—' },
  { key: 'regulatory', label: 'Regulatory history', accessor: (p) => attrStr(p, 'regulatory_history_note') || '—' },
  { key: 'reviewNote', label: 'Review detail', accessor: (p) => attrStr(p, 'review_note') || '—' },
],
```

`freeTierTrialOrdinal`: `free_tier`→2, `trial`→1, `none`→0. `attrNumOrNull` mirrors the
credit-repair-companies.ts `attrNumOrNull` precedent (returns `null`, not `0`, when the
JSONB value truly is `null` — critical for ChatGPT's review score, matching the same
"don't coerce null to zero" rule already established for MSI's setup fee in Slice 5 and
IdentityIQ's BBB grade in Slice 6).

## 9. Verdict picks (use-case based, not a forced 1-8 hierarchy — Urteil 7)

```ts
verdict: {
  intro: "Our editors' picks for the best AI tools for finance right now — across three very different use cases.",
  picks: [
    { slug: 'monarch', label: 'Best overall / best AI budgeting app' }, // §0a-7: was the review slug 'monarch-money-review' — fixed to the product slug
    { slug: 'ramp', label: 'Best for business spend management' },
    { slug: 'composer', label: 'Best AI investing automation' },
  ],
},
```

Only Monarch carries `is_top_pick: true` (strongest multi-source editorial consensus —
Forbes Advisor 4.8, NerdWallet/Engadget "Mint successor" consensus — and the cleanest
regulatory record of any candidate).

## 10. Compliance

```ts
compliance: {
  notice: "AI-powered finance tools are not financial advisers. None of the tools on this page — except Composer's regulated brokerage/advisory entities — is registered with the SEC or FINRA, and AI-generated analysis can be wrong. Never make investment decisions based solely on AI output.",
  regulators: [], // page-level badge stays empty on purpose (debt-relief precedent) — 7 of 8 candidates are unregulated software; a badge would falsely dignify them. Composer's regulated status lives in its own compareRow/detailRow, not a page badge.
},
```

## 11. buyerGuide content

- **"AI tool ≠ financial adviser"** — SEC/FINRA framing, explains why `regulators: []` at
  the page level and why Composer's regulated status is called out as a fact on its own
  card rather than implying a category-wide credential.
- **Segments, not a single hierarchy** — explicitly names the three use-case clusters
  (personal budgeting, investing/research, business/accounting) and states plainly that
  comparing prices across them 1:1 would be misleading (the same point as §1, aimed at
  readers rather than implementers).
- **Data privacy: which perimeter gets your financial data** — purpose-built apps
  (Monarch, Copilot) have a narrower data perimeter than a general-purpose LLM (ChatGPT);
  explains the account-centralization risk plainly, cross-references the March 2023
  OpenAI breach as a concrete precedent, and recommends MFA regardless of which tool a
  reader picks.
- **Truewind — an emerging category, not yet a fair comparison** — the excluded
  candidate's paragraph from §0, stated plainly rather than omitted.
- **"AI feature ≠ standalone product"** — explains the bundle-tier problem (ChatGPT,
  QuickBooks) so readers understand why the "starting price" isn't the price of the AI
  feature alone.

## 12. Content-hygiene fixes required in this slice (owner-approved scope)

Third occurrence of the stale/fabricated-content pattern (after Forex, Credit Repair) —
this time numeric/date corrections and dead-CTA swaps, not invented narratives:

1. **`content/us/ai-tools/monarch-money-review.mdx`** — remove the fabricated "Trustpilot
   4.7/5 from 2,000+ reviews" claim (real Trustpilot profile: ~24 reviews, unusable;
   replace with the sourced App Store 4.9/70,000 + Google Play 4.7/17,600 figures);
   remove the "Free Basic Plan (90-day history)" claim (does not exist — 7-day trial
   only); correct pricing to Core $14.99/mo or $99.99/yr, Plus $199/yr (annual only,
   currently missing entirely); replace the dead `/go/monarch-money` CTA (no
   `affiliate_links` row exists) with the bare `external_url`; update the domain
   reference from monarchmoney.com to monarch.com.
2. **`content/us/ai-tools/copilot-money-review.mdx`** — remove the unattributable
   "Trustpilot 4.6/5" claim (no findable Copilot Money Trustpilot profile exists);
   correct the App Store review count (sourced range 24,000-25,000, not the MDX's
   unsourced "50,000+"); correct $96/yr to the current $95/yr; update the
   "Apple-exclusive" framing — a web version has existed since December 2025; replace the
   dead `/go/copilot-money` CTA.
3. **`content/us/ai-tools/chatgpt-for-finance-review.mdx`** — full content modernization:
   the file currently describes GPT-4o/GPT-3.5 with an "April 2024 cutoff" framing and
   does not mention the native Finances feature at all (the entire reason this candidate
   is in the comparison); remove the unsourced `reviewCount: 15000` frontmatter claim;
   replace the dead `/go/chatgpt-plus` CTA.
4. **`content/us/ai-tools/quickbooks-ai-review.mdx`** — replace the entire pricing table
   (real 2026 tiers: Solopreneur $20, Simple Start $38, Essentials $75, Plus $115,
   Advanced $275 — the file's current $20/$30/$55/$200 figures are stale and Advanced is
   missing entirely); update "7M+ users" if a fresher figure is sourced during the fix;
   correct or remove the "12,000+ institutions via Plaid" claim (Intuit's own published
   count is ~2,936 directly-connected US institutions; the 12,000+ figure is Plaid's
   global reach, not QuickBooks' specific coverage — conflating the two overstates the
   claim); remove the unsourced `reviewCount: 25000` frontmatter claim; replace the dead
   `/go/quickbooks-ai` CTA.
5. **Not in scope for this slice** (documented, not fixed): the broader orphan `/go/`
   target audit across the `ai-tools` silo (ynab, stripe-radar, writesonic, claude-ai,
   wave, freshbooks, and a 12-occurrence `best-ai-writing-tools-finance` reference) — a
   separate follow-up task, matching how Slice 5/6 scoped their in-slice content fixes to
   only the candidates actually being seeded.

## 13. Pre-seed verification — mostly RESOLVED, two items genuinely deferred to migration gate

Resolved via direct WebSearch/WebFetch/live-browser session (this session, 2026-07-04):

1. **Truewind's G2 count** (the one item that actually gated a structural decision) —
   resolved to 4 reviews via a real browser session against G2 directly (WebFetch itself
   403's, matching this rollout's established WAF-block pattern) — see §0.
2. **SoFi's 2021 SEC penalty amount** (source matrix flagged as unconfirmed) — resolved:
   $300,000, censure, cease-and-desist, settled 2021-08-19, SoFi Wealth LLC.
3. **QuickBooks "12,000+ institutions via Plaid" claim** — resolved as a real but
   misattributed number: that figure describes Plaid's *global* institution count, not
   QuickBooks' actual US bank-feed coverage (Intuit's own published count is ~2,936
   directly-connected institutions, via a combination of Plaid and Finicity). Corrected
   in the seed note and the content fix (§12 item 4).
4. **Monarch pricing** — fully confirmed against 3+ independent sources: Core $99.99/yr
   or $14.99/mo, Plus $199/yr (annual only), 7-day trial (card required), promo codes
   MONARCHVIP (-50%) and WELCOME (-30%).
5. **Composer pricing** — confirmed: $40/mo regular, $32/mo if billed annually ($384/yr).
6. **App Store/Google Play/G2 review counts** for Monarch, Copilot Money, Ramp, and
   QuickBooks — all cross-checked against 2+ independent sources (see §5 review_note
   cells for each).

**Still open at migration gate** (1 item — narrow, non-structural):

7. **Danelfin's exact US-dollar pricing** — my own attempt to verify live hit a
   region-locked pricing page (rendered EUR pricing with a German cookie-consent banner
   in this session's browser context, not the US $ figures needed) — WebSearch sources
   show minor variance ($19-22/mo Plus, $52-59/mo Pro depending on source). Seeded
   conservatively at the higher figures ($22/$59), `confidence: medium`. Re-verify from a
   US-geolocated session before finalizing if a cleaner figure is available.

**Resolved during the Fable-5 pre-migration review pass (§0a):**

8. **Composer's BrokerCheck disclosure section** (CRD 325118) — **resolved: zero
   disclosure events** (no criminal, regulatory, civil-judicial, or financial matters on
   record for Composer Securities LLC itself, independent of parent SoFi's history). The
   "genuine differentiator" framing in §5's `regulated_entity_note` is now fully earned.
9. **Composer Technologies Inc.'s continued RIA registration post-SoFi-acquisition**
   (CRD 311289, Form ADV) — **resolved: confirmed still actively registered** (SEC Form
   CRS on file under this CRD as of research date).
10. **Danelfin's 14-day trial** — the pre-migration review flagged this value as
    unsourced in the original draft; **resolved: confirmed** via direct search (14-day
    trial on both Plus and Pro, plus a 30-day money-back guarantee).
11. **QuickBooks' free-trial existence** — the pre-migration review caught this as a
    false negative (seeded `'none'`); **resolved: QuickBooks Online has a genuine 30-day
    free trial, no credit card required, confirmed across all tiers including Intuit
    Assist** — corrected to `'trial'` in §5.

All seeded facts now have either a direct source or an explicit, disclosed confidence
caveat — no cell rests on an invented or unverified value. Proceeding to implementation.

## 14. Additional required TopicConfig fields (§0a-11 — omitted from the initial draft)

```ts
slug: 'ai-tools-finance',
category: 'ai-tools',
label: 'AI Tools for Finance',
h1: (y) => `Best AI tools for finance in ${y}`,
metaTitle: (y) => `Best AI Tools for Finance (${y}) — Compared & Ranked`,
metaDescription: (y) =>
  `Compare the best AI-powered finance tools of ${y}: budgeting apps, AI investing automation, business spend management and more — independent, sourced, and honest about what's comparable and what isn't.`,
intro:
  "Independent, side-by-side comparison of AI tools across personal budgeting, investing & research, and business finance — three genuinely different use cases, never forced into one price-based ranking.",
publishedDate: '2026-07-04',
```

**methodology** (mandatory heterogeneity paragraph, Urteil 2.5):

> "These eight tools solve different problems — from personal budgeting to corporate
> spend automation to AI-assisted investing — so we don't force them into a single
> price-based ranking. 'Starting price' shows each vendor's cheapest plan that unlocks
> the AI features described, labeled with its pricing model (flat subscription, bundle
> tier, per-user, or freemium); these are not like-for-like dollar figures. ChatGPT and
> QuickBooks bundle their AI features inside a much broader subscription; Ramp charges
> per user and its free tier does not include the AI agents compared here. We evaluate
> each tool within its own use case (budgeting, investing & research, or business &
> accounting) using editorial consensus, feature substance, and review data where a
> credible sample exists — never a cross-category cost comparison. Consumer review
> scores always show the source and count alongside the number; where no credible score
> exists (ChatGPT's finance feature launched 7 weeks before this review), we say so
> rather than borrow an unrelated number. Rankings never depend on commissions — none
> of these 8 tools currently has an affiliate relationship with SmartFinPro."

**faq** (must include the cost-$0 explanation per change 1, trading-platforms condition 2):

- *"How is the cost comparison calculated?"* — "It isn't a meaningful number for this
  category. These 8 tools use four fundamentally different pricing structures — flat
  subscriptions, AI features bundled into a larger subscription, per-user business
  pricing, and free tiers — so a single dollar figure would misrepresent the real cost.
  Instead, we show each tool's starting price with its pricing model labeled, and let you
  filter by use case and free-tier availability."
- *"Which of these tools is actually free?"* — names Monarch/Copilot's trial-only
  status, TradingView/Composer/Ramp's genuine free base tiers (with Ramp's AI-feature
  caveat explicit), and ChatGPT/QuickBooks' lack of any free access to the AI feature.
- *"Is Composer regulated?"* — states the SEC-RIA/FINRA-SIPC-broker-dealer facts plainly,
  notes it's the only regulated entity in the comparison, and that every other tool here
  is unregulated software.
- *"Why isn't Truewind ranked?"* — states the G2-review-count reasoning plainly (see §0).
- *"Are these affiliate links?"* — standard rollout disclosure language (none currently
  monetized on this page).
