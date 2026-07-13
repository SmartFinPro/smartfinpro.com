// e2e/tool-shell-wealth-horizon.spec.ts
// Wealth Horizon v2 — Live-Workspace, all 4 markets (FDL WH-v2, registry-
// driven so a future 5th variant is picked up automatically).
//
// JS-off (Playwright global default), per market: the Worked Example must be
// fully present in server HTML (H1, "Example result" chip, Hero headline,
// answer sentence, Lifetime Path SVG with the retirement-zone label, at
// least one milestone chip, exactly 3 levers, AssumptionsDrawer sources,
// exactly 1 NextBestAction), robots noindex, the binding wording ("in
// today's money", "Illustrative retirement withdrawal") present, the
// negative wording list (shared FORBIDDEN_WORDS, SPEC 8.3) absent anywhere
// in the HTML, the route excluded from the sitemap, and market-specific
// terms present (AU: "12%" + "$32,500"; UK: "ISA"/"SIPP" + "£"; CA: "TFSA"/
// "RRSP" + "personal room").
//
// Hub-hiddenness (registry-driven, all 4 hubs + footer + llms.txt): none of
// the 4 Wealth Horizon routes may appear on /tools, /uk/tools, /ca/tools,
// /au/tools, in the footer, or in llms.txt.
//
// JS-on (test.use, US-only): the Live-Workspace has NO step flow — every
// field is visible and live from the first paint. A slider change flips the
// state chip to "Your result" and fires tool_input_change; the scenario
// switcher fires tool_scenario_compare; the hover overlay mounts without
// breaking anything JS-off already asserted.
//
// Run:  npx playwright test e2e/tool-shell-wealth-horizon.spec.ts
//       BASE_URL=http://localhost:3007 npx playwright test e2e/tool-shell-wealth-horizon.spec.ts

import { test, expect, type Page } from '@playwright/test';
import { getAllVariants, getHubPathForMarket } from '@/lib/tools/registry';
import { FORBIDDEN_WORDS } from '@/lib/tools/results/wealth-horizon-result';

const PAGE_PATH = '/tools/retirement-calculator';

interface MarketCase {
  market: 'us' | 'uk' | 'ca' | 'au';
  path: string;
  h1: string;
  /** Source domain that MUST appear in the AssumptionsDrawer sources HTML
   *  (omit for CA — its Wealth Horizon variant only pulls the shared,
   *  smartfinpro.com-hosted editorial assumption rules). */
  sourceDomain?: string;
  /** Market-specific terms that must appear somewhere in the page HTML. */
  marketTerms: string[];
}

const CASES: MarketCase[] = [
  {
    market: 'us',
    path: '/tools/retirement-calculator',
    h1: 'Retirement & Financial Freedom Calculator',
    sourceDomain: 'irs.gov',
    marketTerms: [],
  },
  {
    market: 'uk',
    path: '/uk/tools/pension-calculator',
    h1: 'Pension & Financial Freedom Calculator',
    sourceDomain: 'gov.uk',
    marketTerms: ['ISA', 'SIPP', '£'],
  },
  {
    market: 'ca',
    path: '/ca/tools/retirement-calculator',
    h1: 'Retirement & Financial Freedom Calculator',
    marketTerms: ['TFSA', 'RRSP', 'personal room'],
  },
  {
    market: 'au',
    path: '/au/tools/retirement-calculator',
    h1: 'Retirement & Financial Freedom Calculator',
    marketTerms: ['12%', '$32,500'],
  },
];

// fs-parity guard: fail loud if the registry ever adds/removes a
// wealth-horizon variant without this spec's CASES table being updated too.
test('CASES table covers exactly the registry\'s wealth-horizon variants', () => {
  const registryPaths = getAllVariants()
    .filter((v) => v.toolId === 'wealth-horizon')
    .map((v) => v.path)
    .sort();
  expect(CASES.map((c) => c.path).sort()).toEqual(registryPaths);
});

interface TrackedBatch {
  type: string;
  sessionId: string;
  data: { events?: Array<Record<string, unknown>> };
}

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

function toolEvents(batches: TrackedBatch[]): Array<Record<string, unknown>> {
  return batches.filter((b) => b.type === 'tool_event_batch').flatMap((b) => b.data.events ?? []);
}

