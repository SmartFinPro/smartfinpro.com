// e2e/research-shell.spec.ts
// Browser E2E for the interactive Research Library shell — the risky
// integration points the pure-logic units can't reach: real Next router / URL
// state, hydration under Suspense, sessionStorage across a Cockpit round-trip,
// the #comparison scroll + active compare view, and the mobile layout. Runs
// against a real Chromium (the global config sets javaScriptEnabled:false for
// the redirect specs — this interactive suite overrides it).
//
// Target the running server via BASE_URL (e.g. the prod build on :3012);
// reuseExistingServer picks it up. Mobile assertions use bounding boxes /
// toBeInViewport rather than pixel constants, per the test plan.

import { test, expect, type Page } from '@playwright/test';

test.use({ javaScriptEnabled: true });

const SEARCH = 'Search platforms…';

async function dismissCookies(page: Page) {
  const essential = page.getByRole('button', { name: /essential only/i });
  if (await essential.isVisible().catch(() => false)) await essential.click().catch(() => {});
}

async function gotoResearch(page: Page) {
  await page.goto('/research');
  await dismissCookies(page);
  // The shell is client-rendered under Suspense — wait for hydration.
  await expect(page.getByPlaceholder(SEARCH)).toBeVisible();
}

/** Add the first N not-yet-shortlisted TRADING products. Scoped to the
 *  trading dossier (unified-research-discovery-pr2-hubs plan, Task 5): the
 *  generalized hub now shows every manifest topic on one page, and
 *  robo-advisors — not trading-platforms — is first in BEST_X_MANIFEST order
 *  (lib/comparison/topics/manifest.ts), so an unscoped "first N add buttons
 *  on the page" would silently shortlist the wrong topic. Scoping-only fix,
 *  same precedent as commit 7c64d80 (research-discovery-pr2-known-red.md,
 *  "#3 — echter Fund, behoben") — every existing assertion this helper feeds
 *  (max-of-four, the Cockpit handoff URL, the sessionStorage round-trip) is
 *  specifically about the trading dossier and is unchanged. */
async function shortlist(page: Page, n: number) {
  const tradingDossier = page.getByTestId('dossier-trading-platforms');
  for (let i = 0; i < n; i++) {
    await tradingDossier.getByRole('button', { name: /add .+ to shortlist/i }).first().click();
  }
}

// Storage v2 keys (lib/research/catalog-shell-logic.ts: shortlistPointerKey /
// shortlistStorageKey) — read directly so a UI-only assertion can't hide a
// storage-layer regression (spec's Task 5 Step 5: "Each test reads the exact
// v2 storage key through page.evaluate()").
const TRADING_POINTER_KEY = 'research-shortlist-active:us';
const TRADING_SCOPED_KEY = 'research-shortlist:us:trading:trading-platforms';
const CREDIT_REPAIR_SCOPED_KEY = 'research-shortlist:us:credit-repair:companies';
const DEBT_RELIEF_SCOPED_KEY = 'research-shortlist:us:debt-relief:companies';

async function sessionStorageItem(page: Page, key: string): Promise<string | null> {
  return page.evaluate((k) => window.sessionStorage.getItem(k), key);
}

/** A full, order-independent sessionStorage snapshot — used to prove Cancel
 *  leaves storage BYTE-IDENTICAL (spec §11.3.1): a key-by-key read could miss
 *  an unexpected key appearing or disappearing elsewhere in storage; this
 *  reads every entry. */
async function fullSessionStorageSnapshot(page: Page): Promise<Record<string, string>> {
  return page.evaluate(() => ({ ...window.sessionStorage }));
}

