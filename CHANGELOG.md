# Changelog

All notable changes to SmartFinPro.com are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

### Attribution Watchdog — Segment-Aggregation (P2 review fix) — 2026-07-07

Aggregation key extended from `partner_name` to `partner_name + market + category (+ network)` — multi-market providers (e.g. NordVPN with 8 links across us/uk/ca/au) no longer mix scores, conversion windows and incidents across markets.

- **`lib/actions/attribution-watchdog.ts`**: segments as aggregation unit (59 instead of 47 with current prod data); incident identity = provider+market+category (network excluded so a network migration cannot duplicate a live incident); CTA matching per name+market; lifetime clicks per view triple; alerts + dryRun report carry market/category
- **Migration** `20260707160000_attribution_incident_segment_dedupe.sql`: partial unique index `uq_attribution_incident_live` rebuilt on `(provider, COALESCE(market,''), COALESCE(category,''), incident_type)` (apply manually via `supabase db push`)
- **Dashboard**: widget rows + incident cards + compact card show market flag (Page-Rankings pattern) and category; row expansion keyed per segment
- Pure scoring logic (`lib/attribution/health-score.ts`) unchanged; verified: tsc 0 errors, vitest 388/388, dryRun against prod (NordVPN 63/27/24/33 clicks = 147 raw total, 0 errors, 0 false-positive incidents)

### Attribution Watchdog (Phase 1) — 2026-07-07

Detects silent revenue-attribution failures per provider (clicks flowing, conversions/revenue not — the "492 clicks, 0 conversions" blind spot).

- **New cron** `/api/cron/attribution-watchdog` (daily 06:30 UTC, `?dryRun=1` for zero-write verification)
- **Health Score 0–100 per provider** (`lib/attribution/health-score.ts`, pure + unit-tested): tracking config, conversion recency vs. expected window (per-provider/category), clicks since last conversion, CR vs. 180d baseline, click_id share, network sync freshness
- **Silent-failure incidents** (`attribution_incidents` table): cta_no_go / clicks_no_postback / postback_no_revenue / conversion_stalled, with revenue-risk estimate, type-specific auto-resolve, snoozeable ignore (`ignored_until`), Notification-Center alerts
- **Dashboard**: full widget on `/dashboard/revenue#attribution-watchdog` (score breakdown, incident actions), compact card on the Command Center
- **Migration** `20260707120000_attribution_watchdog.sql` (apply manually via `supabase db push`)

## [release/phase3-premium-polish-2026-03-15] — 2026-03-15

**Branch:** `feat/quality-upgrades-march-2026`
**Tag:** `release/phase3-premium-polish-2026-03-15`
**Build:** `tsc 0 errors · vitest 250/250 · next build 405/405`

### Phase 3 — Premium Polish (PP1–PP6)

#### PP1 — Hreflang Content-Availability Filter (`9b7217a`)
- `app/(marketing)/[market]/[category]/[slug]/page.tsx`: Added `React.cache()` memoized slug Set for O(1) content-existence lookups — prevents hreflang links to 404 pages on other markets
- `app/(marketing)/[market]/[category]/page.tsx`: Synchronous `marketCategories` filter — only emits alternates for markets where the category actually exists

#### PP2 — Schema Pre-render Validation Guards (`3711446`)
- `components/seo/review-schema.tsx`: Guard with `== null` check for `review.rating` (valid `0` preserved)
- `components/seo/article-schema.tsx`: Guard for `title`, `description`, `author`
- `components/seo/aggregate-rating-schema.tsx`: Guard with `== null` for `ratingValue`, `reviewCount`
- `components/seo/financial-product-schema.tsx`: Guard with `== null` for `rating`, `reviewCount`
- `components/seo/person-schema.tsx`: Guard for `name`

#### PP3 — Shadcn Dark-Mode Class Cleanup (`7cd9274`)
- Removed 11 dead `dark:*` tokens from 7 shadcn/ui components (`tabs.tsx`, `badge.tsx`, `button.tsx`, `dropdown-menu.tsx`, `select.tsx`, `textarea.tsx`, `input.tsx`) — project is light-only, no dark mode

#### PP4 — Server-Action Return-Type Documentation (`e27a37a`)
- `lib/actions/page-cta-partners.ts`: Added `@returns` JSDoc annotations to all 4 functions — no functional changes, existing patterns already correct

#### PP5 — WCAG AA Contrast Fix for Small Text (`d7c7476`)
- `components/marketing/pre-qual-quiz.tsx`: 3× `text-slate-400` → `text-slate-500` (~3:1 → ~5.5:1)
- `components/marketing/header.tsx`: 11× `text-gray-400` → `text-gray-500`
- `components/marketing/sticky-footer-cta.tsx`: 2× `text-gray-400` → `text-gray-500`

#### PP6 — Image Sitemap Extension (`a3ac73a`)
- `app/sitemap.ts`: Added `images: string[]` to pillar pages (hero assets), broker review pages (SVG logos via `existsSync` guard), and content pages (review images via asset registry)
- ~78 image entries added across 279 sitemap URLs

---

### Phase 2 — Structural Fixes + Hydration (SF1–SF4)

#### Hydration Fix — Locale-Explicit Number Formatting (`28bb728`)
- Added `'en-US'` to all `toLocaleString()` calls in 6 client components to prevent SSR/client locale mismatch (`8.610` vs `8,610`)
- Affected: `conversion-funnel.tsx`, `web-vitals-widget.tsx`, `auto-genesis-scanner.tsx`, `genesis-hub.tsx`, `web-vitals-client.tsx`, `ab-testing/page.tsx`

#### SF3 — Sitemap DRY + False URL Removal (`d51d015`)
- Imported `brokerSlugs` from `@/lib/data/broker-reviews` (single source of truth)
- Removed ~30 false 404 overview URLs (non-existent broker category index pages)

#### SF2 + SF4 — Dashboard Timeout Resilience (`0c7db6b`)
- Added `withTimeoutAndFlag<T>()` utility — returns `{ data, timedOut }`, suppresses late rejections
- Added `loadFxRates()` warm-up before parallel dashboard queries
- Amber warning banner displayed when stats query times out

#### SF1 — MDX Serialization Robustness (`869db5a`)
- Wrapped `serializeMDX()` calls in try/catch with `notFound()` fallback on both content page routes

---

### Phase 1 — Quick Wins + Foundation (`be54cc6` and earlier)

- Accessibility fixes (SVG light-design, error logging improvements)
- TypeScript strict compliance (implicit `any`, `unknown` types, market type guards)
- Excluded `landing/` submodule from TypeScript compilation
- FX rates extracted to `lib/fx-rates.ts` — single source of truth for currency conversion
- 35 unit tests for dynamic FX rates system

---

## Post-Deploy Monitoring (24h after deploy)

- **`cron_logs` table**: No new error entries
- **`/sitemap.xml`**: URL count stable (~405), `<image:image>` tags present for pillar/broker/review pages
- **Google Search Console**: Hreflang errors trending down, no new structured data warnings
- **Browser Console**: No hydration mismatch errors on dashboard or review pages
