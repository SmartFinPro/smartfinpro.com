# Canonical URL and Legacy Redirect Normalization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace bare internal MDX category links with verified market-prefixed canonical URLs, add narrow legacy redirects for uniquely market-bound categories, and remove the confirmed CMC Markets redirect-to-404 path without changing sitemap or overview strategy.

**Architecture:** A pure analyzer builds a route index from the explicit `content/{us,uk,ca,au}/**` scope, `marketCategories`, and `BEST_X_MANIFEST`, then classifies each bare link as resolved, ambiguous, or unresolved. A fail-closed CLI writes only after every ambiguous occurrence has a reviewed decision, every source-file hash still matches the dry-run report, and every automatic or manual target still exists in a freshly rebuilt route index. Redirect behavior is covered separately with unit tests and an exact `next.config.ts` rule.

**Tech Stack:** Next.js 16.2.4, TypeScript, `tsx`, Vitest 4, MDX, Cloudflare CDN, Node.js filesystem and crypto APIs.

## Global Constraints

- Work in an isolated git worktree because the primary checkout is already dirty; use `superpowers:using-git-worktrees` at execution time.
- Do not modify `app/sitemap.ts`, `lib/data/overview-content.ts`, either overview page, or Hub/Overview navigation in this rollout.
- Do not add or change `trailingSlash`; Next.js already normalizes trailing slashes.
- Do not change the existing generic bare-category redirect from 301 to 308.
- Do not touch the existing `next.config.ts` redirects except to add the exact CMC Markets legacy rule.
- Treat `content/{us,uk,ca,au}/**/*.mdx` as the only writer and permanent-guard scope. The four `content/cross-market/*.mdx` files have no single source market and `content/_templates/*.mdx` is unpublished source material; both are excluded from this rollout and require a separate policy before any future rewrite.
- Baseline expectations are 936 occurrences in 145 files and at least 115 ambiguous occurrences. Recompute at execution time and stop on unexplained drift.
- A category being market-exclusive is not proof that an arbitrary slug exists. Every slug target must exist in the route index before it can be marked resolved.
- `--write` must fail before mutating any file when any occurrence is unresolved, ambiguous without a decision, has an invalid target in a freshly rebuilt route index, or belongs to a source file whose SHA-256 differs from the dry-run report.
- Preserve query strings and fragments, remove trailing slashes, and always retain `/us` for US content URLs.
- User authorization was recorded on 2026-07-15 for the one-time AGENTS.md exception: do not change `modifiedDate`, `dataVerifiedDate`, or content score for these mechanical link-only edits; all remaining quality-gate checks still apply.
- Deployment, Cloudflare purge, and GSC follow-up require separate production authorization after local verification.
- The pre-existing `/us/forex/cmc-markets-review` redirect to missing UK content is a separate follow-up ticket. Do not silently retarget it in this rollout because both AU and CA versions exist and the intended market requires its own decision.
- Every rollout report must state that short-term GSC fluctuations are normal during reprocessing, that the 218 cases may have additional content-quality or indexing causes, and that measured movement is correlation rather than a guaranteed result of this fix.

## Authorized Rollout Order

1. Create the baseline and tests.
2. Resolve and prepare every unambiguous replacement in the dry-run report.
3. Review and decide all 115+ ambiguous occurrences individually.
4. Apply the complete validated decision set market by market.
5. Verify every redirect hop and final canonical target with real GET requests; final targets must return `200`.
6. After separately authorized deployment, monitor the defined GSC cohorts after 30, 60, and 90 days.

For safety, "correct unambiguous links" in step 2 means computing and validating their planned `targetHref` values without mutating MDX. Actual file writes begin only in Task 5, after Task 4 reports zero unresolved or undecided occurrences. This preserves the earlier binding no-write-before-review rule.

---

### Task 1: Approve Scope and Capture the Baseline

**Files:**
- Read: `AGENTS.md`
- Read: `proxy.ts`
- Read: `next.config.ts`
- Read: `lib/i18n/config.ts`
- Read: `lib/comparison/topics/manifest.ts`

**Interfaces:**
- Consumes: the narrow AGENTS.md exception approved by the user on 2026-07-15.
- Produces: a recorded go/no-go decision and an isolated worktree with a clean baseline.

- [x] **Step 1: Record the explicit gate authorization**

Record this exact decision in the execution notes before continuing:

```text
For this one-time mechanical internal-link correction only, modifiedDate,
dataVerifiedDate, and content score remain unchanged. AGENTS.md checks for
structure, links, prose non-change, schema, canonical/hreflang, TypeScript,
Vitest, build, before/after metrics, and commits remain mandatory.
```

Status: approved by the user on 2026-07-15. This authorization applies only to the mechanical link-only edits in this plan and does not authorize production deployment or cache purging.

- [ ] **Step 2: Create an isolated worktree**

Use `superpowers:using-git-worktrees`, then run:

```bash
git status --short
git branch --show-current
```

Expected: a clean worktree on a `codex/` branch.

- [ ] **Step 3: Capture current counts without modifying files**

Run the existing read-only diagnostic or an equivalent Node scan and record:

```text
totalOccurrences
markdownOccurrences
jsxOccurrences
touchedFiles
countsBySourceMarket
categoryRootOccurrences
multiSegmentOccurrences
ambiguousOccurrences
unresolvedOccurrences
```

Expected baseline: approximately `936 / 934 / 2 / 145 / 114 / 2 / 115`. Stop and explain any drift before continuing.

