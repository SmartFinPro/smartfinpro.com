import { generateAggregateRatingSchema } from '@/lib/seo/schema';

interface AggregateRatingSchemaProps {
  ratingValue: number;
  reviewCount: number;
  ratedBy?: string;
}

/**
 * AggregateRating Schema Component
 *
 * Renders AggregateRating schema for standalone rating displays
 * Helps Google understand rating context on comparison and overview pages
 *
 * Supports:
 * - Numeric rating value
 * - Review/vote count
 * - Rating authority
 *
 * Best for:
 * - Quick rating displays
 * - Winner badges
 * - Product comparison headers
 * - Rating widget context
 *
 * Usage:
 * ```tsx
 * <AggregateRatingSchema
 *   ratingValue={4.8}
 *   reviewCount={1250}
 *   ratedBy="SmartFinPro Users"
 * />
 * ```
 */
export function AggregateRatingSchema({
  ratingValue,
  reviewCount,
  ratedBy,
}: AggregateRatingSchemaProps) {
  if (ratingValue == null || reviewCount == null) {
    console.warn('[AggregateRatingSchema] Skipped: missing ratingValue or reviewCount');
    return null;
  }
  const schema = generateAggregateRatingSchema({
    ratingValue,
    reviewCount,
    ratedBy,
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
