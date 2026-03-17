import { generateReviewSchema } from '@/lib/seo/schema';
import type { ReviewData } from '@/types';

interface ReviewSchemaProps {
  review: ReviewData;
}

/**
 * Review Schema Component
 *
 * Renders Review schema for individual product/service reviews
 * Displays star ratings, reviewer information, and pros/cons in Google SERPs
 *
 * Supports:
 * - Rich snippet display with rating
 * - Author and publisher information
 * - Pros and cons as positive/negative notes
 * - Price and availability information
 *
 * Usage:
 * ```tsx
 * <ReviewSchema review={reviewData} />
 * ```
 */
export function ReviewSchema({ review }: ReviewSchemaProps) {
  if (!review.productName || review.rating == null) {
    console.warn('[ReviewSchema] Skipped: missing productName or rating');
    return null;
  }
  const schema = generateReviewSchema(review);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema),
      }}
    />
  );
}
