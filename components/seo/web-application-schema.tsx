import { generateWebApplicationSchema } from '@/lib/seo/schema';

interface WebApplicationSchemaProps {
  name: string;
  url: string;
  description: string;
  applicationCategory?: 'FinanceApplication';
}

/**
 * WebApplication Schema Component
 *
 * Renders WebApplication schema for interactive tool/calculator pages
 * (FDL 0.7). No aggregateRating is emitted — see generateWebApplicationSchema.
 *
 * Best for:
 * - Interactive calculators (Money Leak Scanner, Debt Payoff Calculator, ...)
 * - Any free browser-based tool page
 *
 * Usage:
 * ```tsx
 * <WebApplicationSchema
 *   name="Debt Payoff Calculator"
 *   url="https://smartfinpro.com/tools/debt-payoff-calculator"
 *   description="Create a realistic timeline to eliminate your debt."
 * />
 * ```
 */
export function WebApplicationSchema({
  name,
  url,
  description,
  applicationCategory = 'FinanceApplication',
}: WebApplicationSchemaProps) {
  const schema = generateWebApplicationSchema({ name, url, description, applicationCategory });

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema),
      }}
    />
  );
}