Also run a read-only exclusion audit over `content/cross-market/**/*.mdx` and `content/_templates/**/*.mdx`. Expected baseline: zero bare links whose first segment is one of the 16 configured categories. If this is no longer zero, stop and define a source-market policy for those files instead of broadening the writer implicitly.

---

### Task 2: Build and Test the Pure Link Analyzer

**Files:**
- Create: `scripts/lib/internal-mdx-link-fix.ts`
- Create: `__tests__/unit/internal-mdx-link-fix.test.ts`

**Interfaces:**
- Consumes: `Market`, `Category`, `categories`, and `marketCategories` from `lib/i18n/config.ts`; `BEST_X_MANIFEST` from `lib/comparison/topics/manifest.ts`.
- Produces: `extractBareLinks()`, `buildRouteIndex()`, `resolveOccurrence()`, and `rewriteHref()`.

Define these exact public types:

```ts
export type LinkSyntax = 'markdown' | 'jsx';
export type ResolutionStatus = 'resolved' | 'ambiguous-market' | 'unresolved';

export interface LinkOccurrence {
  id: string;
  file: string;
  sourceMarket: Market;
  sourceSha256: string;
  syntax: LinkSyntax;
  line: number;
  column: number;
  start: number;
  end: number;
  originalHref: string;
  normalizedPath: string;
  suffix: string;
  category: Category;
  routeTail: string;
}

export interface LinkResolution {
  occurrence: LinkOccurrence;
  status: ResolutionStatus;
  availableMarkets: Market[];
  targetMarket?: Market;
  targetHref?: string;
  reason: string;
}

export type RouteIndex = Map<string, Set<Market>>;

export const CONTENT_MARKETS = ['us', 'uk', 'ca', 'au'] as const;

export function buildRouteIndex(rootDir: string): RouteIndex;
export function listMarketContentFiles(rootDir: string): string[];
```

- [ ] **Step 1: Write failing parser and resolver tests**

Add these cases to `__tests__/unit/internal-mdx-link-fix.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  buildRouteIndex,
  extractBareLinks,
  resolveOccurrence,
  rewriteHref,
} from '@/scripts/lib/internal-mdx-link-fix';

describe('internal MDX link analyzer', () => {
  it('extracts Markdown and JSX bare links while preserving query and hash', () => {
    const source = [
      '[Fidelity](/trading/fidelity-review/?ref=guide#fees)',
      '<Card href="/credit-score/free-credit-score-check" />',
      '[Already canonical](/au/trading/cmc-markets-review)',
      '[Tool](/tools/broker-finder)',
    ].join('\n');

    const links = extractBareLinks('content/us/trading/index.mdx', 'us', source, 'hash');
    expect(links.map((link) => link.originalHref)).toEqual([
      '/trading/fidelity-review/?ref=guide#fees',
      '/credit-score/free-credit-score-check',
    ]);
    expect(links[0].suffix).toBe('?ref=guide#fees');
  });

  it('marks every non-US multiple-market target ambiguous', () => {
    const index = new Map([['forex/ig-markets-review', new Set(['us', 'uk'])]]);
    const occurrence = extractBareLinks(
      'content/au/forex/pepperstone-review.mdx',
      'au',
      '[IG](/forex/ig-markets-review/)',
      'hash',
    )[0];
    expect(resolveOccurrence(occurrence, index)).toMatchObject({
      status: 'ambiguous-market',
      availableMarkets: ['uk', 'us'],
    });
  });

  it('resolves a sole existing market and never trusts category exclusivity alone', () => {
    const occurrence = extractBareLinks(
      'content/us/debt-relief/index.mdx',
      'us',
      '[Missing](/superannuation/not-a-real-slug/)',
      'hash',
    )[0];
    expect(resolveOccurrence(occurrence, new Map())).toMatchObject({ status: 'unresolved' });
  });

  it('resolves US when the source is US and the US route exists', () => {
    const index = new Map([['trading/etoro-review', new Set(['us', 'uk'])]]);
    const occurrence = extractBareLinks(
      'content/us/trading/index.mdx',
      'us',
      '[eToro](/trading/etoro-review/)',
      'hash',
    )[0];
    expect(resolveOccurrence(occurrence, index)).toMatchObject({
      status: 'resolved',
      targetMarket: 'us',
      targetHref: '/us/trading/etoro-review',
    });
  });

  it('rewrites only the href span and preserves suffixes', () => {
    expect(rewriteHref('/trading/fidelity-review/?ref=guide#fees', 'us')).toBe(
      '/us/trading/fidelity-review?ref=guide#fees',
    );
  });
});
```

- [ ] **Step 2: Run the tests and confirm the expected failure**

Run:

```bash
npx vitest run __tests__/unit/internal-mdx-link-fix.test.ts
```

Expected: FAIL because the module and exports do not exist.

- [ ] **Step 3: Implement extraction and route indexing**

Use these matching rules in `scripts/lib/internal-mdx-link-fix.ts`:

```ts
const MARKDOWN_LINK_RE = /\]\((\/[^)\s]+)\)/g;
const JSX_HREF_RE = /\bhref\s*=\s*(["'])(\/[^"']+)\1/g;

function splitHref(href: string) {
  const suffixAt = href.search(/[?#]/);
  const rawPath = suffixAt === -1 ? href : href.slice(0, suffixAt);
  const suffix = suffixAt === -1 ? '' : href.slice(suffixAt);
  return {
    normalizedPath: rawPath.replace(/\/+$/, '') || '/',
    suffix,
  };
}
```

