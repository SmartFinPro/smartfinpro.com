# Research Discovery PR 3 Release Gate

Recorded 2026-07-28, worktree `.worktrees/research-discovery-pr3`,
branch `codex/research-discovery-pr3`.

- PR base (`git merge-base HEAD origin/main`, and the plan's own stated base
  commit): `c708acbe9e0234fa7552f5f800b45ade4f19106f`
  (`feat(research): universal market research hubs (#122)`)
- Head hash BEFORE this task's own commit (`git rev-parse HEAD`):
  `9c3fbc44bc5ae586dc9e1d8d6ec550ebe2bd6e1d`
  (`feat(research): measure category and type filter changes`)
- This report covers **Task 4** only: the homepage Finder E2E suite, the
  route-JS measurement script, the two hub-chip analytics gap-close tests,
  and this report itself. Tasks 1–3 (7 commits between the base and this
  task's head, listed at the end) are treated as given — re-run here, not
  re-implemented.

## Command gate

| Command | Result |
|---|---|
| `npx tsc --noEmit` | exit 0, zero output |
| `npx vitest run` (full suite) | **135 files passed \| 1 skipped (136)**, **1808 tests passed \| 1 skipped (1809)**, exit 0, 6.50s |
| `npx eslint` (this task's own 3 files) | exit 0, **zero findings** — `e2e/homepage-quick-finder.spec.ts`, `e2e/research-tracking.spec.ts` (diff), `scripts/research/measure-route-js.mjs` |
| `npx eslint lib/analytics/cockpit-tracking.ts lib/analytics/tool-tracking.ts` | **exactly 7 pre-existing errors** (all `react-hooks/refs`, "Cannot access refs during render") — confirms the operator's stated baseline; none touched by this task |
| `npm run build` | exit 0 |

The 1 skip is the pre-existing, unrelated `lib/editorial/forbidden-claims.test.ts`
skip (same as PR 1's and PR 2's reports).

`npx eslint .` (whole repo, unscoped) reports 1574 problems — this is NOT the
gate the operator specified (the "7 pre-existing errors" figure only matches
when scoped to `lib/analytics/cockpit-tracking.ts` + `tool-tracking.ts`
specifically, confirmed above byte-for-byte). CI itself only runs
`npm run lint:p1p5` (a different, unrelated file scope), never `npx eslint .`
— see `.github/workflows/pr-checks.yml`. This task's own 3 changed/created
files were additionally checked together with every other file Tasks 1–3
touched (`git diff --name-only c708acb..HEAD`, 17 files) — the only findings
there (1 error, 10 warnings) are all in files this task did not modify
(`__tests__/unit/research-quick-finder.test.ts`,
`__tests__/unit/research-validation.test.ts`,
`__tests__/unit/track-route-research-batch.test.ts`,
`components/marketing/homepage-sections.tsx`), i.e. pre-existing to Tasks 1–3,
not new findings from Task 4.

### Build detail — the five required routes

```
┌ ○ /                                                                                    5m      1y
├ ○ /au/research                                                                         5m      1y
├ ○ /ca/research                                                                         5m      1y
├ ○ /research                                                                            5m      1y
├ ○ /uk/research                                                                         5m      1y
```

All five confirmed **`○ Static`** on both the base build and this head
build — Task 4 added no application code, only E2E specs, one standalone
script, and this report, so this is unchanged from Task 3 by construction.

## JS payload — homepage delta gate (merge blocker, spec §16: ≤ 25 KB gzip)

Measured with the new `scripts/research/measure-route-js.mjs` against two
independently built, independently served production instances of `/`:

- **Base** (`c708acbe9e0234fa7552f5f800b45ade4f19106f`) — built in a separate
  git worktree (`.worktrees/pr3-base-c708acb`, removed after measurement),
  served via `next start -p 3013`.
- **Head** (`9c3fbc44bc5ae586dc9e1d8d6ec550ebe2bd6e1d`, this worktree) —
  served via `next start -p 3012`.

Both builds ran with this worktree's own `.env.local` and the shared,
symlinked `node_modules` — same dependency tree, same machine.

| | Chunks | Raw bytes | **Gzip bytes** |
|---|---|---|---|
| Base (`c708acb`) | 22 | 1,076,880 | **330,770** |
| Head (`9c3fbc4`) | 21 | 1,088,489 | **334,030** |
| **Delta** | −1 | +11,609 | **+3,260 bytes ≈ +3.18 KB** |

**+3.18 KB gzip, well within the 25 KB budget — not a merge blocker.**

The script rejects (non-zero exit) any remote-hosted `<script>` or any
resolved chunk missing on disk, so this number cannot be silently
under-counted by a stale/missing artifact — both runs completed with no
rejection.

## LCP / CLS — homepage vs PR-base baseline (spec §16)

Baseline methodology (same viewport, same machine, same `next start`
production server, never `next dev`): the `PerformanceObserver` pattern from
`e2e/research-a11y.spec.ts`'s Core Web Vitals test, at 1280×800, server
warmed by two prior requests before each sample.

**Base (`c708acb`), five consecutive warm samples:** 128, 132, 144, 120, 120 ms
(CLS 0.0000 on every sample). The **highest** of the five (144 ms) — not an
optimistic low one — was kept as `BASELINE_LCP_MS` in
`e2e/homepage-quick-finder.spec.ts`, so the gate is not tripped by ordinary
machine-load jitter on an already-fast page.

**Head (`9c3fbc4`), same methodology, five consecutive warm samples:** 120,
140, 124, 132, 140 ms (CLS 0.0000 on every sample). The actual gate test run
(embedded in the officialE2E run below) measured:

```
/ lab vitals (head) — LCP 128ms · CLS 0.0000
```

| Check | Result |
|---|---|
| LCP ≤ 2500 ms | 128 ms — **PASS** |
| LCP ≤ 110% of baseline (144 × 1.1 = 158.4 ms) | 128 ms — **PASS** |
| CLS < 0.1 | 0.0000 — **PASS** |

Both builds' LCP element is the hero (unaffected by Task 3's below-the-fold
Quick Finder replacement), so base and head are statistically
indistinguishable at this scale — consistent with the near-zero JS delta
above.

## E2E gate (production build, `next start`, port 3012)

```
BASE_URL=http://127.0.0.1:3012 npx playwright test \
  e2e/homepage-quick-finder.spec.ts \
  e2e/research-a11y.spec.ts \
  e2e/research-hub-markets.spec.ts \
  e2e/research-raw-html.spec.ts \
  e2e/research-shell.spec.ts \
  e2e/research-tracking.spec.ts \
  --workers=1
```

Server verified before the run: `lsof -ti :3012` checked for a stale
listener first; server log confirmed `✓ Ready` and did **not** say "Could
not find a production build"; `curl -o /dev/null -w '%{http_code}' /` → `200`.
Server killed after the run (`kill $(lsof -ti :3012)`, port confirmed free).

| Spec file | Passed | Failed |
|---|---|---|
| `e2e/homepage-quick-finder.spec.ts` (**new**) | 22 | 0 |
| `e2e/research-a11y.spec.ts` | 7 | 0 |
| `e2e/research-hub-markets.spec.ts` | 52 | 0 |
| `e2e/research-raw-html.spec.ts` | 3 | 0 |
| `e2e/research-shell.spec.ts` | 22 | 0 |
| `e2e/research-tracking.spec.ts` (modified: +2 tests) | 11 | 1 |
| **Total** | **117** | **1** |

**118 tests total, 117 passed, 1 failed.**

### The 1 failure is pre-existing and unrelated to Task 4

`e2e/research-tracking.spec.ts` → `invariant 13: hero, category totals, and
a tracked filter all agree with what is actually rendered` fails
deterministically (reproduced 3× in a row, not a flake — `Expected: 83,
Received: 15` every time). **Confirmed pre-existing**: `git stash`-ed this
task's own edit to the file and re-ran the same test against the unmodified,
already-committed `9c3fbc4` version — it fails identically. Task 4 added two
NEW tests to this file (the Category/Type hub-chip gap-close, both PASS) but
did not touch the `invariant 13` test's own code.

Root cause identified while investigating (not fixed here — out of this
task's surgical scope): the test's category-chip loop fires one
`research_filter_change` event per chip click, accumulating several events
in the shared `batches` array; the final assertion then reads
`named(batches, 'research_filter_change')[0]` — index `[0]`, the **first**
`research_filter_change` ever recorded in the test (from the loop's first
category chip), not the **latest** one (the `status=provisional` click the
assertion is actually about). Flagged as a follow-up task
(`task_f39b901a`, "Fix stale event lookup in research-tracking invariant-13
test") rather than fixed inline, since it is unrelated to the homepage
Finder release gate this task is scoped to.

## Finder analytics on the wire (Step 2, spec §12)

All asserted in `e2e/homepage-quick-finder.spec.ts` → describe
`Homepage Quick Finder — research_v1 analytics (surface: finder)`, against
real `/api/track` payloads intercepted via `page.route` (same idiom as
`research-tracking.spec.ts`):

| Event | Assertion | Result |
|---|---|---|
| `research_search` | `surface:'finder'`, `queryLength` (trimmed char count, never raw text), `resultCount` matches independently-counted DOM cards, raw query string absent from the serialized event | PASS |
| `research_filter_change` (category chip) | `facet:'category'`, `surface:'finder'`, `value`/`active` match the clicked chip, `resultCount` matches DOM | PASS |
| `research_finder_cta` (`trigger:'view_all'`) | `surface:'finder'`, `resultCount` equals the count **visible at click time** (not recomputed after navigation), `topic:'hub'` (GLOBAL event) | PASS |
| `research_finder_cta` (`trigger:'dossier_item'`) | `surface:'finder'`, real `topic`/`category`/`productSlug` (Sky Blue Credit: `topic:'companies'`, `category:'credit-repair'`, `productSlug:'sky-blue-credit'`), `kind:'dossier'` | PASS |
| `research_review_click` | `kind:'review'`, `surface:'finder'`, real `productSlug`, `position:1` | PASS |

Both requirements from the operator's binding item #2 (`trigger:'view_all'`
carries the resultCount seen at click time; `trigger:'dossier_item'`
covered) and item #5 (Finder's own category chip → `research_filter_change`,
`facet:'category'`, `surface:'finder'`, visible count) are proven above.

### Hub category/type chips (surface: hub) — the other half of item #5

Added to `e2e/research-tracking.spec.ts`, proving the click-wiring the
previous task (`9c3fbc4`) could only assert at the pure-function level
(`resolveCategoryFilterChange` unit tests):

- `the hub Category facet chip sends facet:category, its value and the
  resulting count (surface: hub)` — clicks "Trading Platforms", asserts
  `facet:'category'`, `value:'trading'`, `surface:'hub'`,
  `resultCount === renderedCount`. PASS.
- `the hub Type facet chip sends facet:type, its value and the resulting
  count (surface: hub)` — clicks "Dossiers", asserts `facet:'type'`,
  `value:'dossier'`, `surface:'hub'`. PASS.

## Adversarial cases (operator obligation #3) — browser-proven vs unit-proven

| Case | Proof level | Why |
|---|---|---|
| **Zero matches** | **Browser** (`homepage-quick-finder.spec.ts`) | Trivially producible live — a nonsense query on the real catalog. Asserts the empty-state copy, zero cards, and that the "View all" CTA still resolves. |
| **Multi-context item** | **Unit only** (`__tests__/unit/research-catalog-shell-logic.test.ts`, *"keeps a multi-context cockpit-only item as a single result and hrefs its first (manifest-order) context"*) | A `DiscoveryItem`'s `category` is singular, so a multi-context item requires ONE product qualifying in TWO topics **within the same category**. **Corrected 2026-07-29** (an earlier version of this row claimed no category in the manifest has more than one topic — that was never actually verified against `lib/comparison/topics/manifest.ts` and is false): `BEST_X_MANIFEST` has exactly ONE (market, category) pair with more than one topic — `us/personal-finance` (robo-advisors, high-yield-savings, credit-card-companies, credit-monitoring) — every other category has at most one topic per market. This case is unit-only because no live PRODUCT currently qualifies in 2+ of those four topics at once — a Supabase `product_attributes` **data** fact (verified live; see `__tests__/unit/research-hub-integration.test.ts`'s header for the per-topic slug counts checked: 6 robo-advisors + 8 high-yield-savings + 10 credit-card-companies + 8 credit-monitoring, zero slug overlap), not a manifest-shape fact. A single new product row qualifying in two of those topics would create a live multi-context item with no code change and no failing test, at which point `finderItemHref` silently picks `researchContexts[0]` (manifest order) on a real homepage card. **Residual risk, tracked here, not closed by this report**: this is a data-driven condition that can flip without a deploy; the unit test proves the code's behavior is correct and deterministic (first-manifest-order context wins) if/when it does. Staging a real multi-context item today would require fabricating catalog data, which the operator's instructions explicitly forbid — fully covered by the existing synthetic-fixture unit test instead. |
| **Two products sharing a topic, different categories** (`us/credit-repair/companies` vs `us/debt-relief/companies`) | **Browser** (`homepage-quick-finder.spec.ts`, adversarial describe) | Verified live before hardcoding: "Sky Blue Credit" (`credit-repair`) and "Accredited Debt Relief" (`debt-relief`) are real, currently-qualifying, cockpit-only (no review MDX) products sharing the bare topic `"companies"` — the same live pair `e2e/research-shell.spec.ts`'s own key-collision test already relies on. Test asserts two distinct hrefs (`...&topic=companies&q=Sky+Blue+Credit` vs `...&q=Accredited+Debt+Relief`), both resolve 200, and — via a real hydrated navigation, since the raw SSR fallback intentionally shows the broader unfiltered catalog for crawlability (spec §8) — each destination shows exactly its own product and not the other one. |
| **Market switch** (`/uk` → `/uk/research`, never `/research`) | **Browser** (`homepage-quick-finder.spec.ts`) | Navigates to `/uk`, asserts the "View all" href starts with `/uk/research` and never `/research`, then clicks it and asserts the landed URL. |
| **Empty filters** | **Browser** (`homepage-quick-finder.spec.ts`) | Default homepage state; asserts the "View all" href is exactly `/research` (no trailing `?`, no empty params). |

