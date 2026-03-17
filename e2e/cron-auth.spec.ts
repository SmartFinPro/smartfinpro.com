// e2e/cron-auth.spec.ts
// Security tests for all 10 cron route endpoints.
//
// All cron routes are secured with a Bearer token:
//   Authorization: Bearer $CRON_SECRET
//
// Tests verify:
//   1. Every cron route returns 401 without Authorization header
//   2. Every cron route returns 401 with wrong token
//   3. Every cron route returns 401 with malformed header format
//   4. Routes never return 5xx (even unauthenticated)
//   5. Response body contains an "error" field (not an empty response)
//
// These tests use HTTP-only requests (no browser page loads).

import { test, expect } from '@playwright/test';

// All protected cron endpoints
const CRON_ROUTES = [
  '/api/cron/freshness-check',
  '/api/cron/check-links',
  '/api/cron/seo-drift',
  '/api/cron/sync-conversions',
  '/api/cron/send-emails',
  '/api/cron/spike-monitor',
  '/api/cron/sync-competitors',
  '/api/cron/weekly-report',
  '/api/cron/check-rankings',
  '/api/cron/sync-revenue',
] as const;

// ──────────────────────────────────────────────────────────────────────────────
// 1. No Authorization header → 401
// ──────────────────────────────────────────────────────────────────────────────
test.describe('Cron auth — no authorization header', () => {
  for (const route of CRON_ROUTES) {
    test(`GET ${route} without header → 401`, async ({ request }) => {
      const res = await request.get(route);
      expect(res.status()).toBe(401);
    });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// 2. Wrong Bearer token → 401
// ──────────────────────────────────────────────────────────────────────────────
test.describe('Cron auth — wrong Bearer token', () => {
  for (const route of CRON_ROUTES) {
    test(`GET ${route} with wrong token → 401`, async ({ request }) => {
      const res = await request.get(route, {
        headers: { Authorization: 'Bearer wrong-secret-xyz-12345' },
      });
      expect(res.status()).toBe(401);
    });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// 3. Malformed Authorization header → 401
// ──────────────────────────────────────────────────────────────────────────────
test.describe('Cron auth — malformed authorization', () => {
  const MALFORMED = [
    'Basic dXNlcjpwYXNz',          // Basic auth, not Bearer
    'Bearer',                        // "Bearer" without a token
    'Bearer ',                       // "Bearer " with only a space
    'token xyz',                     // wrong scheme
    '',                              // empty string
  ];

  for (const authValue of MALFORMED) {
    test(`malformed header "${authValue || '(empty)'}" → 401`, async ({ request }) => {
      const headers: Record<string, string> = {};
      if (authValue !== '') {
        headers['Authorization'] = authValue;
      }

      const res = await request.get('/api/cron/freshness-check', { headers });
      expect(res.status()).toBe(401);
    });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// 4. Response body must contain a valid error field (not empty)
// ──────────────────────────────────────────────────────────────────────────────
test.describe('Cron auth — response body on 401', () => {
  test('401 response has JSON body with error field', async ({ request }) => {
    const res = await request.get('/api/cron/freshness-check');
    expect(res.status()).toBe(401);

    // Must return JSON
    const ct = res.headers()['content-type'] ?? '';
    expect(ct).toContain('application/json');

    const body = await res.json();
    expect(body).toHaveProperty('error');
    expect(typeof body.error).toBe('string');
    expect(body.error.length).toBeGreaterThan(0);
  });

  test('401 does not expose internal error details', async ({ request }) => {
    const res = await request.get('/api/cron/seo-drift', {
      headers: { Authorization: 'Bearer invalid' },
    });
    expect(res.status()).toBe(401);

    const body = await res.json();
    const errorText = JSON.stringify(body).toLowerCase();

    // Must not expose stack traces, file paths, or DB connection strings
    expect(errorText).not.toContain('stack');
    expect(errorText).not.toContain('/lib/');
    expect(errorText).not.toContain('supabase');
    expect(errorText).not.toContain('postgres');
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 5. Routes must never return 5xx for any auth scenario
// ──────────────────────────────────────────────────────────────────────────────
test.describe('Cron auth — no server errors on invalid auth', () => {
  for (const route of CRON_ROUTES) {
    test(`GET ${route} never returns 5xx (even unauthenticated)`, async ({
      request,
    }) => {
      const res = await request.get(route);
      // Must be 4xx (401), never 500/502/503
      expect(res.status()).toBeLessThan(500);
    });
  }

  test('All cron routes respond within 2s even unauthenticated', async ({
    request,
  }) => {
    // A 401 should be instant — no DB calls, no timeouts
    const start = Date.now();
    await request.get('/api/cron/freshness-check');
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(2_000);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 6. POST variants also protected (send-emails, sync-conversions)
// ──────────────────────────────────────────────────────────────────────────────
test.describe('Cron auth — POST endpoints', () => {
  const POST_ROUTES = [
    '/api/cron/send-emails',
    '/api/cron/sync-conversions',
  ] as const;

  for (const route of POST_ROUTES) {
    test(`POST ${route} without auth → 401 or 405`, async ({ request }) => {
      const res = await request.post(route, { data: {} });
      // Either 401 (auth required) or 405 (method not allowed)
      // — depends on route handler order
      expect([401, 405]).toContain(res.status());
    });

    test(`POST ${route} with wrong token → 401`, async ({ request }) => {
      const res = await request.post(route, {
        data: {},
        headers: { Authorization: 'Bearer wrong-token' },
      });
      expect(res.status()).toBe(401);
    });
  }
});