`extractBareLinks()` must reject already prefixed `us|uk|ca|au` paths and every first segment not present in `categories`. Compute `line`, `column`, `start`, and `end` from the exact href capture, not from the whole Markdown/JSX match.

`listMarketContentFiles()` must return only sorted `.mdx` paths below these exact roots:

```text
content/us/**
content/uk/**
content/ca/**
content/au/**
```

It must not scan `content/cross-market/**`, `content/_templates/**`, or any future top-level content directory. Both the CLI writer and the permanent Task 9 guard must consume this same function so their scope cannot drift.

`buildRouteIndex()` must add:

```ts
// MDX reviews and guides
`${category}/${slug}` -> Set<Market>

// Category roots, using marketCategories
`${category}` -> Set<Market>

// Cockpit topic routes, using BEST_X_MANIFEST
`${category}/best/${topic}` -> Set<Market>

// Literal market/category app routes, discovered from the filesystem
// Example: app/(marketing)/us/business-banking/programmatic-financial-firewall/page.tsx
`business-banking/programmatic-financial-firewall` -> Set<'us'>
```

When discovering literal app routes, scan `app/(marketing)/<market>/<category>/**/page.tsx`, accept only known market and category directory names, and ignore every segment containing `[` or `]`. This prevents the target-existence guard from falsely rejecting valid literal pages while avoiding duplicate interpretation of dynamic routes.

- [ ] **Step 4: Implement fail-closed resolution**

Use this exact decision order:

```ts
export function resolveOccurrence(
  occurrence: LinkOccurrence,
  routeIndex: RouteIndex,
): LinkResolution {
  const availableMarkets = [...(routeIndex.get(
    `${occurrence.category}${occurrence.routeTail ? `/${occurrence.routeTail}` : ''}`,
  ) ?? new Set<Market>())].sort();

  if (availableMarkets.length === 0) {
    return { occurrence, status: 'unresolved', availableMarkets, reason: 'target-not-found' };
  }

  if (occurrence.sourceMarket === 'us' && availableMarkets.includes('us')) {
    return resolved(occurrence, availableMarkets, 'us', 'us-source-with-us-target');
  }

  if (availableMarkets.length === 1) {
    return resolved(occurrence, availableMarkets, availableMarkets[0], 'sole-existing-market');
  }

  return {
    occurrence,
    status: 'ambiguous-market',
    availableMarkets,
    reason: 'multiple-existing-markets',
  };
}
```

The private `resolved()` helper must call `rewriteHref()` and produce a canonical market-prefixed path.

- [ ] **Step 5: Run tests and commit**

Run:

```bash
npx vitest run __tests__/unit/internal-mdx-link-fix.test.ts
npx tsc --noEmit
```

Expected: PASS.

Commit:

```bash
git add scripts/lib/internal-mdx-link-fix.ts __tests__/unit/internal-mdx-link-fix.test.ts
git commit -m "test(seo): add canonical internal-link resolver"
```

---

### Task 3: Build the Fail-Closed Dry-Run and Write CLI

**Files:**
- Create: `scripts/fix-internal-mdx-links.ts`
- Modify: `__tests__/unit/internal-mdx-link-fix.test.ts`

**Interfaces:**
- Consumes: Task 2 analyzer functions.
- Produces: `validateWriteReadiness(report, decisions, freshRouteIndex, selectedMarket)`, `--dry-run`, `--check`, `--validate-decisions`, and `--write` modes plus JSON reports and purge URL lists.

- [ ] **Step 1: Add failing guard tests**

Test that write validation rejects all of these conditions:

```ts
expect(() => validateWriteReadiness(report, [], freshRouteIndex, 'au')).toThrow(/ambiguous/i);
expect(() => validateWriteReadiness(unresolvedReport, decisions, freshRouteIndex, 'au'))
  .toThrow(/unresolved/i);
expect(() => validateWriteReadiness(report, staleHashDecisions, freshRouteIndex, 'au'))
  .toThrow(/hash/i);
expect(() => validateWriteReadiness(report, wrongMarketDecision, freshRouteIndex, 'au'))
  .toThrow(/available market/i);
expect(() => validateWriteReadiness(report, decisions, freshIndexWithoutAutoTarget, 'au'))
  .toThrow(/automatic target.*not found/i);
expect(() => validateWriteReadiness(report, decisions, freshIndexWithoutManualTarget, 'au'))
  .toThrow(/manual target.*not found/i);
```

Run the focused test and confirm FAIL.

- [ ] **Step 2: Implement CLI argument parsing and report schema**

Support these exact commands:

```bash
npx tsx scripts/fix-internal-mdx-links.ts --dry-run --report <path>
npx tsx scripts/fix-internal-mdx-links.ts --dry-run --report <path> --purge-list <path>
npx tsx scripts/fix-internal-mdx-links.ts --check [--market us|uk|ca|au]
npx tsx scripts/fix-internal-mdx-links.ts --validate-decisions --report <path> --decisions <path>
npx tsx scripts/fix-internal-mdx-links.ts --write --market us|uk|ca|au --report <path> --decisions <path>
```

Default to `--dry-run` when no mode is supplied. Reject `--write` without an explicit market, report, and decisions file.

The report must contain:

