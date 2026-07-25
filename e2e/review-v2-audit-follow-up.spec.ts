import { expect, test, type Page } from '@playwright/test';

const REVIEW = '/us/trading/etoro-review';

// The mobile-action and desktop-rail cases require resolved cockpit data.
// Local development supplies the repository's DEV_SEED_ROWS; a standalone
// production server needs the normal Supabase comparison data configured.
// Run locally with:
//   npm run dev -- --port 3082
//   BASE_URL=http://localhost:3082 npx playwright test e2e/review-v2-audit-follow-up.spec.ts

async function openReview(page: Page) {
  const response = await page.goto(REVIEW, { waitUntil: 'domcontentloaded' });
  expect(response?.status()).toBe(200);
  await expect(page.locator('h1')).toContainText('eToro');
}

test.describe('Review V2 audit follow-up', () => {
  test.use({ javaScriptEnabled: true });

  test('320 px layout reflows without horizontal document overflow', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 844 });
    await openReview(page);

    const widths = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    }));
    expect(widths.scroll).toBe(widths.client);
  });

  test('390 px opening exposes actions early and removes the duplicate Market Check', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openReview(page);

    const actions = page.locator('[data-review-mobile-actions]');
    await expect(actions).toBeVisible();
    const box = await actions.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.y).toBeLessThan(844 * 2);

    await expect(page.locator('[data-testid="decision-bridge"]:visible')).toHaveCount(0);

    const facts = page.locator('#verdict details').filter({ hasText: 'Essential facts' });
    await expect(facts).toHaveCount(1);
    await expect(facts).not.toHaveAttribute('open', '');
  });

  test('article H2 hierarchy is stronger than body copy at mobile and desktop widths', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openReview(page);

    const heading = page.locator('.review-v2-prose h2').first();
    const paragraph = page.locator('.review-v2-prose p').first();
    await expect(heading).toBeVisible();
    await expect(paragraph).toBeVisible();

    const mobile = await heading.evaluate((h2, p) => {
      const headingStyle = getComputedStyle(h2);
      const bodyStyle = getComputedStyle(p as Element);
      return {
        headingSize: headingStyle.fontSize,
        headingWeight: headingStyle.fontWeight,
        bodySize: bodyStyle.fontSize,
      };
    }, await paragraph.elementHandle());
    expect(mobile.headingSize).toBe('22px');
    expect(Number(mobile.headingWeight)).toBeGreaterThanOrEqual(600);
    expect(mobile.bodySize).toBe('17px');

    await page.setViewportSize({ width: 1440, height: 900 });
    expect(await heading.evaluate((element) => getComputedStyle(element).fontSize)).toBe('24px');
  });

  test('desktop report card shows freshness and fully exits before Alternatives', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openReview(page);

    const rail = page.locator('aside.lg\\:sticky:visible');
    await expect(rail).toContainText('Data verified');
    await expect(rail).toContainText('18 Jul 2026');
    await expect(rail).not.toContainText('Published');

    const targetY = await page.locator('#alternatives').evaluate(
      (target) => target.getBoundingClientRect().top + window.scrollY - 124,
    );
    await page.evaluate((y) => {
      document.documentElement.style.scrollBehavior = 'auto';
      window.scrollTo(0, y);
    }, targetY);
    await page.waitForFunction((y) => Math.abs(window.scrollY - y) <= 2, targetY);

    const rect = await rail.evaluate((element) => {
      const { top, bottom } = element.getBoundingClientRect();
      return { top, bottom };
    });
    // Fractional layout rounding can leave <1 CSS px outside the viewport;
    // no painted rail pixel may remain.
    expect(rect.bottom).toBeLessThanOrEqual(1);
  });
});
