import { generateOrganizationSchema } from '@/lib/seo/schema';

/**
 * Organization Schema Component
 *
 * Renders Organization schema for SmartFinPro homepage
 * Helps Google understand the company structure and contact information
 *
 * Usage: Include once in the root layout
 */
export function OrganizationSchema() {
  const schema = generateOrganizationSchema();

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema),
      }}
    />
  );
}
