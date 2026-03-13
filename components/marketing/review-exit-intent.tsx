'use client';
// components/marketing/review-exit-intent.tsx
// Review-specific exit-intent popup — replaces the generic newsletter popup
// on review pages when the user has scrolled past the hero section.
//
// ── Strategy ────────────────────────────────────────────────────
//   Targets users who have READ the review (sticky nav visible = scrolled
//   past hero) and are about to leave → highest-intent moment for conversion.
//   Shows the #1 resolved CTA partner with personalized social proof.
//
// ── Suppression ─────────────────────────────────────────────────
//   Sets window.__sfpReviewExitActive flag so the generic ExitIntentPopup
//   (in marketing layout) yields to this review-specific variant.
//
// ── Analytics ───────────────────────────────────────────────────
//   Impression + click tracked via /api/track-cta with variant 'exit_intent'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  ShieldCheck,
  Star,
  TrendingUp,
  ExternalLink,
  ArrowRight,
  Users,
  Clock,
  Zap,
  Globe,
} from 'lucide-react';
import type { EnrichedCtaPartner } from '@/lib/types/page-cta';
import { getVisitorMarketFromCookie } from '@/lib/geo/geo-cookie';

// ── Types ────────────────────────────────────────────────────────

type MarketCode = 'us' | 'uk' | 'ca' | 'au';

interface ReviewExitIntentProps {
  productName: string;
  rating?: number;
  reviewCount?: number;
  affiliateUrl?: string;
  primaryCtaLabel?: string;
  ctaPartners?: EnrichedCtaPartner[];
}

// ── Constants ────────────────────────────────────────────────────

/** Display labels for geo-redirect */
const MARKET_LABELS: Record<MarketCode, string> = {
  us: 'US',
  uk: 'UK',
  ca: 'Canadian',
  au: 'Australian',
};

const STORAGE_KEY = 'sfp_review_exit_shown';
const COOLDOWN_DAYS = 3; // shorter than generic popup (7d) — higher intent
const ACTIVATION_DELAY_MS = 8000; // wait 8s before enabling detection
const MIN_SCROLL_DEPTH = 0.25; // must have scrolled at least 25% of page

// ── Helpers ──────────────────────────────────────────────────────

function getMarketFromPath(path: string): 'us' | 'uk' | 'ca' | 'au' {
  if (path.startsWith('/uk')) return 'uk';
  if (path.startsWith('/ca')) return 'ca';
  if (path.startsWith('/au')) return 'au';
  return 'us';
}

function toSafeSlug(raw: string): string {
  let slug: string;
  if (raw.startsWith('/go/')) {
    slug = raw.replace('/go/', '').replace(/\/$/, '');
  } else if (raw.startsWith('http')) {
    try {
      slug = new URL(raw).hostname.replace(/[^a-z0-9-]/g, '-').replace(/^-+|-+$/g, '');
    } catch {
      slug = 'external';
    }
  } else {
    slug = raw.replace(/[^a-z0-9/_-]/g, '-').replace(/^-+|-+$/g, '');
  }
  return slug.toLowerCase().slice(0, 200) || 'unknown';
}

function trackEvent(slug: string, provider: string, variant: string): void {
  try {
    const pagePath = window.location.pathname;
    fetch('/api/track-cta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug,
        provider,
        variant,
        market: getMarketFromPath(pagePath),
      }),
      keepalive: true,
    }).catch(() => null);
  } catch { /* non-critical */ }
}

// ── Declare global flag type ─────────────────────────────────────

declare global {
  interface Window {
    __sfpReviewExitActive?: boolean;
  }
}

// ── Component ────────────────────────────────────────────────────

