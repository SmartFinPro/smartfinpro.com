# Comparison Cockpit — Design Spec

> **Status:** Reviewed (D1–D4 approved, review additions integrated) · **Date:** 2026-06-28 · **Branch:** `feat/comparison-engine`
> Reusable, brand-faithful product-comparison experience ("Cockpit") that powers all 10
> SmartFinPro "Best X" money pages from one codebase + per-topic config + seed data.
> Pilot: **Best Robo-Advisors 2026**.

---

## 1. Goal & context

Build the most compact, interactive, personalized product-comparison page in the niche — one that
lets a visitor decide in seconds and convert immediately, while ranking strongly in both Google and
answer engines (ChatGPT / Perplexity / AI Overviews).

Competitor teardown (Forbes Advisor, NerdWallet, Robo-Advisor-Finder) showed a unanimous weakness:
long static prose listicles where the comparison is buried, non-interactive, mobile-hostile, and the
only decision aid is a "Best for X" tag. We beat all three on the same axes at once **and** add a live
cost projection and a side-by-side compare none of them have.

We extend the **existing, live Comparison Engine** (`/us/business-banking/best`, PR #32) rather than
rebuild: its data model, ranking logic, CTA gating, affiliate redirect, SSG and JSON-LD are reused.
New work is the **Cockpit UI layer**, a **per-topic config system**, a **data-model migration**,
**mobile**, the **SEO/AEO content architecture**, and the **data-integrity / attribution guards** below.

---

## 2. The 10 money pages — taxonomy rule & mapping

**Taxonomy rule (D-taxonomy):** use the **dedicated category silo when one exists**; reserve
`personal-finance` only for true subtopics that have **no** silo of their own. Stronger silos earn
their own category for topical authority and cleaner internal linking.

| # | Page | market | category | topic | Route | Pilot |
|---|------|--------|----------|-------|-------|-------|
| 1 | Best Robo-Advisors 2026 | us | personal-finance | `robo-advisors` | `/us/personal-finance/best/robo-advisors` | **YES** |
| 2 | Best Trading Platforms 2026 | us | trading | `trading-platforms` | `/us/trading/best/trading-platforms` | |
| 3 | Best Forex Brokers 2026 | us | forex | `forex-brokers` | `/us/forex/best/forex-brokers` | |
| 4 | Best Credit Repair Companies 2026 | us | **credit-repair** | `companies` | `/us/credit-repair/best/companies` | |
| 5 | Best Credit Monitoring Services | us | personal-finance | `credit-monitoring` | `/us/personal-finance/best/credit-monitoring` | |
| 6 | Best Business Bank Accounts | us | business-banking | `business-bank-accounts` | `/us/business-banking/best/business-bank-accounts` | (migrate live pilot) |
| 7 | Best AI Tools for Finance Professionals | us | ai-tools | `ai-tools-finance` | `/us/ai-tools/best/ai-tools-finance` | |
| 8 | Best Cybersecurity Tools for Small Business | us | cybersecurity | `cybersecurity-smb` | `/us/cybersecurity/best/cybersecurity-smb` | |
| 9 | Best Gold Investing Platforms | us | **gold-investing** | `platforms` | `/us/gold-investing/best/platforms` | |
| 10 | Best High-Yield Savings Accounts | us | personal-finance | `high-yield-savings` | `/us/personal-finance/best/high-yield-savings` | |

→ **credit-repair** and **gold-investing** use their own silos (#4, #9). `personal-finance` holds only
robo-advisors, credit-monitoring, high-yield-savings (#1, #5, #10).

**Verification step (must do before build):** confirm `credit-repair` and `gold-investing` exist in
`lib/i18n/config` (`marketCategories` / `isValidCombo`). `gold-investing` is already a valid
`affiliate_links.category`; if either is missing from `marketCategories`, add it there first
(precedent: `…_extend_affiliate_links_category_constraint.sql`) so `isValidCombo` doesn't `notFound()`.

---

## 3. Information architecture & routing

**New route:** `app/(marketing)/[market]/[category]/best/[topic]/page.tsx`
(`best` is a static segment → no collision with the `[market]/[category]/[slug]` MDX review catch-all).

- `generateStaticParams()` SSGs one page per distinct active `(market, category, topic)` in
  `product_attributes`.
- `generateMetadata()` per topic: title (50–60c) `Best {Topic} ({year}) — Compared & Ranked`,
  meta description (150–160c), canonical, hreflang only for markets with data.

### 3.1 Business-banking URL migration (301 plan)

The live pilot at `/us/business-banking/best` moves to `/us/business-banking/best/business-bank-accounts`.
To avoid losing the first live funnel's signals:

1. **301 (permanent) redirect** old → new in `next.config.ts` redirects (or middleware); never a 302.
2. **Canonical** on the new page points to itself; the old URL no longer self-canonicals.
3. **Sitemap:** `app/sitemap.ts` emits the new topic URL; drop the old `/best`.
4. **Hreflang matrix** updated to the new URL.
5. **Internal links** (nav, related, dashboard deep-links) repointed to the new URL.
6. Keep the redirect indefinitely; verify in GSC that the old URL consolidates to the new.

Do this only after the topic route + business-bank-accounts config/seed are live and verified.

---

## 4. Data model (one migration)

`product_attributes` is today business-banking-shaped. Make it generic. New migration
`supabase/migrations/YYYYMMDDHHMMSS_product_attributes_topics.sql`:

```sql
-- product_attributes: generic topic/provenance columns
ALTER TABLE product_attributes
  ADD COLUMN IF NOT EXISTS topic            VARCHAR(60),
  ADD COLUMN IF NOT EXISTS management_fee   DECIMAL(6,3),
  ADD COLUMN IF NOT EXISTS account_minimum  DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS attributes       JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS deep_dive        TEXT,
  ADD COLUMN IF NOT EXISTS source_type      VARCHAR(20)
    CHECK (source_type IN ('official','regulator','editorial','user_reviews')),
  ADD COLUMN IF NOT EXISTS confidence       VARCHAR(10)
    CHECK (confidence IN ('high','medium','low'));

-- backfill existing rows so business-banking keeps working
UPDATE product_attributes SET topic = 'business-bank-accounts'
  WHERE category = 'business-banking' AND topic IS NULL;

-- a provider may now appear under multiple topics.
-- DO NOT trust a fixed constraint name — look it up by columns (see migration-safety, §6.3).
DO $$
DECLARE cname text;
BEGIN
  SELECT conname INTO cname
    FROM pg_constraint
   WHERE conrelid = 'product_attributes'::regclass
     AND contype  = 'u'
     AND conkey = (SELECT array_agg(attnum ORDER BY attnum)
                     FROM pg_attribute
                    WHERE attrelid = 'product_attributes'::regclass
                      AND attname IN ('market','category','slug') AND NOT attisdropped);
  IF cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE product_attributes DROP CONSTRAINT %I', cname);
  END IF;
END $$;

ALTER TABLE product_attributes
  ADD CONSTRAINT product_attributes_uq UNIQUE (market, category, topic, slug);
```

- `attributes JSONB` = the **generic escape hatch** (the key gap from discovery): topic-specific facts
  (robo: `tlh`, `human_advisor`, `account_types[]`, `sipc`, `frac`, `sri`, `crypto`; forex: `spread`,
  `max_leverage`, `regulators[]`; savings: `apy`, `compounding`, `fdic`…). Validated by a per-topic Zod
  schema (§5, §6.2) — **JSONB without validation silently renders typos**.
- `source_type` + `confidence` = provenance/quality (esp. for APY, fees, bonuses, ratings). Surfaced in
  the methodology/trust layer and used to flag low-confidence data in monitoring (§13).
- Banking-specific typed columns stay for back-compat; new topics use the generic ones.
- **Deploy note:** `deploy.yml` runs NO migrations — apply manually (`supabase db push` / dashboard)
  before the route goes live, or it 404s in prod.

Affiliate-link tracking columns are added in the **same or a sibling migration** — see §11.1.

---

## 5. Per-topic configuration system

Single biggest reuse lever: **content/logic is config, not code.** New page = new config + seed,
**no new components.** `lib/comparison/topics/<topic>.ts` exports a `TopicConfig`;
`lib/comparison/topics/index.ts` is the registry (`getTopicConfig(category, topic)`).

```ts
interface TopicConfig {
  slug: string;                       // 'robo-advisors'
  label: string;                      // 'Robo-Advisors'
  h1: (year: number) => string;
  intro: string;                      // keyword-rich lede
  attributesSchema: z.ZodType;        // Zod schema for `attributes` JSONB (REQUIRED — see §6.2)
  specColumns: SpecColumn[];          // 4 headline cells (label, accessor, format, winner:'min'|'max')
  filters: FilterDef[];               // pill toggles (key, label, predicate over attributes)
  priorityChips: IntentDef[];         // "In a hurry?" quick-sorts
  matcher: MatcherQuestion[];         // weighted, deterministic
  sortOptions: SortOption[];
  costModel: CostModelDef;            // X-yr cost formula (§8)
  compareRows: CompareRow[];          // side-by-side attribute rows
  detailRows: DetailRow[];            // "View details" spec rows
  // SEO/AEO (§10)
  verdict: VerdictConfig;             // Editor's verdict block (named picks)
  methodology: string;                // "How we test"
  buyerGuide: GuideSection[];         // H3 per criterion
  faq: { q: string; a: string }[];
  compliance: ComplianceConfig;       // disclaimers, regulator labels per market
}
```

The Cockpit reads the existing `ProductForComparison` contract; topic-specific fields come from
`attributes` JSONB, normalized by the loader against the active config.

---

## 6. Data integrity, validation & migration safety

### 6.1 Attribution gate (must pass before a monetized CTA renders)
See §11.1 — a provider only renders the green monetized `View offer` when its affiliate link's
`tracking_status` is `verified` or `dashboard_only`; otherwise it falls back to `visit`/`review`.
This stops the 492-clicks-→-0-conversions gap from scaling to all 10 pages.

### 6.2 Zod validation of `attributes`
Each `TopicConfig.attributesSchema` is a Zod schema (e.g. `roboAttributesSchema`, `forexAttributesSchema`,
`savingsAttributesSchema`). The loader (`lib/comparison/loader.ts`) validates every row's `attributes`
against the active topic schema via existing `lib/validation`:
- **Dev:** throw/log loudly so seed typos surface immediately.
- **Prod:** `logger.error` the offending `(slug, issues)` and exclude the row (don't silently render
  wrong data). This directly counters the schema-drift trap (typos pass `tsc`/build but break live).

### 6.3 Migration safety
Never blind-drop a constraint by assumed name — names can differ from `schema.sql`. The migration in §4
looks the unique constraint up in `pg_constraint` by its columns and drops it dynamically; all `ADD
COLUMN`s use `IF NOT EXISTS`. Same pattern for the affiliate-links migration (§11.1).

---

## 7. Component architecture (reuse vs new)

**Reused as-is:** `lib/comparison/{loader,ranking,types,matcher,intents}.ts` (made config-driven),
`ProductForComparison`, `/go/[slug]` + `buildTrackedDestinationUrl` (`lib/affiliate/tracker.ts`),
link-registry CTA gating, SSG, `TrustBar`, `AffiliateDisclosure`, `StarRating`, tracking hook,
brand tokens in `app/globals.css`.

**New (the Cockpit layer):**
- `components/marketing/comparison-cockpit.tsx` (`'use client'`) — orchestrator (amount, years, sort/dir,
  filters, selection, view, matcher); imports **only pure logic** (avoids the Turbopack
  `'use client'→'use server'` crash).
- `cockpit-card.tsx` — provider card (green `View offer` + `on domain` + `Compare` toggle; sky
  `Read review`; outline `View details` with sub-scores, spec rows, **deep_dive prose [Tier 2 SEO]**,
  verdict box).
- `cockpit-table.tsx` — dense sortable matrix (click-to-sort + `aria-sort`, winner-per-column green,
  live cost bar).
- `cockpit-compare.tsx` — first-class **Compare view**: auto-seeds top-3 by current sort, chip-bar to
  add/remove (2–4), per-column remove, winner-per-row green, per-column CTA.
- `cockpit-decision-bar.tsx` — intents + live cost sliders (gold fill) + "Find my match".
- `lib/comparison/cost.ts` — generic `costOverTime(product, config, inputs)`.

**Build strategy (D3, approved):** Cockpit powers the **topic route**; legacy engine stays for legacy
`/best` until business-banking migrates (§3.1). Zero risk to the live pilot, A/B-able.

**Brand:** colors from `--sfp-*` variables (not hardcoded hex). Locked components not restyled. The dark
button/select artifacts seen in the prototype were **preview-host quirks only** — irrelevant in prod.

---

## 8. Interaction model (the Cockpit)

Three peer views via a prominent top switch **Cards · Table · Compare**.

- **Decision bar:** intent pills (quick-sort + match), live cost sliders (Amount, Years) that re-rank
  and update each provider's **X-yr cost** (turns "0.25%" into "$1,580 / 10 yrs"), and a deterministic
  weighted "Find my match" → top pick + green "Your match".
- **Cards:** rich SSR-ranked feed (the SEO-friendly default).
- **Table:** dense matrix, sortable headers, winner-per-column green, live cost bar.
- **Compare:** never empty — one click auto-loads top-3 side-by-side; chip-bar swaps providers (2–4);
  winner-per-row green + per-column CTA. Selection shared across views; sticky navy tray is the shortcut.
- **Sort/Filter:** config-driven dropdown + intent quick-sorts (synced); AND filter pills + empty state.
  **URL state (D4, approved):** sort/filters/amount/selection in query params (shareable + SSR-restorable).
  CI caveat: run full `npm run build` before merge (useSearchParams bailouts aren't caught by guardrails).

**Cost model** (`costOverTime`): config picks the formula. Robo = compounding management fee on AUM over
N years at 6% growth; banking = existing `annualCost`.

---

## 9. Design system / brand

Light "trust" design only. Brand palette via CSS variables: `--sfp-navy #1B4F8C`, `--sfp-gold #F5A623`
(slider fill, "Top pick" badge), green `#54B269` (the locked CTA green — `View offer`), `--sfp-sky
#E8F0FB`, Read-review royal blue `#3B5FD9`, green star tiles `#00B67A`, `--sfp-red` cons only. Badges,
star tiles, sub-score bars, verdict box and spec rows match the live engine 1:1 (validated against the
production Mercury card during prototyping).

---

## 10. SEO/AEO content architecture

Four tiers — **answer + tool first, depth around it** (the opposite of the competitors who bury the tool).

- **Tier 0 — Invisible (biggest AEO lever):** per topic emit JSON-LD `ItemList`, `Product`+`Offer` per
  provider, `FAQPage`, `Article` (author Person + credential, `datePublished`/`dateModified`),
  `BreadcrumbList`; per-topic `/llms.txt` entry; meta tags. Per-provider `AggregateRating` intentionally
  omitted (deprecated). Extend `lib/seo/schema.ts` to be topic-generic.
- **Tier 1 — Visible, tight, top:** H1 + 3–4-sentence **"Editor's verdict"** block naming the picks
  (snippet / AI-Overview bait) + trust strip (`data_verified_at`, reviewer + credential, "N tested",
  methodology link).
- **Tier 2 — In the tool:** per-provider `deep_dive` prose (200–350w) inside `View details` (long-tail
  brand keywords + Experience). Crawlable (SSR DOM, collapsed). Rule: **visible = the decision-critical
  answer; collapsed = the depth.**
- **Tier 3 — Below the tool:** `H2` *How we test {topic}* (methodology, sources, scoring, independence) ·
  `H2` *What to look for* (buyer's guide, `H3` per criterion) · `H2` *FAQ* + `FAQPage` schema (highest-ROI
  AEO block) · author bio + "last reviewed" + sources.

One `H1` per page; provider names as `H3` within cards for document outline.

---

## 11. Affiliate, attribution gate, tracking & compliance

### 11.1 Attribution gate (per provider)
`is_affiliate=true` is **necessary but not sufficient.** Add tracking metadata to `affiliate_links`
(robust, `IF NOT EXISTS`):

```sql
ALTER TABLE affiliate_links
  ADD COLUMN IF NOT EXISTS tracking_status   VARCHAR(20) NOT NULL DEFAULT 'unverified'
    CHECK (tracking_status IN ('verified','dashboard_only','unverified','inactive')),
  ADD COLUMN IF NOT EXISTS postback_supported BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS subid_param        VARCHAR(40),
  ADD COLUMN IF NOT EXISTS network            VARCHAR(40);
```

CTA-gating logic (loader) becomes:
```
isOffer = is_affiliate
       && activeOfferSlugs.has(slug)
       && link.tracking_status ∈ { 'verified', 'dashboard_only' }
ctaMode = isOffer ? 'offer' : review_slug ? 'review' : 'visit'
```
- `verified` = full S2S confirmed (`network` + `subid_param` + `postback_supported`) → monetized green CTA.
- `dashboard_only` = monetized, no S2S (e.g. Mercury) → green CTA allowed, flagged "no postback".
- `unverified` / `inactive` → **no** monetized CTA; render `visit`/`review` so we never ship a fake
  money button. This is the explicit gate that prevents scaling the 0-conversion gap across 10 pages.

Only build affiliate mappings for real tracking links; `buildTrackedDestinationUrl` must know the
provider's `network` (extend to cover PartnerStack et al.).

### 11.2 Compliance
`AffiliateDisclosure` top (market-aware); wire in `getComplianceLabel` (engine gap today). US investing
topics: visible **"Not investment advice · capital at risk"** + SEC/SIPC mention. UK/AU later: FCA/ASIC.

---

## 12. Mobile (requirements — mocked next)

Biggest functional gap of the live engine (zero responsiveness, hardcoded grids). Requirements:
- **Cards:** single column; 4-col spec row → 2-col; pros/cons stack; header CTA full-width.
- **Table:** horizontal scroll with **sticky first column** + sticky header; or compact stacked rows < ~640px.
- **Compare:** horizontal column paging / snap-scroll; sticky attribute-label column.
- **Compare tray / Find-my-match:** Radix `sheet` **bottom-sheet**.
- **Decision bar:** collapsible.
- Real container queries / Tailwind breakpoints; motion-reduce respected.

---

## 13. Monitoring after launch (per topic)

A small per-topic report (dashboard widget + weekly Telegram digest), reusing the tracking hook +
`/api/track` + analytics tables:
- impressions · CTA clicks · **offer clicks by provider** · matcher completions · filter usage ·
  conversion rows (from `conversion_events`) · **stale-data count** (rows where `data_verified_at`
  older than threshold, or `confidence = 'low'`).
Surfaces both monetization health (clicks vs conversions per provider) and content freshness.

---

## 14. Test gates & verification (per page, before merge/launch)

- `tsc` (no type errors) · `npm run check:imports` · `npm run check:mdx` (if MDX touched).
- **Local `npm run build`** — CI does NOT run a full Next build (prerender/useSearchParams bailouts slip
  past PR guardrails); check the deploy **run conclusion**, not the watch exit.
- **Smoke (prod build + curl):** SSR HTML contains the **top-3 providers**; JSON-LD blocks are
  parseable; CTA-gating renders correctly (offer vs visit vs review per `tracking_status`).
- **Mobile Playwright screenshots** for Cards / Table / Compare at a phone viewport.
- Migration applied (`supabase db push`) before the route is exercised in prod.

---

## 15. Build sequence

- **Phase A — Foundation + pilot:** migrations (product_attributes + affiliate_links); Cockpit
  components; topic-config system + Zod schemas; `costOverTime`; robo-advisors config + US seed
  (~6–8 providers w/ `source_url`, `source_type`, `confidence`, `data_verified_at`); topic route.
  Ship `/us/personal-finance/best/robo-advisors`.
- **Phase B — Mobile.**
- **Phase C — SEO/AEO:** Tier 0 JSON-LD (topic-generic) + Tier 1 verdict block + Tier 3 methodology/
  buyer's guide/FAQ + `llms.txt`.
- **Phase D — Scale to the other 9:** each = new `TopicConfig` + Zod schema + seed + SEO content +
  attribution-gate review, **no new components.** Order: Trading Platforms, Forex Brokers, Credit Repair
  (own silo), Credit Monitoring, Business Bank Accounts (migrate pilot + §3.1 301 plan), AI Tools
  (finance), Cybersecurity (SMB), Gold Investing (own silo), High-Yield Savings.

Each topic only graduates to "monetized" once its providers pass the §11.1 attribution gate.

---

## 16. Decisions (approved)

- **D1 URL schema:** `/[market]/[category]/best/[topic]`. ✅
- **D2 Per-provider prose:** `deep_dive` column + optional `review_slug` "Read full review". ✅
- **D3 Build strategy:** Cockpit alongside legacy engine; migrate business-banking later. ✅
- **D4 URL state:** ship query-param state in Phase A. ✅
- **D-taxonomy:** dedicated silo when it exists (credit-repair, gold-investing); `personal-finance` only
  for siloless subtopics. ✅

---

## 17. Out of scope / later

LLM matcher (`/api/comparison/match`); non-US markets/seeds; range filters; column show/hide; shared
headless DataTable abstraction; provider logos (initial tiles for now); per-field provenance in
`attributes._meta` (row-level `source_type`/`confidence` for now).

---

## 18. Key file paths

- Route: `app/(marketing)/[market]/[category]/best/[topic]/page.tsx` (new)
- Loader/logic: `lib/comparison/{loader,ranking,types,matcher,intents}.ts` · `lib/comparison/cost.ts` (new)
- Topic config + Zod: `lib/comparison/topics/<topic>.ts` + `…/topics/index.ts` (new)
- UI: `components/marketing/comparison-cockpit.tsx` · `cockpit-{card,table,compare,decision-bar}.tsx` (new)
- Affiliate: `lib/affiliate/tracker.ts` · `lib/affiliate/link-registry.ts` · `app/(marketing)/go/[slug]/route.ts`
- Schema: `lib/seo/schema.ts` (extend topic-generic)
- DB: `supabase/migrations/*_product_attributes_topics.sql` · `*_affiliate_links_tracking.sql` · per-topic seeds
- Tokens: `app/globals.css` · Disclosure: `components/ui/affiliate-disclosure.tsx`
- Config check: `lib/i18n/config` (`marketCategories` must include `credit-repair`, `gold-investing`)
