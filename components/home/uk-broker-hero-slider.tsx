'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Shield,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Smartphone,
  Users,
} from 'lucide-react';

/* ─────────────────────────── Inline SVG Logos (0ms LCP) ─────────── */

function IGLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 130 36" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} role="img" aria-label="IG Group">
      <rect x="0" y="2" width="32" height="32" rx="6" fill="#DC3545" />
      <text x="16" y="25" textAnchor="middle" fontFamily="system-ui, -apple-system, sans-serif" fontSize="17" fontWeight="800" fill="white">IG</text>
      <text x="42" y="25" fontFamily="system-ui, -apple-system, sans-serif" fontSize="21" fontWeight="700" fill="#1A1A2E" letterSpacing="0.5">IG Group</text>
    </svg>
  );
}

function Plus500Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 150 36" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} role="img" aria-label="Plus500">
      <circle cx="18" cy="18" r="16" fill="#0A6CFF" />
      <path d="M18 10v16M10 18h16" stroke="white" strokeWidth="3" strokeLinecap="round" />
      <text x="44" y="25" fontFamily="system-ui, -apple-system, sans-serif" fontSize="20" fontWeight="700" fill="#1A1A2E" letterSpacing="0.3">Plus500</text>
    </svg>
  );
}

function EToroLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 36" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} role="img" aria-label="eToro">
      <circle cx="18" cy="18" r="16" fill="#6FDA44" />
      <path d="M13 14l-3-5M23 14l3-5" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M11 20l7 8 7-8" fill="white" opacity="0.95" />
      <text x="42" y="25" fontFamily="system-ui, -apple-system, sans-serif" fontSize="22" fontWeight="700" fill="#1A1A2E">eToro</text>
    </svg>
  );
}

const brokerLogos: Record<string, React.FC<{ className?: string }>> = {
  ig: IGLogo,
  plus500: Plus500Logo,
  etoro: EToroLogo,
};

/* ─────────────────────────── Slide Data ─────────────────────────── */

interface BrokerSlide {
  id: string;
  headline: string;
  usp: string;
  trustBadge: string;
  cta: string;
  href: string;
  reviewHref: string;
  accentColor: string;
  riskWarning: string;
  icon: typeof TrendingUp;
  trackingEvent: string;
}

const slides: BrokerSlide[] = [
  {
    id: 'ig',
    headline: "UK's No. 1 Broker",
    usp: 'LSE-Listed · 17,000+ Markets · Pro Execution',
    trustBadge: 'FCA & FSCS Protected',
    cta: 'Open IG Account',
    href: '/go/ig',
    reviewHref: '/uk/trading/ig-markets-review',
    accentColor: '#DC3545',
    riskWarning: '70% of retail investor accounts lose money when trading with this provider.',
    icon: TrendingUp,
    trackingEvent: 'hero_click_ig',
  },
  {
    id: 'plus500',
    headline: 'CFD Trading on the Go',
    usp: 'Intuitive App · 0% Commission · 2,800+ Instruments',
    trustBadge: 'FTSE 250 Listed',
    cta: 'Start with Plus500',
    href: '/go/plus500',
    reviewHref: '/uk/trading/plus500-review',
    accentColor: '#0A6CFF',
    riskWarning: '80% of retail investor accounts lose money when trading CFDs with this provider.',
    icon: Smartphone,
    trackingEvent: 'hero_click_plus500',
  },
  {
    id: 'etoro',
    headline: 'Copy the Pros',
    usp: 'CopyTrader™ · 0% Stock Commission · 30M+ Users',
    trustBadge: 'Trusted by 30M+',
    cta: 'Join eToro UK',
    href: '/go/etoro',
    reviewHref: '/uk/trading/etoro-review',
    accentColor: '#6FDA44',
    riskWarning: '51% of retail investor accounts lose money when trading CFDs with this provider.',
    icon: Users,
    trackingEvent: 'hero_click_etoro',
  },
];

/* ─────────────────── Non-blocking Event Tracking ────────────────── */