for (const c of CASES) {
  test.describe(`Wealth Horizon ${c.market.toUpperCase()} (JS off): ${c.path}`, () => {
    test('Worked Example — Live-Workspace is fully present in server HTML, noindex, wording contracts hold', async ({ page }) => {
      const response = await page.goto(c.path);
      expect(response?.status()).toBeLessThan(400);

      // H1
      await expect(page.locator('h1')).toHaveText(c.h1);

      // "Example result" chip (Worked Example, resultState 'example')
      await expect(page.locator('.result-chip').first()).toContainText('Example result');

      // Hero headline + answer sentence (no step flow — visible immediately)
      await expect(page.locator('#wealth-horizon-result h2').first()).not.toBeEmpty();
      await expect(page.locator('#wealth-horizon-result .answer').first()).not.toBeEmpty();

      // Lifetime Path SVG (accumulation + decumulation phases in one chart)
      const svg = page.locator('#wealth-horizon-result svg[role="img"]').first();
      await expect(svg).toBeVisible();
      await expect(svg).toContainText('Retirement');

      // At least one milestone chip rendered from the Worked Example's balance path.
      const milestoneChips = page.locator('[data-testid="milestone-chip"]');
      expect(await milestoneChips.count()).toBeGreaterThan(0);

      // Exactly 3 levers (slot 4)
      await expect(page.locator('.levers button.lever')).toHaveCount(3);

      // AssumptionsDrawer sources present in HTML (native <details>, closed by
      // default — check content, not visibility)
      const assumptionsHtml = await page.locator('.assumptions').first().innerHTML();
      if (c.sourceDomain) expect(assumptionsHtml).toContain(c.sourceDomain);

      // Exactly 1 NextBestAction (slot 6)
      await expect(page.locator('.next-action a')).toHaveCount(1);

      // robots noindex (all 4 routes stay hidden until the separate launch PR)
      const robots = await page.locator('meta[name="robots"]').getAttribute('content').catch(() => null);
      expect(robots ?? '').toContain('noindex');

      // Binding wording (SPEC 8.3) — page.content() re-serializes the parsed
      // DOM, so HTML entities like &#x27; come back as plain apostrophes.
      const html = await page.content();
      expect(html).toContain("in today's money");
      expect(html.toLowerCase()).toContain('illustrative retirement withdrawal');

      // Negative wording list — nowhere on the page (shared constant).
      const lower = html.toLowerCase();
      for (const word of FORBIDDEN_WORDS) {
        expect(lower.includes(word), `found forbidden word "${word}"`).toBe(false);
      }

      // Market-specific terms
      for (const term of c.marketTerms) {
        expect(html.includes(term), `missing market term "${term}" on ${c.path}`).toBe(true);
      }
    });

    test('sitemap does not include the route (indexable:false)', async ({ request }) => {
      const res = await request.get('/sitemap.xml');
      const body = await res.text();
      expect(body).not.toContain(c.path);
    });
  });
}

test.describe('Wealth Horizon — hub-hiddenness ×4 (FDL 4.3)', () => {
  const HIDDEN_PATHS = CASES.map((c) => c.path);

  for (const market of ['us', 'uk', 'ca', 'au'] as const) {
    test(`${getHubPathForMarket(market)} does not link to any Wealth Horizon route`, async ({ page }) => {
      await page.goto(getHubPathForMarket(market));
      const hrefs = await page.locator('a[href]').evaluateAll((els) => els.map((el) => el.getAttribute('href') ?? ''));
      for (const hidden of HIDDEN_PATHS) {
        expect(hrefs.some((h) => h === hidden || h.endsWith(hidden)), `${hidden} linked from ${getHubPathForMarket(market)}`).toBe(false);
      }

      const footerHrefs = await page
        .locator('footer a[href]')
        .evaluateAll((els) => els.map((el) => el.getAttribute('href') ?? ''));
      for (const hidden of HIDDEN_PATHS) {
        expect(footerHrefs.some((h) => h === hidden || h.endsWith(hidden)), `${hidden} in footer on ${market}`).toBe(false);
      }
    });
  }

  test('llms.txt does not mention any Wealth Horizon route', async ({ request }) => {
    const res = await request.get('/llms.txt');
    const body = await res.text();
    for (const hidden of HIDDEN_PATHS) {
      expect(body.includes(hidden), `${hidden} present in /llms.txt`).toBe(false);
    }
  });
});

