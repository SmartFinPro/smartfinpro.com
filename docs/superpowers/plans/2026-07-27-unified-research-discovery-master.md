# Unified Research Discovery Implementation Master Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the homepage report feed and the single-topic `/research` pilot with one market-aware discovery catalog, four universal Research hubs, a homepage Quick Finder, topic/spec facets, and a measurable Research funnel.

**Architecture:** A server-only catalog joins normalized MDX review metadata with qualified Cockpit research contexts and exposes stable `DiscoveryItem` entities. Pure shell modules own projection, filtering, facets, shortlist scope, and URL contracts; server components render crawlable content while client shells add local or query-backed interaction. The five delivery plans below are sequential, independently deployable PRs.

**Tech Stack:** Next.js 16 App Router · React 19 RSC · TypeScript · Zod · `unstable_cache` · Vitest · Playwright · Supabase-backed `product_attributes` and `analytics_events`

## Global Constraints

- Normative source: `docs/superpowers/specs/2026-07-27-research-discovery-catalog-design.md`.
- At any conflict, the normative spec wins over every implementation plan.
- Market routes are `/research`, `/uk/research`, `/ca/research`, and `/au/research`; never introduce `?market=`.
- `DiscoveryItem` is the stable entity; `DiscoveryProjection.kind` is derived after filtering and is never persisted on an item.
- Audited scores use the 0–10 scale only with an audited context; editorial ratings use the 0–5 scale and are labelled separately without stars.
- Never render or propagate `reviewCount` on Research cards.
- Qualified contexts are exactly `audited` and `provisional`; `unavailable` never creates a dossier.
- Shortlists contain at most four slugs from one `${market}/${category}/${topic}` Cockpit key.
- Storage v2 is `research-shortlist:${market}:${category}:${topic}` plus `research-shortlist-active:${market}`.
- Raw search text never leaves the browser; analytics receives only trimmed length and result count.
- `research_v1` changes are additive; `cockpit_v1` and `tool_v1` remain unchanged.
- No client fetch for Discovery data.
- Filtered Research URLs are `noindex, follow` and canonicalize to the filterless market hub.
- All four hub routes must remain statically generated in the production build.
- The serialized catalog for each market must remain below 200 KB.
- Homepage JavaScript growth must remain at or below 25 KB gzip.
- Lab LCP must remain at or below 2.5 seconds and no more than 10% above baseline; CLS must remain below 0.1.
- Axe must report no serious or critical findings on the covered Research surfaces.
- Preserve unrelated user changes and avoid unrelated refactors.

---

## Source State and Worktree

The design branch is `codex/research-discovery-design` at commit `88727d5`, based on `origin/main` commit `afeabcb`.

At execution time, first land the spec through a documentation PR or cherry-pick `88727d5` into the PR 1 branch. Every code PR then starts from the latest `origin/main`, not from the dirty `design/fdl-high-fi` checkout.

Use one worktree per PR:

```bash
git fetch origin
git worktree add .worktrees/research-discovery-pr1 -b codex/research-discovery-pr1 origin/main
cp .env.local .worktrees/research-discovery-pr1/.env.local
ln -s "$(pwd)/node_modules" .worktrees/research-discovery-pr1/node_modules
```

Before editing, prove the expected base and a clean scope:

```bash
git branch --show-current
git log -1 --oneline
git status --short
```

Expected: the intended `codex/research-discovery-prN` branch, the latest merged predecessor, and no output from `git status --short`.

## Delivery Map

| PR  | Plan                                                                                      | Deployable result                                                            | Depends on    |
| --- | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ------------- |
| 1   | [Catalog](./2026-07-27-unified-research-discovery-pr1-catalog.md)                         | Canonical catalog, pure projection/facets, scoped shortlist core             | Spec merged   |
| 2   | [Universal hubs](./2026-07-27-unified-research-discovery-pr2-hubs.md)                     | Four crawlable hubs, cards, URL filters, shortlist UI, SEO and hub analytics | PR 1 merged   |
| 3   | [Quick Finder](./2026-07-27-unified-research-discovery-pr3-quick-finder.md)               | Homepage Finder replaces report feed and Editor's Picks                      | PR 2 merged   |
| 4   | [Topic/spec facets](./2026-07-27-unified-research-discovery-pr4-topic-spec-facets.md)     | Category-aware topic/spec filtering with reload/back support                 | PR 3 merged   |
| 5   | [Funnel verification](./2026-07-27-unified-research-discovery-pr5-funnel-verification.md) | Wire-payload proof, SQL runbook, 24-hour smoke and generated two-week report | PR 4 deployed |