```ts
interface LinkFixReport {
  version: 1;
  generatedAt: string;
  repositoryHead: string;
  counts: {
    total: number;
    files: number;
    resolved: number;
    ambiguous: number;
    unresolved: number;
    markdown: number;
    jsx: number;
    categoryRoots: number;
    multiSegment: number;
  };
  resolutions: LinkResolution[];
  sourceFiles: Array<{ file: string; sourceMarket: Market; sha256: string; canonicalUrl: string }>;
}
```

- [ ] **Step 3: Implement decision validation and span-safe writing**

Decision records must use the dry-run occurrence ID and source hash:

```ts
interface ManualDecision {
  occurrenceId: string;
  sourceSha256: string;
  targetMarket: Market;
  targetHref: string;
  reason: string;
  reviewedAt: string;
}
```

At the start of every `--write --market <market>` invocation, rebuild the route index from the current checkout immediately before write-readiness validation:

```ts
const freshRouteIndex = buildRouteIndex(process.cwd());
validateWriteReadiness(report, decisions, freshRouteIndex, selectedMarket);
```

`validateWriteReadiness()` must revalidate **every selected-market target** against `freshRouteIndex`: the `targetHref` generated by an automatic resolution and the `targetHref` supplied by a manual decision. For each target, strip query, fragment, and trailing slash; parse the market prefix plus route key; confirm that `freshRouteIndex.get(routeKey)?.has(targetMarket)` is true; and confirm the href prefix matches `targetMarket`. Validate all selected targets and all selected source hashes before opening or mutating any output file. This closes the gap where a valid target existed at dry-run time but was deleted before a later market write.

This still permits a reviewed typo correction to choose a different valid slug while rejecting invented or newly deleted routes. Group rewrites by file, sort occurrences by descending `start`, and replace only `source.slice(start, end)`. Recompute the file hash immediately before writing. In `--write --market <market>` mode, hash-check only source files in the selected market so earlier market commits do not invalidate untouched markets from the same baseline.

- [ ] **Step 4: Implement check and purge-list output**

`--check --market au` exits `0` only when that market contains zero bare category links. A successful all-market dry run with `--purge-list` writes a sorted, unique newline-delimited list of absolute URLs. Construct every entry with `new URL(pathname, 'https://smartfinpro.com').href`, reject any non-`https:` URL or hostname other than `smartfinpro.com`, and assert every output line matches `^https://smartfinpro\.com/`. The list contains:

```text
all canonical source-page URLs whose HTML contains a corrected link
all exact original bare href URLs discovered in those pages
the slashless normalized form of each original bare href URL
https://smartfinpro.com/trading/cmc-markets-review
```

This covers stale source HTML and stale redirect/404 edge entries without purging unrelated assets.

- [ ] **Step 5: Run tests and commit**

Run:

```bash
npx vitest run __tests__/unit/internal-mdx-link-fix.test.ts
npx tsc --noEmit
```

Expected: PASS.

Commit:

```bash
git add scripts/fix-internal-mdx-links.ts scripts/lib/internal-mdx-link-fix.ts __tests__/unit/internal-mdx-link-fix.test.ts
git commit -m "feat(seo): add fail-closed MDX link repair CLI"
```

---

### Task 4: Generate and Review the Complete Decision Set

**Files:**
- Create: `audits/canonical-links/2026-07-15-baseline.json`
- Create: `audits/canonical-links/2026-07-15-decisions.json`
- Create: `audits/canonical-links/2026-07-15-purge-urls.txt`

**Interfaces:**
- Consumes: Task 3 CLI.
- Produces: a hash-bound, fully reviewed decision set with zero unresolved occurrences.

- [ ] **Step 1: Generate the baseline**

Run:

```bash
npx tsx scripts/fix-internal-mdx-links.ts --dry-run --report audits/canonical-links/2026-07-15-baseline.json --purge-list audits/canonical-links/2026-07-15-purge-urls.txt
```

Expected: counts close to 936 total, 145 files, 115 ambiguous. Any drift must be explained in the report before proceeding.

The baseline report must already contain the computed and route-validated `targetHref` for every unambiguous occurrence. This completes authorized rollout step 2 without writing any MDX file.

Validate the generated purge artifact before committing it:

```bash
test -s audits/canonical-links/2026-07-15-purge-urls.txt
if rg -n -v '^https://smartfinpro\.com/' audits/canonical-links/2026-07-15-purge-urls.txt; then
  exit 1
fi
```

Expected: the file is non-empty and the validation command prints nothing.

- [ ] **Step 2: Resolve every ambiguous and unresolved occurrence**

Read the surrounding source paragraph/list for every ambiguous occurrence. Add one `ManualDecision` per occurrence. Do not deduplicate decisions merely because the same href appears in multiple files; author intent is occurrence-specific.

For an unresolved typo or dead link, set `targetHref` to the confirmed canonical route and `targetMarket` to its prefix. If no valid route exists, stop and report the blocker rather than suppressing the occurrence.

- [ ] **Step 3: Validate decisions**

Run:

```bash
npx tsx scripts/fix-internal-mdx-links.ts --validate-decisions --report audits/canonical-links/2026-07-15-baseline.json --decisions audits/canonical-links/2026-07-15-decisions.json
```

Expected:

```text
unresolved=0
ambiguous_without_decision=0
invalid_manual_targets=0
stale_source_hashes=0
ready_to_write=true
```

- [ ] **Step 4: Commit the reviewed audit record**

```bash
git add audits/canonical-links/2026-07-15-baseline.json audits/canonical-links/2026-07-15-decisions.json audits/canonical-links/2026-07-15-purge-urls.txt
git commit -m "docs(seo): record canonical link decisions"
```