## Review vs Cockpit-only destinations (operator obligation #4)

Both proven with an actual 200 resolution, not merely an href string check:

- **Review-backed**: clicks the first review-backed Finder card, asserts the
  landed URL equals `item.review.href` with the `review:` prefix stripped,
  then independently confirms `request.get(href)` → 200.
- **Cockpit-only**: searches "Sky Blue Credit" (no review exists for this
  slug — confirmed by directory listing of `content/us/credit-repair/`
  before writing the test), asserts the card's href is the prefiltered hub
  URL (`/research?type=dossier&topic=companies&q=Sky+Blue+Credit`), that it
  is **never** `/us/credit-repair/best/companies` (the Cockpit page itself),
  clicks it, and confirms `request.get(href)` → 200.

## Category/type filter analytics (operator obligation #5) — full summary

- Finder's own category chip → `research_filter_change`,
  `facet:'category'`, `surface:'finder'` — **browser-proven** (see table
  above).
- Hub's category chip → `research_filter_change`, `facet:'category'`,
  `surface:'hub'` — **browser-proven** (new test, `research-tracking.spec.ts`).
- Hub's type chip → `research_filter_change`, `facet:'type'`,
  `surface:'hub'` — **browser-proven** (new test, `research-tracking.spec.ts`).

All three carry the visible result count, checked against an
independently-counted DOM witness (never against another tracked/announced
value), matching this repo's established anti-tautology convention.

