// e2e/homepage-quick-finder.spec.ts
// research-discovery-pr3 plan, Task 4 — the browser-level release gate for
// the Homepage Quick Finder (components/research/QuickFinder.tsx,
// components/marketing/research-quick-finder-section.tsx; spec §9.3). Proves
// what the unit tests (__tests__/unit/research-quick-finder.test.ts,
// __tests__/unit/research-catalog-shell-logic.test.ts,
// __tests__/unit/research-quick-finder-tracking.test.ts) cannot: real DOM
// wiring (the search input, the category chips, the click handlers), real
// navigation to real destinations, and the ACTUAL /api/track payloads a
// click produces.
//
// Run against a PRODUCTION build (`next start`), never `next dev` — same
// rule as e2e/research-a11y.spec.ts (unminified dev bundles + the dev
// overlay make LCP/CLS numbers meaningless):
//
//   BASE_URL=http://127.0.0.1:3012 npx playwright test e2e/homepage-quick-finder.spec.ts
//
// FIXTURES USED BELOW ARE REAL PRODUCTION DATA, not synthetic test rows —
// every product name/topic/category cited here was independently verified
// against the running catalog before being hardcoded (see each test's own
// comment for how). This file follows the operator's adversarial-case rule
// literally: a case that cannot be produced honestly with today's live
// catalog is documented and left to the unit level, never faked in a real
// page (see "ADVERSARIAL CASE — multi-context item" below).

import { test, expect, type Page } from '@playwright/test';

const HOME_PATHS = ['/', '/uk', '/ca', '/au'] as const;
const SEARCH_LABEL = /search research/i;

/** Cockpit-only, currently-qualifying live products (no review MDX exists
 *  for either slug — verified by directory listing of content/us/credit-repair
 *  and content/us/debt-relief) that share the SAME bare BEST_X_MANIFEST topic
 *  string "companies" across two DIFFERENT categories — the exact live pair
 *  the operator's adversarial-case list names
 *  (us/credit-repair/companies vs us/debt-relief/companies). Both are already
 *  used as "real, currently-qualifying product slugs (not test fixtures)" by
 *  e2e/research-shell.spec.ts's own key-collision test. */
const CREDIT_REPAIR_ONLY = { query: 'Sky Blue Credit', productSlug: 'sky-blue-credit', category: 'credit-repair' };
const DEBT_RELIEF_ONLY = { query: 'Accredited Debt Relief', productSlug: 'accredited-debt-relief', category: 'debt-relief' };

async function seedCookieConsent(page: Page) {
  await page.addInitScript(() => {
    try {
      localStorage.setItem('cookie-consent', 'essential');
    } catch {
      /* storage blocked — the banner renders, tests may need a click */
    }
  });
}

interface TrackedBatch {
  type: string;
  sessionId: string;
  data: { events?: Array<Record<string, unknown>> };
}

/** Collects every /api/track POST body; fulfills locally (no DB needed) —
 *  same idiom as e2e/research-tracking.spec.ts / cockpit-tracking.spec.ts. */
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
  return batches.filter((b) => b.type === 'research_event_batch').flatMap((b) => b.data.events ?? []);
}

function named(batches: TrackedBatch[], name: string): Array<Record<string, unknown>> {
  return researchEvents(batches).filter((e) => e.eventName === name);
}

function props(event: Record<string, unknown>): Record<string, unknown> {
  return event.properties as Record<string, unknown>;
}

async function gotoHome(page: Page, path: string) {
  await seedCookieConsent(page);
  await page.goto(path);
  await expect(page.getByRole('searchbox', { name: SEARCH_LABEL })).toBeVisible();
}

function finderCards(page: Page) {
  return page.locator('#reports [data-finder-item]');
}

async function finderCardIds(page: Page): Promise<string[]> {
  return finderCards(page).evaluateAll((nodes) => nodes.map((n) => n.getAttribute('data-finder-item') ?? ''));
}