// ── US-only JS-on suite (Live-Workspace, FDL WH-v2) ─────────────────────
// Proves the wizard is gone: every field is visible and live from first
// paint, a slider change alone (no "Next"/"See my result" click anywhere)
// flips the result to "Your result" and fires analytics, the scenario
// switcher still fires tool_scenario_compare, and the hover overlay mounts
// without breaking anything the JS-off suite already asserted.
test.describe(`Wealth Horizon US (JS on) — Live-Workspace: ${PAGE_PATH}`, () => {
  test.use({ javaScriptEnabled: true });

  test.beforeEach(async ({ page }) => {
    // Force the fetch fallback so page.route sees every batch (sendBeacon
    // bodies aren't inspectable) — same pattern as the other tool_v1 specs.
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'sendBeacon', { value: () => false, configurable: true });
    });
  });

  test('no step flow — every input group is visible immediately, no "Next"/"See my result" button exists', async ({ page }) => {
    await page.goto(PAGE_PATH, { waitUntil: 'networkidle' });
    await expect(page.getByRole('button', { name: 'Next' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'See my result' })).toHaveCount(0);
    await expect(page.getByRole('textbox', { name: 'Your current age' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Your monthly contribution' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Withdrawal rate' })).toBeVisible();
    await expect(page.locator('#wealth-horizon-result .result-chip').first()).toContainText('Example result');
  });

  test('a single slider change flips the chip to "Your result" and fires tool_input_change', async ({ page }) => {
    const batches = await interceptTrack(page);
    await page.goto(PAGE_PATH, { waitUntil: 'networkidle' });

    // Keyboard-driven interaction fires real native input/change events on a
    // range input (Playwright's fill() is unreliable for type="range").
    const currentAgeSlider = page.getByRole('slider', { name: 'Your current age slider' });
    await currentAgeSlider.focus();
    await currentAgeSlider.press('ArrowRight');
    await currentAgeSlider.press('ArrowRight');

    await expect(page.locator('#wealth-horizon-result .result-chip').first()).toContainText('Your result');

    await page.waitForTimeout(1800); // 600ms input debounce + 800ms queue flush + buffer
    const events = toolEvents(batches);
    const change = events.find(
      (e) => e.eventName === 'tool_input_change' && (e.properties as Record<string, unknown> | undefined)?.inputKey === 'currentAge',
    );
    expect(change, 'tool_input_change for currentAge should have fired').toBeTruthy();
  });

  test('scenario switcher fires tool_scenario_compare and stays a "lens" over the live result', async ({ page }) => {
    const batches = await interceptTrack(page);
    await page.goto(PAGE_PATH, { waitUntil: 'networkidle' });

    await page.getByRole('group', { name: 'Scenario' }).getByRole('button', { name: 'Optimistic' }).click();
    await page.waitForTimeout(1200);

    const events = toolEvents(batches);
    const compare = events.find((e) => e.eventName === 'tool_scenario_compare');
    expect(compare, 'tool_scenario_compare should have fired').toBeTruthy();
    const props = (compare!.properties ?? {}) as Record<string, unknown>;
    expect(props.scenario).toBe('optimistic');
  });

  test('lever click fires tool_input_change with controlRole "lever"', async ({ page }) => {
    const batches = await interceptTrack(page);
    await page.goto(PAGE_PATH, { waitUntil: 'networkidle' });

    await page.locator('#wealth-horizon-result button.lever').first().click();
    await page.waitForTimeout(1800); // 600ms input debounce + 800ms queue flush + buffer

    const events = toolEvents(batches);
    const leverChange = events.find(
      (e) => e.eventName === 'tool_input_change' && (e.properties as Record<string, unknown> | undefined)?.controlRole === 'lever',
    );
    expect(leverChange, 'a tool_input_change with controlRole "lever" should have fired').toBeTruthy();
  });

  test('Simple mode never clamps an over-IRS-limit contribution — value stays, informational hint visible', async ({ page }) => {
    await page.goto(PAGE_PATH, { waitUntil: 'networkidle' });

    const contributionInput = page.getByRole('textbox', { name: 'Your monthly contribution' });
    await contributionInput.fill('50000'); // annual 600,000 — far beyond any US statutory limit
    await contributionInput.blur();

    await expect(contributionInput).toHaveValue('50000'); // NOT clamped
    const hint = page.getByTestId('contribution-hint');
    await expect(hint).toBeVisible();
    await expect(hint).toContainText('account-level limits may apply');
  });

  test('withdrawal rate is visibly adjustable, 2.5–5.0, from first paint (no step navigation needed)', async ({ page }) => {
    await page.goto(PAGE_PATH, { waitUntil: 'networkidle' });

    const withdrawalInput = page.getByRole('textbox', { name: 'Withdrawal rate' });
    await expect(withdrawalInput).toBeVisible();
    const withdrawalSlider = page.locator('input[type="range"][aria-label="Withdrawal rate slider"]');
    await expect(withdrawalSlider).toHaveAttribute('min', '2.5');
    await expect(withdrawalSlider).toHaveAttribute('max', '5');
  });

  test('hover overlay mounts on the chart without breaking layout or JS-off content', async ({ page }) => {
    await page.goto(PAGE_PATH, { waitUntil: 'networkidle' });
    const overlay = page.locator('.lifetime-chart-overlay').first();
    await expect(overlay).toBeAttached();
    // Still shows everything the JS-off suite asserts, even with the overlay mounted.
    await expect(page.locator('#wealth-horizon-result svg[role="img"]').first()).toBeVisible();
    await expect(page.locator('.levers button.lever')).toHaveCount(3);

    await overlay.hover();
    await expect(page.locator('.lifetime-chart-overlay [role="status"]')).toBeVisible();
  });
});
