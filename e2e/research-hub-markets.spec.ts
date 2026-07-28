// e2e/research-hub-markets.spec.ts
// Task 7 (unified-research-discovery-pr2-hubs plan) — the four universal
// Research hubs as a MARKET matrix: route/canonical correctness, SEO
// metadata, the card-contract honesty rules (spec §9.1) holding even where
// a market's catalog has zero audited contexts, filter-state robots
// headers, and navigation (header + market switcher) targeting
// researchBaseForMarket() everywhere.
//
// Static/SSR checks (route matrix, metadata, card contracts, robots) run
// under the repo's DEFAULT javaScriptEnabled:false config — spec §8's whole
// point is that this content is crawlable without JS, and Playwright's
// locator/getAttribute API reads the parsed DOM regardless of script
// execution (see e2e/tool-seo.spec.ts's canonical-link check for
// precedent). Only the mobile-sheet market-switch test needs a real click
// to open Radix's Sheet, which requires React hydration — that one test
// opts into `javaScriptEnabled: true` on its own.

import { test, expect, type APIRequestContext, type Page } from '@playwright/test';
import { researchBaseForMarket } from '@/lib/research/catalog-shell-logic';
import type { Market } from '@/lib/i18n/config';

const MARKETS: readonly Market[] = ['us', 'uk', 'ca', 'au'];

const EXPECTED_HREFLANG: Record<string, string> = {
  'en-US': '/research',
  'en-GB': '/uk/research',
  'en-CA': '/ca/research',
  'en-AU': '/au/research',
  'x-default': '/research',
};

// spec §7.3 — every known filter query key.
const RESEARCH_FILTER_KEYS = [
  'q',
  'category',
  'type',
  'status',
  'confidence',
  'fresh',
  'topic',
  'spec',
] as const;

async function dismissCookies(page: Page) {
  const essential = page.getByRole('button', { name: /essential only/i });
  if (await essential.isVisible().catch(() => false)) await essential.click().catch(() => {});
}

/** Reads the server-rendered "Audited" HeroMetricTile value
 *  (components/research/ResearchHubPage.tsx) straight from the HTML via a
 *  fast `request` GET — no browser needed. Verified against the real markup
 *  (`<div ...>{value}</div><div ...>Audited</div>`, HeroMetricTile's two
 *  stacked divs) rather than assumed. */
async function getAuditedCount(request: APIRequestContext, base: string): Promise<number> {
  const res = await request.get(base);
  const html = await res.text();
  const match = html.match(/<div[^>]*>(\d+)<\/div><div[^>]*>Audited<\/div>/);
  if (!match) throw new Error(`Could not find the Audited hero tile on ${base}`);
  return Number(match[1]);
}

// ── Route matrix (Step 6: "all four hubs return 200 and self-canonical") ──
test.describe('Research hub route matrix', () => {
  for (const market of MARKETS) {
    const base = researchBaseForMarket(market);
    test(`${market} hub (${base}) responds 200 and is self-canonical`, async ({ page }) => {
      const response = await page.goto(base);
      expect(response?.status()).toBe(200);
      expect(new URL(page.url()).pathname).toBe(base);

      const canonicalHref = await page.locator('link[rel="canonical"]').getAttribute('href');
      expect(canonicalHref).not.toBeNull();
      expect(new URL(canonicalHref!).pathname).toBe(base);
    });
  }
});

// ── Document metadata (Step 6: "one H1 and five-language hreflang map") ───
test.describe('Research hub document metadata', () => {
  for (const market of MARKETS) {
    const base = researchBaseForMarket(market);
    test(`${market} hub has exactly one H1 and the five-language hreflang map`, async ({ page }) => {
      await page.goto(base);

      await expect(page.locator('h1')).toHaveCount(1);

      const hreflangLinks = page.locator('link[rel="alternate"][hreflang]');
      await expect(hreflangLinks).toHaveCount(5);

      const links = await hreflangLinks.all();
      const byLang = new Map<string, string>();
      for (const link of links) {
        const lang = await link.getAttribute('hreflang');
        const href = await link.getAttribute('href');
        expect(lang).not.toBeNull();
        expect(href).not.toBeNull();
        byLang.set(lang!, new URL(href!).pathname);
      }

      for (const [lang, path] of Object.entries(EXPECTED_HREFLANG)) {
        expect(byLang.get(lang), `hreflang="${lang}" on ${base}`).toBe(path);
      }
    });
  }
});