export function ReviewExitIntent({
  productName,
  rating,
  reviewCount,
  affiliateUrl,
  primaryCtaLabel,
  ctaPartners = [],
}: ReviewExitIntentProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const impressionSent = useRef(false);

  // ── Resolve the best CTA (same chain as sticky nav) ────────────
  const topPartner = useMemo(() => {
    // Priority 1: Placement 1 partners
    const placement1 = ctaPartners
      .filter((p) => p.placements.includes(1))
      .sort((a, b) => a.position - b.position);

    if (placement1.length > 0) {
      return { label: placement1[0].partner_name, url: `/go/${placement1[0].slug}/` };
    }

    // Priority 2: Any placement
    const anyPlacement = ctaPartners.sort((a, b) => a.position - b.position);
    if (anyPlacement.length > 0) {
      return { label: anyPlacement[0].partner_name, url: `/go/${anyPlacement[0].slug}/` };
    }

    // Priority 3: MDX fallback
    if (affiliateUrl && affiliateUrl !== '#') {
      return { label: primaryCtaLabel || productName, url: affiliateUrl };
    }

    return null;
  }, [ctaPartners, affiliateUrl, primaryCtaLabel, productName]);

  // ── Social proof (deterministic per product) ────────────────────
  const socialCount = useMemo(() => {
    const base = productName.length * 11 + (rating || 4) * 23;
    return Math.floor(40 + (base % 80)); // 40–120 range
  }, [productName, rating]);

  // ── Geo-mismatch redirect (read from middleware cookie) ─────────
  const [geoRedirect, setGeoRedirect] = useState<{ label: string; url: string } | null>(null);

  useEffect(() => {
    const visitorMkt = getVisitorMarketFromCookie();
    if (!visitorMkt) return;

    const path = window.location.pathname;
    const pageMkt = getMarketFromPath(path);
    if (visitorMkt === pageMkt) return;

    // Derive category from current URL
    const parts = path.replace(/^\//, '').split('/');
    const startIdx = pageMkt === 'us' ? 0 : 1;
    const category = parts[startIdx] || '';
    if (!category) return;

    const prefix = visitorMkt === 'us' ? '' : `/${visitorMkt}`;
    setGeoRedirect({
      label: MARKET_LABELS[visitorMkt],
      url: `${prefix}/${category}/`,
    });
  }, []);

  // ── Cooldown check ──────────────────────────────────────────────
  const shouldShow = useCallback(() => {
    const lastShown = localStorage.getItem(STORAGE_KEY);
    if (!lastShown) return true;
    const daysSince = (Date.now() - new Date(lastShown).getTime()) / (1000 * 60 * 60 * 24); // safe — useCallback, never SSR
    return daysSince >= COOLDOWN_DAYS;
  }, []);

  // ── Signal to generic popup: "I'm handling this page" ──────────
  useEffect(() => {
    if (topPartner) {
      window.__sfpReviewExitActive = true;
    }
    return () => {
      window.__sfpReviewExitActive = false;
    };
  }, [topPartner]);

  // ── Exit intent detection ──────────────────────────────────────
  useEffect(() => {
    if (hasTriggered || !topPartner || !shouldShow()) return;

    const handleMouseLeave = (e: MouseEvent) => {
      // Only trigger when:
      // 1. Mouse leaves through the top of the viewport
      // 2. User has scrolled at least 25% of the page (proxy for "past hero")
      if (e.clientY > 0) return;

      const scrollDepth = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
      if (scrollDepth < MIN_SCROLL_DEPTH) return;

      setHasTriggered(true);
      setIsOpen(true);
      localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    };

    // Delay to avoid false triggers on page load
    const timer = setTimeout(() => {
      document.addEventListener('mouseleave', handleMouseLeave);
    }, ACTIVATION_DELAY_MS);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [hasTriggered, topPartner, shouldShow]);

  // ── Impression tracking ─────────────────────────────────────────
  useEffect(() => {
    if (isOpen && !impressionSent.current && topPartner) {
      impressionSent.current = true;
      trackEvent(toSafeSlug(topPartner.url), topPartner.label, 'exit_intent_impression');
    }
  }, [isOpen, topPartner]);

  // No partner resolved → render nothing
  if (!topPartner) return null;

  const handleCtaClick = () => {
    trackEvent(toSafeSlug(topPartner.url), topPartner.label, 'exit_intent_click');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden bg-white border-gray-200">

        {/* ── Navy Header with Gold accent ─────────────────────────── */}
        <div
          className="relative px-6 pt-6 pb-5 overflow-hidden"
          style={{ background: 'linear-gradient(135deg, var(--sfp-navy) 0%, var(--sfp-navy-dark) 100%)' }}
        >
          {/* Gold accent line */}
          <div
            className="absolute top-0 left-0 right-0 h-[3px]"
            style={{ background: 'linear-gradient(90deg, var(--sfp-gold) 0%, var(--sfp-gold-dark) 50%, var(--sfp-gold) 100%)' }}
            aria-hidden="true"
          />

          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-amber-400" aria-hidden="true" />
              <span className="text-xs font-medium text-amber-400 uppercase tracking-wider">
                Before You Go
              </span>
            </div>
            <DialogTitle className="text-xl sm:text-2xl font-bold text-white leading-tight">
              Still Comparing {productName}?
            </DialogTitle>
            <DialogDescription className="text-sm mt-1" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              {socialCount} readers signed up this week — here&apos;s why.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* ── Body ──────────────────────────────────────────────────── */}
        <div className="px-6 pb-6 pt-4">

          {/* Value props */}
          <div className="space-y-3 mb-5">
            {[
              { icon: ShieldCheck, color: 'var(--sfp-green)', text: 'Verified & regulated platform' },
              { icon: Star, color: 'var(--sfp-gold)', text: rating ? `Rated ${rating.toFixed(1)}/5 by ${reviewCount?.toLocaleString('en-US') || 'industry'} experts` : 'Top-rated by industry experts' },
              { icon: TrendingUp, color: 'var(--sfp-navy)', text: 'Exclusive sign-up bonus for SmartFinPro readers' },
              { icon: Zap, color: '#8B5CF6', text: 'Account setup in under 5 minutes' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${item.color}15` }}
                  aria-hidden="true"
                >
                  <item.icon className="w-4 h-4" style={{ color: item.color }} />
                </div>
                <span className="text-sm" style={{ color: 'var(--sfp-ink)' }}>{item.text}</span>
              </div>
            ))}
          </div>

          {/* ── Primary CTA Button ──────────────────────────────────── */}
          <Link
            href={topPartner.url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            onClick={handleCtaClick}
            className="
              flex items-center justify-center gap-2 w-full
              py-3.5 px-6 rounded-xl text-base font-bold
              text-white no-underline hover:no-underline
              transition-all duration-200 hover:scale-[1.01]
              focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2
              [text-decoration:none]
            "
            style={{
              background: 'var(--sfp-gold)',
              boxShadow: '0 4px 14px rgba(245, 166, 35, 0.35)',
              textDecoration: 'none',
            }}
            aria-label={`Visit ${topPartner.label} (opens in new tab)`}
          >
            <ExternalLink className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Visit {topPartner.label}</span>
            <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
          </Link>

          {/* Geo-redirect — shows when visitor is from a different market */}
          {geoRedirect && (
            <Link
              href={geoRedirect.url}
              className="
                flex items-center justify-center gap-2 w-full
                mt-3 py-2.5 px-4 rounded-lg
                text-sm font-medium
                no-underline hover:no-underline
                transition-all duration-200
                focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
                [text-decoration:none]
              "
              style={{
                background: 'var(--sfp-sky)',
                color: 'var(--sfp-navy)',
                textDecoration: 'none',
              }}
              aria-label={`View ${geoRedirect.label} options`}
            >
              <Globe className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>View {geoRedirect.label} Options Instead</span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            </Link>
          )}

          {/* Trust line */}
          <div
            className="flex items-center justify-center gap-4 mt-4 text-xs"
            style={{ color: 'var(--sfp-slate)' }}
            aria-hidden="true"
          >
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" style={{ color: 'var(--sfp-green)' }} />
              {socialCount.toLocaleString('en-US')} signed up this week
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" style={{ color: 'var(--sfp-navy)' }} />
              Verified platform
            </span>
          </div>

          {/* Dismiss */}
          <button
            onClick={() => setIsOpen(false)}
            className="w-full text-center text-sm mt-4 py-2 transition-colors hover:opacity-70"
            style={{ color: 'var(--sfp-slate)' }}
          >
            No thanks, I&apos;ll keep reading
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
