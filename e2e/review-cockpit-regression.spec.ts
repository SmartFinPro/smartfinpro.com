// e2e/review-cockpit-regression.spec.ts
// Cheap structural regression net for the two surfaces the Research Library
// funnels INTO — the review pages and the Comparison Cockpit. The Research
// Library work touches shared plumbing (/api/track, lib/validation, the
// research shell), so a fast "are Review and Cockpit still intact?" check is
// worth more than any single deep assertion.
//
// Deliberately SEMANTIC, not pixel-based: no golden-image snapshots are
// introduced here (there is no such system in this repo, and pixel baselines
// rot on every copy tweak). Screenshots are written as REVIEW ARTIFACTS under
// test-results/ (gitignored) for manual evidence — never asserted against.
//
// Run against a PRODUCTION server (`next start`), not `next dev`:
//   npx next start -p 3016
//   BASE_URL=http://localhost:3016 npx playwright test e2e/review-cockpit-regression.spec.ts
// Dev-mode Suspense/Back behaviour differs enough to produce false failures
// (see research-shell.spec.ts's Back/sessionStorage case).

import { test, expect, type Page, type TestInfo } from '@playwright/test';

// A review still on the classic ReportLayout. Fidelity held this slot until it
// was migrated to V2 (2026-07-26). Whichever page sits here, the assertions
// below are structural rather than brand-specific, so the next migration only
// needs this constant repointed — not the test rewritten.
const V1_REVIEW = '/us/trading/robinhood-review';  // classic ReportLayout review
const V2_REVIEW = '/us/trading/etoro-review';      // reviewLayout: 'v2'
const COCKPIT = '/us/trading/best/trading-platforms';
const COMPARE_SLUGS = ['fidelity', 'charles-schwab'];
const COMPARE_URL = `${COCKPIT}?compare=${COMPARE_SLUGS.join(',')}&view=compare#comparison`;

/**
 * Console messages this suite tolerates — each one narrowly matched and
 * labelled with WHY, so a real fault can never hide behind a vague filter.
 * `environment` = artifact of running the production bundle on a local port.
 * `known-defect` = a real, pre-existing product issue that is tracked
 * separately; allowlisted only so this net is usable as a gate today.
 * Suppressed entries are annotated onto the test report, never dropped
 * silently (see assertNoClientErrors).
 */
const ENVIRONMENT_NOISE: Array<{ kind: 'environment' | 'known-defect'; pattern: RegExp; why: string }> = [
  {
    kind: 'environment',
    // Wildcards are only valid as the LEFTMOST label, so the browser discards
    // this token. Pre-existing in next.config.ts and identical in production —
    // it means Sentry's connect-src entry is inert, which is a config issue of
    // its own, not a regression of the page under test. Tracked separately.
    pattern: /invalid source: 'https:\/\/o\*\.ingest\.sentry\.io'/,
    why: 'Invalid CSP token in next.config.ts (pre-existing, tracked separately)',
  },
  {
    kind: 'environment',
    // NEXT_PUBLIC_SITE_URL is baked in at build time (localhost:3000 here)
    // while this server listens on another port, so a same-origin request
    // reads as cross-origin against connect-src 'self'. In production the site
    // URL and the serving origin are the same host, so this cannot occur.
    pattern: /Connecting to 'http:\/\/localhost:\d+\/?' violates the following Content Security Policy/,
    why: 'Local port mismatch vs build-time NEXT_PUBLIC_SITE_URL',
  },
  {
    kind: 'known-defect',
    // Next's router PREFETCHES <Link href="/go/[slug]">, so merely viewing a
    // review page issues GET /go/<slug>?_rsc=… with `next-router-prefetch: 1`.
    // The route has no prefetch guard (bot gate → IP block → rate limit →
    // trackClick), so the redirect is produced — and the browser's attempt to
    // FOLLOW it to the affiliate destination is what this CSP connect-src
    // violation is. The visible console error is the harmless half; the
    // consequential half is that a click can be recorded without a user ever
    // clicking. Reported separately — do NOT "fix" it by widening the CSP.
    pattern: /Connecting to 'https:\/\/[^']*[?&]subid=[^']*' violates the following Content Security Policy/,
    why: 'Affiliate destination followed after a Next prefetch of /go/[slug] (known defect, tracked separately)',
  },
];

/**
 * Failing sub-requests that are EXPECTED, each with the reason it is expected.
 * Everything else fails the test — a page that quietly 404s its own assets is
 * exactly the regression this net exists to catch.
 */
