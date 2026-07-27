// e2e/research-a11y.spec.ts
// The two acceptance gates from the plan's DoD (§13) that had no
// implementation: WCAG 2.2 AA on /research, and the LCP / CLS budget.
//
// Run against a PRODUCTION server (`next start`), never `next dev` — dev ships
// unminified bundles and an overlay that make the layout-shift and paint
// numbers meaningless, and its Suspense/Back behaviour produces false failures
// (see research-shell.spec.ts).
//
//   BASE_URL=http://localhost:3012 npx playwright test e2e/research-a11y.spec.ts
//
// AXE VERSION IS PINNED (package.json: "axe-core": "4.11.1", exact, not ^).
// Axe adds and tightens rules between minor versions, so a floating range
// would let an unrelated `npm update` turn this gate red — or, worse, green.
//
// PERFORMANCE SCOPE, stated plainly: this measures LCP and CLS in the lab with
// PerformanceObserver, which is what the DoD's two numeric budgets need. It is
// NOT a Lighthouse run and does not produce a Lighthouse score — adding
// Lighthouse would pull chrome-launcher and its tree into a node_modules that
// is symlinked into the main repo. INP is deliberately absent: it needs real
// interaction latency under real conditions and is measured post-deploy via
// RUM, exactly as the DoD says.

import { test, expect, type Page } from '@playwright/test';

// Plain `require.resolve`, deliberately: the package has no "type": "module",
// so Playwright transpiles this spec to CommonJS where `require` exists. Using
// `createRequire(import.meta.url)` instead makes esbuild treat the file as ESM
// and it dies at import time with "require is not defined in ES module scope".
const AXE_PATH = require.resolve('axe-core/axe.min.js');

test.use({ javaScriptEnabled: true });

/** WCAG 2.2 AA — the level the DoD commits to, and nothing above it. */
const WCAG_AA_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

const SEARCH = 'Search platforms…';

interface AxeViolation {
  id: string;
  impact: string | null;
  help: string;
  nodes: Array<{ target: string[]; failureSummary?: string }>;
}

/**
 * The cookie banner is pre-answered rather than clicked away. Clicking it is a
 * race (it mounts after hydration), and its markup is a shared sitewide
 * component — auditing it here would report other people's findings as this
 * slice's. Returning visitors see exactly this state.
 */
async function gotoResearch(page: Page) {
  await page.addInitScript(() => {
    try {
      window.localStorage.setItem('cookie-consent', 'essential');
    } catch {
      /* storage blocked — the banner shows, and axe audits it too. Acceptable. */
    }
  });
  await page.goto('/research');
  // unified-research-discovery-pr2-hubs plan, Task 3: the hub's a11y/CWV
  // surface is the server-rendered browse fallback, which carries the
  // crawlability load and must be auditable on its own — never gated on the
  // client shell (`ResearchHub`, Task 4) that later layers search/filters on
  // top of it. Waiting on the search placeholder here made every a11y/CWV
  // test in this file depend on UI this task doesn't deliver; wait on the
  // landmark + the first rendered catalog/dossier card instead (known-red
  // audits/reports/research-discovery-pr2-known-red.md, #18/#19/#21).
  await expect(page.locator('main')).toBeVisible();
  await expect(page.locator('main article').first()).toBeVisible();
}

async function analyze(page: Page): Promise<AxeViolation[]> {
  // Freeze transitions before measuring. The shortlist buttons animate their
  // background (transition-colors), and axe sampling mid-transition reads the
  // half-blended colour — it reported a 2.45:1 failure for a state that exists
  // for ~150ms and never as a resting colour. Contrast is a property of the
  // settled UI, so the settled UI is what gets audited.
  await page.addStyleTag({
    content: '*, *::before, *::after { transition: none !important; animation: none !important; }',
  });
  await page.addScriptTag({ path: AXE_PATH });
  return page.evaluate(async (tags) => {
    // @ts-expect-error — axe is injected into the page, not bundled.
    const results = await window.axe.run(document, {
      runOnly: { type: 'tag', values: tags },
      // Colour contrast needs real painted pixels; it works here because we
      // run against a production build with the real stylesheet.
      resultTypes: ['violations'],
    });
    // Every node, not a sample: truncating here once hid three failing
    // elements behind the first three, and each fix appeared to uncover a
    // "new" violation that had been there the whole time.
    return results.violations.map((v: AxeViolation) => ({
      id: v.id,
      impact: v.impact,
      help: v.help,
      nodes: v.nodes.map((n) => ({
        target: n.target,
        failureSummary: n.failureSummary,
      })),
    }));
  }, WCAG_AA_TAGS);
}

