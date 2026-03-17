// e2e/health.spec.ts
// E2E tests for /api/health — validates the health check endpoint
// returns correct structure and HTTP codes in a running server.

import { test, expect } from '@playwright/test';

test.describe('/api/health', () => {
  // ── Quick liveness check ──────────────────────────────────────────────
  test('quick=1 responds 200 immediately with ok status', async ({ request }) => {
    const res = await request.get('/api/health?quick=1');
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.status).toBe('ok');
    expect(body).toHaveProperty('uptime');
    expect(body).toHaveProperty('timestamp');
    expect(body.checks.liveness.status).toBe('ok');
  });

  test('quick=1 responds within 500ms (no DB calls)', async ({ request }) => {
    const start = Date.now();
    const res = await request.get('/api/health?quick=1');
    const elapsed = Date.now() - start;

    expect(res.status()).toBe(200);
    expect(elapsed).toBeLessThan(500);
  });

  // ── Full health check ─────────────────────────────────────────────────
  test('full check returns valid HealthStatus schema', async ({ request }) => {
    const res = await request.get('/api/health');
    // Accept 200 (ok/degraded) or 503 (down) — we just validate shape
    expect([200, 503]).toContain(res.status());

    const body = await res.json();
    expect(['ok', 'degraded', 'down']).toContain(body.status);
    expect(typeof body.uptime).toBe('number');
    expect(body.uptime).toBeGreaterThanOrEqual(0);
    expect(body).toHaveProperty('timestamp');
    expect(body).toHaveProperty('checks');
    expect(typeof body.checks).toBe('object');
  });

  test('full check includes expected check keys', async ({ request }) => {
    const res = await request.get('/api/health');
    const body = await res.json();

    // These checks must always be present regardless of status
    expect(body.checks).toHaveProperty('env');
    expect(body.checks).toHaveProperty('memory');
    // Supabase and crons only present in full mode (may fail in test env)
    // but shape must be valid when present
    for (const [, check] of Object.entries(body.checks)) {
      const c = check as { status: string };
      expect(['ok', 'warn', 'error']).toContain(c.status);
    }
  });

  test('version field is present and non-empty', async ({ request }) => {
    const res = await request.get('/api/health?quick=1');
    const body = await res.json();
    expect(typeof body.version).toBe('string');
    expect(body.version.length).toBeGreaterThan(0);
  });

  test('503 status code when status is down', async ({ request }) => {
    const res = await request.get('/api/health');
    const body = await res.json();
    if (body.status === 'down') {
      expect(res.status()).toBe(503);
    } else {
      expect(res.status()).toBe(200);
    }
  });
});
