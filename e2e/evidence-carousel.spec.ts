// e2e/evidence-carousel.spec.ts
//
// Regression net for platform evidence screenshots.
//
// Background: 41 review pages shipped <EvidenceCarousel> blocks pointing at
// /images/evidence/<provider>/ assets that were never added. /_next/image
// answered HTTP 400, and — worse — the captions and methodology note asserted
// the shots came from our own live testing. The evidence claim outlived the
// evidence.
//
// Two guarantees are covered here:
//   1. No review page requests an evidence image that does not exist.
//   2. When the assets are unreachable, the carousel removes itself entirely
//      rather than rendering the sourcing claim next to a broken frame.
//
// The build-time guard (scripts/check-evidence-images.mjs) is what actually
// keeps missing assets out of a deploy; these tests cover the runtime fallback
// and stop the MDX blocks from creeping back in.

import { test, expect } from '@playwright/test';

// This carousel is client-rendered, so the suite-wide javaScriptEnabled:false
// (set in playwright.config.ts for the redirect tests) has to be lifted.
test.use({ javaScriptEnabled: true });

/** The one review that has real, committed screenshots. */
const PAGE_WITH_EVIDENCE = '/au/business-banking/revolut-business-review';

/** Formerly broken — carousel block was removed until assets exist. */
const PAGES_WITHOUT_EVIDENCE = [
  '/us/trading/fidelity-review',
  '/us/trading/robinhood-review',
  '/us/forex/oanda-review',
  '/us/cybersecurity/nordvpn-review',
];

const ZOOM_BUTTON = '[aria-label^="Zoom:"]';

/**
 * Force lazy-loaded slides to fetch.
 *
 * Deliberately not locator.scrollIntoViewIfNeeded(): when the assets fail, the
 * carousel unmounts itself mid-scroll and Playwright's stability check throws
 * "element is not attached" — the test would fail on the behaviour it exists to
 * prove. Scrolling in-page never holds an element handle.
 */
async function revealLazyImages(page: import('@playwright/test').Page) {
  await page.evaluate(async () => {
    document.documentElement.style.scrollBehavior = 'auto';
    const step = Math.max(window.innerHeight, 400);
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
  });
}

test.describe('evidence carousel', () => {
  test('renders every committed screenshot on the page that has them', async ({ page }) => {
    const imageRequests: string[] = [];
    const failedImages: string[] = [];

    page.on('response', (res) => {
      const url = res.url();
      if (!url.includes('images%2Fevidence') && !url.includes('images/evidence')) return;
      imageRequests.push(url);
      if (res.status() >= 400) failedImages.push(`${res.status()} ${url}`);
    });

    await page.goto(PAGE_WITH_EVIDENCE);

    const zoomButtons = page.locator(ZOOM_BUTTON);
    await expect(zoomButtons).toHaveCount(5);

    // Pull the lazy-loaded slides into view so the requests actually fire.
    await revealLazyImages(page);
    await expect
      .poll(() => imageRequests.length, { timeout: 10_000 })
      .toBeGreaterThan(0);

    expect(failedImages, 'evidence images must not 4xx/5xx').toEqual([]);
    await expect(zoomButtons).toHaveCount(5);
  });

  test('removes itself when the screenshots cannot be loaded', async ({ page }) => {
    // Simulate assets disappearing after the build — the case the build-time
    // guard cannot catch.
    await page.route('**/_next/image**', (route) => {
      const target = route.request().url();
      if (target.includes('images%2Fevidence') || target.includes('images/evidence')) {
        return route.fulfill({ status: 400, body: 'missing' });
      }
      return route.continue();
    });

    await page.goto(PAGE_WITH_EVIDENCE);

    const zoomButtons = page.locator(ZOOM_BUTTON);

    // Non-vacuity guard: the slides are lazy, so nothing has failed yet and the
    // carousel must still be here. Without this, dropping the hardening would
    // leave the assertions below trivially true on an empty page.
    await expect(zoomButtons).toHaveCount(5);

    await revealLazyImages(page);

    // Whole section goes, not just the images: no slides, and no sourcing claim
    // left stranded without anything to back it.
    await expect(zoomButtons).toHaveCount(0, { timeout: 10_000 });
    await expect(
      page.getByText('No images are sourced from', { exact: false }),
    ).toHaveCount(0);
    await expect(page.getByText('Tested on:', { exact: false })).toHaveCount(0);
  });

  for (const path of PAGES_WITHOUT_EVIDENCE) {
    test(`${path} requests no evidence images`, async ({ page }) => {
      const evidenceRequests: string[] = [];
      page.on('request', (req) => {
        const url = req.url();
        if (url.includes('images%2Fevidence') || url.includes('images/evidence')) {
          evidenceRequests.push(url);
        }
      });

      const response = await page.goto(path, { waitUntil: "domcontentloaded" });
      await revealLazyImages(page);
      expect(response?.status()).toBe(200);

      expect(evidenceRequests, 'page must not reference missing evidence assets').toEqual([]);
      // The section scaffolding must be gone too, not just the images —
      // otherwise the table of contents keeps a dead #platform-evidence anchor.
      await expect(page.locator('#platform-evidence')).toHaveCount(0);
      await expect(page.locator(ZOOM_BUTTON)).toHaveCount(0);
    });
  }
});
