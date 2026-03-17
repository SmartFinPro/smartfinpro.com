// e2e/comparison-page.spec.ts
// Smoke tests for broker comparison pages — validates critical
// elements render correctly: TOC anchors, CTAs, disclosure,
// integrity link, and basic page structure.
//
// Run:  npx playwright test e2e/comparison-page.spec.ts
//       BASE_URL=http://localhost:3002 npx playwright test e2e/comparison-page.spec.ts

import { test, expect } from '@playwright/test';

// ── Helpers ───────────────────────────────────────────────────
/**
 * Extract the CSS translateY value from a computed transform string.
 * Handles all three formats browsers can return:
 *   • 'none'                  → 0
 *   • 'matrix(a,b,c,d,tx,ty)' → ty is index 5
 *   • 'matrix3d(16 values)'   → ty is index 13
 */
function extractTranslateY(transform: string): number {
  if (transform === 'none') return 0;
  const m3d = transform.match(/matrix3d\(([^)]+)\)/);
  if (m3d) return parseFloat(m3d[1].split(',')[13]);
  const m2d = transform.match(/matrix\(([^)]+)\)/);
  if (m2d) return parseFloat(m2d[1].split(',')[5]);
  return 0; // safe fallback for unknown formats
}

// ── Test pages ────────────────────────────────────────────────
// Add new comparison page URLs here as they're created.
const COMPARISON_PAGES = [
  '/us/trading/etoro-vs-robinhood',
];

for (const pagePath of COMPARISON_PAGES) {
  test.describe(`Comparison page: ${pagePath}`, () => {

    // ── 1. Basic page loads ─────────────────────────────────
    test('responds with HTTP 200', async ({ request }) => {
      const res = await request.get(pagePath);
      expect(res.status()).toBe(200);
    });

    test('has correct Content-Type', async ({ request }) => {
      const res = await request.get(pagePath);
      const ct = res.headers()['content-type'] || '';
      expect(ct).toContain('text/html');
    });

    // ── 2. Affiliate Disclosure present ─────────────────────
    test('renders AffiliateDisclosure', async ({ request }) => {
      const res = await request.get(pagePath);
      const html = await res.text();
      // The disclosure text varies but always includes "affiliate" or "commission"
      expect(html.toLowerCase()).toMatch(/affiliate.{0,20}disclosure|may earn a commission/);
    });

    // ── 3. Integrity link present ───────────────────────────
    test('contains link to /integrity', async ({ request }) => {
      const res = await request.get(pagePath);
      const html = await res.text();
      expect(html).toContain('/integrity');
    });

    // ── 4. Warning/Risk Disclosure present ──────────────────
    test('contains risk disclosure', async ({ request }) => {
      const res = await request.get(pagePath);
      const html = await res.text();
      expect(html.toLowerCase()).toMatch(/risk disclosure|investing involves risk/);
    });

    // ── 5. CTA buttons render ───────────────────────────────
    test('renders affiliate CTA buttons', async ({ request }) => {
      const res = await request.get(pagePath);
      const html = await res.text();
      // At least one /go/ affiliate link should be present
      expect(html).toMatch(/\/go\/[a-z0-9-]+/);
    });

    // ── 6. TOC section IDs are in the serialized content ────
    // Note: MDX content is client-rendered via next-mdx-remote,
    // so anchor divs appear in the compiledSource string, not
    // directly in SSR HTML. We verify they're in the page payload.
    test('contains TOC anchor IDs in page payload', async ({ request }) => {
      const res = await request.get(pagePath);
      const html = await res.text();

      // These are the standard comparison page section IDs
      const requiredAnchors = [
        'quick-verdict',
        'head-to-head',
        'verdict',
      ];

      for (const anchor of requiredAnchors) {
        // Check for the anchor in any form (SSR HTML or serialized MDX)
        expect(html, `Missing anchor: ${anchor}`).toContain(anchor);
      }
    });

    // ── 7. Quick Navigation TOC renders (server-side) ───────
    test('renders Quick Navigation with section links', async ({ request }) => {
      const res = await request.get(pagePath);
      const html = await res.text();
      // TOC links use href="#section-id" pattern
      expect(html).toMatch(/href="#quick-verdict"/);
      expect(html).toMatch(/href="#verdict"/);
    });

    // ── 8. No hardcoded audit scores ────────────────────────
    test('does not contain hardcoded 10/10 audit score', async ({ request }) => {
      const res = await request.get(pagePath);
      const html = await res.text();
      // "10/10" should not appear as a static audit score
      // (dynamic widget is fine — it renders via JS)
      // Check the MDX compiledSource portion specifically
      const auditScorePattern = /Audit Score.*?10\/10|10\/10.*?Audit/i;
      expect(html).not.toMatch(auditScorePattern);
    });

    // ── 9. Expert box renders ───────────────────────────────
    test('renders expert credentials box', async ({ request }) => {
      const res = await request.get(pagePath);
      const html = await res.text();
      expect(html.toLowerCase()).toMatch(/reviewed.*verified|expert/);
    });

    // ── 10. Schema.org JSON-LD present ──────────────────────
    test('contains JSON-LD structured data', async ({ request }) => {
      const res = await request.get(pagePath);
      const html = await res.text();
      expect(html).toContain('application/ld+json');
    });
  });
}

