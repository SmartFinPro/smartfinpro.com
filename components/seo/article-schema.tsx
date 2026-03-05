import { generateArticleSchema } from '@/lib/seo/schema';

interface ArticleSchemaProps {
  title: string;
  description: string;
  publishDate: string;
  modifiedDate: string;
  author: string;
  image?: string;
  url: string;
  /** Fact-checker / reviewer — shown as reviewedBy Person in JSON-LD */
  reviewedBy?: string;
  /** Canonical profile URL for the reviewer (e.g. LinkedIn or /about) */
  reviewedByUrl?: string;
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
  reviewedBy,
  reviewedByUrl,
}: ArticleSchemaProps) {
  const schema = generateArticleSchema({
    title,
    description,
    publishDate,
    modifiedDate,
    author,
    image,
    url,
    reviewedBy,
    reviewedByUrl,
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
