// e2e/tool-instrumentation.spec.ts
// PR 1.3 — verifies the three highest-traffic tools (Money Leak Scanner,
// Broker Finder Quiz, Trading Cost Calculator) emit real tool_v1 events
// from a live browser runtime, WITHOUT any visible UI change:
//   - a 'tool_event_batch' containing 'tool_view' fires on mount
//   - NOT ONE request reaches the broken /api/track-cta endpoint anymore
//     (it always 400'd — Money Leak used to call it on every load)
//   - the Quiz keeps sending its pre-existing 'quiz_started' single event
//     to /api/track UNCHANGED, in parallel with the new tool_v1 batches
//     (tool_v1 is strictly additive here — the A/B key and quiz_* singles
//     are byte-identical to before this PR)
//
// The Playwright GLOBAL config disables JS (redirect tests don't need it) —
// this spec explicitly opts back in via test.use({ javaScriptEnabled: true }),
// same pattern as e2e/tool-tracking.spec.ts and e2e/cockpit-tracking.spec.ts.
//
// Run:  npx playwright test e2e/tool-instrumentation.spec.ts
//       BASE_URL=http://localhost:3006 npx playwright test e2e/tool-instrumentation.spec.ts

import { test, expect, type Page, type Request } from '@playwright/test';

interface TrackedBatch {
  type: string;
  sessionId: string;
  data: { events?: Array<Record<string, unknown>>; eventName?: string };
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

/** Records every request made to the (broken, 400-ing) legacy endpoint. */
function interceptTrackCta(page: Page): Request[] {
  const requests: Request[] = [];
  page.on('request', (req) => {
    if (req.url().includes('/api/track-cta')) requests.push(req);
  });
  return requests;
}

function toolBatches(batches: TrackedBatch[]): TrackedBatch[] {
  return batches.filter((b) => b.type === 'tool_event_batch');
}

function allToolEvents(batches: TrackedBatch[]): Array<Record<string, unknown>> {
  return toolBatches(batches).flatMap((b) => b.data.events ?? []);
}

function eventBatches(batches: TrackedBatch[]): TrackedBatch[] {
  return batches.filter((b) => b.type === 'event');
}

test.describe('tool_v1 instrumentation (PR 1.3)', () => {
  test.use({ javaScriptEnabled: true });

  test.beforeEach(async ({ page }) => {
    // Force the fetch fallback so page.route sees every batch (sendBeacon
    // bodies aren't inspectable) — mirrors e2e/tool-tracking.spec.ts.
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'sendBeacon', { value: () => false, configurable: true });
    });
  });

  test('Money Leak Scanner (US): tool_view fires, no /api/track-cta request', async ({ page }) => {
    const cta = interceptTrackCta(page);
    const batches = await interceptTrack(page);

    await page.goto('/tools/money-leak-scanner', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000); // > 800ms trailing flush delay

    const events = allToolEvents(batches);
    const view = events.find((e) => e.eventName === 'tool_view');
    expect(view, 'tool_view should be in the batch').toBeTruthy();
    const props = (view!.properties ?? {}) as Record<string, unknown>;
    expect(props.schemaVersion).toBe('tool_v1');
    expect(props.toolId).toBe('money-leak-scanner');
    expect(props.market).toBe('us');
    expect(props.shellMode).toBe('live-canvas');

    expect(cta, 'no request should ever reach the broken /api/track-cta endpoint').toHaveLength(0);
  });

  test('Money Leak Scanner (UK market variant): tool_view fires with market "uk", no /api/track-cta request', async ({
    page,
  }) => {
    const cta = interceptTrackCta(page);
    const batches = await interceptTrack(page);

    await page.goto('/uk/tools/money-leak-scanner', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const events = allToolEvents(batches);
    const view = events.find((e) => e.eventName === 'tool_view');
    expect(view, 'tool_view should be in the batch').toBeTruthy();
    const props = (view!.properties ?? {}) as Record<string, unknown>;
    expect(props.market).toBe('uk');
    expect(props.variantPath).toBe('/uk/tools/money-leak-scanner');

    expect(cta).toHaveLength(0);
  });

  test('Money Leak Scanner: moving the income slider fires tool_input_change with a bucketed value', async ({
    page,
  }) => {
    const batches = await interceptTrack(page);
    await page.goto('/tools/money-leak-scanner', { waitUntil: 'networkidle' });

    const incomeSlider = page.getByRole('slider', { name: 'Monthly take-home income' });
    await incomeSlider.focus();
    await incomeSlider.press('ArrowRight');
    await page.waitForTimeout(2200); // 600ms per-field debounce + 800ms queue flush, generous margin

    const events = allToolEvents(batches);
    const start = events.find((e) => e.eventName === 'tool_start');
    expect(start, 'tool_start should fire on first interaction').toBeTruthy();

    const inputChange = events.find(
      (e) =>
        e.eventName === 'tool_input_change' &&
        (e.properties as Record<string, unknown>).inputKey === 'monthlyIncome',
    );
    expect(inputChange, 'tool_input_change for monthlyIncome should fire').toBeTruthy();
    const props = (inputChange!.properties as Record<string, unknown>);
    expect(typeof props.inputBucket).toBe('string');
    expect(props.controlRole).toBe('field');
  });

  test('Broker Finder Quiz: tool_view fires AND the pre-existing quiz_started single event is unchanged', async ({
    page,
  }) => {
    const cta = interceptTrackCta(page);
    const batches = await interceptTrack(page);

    await page.goto('/tools/broker-finder', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500); // dynamic(ssr:false) mount + trailing flush

    const toolEvents = allToolEvents(batches);
    const view = toolEvents.find((e) => e.eventName === 'tool_view');
    expect(view, 'tool_view should be in the batch').toBeTruthy();
    const props = (view!.properties ?? {}) as Record<string, unknown>;
    expect(props.toolId).toBe('broker-finder');
    expect(props.shellMode).toBe('guided-journey');

    // The quiz's own legacy single-event tracker (type:'event') must still
    // fire 'quiz_started' — untouched, parallel to the new tool_v1 batch.
    const legacyStarted = eventBatches(batches).find(
      (b) => (b.data as unknown as { eventName?: string }).eventName === 'quiz_started',
    );
    expect(legacyStarted, "legacy 'quiz_started' single event must still fire unchanged").toBeTruthy();

    expect(cta).toHaveLength(0);
  });

  test('Broker Finder Quiz: answering a question fires tool_start + a categorical tool_input_change (answer slug, not a numeric bucket)', async ({
    page,
  }) => {
    const batches = await interceptTrack(page);
    await page.goto('/tools/broker-finder', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    // First question ("experience") — click the first option ("beginner").
    await page.getByText("I'm just starting out").click();
    await page.waitForTimeout(1200);

    const events = allToolEvents(batches);
    const start = events.find((e) => e.eventName === 'tool_start');
    expect(start, 'tool_start should fire on the first answer').toBeTruthy();

    const inputChange = events.find(
      (e) =>
        e.eventName === 'tool_input_change' &&
        (e.properties as Record<string, unknown>).inputKey === 'experience',
    );
    expect(inputChange, 'tool_input_change for the "experience" question should fire').toBeTruthy();
    const props = inputChange!.properties as Record<string, unknown>;
    // Categorical bucket = the answer slug itself, never a numeric range.
    expect(props.inputBucket).toBe('beginner');
  });

  test('Trading Cost Calculator: tool_view fires, no /api/track-cta request', async ({ page }) => {
    const cta = interceptTrackCta(page);
    const batches = await interceptTrack(page);

    await page.goto('/tools/trading-cost-calculator', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500); // dynamic(ssr:false) mount + trailing flush

    const events = allToolEvents(batches);
    const view = events.find((e) => e.eventName === 'tool_view');
    expect(view, 'tool_view should be in the batch').toBeTruthy();
    const props = (view!.properties ?? {}) as Record<string, unknown>;
    expect(props.toolId).toBe('trading-cost');
    expect(props.market).toBe('us');
    expect(props.shellMode).toBe('precision-worksheet');

    expect(cta).toHaveLength(0);
  });

  test('Trading Cost Calculator: moving the trade-amount slider fires tool_input_change (currency bucket)', async ({
    page,
  }) => {
    const batches = await interceptTrack(page);
    await page.goto('/tools/trading-cost-calculator', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    const amountSlider = page.locator('[role="slider"]').first();
    await amountSlider.focus();
    await amountSlider.press('ArrowRight');
    await page.waitForTimeout(2200);

    const events = allToolEvents(batches);
    const inputChange = events.find((e) => e.eventName === 'tool_input_change');
    expect(inputChange, 'a tool_input_change should fire after moving a slider').toBeTruthy();
  });
});