---

### Task 5: Apply and Verify the Australia Batch

**Files:**
- Modify: `content/au/**/*.mdx` selected by the validated report.
- Create: `audits/canonical-links/2026-07-15-au-after.json`

**Interfaces:**
- Consumes: validated report and decisions from Task 4.
- Produces: zero bare category links in AU content and no frontmatter changes.

- [ ] **Step 1: Write only the AU batch**

```bash
npx tsx scripts/fix-internal-mdx-links.ts --write --market au --report audits/canonical-links/2026-07-15-baseline.json --decisions audits/canonical-links/2026-07-15-decisions.json
npx tsx scripts/fix-internal-mdx-links.ts --check --market au
```

Expected: `bare_links=0`, `unresolved=0`, `frontmatter_changes=0`.

- [ ] **Step 2: Run the mandatory non-content gate**

`git diff --check` below is only a whitespace/error-marker hygiene check. The span-safe writer, fresh route-index validation, source hashes, and explicit frontmatter/metadata checks provide the evidence that the batch changed only intended link spans.

```bash
git diff --check
npm run check:mdx
npm run check:frontmatter
node scripts/check-seo-quality.mjs --report
npx tsc --noEmit
npx vitest run
npx next build --webpack
```

Expected: all commands pass. Confirm no changed `title`, `description`, `modifiedDate`, or `dataVerifiedDate` lines.

- [ ] **Step 3: Record before/after metrics and commit**

The AU report must show total links changed, files changed, bare links before/after, invalid targets before/after, and frontmatter changes (`0`).

```bash
git add content/au audits/canonical-links/2026-07-15-au-after.json
git commit -m "fix(seo): canonicalize AU internal content links"
```

---

### Task 6: Apply and Verify the Canada Batch

**Files:**
- Modify: `content/ca/**/*.mdx` selected by the validated report.
- Create: `audits/canonical-links/2026-07-15-ca-after.json`

**Interfaces:**
- Consumes: Task 4 report and decisions.
- Produces: zero bare category links in CA content and no frontmatter changes.

- [ ] **Step 1: Write and check Canada**

```bash
npx tsx scripts/fix-internal-mdx-links.ts --write --market ca --report audits/canonical-links/2026-07-15-baseline.json --decisions audits/canonical-links/2026-07-15-decisions.json
npx tsx scripts/fix-internal-mdx-links.ts --check --market ca
```

Expected: `bare_links=0`, `unresolved=0`, `frontmatter_changes=0`.

- [ ] **Step 2: Run the full remaining quality gate**

`git diff --check` below is only a whitespace/error-marker hygiene check. The span-safe writer, fresh route-index validation, source hashes, and explicit frontmatter/metadata checks provide the narrow-change guarantee.

```bash
git diff --check
npm run check:mdx
npm run check:frontmatter
node scripts/check-seo-quality.mjs --report
npx tsc --noEmit
npx vitest run
npx next build --webpack
```

Expected: PASS with no metadata/date changes.

- [ ] **Step 3: Record metrics and commit**

```bash
git add content/ca audits/canonical-links/2026-07-15-ca-after.json
git commit -m "fix(seo): canonicalize CA internal content links"
```

---

### Task 7: Apply and Verify the United Kingdom Batch

**Files:**
- Modify: `content/uk/**/*.mdx` selected by the validated report.
- Create: `audits/canonical-links/2026-07-15-uk-after.json`

**Interfaces:**
- Consumes: Task 4 report and decisions.
- Produces: zero bare category links in UK content and no frontmatter changes.

- [ ] **Step 1: Write and check the UK batch**

```bash
npx tsx scripts/fix-internal-mdx-links.ts --write --market uk --report audits/canonical-links/2026-07-15-baseline.json --decisions audits/canonical-links/2026-07-15-decisions.json
npx tsx scripts/fix-internal-mdx-links.ts --check --market uk
```

Expected: `bare_links=0`, `unresolved=0`, `frontmatter_changes=0`.

- [ ] **Step 2: Run the full remaining quality gate**

`git diff --check` below is only a whitespace/error-marker hygiene check. The span-safe writer, fresh route-index validation, source hashes, and explicit frontmatter/metadata checks provide the narrow-change guarantee.

```bash
git diff --check
npm run check:mdx
npm run check:frontmatter
node scripts/check-seo-quality.mjs --report
npx tsc --noEmit
npx vitest run
npx next build --webpack
```

Expected: PASS with no metadata/date changes.

- [ ] **Step 3: Record metrics and commit**

```bash
git add content/uk audits/canonical-links/2026-07-15-uk-after.json
git commit -m "fix(seo): canonicalize UK internal content links"
```

---

### Task 8: Apply and Verify the United States Batch

**Files:**
- Modify: `content/us/**/*.mdx` selected by the validated report.
- Create: `audits/canonical-links/2026-07-15-us-after.json`

**Interfaces:**
- Consumes: Task 4 report and decisions.
- Produces: zero bare category links in US content and no frontmatter changes.

- [ ] **Step 1: Write and check the US batch**

```bash
npx tsx scripts/fix-internal-mdx-links.ts --write --market us --report audits/canonical-links/2026-07-15-baseline.json --decisions audits/canonical-links/2026-07-15-decisions.json
npx tsx scripts/fix-internal-mdx-links.ts --check --market us
```

Expected: `bare_links=0`, `unresolved=0`, `frontmatter_changes=0`.

