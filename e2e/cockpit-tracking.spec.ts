// e2e/cockpit-tracking.spec.ts
// cockpit_v1 tracking smoke tests — verifies the Comparison Cockpit emits
// impression + CTA events to /api/track without changing navigation.
//
// navigator.sendBeacon is stubbed to return false via addInitScript so the
// tracker falls back to fetch(keepalive) — page.route can then reliably
// intercept and inspect the payloads. Bot filtering is server-side only, so
// the headless client still SENDS events (the server would discard them).
//
// Run:  npx playwright test e2e/cockpit-tracking.spec.ts
//       BASE_URL=http://localhost:3002 npx playwright test e2e/cockpit-tracking.spec.ts

import { test, expect, type Page } from '@playwright/test';

const COCKPIT_PAGE = '/us/personal-finance/best/robo-advisors';

interface TrackedBatch {
  type: string;
  sessionId: string;
  data: { events?: Array<Record<string, unknown>> };
}

/** Collects every /api/track POST body; fulfills locally (no server needed). */
async function interceptTrack(page: Page): Promise<TrackedBatch[]> {
  const batches: TrackedBatch[] = [];
  await page.route('**/api/track', async (route) => {
    try {
      const body = route.request().postData();
      if (body) batches.push(JSON.parse(body) as TrackedBatch);
    } catch {
      // ignore malformed test noise
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' });
  });
  return batches;
}

function allEvents(batches: TrackedBatch[]): Array<Record<string, unknown>> {
  return batches
    .filter((b) => b.type === 'event_batch')
    .flatMap((b) => b.data.events ?? []);
}

/**
 * React 19 reveals streamed Suspense boundaries via requestAnimationFrame,
 * which never fires in hidden/backgrounded documents — the cockpit then sits
 * in a hidden <div id="S:n"> forever. Real (visible) browsers are unaffected;
 * headless/background contexts need this nudge. Also fires the batched
 * reveal manually when React has already queued it in $RB.
 */
async function revealCockpit(page: Page): Promise<void> {
  await page.waitForFunction(() => !!document.querySelector('.ck-root'), undefined, { timeout: 20000 });
  await page.evaluate(() => {
    const w = window as unknown as { $RB?: unknown[]; $RV?: (b: unknown[]) => void };
    try {
      if (w.$RB && w.$RB.length && typeof w.$RV === 'function') w.$RV(w.$RB);
    } catch {
      /* already revealed */
    }
  });
  await page.waitForSelector('.ck-root', { state: 'visible', timeout: 10000 });
}

test.describe(`Cockpit tracking: ${COCKPIT_PAGE}`, () => {
  // The global config disables JS (redirect tests don't need it) — these
  // tests exercise the client tracker, so JS must be on.
  test.use({ javaScriptEnabled: true });

  test.beforeEach(async ({ page }) => {
    // Force the fetch fallback so page.route sees every batch.
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'sendBeacon', { value: () => false, configurable: true });
    });
  });

  test('emits cockpit_view + product impressions with cockpit_v1 payload', async ({ page }) => {
    const batches = await interceptTrack(page);
    await page.goto(COCKPIT_PAGE, { waitUntil: 'networkidle' });
    await revealCockpit(page);
    // Scroll so the cockpit root + first cards enter the viewport.
    await page.evaluate(() => window.scrollTo({ top: 800, behavior: 'auto' }));
    await page.waitForTimeout(1500); // > 800ms flush delay

    const events = allEvents(batches);
    const view = events.find((e) => e.eventName === 'cockpit_view');
    expect(view, 'cockpit_view should fire').toBeTruthy();
    const props = (view!.properties ?? {}) as Record<string, unknown>;
    expect(props.schemaVersion).toBe('cockpit_v1');
    expect(props.market).toBe('us');
    expect(props.topic).toBe('robo-advisors');
    expect(view!.eventCategory).toBe('cockpit');

    const impressions = events.filter((e) => e.eventName === 'cockpit_product_impression');
    expect(impressions.length, 'at least one product impression').toBeGreaterThan(0);
  });

  test('card CTA click emits cockpit_cta_click with rendered ctaMode + destinationType', async ({ page }) => {
    const batches = await interceptTrack(page);
    // Outbound provider sites must not actually load in the test.
    await page.route(/^https?:\/\/(?!localhost|127\.0\.0\.1).*/, (route) => route.abort());

    await page.goto(COCKPIT_PAGE, { waitUntil: 'networkidle' });
    await revealCockpit(page);
    const cta = page.locator('.ck-card-cta-btn').first();
    await cta.scrollIntoViewIfNeeded();
    await cta.click();
    await page.waitForTimeout(500);

    const clicks = allEvents(batches).filter((e) => e.eventName === 'cockpit_cta_click');
    expect(clicks.length, 'cta click tracked').toBeGreaterThan(0);
    const props = (clicks[0].properties ?? {}) as Record<string, unknown>;
    expect(props.surface).toBe('card');
    expect(props.ctaPosition).toBe('primary');
    expect(typeof props.rank).toBe('number');
    expect(['offer', 'visit', 'review', 'unavailable']).toContain(props.ctaMode);
    expect(['affiliate', 'outbound', 'internal_review', 'unavailable']).toContain(props.destinationType);
    expect(typeof props.productSlug).toBe('string');
  });

  test('impressions dedupe within a session (no re-fire after re-scroll)', async ({ page }) => {
    const batches = await interceptTrack(page);
    await page.goto(COCKPIT_PAGE, { waitUntil: 'networkidle' });
    await revealCockpit(page);
    await page.evaluate(() => window.scrollTo({ top: 1200, behavior: 'auto' }));
    await page.waitForTimeout(1200);
    const firstCount = allEvents(batches).filter((e) => e.eventName === 'cockpit_view').length;

    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'auto' }));
    await page.waitForTimeout(300);
    await page.evaluate(() => window.scrollTo({ top: 1200, behavior: 'auto' }));
    await page.waitForTimeout(1200);

    const secondCount = allEvents(batches).filter((e) => e.eventName === 'cockpit_view').length;
    expect(secondCount).toBe(firstCount); // deduped via sfp_ck_imp_v1
  });

  test('sort change emits cockpit_sort_change with trigger', async ({ page }) => {
    const batches = await interceptTrack(page);
    await page.goto(COCKPIT_PAGE, { waitUntil: 'networkidle' });
    await revealCockpit(page);
    const select = page.locator('#ck-sort');
    await select.scrollIntoViewIfNeeded();
    const options = await select.locator('option').all();
    expect(options.length).toBeGreaterThan(1);
    const value = await options[1].getAttribute('value');
    await select.selectOption(value!);
    await page.waitForTimeout(1200);

    const sorts = allEvents(batches).filter((e) => e.eventName === 'cockpit_sort_change');
    expect(sorts.length).toBeGreaterThan(0);
    const props = (sorts[0].properties ?? {}) as Record<string, unknown>;
    expect(props.trigger).toBe('dropdown');
    expect(props.sortKey).toBe(value);
  });

  test('tracking failure never blocks the page (route errors swallowed)', async ({ page }) => {
    await page.route('**/api/track', (route) => route.abort());
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(String(err)));

    await page.goto(COCKPIT_PAGE, { waitUntil: 'networkidle' });
    await revealCockpit(page);
    await page.evaluate(() => window.scrollTo({ top: 1000, behavior: 'auto' }));
    await page.waitForTimeout(1200);

    expect(errors, 'no uncaught errors when /api/track is down').toEqual([]);
    await expect(page.locator('.ck-root')).toBeVisible();
  });
});
