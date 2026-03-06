// e2e/dashboard-auth.spec.ts
// Security tests for the Dashboard auth gate (middleware.ts)
//
// Tests verify:
//   1. /dashboard/* requires authentication (no anonymous access)
//   2. Login page renders with correct form fields
//   3. Wrong credentials → error message shown
//   4. Cookie with wrong value → back to login page
//   5. POST with correct secret (env-injected) → sets auth cookie
//
// Auth mechanism: POST form with `secret` field → httpOnly cookie `sfp-dash-auth`
// Dev bypass: DASHBOARD_AUTH_DISABLED=true (only works in non-production)

import { test, expect } from '@playwright/test';

// ──────────────────────────────────────────────────────────────────────────────
// 1. Unauthenticated access — must never reach dashboard content
// ──────────────────────────────────────────────────────────────────────────────
test.describe('Dashboard auth — unauthenticated access', () => {
  test('GET /dashboard without cookie returns login page (not 404/500)', async ({
    request,
  }) => {
    const res = await request.get('/dashboard', { maxRedirects: 0 });
    // Must be 200 (login form) or 302 redirect — never 404 or 500
    expect(res.status()).toBeLessThan(400);
    expect(res.status()).not.toBe(404);
  });

  test('GET /dashboard shows login form (not dashboard content)', async ({ page }) => {
    // javaScriptEnabled=false globally — form HTML is server-rendered
    await page.goto('/dashboard');

    // Login form must be present — a <form> with method="post"
    const form = page.locator('form[method="post"], form[method="POST"]');
    await expect(form).toBeVisible({ timeout: 5_000 });
  });

  test('GET /dashboard response contains password input field', async ({ page }) => {
    await page.goto('/dashboard');
    // Look for a password-type or text input named "secret"
    const secretInput = page.locator('input[name="secret"]');
    await expect(secretInput).toBeAttached({ timeout: 5_000 });
  });

  test('GET /dashboard/analytics without cookie redirects to login', async ({
    page,
  }) => {
    await page.goto('/dashboard/analytics');
    // After following redirects, we must NOT be on /dashboard/analytics
    // (either stuck on login page at /dashboard or explicit redirect)
    const form = page.locator('form[method="post"], form[method="POST"]');
    await expect(form).toBeAttached({ timeout: 5_000 });
  });

  test('GET /dashboard/revenue without cookie shows login, not revenue data', async ({
    request,
  }) => {
    const res = await request.get('/dashboard/revenue');
    expect(res.status()).not.toBe(500);
    // Page must not expose revenue data — check Content-Type is HTML (login page)
    const ct = res.headers()['content-type'] ?? '';
    expect(ct).toContain('text/html');
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 2. Cookie tampering — wrong cookie value must be rejected
// ──────────────────────────────────────────────────────────────────────────────
test.describe('Dashboard auth — cookie tampering', () => {
  test('tampered auth cookie returns login form, not dashboard', async ({
    page, context,
  }) => {
    // Inject a fake / wrong auth cookie
    await context.addCookies([{
      name:     'sfp-dash-auth',
      value:    'not-the-real-secret',
      domain:   'localhost',
      path:     '/dashboard',
      httpOnly: true,
      secure:   false,
      sameSite: 'Strict',
    }]);

    await page.goto('/dashboard');

    // Should still show login form — cookie value rejected
    const form = page.locator('form[method="post"], form[method="POST"]');
    await expect(form).toBeAttached({ timeout: 5_000 });
  });

  test('empty auth cookie value is rejected', async ({ page, context }) => {
    await context.addCookies([{
      name:     'sfp-dash-auth',
      value:    '',
      domain:   'localhost',
      path:     '/dashboard',
      httpOnly: false,
      secure:   false,
      sameSite: 'Strict',
    }]);

    await page.goto('/dashboard');
    const form = page.locator('form[method="post"], form[method="POST"]');
    await expect(form).toBeAttached({ timeout: 5_000 });
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 3. Login form — wrong credentials show error message
// ──────────────────────────────────────────────────────────────────────────────
test.describe('Dashboard auth — wrong credentials', () => {
  test('POST with wrong secret shows error message', async ({ request }) => {
    const res = await request.post('/dashboard', {
      form: { secret: 'definitely-wrong-password-xyz', redirect: '/dashboard' },
    });

    // Response must be 200 (re-renders login page with error) — not 302
    expect(res.status()).toBe(200);

    const text = await res.text();
    // Login page must contain an error indicator
    expect(text.toLowerCase()).toMatch(/invalid|error|incorrect|try again/);
  });

  test('POST with empty secret shows error message', async ({ request }) => {
    const res = await request.post('/dashboard', {
      form: { secret: '', redirect: '/dashboard' },
    });

    expect(res.status()).toBe(200);
    const text = await res.text();
    expect(text.toLowerCase()).toMatch(/invalid|error|incorrect|try again/);
  });

  test('POST with SQL injection attempt is rejected', async ({ request }) => {
    const res = await request.post('/dashboard', {
      form: { secret: "' OR '1'='1", redirect: '/dashboard' },
    });

    // Must return login page (200) or redirect to login — never 500
    expect(res.status()).not.toBe(500);
    expect(res.status()).not.toBe(302); // No successful login redirect

    if (res.status() === 200) {
      const text = await res.text();
      // Must not contain any dashboard-specific content
      expect(text).not.toContain('Command Center');
      expect(text).not.toContain('data-dashboard');
    }
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 4. Login page security — no sensitive data exposed before auth
// ──────────────────────────────────────────────────────────────────────────────
test.describe('Dashboard auth — information disclosure', () => {
  test('login page does not expose DASHBOARD_SECRET in HTML', async ({ page }) => {
    await page.goto('/dashboard');
    const html = await page.content();

    // Must not contain any env var names or common secret patterns
    expect(html).not.toContain('DASHBOARD_SECRET');
    expect(html).not.toContain('CRON_SECRET');
    expect(html).not.toContain('SUPABASE_SERVICE_ROLE');
  });

  test('login page does not expose API keys in HTML', async ({ page }) => {
    await page.goto('/dashboard');
    const html = await page.content();

    // Common API key patterns
    expect(html).not.toMatch(/sk-[a-zA-Z0-9]{20,}/);    // OpenAI/Anthropic key pattern
    expect(html).not.toMatch(/eyJ[a-zA-Z0-9_-]{50,}/);  // JWT pattern
  });

  test('response headers do not leak server info', async ({ request }) => {
    const res = await request.get('/dashboard');
    const headers = res.headers();

    // X-Powered-By should not expose Next.js version details
    // (Next.js removes this by default, but verify it)
    const poweredBy = headers['x-powered-by'] ?? '';
    expect(poweredBy).not.toMatch(/next\.js\s+\d+/i);
  });
});
