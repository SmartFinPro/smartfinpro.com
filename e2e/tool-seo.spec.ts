// e2e/tool-seo.spec.ts
import { test, expect } from '@playwright/test';
import { getAllVariants } from '@/lib/tools/registry';

for (const v of getAllVariants().filter((x) => x.status === 'live')) {
  test(`SEO basics ${v.path}`, async ({ page }) => {
    await page.goto(v.path);
    const title = await page.title();
    expect((title.match(/\| SmartFinPro/g) ?? []).length, `double suffix in "${title}"`).toBeLessThanOrEqual(1);
    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveAttribute('href', `https://smartfinpro.com${v.path}`);
    const robots = await page.locator('meta[name="robots"]').getAttribute('content').catch(() => null);
    if (!v.indexable) expect(robots ?? '').toContain('noindex');

    // FDL 0.7: every tool page must emit valid WebApplication JSON-LD.
    const jsonLdContents = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(jsonLdContents.length, `no JSON-LD scripts found on "${v.path}"`).toBeGreaterThan(0);
    const parsed = jsonLdContents.map((raw) => JSON.parse(raw));
    const hasWebApplication = parsed.some((node) => node['@type'] === 'WebApplication');
    expect(hasWebApplication, `no WebApplication JSON-LD node on "${v.path}"`).toBe(true);
  });
}

test('gold-roi legacy path 308s to /au/tools/', async ({ request }) => {
  const res = await request.get('/tools/gold-roi-calculator', { maxRedirects: 0 });
  expect(res.status()).toBe(308);
  expect(res.headers()['location']).toContain('/au/tools/gold-roi-calculator');
});
