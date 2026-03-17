'use client';

import { Trophy, Star, ArrowRight, CheckCircle, XCircle } from 'lucide-react';

interface WinnerCard {
  rank: 1 | 2 | 3;
  name: string;
  tagline: string;
  rating: number;
  highlight: string;
  affiliateUrl: string;
  badge?: string;
}

interface WinnerAtGlanceProps {
  // Original API — array of picks
  picks?: WinnerCard[];
  title?: string;
  subtitle?: string;
  // MDX-friendly single-winner API
  winner?: string;
  rating?: number;
  ctaText?: string;
  ctaLink?: string;
  pros?: string[];
  cons?: string[];
  verdict?: string;
}

const accentColors: Record<number, { ring: string; badge: string; badgeBg: string; gradient: string }> = {
  1: {
    ring: 'ring-[var(--sfp-gold)]/30',
    badge: 'text-[var(--sfp-gold)] border-[var(--sfp-gold)]/30',
    badgeBg: 'rgba(245,166,35,0.12)',
    gradient: 'from-[var(--sfp-gold)] to-[var(--sfp-gold)]',
  },
  2: {
    ring: 'ring-[var(--sfp-navy)]/20',
    badge: 'text-[var(--sfp-navy)] border-[var(--sfp-navy)]/30',
    badgeBg: 'rgba(27,79,140,0.12)',
    gradient: 'from-[var(--sfp-navy)] to-[var(--sfp-navy)]',
  },
  3: {
    ring: 'ring-[var(--sfp-green)]/20',
    badge: 'text-[var(--sfp-green)] border-[var(--sfp-green)]/30',
    badgeBg: 'rgba(26,107,58,0.12)',
    gradient: 'from-[var(--sfp-green)] to-[var(--sfp-green)]',
  },
};

export function WinnerAtGlance({
  picks,
  title = 'Top 3 Picks for 2026',
  subtitle = 'Based on expert analysis & testing',
  winner,
  rating,
  ctaText,
  ctaLink,
  pros,
  cons,
  verdict,
}: WinnerAtGlanceProps) {
  // MDX single-winner mode
  if (winner) {
    return (
      <div className="not-prose my-10">
        <div
          className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(26,107,58,0.1)' }}
        >
          {/* Header */}
          <div className="mb-4 flex items-center gap-3">
            <span
              className="flex h-10 w-10 items-center justify-center rounded-lg text-white shadow-md"
              style={{ background: 'var(--sfp-gold)', color: '#ffffff' }}
            >
              <Trophy className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-lg font-bold" style={{ color: 'var(--sfp-ink)' }}>{title}</h3>
              <p className="text-sm" style={{ color: 'var(--sfp-slate)' }}>{subtitle}</p>
            </div>
          </div>

          {/* Winner name + rating */}
          <div className="mb-4 flex items-center gap-3">
            <h4 className="text-2xl font-bold" style={{ color: 'var(--sfp-ink)' }}>{winner}</h4>
            {rating && (
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < Math.floor(rating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
                <span className="ml-1 text-sm font-semibold" style={{ color: 'var(--sfp-ink)' }}>{rating}</span>
              </div>
            )}
          </div>

          {/* Pros / Cons */}
          {(pros || cons) && (
            <div className="mb-4 grid gap-4 md:grid-cols-2">
              {pros && pros.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--sfp-green)' }}>Pros</p>
                  <ul className="space-y-1.5">
                    {pros.map((pro, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--sfp-ink)' }}>
                        <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--sfp-green)' }} />
                        {pro}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {cons && cons.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--sfp-red)' }}>Cons</p>
                  <ul className="space-y-1.5">
                    {cons.map((con, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--sfp-ink)' }}>
                        <XCircle className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--sfp-red)' }} />
                        {con}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Verdict */}
          {verdict && (
            <p
              className="mb-4 text-sm leading-relaxed italic pl-4"
              style={{ color: 'var(--sfp-slate)', borderLeft: '2px solid var(--sfp-green)' }}
            >
              {verdict}
            </p>
          )}

          {/* CTA */}
          {ctaLink && (
            <a
              href={ctaLink}
              rel="noopener sponsored"
              className="group flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
              style={{ background: 'var(--sfp-gold)', color: '#ffffff' }}
            >
              {ctaText || 'Visit Site'}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
          )}
        </div>
        <p className="mt-3 text-center text-[10px]" style={{ color: 'var(--sfp-slate)' }}>
          Affiliate link · We may earn a commission
        </p>
      </div>
    );
  }

  // Original picks-based mode
  const visiblePicks = (picks || []).slice(0, 3);

  return (
    <div className="not-prose my-10">
      {/* Section Header */}
      <div className="mb-6 text-center">
        <h3 className="mb-1 text-xl font-bold sm:text-2xl" style={{ color: 'var(--sfp-ink)' }}>{title}</h3>
        <p className="text-sm" style={{ color: 'var(--sfp-slate)' }}>{subtitle}</p>
      </div>

      {/* Cards Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {visiblePicks.map((pick) => {
          const colors = accentColors[pick.rank] || accentColors[3];
          return (
            <div
              key={pick.name}
              className={`relative rounded-2xl border border-gray-200 bg-white shadow-sm p-6 ring-1 ${colors.ring} transition-all duration-300 hover:shadow-md`}
            >
              {/* Rank + Badge */}
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-white bg-gradient-to-br ${colors.gradient} shadow-md`}
                  >
                    {pick.rank === 1 ? (
                      <Trophy className="h-4 w-4" />
                    ) : (
                      `#${pick.rank}`
                    )}
                  </span>
                  <span className="text-xs font-medium" style={{ color: 'var(--sfp-slate)' }}>{pick.tagline}</span>
                </div>
                {pick.badge && (
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${colors.badge}`}
                    style={{ background: colors.badgeBg }}
                  >
                    {pick.badge}
                  </span>
                )}
              </div>

              {/* Product Name */}
              <h4 className="mb-2 text-lg font-bold" style={{ color: 'var(--sfp-ink)' }}>{pick.name}</h4>

              {/* Rating */}
              <div className="mb-3 flex items-center gap-1.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < Math.floor(pick.rating)
                        ? 'fill-amber-400 text-amber-400'
                        : i < pick.rating
                        ? 'fill-amber-400/50 text-amber-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
                <span className="ml-1 text-sm font-semibold" style={{ color: 'var(--sfp-ink)' }}>{pick.rating}</span>
              </div>

              {/* Highlight */}
              <p className="mb-5 text-sm leading-relaxed" style={{ color: 'var(--sfp-slate)' }}>{pick.highlight}</p>

              {/* CTA Button */}
              <a
                href={pick.affiliateUrl}
                rel="noopener sponsored"
                className={`group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r ${colors.gradient} px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:scale-[1.02] hover:shadow-lg`}
                style={{ color: '#ffffff' }}
              >
                Visit Site
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </a>
            </div>
          );
        })}
      </div>

      {/* Affiliate Micro-Disclosure */}
      <p className="mt-3 text-center text-[10px]" style={{ color: 'var(--sfp-slate)' }}>
        Affiliate links · We may earn a commission
      </p>
    </div>
  );
}
