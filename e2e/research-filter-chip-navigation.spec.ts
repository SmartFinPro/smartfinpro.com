// e2e/research-filter-chip-navigation.spec.ts
// Regression guard for the dropped filter-chip navigation on /research.
//
// SYMPTOM this pins: a filter chip clicked in the first ~100–200 ms after the
// App Router mounts does nothing at all — `aria-pressed` never flips, the URL
// never changes, and it never recovers (a second click is lost too). It is not
// a hydration/attachment problem: the click reaches the right <button>, the
// React onClick runs (the research_filter_change event goes out on the wire)
// and the navigation's own RSC request is issued and answered 200 — but the
// App Router never commits the new canonical URL, so `useSearchParams()` never
// changes and the whole hub stays on the unfiltered view.
//
// ROOT CAUSE: `router.push()` called synchronously from inside the chip's
// discrete click handler is dropped by the Next 16 App Router when it lands in
// that window. Issuing the same push one task later (see `applyFacet` in
// components/research/ResearchHub.tsx) is not affected.
//
// WHY A LOOP: the defect is a race, not a deterministic failure. Measured on a
// production build (`next start`), one worker: 10 lost navigations in 111
// clicks (9.0%) with the synchronous push, 0 in 111 with the deferred push
// (identical click timing, p50 121 ms after the router mounted). A single
// click would therefore be green ~91% of the time even with the bug present.
// The loop below turns that per-click rate into a near-certain signal
// (1 - 0.91^60 ≈ 99.7%) WITHOUT making the assertion itself statistical: the
// test fails on the FIRST dropped navigation, and reports the iteration.
//
// NOTE ON MACHINE SPEED: the window is only reachable while the chip can be
// clicked within ~200 ms of the router mounting. On a heavily loaded or slow
// machine every click lands after the window and this test cannot fail even
// with the bug reintroduced — it is a stress guard, not a proof of absence.
// The recorded click delay is printed so a green run can be judged.
//
// Run:  BASE_URL=http://localhost:3111 npx playwright test \
//         e2e/research-filter-chip-navigation.spec.ts --workers=1

import { test, expect, type Page } from "@playwright/test";

const SEARCH = "Search platforms…";
const ITERATIONS = Number(process.env.CHIP_NAV_ITERATIONS || 60);

const CHIPS: Array<{ name: string; url: RegExp }> = [
  { name: "Dossiers", url: /[?&]type=dossier/ },
  { name: "In verification", url: /status=provisional/ },
  { name: "Trading Platforms", url: /[?&]category=trading/ },
];

test.describe("Research hub filter chips", () => {
  test.use({ javaScriptEnabled: true });

  test("a filter chip clicked the moment the hub is interactive always navigates", async ({
    browser,
  }) => {
    test.setTimeout(0);

    // A FRESH CONTEXT PER ITERATION, exactly like every other spec in this
    // suite gets. This is load-bearing, not hygiene: reusing one page warms
    // the HTTP cache, the hub then paints so early that the click lands ~85 ms
    // after the router mounts — BELOW the defect's window — and the test can
    // no longer fail even with the bug present.
    const seed = async (page: Page) => {
      await page.addInitScript(() => {
        try {
          localStorage.setItem("cookie-consent", "essential");
        } catch {
          /* storage blocked */
        }
        (window as any).__routerMountedAt = null;
        const rs = history.replaceState;
        history.replaceState = function (this: any, ...a: any[]) {
          if ((window as any).__routerMountedAt === null) {
            (window as any).__routerMountedAt = performance.now();
          }
          return (rs as any).apply(this, a);
        } as any;
      });
    };

    const delays: number[] = [];

    for (let i = 0; i < ITERATIONS; i += 1) {
      const chip = CHIPS[i % CHIPS.length];
      const context = await browser.newContext({
        javaScriptEnabled: true,
        baseURL: process.env.BASE_URL || "http://localhost:3000",
      });
      const page = await context.newPage();
      await seed(page);
      await page.goto("/research");
      await expect(page.getByPlaceholder(SEARCH)).toBeVisible();
      await expect(
        page.locator('[data-testid="research-result-count"]'),
      ).toContainText(/result/i);

      const button = page.getByRole("button", { name: chip.name, exact: true });
      await button.click();

      delays.push(
        await page.evaluate(() => {
          const mounted = (window as any).__routerMountedAt;
          return mounted === null
            ? -1
            : Math.round(performance.now() - mounted);
        }),
      );

      // The chip must both report itself as active and have moved the URL.
      // Asserting only the URL would let a half-applied filter through; the
      // pressed state is what the user actually sees.
      try {
        await expect(
          page,
          `iteration ${i} (${chip.name}): the chip click was dropped — URL never changed`,
        ).toHaveURL(chip.url);
        await expect(
          button,
          `iteration ${i} (${chip.name}): chip never became pressed`,
        ).toHaveAttribute("aria-pressed", "true");
      } finally {
        await context.close();
      }
    }

    delays.sort((a, b) => a - b);
    console.log(
      `[chip-nav] ${ITERATIONS} clicks, click delay after router mount: ` +
        `p10=${delays[Math.floor(0.1 * (delays.length - 1))]}ms ` +
        `p50=${delays[Math.floor(0.5 * (delays.length - 1))]}ms ` +
        `p90=${delays[Math.floor(0.9 * (delays.length - 1))]}ms ` +
        `(the defect's window is ~100-200ms; a run whose p50 is far above that ` +
        `could not have caught it)`,
    );
  });
});
