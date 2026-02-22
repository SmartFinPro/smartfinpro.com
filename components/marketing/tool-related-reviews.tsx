import Link from 'next/link';
import { ArrowRight, Star } from 'lucide-react';

interface RelatedReview {
  name: string;
  href: string;
  rating?: number;
  badge?: string;
}

interface ToolRelatedReviewsProps {
  title?: string;
  subtitle?: string;
  reviews: RelatedReview[];
}

/**
 * Contextual back-links from tool pages to relevant reviews.
 * Closes the silo gap: Tool -> Review -> Pillar -> Tool.
 */
export function ToolRelatedReviews({
  title = 'Related Reviews',
  subtitle = 'Deep-dive into the products featured in this tool.',
  reviews,
}: ToolRelatedReviewsProps) {
  if (!reviews || reviews.length === 0) return null;

  return (
    <div className="mt-12 pt-8 border-t border-gray-200">
      <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--sfp-ink)' }}>{title}</h3>
      <p className="text-sm mb-5" style={{ color: 'var(--sfp-slate)' }}>{subtitle}</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {reviews.map((review) => (
          <Link
            key={review.href}
            href={review.href}
            className="group flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white shadow-sm px-4 py-3 transition-all duration-200 hover:border-gray-300 hover:shadow-md"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div>
                <p className="text-sm font-medium transition-colors truncate" style={{ color: 'var(--sfp-ink)' }}>
                  {review.name}
                </p>
                {review.rating && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                    <span className="text-xs" style={{ color: 'var(--sfp-slate)' }}>{review.rating}/5</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {review.badge && (
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                  style={{ background: 'var(--sfp-sky)', color: 'var(--sfp-navy)' }}
                >
                  {review.badge}
                </span>
              )}
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-all" style={{ color: 'var(--sfp-slate)' }} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
