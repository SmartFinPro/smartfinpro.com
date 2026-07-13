// e2e/tool-shell-wealth-horizon.spec.ts
// Wealth Horizon v4 — consistent slider-only Normal-mode input surface
// (bindende User-Direktive 13.07.2026, superseding v3's "no sliders
// anywhere" rule for Normal mode). All 4 markets (registry-driven so a
// future 5th variant is picked up automatically).
//
// JS-off (Playwright global default), per market: the Worked Example must be
// fully present in server HTML — H1, "Example result" chip, all 5 numbered
// steps (incl. "Expected inflation" and the Step-2 escalation slider), the
// big hypothetical-balance number + "in today's money", the stacked
// contribution/growth bar chart with its "Your contributions"/"Growth"
// legend, the 2 summary tiles, exactly 3 levers, AssumptionsDrawer sources,
// exactly 1 NextBestAction, robots noindex, the binding wording ("in today's
// money", "illustrative retirement withdrawal"), the negative wording list
// (shared FORBIDDEN_WORDS) absent anywhere in the HTML, the route excluded
// from the sitemap, and market-specific terms present (AU: "12%" + "$32,500";
// UK: "ISA"/"SIPP" + "£"; CA: "TFSA"/"RRSP" + "personal room"). Every Normal-
// mode field is now a native <input type="range"> with correct
// min/max/step/aria-valuetext, rendered server-side (v4's SPEC-Regel-7
// deviation — see wealth-horizon-live.tsx's header).
//
// Hub-hiddenness (registry-driven, all 4 hubs + footer + llms.txt): unchanged
// from v2/v3 — none of the 4 Wealth Horizon routes may appear on /tools,
// /uk/tools, /ca/tools, /au/tools, in the footer, or in llms.txt.
//
// JS-on (US-only): every numbered step's slider is visible and live from
// first paint, dragging a slider flips the state chip to "Your result" and
// fires tool_input_change, the Step-4 return-preset TICKS still fire
// tool_scenario_compare instead, a lever click still fires tool_input_change
// with controlRole 'lever', Simple mode still never clamps, Advanced
// settings holds Annual fee/Withdrawal rate/benefit/detailed-accounts toggle
// (all sliders now too), the two-handle lifetime-range enforces
// retirement ≥ today + 1, the Step-2 escalation slider's dynamic hint uses
// the engine's own monthlyContributionInYear() formula, and the chart's
// hover overlay mounts without breaking anything JS-off already asserts.
//
// Run:  npx playwright test e2e/tool-shell-wealth-horizon.spec.ts
//       BASE_URL=http://localhost:3007 npx playwright test e2e/tool-shell-wealth-horizon.spec.ts

import { test, expect, type Page, type Locator } from '@playwright/test';
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

/** Programmatically sets a native range input's value and dispatches
 *  `input`/`change` — the standard technique for driving a React-controlled
 *  <input type="range"> from Playwright (`.fill()` isn't reliable for
 *  range inputs, and dragging by pixel offset is brittle across viewports). */