- [ ] **Step 2: Run the full remaining quality gate**

`git diff --check` below is only a whitespace/error-marker hygiene check. The span-safe writer, fresh route-index validation, source hashes, and explicit frontmatter/metadata checks provide the narrow-change guarantee.

```bash
git diff --check
npm run check:mdx
npm run check:frontmatter
node scripts/check-seo-quality.mjs --report
npx tsc --noEmit
npx vitest run
npx next build --webpack
```

Expected: PASS with no metadata/date changes.

- [ ] **Step 3: Record metrics and commit**

```bash
git add content/us audits/canonical-links/2026-07-15-us-after.json
git commit -m "fix(seo): canonicalize US internal content links"
```

---

### Task 9: Add the Permanent Content Regression Guard

**Files:**
- Create: `__tests__/unit/mdx-internal-links.test.ts`

**Interfaces:**
- Consumes: Task 2 extraction and route-index functions.
- Produces: `extractCanonicalCategoryLinks()` plus CI protection against new bare links and market-prefixed links to missing content/cockpit routes.

Add this public type and function to `scripts/lib/internal-mdx-link-fix.ts`:

```ts
export interface CanonicalCategoryLink {
  file: string;
  originalHref: string;
  targetMarket: Market;
  routeKey: string;
  line: number;
  column: number;
}

export function extractCanonicalCategoryLinks(
  file: string,
  source: string,
): CanonicalCategoryLink[];
```

- [ ] **Step 1: Add the repository-wide test**

```ts
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  buildRouteIndex,
  extractBareLinks,
  extractCanonicalCategoryLinks,
} from '@/scripts/lib/internal-mdx-link-fix';

describe('MDX internal category links', () => {
  it('contains no bare category links', () => {
    const violations = scanAllContent().flatMap(({ file, market, source, hash }) =>
      extractBareLinks(file, market, source, hash),
    );
    expect(violations, formatViolations(violations)).toHaveLength(0);
  });

  it('points every market-prefixed category link at a known route', () => {
    const routeIndex = buildRouteIndex(process.cwd());
    const broken = scanAllContent()
      .flatMap(({ file, source }) => extractCanonicalCategoryLinks(file, source))
      .filter((link) => !routeIndex.get(link.routeKey)?.has(link.targetMarket));
    expect(broken, formatViolations(broken)).toHaveLength(0);
  });
});
```

Implement `extractCanonicalCategoryLinks()` with the same Markdown/JSX capture rules as `extractBareLinks()`, but accept only `/<market>/<category>...` paths and strip query, fragment, and trailing slash before creating `routeKey`. Implement `scanAllContent()` by calling Task 2's `listMarketContentFiles(process.cwd())`; do not add an independent glob. Implement `formatViolations()` in the test file using sorted paths for deterministic output. This keeps the permanent guard and writer on the identical `content/{us,uk,ca,au}/**/*.mdx` scope; `cross-market` and `_templates` remain governed by the explicit exclusion policy from Task 1.

- [ ] **Step 2: Run and commit the guard**

```bash
npx vitest run __tests__/unit/internal-mdx-link-fix.test.ts __tests__/unit/mdx-internal-links.test.ts
npx tsc --noEmit
git add __tests__/unit/mdx-internal-links.test.ts scripts/lib/internal-mdx-link-fix.ts
git commit -m "test(seo): block bare and broken MDX category links"
```

Expected: PASS.

---

### Task 10: Add Narrow Legacy Redirects with Tests

**Files:**
- Create: `__tests__/unit/canonical-redirects.test.ts`
- Modify: `vitest.setup.ts:7-18`
- Modify: `proxy.ts:1-21,551-554`
- Modify: `next.config.ts:571-626`

**Interfaces:**
- Consumes: `Market` from `lib/i18n/config.ts`.
- Produces: direct 308 redirects for five non-US-exclusive bare categories, unchanged generic 301 behavior, and an exact CMC Markets redirect.

- [ ] **Step 1: Add a failing test for the global `next/server` mock contract**

Start `__tests__/unit/canonical-redirects.test.ts` with this compatibility test. Under the current global mock, the file must fail during import with `No "NextRequest" export`:

```ts
import { NextRequest, NextResponse } from 'next/server';
import { describe, expect, it } from 'vitest';

describe('next/server test setup', () => {
  it('preserves real exports while retaining the JSON test double', () => {
    const request = new NextRequest('https://smartfinpro.com/trading/fidelity-review');
    expect(request.nextUrl.pathname).toBe('/trading/fidelity-review');
    expect(NextResponse.json({ ok: true })).toMatchObject({
      __nextResponseMock: true,
      data: { ok: true },
      status: 200,
    });
  });
});
```

Run:

```bash
npx vitest run __tests__/unit/canonical-redirects.test.ts
```

Expected: FAIL because `vitest.setup.ts` currently replaces the whole module and omits `NextRequest`.

- [ ] **Step 2: Convert the global mock to a partial mock**

Replace only the `next/server` mock in `vitest.setup.ts`. Preserve all real exports via `importOriginal()` and override only `NextResponse.json`; do not use `vi.unmock()`:

```ts
vi.mock('next/server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next/server')>();

  class MockNextResponse<Body = unknown> extends actual.NextResponse<Body> {
    static json<JsonBody>(
      data: JsonBody,
      init?: ResponseInit,
    ): import('next/server').NextResponse<JsonBody> {
      return {
        __nextResponseMock: true,
        data,
        status: init?.status ?? 200,
      } as unknown as import('next/server').NextResponse<JsonBody>;
    }
  }

  return {
    ...actual,
    NextResponse: MockNextResponse,
  };
});
```

