# Review V2 Audit Follow-up — Implementation Plan

> **Execution:** Work inline in the existing `design/review-v2-premium`
> worktree. Preserve the pre-existing audit implementation and the unrelated
> generated `audits/reports/unit-latest.json` change.

**Goal:** Complete the remaining Review V2 design-audit fixes without changing
MDX/frontmatter content or desktop information architecture.

**Architecture:** Replace the full mobile sidebar duplicate with a compact
action surface inserted into the verdict narrative. Share the action-button
implementation with the desktop sidebar, progressively disclose Essential
Facts on mobile, and apply the remaining typography/reflow/sticky/date fixes at
their narrowest owning components.

**Tech stack:** Next.js 16, React 19 server components, Tailwind 3.4, Vitest,
Playwright.

---

## Task 1: Lock the mobile action contract with failing tests

**Files:**

- Create: `__tests__/unit/review-action-buttons.test.ts`
- Create: `__tests__/unit/review-v2-audit-follow-up.test.ts`
- Modify: `__tests__/unit/verdict-card.test.ts`

1. Add a render-to-static-markup test for the shared action pair:
   - Compare always renders.
   - Visit and affiliate tracking attributes render only with a real URL.
2. Add a `VerdictCard` order test with a literal mobile-actions marker:
   - score precedes Best for;
   - marker follows Best for;
   - marker precedes Main limitation and summary.
3. Add a full `ReviewLayoutV2` test:
   - exactly one `DecisionBridge` remains (desktop sidebar only);
   - compact mobile actions render;
   - no in-flow mobile sidebar is emitted;
   - a bridge-without-verdict fixture still renders the mobile actions.
4. Run:

   ```bash
   npx vitest run __tests__/unit/review-action-buttons.test.ts __tests__/unit/verdict-card.test.ts __tests__/unit/review-v2-audit-follow-up.test.ts
   ```

   Expected: FAIL because the new components/slot do not exist and the current
   layout still emits two Market Checks.

## Task 2: Implement shared and mobile actions

**Files:**

- Create: `components/reviews/review-action-buttons.tsx`
- Create: `components/reviews/review-mobile-actions.tsx`
- Modify: `components/reviews/review-sidebar.tsx`
- Modify: `components/reviews/verdict-card.tsx`
- Modify: `components/reviews/review-layout-v2.tsx`

1. Extract the existing Compare/Visit pair into `ReviewActionButtons`.
2. Build `ReviewMobileActions` from that pair plus the required disclosure and
   risk copy.
3. Add an optional `mobileActions: ReactNode` slot to `VerdictCard` and render
   it directly after `BestForNotFor`.
4. Pass the mobile surface from `ReviewLayoutV2`; remove the mobile
   `ReviewSidebar`; keep a no-verdict fallback.
5. Run the Task 1 tests until green.
6. Refactor comments only after green; rerun the tests.

## Task 3: Make Essential Facts progressive on mobile

**Files:**

- Modify: `components/reviews/verdict-card.tsx`
- Modify: `__tests__/unit/verdict-card.test.ts`

1. Add a failing test proving mobile facts are available behind a native
   `details/summary` while the desktop facts rail remains.
2. Run the verdict-card test and observe RED.
3. Render:
   - the existing rail in `hidden md:block`;
   - a `md:hidden` collapsed `details` copy with the literal summary
     “Essential facts”.
4. Rerun the test to GREEN.

## Task 4: Fix freshness and sticky-rail exit

**Files:**

- Modify: `components/reviews/review-sidebar.tsx`
- Modify: `components/reviews/review-layout-v2.tsx`
- Modify: `__tests__/unit/review-sidebar.test.ts`
- Modify: `__tests__/unit/review-v2-audit-follow-up.test.ts`

1. Add failing tests for:
   - “Data verified” and exact `18 Jul 2026`;
   - absence of “Published” in the report card;
   - desktop rail wrapper reserving the 124 px exit offset.
2. Replace `publishDate` with `verifiedDate` in the sidebar API and add a
   deterministic exact-date formatter.
3. Pass `dataVerifiedDate ?? modifiedDate ?? publishDate`.
4. Add `lg:mb-[124px]` to the desktop rail grid item.
5. Run the two affected unit suites to GREEN.

## Task 5: Fix H2 hierarchy and 320 px footer reflow

**Files:**

- Modify: `components/reviews/review-layout-v2.tsx`
- Modify: `components/marketing/footer.tsx`
- Create: `e2e/review-v2-audit-follow-up.spec.ts`

1. Add browser assertions against the running page:
   - at 320 px, `scrollWidth === clientWidth`;
   - at 390 px, the first opening CTA starts within 2 viewport heights;
   - no visible mobile Market Check;
   - Essential Facts starts collapsed;
   - article H2 computes to 22 px and body to 17 px;
   - at 1440 px, article H2 computes to 24 px;
   - when Alternatives is at the sticky offset, no desktop rail pixels remain
     visible.
2. Run the new Playwright spec against port 3081 and observe RED.
3. Add scoped `.review-v2-prose h2` rules.
4. Make the footer bottom logo/social group wrap and use narrow-screen
   `px-6 sm:px-8`.
5. Rerun Playwright to GREEN; adjust the rail margin only from measured
   geometry if 124 px is not sufficient.

## Task 6: Regression verification

**Files:** no intended production changes

1. Run focused unit tests:

   ```bash
   npx vitest run __tests__/unit/review-action-buttons.test.ts __tests__/unit/review-v2-audit-follow-up.test.ts __tests__/unit/verdict-card.test.ts __tests__/unit/review-sidebar.test.ts __tests__/unit/final-decision.test.ts __tests__/unit/alternatives-section.test.ts __tests__/unit/score-in-field.test.ts
   ```

2. Run repository gates:

   ```bash
   npx tsc --noEmit
   npm run check:mdx
   npm run check:imports
   npm run lint
   npm run build
   ```

3. Run the Playwright follow-up spec against the production build.
4. Manually inspect screenshots at 320, 390, 768, 1024, 1280, and 1440.
5. Smoke a second Review V2 page and a no-position review.
6. Confirm `git diff --check`.

## Task 7: Commit without absorbing unrelated generated output

1. Review the complete diff and distinguish:
   - pre-existing audit implementation;
   - this follow-up;
   - unrelated `audits/reports/unit-latest.json`.
2. Stage all intended audit/follow-up source and test files, but exclude
   `audits/reports/unit-latest.json`.
3. Commit with a focused message and record the hash.
4. Report before/after browser metrics, verification results, touched files,
   and both documentation/implementation commits.
