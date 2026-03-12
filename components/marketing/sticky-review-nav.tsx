'use client';
// components/marketing/sticky-review-nav.tsx
// Enterprise-grade sticky top nav for review pages — inspired by market.us.
//
// Navy gradient background, white text, prominent Gold + Ghost CTA buttons.
// Appears when the hero header scrolls out of viewport (IntersectionObserver).
//
// ── CTA Resolution Chain (smart fallback) ──────────────────────
//   1. Placement 1 partners (dashboard-configured "Top" slot)
//   2. Best partners from ANY placement (sorted by position)
//   3. Primary review.affiliateUrl (hardcoded in MDX)
//
// ── A/B Testing ──────────────────────────────────────────────────
//   Variant A = "Multi-CTA"   → up to 3 buttons, labels, social proof
//   Variant B = "Focused"     → single prominent CTA, urgency text
//   Hub ID: sticky_nav__{category}__{market}
//   Evaluated at 500+ impressions per variant, 95% confidence (Z-test)
//
// ── Analytics ──────────────────────────────────────────────────
//   • Impression beacon fires once when bar first becomes visible
//   • Click tracking on every CTA button via /api/track-cta
//   • A/B impressions + clicks via /api/hub-ab
//
// ── Accessibility ────────────────────────────────────────────────
//   • Native <nav> landmark element
//   • `inert` attribute when hidden (prevents focus + screen reader access)
//   • tabIndex guard as fallback for older browsers
//   • focus-visible ring with navy-matching offset color
//   • Decorative elements marked aria-hidden
//   • External links labelled "(opens in new tab)" for screen readers
//   • prefers-reduced-motion respected via CSS class
//
// ── Responsive (3 tiers) ───────────────────────────────────────
//   • Mobile:  Title + 1 Gold button
//   • Desktop: Title + Subtitle + 2 buttons (Gold + Ghost) [Variant A]
//   • XL:      Title + Subtitle + up to 3 buttons [Variant A]

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ExternalLink, Users, Zap } from 'lucide-react';
import type { EnrichedCtaPartner } from '@/lib/types/page-cta';

// ── Types ────────────────────────────────────────────────────────

type AbVariant = 'A' | 'B';

interface StickyReviewNavProps {
  productName: string;
  categoryLabel: string;
  category?: string;
  market?: string;
  rating?: number;
  reviewCount?: number;
  affiliateUrl?: string;
  primaryCtaLabel?: string;
  ctaPartners?: EnrichedCtaPartner[];
  sentinelId?: string;
}

interface ButtonColorScheme {
  bg: string;
  text: string;
  shadow: string;
  hoverBg: string;
  hoverText: string;
  hoverShadow: string;
  badge: string;
  border?: string;
  hoverBorder?: string;
}

// ── Module-level constants (avoid re-creation per render) ────────

/** Variant A: Color palette for up to 3 CTA buttons — light background design */
const BUTTON_COLORS: readonly ButtonColorScheme[] = [
  {
    // Primary — solid gold with glow (matches landing page + AffiliateButton)
    bg: 'var(--sfp-gold)', text: '#ffffff',
    shadow: '0 4px 20px rgba(245,166,35,0.35)',
    hoverBg: 'var(--sfp-gold-dark)', hoverText: '#ffffff',
    hoverShadow: '0 6px 28px rgba(245,166,35,0.5)',
    badge: '★★★ Best Value',
    border: 'none',
    hoverBorder: 'none',
  },
  {
    // Secondary — navy ghost button
    bg: 'transparent', text: 'var(--sfp-navy)',
    shadow: 'none',
    hoverBg: 'rgba(27,79,140,0.06)', hoverText: 'var(--sfp-navy)',
    hoverShadow: 'none',
    badge: '★★ Best Overall',
    border: '1.5px solid rgba(27,79,140,0.25)',
    hoverBorder: '1.5px solid rgba(27,79,140,0.5)',
  },
  {
    // Tertiary — subtle gray ghost
    bg: 'transparent', text: 'var(--sfp-ink)',
    shadow: 'none',
    hoverBg: 'rgba(0,0,0,0.04)', hoverText: 'var(--sfp-ink)',
    hoverShadow: 'none',
    badge: '★ Best Features',
    border: '1.5px solid #E2E8F0',
    hoverBorder: '1.5px solid #cbd5e1',
  },
] as const;

