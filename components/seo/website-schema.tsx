import { generateWebsiteSchema } from '@/lib/seo/schema';

/**
 * Website Schema Component
 *
 * Renders WebSite schema for SmartFinPro
 * Helps Google understand the website's primary purpose and search functionality
 *
 * Usage: Include once in the root layout
 */
export function WebsiteSchema() {
  const schema = generateWebsiteSchema();

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema),
      }}
    />
  );
}