const EXPECTED_REQUEST_FAILURES: Array<{ match: (url: string, status: number) => boolean; why: string }> = [
  {
    // KNOWN PRODUCT DEFECT, pre-existing and unrelated to this branch: the
    // review "Platform Evidence & Screenshots" sections reference 41 evidence
    // image folders under public/images/evidence/, of which only revolut-au
    // actually exists — so /_next/image 400s ("not a valid image") on ~40
    // review pages. Allowlisted so this net is usable NOW, and reported
    // separately rather than silently swallowed.
    match: (url, status) => status === 400 && /_next\/image\?url=%2Fimages%2Fevidence%2F/.test(url),
    why: 'Missing evidence screenshots (known content defect, tracked separately)',
  },
  {
    // BY DESIGN: /go/[slug] answers bot user-agents with a silent 403, and
    // headless Chromium's UA is treated as a bot. Next's RSC prefetch of the
    // CTA therefore 403s in tests while real users redirect normally.
    match: (url, status) => status === 403 && /\/go\//.test(url),
    why: 'Affiliate route bot gate vs headless UA (intentional)',
  },
];

interface ClientFaults {
  console: string[];
  responses: Array<{ url: string; status: number }>;
}

/** Console/page errors and failing sub-requests seen during a test. */
function collectErrors(page: Page): ClientFaults {
  const faults: ClientFaults = { console: [], responses: [] };
  page.on('console', (msg) => {
    if (msg.type() === 'error') faults.console.push(`console: ${msg.text()}`);
  });
  page.on('pageerror', (err) => faults.console.push(`pageerror: ${err.message}`));
  page.on('response', (res) => {
    if (res.status() >= 400) faults.responses.push({ url: res.url(), status: res.status() });
  });
  return faults;
}

/**
 * Fails on any client-side fault that isn't explicitly justified above, and
 * records the suppressed ones on the test so they stay visible in the report.
 */
async function assertNoClientErrors(faults: ClientFaults, testInfo: TestInfo, where: string) {
  const isNoise = (e: string) =>
    ENVIRONMENT_NOISE.some((n) => n.pattern.test(e)) ||
    // A failed sub-request also emits this generic console line; the response
    // assertion below judges those precisely, by URL and status.
    /Failed to load resource: the server responded with a status of/.test(e);

  const realConsole = faults.console.filter((e) => !isNoise(e));
  const realResponses = faults.responses.filter(
    (r) => !EXPECTED_REQUEST_FAILURES.some((k) => k.match(r.url, r.status)),
  );

  const suppressed = faults.console.length - realConsole.length + (faults.responses.length - realResponses.length);
  if (suppressed > 0) {
    testInfo.annotations.push({
      type: 'suppressed-known-issue',
      description: `${suppressed} documented message(s)/request failure(s) on ${where}`,
    });
  }

  expect(realConsole, `unexpected client errors on ${where}`).toEqual([]);
  expect(realResponses, `unexpected failing requests on ${where}`).toEqual([]);
}

/**
 * The affiliate CTA the page actually offers a user. These templates render
 * several responsive variants of the same link (sticky bar, sidebar, inline),
 * of which only some are displayed at a given viewport — so the contract is
 * "at least one VISIBLE cloaked CTA", not "the first one in the DOM".
 */
function visibleAffiliateCta(page: Page, slug: string) {
  return page.locator(`a[href^="/go/${slug}"]:visible`);
}

/** Pre-seed the consent decision so the fixed banner never intercepts a click. */
async function seedCookieConsent(page: Page) {
  await page.addInitScript(() => {
    try {
      localStorage.setItem('cookie-consent', 'essential');
    } catch {
      /* storage blocked — banner renders, assertions below don't depend on it */
    }
  });
}

/**
 * React 19 reveals streamed Suspense boundaries via requestAnimationFrame,
 * which can stall in headless/backgrounded contexts — the cockpit then sits in
 * a hidden <div id="S:n"> forever. Same nudge as cockpit-tracking.spec.ts.
 */
async function revealCockpit(page: Page): Promise<void> {
  await page.waitForFunction(() => !!document.querySelector('.ck-root'), undefined, { timeout: 20_000 });
  await page.evaluate(() => {
    const w = window as unknown as { $RB?: unknown[]; $RV?: (b: unknown[]) => void };
    try {
      if (w.$RB && w.$RB.length && typeof w.$RV === 'function') w.$RV(w.$RB);
    } catch {
      /* already revealed */
    }
  });
  await page.waitForSelector('.ck-root', { state: 'visible', timeout: 10_000 });
}

/** Canonical is asserted by PATH: the host comes from NEXT_PUBLIC_SITE_URL and
 *  legitimately differs per environment, the path is the actual contract. */
