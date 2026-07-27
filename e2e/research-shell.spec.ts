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

/** Add the first N not-yet-shortlisted products. */
async function shortlist(page: Page, n: number) {
  for (let i = 0; i < n; i++) {
    await page.getByRole('button', { name: /add .+ to shortlist/i }).first().click();
  }
}

test.describe('Research Library shell — desktop', () => {
  test.beforeEach(async ({ page }) => gotoResearch(page));

  test('default browse shows the featured winner + all nine cards', async ({ page }) => {
    await expect(page.getByText('#1 Overall')).toBeVisible();
    await expect(page.locator('section article')).toHaveCount(9);
  });

  test('search filters to matches and drops the featured pin', async ({ page }) => {
    await page.getByPlaceholder(SEARCH).fill('schwab');
    await expect(page).toHaveURL(/[?&]q=schwab/);
    await expect(page.locator('section article')).toHaveCount(1);
    await expect(page.getByRole('heading', { name: 'Charles Schwab' })).toBeVisible();
    await expect(page.getByText('#1 Overall')).toHaveCount(0); // featured suppressed
  });

  test('status filter narrows, and Reset restores the browse view', async ({ page }) => {
    await page.getByRole('button', { name: 'In verification', exact: true }).click();
    await expect(page).toHaveURL(/status=provisional/);
    await expect(page.locator('section article')).toHaveCount(1);
    await expect(page.getByRole('heading', { name: 'eToro' })).toBeVisible();

    await page.getByRole('button', { name: 'Reset' }).click();
    await expect(page).toHaveURL(/\/research(\?)?$/);
    await expect(page.getByText('#1 Overall')).toBeVisible(); // featured back
    await expect(page.locator('section article')).toHaveCount(9);
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
