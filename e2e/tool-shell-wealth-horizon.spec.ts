// e2e/tool-shell-wealth-horizon.spec.ts
// Wealth Horizon — all 4 markets (FDL 4.2 US + FDL 4.3 UK/CA/AU), registry-
// driven so a future 5th variant is picked up automatically.
//
// JS-off (Playwright global default), per market: the Worked Example must be
// fully present in server HTML (H1, "Example result" chip, answer sentence,
// SVG corridor, exactly 3 levers, AssumptionsDrawer sources, exactly 1
// NextBestAction), robots noindex, the binding wording ("in today's money",
// "Illustrative retirement withdrawal") present, the negative wording list
// (shared FORBIDDEN_WORDS, SPEC 8.3) absent anywhere in the HTML, the route
// excluded from the sitemap, and market-specific terms present (AU: "12%" +
// "$32,500"; UK: "ISA"/"SIPP" + "£"; CA: "TFSA"/"RRSP" + "personal room").
//
// Hub-hiddenness (registry-driven, all 4 hubs + footer + llms.txt): none of
// the 4 Wealth Horizon routes may appear on /tools, /uk/tools, /ca/tools,
// /au/tools, in the footer, or in llms.txt.
//
// JS-on (test.use): US-only regression suite, UNCHANGED from FDL 4.2 — the
// 3-step GuidedJourney flow, scenario switcher, lever click, Simple-mode
// no-clamp behavior and withdrawal-rate slider all stay green, proving the
// FDL 4.3 island parametrization left US behavior byte-identical.
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
   *  smartfinpro.com-hosted editorial assumption rules; see
   *  WEALTH_HORIZON_CA_RULE_KEYS's comment: TFSA/RRSP room is never a
   *  rule-driven statutory number in this engine). */
  sourceDomain?: string;
  /** Market-specific terms that must appear somewhere in the page HTML
   *  (Kernaufgabe 6 of the FDL 4.3 brief). */
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
    test('Worked Example is fully present in server HTML, noindex, binding wording present, negative list absent', async ({ page }) => {
      const response = await page.goto(c.path);
      expect(response?.status()).toBeLessThan(400);

      // H1
      await expect(page.locator('h1')).toHaveText(c.h1);

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
      if (c.sourceDomain) expect(assumptionsHtml).toContain(c.sourceDomain);

      // Exactly 1 NextBestAction (slot 6)
      await expect(page.locator('.next-action a')).toHaveCount(1);

      // robots noindex (all 4 routes stay hidden until the separate launch PR, FDL 4.3)
      const robots = await page.locator('meta[name="robots"]').getAttribute('content').catch(() => null);
      expect(robots ?? '').toContain('noindex');

      // Binding wording (SPEC 8.3) — page.content() re-serializes the parsed
      // DOM, so HTML entities like &#x27; come back as plain apostrophes.
      const html = await page.content();
      expect(html).toContain("in today's money");
      expect(html.toLowerCase()).toContain('illustrative retirement withdrawal');

      // Negative wording list — nowhere on the page (shared constant, FDL 4.3
      // Opus follow-up: this list can never drift between the unit test and
      // every e2e spec that checks it).
      const lower = html.toLowerCase();
      for (const word of FORBIDDEN_WORDS) {
        expect(lower.includes(word), `found forbidden word "${word}"`).toBe(false);
      }

      // Market-specific terms (Kernaufgabe 6, FDL 4.3 brief)
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

      // Footer (site-wide, rendered on every page including the hub itself) —
      // config/navigation.ts's getSiloToolLinks() delegates straight to the
      // registry's getFooterToolLinks(), so this is the same hidden filter.
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

// ── US-only JS-on regression suite (FDL 4.2, UNCHANGED) ─────────────────
// Proves the FDL 4.3 island parametrization (market/locale/currency/account-
// type-subset/benefit-link props) left US runtime behavior byte-identical.
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
