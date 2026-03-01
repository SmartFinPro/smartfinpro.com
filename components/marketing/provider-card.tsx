'use client';

import { CheckCircle, XCircle, Sparkles, ArrowRight } from 'lucide-react';

interface ProviderStat {
  label: string;
  value: string;
  highlight?: boolean;
}

interface ProviderCardProps {
  name?: string;
  tagline?: string;
  rating?: number;
  badge?: string;
  stats?: ProviderStat[];
  strengths?: string[];
  limitations?: string[];
  /** Legacy prop aliases from QuickVerdictCard migration */
  pros?: string[];
  con?: string;
  verdict?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  secondaryLabel?: string;
  secondaryUrl?: string;
  /** Legacy alias: maps to ctaUrl */
  affiliateUrl?: string;
  /** Legacy alias from HighlightCTA migration */
  href?: string;
  /** Legacy: maps to name */
  productName?: string;
  /** Legacy from HighlightCTA: used as headline in compact mode */
  headline?: string;
  /** Legacy from HighlightCTA: used as subtext below headline */
  subtext?: string;
  /** Legacy from HighlightCTA: icon name (ignored, design uses gradient line instead) */
  icon?: string;
  /** Legacy alias from QuickVerdictCard */
  accentColor?: 'emerald' | 'blue' | 'navy' | 'amber' | 'rose' | 'gold';
  /** 'gold' for #1 pick, 'navy' default, 'green' for value picks */
  accent?: 'gold' | 'navy' | 'green';
}

const accentConfig = {
  gold: {
    border: 'border-amber-200',
    gradient: '#f59e0b',
    ratingColor: 'text-amber-600',
    badgeBg: 'bg-amber-400/10',
    badgeBorder: 'border-amber-400/20',
    badgeText: 'text-amber-600/80',
  },
  navy: {
    border: 'border-blue-200',
    gradient: 'var(--sfp-navy)',
    ratingColor: 'text-blue-600',
    badgeBg: 'bg-cyan-400/10',
    badgeBorder: 'border-cyan-400/20',
    badgeText: 'text-blue-600/80',
  },
  green: {
    border: 'border-emerald-200',
    gradient: '#10b981',
    ratingColor: 'text-emerald-600',
    badgeBg: 'bg-emerald-400/10',
    badgeBorder: 'border-emerald-400/20',
    badgeText: 'text-emerald-600/80',
  },
};

