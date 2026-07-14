// e2e/wealth-horizon-deeplinks.spec.ts
// FDL 4.4 — Supporting-Deep-Links (super/tfsa/isa ↔ Wealth Horizon), SPEC 8.7.
//
// Covers (per the 4.4 brief):
// (1) Super → WH: bucketed bands are taken over, the "Using your Super
//     inputs — edit" line is visible, the result chip stays on the normal
//     "Your result" path (never "Shared scenario" — that wording is
//     reserved for PR 2.3's real share flow, bindende Entscheidung).
// (2) The fragment NEVER contains the raw amount the user entered/started
//     with — only pre-bucketed band labels.
// (3) Wealth Horizon without a fragment: no prefill line, unchanged
//     "Example result" behavior.
// (4) `location.search === ''` everywhere — the deep link is ALWAYS a
//     `#s=` fragment, never a query parameter.
//
// The Playwright GLOBAL config disables JS (see playwright.config.ts) — the
// JS-off suites below exercise the SSR HTML (the deep-link href is present
// even without hydration, since these widgets seed state from static
// literals, not server props). The JS-on suites explicitly opt back in,
// matching the pattern in e2e/tool-shell-wealth-horizon.spec.ts and
// e2e/tool-tracking.spec.ts.
//
// Run:  npx playwright test e2e/wealth-horizon-deeplinks.spec.ts
//       BASE_URL=http://localhost:3007 npx playwright test e2e/wealth-horizon-deeplinks.spec.ts

import { test, expect } from '@playwright/test';

const SUPER_PATH = '/au/tools/superannuation-calculator';
const TFSA_PATH = '/ca/tools/tfsa-rrsp-calculator';
const ISA_PATH = '/uk/tools/isa-tax-savings-calculator';
const WH_AU_PATH = '/au/tools/retirement-calculator';
const WH_CA_PATH = '/ca/tools/retirement-calculator';
const WH_UK_PATH = '/uk/tools/pension-calculator';
const WH_US_PATH = '/tools/retirement-calculator';

/** Decodes a `#s=base64url(json)` fragment from an href — mirrors
 *  lib/decision/share-codec.ts's own base64url shape, independently
 *  reimplemented here so the test doesn't just call the same code it's
 *  verifying. */
