// components/marketing/report-card.tsx
// Premium report card for listing pages (market.us "Latest Reports" style)

import Link from 'next/link';
import { Star, Calendar, Globe, Unlock } from 'lucide-react';
import type { Market, Category } from '@/lib/i18n/config';

interface ReportCardProps {
  title: string;
  description: string;
  slug: string;
  market: Market;
  category: Category;
  rating?: number;
  reviewCount?: number;
  publishDate?: string;
  pricing?: string;
}

export function ReportCard({
  title,
  description,
  slug,
  market,
  category,
  rating,
  reviewCount,
  publishDate,
  pricing,
}: ReportCardProps) {
  const marketPrefix = `/${market}`;
  const href = `${marketPrefix}/${category}/${slug}`;

  // Format date
  const formattedDate = publishDate
    ? new Date(publishDate).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      })
    : null;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <div className="p-6">
        {/* Title */}
        <Link href={href}>
          <h3
            className="text-lg font-bold leading-snug hover:underline underline-offset-2 transition-colors"
            style={{ color: 'var(--sfp-navy)' }}
          >
            {title}
          </h3>
        </Link>

        {/* Description */}
        <p
          className="text-sm mt-3 line-clamp-2 leading-relaxed"
          style={{ color: 'var(--sfp-slate)' }}
        >
          {description}
        </p>
      </div>

      {/* Meta-Bar */}
      <div
        className="flex flex-wrap items-center gap-4 px-6 py-3 border-t border-gray-100 text-xs"
        style={{ background: 'var(--sfp-gray)' }}
      >
        {/* Star Rating */}
        {rating && (
          <span className="inline-flex items-center gap-1.5">
            <span className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className="h-3.5 w-3.5"
                  style={{
                    color: star <= Math.round(rating) ? 'var(--sfp-gold)' : '#D1D5DB',
                    fill: star <= Math.round(rating) ? 'var(--sfp-gold)' : 'none',
                  }}
                />
              ))}
            </span>
            {reviewCount && (
              <span style={{ color: 'var(--sfp-slate)' }}>
                ({reviewCount.toLocaleString('en-US')})
              </span>
            )}
          </span>
        )}

        {/* Separator */}
        {rating && formattedDate && (
          <span className="text-gray-300">|</span>
        )}

        {/* Date */}
        {formattedDate && (
          <span
            className="inline-flex items-center gap-1"
            style={{ color: 'var(--sfp-slate)' }}
          >
            <Calendar className="h-3 w-3" />
            {formattedDate}
          </span>
        )}

        {/* Separator */}
        {formattedDate && (
          <span className="text-gray-300">|</span>
        )}

        {/* Market */}
        <span
          className="inline-flex items-center gap-1"
          style={{ color: 'var(--sfp-slate)' }}
        >
          <Globe className="h-3 w-3" />
          {market.toUpperCase()}
        </span>

        {/* Separator */}
        <span className="text-gray-300">|</span>

        {/* Access */}
        <span
          className="inline-flex items-center gap-1 font-medium"
          style={{ color: 'var(--sfp-green)' }}
        >
          <Unlock className="h-3 w-3" />
          Free Access
        </span>

        {/* Pricing (if available) */}
        {pricing && (
          <>
            <span className="text-gray-300">|</span>
            <span style={{ color: 'var(--sfp-slate)' }}>{pricing}</span>
          </>
        )}
      </div>
    </div>
  );
}
