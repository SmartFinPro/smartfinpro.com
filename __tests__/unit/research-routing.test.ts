// __tests__/unit/research-routing.test.ts
// Task 7 (unified-research-discovery-pr2-hubs plan) — routing/SEO glue
// around the four Research hubs: the from×to market-switch matrix and the
// sitemap's per-market entries. Both consume researchBaseForMarket()
// (lib/research/catalog-shell-logic.ts) as the single source of truth —
// header, market switcher, hub-copy canonical/hreflang, and this sitemap
// all resolve through it so none of them can drift from one another.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ContentItem, ContentMeta } from '@/lib/mdx';
import { researchBaseForMarket } from '@/lib/research/catalog-shell-logic';

// --- hoisted mocks (must exist before the vi.mock factories below run) ----
const { mockGetAllContent, mockGetComparisonRouteParams, mockGetCockpitRouteParamsWithModifiedDates } =
  vi.hoisted(() => ({
    mockGetAllContent: vi.fn(),
    mockGetComparisonRouteParams: vi.fn(),
    mockGetCockpitRouteParamsWithModifiedDates: vi.fn(),
  }));

// getAllContent is the ONLY export app/sitemap.ts pulls from '@/lib/mdx'.
vi.mock('@/lib/mdx', () => ({ getAllContent: mockGetAllContent }));

// Sitemap dynamically imports these two (try/catch-wrapped, non-fatal on
// failure). Mocked so this suite never opens a real Supabase connection —
// the Research lastModified value must come from MDX alone regardless of
// what this overlay reports (spec §7.4: "Do not call the Cockpit or
// Supabase from sitemap generation" for the Research entries specifically).
vi.mock('@/lib/comparison/loader', () => ({
  getComparisonRouteParams: mockGetComparisonRouteParams,
  getCockpitRouteParamsWithModifiedDates: mockGetCockpitRouteParamsWithModifiedDates,
}));

// Imported AFTER the mocks are registered.
import sitemap from '@/app/sitemap';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://smartfinpro.com';

function makeContent(
  slug: string,
  meta: Partial<ContentMeta> & Pick<ContentMeta, 'market' | 'category'>,
): ContentItem {
  return {
    slug,
    content: '',
    readingTime: { text: '1 min read', minutes: 1, time: 60000, words: 200 },
    meta: {
      title: `${slug} title`,
      description: `${slug} description`,
      author: 'SmartFinPro Editorial Team',
      publishDate: '2026-01-01',
      modifiedDate: '2026-01-01',
      affiliateDisclosure: true,
      ...meta,
    },
  };
}

// ── Step 1: the 4x4 from/to market-switch matrix ──────────────────────────
describe.each(['us', 'uk', 'ca', 'au'] as const)(
  'Research switch from %s',
  (from) => {
    it.each(['us', 'uk', 'ca', 'au'] as const)(
      'targets %s canonical route',
      (to) => {
        const current = from === 'us' ? '/research' : `/${from}/research`;
        const target = to === 'us' ? '/research' : `/${to}/research`;
        expect(researchBaseForMarket(from)).toBe(current);
        expect(researchBaseForMarket(to)).toBe(target);
      },
    );
  },
);

// ── Step 5: sitemap — exact URLs + MDX-derived dates ───────────────────────
describe('Research hub sitemap entries', () => {
  beforeEach(() => {
    mockGetAllContent.mockReset();
    mockGetComparisonRouteParams.mockReset().mockResolvedValue([]);
    mockGetCockpitRouteParamsWithModifiedDates.mockReset().mockResolvedValue([]);
  });

  it('adds exactly one entry per market at researchBaseForMarket(), with lastModified derived only from MDX', async () => {
    mockGetAllContent.mockResolvedValue([
      // Excluded: index pages never count, even with the latest date.
      makeContent('index', {
        market: 'us',
        category: 'trading',
        modifiedDate: '2030-01-01',
        publishDate: '2030-01-01',
      }),
      // US: modifiedDate wins between two real entries.
      makeContent('fidelity-review', {
        market: 'us',
        category: 'trading',
        modifiedDate: '2026-06-15',
        publishDate: '2026-01-01',
      }),
      // US: no modifiedDate ('') falls back to publishDate, which is the
      // latest US date overall — proves the `modifiedDate || publishDate`
      // fallback, not just a straight modifiedDate max.
      makeContent('schwab-review', {
        market: 'us',
        category: 'trading',
        modifiedDate: '',
        publishDate: '2026-07-01',
      }),
      makeContent('starling-business-review', {
        market: 'uk',
        category: 'business-banking',
        modifiedDate: '2026-05-20',
        publishDate: '2026-01-01',
      }),
      makeContent('wealthsimple-review', {
        market: 'ca',
        category: 'personal-finance',
        modifiedDate: '2026-04-10',
        publishDate: '2026-01-01',
      }),
      makeContent('tastyfx-review', {
        market: 'au',
        category: 'forex',
        modifiedDate: '2026-03-05',
        publishDate: '2026-01-01',
      }),
    ]);

    const entries = await sitemap();
    const researchEntries = entries.filter((e) => e.url.endsWith('/research'));
    const byUrl = new Map(researchEntries.map((e) => [e.url, e]));

    // Exactly one entry per market — no duplicates, no missing market.
    expect(byUrl.size).toBe(4);
    expect([...byUrl.keys()].sort()).toEqual(
      [
        `${BASE_URL}/research`,
        `${BASE_URL}/uk/research`,
        `${BASE_URL}/ca/research`,
        `${BASE_URL}/au/research`,
      ].sort(),
    );

    expect(byUrl.get(`${BASE_URL}${researchBaseForMarket('us')}`)?.lastModified).toEqual(
      new Date('2026-07-01'),
    );
    expect(byUrl.get(`${BASE_URL}${researchBaseForMarket('uk')}`)?.lastModified).toEqual(
      new Date('2026-05-20'),
    );
    expect(byUrl.get(`${BASE_URL}${researchBaseForMarket('ca')}`)?.lastModified).toEqual(
      new Date('2026-04-10'),
    );
    expect(byUrl.get(`${BASE_URL}${researchBaseForMarket('au')}`)?.lastModified).toEqual(
      new Date('2026-03-05'),
    );
  });

  it('falls back to "now" for a market with no MDX content at all', async () => {
    mockGetAllContent.mockResolvedValue([
      makeContent('fidelity-review', {
        market: 'us',
        category: 'trading',
        modifiedDate: '2026-06-15',
        publishDate: '2026-01-01',
      }),
    ]);

    const before = Date.now();
    const entries = await sitemap();
    const after = Date.now();

    const uk = entries.find((e) => e.url === `${BASE_URL}${researchBaseForMarket('uk')}`);
    expect(uk).toBeDefined();
    const lastModified = uk!.lastModified as Date;
    expect(lastModified.getTime()).toBeGreaterThanOrEqual(before);
    expect(lastModified.getTime()).toBeLessThanOrEqual(after);
  });
});