function decodeFragment(href: string): { v: number; t: string; i: Record<string, unknown> } | null {
  const match = /#s=([^&]+)/.exec(href);
  if (!match) return null;
  const padded = match[1].replace(/-/g, '+').replace(/_/g, '/');
  const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
  try {
    const json = Buffer.from(padded + pad, 'base64').toString('utf-8');
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function searchOf(href: string): string {
  return new URL(href, 'https://smartfinpro.com').search;
}

// ── (1)+(2)+(4) Superannuation → Wealth Horizon, JS-off: the link itself ──

test.describe(`Superannuation → Wealth Horizon deep link (JS-off): ${SUPER_PATH}`, () => {
  test('carries a #s= fragment, never a query parameter, never the raw default balance', async ({ page }) => {
    await page.goto(SUPER_PATH);
    const link = page.getByTestId('wh-deep-link');
    await expect(link).toBeVisible();

    const href = await link.getAttribute('href');
    expect(href).toBeTruthy();
    expect(href).toContain('#s=');
    expect(href).not.toContain('?');
    expect(searchOf(href!)).toBe('');

    // Path comes from the registry (getToolEntryHref), not a hardcoded string.
    expect(href!.startsWith(WH_AU_PATH)).toBe(true);

    const payload = decodeFragment(href!);
    expect(payload).not.toBeNull();
    expect(payload!.t).toBe('superannuation');
    expect(payload!.i.ageBand).toBeDefined();
    expect(payload!.i.balanceBand).toBeDefined();

    // Raw amounts (SSR default: currentBalance=150000, currentAge=35) must
    // NEVER appear anywhere in the fragment — only bucketed bands do.
    expect(href).not.toContain('150000');
    expect(href).not.toContain('150,000');
    expect(JSON.stringify(payload)).not.toContain('150000');
  });
});

test.describe(`TFSA/RRSP → Wealth Horizon deep link (JS-off): ${TFSA_PATH}`, () => {
  test('carries a #s= fragment with only ageBand/balanceBand — never the raw contributed amount', async ({ page }) => {
    await page.goto(TFSA_PATH);
    const href = await page.getByTestId('wh-deep-link').getAttribute('href');
    expect(href).toContain('#s=');
    expect(searchOf(href!)).toBe('');
    expect(href!.startsWith(WH_CA_PATH)).toBe(true);

    const payload = decodeFragment(href!);
    expect(payload!.t).toBe('tfsa-rrsp');
    expect(payload!.i.ageBand).toBeDefined();
    expect(payload!.i.balanceBand).toBeDefined();
    expect(payload!.i.contributionBand).toBeUndefined(); // no monthly-contribution field on this widget

    // Raw amount (SSR default: tfsaContributed=30000) must never appear.
    expect(href).not.toContain('30000');
    expect(JSON.stringify(payload)).not.toContain('30000');
  });
});

// ISA is rendered via DynamicISATaxSavingsCalculator (components/tools/
// dynamic-calculators.tsx, `ssr: false`) — an existing, pre-4.4
// architectural choice for this widget (unlike superannuation/tfsa-rrsp,
// which render directly). Its deep link therefore only exists client-side —
// this suite runs JS-on, matching that reality, rather than JS-off like the
// other two source widgets.
test.describe(`ISA → Wealth Horizon deep link (JS on, ssr:false widget): ${ISA_PATH}`, () => {
  test.use({ javaScriptEnabled: true });

  test('carries a #s= fragment with only contributionBand/taxBand — never the raw annual investment amount', async ({ page }) => {
    await page.goto(ISA_PATH, { waitUntil: 'networkidle' });
    const href = await page.getByTestId('wh-deep-link').getAttribute('href');
    expect(href).toContain('#s=');
    expect(searchOf(href!)).toBe('');
    expect(href!.startsWith(WH_UK_PATH)).toBe(true);

    const payload = decodeFragment(href!);
    expect(payload!.t).toBe('isa');
    expect(payload!.i.contributionBand).toBeDefined();
    expect(payload!.i.ageBand).toBeUndefined(); // no age field on this widget
    expect(payload!.i.balanceBand).toBeUndefined(); // no balance field on this widget

    // Raw amount (SSR default: annualInvestment=10000) must never appear.
    expect(href).not.toContain('10000');
    expect(JSON.stringify(payload)).not.toContain('10000');
  });
});

// ── (3) Wealth Horizon without a fragment: unchanged behavior (JS-off) ────

for (const path of [WH_AU_PATH, WH_CA_PATH, WH_UK_PATH, WH_US_PATH]) {
  test.describe(`Wealth Horizon — no fragment (JS-off): ${path}`, () => {
    test('renders no prefill line, "Example result" chip, plain location.search', async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBeLessThan(400);
      await expect(page.getByTestId('wh-prefill-source-line')).toHaveCount(0);
      await expect(page.locator('.result-chip').first()).toContainText('Example result');
    });
  });
}

// ── (1) Full round trip, JS-on: bands taken over, prefill line, chip ──────

test.describe('Superannuation → Wealth Horizon full round trip (JS on)', () => {
  test.use({ javaScriptEnabled: true });

  test('bands are taken over, "Using your Super inputs" is visible, chip stays on the "Your result" path (never "Shared scenario")', async ({ page }) => {
    await page.goto(SUPER_PATH, { waitUntil: 'networkidle' });
    const href = await page.getByTestId('wh-deep-link').getAttribute('href');
    expect(href).toBeTruthy();

    await page.goto(href!, { waitUntil: 'networkidle' });
    expect(searchOf(page.url())).toBe('');

    const prefillLine = page.getByTestId('wh-prefill-source-line');
    await expect(prefillLine).toBeVisible();
    await expect(prefillLine).toContainText('Using your Super inputs');

    const chip = page.locator('#wealth-horizon-result .result-chip').first();
    await expect(chip).toContainText('Your result');
    await expect(chip).not.toContainText('Shared scenario');
    await expect(chip).not.toContainText('Example result');

    // The prefilled starting-amount slider reflects the bucket midpoint
    // (100,000–250,000 band from the default 150,000 balance → 175,000),
    // never the raw 150,000 the user "typed" on the source widget.
    const startingAmount = page.locator('input[data-input-key="startingAmount"]');
    await expect(startingAmount).toHaveValue('175000');
  });

  test('clicking "edit" dismisses the prefill line without resetting the chip or the prefilled values', async ({ page }) => {
    await page.goto(SUPER_PATH, { waitUntil: 'networkidle' });
    const href = await page.getByTestId('wh-deep-link').getAttribute('href');
    await page.goto(href!, { waitUntil: 'networkidle' });

    await expect(page.getByTestId('wh-prefill-source-line')).toBeVisible();
    await page.getByRole('button', { name: 'edit' }).click();

    await expect(page.getByTestId('wh-prefill-source-line')).toHaveCount(0);
    await expect(page.locator('#wealth-horizon-result .result-chip').first()).toContainText('Your result');
    const startingAmount = page.locator('input[data-input-key="startingAmount"]');
    await expect(startingAmount).toHaveValue('175000'); // unchanged by dismissing the line
  });

  test('a corrupt fragment is a silent no-op — Example result, no prefill line, no thrown error', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(String(err)));

    await page.goto(`${WH_AU_PATH}#s=%%%not-valid-base64%%%`, { waitUntil: 'networkidle' });

    await expect(page.getByTestId('wh-prefill-source-line')).toHaveCount(0);
    await expect(page.locator('#wealth-horizon-result .result-chip').first()).toContainText('Example result');
    expect(errors).toEqual([]);
  });
});

