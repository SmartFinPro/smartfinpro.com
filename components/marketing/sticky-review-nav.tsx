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
// ── Analytics ──────────────────────────────────────────────────
//   • Impression beacon fires once when bar first becomes visible
//   • Click tracking on every CTA button via /api/track-cta
//
// ── Responsive (3 tiers) ───────────────────────────────────────
//   • Mobile:  Title + 1 Gold button
//   • Desktop: Title + Subtitle + 2 buttons (Gold + Ghost)
//   • XL:      Title + Subtitle + up to 3 buttons

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, ExternalLink, Users } from 'lucide-react';
import type { EnrichedCtaPartner } from '@/lib/types/page-cta';

interface StickyReviewNavProps {
  productName: string;
  categoryLabel: string;
  rating?: number;
  reviewCount?: number;
  affiliateUrl?: string;
  primaryCtaLabel?: string;
  ctaPartners?: EnrichedCtaPartner[];
  sentinelId?: string;
}

// ── Helpers ──────────────────────────────────────────────────────
function getMarketFromPath(path: string): 'us' | 'uk' | 'ca' | 'au' {
  if (path.startsWith('/uk')) return 'uk';
  if (path.startsWith('/ca')) return 'ca';
  if (path.startsWith('/au')) return 'au';
  return 'us';
}

