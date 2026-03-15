import { generatePersonSchema } from '@/lib/seo/schema';

interface PersonSchemaProps {
  name: string;
  url?: string;
  image?: string;
  jobTitle?: string;
  description?: string;
  affiliateLinks?: string[];
}

/**
 * Person Schema Component
 *
 * Renders Person schema for author/expert profiles
 * Helps Google understand individual contributors and their expertise
 *
 * Supports:
 * - Person name and professional title
 * - Professional image
 * - Biography/description
 * - Affiliate associations
 *
 * Best for:
 * - Author bylines on review pages
 * - Expert contributor profiles
 * - About page author information
 *
 * Usage:
 * ```tsx
 * <PersonSchema
 *   name="John Smith"
 *   jobTitle="Financial Analyst"
 *   description="Certified financial analyst with 10+ years experience"
 *   image="/images/john-smith.jpg"
 *   url="https://smartfinpro.com/author/john-smith"
 * />
 * ```
 */
export function PersonSchema({
  name,
  url,
  image,
  jobTitle,
  description,
  affiliateLinks,
}: PersonSchemaProps) {
  if (!name) {
    console.warn('[PersonSchema] Skipped: missing name');
    return null;
  }
  const schema = generatePersonSchema({
    name,
    url,
    image,
    jobTitle,
    description,
    affiliateLinks,
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
