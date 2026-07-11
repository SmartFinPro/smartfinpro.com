// components/marketing/related-comparisons.tsx
// End-of-page cross-links between Best-X cockpits. Keeps link equity circulating
// inside the Best-X silo instead of every cockpit dead-ending back at the homepage hub.

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { RelatedComparisonItem } from '@/lib/comparison/related-comparisons';

export type { RelatedComparisonItem };

const BORDER = '#E1E7F0';

interface RelatedComparisonsProps {
  items: RelatedComparisonItem[];
}

export function RelatedComparisons({ items }: RelatedComparisonsProps) {
  if (items.length === 0) return null;

  return (
    <section className="mt-12" aria-labelledby="related-comparisons-heading">
      <h2 id="related-comparisons-heading" className="text-2xl font-bold tracking-tight" style={{ color: 'var(--sfp-ink)' }}>
        Related comparisons
      </h2>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center justify-between gap-3 rounded-xl border bg-white p-4 no-underline transition-shadow hover:shadow-md"
            style={{ borderColor: BORDER }}
          >
            <span>
              <span className="block text-[11px] font-bold uppercase tracking-[0.8px]" style={{ color: 'var(--sfp-green)' }}>
                {item.categoryLabel}
              </span>
              <span className="mt-1 block text-sm font-semibold" style={{ color: 'var(--sfp-ink)' }}>
                {item.label}
              </span>
            </span>
            <ArrowRight size={16} aria-hidden="true" style={{ color: 'var(--sfp-navy)', flexShrink: 0 }} />
          </Link>
        ))}
      </div>
    </section>
  );
}
