# Research Discovery PR 1 Verification

Recorded 2026-07-27, worktree `.worktrees/research-discovery-pr1`,
branch `codex/research-discovery-pr1`.

- Base hash (`git merge-base HEAD origin/main`): `a8868a60f2ef3cc21c09bafa7c608cc83f4c87db`
- Head hash (`git rev-parse HEAD`, prior to this task's own commit): `a7a2088fc268ad9dfd1d5087f93c5f1aeee7fe5d`

This report covers Tasks 1–4 (`a53e113`, `07050e1`, `974167f`, `fbee11e`) plus
three architect-approved amendment commits landed before Task 5 (`02df8d9`,
`1e7b822`, `a7a2088`) and Task 5's own contract-coverage additions. Spec
invariants 1–11 (§15) are PR 1's; invariants 12–16 depend on rendered UI
(raw HTML, hero/facet/CTA counts, market-switch canonical URLs, noindex,
item-event topic/category) and are out of scope until PR 2+.

## Command gate

| Command | Result |
|---|---|
| `npx tsc --noEmit` | exit 0, zero output |
| `npx vitest run` (focused: research-catalog, research-catalog-shell-logic, research-adapter, research-shell-logic, research-events) | 5 files passed, **85 tests passed** (0 failed) |
| `npx vitest run` (full suite) | **125 files passed \| 1 skipped (126)**, **1628 tests passed \| 1 skipped (1629)**, exit 0 |
| `npm run check:imports` | exit 0 — "✅ No client→server-action import violations in MDX/marketing components." |
| `npm run build` | exit 0 (see below) |

Full-suite total (1628 passed / 1 pre-existing skip) = the pre-Task-5 baseline
of 1625 passed/1 skipped plus the 3 new invariant tests added in this task;
the 1 skip is the pre-existing `lib/editorial/forbidden-claims.test.ts` skip,
unrelated to this PR.

### Build detail

- `Route (app)` table: 262 total non-blank lines between the table header and
  the `ƒ Proxy (Middleware)` marker (242 of those are top-level route rows;
  the remaining 20 are nested `generateStaticParams` example-path lines such
  as `│ ├ /us/credit-repair` under `●` SSG entries). The pre-existing
  `research-discovery-pr1-baseline.md` (captured at the merge-base commit,
  before Task 1) recorded 241 top-level lines by an unstated counting method —
  1 fewer than the 242 measured here. `git diff --stat` between the merge-base
  and this task's HEAD (below) touches zero files under `app/` or `content/`,
  so this is not a regression introduced by PR 1; the most likely explanation
  is a DB-backed route (e.g. an archived/coming-soon tool page resolved from
  live Supabase data at build time) becoming eligible/ineligible between the
  two build runs, not a code change in this branch.
- `/research` route line: `├ ○ /research` — confirmed **`○ Static`**, unchanged.
- Build log also contains ~30 pre-existing `⚠️ WARN` lines from the
  `check-frontmatter.mjs` prebuild step (various `content/**/*.mdx` files
  missing recommended frontmatter fields like `pros`/`cons`/`pricing`). These
  are non-blocking, pre-existing content-quality warnings unrelated to this
  PR's scope (`lib/research/*`) and do not affect the exit code.

### UI files changed: 0

```
git diff --stat a8868a60f2ef3cc21c09bafa7c608cc83f4c87db HEAD
 .../unit/research-catalog-shell-logic.test.ts      | 534 ++++++++++++++
 __tests__/unit/research-catalog.test.ts            | 501 +++++++++++++
 ...2026-07-27-research-discovery-catalog-design.md |  14 +-
 lib/research/catalog-shell-logic.ts                | 775 +++++++++++++++++++++
 lib/research/catalog.ts                            | 399 +++++++++++
 5 files changed, 2221 insertions(+), 2 deletions(-)
```

`git diff --name-only a8868a60f2ef3cc21c09bafa7c608cc83f4c87db HEAD | grep -E '^(app|components)/'`
→ no matches. Zero `app/` or `components/` files touched across all of PR 1
(Tasks 1–4 + amendments); this task's own test-only commit (below) does not
change that.

## Catalog size ceiling (spec §5.3: <200 KB per market)

From `__tests__/unit/research-catalog.test.ts` → `buildDiscoveryCatalog` →
"keeps each market catalog under the 200 KB JSON size ceiling" (a synthetic
stress fixture: 50 reviews + 15 topics × 12 products = 180 overlay rows per
market), instrumented once with a temporary `console.log` (reverted before
commit; not part of the committed diff):

| Market | Items | Serialized bytes | Ceiling |
|---|---|---|---|
| us | 230 | 155,825 | < 200,000 |
| uk | 230 | 155,825 | < 200,000 |
| ca | 230 | 155,825 | < 200,000 |
| au | 230 | 155,825 | < 200,000 |

All four markets pass with ~22% headroom under the synthetic stress fixture.

## Invariant → test mapping (spec §15, invariants 1–11)

Per the task's amendment-state instructions, invariants already covered by an
existing Task 1–4/amendment test were **not duplicated** — only genuinely
uncovered invariants (1, 5, 11) got new tests in this task.

| # | Spec §15 statement (abridged) | Covered by | Status |
|---|---|---|---|
| 1 | Each qualified review yields exactly one `DiscoveryItem` | `research-catalog.test.ts` → *"invariant 1 (spec §15) — two overlay rows from two topics, joined to one review, still yield exactly one item for that review href"* | **NEW** (Task 5) |
| 2 | A Cockpit-only product yields exactly one item per market/category/product | `research-catalog.test.ts` → *"keeps the credit-repair/debt-relief collision fixture distinct because category is part of the id"* | Existing (Task 4) |
| 3 | One product in two topics stays one item with two contexts | `research-catalog.test.ts` → *"merges the same cockpit-only product across two topics into one item with two contexts"* | Existing (Task 4) |
| 4 | No item has duplicate `cockpitKey` contexts | `research-catalog.test.ts` → *"dedupes a repeated row for the same cockpit key down to one context"* | Existing (Task 4) |
| 5 | Only audited contexts carry score, rank, confidence | `research-catalog.test.ts` → *"invariant 5 (spec §15) — only an audited context carries score, rank, and confidence; a provisional context nulls all three"* | **NEW** (Task 5) |
| 6 | `type=review` never emits a dossier projection | `research-catalog-shell-logic.test.ts` → *"type=review never emits a dossier projection"* | Existing (Task 2) |
| 7 | A research-only filter excludes a context-free review | `research-catalog-shell-logic.test.ts` → *"a research-only filter excludes a context-free review"* | Existing (Task 2) |
| 8 | A result appears at most once | `research-catalog-shell-logic.test.ts` → *"projects one item once and prefers an explicit topic"* | Existing (Task 2) |
| 9 | Compare URLs contain only slugs from one Cockpit key | `research-catalog-shell-logic.test.ts` → *"rejects slugs outside the active Cockpit key"* | Existing (Task 3) |
| 10 | Same-named topics in different categories use different storage keys | `research-catalog-shell-logic.test.ts` → *"separates same-named topics in different categories"* | Existing (Task 3) |
| 11 | Overlay failure removes no reviews | `research-catalog.test.ts` → *"invariant 11 (spec §15) — every overlay topic rejecting leaves review ids byte-identical and context-free"* | **NEW** (Task 5) |

### Additional explicit guards (spec §5.3, §4.1)

| Guard | Covered by | Status |
|---|---|---|
| Cache-size ceiling: serialized catalog <200 KB per market | `research-catalog.test.ts` → *"keeps each market catalog under the 200 KB JSON size ceiling"* (see table above) | Existing (Task 4) |
| ID-uniqueness: "a collision is a test failure, not last-write-wins" (spec §4.1) | `research-catalog.test.ts` → *"keeps the credit-repair/debt-relief collision fixture distinct because category is part of the id"* — asserts `new Set(ids).size === 2` for the one fixture in the suite specifically engineered to collide under a naive (category-less) ID scheme | Existing (Task 4), same test as invariant 2 |

## Deviations from the plan's literal Task 5 text

1. **No single `describe('Discovery catalog invariants 1–11')` block.** The
   plan's Step 1 asks for one new block restating all 11 numbered assertions.
   Per this task's explicit amendment-state instructions ("do NOT duplicate
   ... only add tests for genuinely uncovered invariants"), 8 of the 11
   invariants already had dedicated, passing coverage from Tasks 1–4 and the
   amendment commits; only invariants 1, 5, and 11 got new tests (added to
   their most relevant existing `describe` blocks in
   `research-catalog.test.ts` rather than a new block), each labeled
   `invariant N (spec §15) — ...` for traceability. This is a pre-authorized
   adaptation, not an unplanned deviation.
2. **Test counts differ from the plan's original assumptions**, because three
   architect-approved amendment commits (`02df8d9`, `1e7b822`, `a7a2088`)
   landed between Task 4 and Task 5: `research-catalog-shell-logic.test.ts`
   was already at 26 tests and `research-catalog.test.ts` at 10 tests before
   this task started (vs. whatever lower counts the plan's prose implied).
   This task added exactly 3 tests to `research-catalog.test.ts` (now 13);
   `research-catalog-shell-logic.test.ts` was not modified (26 tests,
   unchanged) because none of its invariants (6, 7, 8, 9, 10) had gaps.
3. **`research-catalog-shell-logic.test.ts` is not in this task's commit**,
   contrary to the plan's file list (which marks it "Modify"), because no new
   test was needed there — see point 2. Only `research-catalog.test.ts` and
   this report are new/changed.
4. **`audits/reports/research-discovery-pr1-baseline.md` was left untouched**
   per explicit instruction — it is a separate, pre-existing, untracked
   baseline captured at the merge-base commit and is not part of this
   task's file list.
5. The 262-vs-241 route-line discrepancy noted above is recorded as observed,
   not silently reconciled — see the Build detail section.