/** Readable failure output — an array of raw axe objects is unusable in CI logs. */
function format(violations: AxeViolation[]): string {
  return violations
    .map(
      (v) =>
        `\n  [${v.impact ?? 'unknown'}] ${v.id} — ${v.help} (${v.nodes.length} element(s))\n` +
        v.nodes.map((n) => `      at ${n.target.join(' ')}`).join('\n'),
    )
    .join('');
}

test.describe('Research Library — WCAG 2.2 AA', () => {
  test('the default browse view has no violations (desktop)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await gotoResearch(page);

    const violations = await analyze(page);
    expect(violations, `axe found ${violations.length} violation(s):${format(violations)}`).toEqual([]);
  });

  test('the default browse view has no violations (390px)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoResearch(page);

    const violations = await analyze(page);
    expect(violations, `axe found ${violations.length} violation(s):${format(violations)}`).toEqual([]);
  });

  /**
   * The states the static scan cannot reach: a filter is applied (the featured
   * dossier is gone, the live region has announced a count) and the fixed
   * shortlist bar is mounted with two products. This is where the a11y work in
   * the shell actually lives — aria-live, the disabled-toggle title, the Edit
   * sheet — so a scan that only ever sees the landing state proves little.
   */
  test('filtered + shortlisted state has no violations', async ({ page }) => {
    // Genuinely needs the client shell (search + shortlist toggles), which
    // Task 4/5 deliver — stays assigned there per the known-red baseline
    // (audits/reports/research-discovery-pr2-known-red.md, #20). Decoupling
    // this file's gotoResearch() from the search placeholder (Task 3) would
    // otherwise turn this test red for a NEW reason (a `.fill()` timeout on
    // a field that doesn't exist yet) instead of the allowlisted one, so it
    // is explicitly parked here rather than left to fail differently.
    test.fixme(true, 'Needs the Task 4 client shell (search field) — known-red #20');

    await page.setViewportSize({ width: 1280, height: 800 });
    await gotoResearch(page);

    await page.getByPlaceholder(SEARCH).fill('trading');
    await page.getByRole('button', { name: /add .+ to shortlist/i }).first().click();
    await page.getByRole('button', { name: /add .+ to shortlist/i }).first().click();
    // The compare CTA appears at >= 2 — proof the bar is really mounted before
    // we audit it, instead of a bare timeout.
    await expect(page.getByRole('link', { name: /compare/i }).last()).toBeVisible();

    const violations = await analyze(page);
    expect(violations, `axe found ${violations.length} violation(s):${format(violations)}`).toEqual([]);
  });
});

test.describe('Research Library — Core Web Vitals budget (lab)', () => {
  test('LCP is under 2.5s and CLS under 0.1', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    // The observers must exist BEFORE navigation: LCP and layout-shift entries
    // are emitted during the first paint, and a buffered read after the fact
    // misses shifts that happened while the observer was not registered.
    await page.addInitScript(() => {
      const w = window as unknown as { __lcp: number; __cls: number };
      w.__lcp = 0;
      w.__cls = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) w.__lcp = entry.startTime;
      }).observe({ type: 'largest-contentful-paint', buffered: true });
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const shift = entry as PerformanceEntry & { value: number; hadRecentInput: boolean };
          // Shifts caused by the user's own interaction are excluded by
          // definition — the metric is about unexpected movement.
          if (!shift.hadRecentInput) w.__cls += shift.value;
        }
      }).observe({ type: 'layout-shift', buffered: true });
    });

    await gotoResearch(page);
    await page.waitForLoadState('networkidle');
    // Late-arriving images are the classic CLS source; give them room to land
    // and be counted rather than reporting an optimistically early number.
    await page.waitForTimeout(2000);

    const { lcp, cls } = await page.evaluate(() => {
      const w = window as unknown as { __lcp: number; __cls: number };
      return { lcp: w.__lcp, cls: w.__cls };
    });

    // A zero LCP means no candidate was ever reported — that is a broken
    // measurement, not a fast page, and must not pass as one.
    expect(lcp, 'no LCP candidate was observed — the measurement is invalid').toBeGreaterThan(0);
    expect(lcp, `LCP ${Math.round(lcp)}ms exceeds the 2500ms budget`).toBeLessThan(2500);
    expect(cls, `CLS ${cls.toFixed(4)} exceeds the 0.1 budget`).toBeLessThan(0.1);

    console.log(`  /research lab vitals — LCP ${Math.round(lcp)}ms · CLS ${cls.toFixed(4)}`);
  });
});