// ── Browser interaction tests (JS enabled) ────────────────────
// These tests use a real browser to verify client-side behavior
// like TOC navigation, sticky nav appearance, and anchor scrolling.
test.describe('Browser interaction: /us/trading/etoro-vs-robinhood', () => {
  test.use({ javaScriptEnabled: true });

  test('TOC click scrolls to anchor target', async ({ page }) => {
    await page.goto('/us/trading/etoro-vs-robinhood');
    // Wait for MDX hydration (anchor divs are client-rendered)
    // Use state: 'attached' because anchor divs are empty (zero dimensions)
    // and Playwright's default visibility check requires non-zero size.
    await page.waitForSelector('#quick-verdict', { state: 'attached', timeout: 10_000 });

    // Verify all 8 section anchors exist in the DOM
    const anchorIds = [
      'quick-verdict', 'expert-analysis', 'head-to-head', 'fee-breakdown',
      'etoro-deep-dive', 'robinhood-deep-dive', 'pros-cons', 'verdict',
    ];
    for (const id of anchorIds) {
      const el = page.locator(`#${id}`);
      await expect(el, `Anchor #${id} should exist`).toBeAttached();
    }

    // Click the "Final Verdict" TOC link and verify scroll position changes
    const scrollBefore = await page.evaluate(() => window.scrollY);
    await page.click('a[href="#verdict"]');
    // Wait for scrollY to actually increase rather than sleeping a fixed duration.
    // Robust on slow CI: waits as long as needed (up to 3s); fast on local.
    await page.waitForFunction(
      (before) => window.scrollY > before,
      scrollBefore,
      { timeout: 3000 },
    );
    const scrollAfter = await page.evaluate(() => window.scrollY);
    expect(scrollAfter, 'Page should scroll after TOC click').toBeGreaterThan(scrollBefore);
  });

  test('Sticky nav appears after scrolling past hero', async ({ page }) => {
    await page.goto('/us/trading/etoro-vs-robinhood');
    // Wait for 'load' (all resources fetched, JS executed, React hydrated).
    // 'networkidle' is too slow here — the page makes continuous API calls.
    await page.waitForLoadState('load');
    // Wait for React to mount the sticky nav element — proves the scroll listener
    // is attached. Avoids a fixed sleep: fast on local, patient on slow CI.
    await page.waitForSelector('nav[aria-label*="quick access"]', {
      state: 'attached',
      timeout: 8000,
    });

    // Scroll well past the trigger threshold (component shows at scrollY > 320)
    await page.evaluate(() => window.scrollTo(0, 1200));

    // Poll until the CSS transition completes and nav slides fully into view.
    // Handles matrix(6 values) AND matrix3d(16 values) — both can appear
    // depending on browser/engine. Visible = translateY ≥ 0.
    await page.waitForFunction(
      () => {
        const nav = document.querySelector('nav[aria-label*="quick access"]');
        if (!nav) return false;
        const t = window.getComputedStyle(nav).transform;
        if (t === 'none') return true;
        // matrix3d: 16 values, translateY is index 13
        const m3d = t.match(/matrix3d\(([^)]+)\)/);
        if (m3d) return parseFloat(m3d[1].split(',')[13]) >= 0;
        // matrix: 6 values, translateY is index 5
        const m2d = t.match(/matrix\(([^)]+)\)/);
        if (m2d) return parseFloat(m2d[1].split(',')[5]) >= 0;
        return false;
      },
      { timeout: 4000 },
    );

    // Final assertion: use the shared Node-side helper (handles matrix + matrix3d)
    const transform = await page.locator('nav[aria-label*="quick access"]').evaluate(
      (el) => window.getComputedStyle(el).transform,
    );
    const ty = extractTranslateY(transform);
    expect(ty, 'Sticky nav Y-translation should be ≥ 0 when visible').toBeGreaterThanOrEqual(0);
  });

  test('CTA button links are functional affiliate redirects', async ({ page }) => {
    await page.goto('/us/trading/etoro-vs-robinhood');
    // Wait for at least one affiliate link to appear — state-based, consistent
    // with the other browser tests (no fixed sleep or load-state guessing).
    await page.waitForSelector('a[href*="/go/"]', { state: 'attached', timeout: 10_000 });

    // Find all /go/ links on the page
    const goLinks = page.locator('a[href*="/go/"]');
    const count = await goLinks.count();
    expect(count, 'Should have at least 2 affiliate CTA links').toBeGreaterThanOrEqual(2);

    // Verify the first CTA has a valid href
    const firstHref = await goLinks.first().getAttribute('href');
    expect(firstHref).toMatch(/^\/go\/[a-z0-9-]+/);
  });
});

// ── Widget endpoint smoke test ────────────────────────────────
test.describe('Trust Badge Widget', () => {
  test('responds 200 with HTML', async ({ request }) => {
    const res = await request.get('/api/widget/trust-badge');
    expect(res.status()).toBe(200);
    const ct = res.headers()['content-type'] || '';
    expect(ct).toContain('text/html');
  });

  test('has correct embedding headers', async ({ request }) => {
    const res = await request.get('/api/widget/trust-badge');
    const headers = res.headers();
    expect(headers['access-control-allow-origin']).toBe('*');
    expect(headers['x-robots-tag']).toContain('noindex');
    expect(headers['content-security-policy']).toContain('frame-ancestors *');
    // Must NOT have X-Frame-Options (would block embedding)
    expect(headers['x-frame-options']).toBeUndefined();
  });

  test('links to /integrity', async ({ request }) => {
    const res = await request.get('/api/widget/trust-badge');
    const html = await res.text();
    expect(html).toContain('smartfinpro.com/integrity');
  });
});
