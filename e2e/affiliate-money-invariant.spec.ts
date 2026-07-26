// e2e/affiliate-money-invariant.spec.ts
// THE MONEY INVARIANT: viewing a page must never touch /go/[slug].
//
// Next's router used to prefetch every `<Link href="/go/[slug]">`, so merely
// rendering a review or cockpit page issued a GET that the redirect route
// recorded in `link_clicks` — clicks nobody made, plus an outbound ping to the
// affiliate network on every page view. Confirmed in production before the
// fix: 205 of 2209 click rows had a shape no human can produce (2+ different
// affiliate slugs from one IP inside 5 s, referred by the page rendering
// exactly those links).
//
// The fix is two-layered — `prefetch={false}` on the CTA components, and a
// speculative-request guard in the route (lib/affiliate/prefetch.ts) — so the
// correct observation for a page view is ZERO requests, at any status.
// Asserting on status alone would miss a regression here, because headless
// Chromium's UA trips the route's bot gate and gets a 403 that hides the real
// behaviour.
//
// These specs never click a CTA, so any hit below is speculative by definition.
// They also never click on purpose: a click in a local run would write a real
// row to the production Supabase and ping the affiliate network for real.
//
// MUST run against a PRODUCTION server (`next build && next start`). Next
// disables Link prefetching in dev, so a dev run would pass vacuously:
//   npm run build && PORT=3021 npm start
//   BASE_URL=http://localhost:3021 npx playwright test e2e/affiliate-money-invariant.spec.ts

import { test, expect, type Page } from '@playwright/test';

// The surfaces that render affiliate CTAs as `<Link>` (the Comparison Cockpit
// renders plain `<a>`, and its unverified providers are behind the attribution
// gate, so it has no /go href to speculate on).
const V1_REVIEW = '/us/trading/fidelity-review';   // classic ReportLayout review
const V2_REVIEW = '/us/trading/etoro-review';      // reviewLayout: 'v2'

const isAffiliateRedirect = (url: string) => new URL(url).pathname.startsWith('/go/');

/** Every request the page made to the affiliate route, at any status. */
function watchAffiliateRequests(page: Page): string[] {
  const hits: string[] = [];
  // Watch REQUESTS, not responses: a request that never completes still proves
  // the page reached for the affiliate route on its own.
  page.on('request', (req) => {
    if (isAffiliateRedirect(req.url())) hits.push(req.url());
  });
  return hits;
}

/** Load the page and give the router every chance to speculate. */
async function viewAndSettle(page: Page, path: string) {
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  // Viewport prefetching only fires for links the user scrolls to.
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo(0, document.body.scrollHeight);
  });
  await page.waitForTimeout(1_500);
}

test.describe('A page view records no affiliate click', () => {
  // The rest of the e2e suite runs with javaScriptEnabled:false (redirect specs
  // need no JS). Here JS is the whole point — no router, no prefetch, no test.
  test.use({ javaScriptEnabled: true });

  for (const [what, path] of Object.entries({ 'v1 review page': V1_REVIEW, 'v2 review page': V2_REVIEW })) {
    test(`${what} never requests /go/[slug]`, async ({ page }) => {
      const hits = watchAffiliateRequests(page);

      await viewAndSettle(page, path);

      // Non-vacuous: the page has to actually offer affiliate CTAs, otherwise
      // "zero requests" would be trivially true and prove nothing.
      const ctas = await page.locator('a[href^="/go/"]').count();
      expect(ctas, `${path} renders no affiliate CTA — this spec would assert nothing`).toBeGreaterThan(0);

      expect(hits, `${path} requested /go/[slug] without a click — a page view must never record an affiliate click`).toEqual([]);
    });
  }
});

test.describe('The route refuses speculative requests', () => {
  // Deliberately an unknown slug: if the guard ever regresses, this test must
  // fail — not write a phantom click to the production tracking tables.
  const SLUG = '/go/nonexistent-slug-xyz-123';
  // Playwright's own UA says "HeadlessChrome", which the route's bot gate
  // answers with a silent 403 — that would mask what these tests measure. The
  // documentation-reserved client IP keeps these requests out of the shared
  // (Supabase-backed) blocklist, so an unrelated blocked IP cannot turn a real
  // regression into a green run or vice versa.
  const AS_A_VISITOR = {
    'user-agent': 'Mozilla/5.0 (Macintosh) AppleWebKit/537.36 Chrome/126.0 Safari/537.36',
    'x-forwarded-for': '203.0.113.99',
  };

  test('a router prefetch gets 204 and no destination to follow', async ({ request }) => {
    const res = await request.get(SLUG, {
      headers: { ...AS_A_VISITOR, 'next-router-prefetch': '1', 'sec-fetch-dest': 'empty' },
      maxRedirects: 0,
    });

    expect(res.status()).toBe(204);
    expect(res.headers()['location']).toBeUndefined();
    expect(res.headers()['x-sfp-speculative']).toBe('next-router-prefetch');
    // An edge-cached 204 would be served to real clickers — served headers, not
    // the ones the route sets, because next.config.ts can override them.
    expect(res.headers()['cache-control']).toContain('no-store');
  });

  test('a browser speculation-rules prefetch gets 204', async ({ request }) => {
    const res = await request.get(SLUG, {
      headers: { ...AS_A_VISITOR, 'sec-purpose': 'prefetch;prerender' },
      maxRedirects: 0,
    });

    expect(res.status()).toBe(204);
  });

  test('a normal navigation still redirects', async ({ request }) => {
    const res = await request.get(SLUG, {
      headers: { ...AS_A_VISITOR, 'sec-fetch-dest': 'document', 'sec-fetch-mode': 'navigate' },
      maxRedirects: 0,
    });

    expect(res.status()).toBe(307);
    expect(res.headers()['location']).toBeTruthy();
  });
});
