import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import readingTime from 'reading-time';
import { Market, Category } from '@/lib/i18n/config';
import { applyFreshnessOverride } from '@/lib/mdx/content-overrides-loader';

const contentDirectory = path.join(process.cwd(), 'content');

export interface ContentMeta {
  title: string;
  seoTitle?: string;
  description: string;
  author: string;
  reviewedBy?: string;
  publishDate: string;
  modifiedDate: string;
  category: Category;
  market: Market;
  rating?: number;
  reviewCount?: number;
  affiliateUrl?: string;
  affiliateDisclosure: boolean;
  pros?: string[];
  cons?: string[];
  bestFor?: string;
  pricing?: string;
  currency?: string;
  guarantee?: string;
  faqs?: { question: string; answer: string }[];
  sections?: { id: string; title: string }[];
  featured?: boolean;
  customH1?: boolean;
  keywords?: string[];
  miniQuiz?: { topic: string; market?: string; title?: string };
}

// ── Currency Map ────────────────────────────────────────────
const MARKET_CURRENCY: Record<string, string> = {
  us: 'USD',
  uk: 'GBP',
  ca: 'CAD',
  au: 'AUD',
};

/**
 * Normalize raw frontmatter data to the canonical ContentMeta schema.
 * Handles both camelCase (new) and snake_case (legacy) field names,
 * and flattens nested `schema` objects used by some older MDX files.
 */
function normalizeFrontmatter(raw: Record<string, unknown>): ContentMeta {
  const today = new Date().toISOString().split('T')[0];
  const schema = (raw.schema || {}) as Record<string, unknown>;

  return {
    title: String(raw.title || ''),
    seoTitle: (raw.seoTitle as string) || undefined,
    description: String(raw.description || ''),
    author: String(raw.author || 'SmartFinPro Editorial Team'),
    reviewedBy: (raw.reviewedBy as string) || undefined,
    publishDate: String(raw.publishDate || raw.date || today),
    modifiedDate: String(raw.modifiedDate || raw.date || today),
    category: (raw.category || '') as Category,
    market: (raw.market || 'us') as Market,
    rating: (raw.rating as number) ?? (schema.rating as number) ?? undefined,
    reviewCount: (raw.reviewCount as number) ?? (schema.review_count as number) ?? undefined,
    affiliateUrl: (raw.affiliateUrl as string) ?? (raw.affiliate_link as string) ?? undefined,
    affiliateDisclosure: raw.affiliateDisclosure !== false,
    pros: (raw.pros as string[]) ?? undefined,
    cons: (raw.cons as string[]) ?? undefined,
    bestFor: (raw.bestFor as string) ?? undefined,
    pricing: (raw.pricing as string) ?? undefined,
    currency: (raw.currency as string) ?? MARKET_CURRENCY[raw.market as string] ?? 'USD',
    guarantee: (raw.guarantee as string) ?? undefined,
    faqs: (raw.faqs as ContentMeta['faqs']) ?? undefined,
    sections: (raw.sections as ContentMeta['sections']) ?? undefined,
    featured: Boolean(raw.featured),
    customH1: Boolean(raw.customH1),
    keywords: (raw.keywords as string[]) ?? undefined,
    miniQuiz: (raw.miniQuiz as ContentMeta['miniQuiz']) ?? undefined,
  };
}

export interface ContentItem {
  slug: string;
  meta: ContentMeta;
  content: string;
  readingTime: {
    text: string;
    minutes: number;
    time: number;
    words: number;
  };
}

/**
 * Compute a quality score (0–100) for internal linking prioritization.
 * Used to sort and gate reviews in Pillar pages and "More Reviews" sections.
 *
 * Signals (weighted):
 *   40 pts — Word count (E-E-A-T depth signal)
 *   30 pts — Recency / freshness
 *   20 pts — Rating present + value
 *   10 pts — ReviewCount present (social proof)
 *
 * Score >= QUALITY_SCORE_THRESHOLD = indexing-worthy, included in internal links.
 * Score < threshold = thin/stale content, excluded from navigation (still crawlable).
 */
