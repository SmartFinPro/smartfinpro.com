'use client';

/**
 * FeaturedPartnerOffer — Forbes Advisor-inspired Premium Partner Box
 * ──────────────────────────────────────────────────────────────────
 * Visually isolated premium zone above the regular ComparisonHub grid.
 * Shows the featured partner with offer details, social proof, and a
 * prominent CTA.
 *
 * Design: Violet-bordered glassmorphism card with emerald CTA.
 * Desktop: 2-column layout. Mobile: Stacked with CTA at bottom.
 */

import Link from 'next/link';
import {
  Star,
  Sparkles,
  ExternalLink,
  CheckCircle,
  Users,
  Shield,
} from 'lucide-react';
// Local type definition — mirrors genesis.ts HubPartner without importing server-only module
interface HubPartner {
  providerName: string;
  cpaValue: number;
  currency: string;
  rating: number;
  tagline: string;
  affiliateUrl: string;
  reviewSlug: string | null;
  benefits: string[];
  slug: string;
  winnerBadge: string | null;
  winnerBadgeType: 'editorial' | 'auto' | null;
  isFeatured: boolean;
  featuredHeadline: string | null;
  featuredOffer: string | null;
  clickCount30d: number;
}

interface FeaturedPartnerOfferProps {
  partner: HubPartner;
  onCtaClick?: (providerName: string) => void;
}

export function FeaturedPartnerOffer({
  partner,
  onCtaClick,
}: FeaturedPartnerOfferProps) {
  const handleClick = () => {
    onCtaClick?.(partner.providerName);
  };

  return (
    <div className="px-6 pt-6 pb-2">
      <div
        className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm"
      >
        {/* Banner Pill */}
        <div
          className="px-5 py-2.5 flex items-center gap-2 border-b border-gray-200"
          style={{ background: 'var(--sfp-sky)' }}
        >
          <Sparkles className="h-3.5 w-3.5" style={{ color: 'var(--sfp-gold)' }} />
          <span className="text-xs font-semibold tracking-wide uppercase" style={{ color: 'var(--sfp-navy)' }}>
            Featured Partner
          </span>
        </div>

        {/* Content — Desktop 2-col, Mobile stacked */}
        <div className="p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-5">
            {/* Left: Name, Rating, Benefits, Social Proof */}
            <div className="flex-1 min-w-0">
              {/* Name + Badge */}
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h4 className="text-lg font-bold" style={{ color: 'var(--sfp-ink)' }}>
                  {partner.providerName}
                </h4>
                {partner.winnerBadge && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border border-gray-200" style={{ color: 'var(--sfp-green)', background: 'rgba(26,107,58,0.08)' }}>
                    <CheckCircle className="h-2.5 w-2.5" />
                    {partner.winnerBadge}
                  </span>
                )}
              </div>

              {/* Star Rating */}
              <div className="flex items-center gap-1.5 mb-3">
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3.5 w-3.5 ${
                        i < Math.floor(partner.rating)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm font-medium" style={{ color: 'var(--sfp-ink)' }}>
                  {partner.rating.toFixed(1)}
                </span>
              </div>

              {/* Benefits */}
              {partner.benefits.length > 0 && (
                <div className="space-y-1.5 mb-3">
                  {partner.benefits.slice(0, 3).map((b) => (
                    <span
                      key={b}
                      className="flex items-center gap-2 text-sm"
                      style={{ color: 'var(--sfp-ink)' }}
                    >
                      <CheckCircle className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--sfp-green)' }} />
                      {b}
                    </span>
                  ))}
                </div>
              )}

              {/* Social Proof */}
              {partner.clickCount30d > 50 && (
                <div className="flex items-center gap-1.5 mt-2">
                  <Users className="h-3.5 w-3.5 text-amber-400/80" />
                  <span className="text-xs text-amber-400/80 font-medium">
                    {partner.clickCount30d.toLocaleString('en-US')} users chose this in
                    the last 30 days
                  </span>
                </div>
              )}
            </div>

            {/* Right: Offer + CTA */}
            <div className="sm:w-[280px] shrink-0 flex flex-col gap-3">
              {/* Featured Headline */}
              {partner.featuredHeadline && (
                <p className="text-base font-bold" style={{ color: 'var(--sfp-ink)' }}>
                  {partner.featuredHeadline}
                </p>
              )}

              {/* Featured Offer */}
              {partner.featuredOffer && (
                <p className="text-sm leading-relaxed" style={{ color: 'var(--sfp-green)' }}>
                  {partner.featuredOffer}
                </p>
              )}

              {/* CTA */}
              <Link
                href={partner.affiliateUrl || '#'}
                target="_blank"
                rel="noopener sponsored"
                onClick={handleClick}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white shadow-md hover:shadow-lg transition-all"
                style={{ background: 'var(--sfp-gold)', color: '#ffffff' }}
              >
                Visit {partner.providerName}
                <ExternalLink className="h-4 w-4" />
              </Link>

              {/* Review link */}
              {partner.reviewSlug && (
                <Link
                  href={partner.reviewSlug}
                  className="text-sm font-medium transition-colors text-center"
                  style={{ color: 'var(--sfp-navy)' }}
                >
                  Read Full Review
                </Link>
              )}
            </div>
          </div>

          {/* Micro disclosure */}
          <div className="mt-4 pt-3 border-t border-gray-200">
            <span className="flex items-center gap-1.5 text-[10px] text-slate-600">
              <Shield className="h-2.5 w-2.5" />
              Affiliate partner. SmartFinPro may earn a commission — this does
              not affect our ratings.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
