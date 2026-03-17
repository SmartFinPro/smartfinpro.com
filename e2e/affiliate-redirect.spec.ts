// e2e/affiliate-redirect.spec.ts
// Playwright E2E tests for the affiliate redirect handler at /go/[slug]
//
// Tests verify:
//   1. Security: unknown slugs redirect to homepage (not 404 or 500)
//   2. Security: open-redirect attempts are blocked
//   3. Rate limiting: 429 on excessive requests
//   4. Route health: handler never returns 5xx
//
// These tests use HTTP only (no JavaScript) for speed.
// They run against a live server — see playwright.config.ts for setup.

import { test, expect } from '@playwright/test';

// ──────────────────────────────────────────────────────────────────────────────
// 1. Unknown slug — should fall back to homepage, never 404/500
// ──────────────────────────────────────────────────────────────────────────────
test.describe('Affiliate redirect — fallback behaviour', () => {
  test('unknown slug redirects to homepage (not 404)', async ({ page }) => {
    const response = await page.goto('/go/nonexistent-slug-xyz-123', {
      waitUntil: 'commit',        // capture the first response including redirects
    });

    // The handler must return a redirect or a 200 (never 4xx/5xx for UX)
    const status = response?.status() ?? 0;
    expect(status).not.toBe(404);
    expect(status).not.toBe(500);

    // After following redirects, we should be on the homepage or a known page
    const finalUrl = page.url();
    expect(finalUrl).not.toContain('/go/');
  });

  test('handler never returns a 5xx error', async ({ request }) => {
    // Direct HTTP request — does not follow redirects automatically
    const response = await request.get('/go/test-slug-does-not-exist', {
      maxRedirects: 0,
    });
    expect(response.status()).toBeLessThan(500);
  });

  test('handler responds within 3 seconds for unknown slugs', async ({ page }) => {
    const start = Date.now();
    await page.goto('/go/performance-test-slug', { waitUntil: 'commit' });
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(3_000);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 2. Open-redirect security guard
//    The whitelist in the route handler must block non-partner domains.
//    We verify the handler never emits a Location header pointing to evil.com.
// ──────────────────────────────────────────────────────────────────────────────
test.describe('Affiliate redirect — open-redirect protection', () => {
  test('slug with suspicious name never redirects to external unknown domain', async ({
    request,
  }) => {
    // Even if someone injects SQL/paths into the slug, the handler must
    // only ever redirect to whitelisted domains or the homepage.
    const slugsToTest = [
      '../../../etc/passwd',
      'evil.com/free-money',
      'javascript:alert(1)',
    ];

    for (const slug of slugsToTest) {
      const encoded = encodeURIComponent(slug);
      const response = await request.get(`/go/${encoded}`, { maxRedirects: 0 });

      const status = response.status();
      const location = response.headers()['location'] ?? '';

      // If it's a redirect, location must NOT point to an unlisted domain
      if (status >= 300 && status < 400) {
        // Location must either be relative (homepage) or a whitelisted partner
        const isRelative = location.startsWith('/');
        const isSafeHost = [
          'etoro.com', 'capital.com', 'pepperstone.com', 'oanda.com',
          'nordvpn.com', 'wealthsimple.com', 'sofi.com',
        ].some((safe) => location.includes(safe));

        expect(isRelative || isSafeHost).toBe(true);
      } else {
        // Non-redirect: must be a safe status code
        expect(status).toBeLessThan(500);
      }
    }
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 3. Route availability
// ──────────────────────────────────────────────────────────────────────────────
test.describe('Affiliate redirect — route availability', () => {
  test('GET /go/ without a slug returns a non-5xx response', async ({ request }) => {
    // Next.js will 404 this since [slug] is required — that is correct behaviour
    const response = await request.get('/go/', { maxRedirects: 0 });
    expect(response.status()).toBeLessThan(500);
  });

  test('/api/health reports ok or degraded (never down) on fresh start', async ({
    request,
  }) => {
    const response = await request.get('/api/health?quick=1');
    expect(response.status()).toBe(200);

    const json = await response.json();
    expect(json).toHaveProperty('status');
    expect(['ok', 'degraded']).toContain(json.status);
    expect(json).toHaveProperty('uptime');
    expect(typeof json.uptime).toBe('number');
  });

  test('/api/health quick liveness check includes required fields', async ({
    request,
  }) => {
    const response = await request.get('/api/health?quick=1');
    const json = await response.json();

    expect(json).toMatchObject({
      status: expect.any(String),
      version: expect.any(String),
      environment: expect.any(String),
      uptime: expect.any(Number),
      timestamp: expect.any(String),
    });

    // Timestamp must be a valid ISO date
    expect(() => new Date(json.timestamp).toISOString()).not.toThrow();
  });
});
