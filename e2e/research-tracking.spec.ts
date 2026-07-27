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

  // The exact DOM region FilteredResults/DefaultResults (ResearchHub.tsx)
  // render for the CURRENT filter state: one `dossier-<topic>` (or
  // `dossier-<category>-<topic>` when ambiguous — dossierGroupTestId)
  // `<section>` per grouped topic, plus — when present — the flat
  // `research-review-grid` `<section>`. Scoping to these testids by
  // construction excludes the page-level `<article data-research-market>`
  // wrapper (ResearchHubPage.tsx — never carries either testid), the fixed
  // shortlist bar, and the scope-switch dialog (ShortlistSwitchDialog,
  // ResearchShortlist.tsx — a `role="dialog"` overlay that never renders
  // inside a `dossier-*`/`research-review-grid` section). `BrowseFallback`
  // (ResearchHubPage.tsx) renders sections with these SAME testids, but the
  // Suspense boundary guarantees it and the live `ResearchHub` tree are
  // never both mounted — every test in this file waits for the hydrated
  // search input first (`beforeEach`), so only the live tree can match.
  const RESULTS_REGION_SELECTOR = '[data-testid^="dossier-"], [data-testid="research-review-grid"]';

  // Counts the result-card <article> elements actually rendered INSIDE the
  // active results region — a witness INDEPENDENT of both the tracked
  // `resultCount` property and the aria-live announcement above. Both of
  // those are derived from the SAME client-side filtered projection
  // (ResearchHub.tsx `resultCount` state), so asserting the tracked value
  // only against `visibleResultCount` would prove the two agree with EACH
  // OTHER, not that either is correct — if the projection itself were
  // wrong, the event and the announcement would be wrong together and the
  // assertion would still pass. This DOM count only proves the event and
  // the announcement match what actually got RENDERED on screen; it does
  // NOT additionally prove the projection picked the factually correct set
  // of products — that correctness is the unit/shell tests' job, not this
  // count's.
  async function renderedResultCount(page: Page): Promise<number> {
    const region = page.locator(RESULTS_REGION_SELECTOR);
    // Verify by construction, not by assumption: fail loudly if the region
    // selector ever stops matching anything (e.g. a markup/testid rename)
    // instead of silently counting 0 and letting a `0 === 0` coincidence
    // pass every downstream assertion.
    await expect(region.first()).toBeVisible();
    return region.locator('article').count();
  }

  test('a settled search sends the query LENGTH and the result count — never the query', async ({ page }) => {
    await page.getByPlaceholder(SEARCH).fill('schwab');
    await expect(page).toHaveURL(/[?&]q=schwab/);
    const visibleCount = await visibleResultCount(page);
    const renderedCount = await renderedResultCount(page);
    await expect.poll(() => named(batches, 'research_search').length).toBeGreaterThan(0);

    const events = named(batches, 'research_search');
    // One settled query typed → exactly one event, never one per keystroke.
    expect(events).toHaveLength(1);
    expect(props(events[0]).queryLength).toBe(6);
    // Primary witness: the tracked count against the independently-counted
    // DOM cards (not the aria-live text — see renderedResultCount above).
    expect(props(events[0]).resultCount).toBe(renderedCount);
    // Secondary witness: the announcement itself must also match reality.
    expect(visibleCount).toBe(renderedCount);
    expect(props(events[0]).schemaVersion).toBe('research_v1');
    expect(props(events[0]).market).toBe('us');
    // The privacy rule, asserted on the wire: the raw string is nowhere in it.
    expect(JSON.stringify(events[0]).toLowerCase()).not.toContain('schwab');
  });

  test('a filter chip sends the facet, its value and the resulting count', async ({ page }) => {
    await page.getByRole('button', { name: 'In verification', exact: true }).click();
    await expect(page).toHaveURL(/status=provisional/);
    const visibleCount = await visibleResultCount(page);
    const renderedCount = await renderedResultCount(page);
    await expect.poll(() => named(batches, 'research_filter_change').length).toBeGreaterThan(0);

    const event = named(batches, 'research_filter_change')[0];
    expect(props(event).facet).toBe('status');
    expect(props(event).value).toBe('provisional');
    expect(props(event).active).toBe(true);
    // Primary witness: the tracked count against the independently-counted
    // DOM cards, plus the secondary witness that the announcement matches.
    expect(props(event).resultCount).toBe(renderedCount);
    expect(visibleCount).toBe(renderedCount);
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
    // necessarily the trading-platforms pilot's audited #1 winner. This test
    // only checks the ORDER-based contract (position numbering, productSlug
    // shape) that holds no matter which card ends up first; it deliberately
    // does NOT assert `status` here — see the dedicated fixture test below
    // for why a DOM-derived status expectation would be tautological.
    const reviewLink = page.getByRole('link', { name: /read research/i }).first();

    await reviewLink.click();
    await expect.poll(() => named(batches, 'research_review_click').length).toBeGreaterThan(0);

    const event = named(batches, 'research_review_click')[0];
    expect(props(event).position).toBe(1);
    expect(typeof props(event).productSlug).toBe('string');
  });

  test('a known dossier entry (eToro, provisional) reports its exact identity fields on review click', async ({
    page,
  }) => {
    // Fixes the operator correction to the original plan: reading the
    // card's own rendered verification text for `expectedStatus` (as the
    // test above used to) is NOT an independent witness — both the DOM text
    // and `research_review_click.status` come from the exact same
    // `ResolvedEntry.status` (ResearchHub.tsx `resolveEntry`), so comparing
    // them proves only that one value equals itself. The actual test is a
    // NAMED FIXTURE with literal expected values, none of them read from the
    // DOM: eToro is the stably-known provisional entry in
    // us/trading/trading-platforms (research-shell.spec.ts's "status filter
    // narrows..." test relies on this exact same fact — filtering to
    // status=provisional there leaves the trading dossier with exactly one
    // card, "eToro"), and it has a real "Read research" link
    // (content/us/trading/etoro-review.mdx), so it is safe to click as a
    // dossier item event.
    await page.getByRole('button', { name: 'In verification', exact: true }).click();
    await expect(page).toHaveURL(/status=provisional/);

    const tradingDossier = page.getByTestId('dossier-trading-platforms');
    await tradingDossier.getByRole('link', { name: /read research/i }).first().click();
    await expect.poll(() => named(batches, 'research_review_click').length).toBeGreaterThan(0);

    const event = named(batches, 'research_review_click')[0];
    expect(props(event).productSlug).toBe('etoro');
    expect(props(event).status).toBe('provisional');
    expect(props(event).category).toBe('trading');
    expect(props(event).topic).toBe('trading-platforms');
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

  // Operator obligation, added by correction: the end-to-end proof that two
  // topics sharing the SAME bare topic string in different categories stay
  // analytically separable. us/credit-repair/companies and
  // us/debt-relief/companies both use the bare topic "companies"
  // (lib/comparison/topics/manifest.ts) — commit 223c7f7 fixed the DOM/
  // grouping layer so they render as two distinct `dossier-*` sections
  // (dossierGroupTestId; research-shell.spec.ts's "credit-repair and
  // debt-relief render as two separate dossier sections" already proves
  // that half). This test proves the OTHER half, that Task 6 wired into the
  // analytics dimensions (spec §12): the events themselves must carry
  // `category` alongside `topic`, or the two topics would still be
  // indistinguishable in the event stream even though the DOM keeps them
  // visually apart. Both dossiers have a live "Read research" link (Credit
  // Saint / National Debt Relief), so research_review_click — not
  // research_evidence_open — is used for both, the same item event the
  // fixture test above already exercises.
  test('two same-named "companies" topics in different categories stay analytically separable', async ({ page }) => {
    async function backToResearch() {
      await page.goto('/research');
      await expect(page.getByPlaceholder(SEARCH)).toBeVisible();
    }

    const creditRepair = page.getByTestId('dossier-credit-repair-companies');
    await creditRepair.getByRole('link', { name: /read research/i }).first().click();
    await expect.poll(() => named(batches, 'research_review_click').length).toBeGreaterThanOrEqual(1);

    await backToResearch();
    const debtRelief = page.getByTestId('dossier-debt-relief-companies');
    await debtRelief.getByRole('link', { name: /read research/i }).first().click();
    await expect.poll(() => named(batches, 'research_review_click').length).toBeGreaterThanOrEqual(2);

    const [creditRepairEvent, debtReliefEvent] = named(batches, 'research_review_click');
    expect(props(creditRepairEvent).topic).toBe('companies');
    expect(props(debtReliefEvent).topic).toBe('companies');
    expect(props(creditRepairEvent).category).toBe('credit-repair');
    expect(props(debtReliefEvent).category).toBe('debt-relief');
    expect(props(creditRepairEvent).category).not.toBe(props(debtReliefEvent).category);
  });
});
