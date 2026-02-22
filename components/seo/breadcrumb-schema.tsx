import { generateBreadcrumbSchema } from '@/lib/seo/schema';

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbSchemaProps {
  items: BreadcrumbItem[];
}

/**
 * Breadcrumb Schema Component
 *
 * Renders BreadcrumbList schema for site navigation
 * Displays breadcrumb navigation in Google SERPs for better UX
 *
 * Best for:
 * - Hierarchical page structures
 * - Category navigation (e.g., /us/trading/etoro-review)
 * - Improving SERP click-through rates (CTR)
 *
 * Usage:
 * ```tsx
 * <BreadcrumbSchema items={[
 *   { name: "Home", url: "https://smartfinpro.com" },
 *   { name: "Trading", url: "https://smartfinpro.com/trading" },
 *   { name: "eToro Review", url: "https://smartfinpro.com/trading/etoro-review" }
 * ]} />
 * ```
 */
export function BreadcrumbSchema({ items }: BreadcrumbSchemaProps) {
  if (!items || items.length === 0) {
    return null;
  }

  const schema = generateBreadcrumbSchema(items);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema),
      }}
    />
  );
}
