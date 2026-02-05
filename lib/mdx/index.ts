import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import readingTime from 'reading-time';
import { Market, Category } from '@/lib/i18n/config';

const contentDirectory = path.join(process.cwd(), 'content');

export interface ContentMeta {
  title: string;
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
  guarantee?: string;
  faqs?: { question: string; answer: string }[];
  sections?: { id: string; title: string }[];
  featured?: boolean;
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
      meta: data as ContentMeta,
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

  return {
    slug,
    meta: data as ContentMeta,
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
    meta: data as ContentMeta,
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
