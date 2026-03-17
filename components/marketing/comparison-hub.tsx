'use client';

/**
 * ComparisonHub — Forbes/NerdWallet-style Partner Comparison Grid
 * ─────────────────────────────────────────────────────────────
 * A/B Testing integrated:
 *   Variant A = Profit-First  (sort by CPA DESC)
 *   Variant B = Trust-First   (sort by rating DESC)
 *
 * Each visitor is assigned a sticky variant via localStorage.
 * Impressions & clicks are logged to Supabase in real-time.
 *
 * Design: Light Trust Design — consistent with SmartFinPro theme.
 * Desktop: Horizontal rows (Forbes Advisor layout).
 * Mobile:  Vertical cards with sticky CTA at card bottom.
 *
 * Usage in MDX:
 *   <ComparisonHub category="trading" />
 *   <ComparisonHub category="personal-finance" market="uk" limit={3} />
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  Star,
  Trophy,
  ExternalLink,
  CheckCircle,
  Loader2,
  Shield,
  Sparkles,
  Users,
} from 'lucide-react';
import type { Market, Category } from '@/lib/i18n/config';
import type { HubPartner } from '@/lib/actions/genesis';
import type { AbVariant } from '@/lib/actions/ab-testing';
import { FeaturedPartnerOffer } from './featured-partner-offer';

interface ComparisonHubProps {
  category?: string;
  market?: string;
  limit?: number;
  title?: string;
  /** Pre-fetched partners from server component — enables SSR for SEO */
  initialPartners?: HubPartner[];
}

// ── Variant Assignment (sticky via localStorage) ──────────

const STORAGE_KEY = 'sfp_ab_hub';

function getOrAssignVariant(hubId: string): AbVariant {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const map: Record<string, AbVariant> = stored ? JSON.parse(stored) : {};

    if (map[hubId] === 'A' || map[hubId] === 'B') {
      return map[hubId];
    }

    // 50/50 random assignment
    const variant: AbVariant = Math.random() < 0.5 ? 'A' : 'B';
    map[hubId] = variant;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
    return variant;
  } catch {
    // localStorage blocked → deterministic fallback based on hubId hash
    let hash = 0;
    for (let i = 0; i < hubId.length; i++) {
      hash = (hash << 5) - hash + hubId.charCodeAt(i);
      hash |= 0;
    }
    return hash % 2 === 0 ? 'A' : 'B';
  }
}