function fireTrackingEvent(slide: BrokerSlide, action: 'cta_click' | 'review_click') {
  try {
    const sessionId = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('sfp_session_id') || '' : '';
    const pagePath = typeof window !== 'undefined' ? window.location.pathname : '/uk';
    const payload = JSON.stringify({
      type: 'event',
      sessionId,
      data: {
        eventName: action === 'cta_click' ? slide.trackingEvent : `hero_review_${slide.id}`,
        eventCategory: 'hero_slider',
        eventAction: action,
        eventLabel: `${slide.id} — ${action === 'cta_click' ? slide.cta : 'Read Full Review'}`,
        pagePath,
        properties: { broker: slide.id, slidePosition: slides.indexOf(slide) + 1, buttonType: action === 'cta_click' ? 'primary_cta' : 'review_link' },
      },
    });
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon('/api/track', new Blob([payload], { type: 'application/json' }));
    } else {
      fetch('/api/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload, keepalive: true }).catch(() => {});
    }
  } catch { /* Analytics must never throw */ }
}

/* ───────────────────────── Main Slider ──────────────────────────── */

const AUTOPLAY_INTERVAL = 6000;
const SLIDE_DURATION = 400;

export default function UKBrokerHeroSlider() {
  const [[activeIndex], setActiveIndex] = useState([0, 0]);
  const [isPaused, setIsPaused] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const transitionTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const triggerTransition = useCallback((setter: () => void) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setter();
    clearTimeout(transitionTimer.current);
    transitionTimer.current = setTimeout(() => setIsTransitioning(false), SLIDE_DURATION);
  }, [isTransitioning]);

  const goTo = useCallback((index: number) => {
    triggerTransition(() => {
      const dir = index > activeIndex ? 1 : -1;
      setActiveIndex([index, dir]);
    });
  }, [activeIndex, triggerTransition]);

  const goNext = useCallback(() => {
    triggerTransition(() => {
      setActiveIndex(([prev]) => [(prev + 1) % slides.length, 1]);
    });
  }, [triggerTransition]);

  const goPrev = useCallback(() => {
    triggerTransition(() => {
      setActiveIndex(([prev]) => [(prev - 1 + slides.length) % slides.length, -1]);
    });
  }, [triggerTransition]);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(goNext, AUTOPLAY_INTERVAL);
    return () => clearInterval(timer);
  }, [isPaused, goNext]);

  const [touchStart, setTouchStart] = useState<number | null>(null);

  function handleTouchStart(e: React.TouchEvent) {
    setTouchStart(e.touches[0].clientX);
    setIsPaused(true);
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStart === null) return;
    const diff = e.changedTouches[0].clientX - touchStart;
    if (Math.abs(diff) > 50) { diff > 0 ? goPrev() : goNext(); }
    setTouchStart(null);
    setIsPaused(false);
  }

  const currentSlide = slides[activeIndex];
  const LogoComponent = brokerLogos[currentSlide.id];

  return (
    <section
      className="relative w-full"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Compact 3-card layout */}
      <div className="max-w-5xl mx-auto">
        {/* Header row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider"
              style={{ background: 'rgba(26, 107, 58, 0.08)', border: '1px solid rgba(26, 107, 58, 0.15)', color: 'var(--sfp-green)' }}
            >
              <Shield className="h-3 w-3" />
              FCA-Regulated
            </div>
            <h2 className="text-base font-bold" style={{ color: 'var(--sfp-ink)' }}>
              Top UK Brokers
            </h2>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => { goPrev(); setIsPaused(true); setTimeout(() => setIsPaused(false), 8000); }}
              className="h-7 w-7 flex items-center justify-center rounded-full border border-gray-200 bg-white hover:shadow-sm transition-shadow cursor-pointer"
              aria-label="Previous broker"
            >
              <ChevronLeft className="h-3.5 w-3.5" style={{ color: 'var(--sfp-slate)' }} />
            </button>
            <button
              onClick={() => { goNext(); setIsPaused(true); setTimeout(() => setIsPaused(false), 8000); }}
              className="h-7 w-7 flex items-center justify-center rounded-full border border-gray-200 bg-white hover:shadow-sm transition-shadow cursor-pointer"
              aria-label="Next broker"
            >
              <ChevronRight className="h-3.5 w-3.5" style={{ color: 'var(--sfp-slate)' }} />
            </button>
            <span className="text-[11px] tabular-nums ml-1" style={{ color: 'var(--sfp-slate)' }}>
              {activeIndex + 1}/{slides.length}
            </span>
          </div>
        </div>

        {/* Cards row — show all 3, highlight active */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {slides.map((slide, i) => {
            const isActive = i === activeIndex;
            const Logo = brokerLogos[slide.id];

            return (
              <div
                key={slide.id}
                onClick={() => goTo(i)}
                className="relative rounded-xl border bg-white overflow-hidden transition-all duration-300 cursor-pointer"
                style={{
                  borderColor: isActive ? slide.accentColor : '#e5e7eb',
                  boxShadow: isActive ? `0 4px 20px rgba(0,0,0,0.08), 0 0 0 1px ${slide.accentColor}20` : '0 1px 3px rgba(0,0,0,0.04)',
                  transform: isActive ? 'scale(1)' : 'scale(0.98)',
                  opacity: isActive ? 1 : 0.7,
                }}
              >
                {/* Accent top bar */}
                <div className="h-1" style={{ background: isActive ? slide.accentColor : '#e5e7eb' }} />

                <div className="p-4">
                  {/* Logo + Trust */}
                  <div className="flex items-center justify-between mb-3">
                    {Logo && <Logo className="h-6 w-auto" />}
                    <span
                      className="text-[10px] font-medium rounded-full px-2 py-0.5"
                      style={{
                        background: isActive ? 'rgba(26, 107, 58, 0.08)' : 'var(--sfp-gray)',
                        color: isActive ? 'var(--sfp-green)' : 'var(--sfp-slate)',
                      }}
                    >
                      {slide.trustBadge}
                    </span>
                  </div>

                  {/* Headline */}
                  <h3
                    className="text-base font-bold leading-snug mb-1"
                    style={{ color: 'var(--sfp-ink)' }}
                  >
                    {slide.headline}
                  </h3>

                  {/* USP */}
                  <p className="text-xs leading-relaxed mb-3" style={{ color: 'var(--sfp-slate)' }}>
                    {slide.usp}
                  </p>

                  {/* CTAs — only show on active */}
                  {isActive && (
                    <div className="flex items-center gap-2 mb-3">
                      <Link
                        href={slide.href}
                        onClick={(e) => { e.stopPropagation(); fireTrackingEvent(slide, 'cta_click'); }}
                        className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold text-white transition-all hover:scale-[1.02] hover:shadow-md"
                        style={{ background: slide.accentColor }}
                      >
                        {slide.cta}
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                      <Link
                        href={slide.reviewHref}
                        onClick={(e) => { e.stopPropagation(); fireTrackingEvent(slide, 'review_click'); }}
                        className="text-xs font-medium transition-colors hover:underline"
                        style={{ color: 'var(--sfp-navy)' }}
                      >
                        Review →
                      </Link>
                    </div>
                  )}

                  {/* Risk warning — compact */}
                  <p className="text-[10px] leading-relaxed" style={{ color: 'var(--sfp-slate)', opacity: isActive ? 0.8 : 0.5 }}>
                    <span style={{ color: 'var(--sfp-red)', fontWeight: 600 }}>Risk:</span>{' '}
                    {slide.riskWarning}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Progress dots — mobile */}
        <div className="flex items-center justify-center gap-2 mt-3 sm:hidden">
          {slides.map((slide, i) => (
            <button
              key={slide.id}
              onClick={() => goTo(i)}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: i === activeIndex ? 24 : 6,
                background: i === activeIndex ? slide.accentColor : 'rgba(148,163,184,0.3)',
              }}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
