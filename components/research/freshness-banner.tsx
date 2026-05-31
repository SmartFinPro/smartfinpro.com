import { AlertTriangle, Clock3 } from 'lucide-react';

interface FreshnessBannerProps {
  asOf: string;
  nextReview: string;
}

export function FreshnessBanner({ asOf, nextReview }: FreshnessBannerProps) {
  const nextReviewDate = new Date(nextReview);
  const isStale = Number.isFinite(nextReviewDate.getTime()) && nextReviewDate < new Date();

  const containerStyle = isStale
    ? { background: 'rgba(214,64,69,0.06)', borderColor: 'var(--sfp-red)' }
    : { background: '#ffffff', borderColor: 'var(--sfp-sky)' };
  const accent = isStale ? 'var(--sfp-red)' : 'var(--sfp-navy)';

  return (
    <div className="rounded-2xl border p-4 shadow-sm" style={containerStyle}>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          {isStale ? (
            <AlertTriangle className="mt-0.5 h-5 w-5" style={{ color: 'var(--sfp-red)' }} />
          ) : (
            <Clock3 className="mt-0.5 h-5 w-5" style={{ color: 'var(--sfp-navy)' }} />
          )}
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--sfp-ink)' }}>
              Last reviewed {asOf}
            </p>
            <p className="text-sm leading-6" style={{ color: 'var(--sfp-slate)' }}>
              Next scheduled review: {nextReview}. Verify prices, filings, and
              consensus data before acting.
            </p>
          </div>
        </div>
        <span
          className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold text-white"
          style={{ background: accent }}
        >
          {isStale ? 'Review overdue' : 'Freshness tracked'}
        </span>
      </div>
    </div>
  );
}