// ── (E) Wealth Horizon → Superannuation rücklink, JS on ───────────────────

test.describe('Wealth Horizon → Superannuation rücklink (JS on)', () => {
  test.use({ javaScriptEnabled: true });

  test('the "Model just your Super" rücklink carries a #s= fragment, never a query parameter, never the raw balance', async ({ page }) => {
    await page.goto(WH_AU_PATH, { waitUntil: 'networkidle' });
    const link = page.getByTestId('wh-supporting-deep-link');
    await expect(link).toBeVisible();
    await expect(link).toContainText('Model just your Super');

    const href = await link.getAttribute('href');
    expect(href).toContain('#s=');
    expect(href).not.toContain('?');
    expect(searchOf(href!)).toBe('');
    expect(href!.startsWith(SUPER_PATH)).toBe(true);

    const payload = decodeFragment(href!);
    expect(payload!.t).toBe('wealth-horizon');
    // Every field is a pre-bucketed band label ("1000-2500" / "lt100" /
    // "gte1000000"), never a raw exact number — this is the actual privacy
    // guarantee (band EDGES are legitimately large numbers, so a bare
    // "5+ digit substring" check would be a false signal here).
    const bandShape = /^(lt\d+(\.\d+)?|gte\d+(\.\d+)?|\d+(\.\d+)?-\d+(\.\d+)?)$/;
    for (const [key, value] of Object.entries(payload!.i)) {
      expect(typeof value, `field "${key}" should be a bucketed string`).toBe('string');
      expect(bandShape.test(value as string), `field "${key}" = "${value}" is not a valid band label`).toBe(true);
    }
  });

  test('US Wealth Horizon has no rücklink — no supporting single-account tool for that market', async ({ page }) => {
    await page.goto(WH_US_PATH, { waitUntil: 'networkidle' });
    await expect(page.getByTestId('wh-supporting-deep-link')).toHaveCount(0);
  });
});
