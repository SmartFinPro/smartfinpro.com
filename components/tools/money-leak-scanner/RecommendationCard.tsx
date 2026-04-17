'use client';

import { ArrowRight, CheckCircle2 } from 'lucide-react';
import type { Recommendation } from '@/lib/money-leak/types';

interface RecommendationCardProps {
  recommendation: Recommendation;
  currencySymbol: string;
  scanId: string;
  onClick?: (rec: Recommendation) => void;
}

export function RecommendationCard({
  recommendation: rec,
  currencySymbol,
  scanId,
  onClick,
}: RecommendationCardProps) {
  const url = `${rec.trackUrl}?utm_source=money-leak&utm_medium=scanner&utm_campaign=${scanId}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener sponsored"
      onClick={() => onClick?.(rec)}
      className="group relative block rounded-2xl border bg-white p-5 transition-all hover:shadow-lg hover:-translate-y-0.5"
      style={{
        borderColor: '#E5E7EB',
      }}
    >
      {/* Gold accent bar */}
      <div
        className="absolute left-0 top-5 bottom-5 w-1 rounded-r-full"
        style={{ background: 'var(--sfp-gold)' }}
      />

      <div className="ml-2">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="text-lg font-bold" style={{ color: 'var(--sfp-ink)' }}>
            {rec.partner_name}
          </h3>
          <span
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
            style={{ background: 'var(--sfp-sky)', color: 'var(--sfp-navy)' }}
          >
            Best match
          </span>
        </div>

        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-2xl font-extrabold tabular-nums" style={{ color: 'var(--sfp-green)' }}>
            {currencySymbol}
            {Math.round(rec.projectedAnnualSavings).toLocaleString('en-US')}
          </span>
          <span className="text-sm" style={{ color: 'var(--sfp-slate)' }}>
            projected annual savings
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs mb-4" style={{ color: 'var(--sfp-slate)' }}>
          <CheckCircle2 className="h-4 w-4" style={{ color: 'var(--sfp-green)' }} />
          <span>Independently reviewed by SmartFinPro</span>
        </div>

        <div
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wide transition-all group-hover:shadow-md"
          style={{ background: 'var(--sfp-gold)', color: 'white' }}
        >
          View {rec.partner_name}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </div>

        <p className="mt-3 text-[11px] italic" style={{ color: 'var(--sfp-slate)' }}>
          {rec.complianceLabel}
        </p>
      </div>
    </a>
  );
}
