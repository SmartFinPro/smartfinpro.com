import { generateFinancialProductSchema } from '@/lib/seo/schema';

interface FinancialProductSchemaProps {
  name: string;
  description: string;
  brand?: string;
  rating: number;
  reviewCount: number;
  price?: string;
  priceCurrency?: string;
  features: string[];
  url?: string;
  image?: string;
  areaServed?: string[];
}

/**
 * FinancialProduct Schema Component
 *
 * Renders FinancialProduct schema for financial products and services
 * Helps Google understand financial service offerings and display them prominently
 *
 * Supports:
 * - Product name, brand, and description
 * - Aggregate ratings and review counts
 * - Pricing information
 * - Feature lists
 * - Geographic availability
 *
 * Best for:
 * - Trading platforms
 * - Brokers and investment services
 * - Credit card reviews
 * - Loan product pages
 * - Insurance products
 *
 * Usage:
 * ```tsx
 * <FinancialProductSchema
 *   name="Interactive Brokers"
 *   description="Advanced trading platform for active traders"
 *   brand="Interactive Brokers LLC"
 *   rating={4.7}
 *   reviewCount={2543}
 *   price="0"
 *   priceCurrency="USD"
 *   features={["Commission-free stocks", "Options trading", "Forex", "Crypto"]}
 *   url="https://smartfinpro.com/trading/interactive-brokers"
 *   areaServed={["US", "UK", "CA", "AU"]}
 * />
 * ```
 */
export function FinancialProductSchema({
  name,
  description,
  brand,
  rating,
  reviewCount,
  price,
  priceCurrency,
  features,
  url,
  image,
  areaServed,
}: FinancialProductSchemaProps) {
  const schema = generateFinancialProductSchema({
    name,
    description,
    brand,
    rating,
    reviewCount,
    price,
    priceCurrency,
    features,
    url,
    image,
    areaServed,
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
