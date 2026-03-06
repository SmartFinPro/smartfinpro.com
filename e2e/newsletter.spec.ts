// e2e/newsletter.spec.ts
// E2E tests for /api/subscribe — validates the newsletter subscription API.
// Tests rate-limiting, validation, and correct response format.
// Note: Does NOT test actual email delivery (would require real Resend credentials).

import { test, expect } from '@playwright/test';

test.describe('/api/subscribe', () => {
  // ── Happy path ────────────────────────────────────────────────────────
  test('accepts valid email and returns success or handled error', async ({ request }) => {
    const res = await request.post('/api/subscribe', {
      data: {
        email: 'test-e2e@example.com',
        leadMagnet: 'test',
        source: 'e2e-test',
      },
      headers: { 'Content-Type': 'application/json' },
    });

    // 200 = success, 409 = already subscribed, 500 = Resend not configured in test
    expect([200, 409, 500]).toContain(res.status());
    const body = await res.json();
    expect(typeof body.success).toBe('boolean');
  });

  // ── Input validation ──────────────────────────────────────────────────
  test('rejects request with missing email (400)', async ({ request }) => {
    const res = await request.post('/api/subscribe', {
      data: { source: 'e2e-test' },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  test('rejects malformed email address (400)', async ({ request }) => {
    const res = await request.post('/api/subscribe', {
      data: { email: 'not-an-email', source: 'e2e-test' },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status()).toBe(400);
  });

  test('rejects completely invalid JSON body (400/500)', async ({ request }) => {
    const res = await request.post('/api/subscribe', {
      data: 'not json at all',
      headers: { 'Content-Type': 'text/plain' },
    });
    expect([400, 500]).toContain(res.status());
  });

  test('rejects email with script injection attempt (400)', async ({ request }) => {
    const res = await request.post('/api/subscribe', {
      data: {
        email: '<script>alert(1)</script>@evil.com',
        source: 'e2e-test',
      },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status()).toBe(400);
  });

  // ── Rate limiting ─────────────────────────────────────────────────────
  test('rate limits after 5 rapid requests from same IP (429)', async ({ request }) => {
    const payload = {
      data: { email: `rl-test-${Date.now()}@example.com`, source: 'e2e-rl-test' },
      headers: { 'Content-Type': 'application/json' },
    };

    // Send 6 requests rapidly — 6th must be rate-limited
    const responses = await Promise.all(
      Array.from({ length: 6 }, () => request.post('/api/subscribe', payload)),
    );

    const statuses = responses.map((r) => r.status());
    // At least one must be 429 (rate limited)
    expect(statuses).toContain(429);

    // The 429 response must include Retry-After header
    const rateLimited = responses.find((r) => r.status() === 429);
    if (rateLimited) {
      const retryAfter = rateLimited.headers()['retry-after'];
      expect(retryAfter).toBeDefined();
      expect(Number(retryAfter)).toBeGreaterThan(0);
    }
  });

  // ── Security ──────────────────────────────────────────────────────────
  test('response does not expose internal error details', async ({ request }) => {
    const res = await request.post('/api/subscribe', {
      data: { email: 'valid@test.com', source: 'e2e' },
      headers: { 'Content-Type': 'application/json' },
    });
    const body = await res.json();
    // Should never expose stack traces or internal paths
    const bodyStr = JSON.stringify(body);
    expect(bodyStr).not.toContain('/Users/');
    expect(bodyStr).not.toContain('node_modules');
    expect(bodyStr).not.toContain('at Object.');
  });
});