async function expectCanonicalPath(page: Page, expectedPath: string) {
  const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
  expect(canonical, 'canonical link is present').toBeTruthy();
  expect(new URL(canonical!).pathname.replace(/\/$/, '')).toBe(expectedPath);
}

/** Writes a screenshot as a manual-review artifact and attaches it to the report. */
async function evidence(page: Page, testInfo: TestInfo, name: string) {
  const path = testInfo.outputPath(`${name}.png`);
  await page.screenshot({ path, fullPage: true });
  await testInfo.attach(name, { path, contentType: 'image/png' });
}

test.describe('Review + Cockpit structural regression', () => {
  // These pages are interactive React surfaces — the global config's
  // javaScriptEnabled:false (for redirect specs) would test the wrong thing.
  test.use({ javaScriptEnabled: true });

  test('V1 review renders intact: one H1, verdict section, affiliate CTA, canonical', async ({ page }, testInfo) => {
    const faults = collectErrors(page);
    await seedCookieConsent(page);

    const response = await page.goto(V1_REVIEW);
    expect(response?.status()).toBe(200);

    await expect(page.locator('h1')).toHaveCount(1);
    // Structural proof this really is the V1 template: the V2 layout wraps its
    // MDX body in .review-v2-prose, so its absence is what distinguishes the
    // two. Asserting a brand-specific heading here is what tied this test to
    // Fidelity and broke it on migration.
    await expect(page.locator('.review-v2-prose')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: /frequently asked questions/i }).first()).toBeVisible();
    // The money path: at least one cloaked affiliate CTA (never a raw URL).
    await expect(visibleAffiliateCta(page, 'robinhood').first()).toBeVisible();

    await expectCanonicalPath(page, V1_REVIEW);
    await evidence(page, testInfo, 'v1-review-desktop');
    await assertNoClientErrors(faults, testInfo, V1_REVIEW);
  });

  test('V2 eToro review renders intact and states the corrected $50 minimum deposit', async ({ page }, testInfo) => {
    const faults = collectErrors(page);
    await seedCookieConsent(page);

    const response = await page.goto(V2_REVIEW);
    expect(response?.status()).toBe(200);

    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toContainText('eToro');
    // V2's own central sections (the V1 "Quick Verdict" block does not exist here).
    await expect(page.getByRole('heading', { name: 'Final Decision', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Methodology', exact: true }).first()).toBeVisible();
    await expect(visibleAffiliateCta(page, 'etoro').first()).toBeVisible();
    await expectCanonicalPath(page, V2_REVIEW);

    // The T0b audit correction (commit 6dca24b): the minimum FIRST deposit is
    // $50, not the pre-audit $100.
    const body = await page.locator('body').innerText();
    expect(body).toMatch(/\$50 (minimum|across)/);
    // Guarded against the legitimate "$100,000 demo account" copy: only a
    // "$100 minimum/first deposit" claim is the stale one.
    expect(body).not.toMatch(/\$100\s+(minimum|first deposit)/i);
    expect(body).not.toMatch(/minimum (first )?deposit[^.]{0,20}\$100(?!,)/i);

    await evidence(page, testInfo, 'v2-etoro-review-desktop');
    await assertNoClientErrors(faults, testInfo, V2_REVIEW);
  });

  test('Cockpit browse state is intact', async ({ page }, testInfo) => {
    const faults = collectErrors(page);
    await seedCookieConsent(page);

    const response = await page.goto(COCKPIT);
    expect(response?.status()).toBe(200);
    await revealCockpit(page);

    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toContainText(/best trading platforms/i);
    await expect(page.locator('.ck-root')).toBeVisible();
    // Products actually rendered — not an empty shell after a data change.
    await expect(page.getByText('Fidelity').first()).toBeVisible();
    await expect(page.getByText('Charles Schwab').first()).toBeVisible();
    await expectCanonicalPath(page, COCKPIT);

    await evidence(page, testInfo, 'cockpit-browse-desktop');
    await assertNoClientErrors(faults, testInfo, COCKPIT);
  });

  // PENDING IN THIS BRANCH, not broken. This spec was written on
  // feat/research-library-pilot (commit 8640a59) and ported here for the
  // 2026-07-25 design-audit work; the `#comparison` anchor it asserts is part
  // of the cockpit compare work that lands with that branch and does not exist
  // on design/review-v2-premium yet (verified: the served HTML contains no
  // id="comparison"). Left as fixme rather than deleted, so it re-arms by
  // itself once the branches meet — and shows as pending rather than passing.
  test.fixme('Cockpit compare deep-link selects both slugs, shows the comparison and lands on the anchor', async ({ page }, testInfo) => {
    const faults = collectErrors(page);
    await seedCookieConsent(page);

    const response = await page.goto(COMPARE_URL);
    expect(response?.status()).toBe(200);
    await revealCockpit(page);

    // This is the exact contract the Research Library's handoff URL relies on
    // (buildCompareUrl → ?compare=a,b&view=compare#comparison).
    const comparison = page.locator('#comparison');
    await expect(comparison).toBeVisible();
    await expect(comparison).toBeInViewport();
    await expect(page.getByText(/comparing/i).first()).toBeVisible({ timeout: 10_000 });

    // Both requested products are in the comparison surface — and only those.
    for (const name of ['Fidelity', 'Charles Schwab']) {
      await expect(comparison.getByText(name).first()).toBeVisible();
    }

    await evidence(page, testInfo, 'cockpit-compare-desktop');
    await assertNoClientErrors(faults, testInfo, COMPARE_URL);
  });
});

test.describe('Review + Cockpit — mobile evidence', () => {
  test.use({ javaScriptEnabled: true, viewport: { width: 390, height: 844 } });

  test('mobile renders without client errors (screenshots for manual review)', async ({ page }, testInfo) => {
    const faults = collectErrors(page);
    await seedCookieConsent(page);

    for (const [name, url] of [
      ['v1-review', V1_REVIEW],
      ['v2-etoro-review', V2_REVIEW],
      ['cockpit-browse', COCKPIT],
      ['cockpit-compare', COMPARE_URL],
    ] as const) {
      const response = await page.goto(url);
      expect(response?.status(), `${url} status`).toBe(200);
      await expect(page.locator('h1')).toHaveCount(1);
      await evidence(page, testInfo, `${name}-mobile`);
    }

    await assertNoClientErrors(faults, testInfo, 'the mobile pass');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Design-audit regressions (2026-07-25)
//
// Four fixes that are each a single className or a single JSX position — the
// kind of change that vanishes in a diff and silently undoes a measured
// result. Every number below was measured on the built page BEFORE the fix and
// is quoted at its assertion. See the plan file
// bitte-den-fix-planen-gleaming-elephant.md for the full derivation.
// ─────────────────────────────────────────────────────────────────────────────

/** Links styled as a primary CTA — the gold "compare" and blue "visit" buttons. */
const CTA_SELECTOR =
  'a[class*="bg-[var(--sfp-gold)]"], a[class*="bg-[var(--sfp-blue-bright)]"]';

/** How many CTAs are inside the viewport right now. */
async function visibleCtaCount(page: Page): Promise<number> {
  return page.evaluate((selector) => {
    const h = window.innerHeight;
    return Array.from(document.querySelectorAll(selector)).filter((el) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return false;
      return r.bottom > 0 && r.top < h;
    }).length;
  }, CTA_SELECTOR);
}

test.describe('V2 review — design-audit regressions', () => {
  test.use({ javaScriptEnabled: true });

  test('exactly one main landmark, one #main-content and one skip link', async ({ page }) => {
    // Before: the route rendered its own <main id="main-content"> INSIDE the
    // one MarketingLayout already provides, so both the element and the id
    // were duplicated and the skip link's target was undefined. The header
    // carried a second skip link on top of the layout's.
    await seedCookieConsent(page);
    await page.goto(V2_REVIEW);

    const counts = await page.evaluate(() => ({
      main: document.querySelectorAll('main').length,
      mainContentId: document.querySelectorAll('#main-content, [id="main-content"]').length,
      skipLinks: document.querySelectorAll('a[href="#main-content"]').length,
    }));
    expect(counts).toEqual({ main: 1, mainContentId: 1, skipLinks: 1 });
  });

  test('no horizontal overflow at any width — 1024px in particular', async ({ page }) => {
    // Before: scrollWidth 1070 against clientWidth 1024 (46px of sideways
    // scroll), because `lg:grid-cols-[760px_300px] lg:gap-14` demanded 1116px
    // inside a container offering 992px of content width at `lg`.
    await seedCookieConsent(page);
    await page.goto(V2_REVIEW);

    for (const width of [320, 390, 768, 1024, 1280, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.waitForTimeout(120);

      // The ARTICLE is what this layout owns, and it is asserted at every
      // width. Elements inside a deliberately scrollable container (the
      // section nav) are excluded — that one scrolls on purpose.
      const worst = await page.evaluate(() => {
        const W = document.documentElement.clientWidth;
        const article = document.querySelector('article');
        if (!article) return { overflow: -1, culprit: 'no <article>' };
        let overflow = 0;
        let culprit = 'none';
        for (const el of article.querySelectorAll('*')) {
          const box = el.getBoundingClientRect();
          if (box.right <= W + 0.5 || box.width <= 8) continue;
          let scrollable = false;
          for (let p: Element | null = el; p && p !== article; p = p.parentElement) {
            const ox = getComputedStyle(p).overflowX;
            if (ox === 'auto' || ox === 'scroll') { scrollable = true; break; }
          }
          if (!scrollable && box.right - W > overflow) {
            overflow = box.right - W;
            culprit = `${el.tagName}.${String(el.className).slice(0, 40)}`;
          }
        }
        return { overflow: Math.round(overflow), culprit };
      });
      expect(worst.overflow, `${width}px: article overflows by ${worst.overflow}px via ${worst.culprit}`).toBe(0);

      // Page level is asserted from 390px up. At 320px the shared FOOTER
      // overflows by ~7px — a pre-existing, site-wide defect (the homepage
      // measures identically) in the logo/social row of
      // components/marketing/footer.tsx, unrelated to this layout and tracked
      // separately. Asserting the page here would hide the article regression
      // this test exists to catch behind an unrelated red.
      if (width >= 390) {
        const page_ = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
        }));
        expect(
          page_.scrollWidth,
          `${width}px viewport: page scrolls sideways by ${page_.scrollWidth - page_.clientWidth}px`,
        ).toBeLessThanOrEqual(page_.clientWidth);
      }
    }
  });

  test('#verdict lands on the opening block, with the H1 still on screen', async ({ page }) => {
    // Before: the anchor sat on the verdict CARD, below the H1, the positioning
    // line and the meta line — opening the page at #verdict put the H1 entirely
    // above the viewport, so the reader arrived at a score with no product name.
    await seedCookieConsent(page);
    await page.goto(`${V2_REVIEW}#verdict`);
    await page.waitForTimeout(400);

    const h1 = page.locator('h1').first();
    const box = await h1.boundingBox();
    expect(box, 'H1 must have a layout box').not.toBeNull();
    const viewportHeight = page.viewportSize()!.height;
    expect(box!.y, 'H1 scrolled above the viewport').toBeGreaterThanOrEqual(0);
    expect(box!.y, 'H1 pushed below the fold').toBeLessThan(viewportHeight);
  });

  test('never more than two CTAs on screen at once (desktop, both common heights)', async ({ page }) => {
    // Before: four to five simultaneously between scrollY 2121 and 2513 —
    // the exact count depends on viewport height — including two identical gold
    // buttons roughly 5px apart. Cause: both grid children sat in row 1, which
    // stretched the rail's containing block over the whole page and kept
    // `lg:sticky` pinned past every closing CTA zone.
    await seedCookieConsent(page);

    for (const height of [900, 1080]) {
      await page.setViewportSize({ width: 1440, height });
      await page.goto(V2_REVIEW);
      await page.waitForTimeout(300);

      const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight);
      let worst = 0;
      let worstY = 0;
      for (let y = 0; y < pageHeight; y += 200) {
        await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' as ScrollBehavior }), y);
        await page.waitForTimeout(40);
        const count = await visibleCtaCount(page);
        if (count > worst) {
          worst = count;
          worstY = y;
        }
      }
      expect(worst, `1440x${height}: ${worst} CTAs visible at scrollY ${worstY}`).toBeLessThanOrEqual(2);
    }
  });

  test('each alternative reason and each "best for" line appears exactly once', async ({ page }) => {
    // Before: every alternatives[].whyInstead rendered THREE times (card,
    // "Which should you choose?" list, Final Decision card) and verdict.bestFor
    // twice. One of the three also joined ungrammatically:
    // "Choose Fidelity instead if The category leader (9.6/10)…".
    await seedCookieConsent(page);
    await page.goto(V2_REVIEW);

    const body = await page.locator('body').innerText();
    expect(body).not.toContain('Which should you choose?');

    // NOT a "Choose X instead if" text search: the hand-written finalDecision
    // prose legitimately contains that phrasing ("Choose Fidelity instead if
    // you want the strongest overall package…") and would false-positive. What
    // must be unique is the DATA — each alternative's whyInstead and each
    // bestFor line, which the removed blocks restated verbatim.
    const occurrences = (needle: string) => body.split(needle).length - 1;
    for (const needle of [
      "The category leader (9.6/10) with the field",   // Fidelity whyInstead
      'free advanced charting and paper trading',      // Webull whyInstead
      'The simpler app for beginners',                 // Robinhood whyInstead
      'Copy-trading and social investors',             // bestFor
    ]) {
      expect(occurrences(needle), `"${needle}" should appear exactly once`).toBe(1);
    }
  });
});