export function ProviderCard({
  name,
  tagline,
  rating,
  badge,
  stats = [],
  strengths,
  limitations,
  pros,
  con,
  verdict,
  ctaLabel,
  ctaUrl,
  affiliateUrl,
  href,
  productName,
  headline,
  subtext,
  icon,
  secondaryLabel,
  secondaryUrl,
  accentColor,
  accent,
}: ProviderCardProps) {
  // Resolve legacy props
  const resolvedName = name || productName || '';
  const resolvedStrengths = strengths || pros || [];
  const resolvedLimitations = limitations || (con ? [con] : []);
  const resolvedCtaUrl = ctaUrl || affiliateUrl || href;
  const resolvedCtaLabel = ctaLabel || (productName ? `Try ${productName} →` : 'Visit Provider →');

  // Map legacy accentColor to accent
  const accentColorMap: Record<string, 'gold' | 'navy' | 'green'> = {
    emerald: 'green',
    blue: 'navy',
    navy: 'navy',
    amber: 'gold',
    rose: 'navy',
    gold: 'gold',
  };
  const resolvedAccent = accent || (accentColor ? accentColorMap[accentColor] : 'navy');
  const config = accentConfig[resolvedAccent];

  // Compact CTA mode: HighlightCTA migration (headline + subtext, no strengths)
  const isCompactMode = headline && resolvedStrengths.length === 0;

  if (isCompactMode) {
    return (
      <div
        className={`not-prose relative my-8 rounded-2xl overflow-hidden border ${config.border}`}
        style={{ background: 'var(--sfp-gray)' }}
      >
        <div
          className="h-[2px] w-full"
          style={{ background: `linear-gradient(90deg, transparent, ${config.gradient}, ${config.gradient}, transparent)` }}
        />
        <div className="p-6 text-center">
          {badge && (
            <span
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full mb-4 border"
              style={{ color: 'var(--sfp-gold)', background: 'rgba(245,166,35,0.08)', borderColor: 'rgba(245,166,35,0.2)' }}
            >
              <Sparkles className="h-3 w-3" />
              {badge}
            </span>
          )}
          <h4 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">{headline}</h4>
          {rating && (
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className={`text-2xl font-bold ${config.ratingColor}`}>{rating}</span>
              <span className="text-slate-500">/5</span>
            </div>
          )}
          {subtext && (
            <p className="text-sm text-gray-600 leading-relaxed mb-6 max-w-2xl mx-auto">{subtext}</p>
          )}
          {resolvedCtaUrl && (
            <div className="flex flex-wrap items-center justify-center gap-3">
              <a
                href={resolvedCtaUrl}
                target="_blank"
                rel="nofollow noopener sponsored"
                className="btn-shimmer inline-flex items-center justify-center gap-2 h-11 px-6 rounded-lg text-sm font-semibold whitespace-nowrap no-underline transition-all duration-300 hover:scale-[1.03]"
                style={{
                  background: 'var(--sfp-gold)',
                  boxShadow: '0 4px 20px rgba(245,166,35,0.3)',
                  color: 'white',
                  textDecoration: 'none',
                  border: 'none',
                }}
              >
                {resolvedCtaLabel}
                <ArrowRight className="h-4 w-4" />
              </a>
              {secondaryUrl && (
                <a
                  href={secondaryUrl}
                  target="_blank"
                  rel="nofollow noopener sponsored"
                  className="inline-flex items-center justify-center h-11 px-6 rounded-lg text-sm font-semibold whitespace-nowrap no-underline border border-gray-300 bg-white transition-all duration-300 hover:shadow-md hover:no-underline"
                  style={{ color: 'var(--sfp-ink)', textDecoration: 'none' }}
                >
                  {secondaryLabel || 'Compare All Tools'}
                </a>
              )}
            </div>
          )}
          {resolvedCtaUrl && (
            <div className="flex items-center justify-center gap-6 mt-4 text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5" style={{ color: 'var(--sfp-green)' }} />
                30-day money-back guarantee
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5" style={{ color: 'var(--sfp-green)' }} />
                No credit card required
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Full provider card mode (with rating, strengths, limitations)
  return (
    <div
      className={`not-prose relative my-8 rounded-2xl overflow-hidden border ${config.border}`}
      style={{ background: 'var(--sfp-gray)' }}
    >
      {/* Top gradient line */}
      <div
        className="h-[2px] w-full"
        style={{ background: `linear-gradient(90deg, transparent, ${config.gradient}, ${config.gradient}, transparent)` }}
      />

      <div className="p-6">
        {/* Header: Name + Tagline + Rating + Badge */}
        <div>
          <h4 className="text-lg font-bold text-gray-900">{resolvedName}</h4>
          {tagline && (
            <p className="text-sm text-slate-500 mt-0.5">{tagline}</p>
          )}
          {rating && (
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-2xl font-bold ${config.ratingColor}`}>{rating}</span>
              <span className="text-slate-500">/5</span>
              {badge && (
                <span
                  className={`text-xs ${config.badgeText} ${config.badgeBg} border ${config.badgeBorder} px-2 py-0.5 rounded font-medium`}
                >
                  {badge}
                </span>
              )}
            </div>
          )}
          {!rating && badge && (
            <span
              className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full mt-2 border"
              style={{ color: 'var(--sfp-gold)', background: 'rgba(245,166,35,0.08)', borderColor: 'rgba(245,166,35,0.2)' }}
            >
              <Sparkles className="h-3 w-3" />
              {badge}
            </span>
          )}
        </div>

        {/* Key Stats Grid */}
        {stats && stats.length > 0 && (
          <div
            className="grid gap-4 mt-5 mb-5"
            style={{ gridTemplateColumns: `repeat(${Math.min(stats.length, 4)}, minmax(0, 1fr))` }}
          >
            {stats.map((stat, i) => (
              <div
                key={i}
                className="rounded-lg p-3 border border-gray-200"
                style={{ background: 'var(--sfp-gray)' }}
              >
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">{stat.label}</p>
                <p className={`text-lg font-bold ${stat.highlight ? 'text-green-700' : 'text-gray-900'}`}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Strengths & Limitations */}
        {(resolvedStrengths.length > 0 || resolvedLimitations.length > 0) && (
          <div className="grid md:grid-cols-2 gap-4">
            {resolvedStrengths.length > 0 && (
              <div>
                <p className="text-xs font-bold text-green-700 uppercase tracking-wider mb-2">Strengths</p>
                <ul className="space-y-1.5">
                  {resolvedStrengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-800">
                      <CheckCircle className="h-3.5 w-3.5 text-green-700 shrink-0 mt-0.5" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {resolvedLimitations.length > 0 && (
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Limitations</p>
                <ul className="space-y-1.5">
                  {resolvedLimitations.map((l, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-500">
                      <XCircle className="h-3.5 w-3.5 text-gray-500 shrink-0 mt-0.5" />
                      {l}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Verdict */}
        {verdict && (
          <p className="text-sm text-gray-600 mt-4 leading-relaxed">{verdict}</p>
        )}

        {/* CTA Buttons */}
        {resolvedCtaUrl && (
          <div className="flex items-center gap-3 mt-6 pt-5 border-t border-gray-200">
            <a
              href={resolvedCtaUrl}
              target="_blank"
              rel="nofollow noopener sponsored"
              className="btn-shimmer inline-flex items-center justify-center h-11 px-6 rounded-lg text-sm font-semibold whitespace-nowrap no-underline transition-all duration-300 hover:scale-[1.03]"
              style={{
                background: 'var(--sfp-gold)',
                boxShadow: '0 4px 20px rgba(245,166,35,0.3)',
                paddingTop: '6px',
                color: 'white',
                textDecoration: 'none',
                border: 'none',
              }}
            >
              {resolvedCtaLabel}
            </a>
            {secondaryUrl && (
              <a
                href={secondaryUrl}
                target="_blank"
                rel="nofollow noopener sponsored"
                className="inline-flex items-center justify-center h-8 px-4 rounded-full text-xs font-semibold text-gray-900 whitespace-nowrap no-underline transition-all duration-300 hover:scale-105 hover:shadow-lg hover:no-underline"
                style={{
                  background: 'var(--sfp-gold)',
                  boxShadow: '0 2px 10px rgba(245,166,35,0.3)',
                  border: 'none',
                  textDecoration: 'none',
                  lineHeight: '1',
                }}
              >
                {secondaryLabel || 'Learn More'}
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