/** Sanitise any URL into a schema-safe slug ([a-z0-9/_-]+, max 200 chars) */
function toSafeSlug(raw: string): string {
  let slug: string;
  if (raw.startsWith('/go/')) {
    // /go/wealthsimple/ → wealthsimple
    slug = raw.replace('/go/', '').replace(/\/$/, '');
  } else if (raw.startsWith('http')) {
    // External URL → extract hostname as slug fallback
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

export function StickyReviewNav({
  productName,
  categoryLabel,
  rating,
  reviewCount,
  affiliateUrl,
  primaryCtaLabel,
  ctaPartners = [],
  sentinelId = 'review-sticky-sentinel',
}: StickyReviewNavProps) {
  const [visible, setVisible] = useState(false);
  const impressionSent = useRef(false);
  const navRef = useRef<HTMLDivElement>(null);
  const year = new Date().getFullYear();

  // ── Social proof: stable "comparing now" number per session ────
  const socialProofCount = useMemo(() => {
    const base = productName.length * 7 + (rating || 4) * 31;
    const hour = new Date().getHours();
    return Math.floor(80 + (base % 120) + hour * 3); // 80–320 range, shifts by hour
  }, [productName, rating]);

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

  // ── Inert toggle (native DOM — works in all supporting browsers) ─
  useEffect(() => {
    const el = navRef.current;
    if (!el) return;
    if (visible) {
      el.removeAttribute('inert');
    } else {
      el.setAttribute('inert', '');
    }
  }, [visible]);

  // ── Impression tracking (fires once per page view) ───────────
  useEffect(() => {
    if (visible && !impressionSent.current) {
      impressionSent.current = true;
      try {
        const pagePath = typeof window !== 'undefined' ? window.location.pathname : '/';
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

  // ── Smart CTA resolution chain (memoized) ───────────────────
  const resolvedPartners = useMemo(() => {
    // Priority 1: Dedicated Placement 1 partners (dashboard "O" button)
    const placement1 = ctaPartners
      .filter((p) => p.placements.includes(1))
      .sort((a, b) => a.position - b.position);

    // Priority 2: Best partners from ANY placement (fallback pool)
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

  if (resolvedPartners.length === 0) return null;

  // ── Text ──────────────────────────────────────────────────────
  const headline = `${productName} Review ${year}`;

  const subtitleParts: string[] = ['Expert Analysis'];
  if (rating && rating > 0) subtitleParts.push(`★ ${rating.toFixed(1)}/5`);
  if (reviewCount && reviewCount > 0) subtitleParts.push(`${reviewCount.toLocaleString()} Ratings`);
  subtitleParts.push(categoryLabel);
  const subtitle = subtitleParts.join(' · ');

  return (
    <div
      ref={navRef}
      role="navigation"
      aria-label="Quick access navigation"
      aria-hidden={!visible}
      className={`
        fixed top-0 left-0 right-0 z-50
        transition-transform duration-300 ease-in-out
        ${visible ? 'translate-y-0' : '-translate-y-full'}
      `}
      style={{
        background: 'linear-gradient(135deg, var(--sfp-navy) 0%, var(--sfp-navy-dark) 100%)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
      }}
    >
      {/* Gold accent line at top — keyframes in globals.css (stickyPulseGlow) */}
      <div
        className="h-[3px] w-full"
        style={{ background: 'linear-gradient(90deg, var(--sfp-gold) 0%, var(--sfp-gold-dark) 50%, var(--sfp-gold) 100%)' }}
        aria-hidden="true"
      />

      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between py-3 gap-4 sm:gap-8">

          {/* ── LEFT: Icon + Two-line headline ──────────────────────── */}
          <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">

            {/* Shield icon — trust signal */}
            <div
              className="hidden sm:flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
              style={{ background: 'rgba(255, 255, 255, 0.1)' }}
              aria-hidden="true"
            >
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>

            <div className="min-w-0">
              {/* Line 1 — bold headline */}
              <h2 className="text-sm sm:text-base font-bold text-white leading-tight truncate">
                {headline}
              </h2>

              {/* Line 2 — plain text subtitle (market.us style) */}
              <p
                className="hidden sm:block text-xs sm:text-sm leading-tight truncate mt-0.5"
                style={{ color: 'rgba(255, 255, 255, 0.6)' }}
              >
                {subtitle}
              </p>
            </div>
          </div>

          {/* ── CENTER: Social proof (lg+ only, wrapper-div pattern) ── */}
          <div className="hidden lg:block shrink-0">
            <div
              className="flex items-center gap-1.5 text-xs sm:text-sm whitespace-nowrap"
              style={{ color: 'rgba(255, 255, 255, 0.5)' }}
            >
              <Users className="w-3.5 h-3.5" />
              <span>{socialProofCount.toLocaleString()} comparing now</span>
            </div>
          </div>

          {/* ── RIGHT: CTA Buttons ───────────────────────────────────
               Wrapper-divs handle responsive visibility (avoids Tailwind v4
               specificity conflicts between hidden + inline-flex).
               • Button 1: always visible
               • Button 2: wrapper hidden → lg:block (≥1024px)
               • Button 3: wrapper hidden → lg:block (≥1024px)
               ─────────────────────────────────────────────────────────── */}
          <div className="flex items-center gap-2.5 shrink-0">
            {resolvedPartners.map((cta, i) => {
              // ── Color palette + recommendation labels ─────────────
              const buttonColors = [
                // Gold primary — prominent & bold
                {
                  bg: 'rgba(255, 215, 100, 0.40)', text: '#FFE070',
                  shadow: '0 2px 10px rgba(255, 215, 100, 0.35)',
                  hoverBg: 'rgba(255, 215, 100, 0.60)', hoverText: '#FFF0A0',
                  hoverShadow: '0 4px 20px rgba(255, 215, 100, 0.6)',
                  badge: '★★★ Best Value',
                },
                // Teal
                {
                  bg: 'rgba(125, 211, 216, 0.15)', text: '#7DD3D8',
                  shadow: '0 2px 8px rgba(125, 211, 216, 0.2)',
                  hoverBg: 'rgba(125, 211, 216, 0.30)', hoverText: '#A5E8EC',
                  hoverShadow: '0 4px 16px rgba(125, 211, 216, 0.4)',
                  badge: '★★ Best Overall',
                },
                // Lavender
                {
                  bg: 'rgba(167, 139, 250, 0.15)', text: '#A78BFA',
                  shadow: '0 2px 8px rgba(167, 139, 250, 0.2)',
                  hoverBg: 'rgba(167, 139, 250, 0.30)', hoverText: '#C4B5FD',
                  hoverShadow: '0 4px 16px rgba(167, 139, 250, 0.4)',
                  badge: '★ Best Features',
                },
              ];
              const colors = buttonColors[i] || buttonColors[1];

              const buttonGroup = (
                <div className="flex flex-col items-center gap-1.5">
                  <Link
                    href={cta.url}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    tabIndex={visible ? 0 : -1}
                    className="
                      inline-flex items-center gap-2 rounded-xl
                      px-5 py-2 text-sm font-bold
                      whitespace-nowrap no-underline hover:no-underline
                      transition-all duration-200 hover:scale-[1.02]
                      focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-1
                      [text-decoration:none]
                    "
                    style={{
                      background: colors.bg,
                      color: colors.text,
                      boxShadow: colors.shadow,
                      textDecoration: 'none',
                      ...(i === 0 ? { animation: 'stickyPulseGlow 3s ease-in-out infinite' } : {}),
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = colors.hoverBg;
                      e.currentTarget.style.color = colors.hoverText;
                      e.currentTarget.style.boxShadow = colors.hoverShadow;
                      e.currentTarget.style.textDecoration = 'none';
                      if (i === 0) e.currentTarget.style.animation = 'none';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = colors.bg;
                      e.currentTarget.style.color = colors.text;
                      e.currentTarget.style.boxShadow = colors.shadow;
                      e.currentTarget.style.textDecoration = 'none';
                      if (i === 0) e.currentTarget.style.animation = 'stickyPulseGlow 3s ease-in-out infinite';
                    }}
                    onClick={() => {
                      try {
                        const pagePath = typeof window !== 'undefined' ? window.location.pathname : '/';
                        fetch('/api/track-cta', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            slug: toSafeSlug(cta.url),
                            provider: cta.label,
                            variant: `sticky_nav_pos${i + 1}`,
                            market: getMarketFromPath(pagePath),
                          }),
                          keepalive: true,
                        }).catch(() => null);
                      } catch { /* non-critical */ }
                    }}
                  >
                    {i === 0 && <ExternalLink className="w-4 h-4 shrink-0" />}
                    {cta.label}
                    {i === 0 && <ArrowRight className="w-4 h-4 shrink-0" />}
                  </Link>
                  <span
                    className="hidden sm:block text-xs sm:text-sm leading-tight whitespace-nowrap"
                    style={{ color: 'rgba(255, 255, 255, 0.6)', fontWeight: 400 }}
                  >
                    {colors.badge}
                  </span>
                </div>
              );

              // Button 1: always visible
              if (i === 0) return <div key={cta.url}>{buttonGroup}</div>;
              // Buttons 2+3: visible on lg+ (≥1024px)
              return <div key={`w-${cta.url}`} className="hidden lg:block">{buttonGroup}</div>;
            })}
          </div>

        </div>
      </div>
    </div>
  );
}