export function computeQualityScore(item: ContentItem): number {
  let score = 0;

  // 1. Word count — depth/E-E-A-T signal (40 pts max)
  const words = item.readingTime.words;
  if (words >= 3000)      score += 40;
  else if (words >= 1500) score += 25;
  else if (words >= 800)  score += 10;
  // < 800: 0 pts — genuine thin content

  // 2. Recency — freshness signal (30 pts max)
  const dateStr = item.meta.modifiedDate || item.meta.publishDate;
  const ageMonths = dateStr
    ? (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24 * 30)
    : 99;
  if (ageMonths <= 3)       score += 30;
  else if (ageMonths <= 6)  score += 20;
  else if (ageMonths <= 12) score += 10;
  // > 12 months: 0 pts

  // 3. Rating (20 pts max)
  if (item.meta.rating) {
    score += Math.min(20, Math.round((item.meta.rating / 5) * 20));
  }

  // 4. ReviewCount (10 pts)
  if (item.meta.reviewCount && item.meta.reviewCount > 0) score += 10;

  return score;
}

/** Minimum quality score for inclusion in internal link sections (Pillar + siblingReviews) */
export const QUALITY_SCORE_THRESHOLD = 20;

/**
 * Starvation fallback: if a category has fewer than this many reviews after quality
 * filtering, fall back to ALL reviews sorted by score. Ensures every category page
 * and every review page always has minimum internal link coverage — even small or
 * newly-seeded categories with few high-scoring articles.
 */
export const QUALITY_FALLBACK_MIN = 8;

/**
 * Get all content files from a specific market/category
 */
export async function getContentByMarketAndCategory(
  market: Market,
  category: Category
): Promise<ContentItem[]> {
  const dirPath = path.join(contentDirectory, market, category);

  if (!fs.existsSync(dirPath)) {
    return [];
  }

  const files = fs.readdirSync(dirPath).filter((file) => file.endsWith('.mdx'));

  return files.map((file) => {
    const slug = file.replace('.mdx', '');
    const fullPath = path.join(dirPath, file);
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);

    return {
      slug,
      meta: normalizeFrontmatter(data as Record<string, unknown>),
      content,
      readingTime: readingTime(content),
    };
  });
}

/**
 * Get a single content item by slug
 */
