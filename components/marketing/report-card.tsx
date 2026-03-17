// components/marketing/report-card.tsx
// Enterprise premium report card for listing pages

import Link from 'next/link';
import { Star, Calendar, Globe, Unlock } from 'lucide-react';
import type { Market, Category } from '@/lib/i18n/config';
import { categoryConfig } from '@/lib/i18n/config';

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
  const catConfig = categoryConfig[category];

  // Format date
  const formattedDate = publishDate
    ? new Date(publishDate).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      })
    : null;

  return (
    <div
      className="enterprise-card-hover overflow-hidden"
      style={{
        background: '#fff',
        border: '1px solid #E2E8F0',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      {/* 1px Navy accent top */}
      <div style={{ height: '1px', background: 'var(--sfp-navy)' }} />

      <div style={{ padding: '20px 24px' }}>
        {/* Top row: Category tag + Rating */}
        <div className="flex items-center justify-between" style={{ marginBottom: '12px' }}>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              padding: '3px 8px',
              borderRadius: '4px',
              background: 'var(--sfp-sky)',
              color: 'var(--sfp-navy)',
            }}
          >
            {catConfig?.name || category}
          </span>

          {rating && (
            <div className="flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5 fill-current" style={{ color: '#F59E0B' }} />
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--sfp-ink)', fontVariantNumeric: 'tabular-nums' }}>
                {rating}
              </span>
            </div>
          )}
        </div>

        {/* Title */}
        <Link href={href} className="no-underline">
          <h3
            className=""
            style={{
              fontSize: '17px',
              fontWeight: 700,
              lineHeight: 1.4,
              color: 'var(--sfp-ink)',
              letterSpacing: '-0.3px',
              marginBottom: '6px',
            }}
          >
            {title}
          </h3>
        </Link>

        {/* Description */}
        <p
          className="line-clamp-2"
          style={{
            fontSize: '14px',
            fontWeight: 400,
            lineHeight: 1.65,
            color: 'var(--sfp-slate)',
            marginBottom: 0,
          }}
        >
          {description}
        </p>
      </div>

      {/* Meta-Bar — dot separators, compact */}
      <div
        className="flex flex-wrap items-center"
        style={{
          padding: '12px 24px',
          gap: '16px',
          fontSize: '12px',
          background: 'var(--sfp-gray)',
          borderTop: '1px solid #E2E8F0',
        }}
      >
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

        {formattedDate && <span style={{ color: '#D1D5DB' }}>·</span>}

        {/* Market */}
        <span
          className="inline-flex items-center gap-1"
          style={{ color: 'var(--sfp-slate)' }}
        >
          <Globe className="h-3 w-3" />
          {market.toUpperCase()}
        </span>

        <span style={{ color: '#D1D5DB' }}>·</span>

        {/* Access */}
        <span
          className="inline-flex items-center gap-1"
          style={{ color: 'var(--sfp-slate)', fontWeight: 500 }}
        >
          <Unlock className="h-3 w-3" />
          Free Access
        </span>

        {/* Pricing (if available) */}
        {pricing && (
          <>
            <span style={{ color: '#D1D5DB' }}>·</span>
            <span style={{ color: 'var(--sfp-slate)' }}>{pricing}</span>
          </>
        )}
      </div>
    </div>
  );
}
