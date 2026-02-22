import { generateComparisonTableSchema } from '@/lib/seo/schema';

interface ComparisonProduct {
  name: string;
  rating: number;
  reviewCount: number;
  price: string;
  currency: string;
}

interface ComparisonSchemaProps {
  title: string;
  description?: string;
  products: ComparisonProduct[];
}

/**
 * Comparison Schema Component
 *
 * Renders ComparisonTable schema for product comparison pages
 * Helps Google understand product comparison context and improve SERP display
 *
 * Supports:
 * - Comparison title and description
 * - Product names and ratings
 * - Pricing information
 * - Review counts
 *
 * Best for:
 * - Broker comparison tables
 * - Side-by-side product comparisons
 * - Feature comparison matrices
 * - Price comparison pages
 *
 * Usage:
 * ```tsx
 * <ComparisonSchema
 *   title="Best Trading Brokers Comparison"
 *   description="Compare top trading platforms side-by-side"
 *   products={[
 *     {
 *       name: "Interactive Brokers",
 *       rating: 4.7,
 *       reviewCount: 2543,
 *       price: "0",
 *       currency: "USD"
 *     },
 *     {
 *       name: "TD Ameritrade",
 *       rating: 4.5,
 *       reviewCount: 1823,
 *       price: "0",
 *       currency: "USD"
 *     }
 *   ]}
 * />
 * ```
 */
export function ComparisonSchema({
  title,
  description,
  products,
}: ComparisonSchemaProps) {
  if (!products || products.length === 0) {
    return null;
  }

  const schema = generateComparisonTableSchema({
    title,
    description,
    products,
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
