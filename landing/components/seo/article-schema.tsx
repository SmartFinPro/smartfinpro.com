import { generateArticleSchema } from '@/lib/seo/schema';

interface ArticleSchemaProps {
  title: string;
  description: string;
  publishDate: string;
  modifiedDate: string;
  author: string;
  image?: string;
  url: string;
}

/**
 * Article Schema Component
 *
 * Renders Article schema for blog posts and long-form content
 * Helps Google understand article metadata for better indexing and display
 *
 * Supports:
 * - Article headline and description
 * - Publishing and modification dates
 * - Author information
 * - Featured image
 *
 * Best for:
 * - Blog articles
 * - Educational content
 * - How-to guides
 * - News articles
 *
 * Usage:
 * ```tsx
 * <ArticleSchema
 *   title="Complete Guide to AI Tools"
 *   description="A comprehensive review of..."
 *   publishDate="2024-01-15"
 *   modifiedDate="2024-02-20"
 *   author="John Doe"
 *   image="/images/header.jpg"
 *   url="https://smartfinpro.com/ai-tools-guide"
 * />
 * ```
 */
export function ArticleSchema({
  title,
  description,
  publishDate,
  modifiedDate,
  author,
  image,
  url,
}: ArticleSchemaProps) {
  const schema = generateArticleSchema({
    title,
    description,
    publishDate,
    modifiedDate,
    author,
    image,
    url,
  });

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema),
      }}
    />
  );
}
