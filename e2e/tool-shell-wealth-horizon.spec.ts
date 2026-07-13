// e2e/tool-shell-wealth-horizon.spec.ts
// Wealth Horizon v3 — Clean-Redesign (bindende Fable-Direktive nach
// User-Feedback: v2 war "viel zu unruhig und durcheinander"). All 4 markets
// (registry-driven so a future 5th variant is picked up automatically).
//
// JS-off (Playwright global default), per market: the Worked Example must be
// fully present in server HTML — H1, "Example result" chip, all 5 numbered
// steps (incl. the new "Expected inflation" step), the big hypothetical-
// balance number + "in today's money", the stacked contribution/growth bar
// chart with its "Your contributions"/"Growth" legend, the 2 summary tiles,
// exactly 3 levers, AssumptionsDrawer sources, exactly 1 NextBestAction,
// robots noindex, the binding wording ("in today's money", "illustrative
// retirement withdrawal"), the negative wording list (shared FORBIDDEN_WORDS)
// absent anywhere in the HTML, the route excluded from the sitemap, and
// market-specific terms present (AU: "12%" + "$32,500"; UK: "ISA"/"SIPP" +
// "£"; CA: "TFSA"/"RRSP" + "personal room").
//
// Hub-hiddenness (registry-driven, all 4 hubs + footer + llms.txt): unchanged
// from v2 — none of the 4 Wealth Horizon routes may appear on /tools,
// /uk/tools, /ca/tools, /au/tools, in the footer, or in llms.txt.
//
// JS-on (US-only): every numbered step is visible and live from first paint
// (no sliders anywhere in v3 — "Ruhe" design principle), a plain field edit
// flips the state chip to "Your result" and fires tool_input_change, a Step-4
// return-preset chip click ALSO flips to "Your result" (it's a real input
// change) but fires tool_scenario_compare instead, a lever click still fires
// tool_input_change with controlRole 'lever', Simple mode still never clamps,
// Advanced settings holds Annual fee/Withdrawal rate/benefit/detailed-accounts
// toggle, and the chart's hover overlay mounts without breaking anything
// JS-off already asserts.
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
    test('Worked Example — v3 Clean-Redesign is fully present in server HTML, noindex, wording contracts hold', async ({ page }) => {
      const response = await page.goto(c.path);
      expect(response?.status()).toBeLessThan(400);

      // H1
      await expect(page.locator('h1')).toHaveText(c.h1);

      // "Example result" chip (Worked Example, resultState 'example')
      await expect(page.locator('.result-chip').first()).toContainText('Example result');

      // 5 numbered steps, visible from first paint (no step flow, no sliders).
      const html = await page.content();
      expect(html).toContain('Starting amount');
      expect(html).toContain('Monthly contribution');
      expect(html).toContain('Your age today &amp; at retirement');
      expect(html).toContain('Expected annual return');
      expect(html).toContain('Expected inflation');
      expect(html.toLowerCase()).not.toContain('type="range"'); // no sliders anywhere in v3

      // Hero — big hypothetical-balance number + "in today's money" badge.
      await expect(page.locator('#wealth-horizon-result').getByText('Hypothetical balance at retirement')).toBeVisible();

      // The calm text line (item 3) carries the binding "illustrative
      // retirement withdrawal" wording.
      await expect(page.locator('#wealth-horizon-result .answer').first()).not.toBeEmpty();

      // Stacked contribution/growth bar chart + its 2-chip legend.
      const svg = page.locator('#wealth-horizon-result svg[role="img"]').first();
      await expect(svg).toBeVisible();
      expect(html).toContain('Your contributions');
      expect(html).toContain('Growth');

      // Exactly 2 summary tiles.
      expect(html).toContain('Total contributions');
      expect(html).toContain('Expected growth');

      // No more milestone chips / scenario switcher (v2 elements, removed).
      expect(await page.locator('[data-testid="milestone-chip"]').count()).toBe(0);
      expect(await page.getByRole('group', { name: 'Scenario' }).count()).toBe(0);

      // Exactly 3 levers (slot 4)
      await expect(page.locator('.levers button.lever')).toHaveCount(3);

      // AssumptionsDrawer sources present in HTML (native <details>, closed by
      // default — check content, not visibility)
      const assumptionsHtml = await page.locator('.assumptions').first().innerHTML();
      if (c.sourceDomain) expect(assumptionsHtml).toContain(c.sourceDomain);

      // Advanced settings (native <details>, closed by default) still holds
      // Annual fee / Withdrawal rate / the detailed-accounts toggle.
      const advancedHtml = await page.locator('.wh-advanced').first().innerHTML();
      expect(advancedHtml).toContain('Annual fee');
      expect(advancedHtml).toContain('Withdrawal rate');
      expect(advancedHtml).toContain('Switch to detailed accounts');

      // Exactly 1 NextBestAction (slot 6)
      await expect(page.locator('.next-action a')).toHaveCount(1);

      // robots noindex (all 4 routes stay hidden until the separate launch PR)
      const robots = await page.locator('meta[name="robots"]').getAttribute('content').catch(() => null);
      expect(robots ?? '').toContain('noindex');

      // Binding wording (SPEC 8.3) — page.content() re-serializes the parsed
      // DOM, so HTML entities like &#x27; come back as plain apostrophes.
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

// ── US-only JS-on suite (v3 Clean-Redesign) ─────────────────────────────
test.describe(`Wealth Horizon US (JS on) — v3 Clean-Redesign: ${PAGE_PATH}`, () => {
  test.use({ javaScriptEnabled: true });

  test.beforeEach(async ({ page }) => {
    // Force the fetch fallback so page.route sees every batch (sendBeacon
    // bodies aren't inspectable) — same pattern as the other tool_v1 specs.
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'sendBeacon', { value: () => false, configurable: true });
    });
  });

  test('no step flow, no sliders — every numbered step is visible immediately', async ({ page }) => {
    await page.goto(PAGE_PATH, { waitUntil: 'networkidle' });
    await expect(page.getByRole('button', { name: 'Next' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'See my result' })).toHaveCount(0);
    await expect(page.getByRole('slider')).toHaveCount(0);
    await expect(page.getByRole('textbox', { name: 'Starting amount' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Monthly contribution' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Today' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Retirement' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Expected annual return' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Expected inflation' })).toBeVisible();
    await expect(page.locator('#wealth-horizon-result .result-chip').first()).toContainText('Example result');
  });

  test('a plain field edit flips the chip to "Your result" and fires tool_input_change', async ({ page }) => {
    const batches = await interceptTrack(page);
    await page.goto(PAGE_PATH, { waitUntil: 'networkidle' });

    const currentAgeInput = page.getByRole('textbox', { name: 'Today' });
    await currentAgeInput.fill('32');
    await currentAgeInput.blur();

    await expect(page.locator('#wealth-horizon-result .result-chip').first()).toContainText('Your result');

    await page.waitForTimeout(1800); // 600ms input debounce + 800ms queue flush + buffer
    const events = toolEvents(batches);
    const change = events.find(
      (e) => e.eventName === 'tool_input_change' && (e.properties as Record<string, unknown> | undefined)?.inputKey === 'currentAge',
    );
    expect(change, 'tool_input_change for currentAge should have fired').toBeTruthy();
  });

  test('a Step-4 return-preset chip fires tool_scenario_compare AND flips the chip to "Your result" (it is a real input change)', async ({ page }) => {
    const batches = await interceptTrack(page);
    await page.goto(PAGE_PATH, { waitUntil: 'networkidle' });

    await page.getByRole('button', { name: 'Optimistic 9%' }).click();
    await expect(page.locator('#wealth-horizon-result .result-chip').first()).toContainText('Your result');

    await page.waitForTimeout(1200);
    const events = toolEvents(batches);
    const compare = events.find((e) => e.eventName === 'tool_scenario_compare');
    expect(compare, 'tool_scenario_compare should have fired').toBeTruthy();
    expect((compare!.properties as Record<string, unknown>).scenario).toBe('optimistic');
  });

  test('the "Balanced 7.5%" chip is active by default (untouched defaults match its value)', async ({ page }) => {
    await page.goto(PAGE_PATH, { waitUntil: 'networkidle' });
    await expect(page.getByRole('button', { name: 'Balanced 7.5%' })).toHaveAttribute('aria-pressed', 'true');
  });

  test('typing a custom return value fires a plain tool_input_change (not tool_scenario_compare)', async ({ page }) => {
    const batches = await interceptTrack(page);
    await page.goto(PAGE_PATH, { waitUntil: 'networkidle' });

    const returnInput = page.getByRole('textbox', { name: 'Expected annual return' });
    await returnInput.fill('6.2');
    await returnInput.blur();
    await page.waitForTimeout(1800);

    const events = toolEvents(batches);
    const change = events.find(
      (e) => e.eventName === 'tool_input_change' && (e.properties as Record<string, unknown> | undefined)?.inputKey === 'returnNominalPct',
    );
    expect(change, 'tool_input_change for returnNominalPct should have fired').toBeTruthy();
    expect(events.some((e) => e.eventName === 'tool_scenario_compare')).toBe(false);
  });

  test('changing the inflation field changes the hero balance number', async ({ page }) => {
    await page.goto(PAGE_PATH, { waitUntil: 'networkidle' });
    const heroBefore = await page.locator('#wealth-horizon-result').getByText(/^\$[\d,]+$/).first().textContent();

    const inflationInput = page.getByRole('textbox', { name: 'Expected inflation' });
    await inflationInput.fill('4.5');
    await inflationInput.blur();
    await page.waitForTimeout(300);

    const heroAfter = await page.locator('#wealth-horizon-result').getByText(/^\$[\d,]+$/).first().textContent();
    expect(heroAfter).not.toBe(heroBefore);
  });

  test('an out-of-range real return (nominal − inflation) shows the clamp warning', async ({ page }) => {
    await page.goto(PAGE_PATH, { waitUntil: 'networkidle' });

    const returnInput = page.getByRole('textbox', { name: 'Expected annual return' });
    await returnInput.fill('1');
    await returnInput.blur();
    const inflationInput = page.getByRole('textbox', { name: 'Expected inflation' });
    await inflationInput.fill('5');
    await inflationInput.blur();

    await expect(page.getByTestId('real-return-clamp-warning')).toBeVisible();
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

    const contributionInput = page.getByRole('textbox', { name: 'Monthly contribution' });
    await contributionInput.fill('50000'); // annual 600,000 — far beyond any US statutory limit
    await contributionInput.blur();

    await expect(contributionInput).toHaveValue('50000'); // NOT clamped
    const hint = page.getByTestId('contribution-hint');
    await expect(hint).toBeVisible();
    await expect(hint).toContainText('account-level limits may apply');
  });

  test('Advanced settings expands to reveal Annual fee, Withdrawal rate and the detailed-accounts toggle', async ({ page }) => {
    await page.goto(PAGE_PATH, { waitUntil: 'networkidle' });
    await page.getByText('Advanced settings').click();

    await expect(page.getByRole('textbox', { name: 'Annual fee' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Withdrawal rate' })).toBeVisible();
    await expect(page.getByText('Switch to detailed accounts →')).toBeVisible();
  });

  test('hover overlay mounts on the chart without breaking layout or JS-off content', async ({ page }) => {
    await page.goto(PAGE_PATH, { waitUntil: 'networkidle' });
    const overlay = page.locator('.contribution-growth-chart-overlay').first();
    await expect(overlay).toBeAttached();
    // Still shows everything the JS-off suite asserts, even with the overlay mounted.
    await expect(page.locator('#wealth-horizon-result svg[role="img"]').first()).toBeVisible();
    await expect(page.locator('.levers button.lever')).toHaveCount(3);

    await overlay.hover();
    await expect(page.locator('.contribution-growth-chart-overlay [role="status"]')).toBeVisible();
  });
});
