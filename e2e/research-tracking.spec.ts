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

  // Reads the SR-live-region result count the hub itself renders
  // (`aria-live="polite"` span, ResearchHub.tsx) — used below wherever a
  // test needs "however many results the hub honestly shows right now"
  // rather than a magic number. Task 6 generalized `/research` from the
  // single-topic trading-platforms PILOT (where "schwab"/"provisional" each
  // matched exactly one product) to the full multi-category hub, where the
  // same query/facet legitimately matches many more products across every
  // category — a hardcoded pilot-era count would just be a second, silently
  // stale copy of a number the page already displays. This is the same
  // non-brittleness principle commit 7c64d80 already established for the
  // "Charles Schwab" collision in research-shell.spec.ts: the FIXTURE
  // assumption changed with the generalization, not the counted behavior.
  async function visibleResultCount(page: Page): Promise<number> {
    const text = await page.locator('[aria-live="polite"]').first().textContent();
    const match = text?.match(/\d+/);
    if (!match) throw new Error(`Could not read a result count from "${text}"`);
    return Number(match[0]);
  }

  test('a settled search sends the query LENGTH and the result count — never the query', async ({ page }) => {
    await page.getByPlaceholder(SEARCH).fill('schwab');
    await expect(page).toHaveURL(/[?&]q=schwab/);
    const expectedCount = await visibleResultCount(page);
    await expect.poll(() => named(batches, 'research_search').length).toBeGreaterThan(0);

    const events = named(batches, 'research_search');
    // One settled query typed → exactly one event, never one per keystroke.
    expect(events).toHaveLength(1);
    expect(props(events[0]).queryLength).toBe(6);
    expect(props(events[0]).resultCount).toBe(expectedCount);
    expect(props(events[0]).schemaVersion).toBe('research_v1');
    expect(props(events[0]).market).toBe('us');
    // The privacy rule, asserted on the wire: the raw string is nowhere in it.
    expect(JSON.stringify(events[0]).toLowerCase()).not.toContain('schwab');
  });

  test('a filter chip sends the facet, its value and the resulting count', async ({ page }) => {
    await page.getByRole('button', { name: 'In verification', exact: true }).click();
    await expect(page).toHaveURL(/status=provisional/);
    const expectedCount = await visibleResultCount(page);
    await expect.poll(() => named(batches, 'research_filter_change').length).toBeGreaterThan(0);

    const event = named(batches, 'research_filter_change')[0];
    expect(props(event).facet).toBe('status');
    expect(props(event).value).toBe('provisional');
    expect(props(event).active).toBe(true);
    expect(props(event).resultCount).toBe(expectedCount);
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
    // The first "Read research" link in DOM order is position 1 in the
    // browse view — on the generalized (Task 6) multi-category hub this is
    // whichever card happens to sort first across EVERY category, not
    // necessarily the trading-platforms pilot's audited #1 winner, so the
    // expected status is read from the card's own rendered verification
    // line rather than assumed to always be 'audited' (same non-brittleness
    // principle as `visibleResultCount` above).
    const reviewLink = page.getByRole('link', { name: /read research/i }).first();
    const cardText = (await reviewLink.locator('xpath=ancestor::article[1]').textContent()) ?? '';
    const expectedStatus = cardText.includes('Verification in progress') ? 'provisional' : 'audited';

    await reviewLink.click();
    await expect.poll(() => named(batches, 'research_review_click').length).toBeGreaterThan(0);

    const event = named(batches, 'research_review_click')[0];
    expect(props(event).position).toBe(1);
    expect(props(event).status).toBe(expectedStatus);
    expect(typeof props(event).productSlug).toBe('string');
  });

  // Known-red audits/reports/research-discovery-pr2-known-red.md, #17 — operator
  // obligation: this test used to pass VACUOUSLY (before Task 6, no events fired
  // at all, so "0 review clicks" was trivially true regardless of what got
  // clicked). It now also fires a POSITIVE control — a real review link, which
  // IS counted — on the SAME page, proving the two negative cases above are
  // filtered by the delegated listener's href comparison, not by dead tracking.
  test('the card compare and methodology links are NOT counted as review clicks', async ({ page }) => {
    // Every link below is a REAL <a href> the delegated listener never calls
    // preventDefault() on (contract: navigation must stay untouched), so
    // each click genuinely navigates away — the test returns to /research
    // between interactions, reusing the SAME `batches` accumulator the whole
    // way through, which is what "on the same page" (operator obligation)
    // means here: one continuous tracking session, not one unbroken URL.
    async function backToResearch() {
      await page.goto('/research');
      await expect(page.getByPlaceholder(SEARCH)).toBeVisible();
    }

    // Negative case 1: the outline "Compare" CTA — the single-slug Cockpit
    // handoff, never a review link (a card's compareHref and reviewHref are
    // always distinct paths).
    await page.getByRole('link', { name: 'Compare', exact: true }).first().click();
    await expect(page).toHaveURL(/compare=/);
    await backToResearch();

    // Negative case 2: the "Why this score?" methodology link.
    await page.getByRole('link', { name: /why this score/i }).first().click();
    await expect(page).toHaveURL(/\/methodology/);
    await page.waitForTimeout(1000);
    expect(named(batches, 'research_review_click')).toHaveLength(0);

    // Positive control: a REAL review link, on the same tracking session,
    // must still be counted — a green "0 review clicks" from tracking that
    // never fires at all is not acceptable coverage.
    await backToResearch();
    await page.getByRole('link', { name: /read research/i }).first().click();
    await expect.poll(() => named(batches, 'research_review_click').length).toBeGreaterThan(0);
    expect(named(batches, 'research_review_click')).toHaveLength(1);
  });
});