Run:

```bash
npx vitest run __tests__/unit/canonical-redirects.test.ts __tests__/unit/validation.test.ts
```

Expected: PASS, proving `NextRequest` is available and the pre-existing JSON test-double behavior remains intact.

- [ ] **Step 3: Write failing redirect tests**

```ts
import { proxy } from '@/proxy';
import nextConfig from '../../next.config';

describe('canonical legacy redirects', () => {
  it.each([
    ['/superannuation/fund-review?src=gsc', '/au/superannuation/fund-review?src=gsc'],
    ['/remortgaging/lender-review', '/uk/remortgaging/lender-review'],
    ['/cost-of-living/guide', '/uk/cost-of-living/guide'],
    ['/tax-efficient-investing/platform-review', '/ca/tax-efficient-investing/platform-review'],
    ['/housing/mortgage-review', '/ca/housing/mortgage-review'],
  ])('redirects %s directly to %s', async (source, destination) => {
    const response = await proxy(new NextRequest(`https://smartfinpro.com${source}`));
    expect(response.status).toBe(308);
    expect(response.headers.get('location')).toBe(`https://smartfinpro.com${destination}`);
  });

  it('keeps the generic legacy US redirect at 301', async () => {
    const response = await proxy(new NextRequest('https://smartfinpro.com/trading/fidelity-review'));
    expect(response.status).toBe(301);
    expect(response.headers.get('location')).toBe('https://smartfinpro.com/us/trading/fidelity-review');
  });

  it('declares the exact CMC Markets permanent redirect', async () => {
    const redirects = await nextConfig.redirects?.();
    expect(redirects).toContainEqual({
      source: '/trading/cmc-markets-review',
      destination: '/au/trading/cmc-markets-review',
      permanent: true,
    });
  });
});
```

Run the test and confirm FAIL.

- [ ] **Step 4: Implement the exclusive-category redirects**

Add the type import and map near the existing routing constants:

```ts
import type { Market } from '@/lib/i18n/config';

const EXCLUSIVE_CATEGORY_MARKET: Readonly<Record<string, Market>> = {
  remortgaging: 'uk',
  'cost-of-living': 'uk',
  'tax-efficient-investing': 'ca',
  housing: 'ca',
  superannuation: 'au',
};
```

Insert before the existing Step 6 generic redirect and preserve query parameters:

```ts
const exclusiveMarket = EXCLUSIVE_CATEGORY_MARKET[firstSegment];
if (exclusiveMarket) {
  const target = request.nextUrl.clone();
  target.pathname = `/${exclusiveMarket}${pathname}`;
  return NextResponse.redirect(target, 308);
}
```

Do not alter the existing 301 block.

- [ ] **Step 5: Add the exact CMC rule**

Add this object near the top of `redirects()` after the host canonicalization rule:

```ts
{
  source: '/trading/cmc-markets-review',
  destination: '/au/trading/cmc-markets-review',
  permanent: true,
},
```

Do not modify `trailingSlash` or other redirect entries.

- [ ] **Step 6: Run tests and commit**

```bash
npx vitest run __tests__/unit/canonical-redirects.test.ts
npx vitest run
npx tsc --noEmit
npx next build --webpack
git add vitest.setup.ts proxy.ts next.config.ts __tests__/unit/canonical-redirects.test.ts
git commit -m "fix(seo): route legacy market URLs to canonical targets"
```

Expected: PASS.

---

### Task 11: Run Full Local Verification and Produce the Final Report

**Files:**
- Create: `audits/canonical-links/2026-07-15-final-report.md`

**Interfaces:**
- Consumes: all implementation tasks.
- Produces: evidence that content, redirect behavior, canonical metadata, and quality gates pass locally.

- [ ] **Step 1: Run the complete static gate**

```bash
git diff --check
npm run check:mdx
npm run check:frontmatter
npx tsc --noEmit
npx vitest run
npx next build --webpack
```

Expected: all commands pass.

- [ ] **Step 2: Start the production build locally**

```bash
PORT=3002 npm run start
```

Expected: server listening on `http://127.0.0.1:3002`.

- [ ] **Step 3: Verify redirects with real GET requests and zero automatic hops**

For every Redirect Matrix source, run:

```bash
curl -sS -D - -o /dev/null --max-redirs 0 http://127.0.0.1:3002/trading/cmc-markets-review
curl -sS -D - -o /dev/null --max-redirs 0 http://127.0.0.1:3002/superannuation/example-slug
curl -sS -D - -o /dev/null --max-redirs 0 http://127.0.0.1:3002/trading/fidelity-review
```

Expected respectively: direct CMC permanent redirect to AU, direct 308 to AU for the exclusive category, and unchanged 301 to US for the generic category. Follow each `Location` manually and verify the final canonical target is 200 for real fixture slugs.

- [ ] **Step 4: Verify canonical HTML and protected routes**

Use `scripts/smoke-test.mjs` against representative canonical US/UK/CA/AU pages. Confirm `/api/health`, `/_next/`, `/go/`, `/dashboard`, `/robots.txt`, and `/sitemap.xml` do not enter the new exclusive redirect branch.

- [ ] **Step 5: Write the final before/after report**

Include this table with measured values:

