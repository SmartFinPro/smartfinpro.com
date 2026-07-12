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
  });
}