function getSessionId(): string {
  try {
    let sid = sessionStorage.getItem('sfp_session');
    if (!sid) {
      sid = `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      sessionStorage.setItem('sfp_session', sid);
    }
    return sid;
  } catch {
    return `s_${Date.now()}`;
  }
}

// ── Main Component ──────────────────────────────────────────

export function ComparisonHub({
  category,
  market,
  limit = 5,
  title,
  initialPartners,
}: ComparisonHubProps) {
  const [partners, setPartners] = useState<HubPartner[]>(initialPartners || []);
  const [loading, setLoading] = useState(!initialPartners || initialPartners.length === 0);
  const [error, setError] = useState(false);
  const [variant, setVariant] = useState<AbVariant | null>(initialPartners ? 'A' : null);
  const impressionLogged = useRef(false);

  // Auto-detect market/category from URL if not provided via props
  const [resolvedMarket, setResolvedMarket] = useState<string>(market || 'us');
  const [resolvedCategory, setResolvedCategory] = useState<string>(
    category || 'trading',
  );

  useEffect(() => {
    if (!market || !category) {
      const segments = window.location.pathname.split('/').filter(Boolean);
      if (!market) {
        const possibleMarkets = ['uk', 'ca', 'au'];
        setResolvedMarket(
          possibleMarkets.includes(segments[0]) ? segments[0] : 'us',
        );
      }
      if (!category && segments.length >= 2) {
        const possibleMarkets = ['uk', 'ca', 'au'];
        setResolvedCategory(
          possibleMarkets.includes(segments[0]) ? segments[1] : segments[0],
        );
      }
    }
  }, [market, category]);

  // Assign variant + fetch partners (skip fetch if initialPartners provided)
  useEffect(() => {
    let cancelled = false;
    const hubId = `${resolvedCategory}__${resolvedMarket}`;

    if (initialPartners && initialPartners.length > 0) {
      // SSR path: Data already provided — just assign variant for tracking
      const assignedVariant = getOrAssignVariant(hubId);
      setVariant(assignedVariant);

      // If variant B (rating sort), re-fetch client-side for correct sort order
      if (assignedVariant === 'B') {
        fetch(`/api/hub-partners?market=${resolvedMarket}&category=${resolvedCategory}&limit=${limit}&sortBy=rating`)
          .then((res) => res.json())
          .then((data) => {
            if (!cancelled && data) setPartners(data);
          }).catch(() => {
            // Variant B re-sort failed — keep initial CPA-sorted data (safe fallback)
          });
      }
      return () => { cancelled = true; };
    }

    // Client-only path: No initial data — full fetch
    setLoading(true);

    // Check if there's already a declared winner
    fetch(`/api/ab-testing/winner?category=${resolvedCategory}&market=${resolvedMarket}`)
      .then((res) => res.json())
      .then(({ winner }) => {
        if (cancelled) return;

        // Use winner if test concluded, otherwise assign random variant
        const assignedVariant = winner || getOrAssignVariant(hubId);
        setVariant(assignedVariant);

        const sortBy = assignedVariant === 'A' ? 'cpa' : 'rating';

        return fetch(`/api/hub-partners?market=${resolvedMarket}&category=${resolvedCategory}&limit=${limit}&sortBy=${sortBy}`)
          .then((res) => res.json());
      })
      .then((data) => {
        if (!cancelled && data) {
          setPartners(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [resolvedMarket, resolvedCategory, limit, initialPartners]);

  // Log impression once (when partners loaded + variant assigned)
  useEffect(() => {
    if (!variant || partners.length === 0 || impressionLogged.current) return;
    impressionLogged.current = true;

    const sid = getSessionId();
    fetch('/api/ab-testing/impression', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'impression', category: resolvedCategory, market: resolvedMarket, variant, sessionId: sid }),
    }).catch(() => {});
  }, [variant, partners, resolvedCategory, resolvedMarket]);

  // Click handler — logs click + navigates
  const handlePartnerClick = useCallback(
    (providerName: string) => {
      if (!variant) return;
      const sid = getSessionId();
      fetch('/api/ab-testing/impression', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'click', category: resolvedCategory, market: resolvedMarket, variant, providerName, sessionId: sid }),
      }).catch(() => {});
    },
    [variant, resolvedCategory, resolvedMarket],
  );

  const displayTitle =
    title ||
    `Top ${resolvedCategory
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')} 2026`;

  if (error) return null;

  return (
    <div className="my-12 not-prose">
      {/* ── Card Container ── */}
      <div
        className="rounded-2xl border border-gray-200 overflow-hidden bg-white"
      >
        {/* ── Header ── */}
        <div
          className="px-6 py-5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
          style={{ background: 'var(--sfp-gray)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: 'var(--sfp-sky)',
                border: '1px solid rgba(27,79,140,0.2)',
              }}
            >
              <Sparkles className="h-5 w-5" style={{ color: 'var(--sfp-navy)' }} />
            </div>
            <div>
              <h3 className="text-lg font-bold" style={{ color: 'var(--sfp-ink)' }}>{displayTitle}</h3>
              <p className="text-xs" style={{ color: 'var(--sfp-slate)' }}>
                {variant === 'B'
                  ? 'Ranked by user rating & trust'
                  : 'Ranked by expert analysis & value'}
              </p>
            </div>
          </div>

          {/* Updated Badge + Pulse */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 border border-gray-200">
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--sfp-green)' }} />
            <span className="text-xs" style={{ color: 'var(--sfp-slate)' }}>Updated Feb 2026</span>
          </div>
        </div>

        {/* ── Partner List ── */}
        {loading ? (
          <div className="flex items-center justify-center py-20" style={{ color: 'var(--sfp-slate)' }}>
            <Loader2 className="h-5 w-5 animate-spin mr-3" />
            Loading top partners...
          </div>
        ) : partners.length === 0 ? (
          <div className="py-16 text-center text-sm" style={{ color: 'var(--sfp-slate)' }}>
            No partners available for this category yet.
          </div>
        ) : (
          <>
            {/* Featured Partner Zone — isolated premium box
                Only render here when initialPartners provided (SSR/fallback path).
                On pillar pages (MDX path), the page template renders it directly for SSR. */}
            {initialPartners && partners[0]?.isFeatured && (
              <FeaturedPartnerOffer
                partner={partners[0]}
                onCtaClick={handlePartnerClick}
              />
            )}

            {/* Regular Partner Rows */}
            <div className="divide-y divide-gray-200">
              {(partners[0]?.isFeatured ? partners.slice(1) : partners).map(
                (partner, index) => {
                  const displayIndex = partners[0]?.isFeatured
                    ? index + 1
                    : index;
                  return (
                    <PartnerRow
                      key={partner.providerName}
                      partner={partner}
                      index={displayIndex}
                      isWinner={displayIndex === 0}
                      onCtaClick={handlePartnerClick}
                    />
                  );
                },
              )}
            </div>
          </>
        )}

        {/* ── Compliance Footer ── */}
        <div
          className="px-6 py-3 border-t border-gray-200 text-xs"
          style={{ background: 'var(--sfp-gray)', color: 'var(--sfp-slate)' }}
        >
          <span className="flex items-center gap-1.5">
            <Shield className="h-3 w-3" />
            Affiliate Disclosure: SmartFinPro may earn a commission when you
            click links and make a purchase. This does not affect our editorial
            independence.
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Individual Partner Row ──────────────────────────────────────

interface PartnerRowProps {
  partner: HubPartner;
  index: number;
  isWinner: boolean;
  onCtaClick: (providerName: string) => void;
}

// Badge color map for category winner badges — Light Trust Design inline styles
const badgeStyles: Record<string, React.CSSProperties> = {
  'Best Overall': { background: 'rgba(26,107,58,0.1)', borderColor: 'rgba(26,107,58,0.2)', color: 'var(--sfp-green)' },
  'Best for Beginners': { background: 'rgba(27,79,140,0.1)', borderColor: 'rgba(27,79,140,0.2)', color: 'var(--sfp-navy)' },
  'Best Value': { background: 'rgba(27,79,140,0.08)', borderColor: 'rgba(27,79,140,0.15)', color: 'var(--sfp-navy)' },
  'Most Popular': { background: 'rgba(245,166,35,0.1)', borderColor: 'rgba(245,166,35,0.2)', color: 'var(--sfp-gold-dark)' },
  'Best for Active Traders': { background: 'rgba(27,79,140,0.1)', borderColor: 'rgba(27,79,140,0.2)', color: 'var(--sfp-navy)' },
};
const defaultBadgeStyle: React.CSSProperties = { background: 'rgba(26,107,58,0.1)', borderColor: 'rgba(26,107,58,0.2)', color: 'var(--sfp-green)' };

function PartnerRow({ partner, index, isWinner, onCtaClick }: PartnerRowProps) {
  const handleClick = () => {
    onCtaClick(partner.providerName);
  };

  // Determine badge text and style
  const badgeText = partner.winnerBadge || (isWinner ? 'Top Pick' : null);
  const badgeStyle = badgeText && badgeStyles[badgeText]
    ? badgeStyles[badgeText]
    : defaultBadgeStyle;

  return (
    <div
      className={`group transition-colors ${
        isWinner ? '' : 'hover:bg-gray-50'
      }`}
      style={isWinner ? { background: 'rgba(26,107,58,0.04)' } : undefined}
    >
      {/* Desktop Layout (horizontal row) */}
      <div className="hidden sm:flex items-center gap-5 px-6 py-5">
        {/* Rank */}
        <span
          className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
            isWinner
              ? ''
              : 'bg-gray-100'
          }`}
          style={isWinner
            ? { background: 'rgba(26,107,58,0.1)', color: 'var(--sfp-green)', border: '1px solid rgba(26,107,58,0.2)' }
            : { color: 'var(--sfp-slate)' }
          }
        >
          {index + 1}
        </span>

        {/* Name + Badge + Tagline */}
        <div className="min-w-[180px]">
          <div className="flex items-center gap-2">
            <span className="font-bold" style={{ color: 'var(--sfp-ink)' }}>
              {partner.providerName}
            </span>
            {badgeText && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border" style={badgeStyle}>
                <Trophy className="h-2.5 w-2.5" />
                {badgeText}
              </span>
            )}
          </div>
          <p className="text-xs mt-0.5 line-clamp-1" style={{ color: 'var(--sfp-slate)' }}>
            {partner.tagline}
          </p>
        </div>

        {/* Star Rating */}
        <div className="flex items-center gap-1.5 min-w-[110px]">
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

        {/* Benefits (Top 3) + Social Proof */}
        <div className="flex-1 min-w-0">
          {partner.benefits.length > 0 ? (
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {partner.benefits.slice(0, 3).map((b) => (
                <span
                  key={b}
                  className="flex items-center gap-1.5 text-xs"
                  style={{ color: 'var(--sfp-slate)' }}
                >
                  <CheckCircle className="h-3 w-3 shrink-0" style={{ color: 'var(--sfp-green)' }} />
                  <span className="truncate max-w-[180px]">{b}</span>
                </span>
              ))}
            </div>
          ) : (
            <span className="text-xs italic" style={{ color: 'var(--sfp-slate)' }}>
              Expert-reviewed platform
            </span>
          )}
          {/* Dynamic Social Proof */}
          {partner.clickCount30d > 50 && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <Users className="h-3 w-3 text-amber-400/80" />
              <span className="text-[11px] text-amber-400/80 font-medium">
                {partner.clickCount30d.toLocaleString()} users chose this
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 shrink-0">
          {partner.reviewSlug && (
            <Link
              href={partner.reviewSlug}
              className="text-sm font-medium hover:opacity-80 transition-colors whitespace-nowrap"
              style={{ color: 'var(--sfp-navy)' }}
            >
              Read Review
            </Link>
          )}
          <Link
            href={partner.affiliateUrl}
            target="_blank"
            rel="noopener sponsored"
            onClick={handleClick}
            className={`inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all whitespace-nowrap ${
              isWinner
                ? 'btn-shimmer hover:opacity-90 shadow-md'
                : 'border border-gray-200 hover:bg-gray-50'
            }`}
            style={isWinner
              ? { background: 'var(--sfp-gold)' }
              : { background: 'white', color: 'var(--sfp-navy)' }
            }
          >
            Visit Site
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Mobile Layout (vertical card) */}
      <div className="sm:hidden px-4 py-5">
        {/* Top: Rank + Name + Winner Badge */}
        <div className="flex items-start gap-3 mb-3">
          <span
            className={`w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
              isWinner
                ? ''
                : 'bg-gray-100'
            }`}
            style={isWinner
              ? { background: 'rgba(26,107,58,0.1)', color: 'var(--sfp-green)', border: '1px solid rgba(26,107,58,0.2)' }
              : { color: 'var(--sfp-slate)' }
            }
          >
            {index + 1}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold" style={{ color: 'var(--sfp-ink)' }}>
                {partner.providerName}
              </span>
              {badgeText && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border" style={badgeStyle}>
                  <Trophy className="h-2.5 w-2.5" />
                  {badgeText}
                </span>
              )}
            </div>
            <p className="text-xs mt-0.5" style={{ color: 'var(--sfp-slate)' }}>{partner.tagline}</p>
          </div>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1.5 mb-3">
          <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-3 w-3 ${
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
                className="flex items-center gap-2 text-xs"
                style={{ color: 'var(--sfp-slate)' }}
              >
                <CheckCircle className="h-3 w-3 shrink-0" style={{ color: 'var(--sfp-green)' }} />
                {b}
              </span>
            ))}
          </div>
        )}

        {/* Mobile Social Proof */}
        {partner.clickCount30d > 50 && (
          <div className="flex items-center gap-1.5 mb-4">
            <Users className="h-3 w-3 text-amber-400/80" />
            <span className="text-[11px] text-amber-400/80 font-medium">
              {partner.clickCount30d.toLocaleString()} users chose this
            </span>
          </div>
        )}

        {/* Sticky CTA area at card bottom */}
        <div className="flex items-center gap-3 pt-3 border-t border-gray-200">
          {partner.reviewSlug && (
            <Link
              href={partner.reviewSlug}
              className="text-sm font-medium hover:opacity-80 transition-colors"
              style={{ color: 'var(--sfp-navy)' }}
            >
              Read Review
            </Link>
          )}
          <Link
            href={partner.affiliateUrl}
            target="_blank"
            rel="noopener sponsored"
            onClick={handleClick}
            className={`ml-auto inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all ${
              isWinner
                ? 'btn-shimmer hover:opacity-90 shadow-md'
                : 'border border-gray-200 hover:bg-gray-50'
            }`}
            style={isWinner
              ? { background: 'var(--sfp-gold)' }
              : { background: 'white', color: 'var(--sfp-navy)' }
            }
          >
            Visit Site
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
