import { MetadataRoute } from 'next';
import { getAllContent } from '@/lib/mdx';
import { markets, marketCategories, Market } from '@/lib/i18n/config';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://smartfinpro.com';

// Broker review slugs available across all markets
const brokerSlugs = ['etoro', 'capital-com', 'ibkr', 'investing', 'revolut', 'ig', 'plus500'];

// Static tool pages (not market-prefixed)
const toolPages = [
  '/tools',
  '/tools/broker-finder',
  '/tools/trading-cost-calculator',
  '/tools/ai-roi-calculator',
  '/tools/loan-calculator',
  '/tools/broker-comparison',
  '/ca/tools/wealthsimple-calculator',
  '/au/tools/au-mortgage-calculator',
  '/uk/tools/isa-tax-savings-calculator',
  '/tools/credit-card-rewards-calculator',
  '/tools/debt-payoff-calculator',
  '/uk/tools/remortgage-calculator',
  '/tools/credit-score-simulator',
  '/au/tools/superannuation-calculator',
  '/ca/tools/tfsa-rrsp-calculator',
  '/tools/gold-roi-calculator',
  '/ca/tools/ca-mortgage-affordability-calculator',
];

// Cross-market hub pages (not market-prefixed)
const hubPages = [
  '/ai-financial-coaching',
  '/green-finance',
];

// Silo-specific pages per market (paths relative to market prefix)
const siloPages: Record<string, string[]> = {
  us: [
    '/credit-repair',
    '/debt-relief',
    '/credit-score',
  ],
  uk: [
    '/remortgaging',
    '/cost-of-living',
    '/savings',
  ],
  au: [
    '/superannuation',
    '/gold-investing',
    '/savings',
  ],
  ca: [
    '/tax-efficient-investing',
    '/housing',
  ],
};

// Other static pages (not market-prefixed)
const staticPages = [
  '/trading-platforms/tradingview',
  '/downloads/ai-finance-workflow',
  '/privacy',
  '/imprint',
  '/affiliate-disclosure',
  '/about',
  '/editorial-policy',
  '/contact',
  '/methodology',
  '/terms',
];

/**
 * All markets use /{market} prefix (symmetric routing).
 */
function marketUrl(market: string, path: string): string {
  return `${BASE_URL}/${market}${path}`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const entries: MetadataRoute.Sitemap = [];
    const now = new Date();

    // ============================================================
    // 1. MARKET HOMEPAGES — Priority 1.0/0.9
    // ============================================================

    for (const market of markets) {
      entries.push({
        url: `${BASE_URL}/${market}`,
        lastModified: now,
        changeFrequency: 'daily',
        priority: market === 'us' ? 1.0 : 0.9,
      });
    }

    // ============================================================
    // 2. PILLAR PAGES (Category Pages) — Priority 0.9
    // ============================================================

    for (const market of markets) {
      const cats = marketCategories[market as Market] || [];
      for (const category of cats) {
        entries.push({
          url: marketUrl(market, `/${category}`),
          lastModified: now,
          changeFrequency: 'weekly',
          priority: 0.9,
        });
      }
    }

    // ============================================================
    // 3. OVERVIEW PAGES — Priority 0.85
    // ============================================================

    for (const market of markets) {
      const cats = marketCategories[market as Market] || [];
      for (const category of cats) {
        entries.push({
          url: marketUrl(market, `/${category}/overview`),
          lastModified: now,
          changeFrequency: 'weekly',
          priority: 0.85,
        });
      }
    }

    // ============================================================
    // 4. BROKER REVIEW PAGES — Priority 0.8
    // ============================================================

    for (const market of markets) {
      for (const broker of brokerSlugs) {
        entries.push({
          url: marketUrl(market, `/reviews/${broker}`),
          lastModified: now,
          changeFrequency: 'weekly',
          priority: 0.8,
        });
      }
    }

    // ============================================================
    // 5. CONTENT PAGES (MDX Reviews & Articles) — Priority 0.7-0.8
    // ============================================================

    const allContent = await getAllContent();

    for (const content of allContent) {
      if (content.slug === 'index') continue;

      const market = content.meta.market || 'us';
      const category = content.meta.category;
      if (!category) continue;

      const lastMod = content.meta.modifiedDate
        ? new Date(content.meta.modifiedDate)
        : content.meta.publishDate
          ? new Date(content.meta.publishDate)
          : now;

      entries.push({
        url: marketUrl(market, `/${category}/${content.slug}`),
        lastModified: lastMod,
        changeFrequency: 'weekly',
        priority: content.meta.featured ? 0.8 : 0.7,
      });
    }

    // ============================================================
    // 6. SILO PAGES (Market-specific) — Priority 0.85
    // ============================================================

    for (const market of markets) {
      const pages = siloPages[market] || [];
      for (const path of pages) {
        entries.push({
          url: marketUrl(market, path),
          lastModified: now,
          changeFrequency: 'weekly',
          priority: 0.85,
        });
      }
    }

    // ============================================================
    // 7. CROSS-MARKET HUB PAGES — Priority 0.8
    // ============================================================

    for (const path of hubPages) {
      entries.push({
        url: `${BASE_URL}${path}`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    }

    // ============================================================
    // 8. TOOL PAGES — Priority 0.75
    // ============================================================

    for (const path of toolPages) {
      entries.push({
        url: `${BASE_URL}${path}`,
        lastModified: now,
        changeFrequency: 'monthly',
        priority: path === '/tools' ? 0.8 : 0.75,
      });
    }

    // ============================================================
    // 9. STATIC PAGES — Priority 0.5-0.6
    // ============================================================

    for (const path of staticPages) {
      entries.push({
        url: `${BASE_URL}${path}`,
        lastModified: now,
        changeFrequency: 'monthly',
        priority: 0.6,
      });
    }

    return entries;
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown sitemap error';
    console.error('[sitemap] fallback sitemap emitted:', msg);
    const now = new Date();
    return [
      {
        url: `${BASE_URL}/us`,
        lastModified: now,
        changeFrequency: 'daily',
        priority: 1.0,
      },
      {
        url: `${BASE_URL}/tools`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.8,
      },
    ];
  }
}