/** Variant B: Single focused gold button — larger, more prominent */
const FOCUSED_BUTTON: ButtonColorScheme = {
  bg: 'var(--sfp-gold)', text: '#ffffff',
  shadow: '0 4px 24px rgba(245,166,35,0.35)',
  hoverBg: 'var(--sfp-gold-dark)', hoverText: '#ffffff',
  hoverShadow: '0 6px 32px rgba(245,166,35,0.5)',
  badge: '',
  border: 'none',
  hoverBorder: 'none',
};

const PULSE_ANIMATION = 'stickyPulseGlow 3s ease-in-out infinite';
const AB_STORAGE_KEY = 'sfp_ab_sticky';

// ── Helpers ──────────────────────────────────────────────────────

function getMarketFromPath(path: string): 'us' | 'uk' | 'ca' | 'au' {
  if (path.startsWith('/uk')) return 'uk';
  if (path.startsWith('/ca')) return 'ca';
  if (path.startsWith('/au')) return 'au';
  return 'us';
}

function getCategoryFromPath(path: string): string {
  // /us/trading/xxx → trading, /uk/forex/xxx → forex
  const parts = path.replace(/^\//, '').split('/');
  const market = getMarketFromPath(path);
  const startIdx = market === 'us' ? 0 : 1;
  return parts[startIdx] || 'unknown';
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

function trackClick(url: string, label: string, position: number): void {
  try {
    const pagePath = window.location.pathname;
    fetch('/api/track-cta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: toSafeSlug(url),
        provider: label,
        variant: `sticky_nav_pos${position}`,
        market: getMarketFromPath(pagePath),
      }),
      keepalive: true,
    }).catch(() => null);
  } catch { /* non-critical */ }
}

// ── A/B Testing Helpers ──────────────────────────────────────────

/** Get or assign a sticky variant — localStorage-based, per category×market */
function getOrAssignVariant(hubId: string): AbVariant {
  try {
    const stored = localStorage.getItem(AB_STORAGE_KEY);
    const map: Record<string, AbVariant> = stored ? JSON.parse(stored) : {};
    if (map[hubId]) return map[hubId];

    // 50/50 random split
    const variant: AbVariant = Math.random() < 0.5 ? 'A' : 'B';
    map[hubId] = variant;
    localStorage.setItem(AB_STORAGE_KEY, JSON.stringify(map));
    return variant;
  } catch {
    // localStorage blocked → deterministic fallback based on hubId hash
    let hash = 0;
    for (let i = 0; i < hubId.length; i++) {
      hash = ((hash << 5) - hash + hubId.charCodeAt(i)) | 0;
    }
    return (hash & 1) === 0 ? 'A' : 'B';
  }
}

/** Fire A/B event to /api/hub-ab (non-blocking) */
function trackAbEvent(
  action: 'impression' | 'click',
  category: string,
  market: string,
  variant: AbVariant,
  providerName?: string,
): void {
  try {
    fetch('/api/hub-ab', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        category: `sticky_nav__${category}`,
        market,
        variant,
        ...(providerName ? { providerName } : {}),
      }),
      keepalive: true,
    }).catch(() => null);
  } catch { /* non-critical */ }
}

// ── Component ────────────────────────────────────────────────────

