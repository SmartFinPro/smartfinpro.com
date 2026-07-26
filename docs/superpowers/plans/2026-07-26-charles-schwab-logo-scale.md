# Charles Schwab Logo Scale Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enlarge the visible Charles Schwab square lockup in the Broker-V2 sidebar to approximately 110 px without changing the eToro wordmark.

**Architecture:** Extend the filesystem-backed logo resolver with a `squareLockup` presentation flag for the `charles-schwab` seeklogo. Render that presentation inside a 110 px overflow-hidden viewport with a 176 px source canvas, using the PNG's transparent padding as the crop area; retain the current wordmark markup for every other broker.

**Tech Stack:** React Server Components, TypeScript, Tailwind CSS, Vitest, `react-dom/server`

## Global Constraints

- Keep the supplied Charles Schwab PNG byte-for-byte unchanged.
- Apply the enlarged presentation only to the `charles-schwab` seeklogo.
- Preserve eToro's existing full-width wordmark presentation.
- Keep the complete blue square and both lettering lines visible.
- Do not modify review copy or review dates.

---

### Task 1: Square-lockup presentation

**Files:**
- Modify: `__tests__/unit/review-sidebar.test.ts`
- Modify: `components/reviews/review-sidebar.tsx`
- Verify: `public/images/brokers/charles-schwab-seeklogo.png`

**Interfaces:**
- Consumes: `decisionBridge.position.slug: string | null` and the filesystem-backed `{slug}-seeklogo.*` resolver.
- Produces: `resolveLogoSrc(): { src: string; isWordmark: boolean; squareLockup: boolean } | null` and server-rendered markup with `data-logo-presentation="square-lockup"`.

- [ ] **Step 1: Write the failing server-render test**

Add a test that renders `ReviewSidebar` with a Charles Schwab position:

```ts
it('enlarges the Charles Schwab square lockup without changing the eToro wordmark', () => {
  const schwabHtml = renderToStaticMarkup(
    h(ReviewSidebar, {
      productName: 'Charles Schwab',
      verifiedDate: '2026-07-26',
      decisionBridge: makeDecisionBridge({
        position: {
          rank: 2,
          slug: 'charles-schwab',
          name: 'Charles Schwab',
          score: 9.3,
          subScores: { fees: 8.6, features: 9.4, ux: 8.8, support: 8.6 },
          confidence: 'high',
          dataVerifiedAt: '2026-07-26',
          isTopPick: false,
        },
      }),
      compareLabel: 'Compare all 9 trading platforms',
      affiliateUrl: '/go/charles-schwab',
      market: 'us',
      category: 'trading',
    }),
  );

  expect(schwabHtml).toContain('/images/brokers/charles-schwab-seeklogo.png');
  expect(schwabHtml).toContain('data-logo-presentation="square-lockup"');
  expect(schwabHtml).toContain('h-[110px]');
  expect(schwabHtml).toContain('h-44 w-44');

  const etoroHtml = renderToStaticMarkup(
    h(ReviewSidebar, {
      productName: 'eToro',
      verifiedDate: '2026-07-18',
      decisionBridge: makeDecisionBridge(),
      compareLabel: 'Compare all 9 trading platforms',
      affiliateUrl: '/go/etoro',
      market: 'us',
      category: 'trading',
    }),
  );

  expect(etoroHtml).toContain('/images/brokers/etoro-seeklogo.svg');
  expect(etoroHtml).not.toContain('data-logo-presentation="square-lockup"');
  expect(etoroHtml).not.toContain('h-[110px]');
});
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```bash
npx vitest run __tests__/unit/review-sidebar.test.ts
```

Expected: the new test fails because `data-logo-presentation="square-lockup"` and `h-[110px]` do not exist yet.

- [ ] **Step 3: Implement the minimal square-lockup branch**

Extend the resolver result:

```ts
function resolveLogoSrc(
  slug: string | null | undefined,
): { src: string; isWordmark: boolean; squareLockup: boolean } | null
```

Set `squareLockup` only when `slug === 'charles-schwab'` and the selected candidate is a seeklogo. In the wordmark render branch, use:

```tsx
{logo.squareLockup ? (
  <div
    className="mt-2 flex h-[110px] w-full items-center justify-center overflow-hidden"
    data-logo-presentation="square-lockup"
  >
    <img
      src={logo.src}
      alt={`${productName} logo`}
      className="h-44 w-44 max-w-none shrink-0 object-contain"
    />
  </div>
) : (
  <img
    src={logo.src}
    alt={`${productName} logo`}
    className="mt-2 h-auto max-h-24 w-full object-contain"
  />
)}
```

- [ ] **Step 4: Run the focused test and verify GREEN**

Run:

```bash
npx vitest run __tests__/unit/review-sidebar.test.ts
```

Expected: all sidebar tests pass.

- [ ] **Step 5: Run the Review Quality Gate**

Run:

```bash
npx tsc --noEmit
npx vitest run __tests__/unit/review-sidebar.test.ts __tests__/unit/review-layout-v2.test.ts
npm run check:review-v2
npm run check:seo
```

Expected: every command exits 0. Existing fixture warnings may remain, but no test failures or new violations are allowed.

- [ ] **Step 6: Verify the rendered dimensions**

At `http://localhost:3081/us/trading/charles-schwab-review`, verify:

- the source is `/images/brokers/charles-schwab-seeklogo.png`;
- the complete visible blue square is approximately 110 px;
- the card does not overlap `Data verified`;
- eToro remains 234 × 78 px;
- the Charles Schwab page has no browser-console errors.

- [ ] **Step 7: Commit only the scoped implementation**

```bash
git add \
  __tests__/unit/review-sidebar.test.ts \
  components/reviews/review-sidebar.tsx \
  public/images/brokers/charles-schwab-seeklogo.png \
  docs/superpowers/plans/2026-07-26-charles-schwab-logo-scale.md
git commit -m "fix(reviews): enlarge the Schwab sidebar logo"
```
