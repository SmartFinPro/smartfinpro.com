// e2e/research-tracking.spec.ts
// research_v1 tracking smoke tests — proves the Research Library actually
// EMITS the six contract events from a real browser, through the real
// debounce/URL/DOM wiring the unit tests can't reach: the delegated listeners
// on the server-rendered card (native <details> + Link anchors), the settled-
// query rule, and the immediate handoff on navigation.
//
// navigator.sendBeacon is stubbed to return false via addInitScript so the
// tracker falls back to fetch(keepalive) — page.route can then reliably
// intercept and inspect the payloads (same idiom as cockpit-tracking.spec.ts).
//
// Run:  npx playwright test e2e/research-tracking.spec.ts
//       BASE_URL=http://localhost:3012 npx playwright test e2e/research-tracking.spec.ts

import { test, expect, type Page } from '@playwright/test';

const SEARCH = 'Search platforms…';

interface TrackedBatch {
  type: string;
  sessionId: string;
  data: { events?: Array<Record<string, unknown>> };
}

/** Collects every /api/track POST body; fulfills locally (no DB needed). */
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

function researchEvents(batches: TrackedBatch[]): Array<Record<string, unknown>> {
  return batches
    .filter((b) => b.type === 'research_event_batch')
    .flatMap((b) => b.data.events ?? []);
}

function named(batches: TrackedBatch[], name: string): Array<Record<string, unknown>> {
  return researchEvents(batches).filter((e) => e.eventName === name);
}

function props(event: Record<string, unknown>): Record<string, unknown> {
  return event.properties as Record<string, unknown>;
}

/**
 * Pre-seed the cookie-consent decision instead of clicking the banner away.
 * The banner mounts on a delay as a fixed bottom-right card at z-[9999]; a
 * "dismiss it after load" helper races it and the banner then swallows the
 * click on the fixed shortlist bar below it. Setting the same localStorage key
 * CookieConsentBanner reads means it never renders at all.
 */
async function seedCookieConsent(page: Page) {
  await page.addInitScript(() => {
    try {
      localStorage.setItem('cookie-consent', 'essential');
    } catch {
      /* storage blocked — the banner just renders, tests may need a click */
    }
  });
}

test.describe('Research Library tracking (research_v1)', () => {
  // The global config disables JS (redirect tests don't need it) — these
  // tests exercise the client tracker, so JS must be on.
  test.use({ javaScriptEnabled: true });

  let batches: TrackedBatch[];

  test.beforeEach(async ({ page }) => {
    // Force the fetch fallback so page.route sees every batch.
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'sendBeacon', { value: () => false, configurable: true });
    });
    await seedCookieConsent(page);
    batches = await interceptTrack(page);
    await page.goto('/research');
    await expect(page.getByPlaceholder(SEARCH)).toBeVisible(); // hydrated
  });

  test('a settled search sends the query LENGTH and the result count — never the query', async ({ page }) => {
    await page.getByPlaceholder(SEARCH).fill('schwab');
    await expect(page).toHaveURL(/[?&]q=schwab/);
    await expect.poll(() => named(batches, 'research_search').length).toBeGreaterThan(0);

    const events = named(batches, 'research_search');
    // One settled query typed → exactly one event, never one per keystroke.
    expect(events).toHaveLength(1);
    expect(props(events[0]).queryLength).toBe(6);
    expect(props(events[0]).resultCount).toBe(1);
    expect(props(events[0]).schemaVersion).toBe('research_v1');
    expect(props(events[0]).market).toBe('us');
    // The privacy rule, asserted on the wire: the raw string is nowhere in it.
    expect(JSON.stringify(events[0]).toLowerCase()).not.toContain('schwab');
  });

  test('a filter chip sends the facet, its value and the resulting count', async ({ page }) => {
    await page.getByRole('button', { name: 'In verification', exact: true }).click();
    await expect(page).toHaveURL(/status=provisional/);
    await expect.poll(() => named(batches, 'research_filter_change').length).toBeGreaterThan(0);

    const event = named(batches, 'research_filter_change')[0];
    expect(props(event).facet).toBe('status');
    expect(props(event).value).toBe('provisional');
    expect(props(event).active).toBe(true);
    expect(props(event).resultCount).toBe(1);
  });

  test('opening a card evidence disclosure sends research_evidence_open (open only)', async ({ page }) => {
    const disclosure = page.locator('details[data-research-evidence]').first();
    await disclosure.locator('summary').click();
    await expect.poll(() => named(batches, 'research_evidence_open').length).toBeGreaterThan(0);

    const event = named(batches, 'research_evidence_open')[0];
    expect(typeof props(event).productSlug).toBe('string');
    expect(props(event).status).toBe('audited');
    expect(props(event).dataPoints).toBeGreaterThan(0);

    // Closing it again must NOT emit a second event.
    const afterOpen = named(batches, 'research_evidence_open').length;
    await disclosure.locator('summary').click();
    await page.waitForTimeout(1000);
    expect(named(batches, 'research_evidence_open')).toHaveLength(afterOpen);
  });

  test('the shortlist toggle and the Cockpit handoff are both measured', async ({ page }) => {
    await page.getByRole('button', { name: /add .+ to shortlist/i }).first().click();
    await page.getByRole('button', { name: /add .+ to shortlist/i }).first().click();
    await expect.poll(() => named(batches, 'research_shortlist_change').length).toBeGreaterThanOrEqual(2);

    const adds = named(batches, 'research_shortlist_change');
    expect(props(adds[0]).action).toBe('add');
    expect(props(adds[0]).count).toBe(1);
    expect(props(adds[1]).count).toBe(2);

    await page.getByRole('region', { name: 'Research shortlist' }).getByRole('link', { name: /compare/i }).click();
    await expect(page).toHaveURL(/view=compare/);

    const handoff = named(batches, 'research_cockpit_handoff');
    expect(handoff).toHaveLength(1);
    expect(props(handoff[0]).count).toBe(2);
    expect((props(handoff[0]).productSlugs as string[]).length).toBe(2);
  });

  test('following a card review link sends research_review_click with its rendered position', async ({ page }) => {
    // The featured winner dossier is position 1 in the browse view.
    await page.getByRole('link', { name: /read research/i }).first().click();
    await expect.poll(() => named(batches, 'research_review_click').length).toBeGreaterThan(0);

    const event = named(batches, 'research_review_click')[0];
    expect(props(event).position).toBe(1);
    expect(props(event).status).toBe('audited');
    expect(typeof props(event).productSlug).toBe('string');
  });

  test('the card compare and methodology links are NOT counted as review clicks', async ({ page }) => {
    await page.getByRole('link', { name: /why this score/i }).first().click();
    await page.waitForTimeout(1000);
    expect(named(batches, 'research_review_click')).toHaveLength(0);
  });
});