export function StickyReviewNav({
  productName,
  categoryLabel,
  category: categoryProp,
  market: marketProp,
  rating,
  reviewCount,
  affiliateUrl,
  primaryCtaLabel,
  ctaPartners = [],
  sentinelId = 'review-sticky-sentinel',
}: StickyReviewNavProps) {
  const [visible, setVisible] = useState(false);
  const [abVariant, setAbVariant] = useState<AbVariant | null>(null);
  const impressionSent = useRef(false);
  const abImpressionSent = useRef(false);
  const navRef = useRef<HTMLElement>(null);

  // ── Stable values ─────────────────────────────────────────────
  const year = useMemo(() => new Date().getFullYear(), []);

  const socialProofCount = useMemo(() => {
    const base = productName.length * 7 + (rating || 4) * 31;
    const hour = new Date().getHours();
    return Math.floor(80 + (base % 120) + hour * 3);
  }, [productName, rating]);

  // ── Derive category + market from URL or props ─────────────────
  const { resolvedCategory, resolvedMarket } = useMemo(() => {
    if (categoryProp && marketProp) {
      return { resolvedCategory: categoryProp, resolvedMarket: marketProp };
    }
    const path = typeof window !== 'undefined' ? window.location.pathname : '/';
    return {
      resolvedCategory: categoryProp || getCategoryFromPath(path),
      resolvedMarket: marketProp || getMarketFromPath(path),
    };
  }, [categoryProp, marketProp]);

  const hubId = `sticky_nav__${resolvedCategory}__${resolvedMarket}`;

  // ── A/B variant assignment (client-only, after hydration) ──────
  useEffect(() => {
    // Check for concluded winner first
    fetch(`/api/hub-ab?category=sticky_nav__${resolvedCategory}&market=${resolvedMarket}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.winner) {
          setAbVariant(data.winner as AbVariant);
        } else {
          setAbVariant(getOrAssignVariant(hubId));
        }
      })
      .catch(() => {
        // API failed → use local assignment
        setAbVariant(getOrAssignVariant(hubId));
      });
  }, [hubId, resolvedCategory, resolvedMarket]);

  // ── Visibility observer ──────────────────────────────────────
  useEffect(() => {
    const sentinel = document.getElementById(sentinelId);

    if (sentinel) {
      const observer = new IntersectionObserver(
        ([entry]) => setVisible(!entry.isIntersecting),
        { rootMargin: '-64px 0px 0px 0px', threshold: 0 },
      );
      observer.observe(sentinel);
      return () => observer.disconnect();
    } else {
      const onScroll = () => setVisible(window.scrollY > 320);
      window.addEventListener('scroll', onScroll, { passive: true });
      return () => window.removeEventListener('scroll', onScroll);
    }
  }, [sentinelId]);

  // ── Inert toggle ──────────────────────────────────────────────
  useEffect(() => {
    const el = navRef.current;
    if (!el) return;
    if (visible) { el.removeAttribute('inert'); }
    else { el.setAttribute('inert', ''); }
  }, [visible]);

  // ── CTA impression tracking (fires once per page view) ────────
  useEffect(() => {
    if (visible && !impressionSent.current) {
      impressionSent.current = true;
      try {
        const pagePath = window.location.pathname;
        const pageSlug = pagePath.replace(/^\//, '').replace(/\/$/, '').toLowerCase();
        const payload = JSON.stringify({
          slug: pageSlug.replace(/[^a-z0-9/_-]/g, '').slice(0, 200) || 'home',
          provider: 'sticky_nav',
          variant: 'impression',
          market: getMarketFromPath(pagePath),
        });
        if (navigator.sendBeacon) {
          navigator.sendBeacon(
            '/api/track-cta',
            new Blob([payload], { type: 'application/json' }),
          );
        } else {
          fetch('/api/track-cta', {
            method: 'POST',
            body: payload,
            headers: { 'Content-Type': 'application/json' },
            keepalive: true,
          }).catch(() => null);
        }
      } catch { /* non-critical */ }
    }
  }, [visible]);

  // ── A/B impression tracking (fires once when visible + variant assigned) ──
  useEffect(() => {
    if (visible && abVariant && !abImpressionSent.current) {
      abImpressionSent.current = true;
      trackAbEvent('impression', resolvedCategory, resolvedMarket, abVariant);
    }
  }, [visible, abVariant, resolvedCategory, resolvedMarket]);

  // ── Smart CTA resolution chain (memoized) ───────────────────
  const resolvedPartners = useMemo(() => {
    const placement1 = ctaPartners
      .filter((p) => p.placements.includes(1))
      .sort((a, b) => a.position - b.position);

    const anyPlacement = ctaPartners
      .filter((p) => !p.placements.includes(1))
      .sort((a, b) => a.position - b.position);

    if (placement1.length > 0) {
      const merged = [...placement1, ...anyPlacement];
      const seen = new Set<string>();
      const unique = merged.filter((p) => {
        if (seen.has(p.slug)) return false;
        seen.add(p.slug);
        return true;
      });
      return unique.slice(0, 3).map((p) => ({
        label: p.partner_name,
        url: `/go/${p.slug}/`,
      }));
    } else if (anyPlacement.length > 0) {
      return anyPlacement.slice(0, 3).map((p) => ({
        label: p.partner_name,
        url: `/go/${p.slug}/`,
      }));
    } else if (affiliateUrl && affiliateUrl !== '#') {
      return [{ label: primaryCtaLabel || `Visit ${productName}`, url: affiliateUrl }];
    }
    return [];
  }, [ctaPartners, affiliateUrl, primaryCtaLabel, productName]);

  // ── Hover handlers ────────────────────────────────────────────
  const handleMouseEnter = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, colors: ButtonColorScheme, _isPrimary: boolean) => {
      const el = e.currentTarget;
      el.style.background = colors.hoverBg;
      el.style.color = colors.hoverText;
      el.style.boxShadow = colors.hoverShadow;
      el.style.textDecoration = 'none';
      if (colors.hoverBorder) el.style.border = colors.hoverBorder;
      el.style.transform = 'translateY(-1px)';
    },
    [],
  );

  const handleMouseLeave = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, colors: ButtonColorScheme, _isPrimary: boolean) => {
      const el = e.currentTarget;
      el.style.background = colors.bg;
      el.style.color = colors.text;
      el.style.boxShadow = colors.shadow;
      el.style.textDecoration = 'none';
      if (colors.border) el.style.border = colors.border;
      el.style.transform = 'translateY(0)';
    },
    [],
  );

  if (resolvedPartners.length === 0) return null;

  // ── Text ──────────────────────────────────────────────────────
  const headline = `${productName} Review ${year}`;

  const subtitleParts: string[] = ['Expert Analysis'];
  if (rating && rating > 0) subtitleParts.push(`★ ${rating.toFixed(1)}/5`);
  if (reviewCount && reviewCount > 0) subtitleParts.push(`${reviewCount.toLocaleString('en-US')} Ratings`);
  subtitleParts.push(categoryLabel);
  const subtitle = subtitleParts.join(' · ');

  // ── Use Variant A as default until variant is resolved ─────────
  const currentVariant = abVariant || 'A';

  // ── Render helpers per variant ─────────────────────────────────

  /** Variant A: Multi-CTA — up to 3 buttons with labels + social proof */
  const renderVariantA = () => (
    <>
      {/* CENTER: Social proof */}
      <div className="hidden lg:block shrink-0" aria-hidden="true">
        <div
          className="flex items-center gap-1.5 text-xs sm:text-sm whitespace-nowrap"
          style={{ color: 'var(--sfp-slate)' }}
        >
          <Users className="w-3.5 h-3.5" />
          <span>{socialProofCount.toLocaleString()} comparing now</span>
        </div>
      </div>

      {/* RIGHT: Up to 3 CTA Buttons */}
      <div className="flex items-center gap-2.5 shrink-0" role="group" aria-label="Partner offers">
        {resolvedPartners.map((cta, i) => {
          const colors = BUTTON_COLORS[i] || BUTTON_COLORS[1];
          const isPrimary = i === 0;

          const buttonGroup = (
            <div className="flex flex-col items-center gap-1.5">
              <Link
                href={cta.url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                tabIndex={visible ? 0 : -1}
                aria-label={`${cta.label} (opens in new tab)`}
                className="
                  sticky-pulse-glow
                  inline-flex items-center gap-2 rounded-2xl
                  px-5 py-2 text-sm font-bold
                  whitespace-nowrap no-underline hover:no-underline
                  transition-all duration-200 hover:scale-[1.02]
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2
                  [text-decoration:none]
                "
                style={{
                  background: colors.bg,
                  color: colors.text,
                  boxShadow: colors.shadow,
                  border: colors.border || 'none',
                  textDecoration: 'none',
                  '--tw-ring-offset-color': 'var(--sfp-gray)',
                } as React.CSSProperties}
                onMouseEnter={(e) => handleMouseEnter(e, colors, isPrimary)}
                onMouseLeave={(e) => handleMouseLeave(e, colors, isPrimary)}
                onClick={() => {
                  trackClick(cta.url, cta.label, i + 1);
                  if (abVariant) trackAbEvent('click', resolvedCategory, resolvedMarket, abVariant, cta.label);
                }}
              >
                {isPrimary && <ExternalLink className="w-4 h-4 shrink-0" aria-hidden="true" />}
                <span>{cta.label}</span>
                {isPrimary && <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />}
              </Link>
              <span
                className="hidden sm:block text-xs leading-tight whitespace-nowrap"
                style={{ color: 'var(--sfp-slate)', fontWeight: 500 }}
                aria-hidden="true"
              >
                {colors.badge}
              </span>
            </div>
          );

          if (isPrimary) return <div key={`cta-${i}-${cta.url}`}>{buttonGroup}</div>;
          return <div key={`cta-${i}-${cta.url}`} className="hidden lg:block">{buttonGroup}</div>;
        })}
      </div>
    </>
  );

  /** Variant B: Focused — single CTA, urgency text, no labels */
  const renderVariantB = () => {
    const cta = resolvedPartners[0];
    const colors = FOCUSED_BUTTON;

    return (
      <>
        {/* CENTER: Urgency text instead of social proof */}
        <div className="hidden lg:block shrink-0" aria-hidden="true">
          <div
            className="flex items-center gap-1.5 text-xs sm:text-sm whitespace-nowrap"
            style={{ color: 'var(--sfp-gold-dark)', fontWeight: 600 }}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Limited offer — compare now</span>
          </div>
        </div>

        {/* RIGHT: Single prominent CTA */}
        <div className="shrink-0">
          <Link
            href={cta.url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            tabIndex={visible ? 0 : -1}
            aria-label={`${cta.label} (opens in new tab)`}
            className="
              sticky-pulse-glow
              inline-flex items-center gap-2.5 rounded-2xl
              px-6 py-2.5 text-sm sm:text-base font-bold
              whitespace-nowrap no-underline hover:no-underline
              transition-all duration-200 hover:scale-[1.03]
              focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2
              [text-decoration:none]
            "
            style={{
              background: colors.bg,
              color: colors.text,
              boxShadow: colors.shadow,
              border: colors.border || 'none',
              textDecoration: 'none',
              '--tw-ring-offset-color': 'var(--sfp-gray)',
            } as React.CSSProperties}
            onMouseEnter={(e) => handleMouseEnter(e, colors, true)}
            onMouseLeave={(e) => handleMouseLeave(e, colors, true)}
            onClick={() => {
              trackClick(cta.url, cta.label, 1);
              if (abVariant) trackAbEvent('click', resolvedCategory, resolvedMarket, abVariant, cta.label);
            }}
          >
            <ExternalLink className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Try {cta.label} Free</span>
            <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
          </Link>
        </div>
      </>
    );
  };

  return (
    <nav
      ref={navRef}
      aria-label={`${productName} review — quick access`}
      aria-hidden={!visible}
      className={`
        fixed top-0 left-0 right-0 z-50 border-b border-[#E2E8F0]
        transition-transform duration-300 ease-in-out
        ${visible ? 'translate-y-0' : '-translate-y-full'}
      `}
      style={{
        background: 'var(--sfp-gray)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
      }}
    >
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-4 sm:gap-8">

          {/* ── LEFT: Logo + Two-line headline ──────────────────────── */}
          <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
            {/* SmartFinPro logo — matches header exactly */}
            <div className="hidden sm:flex items-center gap-2 shrink-0" aria-hidden="true">
              <span
                className="flex items-center justify-center w-[30px] h-[30px] rounded-[7px]"
                style={{ background: 'var(--sfp-navy)' }}
              >
                <svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" width="16" height="16">
                  <rect x="6.5" y="1" width="5" height="16" rx="1.5" fill="#FFC942"/>
                  <rect x="1" y="6.5" width="16" height="5" rx="1.5" fill="#FFC942"/>
                </svg>
              </span>
            </div>

            {/* Divider */}
            <div className="hidden sm:block w-px h-8 bg-[#E2E8F0] shrink-0" aria-hidden="true" />

            <div className="min-w-0">
              <h2
                className="text-sm sm:text-base font-bold leading-tight truncate"
                style={{ color: 'var(--sfp-ink)' }}
              >
                {headline}
              </h2>
              <p
                className="hidden sm:block text-xs leading-tight truncate mt-0.5"
                style={{ color: 'var(--sfp-slate)' }}
              >
                {subtitle}
              </p>
            </div>
          </div>

          {/* ── CENTER + RIGHT: Varies by A/B variant ──────────────── */}
          {currentVariant === 'A' ? renderVariantA() : renderVariantB()}

        </div>
      </div>
    </nav>
  );
}