```markdown
| Metric | Before | After |
|---|---:|---:|
| Bare internal category links | 936, unless Task 1 documents drift | 0 |
| Files containing bare links | 145, unless Task 1 documents drift | 0 |
| Ambiguous occurrences | 115, unless Task 1 documents drift | 0 unreviewed |
| Unresolved targets | Task 4 baseline value | 0 |
| Confirmed redirect-to-404 matrix cases | 1 | 0 |
| Frontmatter date changes | 0 | 0 |
| Sitemap/Overview files changed | 0 | 0 |
```

Commit:

```bash
git add audits/canonical-links/2026-07-15-final-report.md
git commit -m "docs(seo): report canonical URL normalization results"
```

---

### Task 12: Deploy, Purge in Batches, and Measure Impact

**Files:**
- Read: `scripts/purge-cloudflare.mjs`
- Read: `audits/canonical-links/2026-07-15-purge-urls.txt`

**Interfaces:**
- Consumes: explicit production-deployment authorization and the verified purge list.
- Produces: fresh source-page HTML and redirect responses at Cloudflare edges, plus a 30/60/90-day measurement baseline.

- [ ] **Step 1: Stop for deployment authorization**

Do not deploy or purge as an implied part of implementation. Present the local verification report and obtain explicit approval.

- [ ] **Step 2: Deploy and verify origin health**

Use the repository deployment procedure. Confirm origin and public homepage health before purging.

- [ ] **Step 3: Purge exact URLs in batches of at most 100**

Cloudflare currently allows at most 100 single-file purge operations per request. The Task 4 list already includes canonical source pages, original/normalized bare URL forms, and the exact CMC legacy URL. Split it and invoke the existing script once per generated batch:

```bash
test -s audits/canonical-links/2026-07-15-purge-urls.txt
if rg -n -v '^https://smartfinpro\.com/' audits/canonical-links/2026-07-15-purge-urls.txt; then
  echo 'Refusing purge: invalid or non-HTTPS URL in purge list' >&2
  exit 1
fi
batch_dir="$(mktemp -d /tmp/sfp-canonical-purge.XXXXXX)"
trap 'rm -rf "$batch_dir"' EXIT
split -l 100 audits/canonical-links/2026-07-15-purge-urls.txt "$batch_dir/batch-"
for batch in "$batch_dir"/batch-*; do
  test -s "$batch" || exit 1
  xargs node scripts/purge-cloudflare.mjs < "$batch"
done
```

Expected: the source list and every generated batch are non-empty, every argument is an absolute SmartFinPro HTTPS URL, every batch contains at most 100 URLs, and every call returns `Purge successful`. These checks are mandatory because `scripts/purge-cloudflare.mjs` filters non-HTTP arguments and falls back to `DEFAULT_URLS` when no custom URLs survive. Do not use `--everything`. Reference: [Cloudflare purge limits](https://developers.cloudflare.com/cache/how-to/purge-cache/).

- [ ] **Step 4: Re-run production GET and canonical checks**

Verify the complete Redirect Matrix against `https://smartfinpro.com` using GET with `--max-redirs 0`, then verify final targets, canonicals, hreflang, and source-page HTML links.

- [ ] **Step 5: Establish GSC measurement cohorts**

Export the affected bare URLs and canonical targets from the audit report. Record the Page Indexing counts and representative URL Inspection results at deployment, then repeat after 30, 60, and 90 days. Report correlation only; do not claim that the technical fix caused all movement in the 218-URL bucket.

Every measurement report must repeat that short-term GSC fluctuations can occur while Google reprocesses URLs and are not automatically a ranking loss. It must also state that the 218 cases are not expected to disappear completely because content quality and other indexing causes remain outside this technical fix.

---

## Self-Review

- Spec coverage: link discovery, 115+ ambiguity review, app-route indexing, fail-closed write, market-separated commits, redirects, protected routes, quality gate, Cloudflare purge, and GSC measurement are each assigned to a task.
- Scope: sitemap and Hub/Overview work are explicitly excluded; writer and permanent guard share the exact four-market MDX scope, with `cross-market` and `_templates` covered by a stop-on-drift exclusion audit.
- Safety adjustment: category exclusivity never bypasses target existence verification.
- Write-race adjustment: automatic and manual targets are revalidated against a fresh route index before any selected-market file mutation.
- Test-runtime adjustment: the global `next/server` mock becomes partial so redirect tests retain real `NextRequest` and static redirect behavior.
- Purge adjustment: only validated absolute HTTPS URLs enter non-empty, isolated batches of at most 100.
- Authorization: the one-time AGENTS.md date/score exception is recorded as approved; production deployment and purge remain separate approval gates.
- Rollout interpretation: unambiguous replacements are prepared in dry-run before all ambiguous decisions, but no content mutation occurs until the complete decision set is valid.
- Type consistency: `Market`, `LinkOccurrence`, `LinkResolution`, `RouteIndex`, report, and decision types are defined once and reused.
- Undefined-marker scan: no implementation step delegates unspecified work or error handling.
- Rollback: each market and redirect change is an independent commit; no broad redirect or global cache purge is used.

## Separate Follow-Up Ticket

Audit `next.config.ts:801-805`, where `/us/forex/cmc-markets-review` currently redirects to `/uk/forex/cmc-markets-review`. The UK content route does not exist, while both `content/au/forex/cmc-markets-review.mdx` and `content/ca/forex/cmc-markets-review.mdx` exist. Keep this out of the current rollout; determine the intended market from historical URL intent, backlinks, and canonical policy, then add its own failing redirect-chain test before changing the destination.