async function setRangeValue(locator: Locator, value: number): Promise<void> {
  await locator.evaluate((el, val) => {
    const proto = Object.getPrototypeOf(el) as { value: PropertyDescriptor };
    const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
    setter?.call(el, String(val));
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, value);
}

for (const c of CASES) {
  test.describe(`Wealth Horizon ${c.market.toUpperCase()} (JS off): ${c.path}`, () => {
    test('Worked Example — v4 slider-only surface is fully present in server HTML, noindex, wording contracts hold', async ({ page }) => {
      const response = await page.goto(c.path);
      expect(response?.status()).toBeLessThan(400);

      // H1
      await expect(page.locator('h1')).toHaveText(c.h1);

      // "Example result" chip (Worked Example, resultState 'example')
      await expect(page.locator('.result-chip').first()).toContainText('Example result');

      // 5 numbered steps, visible from first paint (no step flow).
      const html = await page.content();
      expect(html).toContain('Starting amount');
      expect(html).toContain('Monthly contribution');
      expect(html).toContain('Increase contributions each year');
      expect(html).toContain('Your age today &amp; at retirement');
      expect(html).toContain('Expected annual return');
      expect(html).toContain('Expected inflation');

      // v4: every Normal-mode field is a slider, server-rendered with
      // correct min/max/step (SPEC-Regel-7 deviation, documented).
      expect(html.toLowerCase()).toContain('type="range"');
      const startingAmount = page.locator('input[data-input-key="startingAmount"]');
      await expect(startingAmount).toHaveAttribute('min', '0');
      await expect(startingAmount).toHaveAttribute('max', '1000000');
      await expect(startingAmount).toHaveAttribute('step', '1000');
      await expect(startingAmount).toHaveAttribute('aria-valuetext', /.+/);

      const monthlyContribution = page.locator('input[data-input-key="monthlyContribution"]');
      await expect(monthlyContribution).toHaveAttribute('min', '0');
      await expect(monthlyContribution).toHaveAttribute('max', '5000');
      await expect(monthlyContribution).toHaveAttribute('step', '50');

      const growth = page.locator('input[data-input-key="contributionGrowthPct"]');
      await expect(growth).toHaveAttribute('min', '0');
      await expect(growth).toHaveAttribute('max', '5');
      await expect(growth).toHaveAttribute('step', '0.5');

      const todaySlider = page.getByRole('slider', { name: 'Your age today' });
      await expect(todaySlider).toHaveAttribute('min', '18');
      await expect(todaySlider).toHaveAttribute('max', '70');
      const retireSlider = page.getByRole('slider', { name: 'Retirement age' });
      await expect(retireSlider).toHaveAttribute('min', '45');
      await expect(retireSlider).toHaveAttribute('max', '80');

      const returnSlider = page.locator('input[data-input-key="returnNominalPct"]');
      await expect(returnSlider).toHaveAttribute('min', '0');
      await expect(returnSlider).toHaveAttribute('max', '12');
      await expect(returnSlider).toHaveAttribute('step', '0.5');

      const inflationSlider = page.locator('input[data-input-key="inflationPct"]');
      await expect(inflationSlider).toHaveAttribute('min', '0');
      await expect(inflationSlider).toHaveAttribute('max', '6');
      await expect(inflationSlider).toHaveAttribute('step', '0.1');

      // Advanced settings (closed <details>) sliders — present in server
      // HTML with correct attributes even though not visible.
      const annualFee = page.locator('input[data-input-key="annualFeePct"]');
      await expect(annualFee).toHaveAttribute('min', '0');
      await expect(annualFee).toHaveAttribute('max', '2');
      await expect(annualFee).toHaveAttribute('step', '0.1');
      const withdrawalRate = page.locator('input[data-input-key="withdrawalRatePct"]');
      await expect(withdrawalRate).toHaveAttribute('min', '2.5');
      await expect(withdrawalRate).toHaveAttribute('max', '5');
      const targetIncome = page.locator('input[data-input-key="targetMonthlyIncomeToday"]');
      await expect(targetIncome).toHaveAttribute('min', '0');
      await expect(targetIncome).toHaveAttribute('max', '15000');
      await expect(targetIncome).toHaveAttribute('step', '100');
      const employerMatch = page.locator('input[data-input-key="employerContributionMonthly"]');
      await expect(employerMatch).toHaveAttribute('min', '0');
      await expect(employerMatch).toHaveAttribute('max', '2000');
      await expect(employerMatch).toHaveAttribute('step', '50');

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

// ── US-only JS-on suite (v4 slider-only surface) ─────────────────────────
test.describe(`Wealth Horizon US (JS on) — v4 slider-only surface: ${PAGE_PATH}`, () => {
  test.use({ javaScriptEnabled: true });

  test.beforeEach(async ({ page }) => {
    // Force the fetch fallback so page.route sees every batch (sendBeacon
    // bodies aren't inspectable) — same pattern as the other tool_v1 specs.
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'sendBeacon', { value: () => false, configurable: true });
    });
  });

  test('no step flow, no text fields in Normal mode — every numbered step is a visible slider from first paint', async ({ page }) => {
    await page.goto(PAGE_PATH, { waitUntil: 'networkidle' });
    await expect(page.getByRole('button', { name: 'Next' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'See my result' })).toHaveCount(0);
    await expect(page.getByRole('slider', { name: 'Starting amount' })).toBeVisible();
    await expect(page.getByRole('slider', { name: 'Monthly contribution' })).toBeVisible();
    await expect(page.getByRole('slider', { name: 'Increase contributions each year' })).toBeVisible();
    await expect(page.getByRole('slider', { name: 'Your age today' })).toBeVisible();
    await expect(page.getByRole('slider', { name: 'Retirement age' })).toBeVisible();
    await expect(page.getByRole('slider', { name: 'Expected annual return' })).toBeVisible();
    await expect(page.getByRole('slider', { name: 'Expected inflation' })).toBeVisible();
    await expect(page.locator('#wealth-horizon-result .result-chip').first()).toContainText('Example result');
  });

  test('(a) focusing the return slider and pressing ArrowRight changes the hero balance and fires tool_input_change', async ({ page }) => {
    const batches = await interceptTrack(page);
    await page.goto(PAGE_PATH, { waitUntil: 'networkidle' });

    const heroBefore = await page.locator('#wealth-horizon-result').getByText(/^\$[\d,]+$/).first().textContent();

    const returnSlider = page.getByRole('slider', { name: 'Expected annual return' });
    await returnSlider.focus();
    await returnSlider.press('ArrowRight');

    // The chip flip is asserted first (auto-retrying `expect`) so it also
    // waits out the ~500ms count-up animation before the hero text is read —
    // reading it immediately after the keypress can race the very first rAF
    // frame, which still shows the PREVIOUS value (interpolateCountUp at
    // progress=0).
    await expect(page.locator('#wealth-horizon-result .result-chip').first()).toContainText('Your result');
    await page.waitForTimeout(600);
    const heroAfter = await page.locator('#wealth-horizon-result').getByText(/^\$[\d,]+$/).first().textContent();
    expect(heroAfter).not.toBe(heroBefore);

    await page.waitForTimeout(1800); // 600ms input debounce + 800ms queue flush + buffer
    const events = toolEvents(batches);
    const change = events.find(
      (e) => e.eventName === 'tool_input_change' && (e.properties as Record<string, unknown> | undefined)?.inputKey === 'returnNominalPct',
    );
    expect(change, 'tool_input_change for returnNominalPct should have fired').toBeTruthy();
  });

  test('(b) the lifetime-range Today handle stops at retirement − 1 when pressed to its own maximum (End key), never crossing', async ({ page }) => {
    await page.goto(PAGE_PATH, { waitUntil: 'networkidle' });

    const retirementSlider = page.getByRole('slider', { name: 'Retirement age' });
    await expect(retirementSlider).toHaveValue('65'); // default, unchanged

    const todaySlider = page.getByRole('slider', { name: 'Your age today' });
    await todaySlider.focus();
    await todaySlider.press('End'); // jumps to the input's own max (70) first

    await expect(todaySlider).toHaveValue('64'); // stopped at retirement (65) − 1
    await expect(retirementSlider).toHaveValue('65'); // untouched

    const todayValue = Number(await todaySlider.inputValue());
    const retirementValue = Number(await retirementSlider.inputValue());
    expect(todayValue).toBeLessThan(retirementValue);
  });

  test('(c) clicking the "Conservative 5.5%" tick snaps the return slider to 5.5 and fires tool_scenario_compare', async ({ page }) => {
    const batches = await interceptTrack(page);
    await page.goto(PAGE_PATH, { waitUntil: 'networkidle' });

    await page.getByRole('button', { name: 'Conservative 5.5%' }).click();

    const returnSlider = page.getByRole('slider', { name: 'Expected annual return' });
    await expect(returnSlider).toHaveValue('5.5');
    await expect(page.locator('#wealth-horizon-result .result-chip').first()).toContainText('Your result');

    await page.waitForTimeout(1200);
    const events = toolEvents(batches);
    const compare = events.find((e) => e.eventName === 'tool_scenario_compare');
    expect(compare, 'tool_scenario_compare should have fired').toBeTruthy();
    expect((compare!.properties as Record<string, unknown>).scenario).toBe('conservative');
  });

  test('(d) raising the escalation slider to 3% shows a "becomes ... in year 10" hint and raises the hero balance', async ({ page }) => {
    await page.goto(PAGE_PATH, { waitUntil: 'networkidle' });

    const heroBefore = await page.locator('#wealth-horizon-result').getByText(/^\$[\d,]+$/).first().textContent();

    const growthSlider = page.getByRole('slider', { name: 'Increase contributions each year' });
    await setRangeValue(growthSlider, 3);

    const hint = page.getByTestId('contribution-growth-hint');
    await expect(hint).toBeVisible();
    await expect(hint).toContainText('becomes');
    await expect(hint).toContainText('year 10');

    const heroAfter = await page.locator('#wealth-horizon-result').getByText(/^\$[\d,]+$/).first().textContent();
    expect(heroAfter).not.toBe(heroBefore);
  });

  test('dragging a custom return value fires a plain tool_input_change (not tool_scenario_compare)', async ({ page }) => {
    const batches = await interceptTrack(page);
    await page.goto(PAGE_PATH, { waitUntil: 'networkidle' });

    const returnSlider = page.getByRole('slider', { name: 'Expected annual return' });
    await setRangeValue(returnSlider, 6.5); // not one of the 3 tick values

    await page.waitForTimeout(1800);
    const events = toolEvents(batches);
    const change = events.find(
      (e) => e.eventName === 'tool_input_change' && (e.properties as Record<string, unknown> | undefined)?.inputKey === 'returnNominalPct',
    );
    expect(change, 'tool_input_change for returnNominalPct should have fired').toBeTruthy();
    expect(events.some((e) => e.eventName === 'tool_scenario_compare')).toBe(false);
  });

  test('changing the inflation slider changes the hero balance number', async ({ page }) => {
    await page.goto(PAGE_PATH, { waitUntil: 'networkidle' });
    const heroBefore = await page.locator('#wealth-horizon-result').getByText(/^\$[\d,]+$/).first().textContent();

    const inflationSlider = page.getByRole('slider', { name: 'Expected inflation' });
    await setRangeValue(inflationSlider, 4.5);
    await page.waitForTimeout(600); // let the ~500ms count-up animation finish before reading the hero text

    const heroAfter = await page.locator('#wealth-horizon-result').getByText(/^\$[\d,]+$/).first().textContent();
    expect(heroAfter).not.toBe(heroBefore);
  });

  test('an out-of-range real return (nominal − inflation) shows the clamp warning', async ({ page }) => {
    await page.goto(PAGE_PATH, { waitUntil: 'networkidle' });

    const returnSlider = page.getByRole('slider', { name: 'Expected annual return' });
    await setRangeValue(returnSlider, 1);
    const inflationSlider = page.getByRole('slider', { name: 'Expected inflation' });
    await setRangeValue(inflationSlider, 5);

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

  test('Simple mode never clamps at the slider\'s own maximum contribution — value stays, informational hint visible', async ({ page }) => {
    await page.goto(PAGE_PATH, { waitUntil: 'networkidle' });

    // v4 deviation note: the slider's own max is $5,000/mo (spec-mandated
    // range), so the old $50,000-extreme value from v3's text field is no
    // longer reachable through this control — Simple mode's advisory hint is
    // unconditional (buildContributionChecks never gates it on the amount),
    // so asserting at the slider's own max still proves the "never clamps"
    // contract: the displayed value stays exactly what was set.
    const contributionSlider = page.getByRole('slider', { name: 'Monthly contribution' });
    await setRangeValue(contributionSlider, 5000);

    await expect(contributionSlider).toHaveValue('5000'); // NOT clamped
    const hint = page.getByTestId('contribution-hint');
    await expect(hint).toBeVisible();
    await expect(hint).toContainText('account-level limits may apply');
  });

  test('Advanced settings expands to reveal Annual fee, Withdrawal rate and the detailed-accounts toggle', async ({ page }) => {
    await page.goto(PAGE_PATH, { waitUntil: 'networkidle' });
    await page.getByText('Advanced settings').click();

    await expect(page.getByRole('slider', { name: 'Annual fee' })).toBeVisible();
    await expect(page.getByRole('slider', { name: 'Withdrawal rate' })).toBeVisible();
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
