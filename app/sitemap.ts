import { MetadataRoute } from 'next';
import { getAllContent } from '@/lib/mdx';
import { markets, marketCategories, Market } from '@/lib/i18n/config';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://smartfinpro.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];
  const now = new Date();

  // ============================================================
  // STATIC PAGES
  // ============================================================

  // Homepage (US default)
  entries.push({
    url: BASE_URL,
    lastModified: now,
    changeFrequency: 'daily',
    priority: 1.0,
  });

  // Market homepages (UK, CA, AU)
  markets.filter(m => m !== 'us').forEach(market => {
    entries.push({
      url: `${BASE_URL}/${market}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    });
  });

  // ============================================================
  // CATEGORY PAGES (Pillar Pages)
  // ============================================================

  for (const market of markets) {
    const marketCats = marketCategories[market as Market] || [];

    for (const category of marketCats) {
      const url = market === 'us'
        ? `${BASE_URL}/${category}`
        : `${BASE_URL}/${market}/${category}`;

      entries.push({
        url,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.9,
      });
    }
  }

  // ============================================================
  // CONTENT PAGES (Reviews, Articles)
  // ============================================================

  const allContent = await getAllContent();

  for (const content of allContent) {
    // Skip index files (they're pillar pages handled above)
    if (content.slug === 'index') continue;

    const market = content.meta.market || 'us';
    const category = content.meta.category;

    if (!category) continue;

    const url = market === 'us'
      ? `${BASE_URL}/${category}/${content.slug}`
      : `${BASE_URL}/${market}/${category}/${content.slug}`;

    // Use modifiedDate if available, otherwise publishDate
    const lastMod = content.meta.modifiedDate
      ? new Date(content.meta.modifiedDate)
      : content.meta.publishDate
        ? new Date(content.meta.publishDate)
        : now;

    entries.push({
      url,
      lastModified: lastMod,
      changeFrequency: 'weekly',
      priority: content.meta.featured ? 0.8 : 0.7,
    });
  }

  // ============================================================
  // UTILITY PAGES
  // ============================================================

  const utilityPages = [
    { path: '/downloads/ai-finance-workflow', priority: 0.6 },
  ];

  for (const page of utilityPages) {
    entries.push({
      url: `${BASE_URL}${page.path}`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: page.priority,
    });
  }

  return entries;
}
