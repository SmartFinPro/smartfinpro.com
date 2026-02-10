import { MetadataRoute } from 'next';
import { getAllContent } from '@/lib/mdx';
import { markets, marketCategories, Market } from '@/lib/i18n/config';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://smartfinpro.com';

// Broker review slugs available across all markets
const brokerSlugs = ['etoro', 'capital-com', 'ibkr', 'investing', 'revolut'];

// Static tool pages (not market-prefixed)
const toolPages = [
  '/tools',
  '/tools/broker-finder',
  '/tools/trading-cost-calculator',
  '/tools/ai-roi-calculator',
  '/tools/loan-calculator',
  '/tools/broker-comparison',
];

// Other static pages (not market-prefixed)
const staticPages = [
  '/trading-platforms/tradingview',
  '/downloads/ai-finance-workflow',
];

function marketUrl(market: string, path: string): string {
  return market === 'us' ? `${BASE_URL}${path}` : `${BASE_URL}/${market}${path}`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];
  const now = new Date();

  // ============================================================
  // 1. HOMEPAGE — Priority 1.0
  // ============================================================

  // US homepage (clean URL)
  entries.push({
    url: BASE_URL,
    lastModified: now,
    changeFrequency: 'daily',
    priority: 1.0,
  });

  // Regional homepages
  for (const market of markets) {
    if (market === 'us') continue;
    entries.push({
      url: `${BASE_URL}/${market}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
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
  // 6. TOOL PAGES — Priority 0.75
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
  // 7. STATIC PAGES — Priority 0.5-0.6
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
}
