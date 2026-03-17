// e2e/multi-market.spec.ts
// E2E tests for multi-market routing (US/UK/CA/AU).
// Validates that each market responds correctly, canonical URLs are consistent,
// and market-specific content is served.

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';

const MARKETS = [
  { market: 'us', path: '/', label: 'US' },
  { market: 'uk', path: '/uk/', label: 'UK' },
  { market: 'ca', path: '/ca/', label: 'CA' },
  { market: 'au', path: '/au/', label: 'AU' },
] as const;

test.describe('Multi-Market Routing', () => {
  // ── Market homepages respond 200 ──────────────────────────────────────
  for (const { path, label } of MARKETS) {
    test(`${label} homepage responds 200`, async ({ request }) => {
      const res = await request.get(path);
      expect(res.status()).toBe(200);
    });
  }

  // ── UK/CA/AU paths don't bleed into US ───────────────────────────────
  test('US homepage does not redirect to market prefix', async ({ request }) => {
    const res = await request.get('/');
    // US uses no prefix — direct 200, not a redirect to /us/
    expect(res.status()).toBe(200);
    expect(res.url()).not.toContain('/us/');
  });

  test('UK path correctly serves UK market (not 404)', async ({ request }) => {
    const res = await request.get('/uk/');
    expect(res.status()).toBe(200);
  });

  // ── Sitemap includes all markets ──────────────────────────────────────
  test('sitemap.xml responds 200 and contains all market roots', async ({ request }) => {
    const res = await request.get('/sitemap.xml');
    expect(res.status()).toBe(200);

    const contentType = res.headers()['content-type'];
    expect(contentType).toContain('xml');

    const body = await res.text();
    // Each market root should appear in sitemap
    expect(body).toContain('smartfinpro.com/</loc>');   // US root
    expect(body).toContain('/uk/');
    expect(body).toContain('/ca/');
    expect(body).toContain('/au/');
  });

  // ── robots.txt ───────────────────────────────────────────────────────
  test('robots.txt responds 200 and allows all markets', async ({ request }) => {
    const res = await request.get('/robots.txt');
    expect(res.status()).toBe(200);
    const body = await res.text();
    // Must have User-agent directive
    expect(body).toContain('User-agent:');
    // Must not block all crawlers (that would be catastrophic for SEO)
    expect(body).not.toMatch(/Disallow:\s*\/\s*$/m);
  });

  // ── Affiliate redirect routes exist for each market ───────────────────
  test('/go/ redirect falls back to homepage for unknown slug', async ({ request }) => {
    const res = await request.get('/go/unknown-nonexistent-slug-xyz', {
      maxRedirects: 5,
    });
    // Should end at homepage, not a 404 or 500
    expect([200, 301, 302, 307, 308]).toContain(res.status());
    // Must not 500
    expect(res.status()).not.toBe(500);
  });

  // ── Security headers present on all markets ───────────────────────────
  for (const { path, label } of MARKETS) {
    test(`${label} homepage has security headers`, async ({ request }) => {
      const res = await request.get(path);
      const headers = res.headers();

      expect(headers['x-frame-options']).toBe('SAMEORIGIN');
      expect(headers['x-content-type-options']).toBe('nosniff');
      expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    });
  }
});

test.describe('Affiliate Go Route Security', () => {
  test('blocks bot User-Agents with 403', async ({ request }) => {
    const res = await request.get('/go/test-slug', {
      headers: {
        'User-Agent': 'python-requests/2.28.0',
      },
      maxRedirects: 0,
    });
    expect(res.status()).toBe(403);
  });

  test('blocks curl User-Agent with 403', async ({ request }) => {
    const res = await request.get('/go/test-slug', {
      headers: {
        'User-Agent': 'curl/7.88.1',
      },
      maxRedirects: 0,
    });
    expect(res.status()).toBe(403);
  });

  test('blocks empty User-Agent with 403', async ({ request }) => {
    const res = await request.get('/go/test-slug', {
      headers: {
        'User-Agent': '',
      },
      maxRedirects: 0,
    });
    expect(res.status()).toBe(403);
  });

  test('allows legitimate browser User-Agent', async ({ request }) => {
    const res = await request.get('/go/nonexistent-slug', {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      },
      maxRedirects: 5,
    });
    // Should not be 403 (may be 307 redirect or 200 after following redirects)
    expect(res.status()).not.toBe(403);
  });
});