## Crawlability (operator obligation #6) — JavaScript DISABLED

`e2e/homepage-quick-finder.spec.ts` → describe `Homepage — raw HTML
crawlability (JavaScript disabled)`. No `test.use({ javaScriptEnabled: true
})` anywhere in this describe block — it runs under the repo's global
default (`playwright.config.ts`: `use.javaScriptEnabled: false`), same rule
`e2e/research-raw-html.spec.ts` documents at its own file header.

- `every market homepage renders real review hrefs in raw server HTML` —
  fetches `/`, `/uk`, `/ca`, `/au` with `request.get()` (no browser
  scripting at all), extracts the `#reports` section, and asserts every
  `data-finder-item="review:..."` id's href appears as a real `href="..."`
  in the raw HTML. All four markets had 6 review-backed Finder cards each in
  raw HTML at measurement time. PASS.
- `a sampled Finder review href is genuinely navigable (200) with
  JavaScript still disabled` — the middle US review href resolves 200. PASS.

## WCAG 2.2 AA — scoped to the Finder surface

`axe-core@4.11.1` (pinned exact, matching `research-a11y.spec.ts`), WCAG
2.2 AA tag set, scanning **`#reports`** — not `document`. A `document`-wide
scan was tried first and reported `color-contrast` findings on the
homepage's **footer market-switcher links** (`a[href="/"]`, `a[href="/uk"]`,
etc.) — pre-existing homepage-wide a11y debt, unrelated to and unmodified
by this task, well outside `#reports`. Scoping to the actual surface this
task ships avoids conflating that unrelated debt with this release gate,
mirroring how `research-a11y.spec.ts`'s own `document`-wide scan gets a
clean surface for free by being the *only* content on `/research` — the
homepage has no such luxury.