async function resultCountText(page: Page): Promise<number> {
  const text = await page.locator('#reports [aria-live="polite"]').first().textContent();
  const match = text?.match(/\d+/);
  if (!match) throw new Error(`could not read a result count from "${text}"`);
  return Number(match[0]);
}

// ─────────────────────────────────────────────────────────────────────────
// Step 1 — functional table (spec §9.3, plan Task 4 Step 1)
// ─────────────────────────────────────────────────────────────────────────

test.describe('Homepage Quick Finder — functional', () => {
  test.use({ javaScriptEnabled: true });

  test('limit: every market homepage shows between 1 and 6 Finder cards', async ({ page }) => {
    for (const path of HOME_PATHS) {
      await gotoHome(page, path);
      const count = await finderCards(page).count();
      expect(count, `${path}: Finder card count out of [1,6]`).toBeGreaterThanOrEqual(1);
      expect(count, `${path}: Finder card count out of [1,6]`).toBeLessThanOrEqual(6);
    }
  });

  test('local query: typing changes the visible result count and never touches the homepage URL', async ({
    page,
  }) => {
    await gotoHome(page, '/');
    const before = await finderCards(page).count();

    await page.getByRole('searchbox', { name: SEARCH_LABEL }).fill('schwab');
    await expect(page.locator('#reports [aria-live="polite"]').first()).toContainText(/result/);

    const after = await finderCards(page).count();
    expect(after).not.toBe(before);
    // The URL contract: local-only state, never a router/URL write.
    await expect(page).toHaveURL(/^http:\/\/[^/]+\/$|^https:\/\/[^/]+\/$/);
  });

  test('category: toggling a chip leaves only cards of that category, and the URL still does not change', async ({
    page,
  }) => {
    await gotoHome(page, '/');
    await page.locator('#reports').getByRole('button', { name: 'Trading Platforms', exact: true }).click();

    const count = await finderCards(page).count();
    expect(count).toBeGreaterThan(0);
    // Each card's own category label — the FIRST <p> in the card
    // (QuickFinder.tsx: categoryConfig[item.category].name, rendered before
    // the title) — must read exactly "Trading Platforms" for every visible
    // card, independent of the tracked/announced count.
    const labels = await page
      .locator('#reports [data-finder-item]')
      .evaluateAll((nodes) => nodes.map((n) => n.querySelector('p')?.textContent?.trim() ?? ''));
    expect(labels).toHaveLength(count);
    for (const label of labels) {
      expect(label).toBe('Trading Platforms');
    }
    await expect(page).toHaveURL(/^http:\/\/[^/]+\/$|^https:\/\/[^/]+\/$/);
  });

  test('view all: an active query AND category produce an href with exactly those two non-empty params', async ({
    page,
  }) => {
    await gotoHome(page, '/');
    await page.getByRole('searchbox', { name: SEARCH_LABEL }).fill('schwab');
    await page.locator('#reports').getByRole('button', { name: 'Trading Platforms', exact: true }).click();

    const cta = page.getByRole('link', { name: /view all research/i });
    await expect(cta).toHaveAttribute('href', '/research?q=schwab&category=trading');
  });

  test('review: clicking a review-backed card navigates to its own review href (200)', async ({ page, request }) => {
    await gotoHome(page, '/');
    const firstReviewCard = page.locator('#reports [data-finder-item^="review:"]').first();
    await expect(firstReviewCard).toBeVisible();
    const expectedHref = (await firstReviewCard.getAttribute('data-finder-item'))!.replace(/^review:/, '');

    await firstReviewCard.getByRole('link').first().click();
    await expect(page).toHaveURL(new RegExp(`${expectedHref.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`));

    const res = await request.get(expectedHref);
    expect(res.status(), `${expectedHref} did not resolve 200`).toBe(200);
  });

  test('Cockpit-only: clicking an unmatched dossier card goes to the prefiltered Research hub, never the Cockpit', async ({
    page,
    request,
  }) => {
    await gotoHome(page, '/');
    await page.getByRole('searchbox', { name: SEARCH_LABEL }).fill(CREDIT_REPAIR_ONLY.query);

    const card = page.locator(`#reports [data-finder-item="product:us:${CREDIT_REPAIR_ONLY.category}:${CREDIT_REPAIR_ONLY.productSlug}"]`);
    await expect(card).toBeVisible();
    const href = await card.locator('a').first().getAttribute('href');
    expect(href).toBe('/research?type=dossier&topic=companies&q=Sky+Blue+Credit');

    await card.locator('a').first().click();
    await expect(page).toHaveURL(/\/research\?type=dossier&topic=companies&q=Sky\+Blue\+Credit/);
    // Never the Cockpit (Best-X compare page) directly.
    expect(page.url()).not.toContain('/best/companies');

    const res = await request.get(href!);
    expect(res.status(), `${href} did not resolve 200`).toBe(200);
  });

  test('reset: filters then reset returns exactly the default result IDs', async ({ page }) => {
    await gotoHome(page, '/');
    const defaultIds = await finderCardIds(page);

    await page.getByRole('searchbox', { name: SEARCH_LABEL }).fill('schwab');
    await page.locator('#reports').getByRole('button', { name: 'Trading Platforms', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Reset' })).toBeVisible();

    await page.getByRole('button', { name: 'Reset' }).click();
    const restoredIds = await finderCardIds(page);
    expect(restoredIds).toEqual(defaultIds);
  });

  test('live region: a query change updates the polite result-count announcement', async ({ page }) => {
    await gotoHome(page, '/');
    const before = await resultCountText(page);

    await page.getByRole('searchbox', { name: SEARCH_LABEL }).fill('zzz-nonexistent-broker-xyz-987');
    await expect(page.locator('#reports [aria-live="polite"]').first()).toContainText('0 results');

    const after = await resultCountText(page);
    expect(after).not.toBe(before);
    expect(after).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// Adversarial cases (operator obligation #3) — real production data only.
// ─────────────────────────────────────────────────────────────────────────

test.describe('Homepage Quick Finder — adversarial cases', () => {
  test.use({ javaScriptEnabled: true });

  test('zero matches: a nonsense query renders the empty state, not a crash or stale cards', async ({ page }) => {
    await gotoHome(page, '/');
    await page.getByRole('searchbox', { name: SEARCH_LABEL }).fill('zzz-nonexistent-broker-xyz-987');
    await expect(page.getByText('No matches yet — try a different search or browse all research.')).toBeVisible();
    expect(await finderCards(page).count()).toBe(0);
    // The CTA still resolves — an empty result set is not a dead end.
    await expect(page.getByRole('link', { name: /view all research/i })).toHaveAttribute(
      'href',
      '/research?q=zzz-nonexistent-broker-xyz-987',
    );
  });

  // ADVERSARIAL CASE — multi-context item: DELIBERATELY UNIT-ONLY.
  // A multi-context DiscoveryItem requires one product to qualify in TWO
  // topics WITHIN THE SAME category (a DiscoveryItem's `category` is
  // singular — lib/research/catalog-shell-logic.ts's DiscoveryItem shape —
  // so two topics in DIFFERENT categories, like the credit-repair/debt-relief
  // pair below, produce two separate items, not one multi-context item).
  // Every BEST_X_MANIFEST entry (lib/comparison/topics/manifest.ts) was
  // inspected across all four markets (us/uk/ca/au) before writing this
  // comment: no category in the live manifest currently has more than ONE
  // topic. There is therefore no live product today that could honestly
  // produce a multi-context DiscoveryItem — staging one here would require
  // writing fabricated catalog data into a real page response, which the
  // operator's instructions explicitly forbid ("do NOT stage a fake browser
  // scenario"). This case is fully proven at the unit level instead:
  // __tests__/unit/research-catalog-shell-logic.test.ts, "keeps a
  // multi-context cockpit-only item as a single result and hrefs its first
  // (manifest-order) context" (a synthetic two-topic fixture, since no real
  // one exists) — asserting exactly the invariant this case cares about:
  // ONE Finder result, hrefed off the first (manifest-order) context.

  // Two products sharing the SAME bare topic string ("companies") in
  // different categories — the live pair named by the operator. Verified
  // live via the running dev server before being hardcoded here (both
  // render as cockpit-only "In verification" cards with no review).
  test('two products sharing a topic in different categories resolve to two distinct, correct hub URLs', async ({
    page,
    request,
  }) => {
    await gotoHome(page, '/');

    await page.getByRole('searchbox', { name: SEARCH_LABEL }).fill(CREDIT_REPAIR_ONLY.query);
    const creditCard = page.locator(
      `#reports [data-finder-item="product:us:${CREDIT_REPAIR_ONLY.category}:${CREDIT_REPAIR_ONLY.productSlug}"]`,
    );
    await expect(creditCard).toBeVisible();
    const creditHref = await creditCard.locator('a').first().getAttribute('href');
    expect(creditHref).toBe('/research?type=dossier&topic=companies&q=Sky+Blue+Credit');

    await page.getByRole('searchbox', { name: SEARCH_LABEL }).fill(DEBT_RELIEF_ONLY.query);
    const debtCard = page.locator(
      `#reports [data-finder-item="product:us:${DEBT_RELIEF_ONLY.category}:${DEBT_RELIEF_ONLY.productSlug}"]`,
    );
    await expect(debtCard).toBeVisible();
    const debtHref = await debtCard.locator('a').first().getAttribute('href');
    expect(debtHref).toBe('/research?type=dossier&topic=companies&q=Accredited+Debt+Relief');

    expect(creditHref).not.toBe(debtHref);

    // Both destinations genuinely resolve (200) — checked against the raw,
    // no-JS server response, same witness the crawlability describe block
    // below uses. This raw response intentionally carries the BROADER,
    // UNFILTERED catalog fallback (spec §8: "der serverseitige Fallback
    // trägt die SEO-Last" — BrowseFallback, components/research/
    // ResearchHubPage.tsx, renders before the `q`/`topic` filter is ever
    // applied, by design, so a crawler still sees the whole catalog even
    // without JS) — so it is the wrong witness for "shows the right,
    // disambiguated product and not the other one" and is deliberately NOT
    // used for that half of this test.
    const creditRes = await request.get(creditHref!);
    expect(creditRes.status(), `${creditHref} did not resolve 200`).toBe(200);
    const debtRes = await request.get(debtHref!);
    expect(debtRes.status(), `${debtHref} did not resolve 200`).toBe(200);

    // The disambiguation proof itself belongs to the HYDRATED client filter
    // (DiscoveryFilters/projectDiscoveryItems — a client-side concern, see
    // lib/research/catalog-shell-logic.ts), so it is checked here through a
    // real browser navigation with JS enabled (this describe block's own
    // `test.use`), not the raw fetch above.
    await page.goto(creditHref!);
    // "1 result" is rendered twice (a visible span plus its sr-only
    // aria-live twin) — `.first()` avoids a strict-mode multi-match error.
    await expect(page.getByText('1 result', { exact: true }).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Sky Blue Credit', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Accredited Debt Relief', exact: true })).toHaveCount(0);

    await page.goto(debtHref!);
    await expect(page.getByText('1 result', { exact: true }).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Accredited Debt Relief', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Sky Blue Credit', exact: true })).toHaveCount(0);
  });

  test('market switch: the Finder on /uk hands off to /uk/research, never the US hub', async ({ page }) => {
    await gotoHome(page, '/uk');
    const cta = page.getByRole('link', { name: /view all research/i });
    const href = await cta.getAttribute('href');
    expect(href).toMatch(/^\/uk\/research/);
    expect(href).not.toMatch(/^\/research/);

    await cta.click();
    await expect(page).toHaveURL(/\/uk\/research/);
  });

  test('empty filters: the default (no query, no category) view-all CTA omits both params entirely', async ({
    page,
  }) => {
    await gotoHome(page, '/');
    const cta = page.getByRole('link', { name: /view all research/i });
    await expect(cta).toHaveAttribute('href', '/research');
  });
});

// ─────────────────────────────────────────────────────────────────────────
// Step 2 — Finder analytics on the wire (research_v1, surface: 'finder')
// ─────────────────────────────────────────────────────────────────────────

test.describe('Homepage Quick Finder — research_v1 analytics (surface: finder)', () => {
  test.use({ javaScriptEnabled: true });

  let batches: TrackedBatch[];

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'sendBeacon', { value: () => false, configurable: true });
    });
    batches = await interceptTrack(page);
    await gotoHome(page, '/');
  });

  test('a settled search sends surface:finder, the query LENGTH and the result count — never the query', async ({
    page,
  }) => {
    await page.getByRole('searchbox', { name: SEARCH_LABEL }).fill('schwab');
    const renderedCount = await finderCards(page).count();
    await expect.poll(() => named(batches, 'research_search').length).toBeGreaterThan(0);

    const events = named(batches, 'research_search');
    expect(events).toHaveLength(1);
    expect(props(events[0]).queryLength).toBe(6);
    expect(props(events[0]).resultCount).toBe(renderedCount);
    expect(props(events[0]).surface).toBe('finder');
    expect(props(events[0]).schemaVersion).toBe('research_v1');
    expect(props(events[0]).market).toBe('us');
    expect(JSON.stringify(events[0]).toLowerCase()).not.toContain('schwab');
  });

  // PR 5 gap-close (9c3fbc4) click-wiring proof — requirement 5.
  test('the Category chip sends facet:category, surface:finder and the resulting count', async ({ page }) => {
    await page.locator('#reports').getByRole('button', { name: 'Trading Platforms', exact: true }).click();
    const renderedCount = await finderCards(page).count();
    await expect.poll(() => named(batches, 'research_filter_change').length).toBeGreaterThan(0);

    const event = named(batches, 'research_filter_change')[0];
    expect(props(event).facet).toBe('category');
    expect(props(event).value).toBe('trading');
    expect(props(event).active).toBe(true);
    expect(props(event).resultCount).toBe(renderedCount);
    expect(props(event).surface).toBe('finder');
  });

  test('the main "View all" CTA fires trigger:view_all with the resultCount visible at click time', async ({
    page,
  }) => {
    await page.getByRole('searchbox', { name: SEARCH_LABEL }).fill('trading');
    const visibleAtClick = await finderCards(page).count();

    await page.getByRole('link', { name: /view all research/i }).click();
    await expect.poll(() => named(batches, 'research_finder_cta').length).toBeGreaterThan(0);

    const event = named(batches, 'research_finder_cta')[0];
    expect(props(event).trigger).toBe('view_all');
    expect(props(event).surface).toBe('finder');
    expect(props(event).resultCount).toBe(visibleAtClick);
    expect(props(event).topic).toBe('hub');
  });

  test('a Cockpit-only card fires trigger:dossier_item with its real topic, category and productSlug', async ({
    page,
  }) => {
    await page.getByRole('searchbox', { name: SEARCH_LABEL }).fill(CREDIT_REPAIR_ONLY.query);
    const card = page.locator(
      `#reports [data-finder-item="product:us:${CREDIT_REPAIR_ONLY.category}:${CREDIT_REPAIR_ONLY.productSlug}"]`,
    );
    await expect(card).toBeVisible();
    await card.locator('a').first().click();

    await expect.poll(() => named(batches, 'research_finder_cta').length).toBeGreaterThan(0);
    const event = named(batches, 'research_finder_cta')[0];
    expect(props(event).trigger).toBe('dossier_item');
    expect(props(event).surface).toBe('finder');
    expect(props(event).productSlug).toBe(CREDIT_REPAIR_ONLY.productSlug);
    expect(props(event).kind).toBe('dossier');
    expect(props(event).topic).toBe('companies');
    expect(props(event).category).toBe(CREDIT_REPAIR_ONLY.category);
  });

  test('a review-backed card click sends research_review_click with kind:review, surface:finder', async ({
    page,
  }) => {
    const firstReviewCard = page.locator('#reports [data-finder-item^="review:"]').first();
    await expect(firstReviewCard).toBeVisible();
    await firstReviewCard.getByRole('link').first().click();

    await expect.poll(() => named(batches, 'research_review_click').length).toBeGreaterThan(0);
    const event = named(batches, 'research_review_click')[0];
    expect(props(event).kind).toBe('review');
    expect(props(event).surface).toBe('finder');
    expect(typeof props(event).productSlug).toBe('string');
    expect(props(event).position).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// WCAG 2.2 AA — default and filtered Finder states
// ─────────────────────────────────────────────────────────────────────────

test.describe('Homepage Quick Finder — WCAG 2.2 AA', () => {
  test.use({ javaScriptEnabled: true });

  const AXE_PATH = require.resolve('axe-core/axe.min.js');
  const WCAG_AA_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

  interface AxeViolation {
    id: string;
    impact: string | null;
    help: string;
    nodes: Array<{ target: string[]; failureSummary?: string }>;
  }

  // Scoped to `#reports` — the Quick Finder section this task actually
  // ships — deliberately, not `document`. The homepage around it (header,
  // hero, footer market-switcher, etc.) carries its own pre-existing a11y
  // debt unrelated to this feature (verified: a `document`-wide scan here
  // reports color-contrast findings on footer market links that have
  // nothing to do with the Finder and are unchanged by this PR). Scoping to
  // the actual surface under test is what research-a11y.spec.ts's own
  // `document`-wide scan gets for free by being the ONLY content on
  // `/research` — the homepage has no such luxury.
  async function analyze(page: Page): Promise<AxeViolation[]> {
    await page.addStyleTag({
      content: '*, *::before, *::after { transition: none !important; animation: none !important; }',
    });
    await page.addScriptTag({ path: AXE_PATH });
    return page.evaluate(async (tags) => {
      // @ts-expect-error — axe is injected into the page, not bundled.
      const results = await window.axe.run('#reports', {
        runOnly: { type: 'tag', values: tags },
        resultTypes: ['violations'],
      });
      return results.violations.map((v: AxeViolation) => ({
        id: v.id,
        impact: v.impact,
        help: v.help,
        nodes: v.nodes.map((n) => ({ target: n.target, failureSummary: n.failureSummary })),
      }));
    }, WCAG_AA_TAGS);
  }

  function format(violations: AxeViolation[]): string {
    return violations
      .map(
        (v) =>
          `\n  [${v.impact ?? 'unknown'}] ${v.id} — ${v.help} (${v.nodes.length} element(s))\n` +
          v.nodes.map((n) => `      at ${n.target.join(' ')}`).join('\n'),
      )
      .join('');
  }

  test('the default homepage has no serious/critical violations', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await gotoHome(page, '/');

    const violations = (await analyze(page)).filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(violations, `axe found ${violations.length} serious/critical violation(s):${format(violations)}`).toEqual(
      [],
    );
  });

  test('the filtered Finder state has no serious/critical violations', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await gotoHome(page, '/');
    await page.getByRole('searchbox', { name: SEARCH_LABEL }).fill('trading');
    await page.locator('#reports').getByRole('button', { name: 'Trading Platforms', exact: true }).click();

    const violations = (await analyze(page)).filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(violations, `axe found ${violations.length} serious/critical violation(s):${format(violations)}`).toEqual(
      [],
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────
// Crawlability — JavaScript DISABLED (the Playwright config's global
// default, playwright.config.ts's `use.javaScriptEnabled: false`). No
// `test.use({ javaScriptEnabled: true })` anywhere in this describe block —
// same rule e2e/research-raw-html.spec.ts documents at its own file header.
// ─────────────────────────────────────────────────────────────────────────

test.describe('Homepage — raw HTML crawlability (JavaScript disabled)', () => {
  test('every market homepage renders real review hrefs in raw server HTML', async ({ request }) => {
    for (const path of HOME_PATHS) {
      const response = await request.get(path);
      expect(response.status(), `${path} did not return 200`).toBe(200);
      const html = await response.text();

      const sectionMatch = html.match(/<section[^>]*id="reports"[\s\S]*?<\/section>/);
      expect(sectionMatch, `${path}: #reports section missing from raw HTML`).not.toBeNull();
      const section = sectionMatch![0];

      const reviewHrefs = [...section.matchAll(/data-finder-item="review:([^"]+)"/g)].map((m) => m[1]);
      expect(reviewHrefs.length, `${path}: no review-backed Finder cards in raw HTML`).toBeGreaterThan(0);

      for (const href of reviewHrefs) {
        expect(section, `${path}: missing real <a href="${href}"> in raw HTML`).toContain(`href="${href}"`);
      }
    }
  });

  test('a sampled Finder review href is genuinely navigable (200) with JavaScript still disabled', async ({
    request,
  }) => {
    const response = await request.get('/');
    const html = await response.text();
    const sectionMatch = html.match(/<section[^>]*id="reports"[\s\S]*?<\/section>/);
    const reviewHrefs = [...sectionMatch![0].matchAll(/data-finder-item="review:([^"]+)"/g)].map((m) => m[1]);
    const middle = reviewHrefs[Math.floor(reviewHrefs.length / 2)];

    const res = await request.get(middle);
    expect(res.status(), `${middle} did not return 200`).toBe(200);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// Step 4 — Core Web Vitals: homepage LCP/CLS vs the PR base build.
// Reuses the PerformanceObserver pattern from e2e/research-a11y.spec.ts.
//
// BASELINE_LCP_MS was measured against commit c708acb (the PR 3 base, "feat
// (research): universal market research hubs (#122)") on THIS machine, same
// 1280x800 viewport, `next start` (not `next dev`), homepage warmed by two
// prior requests before sampling — same methodology this test itself uses.
// Five consecutive warm samples: 128, 132, 144, 120, 120 ms; 144 (the
// highest, i.e. most conservative real sample) was kept as the baseline
// rather than an optimistic low one, so this gate is not tripped by ordinary
// machine-load jitter. audits/reports/research-discovery-pr3.md records the
// full sample set for both base and head.
// ─────────────────────────────────────────────────────────────────────────

const BASELINE_LCP_MS = 144;

test.describe('Homepage — Core Web Vitals budget vs PR base', () => {
  test.use({ javaScriptEnabled: true });

  test('LCP is under 2.5s, within 10% of the PR-base baseline, and CLS is under 0.1', async ({ page, request }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    // Warm the server (RSC render caches) exactly like the baseline
    // methodology, so this is an apples-to-apples comparison.
    await request.get('/');
    await request.get('/');

    await page.addInitScript(() => {
      const w = window as unknown as { __lcp: number; __cls: number };
      w.__lcp = 0;
      w.__cls = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) w.__lcp = entry.startTime;
      }).observe({ type: 'largest-contentful-paint', buffered: true });
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const shift = entry as PerformanceEntry & { value: number; hadRecentInput: boolean };
          if (!shift.hadRecentInput) w.__cls += shift.value;
        }
      }).observe({ type: 'layout-shift', buffered: true });
    });

    await seedCookieConsent(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const { lcp, cls } = await page.evaluate(() => {
      const w = window as unknown as { __lcp: number; __cls: number };
      return { lcp: w.__lcp, cls: w.__cls };
    });

    expect(lcp, 'no LCP candidate was observed — the measurement is invalid').toBeGreaterThan(0);
    expect(lcp, `LCP ${Math.round(lcp)}ms exceeds the 2500ms budget`).toBeLessThanOrEqual(2500);
    expect(
      lcp,
      `LCP ${Math.round(lcp)}ms exceeds 110% of the ${BASELINE_LCP_MS}ms PR-base baseline`,
    ).toBeLessThanOrEqual(BASELINE_LCP_MS * 1.1);
    expect(cls, `CLS ${cls.toFixed(4)} exceeds the 0.1 budget`).toBeLessThan(0.1);

    console.log(`  / lab vitals (head) — LCP ${Math.round(lcp)}ms · CLS ${cls.toFixed(4)}`);
  });
});
