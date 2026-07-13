// e2e/tool-shell-wealth-horizon.spec.ts
// Wealth Horizon US (FDL 4.2) — /tools/retirement-calculator.
//
// JS-off (Playwright global default): the Worked Example must be fully
// present in server HTML (H1, "Example result" chip, answer sentence, SVG
// corridor, exactly 3 levers, AssumptionsDrawer sources, exactly 1
// NextBestAction), robots noindex, the binding wording ("in today's money",
// "Illustrative retirement withdrawal") present, and the negative wording
// list (sustainable/guaranteed/you will have) absent anywhere in the HTML.
//
// JS-on (test.use): the 3-step GuidedJourney flow reaches a real result;
// the scenario switcher fires tool_scenario_compare; a lever click fires
// tool_input_change{controlRole:'lever'}; and Simple mode never clamps an
// over-IRS-limit contribution (value stays, informational hint visible).
//
// Run:  npx playwright test e2e/tool-shell-wealth-horizon.spec.ts
//       BASE_URL=http://localhost:3007 npx playwright test e2e/tool-shell-wealth-horizon.spec.ts

import { test, expect, type Page } from '@playwright/test';

const PAGE_PATH = '/tools/retirement-calculator';
const FORBIDDEN_WORDS = ['sustainable', 'guaranteed', 'you will have'];

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

test.describe(`Wealth Horizon US (JS off): ${PAGE_PATH}`, () => {
  test('Worked Example is fully present in server HTML, noindex, binding wording present, negative list absent', async ({ page }) => {
    const response = await page.goto(PAGE_PATH);
    expect(response?.status()).toBeLessThan(400);

    // H1
    await expect(page.locator('h1')).toHaveText('Retirement & Financial Freedom Calculator');

    // "Example result" chip (Worked Example, resultState 'example')
    await expect(page.locator('.result-chip').first()).toContainText('Example result');

    // Answer sentence (slot 1)
    await expect(page.locator('.answer').first()).not.toBeEmpty();

    // SVG corridor chart (slot 3)
    await expect(page.locator('svg[role="img"]').first()).toBeVisible();

    // Exactly 3 levers (slot 4)
    await expect(page.locator('.levers button.lever')).toHaveCount(3);

    // AssumptionsDrawer sources present in HTML (native <details>, closed by
    // default — check content, not visibility)
    const assumptionsHtml = await page.locator('.assumptions').first().innerHTML();
    expect(assumptionsHtml).toContain('irs.gov');

    // Exactly 1 NextBestAction (slot 6)
    await expect(page.locator('.next-action a')).toHaveCount(1);

    // robots noindex (SPEC 9.2 deviation, documented: launch-complete flip in PR 4.3)
    const robots = await page.locator('meta[name="robots"]').getAttribute('content').catch(() => null);
    expect(robots ?? '').toContain('noindex');

    // Binding wording (SPEC 8.3) — page.content() re-serializes the parsed
    // DOM, so HTML entities like &#x27; come back as plain apostrophes.
    const html = await page.content();
    expect(html).toContain("in today's money");
    expect(html.toLowerCase()).toContain("illustrative retirement withdrawal");

    // Negative wording list — nowhere on the page
    const lower = html.toLowerCase();
    for (const word of FORBIDDEN_WORDS) {
      expect(lower.includes(word), `found forbidden word "${word}"`).toBe(false);
    }
  });

  test('sitemap does not include the route (indexable:false)', async ({ request }) => {
    const res = await request.get('/sitemap.xml');
    const body = await res.text();
    expect(body).not.toContain(PAGE_PATH);
  });
});

test.describe(`Wealth Horizon US (JS on): ${PAGE_PATH}`, () => {
  test.use({ javaScriptEnabled: true });

  test.beforeEach(async ({ page }) => {
    // Force the fetch fallback so page.route sees every batch (sendBeacon
    // bodies aren't inspectable) — same pattern as the other tool_v1 specs.
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'sendBeacon', { value: () => false, configurable: true });
    });
  });

  async function completeJourney(page: Page): Promise<void> {
    await page.goto(PAGE_PATH, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Next' }).click(); // Basics → Contributions
    await page.getByRole('button', { name: 'Next' }).click(); // Contributions → Assumptions
    await page.getByRole('button', { name: 'See my result' }).click();
    await expect(page.locator('#wealth-horizon-result')).toBeVisible();
  }

  test('3-step guided journey flow reaches a real ("Your result") outcome', async ({ page }) => {
    await completeJourney(page);
    await expect(page.locator('#wealth-horizon-result .result-chip').first()).toContainText('Your result');
    await expect(page.locator('#wealth-horizon-result .levers button.lever')).toHaveCount(3);
  });

  test('scenario switcher fires tool_scenario_compare', async ({ page }) => {
    const batches = await interceptTrack(page);
    await completeJourney(page);

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
    await completeJourney(page);

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
    await page.getByRole('button', { name: 'Next' }).click(); // Basics → Contributions

    const contributionInput = page.getByLabel('Your monthly contribution');
    await contributionInput.fill('50000'); // annual 600,000 — far beyond any US statutory limit
    await contributionInput.blur();

    await expect(contributionInput).toHaveValue('50000'); // NOT clamped
    const hint = page.getByTestId('contribution-hint');
    await expect(hint).toBeVisible();
    await expect(hint).toContainText('account-level limits may apply');
  });

  test('withdrawal rate is visibly adjustable, 2.5–5.0, in the Assumptions step', async ({ page }) => {
    // GuidedJourneyLayout (SPEC 6.2, pre-built PR 2.1 shell — not modified in
    // this PR) mounts only the CURRENT step's content, so the withdrawal-rate
    // field (Step 3) is not part of the JS-off Step-1 HTML; verified here
    // with JS on, after navigating to the Assumptions step.
    await page.goto(PAGE_PATH, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Next' }).click(); // Basics → Contributions
    await page.getByRole('button', { name: 'Next' }).click(); // Contributions → Assumptions

    const withdrawalInput = page.getByRole('textbox', { name: 'Withdrawal rate' });
    await expect(withdrawalInput).toBeVisible();
    const withdrawalSlider = page.locator('input[type="range"][aria-label="Withdrawal rate slider"]');
    await expect(withdrawalSlider).toHaveAttribute('min', '2.5');
    await expect(withdrawalSlider).toHaveAttribute('max', '5');
  });
});