export async function getContentBySlug(
  market: Market,
  category: Category,
  slug: string
): Promise<ContentItem | null> {
  const filePath = path.join(contentDirectory, market, category, `${slug}.mdx`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const fileContents = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(fileContents);
  const meta = normalizeFrontmatter(data as Record<string, unknown>);

  // Apply freshness override from content_overrides table (build-time)
  if (meta.modifiedDate) {
    const urlSlug = market === 'us'
      ? `/${category}/${slug}`
      : `/${market}/${category}/${slug}`;
    meta.modifiedDate = await applyFreshnessOverride(urlSlug, meta.modifiedDate);
  }

  return {
    slug,
    meta,
    content,
    readingTime: readingTime(content),
  };
}

/**
 * Get pillar page content (index.mdx) for a category
 */
export async function getPillarContent(
  market: Market,
  category: Category
): Promise<ContentItem | null> {
  const filePath = path.join(contentDirectory, market, category, 'index.mdx');

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const fileContents = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(fileContents);

  return {
    slug: 'index',
    meta: normalizeFrontmatter(data as Record<string, unknown>),
    content,
    readingTime: readingTime(content),
  };
}

/**
 * Get all slugs for static generation
 */
export async function getAllContentSlugs(): Promise<
  { market: Market; category: Category; slug: string }[]
> {
  const slugs: { market: Market; category: Category; slug: string }[] = [];

  const markets = fs.readdirSync(contentDirectory);

  for (const market of markets) {
    const marketPath = path.join(contentDirectory, market);

    if (!fs.statSync(marketPath).isDirectory()) continue;

    const categories = fs.readdirSync(marketPath);

    for (const category of categories) {
      const categoryPath = path.join(marketPath, category);

      if (!fs.statSync(categoryPath).isDirectory()) continue;

      const files = fs.readdirSync(categoryPath).filter((f) => f.endsWith('.mdx'));

      for (const file of files) {
        slugs.push({
          market: market as Market,
          category: category as Category,
          slug: file.replace('.mdx', ''),
        });
      }
    }
  }

  return slugs;
}

/**
 * Get featured content across all markets
 */
export async function getFeaturedContent(
  limit: number = 6
): Promise<ContentItem[]> {
  const allContent = await getAllContentSlugs();
  const featuredItems: ContentItem[] = [];

  for (const { market, category, slug } of allContent) {
    const item = await getContentBySlug(market, category, slug);
    if (item?.meta.featured) {
      featuredItems.push(item);
    }
    if (featuredItems.length >= limit) break;
  }

  return featuredItems;
}

/**
 * Get related content by category
 */
export async function getRelatedContent(
  market: Market,
  category: Category,
  currentSlug: string,
  limit: number = 3
): Promise<ContentItem[]> {
  const allInCategory = await getContentByMarketAndCategory(market, category);

  return allInCategory
    .filter((item) => item.slug !== currentSlug)
    .slice(0, limit);
}

/**
 * Related category mapping for cross-cluster linking
 */
const relatedCategories: Partial<Record<Category, Category[]>> = {
  'ai-tools': ['trading', 'business-banking'],
  trading: ['forex', 'ai-tools'],
  forex: ['trading', 'ai-tools'],
  cybersecurity: ['ai-tools', 'business-banking'],
  'personal-finance': ['business-banking', 'ai-tools'],
  'business-banking': ['personal-finance', 'ai-tools'],
  'credit-repair': ['debt-relief', 'credit-score', 'personal-finance'],
  'debt-relief': ['credit-repair', 'credit-score', 'personal-finance'],
  'credit-score': ['credit-repair', 'personal-finance'],
  remortgaging: ['cost-of-living', 'savings', 'personal-finance'],
  'cost-of-living': ['remortgaging', 'savings'],
  savings: ['cost-of-living', 'remortgaging', 'personal-finance'],
  superannuation: ['gold-investing', 'savings', 'personal-finance'],
  'gold-investing': ['superannuation', 'trading'],
  'tax-efficient-investing': ['housing', 'personal-finance'],
  housing: ['tax-efficient-investing', 'personal-finance'],
};

/**
 * Get content from related categories for cross-cluster linking
 */
export async function getCrossCategoryContent(
  market: Market,
  currentCategory: Category,
  limit: number = 2
): Promise<ContentItem[]> {
  const related = relatedCategories[currentCategory] || [];
  const items: ContentItem[] = [];

  for (const cat of related) {
    if (items.length >= limit) break;
    const catContent = await getContentByMarketAndCategory(market, cat);
    const reviews = catContent.filter((item) => item.slug !== 'index' && item.meta.rating);
    if (reviews.length > 0) {
      items.push(reviews[0]);
    }
  }

  return items.slice(0, limit);
}

/**
 * Get all content items across all markets and categories
 */
export async function getAllContent(): Promise<ContentItem[]> {
  const allSlugs = await getAllContentSlugs();
  const items: ContentItem[] = [];

  for (const { market, category, slug } of allSlugs) {
    const item = await getContentBySlug(market, category, slug);
    if (item) {
      items.push(item);
    }
  }

  return items;
}

/**
 * Search content by query
 */
export async function searchContent(
  query: string,
  market?: Market
): Promise<ContentItem[]> {
  const allSlugs = await getAllContentSlugs();
  const results: ContentItem[] = [];
  const lowerQuery = query.toLowerCase();

  for (const { market: itemMarket, category, slug } of allSlugs) {
    if (market && itemMarket !== market) continue;

    const item = await getContentBySlug(itemMarket, category, slug);
    if (!item) continue;

    // Search in title, description, and content
    if (
      item.meta.title.toLowerCase().includes(lowerQuery) ||
      item.meta.description.toLowerCase().includes(lowerQuery) ||
      item.content.toLowerCase().includes(lowerQuery)
    ) {
      results.push(item);
    }
  }

  return results;
}