// ── Card-contract honesty (spec §9.1) ──────────────────────────────────────
test.describe('Research hub card contracts', () => {
  test('a context-free review reads "Editorial · x/5" and renders no star icon', async ({
    page,
  }) => {
    // Content-agnostic: try every market rather than assuming US always has
    // one — the assertion is about the CARD CONTRACT, not about which
    // market's catalog happens to have a context-free review today.
    let found = false;
    for (const market of MARKETS) {
      await page.goto(researchBaseForMarket(market));
      const editorialLabel = page.locator('text=/^Editorial · \\d\\.\\d\\/5$/').first();
      if (await editorialLabel.isVisible().catch(() => false)) {
        found = true;
        // CatalogCard (components/research/CatalogCard.tsx) is the only
        // component that ever renders "Editorial · x/5", and it renders no
        // icon of any kind — scope to the card so a star elsewhere on the
        // page (e.g. a different card type) can't hide a regression here.
        const card = editorialLabel.locator('xpath=ancestor::article[1]');
        await expect(card.locator('svg')).toHaveCount(0);
        break;
      }
    }
    expect(found, 'no market in the current catalog fixture has a context-free review').toBe(true);
  });

  test('review-only degradation: a market with zero qualified contexts still renders reviews, with no audited claim', async ({
    page,
    request,
  }) => {
    // Derived from the current catalog fixture (never hardcoded) — the
    // moment a non-US market gains a qualified context it stops being a
    // candidate here, exactly as the plan requires.
    let zeroAuditedMarket: Market | null = null;
    for (const market of MARKETS) {
      const count = await getAuditedCount(request, researchBaseForMarket(market));
      if (count === 0) {
        zeroAuditedMarket = market;
        break;
      }
    }
    test.skip(
      zeroAuditedMarket === null,
      'every market in the current catalog fixture already has a qualified audited context',
    );

    const base = researchBaseForMarket(zeroAuditedMarket!);
    await page.goto(base);

    // Reviews still render (Editorial-labeled cards, spec §9.1).
    const editorialCards = page.locator('text=/^Editorial · \\d\\.\\d\\/5$/');
    expect(await editorialCards.count()).toBeGreaterThan(0);

    // No audited claim appears anywhere on the page.
    const auditedClaims = page.locator('text=/^Audited · \\d\\.\\d\\/10$/');
    expect(await auditedClaims.count()).toBe(0);
  });
});

// ── Robots matrix (Step 4/6: every known filter key -> noindex, follow) ───
test.describe('Research hub filter-state robots headers', () => {
  for (const market of MARKETS) {
    const base = researchBaseForMarket(market);

    test(`${market}: filterless base (${base}) stays indexable`, async ({ request }) => {
      const res = await request.get(base);
      expect(res.status()).toBe(200);
      expect(res.headers()['x-robots-tag']).toBeUndefined();
    });

    for (const key of RESEARCH_FILTER_KEYS) {
      test(`${market}: ?${key}=... on ${base} is noindex, follow`, async ({ request }) => {
        const res = await request.get(`${base}?${key}=e2e-test-value`);
        expect(res.headers()['x-robots-tag']).toBe('noindex, follow');
      });
    }
  }
});

// ── Navigation (Step 6: header + every market switch target researchBaseForMarket()) ──
// Header (components/marketing/header.tsx) is a Client Component that still
// deliberately renders MOST market-dependent state as the US market on first
// paint ("Hydration-safe: always use 'us' as default... then update on
// client after mount") and only reflects the real market once React
// hydrates — but the Research nav link (and the market switcher's
// research-aware hrefs) is the ONE exception (P1 fix, adversarial review of
// PR #122): it resolves from `detectedMarket` — computed from `pathname` via
// `usePathname()`, correct on the very first SSR render — never the
// `mounted`-gated `market`, precisely so a JS-disabled crawler on
// /uk/research is never sent to /research (proven with JS OFF in
// e2e/research-raw-html.spec.ts). These two navigation checks below still
// run WITH real hydration (`javaScriptEnabled: true`) because they exercise
// interactive navigation (a real click through the market switcher), not
// because the Research link itself needs hydration to be correct.
test.describe('Research hub navigation', () => {
  test.use({ javaScriptEnabled: true });

  for (const market of MARKETS) {
    test(`${market} header's top-level Research link targets researchBaseForMarket(${market})`, async ({
      page,
    }) => {
      const home = market === 'us' ? '/' : `/${market}`;
      await page.goto(home);
      await dismissCookies(page);
      const researchLink = page.getByRole('link', { name: 'Research', exact: true });
      await expect(researchLink).toHaveAttribute('href', researchBaseForMarket(market));
    });
  }

  test('every market switch from a Research route targets researchBaseForMarket()', async ({
    page,
  }) => {
    // The mobile sheet exercises the exact same marketHref() helper the
    // desktop dropdown uses (components/marketing/header.tsx) via one
    // flat, reliably-clickable list — avoids the hover-driven desktop
    // mega-menu's portal timing for what is otherwise the same assertion.
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(researchBaseForMarket('uk'));
    await dismissCookies(page);

    await page.getByRole('button', { name: /open navigation menu/i }).click();
    const sheet = page.getByRole('dialog');
    await expect(sheet.getByRole('link', { name: 'Research', exact: true })).toHaveAttribute(
      'href',
      researchBaseForMarket('uk'),
    );

    for (const target of MARKETS) {
      const expectedHref = researchBaseForMarket(target);
      await expect(sheet.locator(`a[href="${expectedHref}"]`).first()).toBeVisible();
    }
  });
});