Do not execute PRs in parallel. Later plans rely on interfaces and routes introduced by earlier plans, but no PR relies on an unmerged later PR.

## Normative Spec Coverage

| Spec section                     | Owning plan/task                            |
| -------------------------------- | ------------------------------------------- |
| §1 Result                        | PR 2 Tasks 2–4; PR 3 Task 3                 |
| §2 Product decisions             | PR 2 Tasks 3, 6, 7; PR 3 Tasks 1–3          |
| §3 Scope/non-goals               | Global constraints in every plan            |
| §4 Canonical model               | PR 1 Tasks 1 and 4                          |
| §5 Catalog/cache/counts          | PR 1 Tasks 2, 4, and 5                      |
| §6 Projection/filter/facets/sort | PR 1 Task 2; PR 4 Tasks 1–3                 |
| §7 Routing/SEO/market switch     | PR 2 Tasks 2, 3, and 7                      |
| §8 Server/client/crawlability    | PR 2 Tasks 3, 4, and 8                      |
| §9 Cards/funnel                  | PR 2 Task 3; PR 3 Tasks 2 and 3             |
| §10 Topic/spec facets            | PR 4 Tasks 1–4                              |
| §11 Shortlist/compare            | PR 1 Task 3; PR 2 Task 5                    |
| §12 Analytics                    | PR 2 Task 6; PR 3 Task 1; PR 4 Task 3; PR 5 |
| §13 Error/degradation matrix     | PR 1 Task 4; PR 2 Tasks 3–5 and 8           |
| §14 Delivery order               | this master plan                            |
| §15 Test invariants              | PR 1 Task 5; PR 2 Tasks 7–8                 |
| §16 Definition of Done           | release-gate task in every child plan       |
| §17 Avoided architecture         | global constraints and interface boundaries |

The 16 invariant owners are:

| Invariant                    | Automated owner             |
| ---------------------------- | --------------------------- |
| 1–11                         | PR 1 Task 5                 |
| 12 raw HTML                  | PR 2 Task 8                 |
| 13 consistent counts         | PR 2 Task 8                 |
| 14 canonical market switch   | PR 2 Task 7                 |
| 15 noindex/canonical filters | PR 2 Tasks 2 and 7          |
| 16 actual item dimensions    | PR 2 Task 6 and PR 5 Task 1 |

## Baseline Commands

Run before PR 1 and record the output in `audits/reports/research-discovery-pr1-baseline.md`:

```bash
npx tsc --noEmit
npx vitest run __tests__/unit/research-shell-logic.test.ts __tests__/unit/research-events.test.ts
npm run check:imports
npm run build
```

For surface PRs, capture production HTML and asset sizes before changes:

```bash
PORT=3012 npm run start
curl -sS http://127.0.0.1:3012/research -o /tmp/research-before.html
wc -c /tmp/research-before.html
```

Use a separate terminal for `next start`; stop it after measurements.

## Per-Task Rhythm

Every task in the child plans follows the same reviewable cycle:

1. Write the narrow failing test.
2. Run only that test and confirm the expected failure.
3. Add the smallest production change.
4. Run the narrow test and the directly affected regression tests.
5. Review `git diff --check` and `git status --short`.
6. Commit only the task's files with the message specified by that task.

## Per-PR Completion Gate

Run the full gate from a clean production-build environment:

```bash
npx tsc --noEmit
npx vitest run
npm run check:imports
npm run build
```

For PRs 2–5, start the production server with `PORT=3012 npm run start` and
run the exact Playwright command printed in the corresponding child plan.

The default Playwright configuration disables JavaScript. Interactive specs must include:

```ts
test.use({ javaScriptEnabled: true });
```

The explicit raw-HTML/no-JavaScript test must retain the default.

Each PR report records:

- HTML and JavaScript payload sizes
- LCP and CLS where a surface changed
- visible and raw-HTML link counts
- review-backed, dossier, and union counts
- exact test count and result
- production build route type for every Research hub
- commit hash

## Final Series Acceptance

The series is complete only when all 16 invariants in the normative spec have an automated test, all four Research hubs return self-canonical 200 responses, every review href is present in raw HTML, the homepage Finder emits no more than six cards, and the generated two-week funnel report contains observed production values only.