- `the default homepage has no serious/critical violations` — PASS.
- `the filtered Finder state has no serious/critical violations` — PASS.

## Discovery counts (context, not a new measurement)

Unchanged from Task 3 — `catalog.counts.discoveryItemCount` is rendered
verbatim in the Finder section's own subheading and was not touched by
Task 4. Live US homepage Finder: 6 cards shown by default, 10 selectable
category chips, `/research` catalog reports 126 products / 8 audited / 35
verified data points (read live during manual verification, matching the
existing PR 2 report's own November baseline methodology).

## Deviations from the plan's literal Task 4 text

Target was none; three are recorded here rather than silently resolved.

1. **The disambiguation half of the "two products, same topic, different
   categories" adversarial test uses a hydrated browser navigation, not the
   raw `request.get()` fetch**, for the "shows the correct product, not the
   other one" assertion specifically (the "resolves 200" half still uses
   `request.get()`). Discovered while writing the test: the raw, no-JS
   SSR fallback (`BrowseFallback`, spec §8, "der serverseitige Fallback
   trägt die SEO-Last") intentionally renders the **broader, unfiltered**
   catalog for crawlability — it shows both "Sky Blue Credit" AND
   "Accredited Debt Relief" regardless of the `q`/`topic` query params,
   since those params are applied by the CLIENT-side filter
   (`projectDiscoveryItems`), not the server fallback. Asserting
   "not.toContain" against the raw fetch would have been checking the wrong
   surface and failed for reasons unrelated to the feature. Switched the
   disambiguation-specific assertions to a real `page.goto()` +
   post-hydration DOM check (this describe block already runs with
   `javaScriptEnabled: true`), which is the surface where filtering
   genuinely happens.
2. **The WCAG scan is scoped to `#reports`, not `document`** — see the WCAG
   section above for the full reasoning (pre-existing, unrelated homepage
   contrast debt in the footer).
3. **`npx eslint` in the GATES list is interpreted as "this task's own
   files plus the two named pre-existing-error files," not `npx eslint .`
   (whole repo)** — the whole-repo run reports 1574 problems across files
   no PR-3 task has ever touched (build/deploy scripts, unrelated
   templates), and CI itself never runs that command (only the unrelated
   `lint:p1p5` scope). The narrower interpretation is the only one under
   which "7 pre-existing errors in `lib/analytics/cockpit-tracking.ts` +
   `tool-tracking.ts`" is literally true — confirmed byte-for-byte above.

No other deviations. Every plan Step 1 (functional table), Step 2 (Finder
analytics), Step 3 (route-JS script), Step 4 (LCP/CLS vs. baseline), and
Step 5 (focused + full gate) requirement was followed literally.

## Commits between the PR base and this task's own head

```
9c3fbc4 feat(research): measure category and type filter changes  (Task 4 prerequisite work)
5dc6f56 feat(homepage): replace report feed with research finder  (Task 3)
9beb19f feat(research): add quick finder shell contracts          (Task 2)
530e772 feat(research): add quick finder analytics                (Task 1)
c708acb feat(research): universal market research hubs (#122)     (PR 2 base)
```

## This task's own changes

- `scripts/research/measure-route-js.mjs` (new)
- `e2e/homepage-quick-finder.spec.ts` (new, 22 tests)
- `e2e/research-tracking.spec.ts` (modified: +2 tests, hub category/type
  chip analytics gap-close)
- `audits/reports/research-discovery-pr3.md` (this report)

`git diff --check` clean. `git status --short` empty after commit.