test.describe('Research Library shell — desktop', () => {
  test.beforeEach(async ({ page }) => gotoResearch(page));

  test('the trading pilot has a stable topic scope', async ({ page }) => {
    await expect(page.getByTestId('dossier-trading-platforms')).toBeVisible();
  });

  // Adversarial coverage, commit 5 (unified-research-discovery-pr2-hubs plan,
  // review of PR #122 / P1 fix 08c8959 "render every projection a filter can
  // select"). Fidelity is real production data: audited #1 in
  // us/trading/trading-platforms (a qualifying Cockpit context) AND the
  // subject of its own MDX review (content/us/trading/fidelity-review.mdx)
  // — so its DEFAULT projection (projectDiscoveryItems + EMPTY_DISCOVERY_
  // FILTERS) is the DOSSIER, proven by the first assertion below reusing the
  // same dossier section the "stable topic scope" test above already relies
  // on. Before the P1 fix, buildResearchHubNodes (now buildResearchNodeBank)
  // only ever resolved each item's single DEFAULT projection into a node —
  // so under `?type=review`, projectDiscoveryItems correctly still emitted
  // Fidelity's REVIEW projection (spec: filters.type === 'review' only needs
  // item.review), but no node existed for it, and ResearchHub's client-side
  // resolveEntry silently dropped the entry: Fidelity vanished from the page
  // entirely instead of degrading to its CatalogCard review view. Verified
  // against this exact live production build (2026-07-28) before writing
  // this assertion — see this repo's commit-5 report for the RED/GREEN
  // revert evidence.
  test('a review-backed item whose default projection is a dossier stays visible as a review under ?type=review (P1 node-bank fix)', async ({
    page,
  }) => {
    const tradingDossier = page.getByTestId('dossier-trading-platforms');
    await expect(tradingDossier.getByRole('heading', { name: 'Fidelity', exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Reviews', exact: true }).click();
    await expect(page).toHaveURL(/[?&]type=review/);

    // No dossier projections exist at all once type=review is active — the
    // whole dossier section (zero entries) never renders.
    await expect(page.getByTestId('dossier-trading-platforms')).toHaveCount(0);

    // Fidelity itself is still on the page — degraded to its review
    // projection, in the "More independent reviews" grid, keyed by its own
    // MDX title (the exact heading CatalogCard renders for a review
    // projection) rather than having silently disappeared.
    const reviewGrid = page.getByTestId('research-review-grid');
    await expect(reviewGrid).toBeVisible();
    await expect(
      reviewGrid.getByRole('heading', { name: 'Fidelity Review 2026: $0 Trades and Zero-Fee Index Funds' }),
    ).toBeVisible();
  });

  test('credit-repair and debt-relief render as two separate dossier sections, never merged under one heading', async ({
    page,
  }) => {
    // us/credit-repair/companies and us/debt-relief/companies share the bare
    // topic string "companies" (lib/comparison/topics/manifest.ts) but are
    // different Cockpit keys (spec §4.1) — grouping by the bare topic string
    // used to silently merge both categories' products into ONE section
    // under whichever manifest entry's label was seen first (credit-repair),
    // so a visitor would see debt-relief products under "Best Credit Repair".
    // Fixed by grouping on cockpitKey (lib/research/catalog-shell-logic.ts's
    // `computeAmbiguousDossierTopics` / `dossierGroupTestId`) — each category
    // now gets its OWN section, its OWN heading, and its OWN disambiguated
    // data-testid since "companies" is ambiguous in the us market.
    const creditRepair = page.getByTestId('dossier-credit-repair-companies');
    const debtRelief = page.getByTestId('dossier-debt-relief-companies');
    await expect(creditRepair).toBeVisible();
    await expect(debtRelief).toBeVisible();

    // Two separate sections with two distinct headings — never one heading
    // shared between both categories' products.
    await expect(creditRepair.getByRole('heading', { name: 'Best Credit Repair' })).toBeVisible();
    await expect(debtRelief.getByRole('heading', { name: 'Best Debt Relief Companies' })).toBeVisible();

    // No cross-topic leakage: a real, currently-qualifying debt-relief
    // product never renders inside the credit-repair section, and vice versa
    // (same real slugs the "key collision" storage test below already
    // relies on as currently-qualifying production data).
    await expect(creditRepair.getByRole('heading', { name: 'National Debt Relief' })).toHaveCount(0);
    await expect(debtRelief.getByRole('heading', { name: 'Credit Saint' })).toHaveCount(0);
  });

  test('default browse shows the featured winner + all nine cards', async ({ page }) => {
    const tradingDossier = page.getByTestId('dossier-trading-platforms');
    await expect(tradingDossier.getByText('#1 Overall')).toBeVisible();
    await expect(tradingDossier.locator('article')).toHaveCount(9);
  });

  test('search filters to matches and drops the featured pin', async ({ page }) => {
    const tradingDossier = page.getByTestId('dossier-trading-platforms');
    await page.getByPlaceholder(SEARCH).fill('schwab');
    await expect(page).toHaveURL(/[?&]q=schwab/);
    await expect(tradingDossier.locator('article')).toHaveCount(1);
    // Scoped like its siblings: searching "schwab" legitimately matches a SECOND
    // product now — the Cockpit-only, provisional Schwab entry in us/forex, which
    // is a distinct DiscoveryItem because category is part of a cockpit-only id
    // (spec §4.1). Page-wide, this assertion would fail on strict mode, not on a
    // defect. The trading dossier still holds exactly one match.
    await expect(tradingDossier.getByRole('heading', { name: 'Charles Schwab' })).toBeVisible();
    await expect(tradingDossier.getByText('#1 Overall')).toHaveCount(0); // featured suppressed
  });

  test('status filter narrows, and Reset restores the browse view', async ({ page }) => {
    const tradingDossier = page.getByTestId('dossier-trading-platforms');
    await page.getByRole('button', { name: 'In verification', exact: true }).click();
    await expect(page).toHaveURL(/status=provisional/);
    await expect(tradingDossier.locator('article')).toHaveCount(1);
    await expect(page.getByRole('heading', { name: 'eToro' })).toBeVisible();

    await page.getByRole('button', { name: 'Reset' }).click();
    await expect(page).toHaveURL(/\/research(\?)?$/);
    await expect(tradingDossier.getByText('#1 Overall')).toBeVisible(); // featured back
    await expect(tradingDossier.locator('article')).toHaveCount(9);
  });

  test('browser Back restores the search + filter state from the URL', async ({ page }) => {
    await page.getByPlaceholder(SEARCH).fill('fidelity');
    await expect(page).toHaveURL(/[?&]q=fidelity/);
    await page.getByRole('button', { name: 'Audited', exact: true }).click();
    await expect(page).toHaveURL(/status=audited/);

    await page.goBack();
    await expect(page).toHaveURL(/[?&]q=fidelity/);
    await expect(page).not.toHaveURL(/status=audited/);
    await expect(page.getByPlaceholder(SEARCH)).toHaveValue('fidelity');
  });

  test('shortlist enforces the max of four', async ({ page }) => {
    await shortlist(page, 4);
    await expect(page.getByText('4/4')).toBeVisible();
    // A fifth add is blocked — the remaining toggles are disabled.
    await expect(page.getByRole('button', { name: /shortlist full/i }).first()).toBeDisabled();
  });

  test('shortlist hands off to the Cockpit compare view and lands on #comparison', async ({ page }) => {
    await shortlist(page, 2);
    const bar = page.getByRole('region', { name: 'Research shortlist' });
    await expect(bar.getByText('2/4')).toBeVisible();
    await bar.getByRole('link', { name: /compare/i }).click();

    await expect(page).toHaveURL(/\/best\/trading-platforms\?.*compare=/);
    await expect(page).toHaveURL(/view=compare/);
    // Landed on the compare surface, not the hero, and the view is active.
    await expect(page.locator('#comparison')).toBeInViewport();
    await expect(page.getByText(/comparing/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test('shortlist survives the Cockpit round-trip via Back (sessionStorage)', async ({ page }) => {
    await shortlist(page, 2);
    // The exact v2 storage key already holds both slugs BEFORE the handoff —
    // proves persistence, not just the restore that follows.
    const beforeHandoff = await sessionStorageItem(page, TRADING_SCOPED_KEY);
    expect(beforeHandoff).not.toBeNull();
    expect(JSON.parse(beforeHandoff!)).toHaveLength(2);

    await page.getByRole('region', { name: 'Research shortlist' }).getByRole('link', { name: /compare/i }).click();
    await expect(page).toHaveURL(/view=compare/);

    await page.goBack();
    await dismissCookies(page);
    await expect(page.getByPlaceholder(SEARCH)).toBeVisible();
    // Restored from sessionStorage — two card toggles read as pressed again.
    // Scope by aria-pressed so the bar's chip-✕ buttons (which also say
    // "Remove … from shortlist" but carry no aria-pressed) don't inflate it.
    await expect(page.getByText('2/4')).toBeVisible();
    await expect(page.getByRole('button', { name: /shortlist/i, pressed: true })).toHaveCount(2);
    // And the exact v2 key + pointer are what actually drove that restore —
    // still holding the original two slugs, byte-for-byte.
    expect(await sessionStorageItem(page, TRADING_POINTER_KEY)).toBe('trading:trading-platforms');
    expect(await sessionStorageItem(page, TRADING_SCOPED_KEY)).toBe(beforeHandoff);
  });

  test('shortlist persists across a plain page reload (sessionStorage v2 key)', async ({ page }) => {
    await shortlist(page, 2);
    const stored = await sessionStorageItem(page, TRADING_SCOPED_KEY);
    expect(stored).not.toBeNull();
    expect(JSON.parse(stored!)).toHaveLength(2);

    await page.reload();
    await dismissCookies(page);
    await expect(page.getByPlaceholder(SEARCH)).toBeVisible();

    // Two pressed toggles restored, and the v2 Trading key is unchanged.
    await expect(page.getByText('2/4')).toBeVisible();
    await expect(page.getByRole('button', { name: /shortlist/i, pressed: true })).toHaveCount(2);
    expect(await sessionStorageItem(page, TRADING_POINTER_KEY)).toBe('trading:trading-platforms');
    expect(await sessionStorageItem(page, TRADING_SCOPED_KEY)).toBe(stored);
  });

  test('key collision: restoring one companies-topic scope leaves the other companies-topic scope untouched', async ({ page }) => {
    // us/credit-repair/companies and us/debt-relief/companies share the bare
    // topic string "companies" but are different Cockpit keys (spec §11.1) —
    // preseed BOTH v2 scoped keys, point the market pointer at credit-repair
    // only, and prove restoring it never reads or writes debt-relief's own
    // entry. Real, currently-qualifying product slugs (not test fixtures).
    const creditRepairValue = JSON.stringify(['credit-saint', 'sky-blue-credit']);
    const debtReliefValue = JSON.stringify(['national-debt-relief', 'accredited-debt-relief']);

    await page.addInitScript(
      ({ pointerKey, creditRepairKey, creditRepairValue, debtReliefKey, debtReliefValue }) => {
        window.sessionStorage.setItem(pointerKey, 'credit-repair:companies');
        window.sessionStorage.setItem(creditRepairKey, creditRepairValue);
        window.sessionStorage.setItem(debtReliefKey, debtReliefValue);
      },
      {
        pointerKey: TRADING_POINTER_KEY,
        creditRepairKey: CREDIT_REPAIR_SCOPED_KEY,
        creditRepairValue,
        debtReliefKey: DEBT_RELIEF_SCOPED_KEY,
        debtReliefValue,
      },
    );

    await gotoResearch(page);

    // The credit-repair scope actually restored: both its products read as
    // pressed. Located by exact accessible product name (not a dossier
    // testid) since "companies" is shared between the two topics — and
    // scoped by `pressed: true` (the card's own toggle carries aria-pressed;
    // the shortlist bar's chip-✕ button shares the same accessible name but
    // carries no aria-pressed, same collision the Back test above notes).
    await expect(
      page.getByRole('button', { name: 'Remove Credit Saint from shortlist', pressed: true }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Remove Sky Blue Credit from shortlist', pressed: true }),
    ).toBeVisible();

    // debt-relief's own storage entry is byte-identical to what was seeded —
    // restore only ever reads/writes the POINTER's own scope.
    expect(await sessionStorageItem(page, DEBT_RELIEF_SCOPED_KEY)).toBe(debtReliefValue);
    // And its products were never marked selected.
    await expect(
      page.getByRole('button', { name: /add national debt relief to shortlist/i }),
    ).toBeVisible();
  });

  test('scope switch: adding from another research topic is blocked behind a dialog until "Switch & add"', async ({
    page,
  }) => {
    const tradingDossier = page.getByTestId('dossier-trading-platforms');
    await tradingDossier.getByRole('button', { name: /add .+ to shortlist/i }).first().click();
    await expect(page.getByText('1/4')).toBeVisible();

    const beforeAttempt = await fullSessionStorageSnapshot(page);

    // robo-advisors is a DIFFERENT Cockpit topic (personal-finance, not
    // trading) that always renders on /research — first in
    // BEST_X_MANIFEST order, live with real qualifying products since
    // 2026-06-29. Adding from it must be blocked, not silently applied.
    const roboDossier = page.getByTestId('dossier-robo-advisors');
    await roboDossier.getByRole('button', { name: /add .+ to shortlist/i }).first().click();

    const dialog = page.getByRole('dialog', { name: 'Switch research topic' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('Shortlists compare within one research topic.')).toBeVisible();

    // Adversarial coverage, commit 5, case (c): the REACHABLE half of the
    // "open dialog -> wait -> cancel -> storage byte-identical" guarantee
    // (spec §11.3.1). The unavailable-scope half (a restored-but-
    // unverifiable active scope) has no live-data seam to reach in a real
    // e2e run today — see __tests__/unit/research-hub-integration.test.ts's
    // header comment for that investigation; it stays proven at the
    // pure-logic level in __tests__/unit/research-shortlist-ui-state.test.ts.
    // This IS the reachable half: an explicit wait with the dialog open,
    // proposing a cross-scope switch, before Cancel — a real timer tick with
    // nothing else happening. Before P1 fix ca48fb3 ("never touch storage
    // while a switch is only proposed"), pendingSwitch lived INSIDE the
    // reducer, so merely opening this dialog already changed `state` and
    // fired the unconditional persist effect (useEffect(..., [state,
    // market])) — waiting here doesn't change whether that reproduces, it
    // hardens against any FUTURE regression that reintroduces a delayed/
    // timer-driven persist path the immediate-assertion version wouldn't
    // catch.
    await page.waitForTimeout(600);

    // Cancel leaves storage byte-identical — the whole point of the dialog.
    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByText('1/4')).toBeVisible();
    expect(await fullSessionStorageSnapshot(page)).toEqual(beforeAttempt);

    // Retry, this time confirming: the old scope's key is gone, the new
    // scope's pointer + key are set for the newly-added robo-advisors slug.
    await roboDossier.getByRole('button', { name: /add .+ to shortlist/i }).first().click();
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Switch & add' }).click();
    await expect(dialog).toBeHidden();

    expect(await sessionStorageItem(page, TRADING_SCOPED_KEY)).toBeNull();
    expect(await sessionStorageItem(page, TRADING_POINTER_KEY)).toBe('personal-finance:robo-advisors');
    await expect(page.getByText('1/4')).toBeVisible();
    await expect(roboDossier.getByRole('button', { name: /shortlist/i, pressed: true })).toHaveCount(1);
  });

  test('the affiliate disclosure is never hidden behind the fixed shortlist bar', async ({ page }) => {
    await shortlist(page, 4);
    const disclosure = page.getByText(/advertising disclosure/i);
    await disclosure.scrollIntoViewIfNeeded();
    const bar = page.getByRole('region', { name: 'Research shortlist' });
    const dBox = await disclosure.boundingBox();
    const barBox = await bar.boundingBox();
    expect(dBox).not.toBeNull();
    expect(barBox).not.toBeNull();
    // Disclosure bottom sits ABOVE the fixed bar's top — not covered.
    expect(dBox!.y + dBox!.height).toBeLessThanOrEqual(barBox!.y + 1);
  });
});

// unified-research-discovery-pr2-hubs plan, Task 8 (Global Constraints:
// "Header and market switcher must work at 1024, 1100, and 1280 pixels") —
// 1024px is the Tailwind `lg` breakpoint (components/marketing/header.tsx's
// desktop nav is `hidden lg:flex`), the exact width where the desktop
// Research link and market switcher first appear; 1100/1280 prove the gap
// holds as the viewport grows. Needs real hydration (javaScriptEnabled,
// already set file-wide above) — the header renders as the 'us' market
// until it mounts (see research-hub-markets.spec.ts's own note on this).
test.describe('Research hub header — responsive breakpoints', () => {
  for (const width of [1024, 1100, 1280]) {
    test(`at ${width}px the Research link and market switcher are both visible and never overlap`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/research');
      await dismissCookies(page);

      const researchLink = page.getByRole('link', { name: 'Research', exact: true });
      const marketSwitcher = page.getByRole('button', { name: /United States/i });
      await expect(researchLink).toBeVisible();
      await expect(marketSwitcher).toBeVisible();

      const researchBox = await researchLink.boundingBox();
      const switcherBox = await marketSwitcher.boundingBox();
      expect(researchBox, `Research link has no bounding box at ${width}px`).not.toBeNull();
      expect(switcherBox, `market switcher has no bounding box at ${width}px`).not.toBeNull();

      // The desktop nav reads left-to-right (nav groups -> Research ->
      // market switcher -> Get Started), so the Research link's right edge
      // must sit at or before the market switcher's left edge — no overlap.
      expect(
        researchBox!.x + researchBox!.width,
        `Research link overlaps the market switcher at ${width}px`,
      ).toBeLessThanOrEqual(switcherBox!.x + 1);
    });
  }
});

test.describe('Research Library shell — mobile', () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test.beforeEach(async ({ page }) => gotoResearch(page));

  test('the search field sits within the first viewport', async ({ page }) => {
    await expect(page.getByPlaceholder(SEARCH)).toBeInViewport();
  });

  test('the shortlist bar is a compact action bar with an Edit sheet', async ({ page }) => {
    await shortlist(page, 2);
    const bar = page.getByRole('region', { name: 'Research shortlist' });
    // Compact: Edit button present (mobile), the compare CTA reachable in-viewport.
    await expect(bar.getByRole('button', { name: 'Edit' })).toBeVisible();
    await expect(bar.getByRole('link', { name: /compare/i })).toBeInViewport();
    // Edit reveals the names sheet (the desktop chip row is display:none on
    // mobile, so scope to the first — the visible sheet chip).
    await bar.getByRole('button', { name: 'Edit' }).click();
    await expect(bar.getByText('Fidelity').first()).toBeVisible();
    await expect(bar.getByRole('button', { name: 'Done' })).toBeVisible();
  });
});
