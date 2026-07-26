// e2e/tool-tracking.spec.ts
// tool_v1 client-binding smoke tests (PR 1.2) — verifies createToolTracker
// (lib/analytics/tool-tracking.ts) emits valid 'tool_event_batch' payloads
// to /api/track from a REAL browser runtime (window/document/sessionStorage/
// navigator.sendBeacon), which unit tests cannot exercise.
//
// No real tool is instrumented yet (that is PR 1.3) — this binds the tracker
// via a minimal, unlinked, noindex QA route (app/private/qa-tool-tracking-
// harness/page.tsx + components/dev/tool-tracking-harness.tsx) that exposes
// `window.__toolTrackerHarness` for direct page.evaluate calls. See that
// component's header comment for the full rationale.
//
// The Playwright GLOBAL config disables JS (redirect tests don't need it) —
// tests here explicitly opt back in via test.use({ javaScriptEnabled: true }).
//
// Run:  npx playwright test e2e/tool-tracking.spec.ts
//       BASE_URL=http://localhost:3003 npx playwright test e2e/tool-tracking.spec.ts

import { test, expect, type Page } from '@playwright/test';

const HARNESS_PAGE = '/private/qa-tool-tracking-harness';

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

function toolBatches(batches: TrackedBatch[]): TrackedBatch[] {
  return batches.filter((b) => b.type === 'tool_event_batch');
}

function allToolEvents(batches: TrackedBatch[]): Array<Record<string, unknown>> {
  return toolBatches(batches).flatMap((b) => b.data.events ?? []);
}

test.describe(`Tool tracking client binding: ${HARNESS_PAGE}`, () => {
  test.use({ javaScriptEnabled: true });

  test.beforeEach(async ({ page }) => {
    // Force the fetch fallback so page.route sees every batch (mirrors
    // e2e/cockpit-tracking.spec.ts — sendBeacon bodies aren't inspectable).
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'sendBeacon', { value: () => false, configurable: true });
    });
  });

  test('trackView() sends a tool_event_batch with a valid tool_view item shape', async ({ page }) => {
    const batches = await interceptTrack(page);
    await page.goto(HARNESS_PAGE, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => Boolean((window as unknown as { __toolTrackerHarness?: unknown }).__toolTrackerHarness));

    await page.evaluate(() => {
      const w = window as unknown as { __toolTrackerHarness: { trackView: () => void } };
      w.__toolTrackerHarness.trackView();
    });
    await page.waitForTimeout(1000); // > 800ms trailing flush delay

    expect(toolBatches(batches).length, 'a tool_event_batch request fired').toBeGreaterThan(0);
    const batch = toolBatches(batches)[0];
    expect(batch.type).toBe('tool_event_batch');
    expect(typeof batch.sessionId).toBe('string');
    expect(batch.sessionId.length).toBeGreaterThan(0);

    const events = allToolEvents(batches);
    const view = events.find((e) => e.eventName === 'tool_view');
    expect(view, 'tool_view should be in the batch').toBeTruthy();
    expect(view!.eventCategory).toBe('tool');
    const props = (view!.properties ?? {}) as Record<string, unknown>;
    expect(props.schemaVersion).toBe('tool_v1');
    expect(props.toolId).toBe('money-leak-scanner');
    expect(props.market).toBe('us');
    expect(props.resultState).toBe('example');
  });

  test("trackNextAction('cockpit', ...) fires tool_next_action_click then tool_cockpit_cta_click, both immediately", async ({
    page,
  }) => {
    const batches = await interceptTrack(page);
    await page.goto(HARNESS_PAGE, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => Boolean((window as unknown as { __toolTrackerHarness?: unknown }).__toolTrackerHarness));

    await page.evaluate(() => {
      const w = window as unknown as {
        __toolTrackerHarness: { trackNextAction: (kind: string, href: string) => void };
      };
      w.__toolTrackerHarness.trackNextAction('cockpit', '/us/personal-finance/best/robo-advisors');
    });
    await page.waitForTimeout(500);

    const names = allToolEvents(batches).map((e) => e.eventName);
    const nextIdx = names.indexOf('tool_next_action_click');
    const cockpitIdx = names.indexOf('tool_cockpit_cta_click');
    expect(nextIdx, 'tool_next_action_click fired').toBeGreaterThanOrEqual(0);
    expect(cockpitIdx, 'tool_cockpit_cta_click fired').toBeGreaterThanOrEqual(0);
    expect(nextIdx).toBeLessThan(cockpitIdx);
  });

  test('tracking failure never blocks the page (route errors swallowed)', async ({ page }) => {
    await page.route('**/api/track', (route) => route.abort());
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(String(err)));

    await page.goto(HARNESS_PAGE, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => Boolean((window as unknown as { __toolTrackerHarness?: unknown }).__toolTrackerHarness));
    await page.evaluate(() => {
      const w = window as unknown as { __toolTrackerHarness: { trackView: () => void } };
      w.__toolTrackerHarness.trackView();
    });
    await page.waitForTimeout(1000);

    expect(errors, 'no uncaught errors when /api/track is down').toEqual([]);
    await expect(page.locator('[data-testid="tool-tracking-harness-ready"]')).toBeVisible();
  });
});
