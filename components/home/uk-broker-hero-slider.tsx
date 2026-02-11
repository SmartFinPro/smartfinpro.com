'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  Shield,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Smartphone,
  Users,
} from 'lucide-react';
/* Analytics: uses sendBeacon directly (no hooks) to avoid useSearchParams SSG bailout */

/* ─────────────────────────── Inline SVG Logos (0ms LCP) ─────────── */

function IGLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 130 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="IG Group"
    >
      {/* Rounded square icon */}
      <rect x="0" y="2" width="32" height="32" rx="6" fill="#DC3545" />
      <text
        x="16"
        y="25"
        textAnchor="middle"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="17"
        fontWeight="800"
        fill="white"
      >
        IG
      </text>
      {/* Wordmark */}
      <text
        x="42"
        y="25"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="21"
        fontWeight="700"
        fill="white"
        letterSpacing="0.5"
      >
        IG Group
      </text>
    </svg>
  );
}

function Plus500Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 150 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Plus500"
    >
      {/* Circle with plus symbol */}
      <circle cx="18" cy="18" r="16" fill="#0A6CFF" />
      <path
        d="M18 10v16M10 18h16"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Wordmark */}
      <text
        x="44"
        y="25"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="20"
        fontWeight="700"
        fill="white"
        letterSpacing="0.3"
      >
        Plus500
      </text>
    </svg>
  );
}

function EToroLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="eToro"
    >
      {/* Circle with bull icon */}
      <circle cx="18" cy="18" r="16" fill="#6FDA44" />
      {/* Bull horns */}
      <path
        d="M13 14l-3-5M23 14l3-5"
        stroke="white"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      {/* Bull head / arrow up */}
      <path
        d="M11 20l7 8 7-8"
        fill="white"
        opacity="0.95"
      />
      {/* Wordmark */}
      <text
        x="42"
        y="25"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="22"
        fontWeight="700"
        fill="white"
      >
        eToro
      </text>
    </svg>
  );
}

/** Map broker IDs to inline SVG components — zero HTTP requests */
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
  glowColor: string;
  bgGradient: string;
  riskWarning: string;
  icon: typeof TrendingUp;
  trackingEvent: string;
}

const slides: BrokerSlide[] = [
  {
    id: 'ig',
    headline: "Trade with the UK's No. 1 Broker",
    usp: 'LSE-Listed, 17,000+ Markets, Professional Execution.',
    trustBadge: 'FCA Regulated & FSCS Protected',
    cta: 'Open IG Account',
    href: '/go/ig',
    reviewHref: '/uk/trading/ig-markets-review',
    accentColor: '#DC3545',
    glowColor: 'rgba(220, 53, 69, 0.15)',
    bgGradient: 'linear-gradient(135deg, rgba(220,53,69,0.08) 0%, rgba(15,10,26,0.95) 60%)',
    riskWarning:
      'Spread bets and CFDs are complex instruments. 70% of retail investor accounts lose money when trading with this provider.',
    icon: TrendingUp,
    trackingEvent: 'hero_click_ig',
  },
  {
    id: 'plus500',
    headline: 'Simplified CFD Trading on the Go',
    usp: 'Intuitive App, 0% Commission, 2,800+ Instruments.',
    trustBadge: 'FTSE 250 Listed Company',
    cta: 'Start Trading with Plus500',
    href: '/go/plus500',
    reviewHref: '/uk/trading/plus500-review',
    accentColor: '#0A6CFF',
    glowColor: 'rgba(10, 108, 255, 0.15)',
    bgGradient: 'linear-gradient(135deg, rgba(10,108,255,0.08) 0%, rgba(15,10,26,0.95) 60%)',
    riskWarning:
      '80% of retail investor accounts lose money when trading CFDs with this provider. You should consider whether you can afford to take the high risk of losing your money.',
    icon: Smartphone,
    trackingEvent: 'hero_click_plus500',
  },
  {
    id: 'etoro',
    headline: "Don't Trade Alone. Copy the Pros.",
    usp: 'CopyTrader™ Technology, 0% Stock Commission, Global Community.',
    trustBadge: 'Trusted by 30M+ Users',
    cta: 'Join eToro UK',
    href: '/go/etoro',
    reviewHref: '/uk/trading/etoro-review',
    accentColor: '#6FDA44',
    glowColor: 'rgba(111, 218, 68, 0.15)',
    bgGradient: 'linear-gradient(135deg, rgba(111,218,68,0.08) 0%, rgba(15,10,26,0.95) 60%)',
    riskWarning:
      "51% of retail investor accounts lose money when trading CFDs with this provider. You should consider whether you understand how CFDs work and whether you can afford to take the high risk of losing your money. Don't invest unless you're prepared to lose all the money you invest.",
    icon: Users,
    trackingEvent: 'hero_click_etoro',
  },
];

/* ───────────────────────── Progress Dots ─────────────────────────── */

function ProgressDots({
  count,
  active,
  onSelect,
  accentColor,
}: {
  count: number;
  active: number;
  onSelect: (i: number) => void;
  accentColor: string;
}) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <button
          key={i}
          onClick={() => onSelect(i)}
          aria-label={`Go to slide ${i + 1}`}
          className="relative h-2 rounded-full transition-all duration-500 cursor-pointer"
          style={{
            width: i === active ? 32 : 8,
            background: i === active ? accentColor : 'rgba(148,163,184,0.3)',
          }}
        >
          {i === active && (
            <motion.div
              layoutId="activeDot"
              className="absolute inset-0 rounded-full"
              style={{ background: accentColor }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          )}
        </button>
      ))}
    </div>
  );
}

/* ───────────────────────── Auto-Progress Bar ────────────────────── */

function AutoProgressBar({
  duration,
  isActive,
  accentColor,
}: {
  duration: number;
  isActive: boolean;
  accentColor: string;
}) {
  return (
    <div className="h-0.5 w-full rounded-full overflow-hidden" style={{ background: 'rgba(148,163,184,0.15)' }}>
      <motion.div
        className="h-full rounded-full"
        style={{ background: accentColor }}
        initial={{ width: '0%' }}
        animate={{ width: isActive ? '100%' : '0%' }}
        transition={{ duration: isActive ? duration / 1000 : 0, ease: 'linear' }}
        key={isActive ? 'active' : 'reset'}
      />
    </div>
  );
}

/* ─────────────────── Non-blocking Event Tracking ────────────────── */

/**
 * Fire a tracking event via navigator.sendBeacon (non-blocking)
 * with fetch fallback. Never delays navigation or UI.
 */
function fireTrackingEvent(slide: BrokerSlide, action: 'cta_click' | 'review_click') {
  try {
    const sessionId =
      typeof sessionStorage !== 'undefined'
        ? sessionStorage.getItem('sfp_session_id') || ''
        : '';
    const pagePath =
      typeof window !== 'undefined' ? window.location.pathname : '/uk';

    const payload = JSON.stringify({
      type: 'event',
      sessionId,
      data: {
        eventName: action === 'cta_click' ? slide.trackingEvent : `hero_review_${slide.id}`,
        eventCategory: 'hero_slider',
        eventAction: action,
        eventLabel: `${slide.id} — ${action === 'cta_click' ? slide.cta : 'Read Full Review'}`,
        pagePath,
        properties: {
          broker: slide.id,
          slidePosition: slides.indexOf(slide) + 1,
          buttonType: action === 'cta_click' ? 'primary_cta' : 'review_link',
        },
      },
    });

    // Prefer sendBeacon — fires even during page unload, never blocks
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon(
        '/api/track',
        new Blob([payload], { type: 'application/json' })
      );
    } else {
      // Fallback: fire-and-forget fetch with keepalive
      fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch(() => {
        /* Analytics must never throw */
      });
    }
  } catch {
    /* Silently ignore — analytics must never affect UX */
  }
}

/* ───────────────────────── Main Slider ──────────────────────────── */

const AUTOPLAY_INTERVAL = 6000;

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 60 : -60,
    opacity: 0,
    scale: 0.97,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -60 : 60,
    opacity: 0,
    scale: 0.97,
  }),
};

export function UKBrokerHeroSlider() {
  const [[activeIndex, direction], setActiveIndex] = useState([0, 0]);
  const [isPaused, setIsPaused] = useState(false);

  const currentSlide = slides[activeIndex];

  const goTo = useCallback(
    (index: number) => {
      const dir = index > activeIndex ? 1 : -1;
      setActiveIndex([index, dir]);
    },
    [activeIndex]
  );

  const goNext = useCallback(() => {
    setActiveIndex(([prev]) => [(prev + 1) % slides.length, 1]);
  }, []);

  const goPrev = useCallback(() => {
    setActiveIndex(([prev]) => [(prev - 1 + slides.length) % slides.length, -1]);
  }, []);

  /* Autoplay */
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(goNext, AUTOPLAY_INTERVAL);
    return () => clearInterval(timer);
  }, [isPaused, goNext]);

  /* Touch / Swipe support */
  const [touchStart, setTouchStart] = useState<number | null>(null);

  function handleTouchStart(e: React.TouchEvent) {
    setTouchStart(e.touches[0].clientX);
    setIsPaused(true);
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStart === null) return;
    const diff = e.changedTouches[0].clientX - touchStart;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goPrev();
      else goNext();
    }
    setTouchStart(null);
    setIsPaused(false);
  }

  /* ── Click handlers — sendBeacon for non-blocking tracking ── */
  function handleCtaClick(slide: BrokerSlide) {
    fireTrackingEvent(slide, 'cta_click');
  }

  function handleReviewClick(slide: BrokerSlide) {
    fireTrackingEvent(slide, 'review_click');
  }

  const SlideIcon = currentSlide.icon;
  const LogoComponent = brokerLogos[currentSlide.id];

  return (
    <section
      className="relative w-full overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Section Header */}
      <div className="text-center mb-8">
        <div
          className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold tracking-widest uppercase mb-4"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(100,116,139,0.3)',
            color: '#94a3b8',
          }}
        >
          <Shield className="h-3.5 w-3.5 text-cyan-400" />
          FCA-Regulated Brokers
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          Top UK Trading Platforms
        </h2>
        <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
          Compare the UK&apos;s most trusted, FCA-regulated brokers — all with FSCS investor protection.
        </p>
      </div>

      {/* Slider Container */}
      <div className="relative max-w-4xl mx-auto">
        {/* Glow Effect Behind Card */}
        <motion.div
          className="absolute inset-0 rounded-2xl blur-3xl -z-10"
          animate={{ background: currentSlide.glowColor }}
          transition={{ duration: 0.8 }}
          style={{ transform: 'scale(1.1)' }}
        />

        {/* Navigation Arrows — Desktop only */}
        <button
          onClick={() => {
            goPrev();
            setIsPaused(true);
            setTimeout(() => setIsPaused(false), 8000);
          }}
          className="hidden md:flex absolute -left-14 top-1/2 -translate-y-1/2 z-20 h-10 w-10 items-center justify-center rounded-full transition-all duration-300 cursor-pointer"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(100,116,139,0.3)',
          }}
          aria-label="Previous broker"
        >
          <ChevronLeft className="h-5 w-5 text-slate-400" />
        </button>

        <button
          onClick={() => {
            goNext();
            setIsPaused(true);
            setTimeout(() => setIsPaused(false), 8000);
          }}
          className="hidden md:flex absolute -right-14 top-1/2 -translate-y-1/2 z-20 h-10 w-10 items-center justify-center rounded-full transition-all duration-300 cursor-pointer"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(100,116,139,0.3)',
          }}
          aria-label="Next broker"
        >
          <ChevronRight className="h-5 w-5 text-slate-400" />
        </button>

        {/* Card */}
        <div className="relative overflow-hidden rounded-2xl" style={{ minHeight: 340 }}>
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentSlide.id}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="w-full rounded-2xl p-6 sm:p-8 lg:p-10"
              style={{
                background: currentSlide.bgGradient,
                border: '1px solid rgba(100,116,139,0.3)',
                backdropFilter: 'blur(16px)',
              }}
            >
              {/* Top Row: Inline SVG Logo + Trust Badge */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                  {/* Inline SVG — no HTTP request, instant render */}
                  <motion.div
                    className="flex-shrink-0"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    style={{ filter: 'drop-shadow(0 0 12px rgba(255,255,255,0.1))' }}
                  >
                    {LogoComponent && (
                      <LogoComponent className="h-8 sm:h-9 w-auto" />
                    )}
                  </motion.div>
                  <div
                    className="hidden sm:block h-8 w-px"
                    style={{ background: 'rgba(100,116,139,0.3)' }}
                  />
                  <SlideIcon
                    className="hidden sm:block h-5 w-5"
                    style={{ color: currentSlide.accentColor }}
                  />
                </div>

                <div
                  className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium self-start sm:self-auto"
                  style={{
                    background: 'rgba(16,185,129,0.1)',
                    border: '1px solid rgba(16,185,129,0.25)',
                    color: '#34d399',
                  }}
                >
                  <Shield className="h-3.5 w-3.5" />
                  {currentSlide.trustBadge}
                </div>
              </div>

              {/* Content */}
              <div className="space-y-4">
                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight">
                  {currentSlide.headline}
                </h3>
                <p className="text-base sm:text-lg text-slate-300 max-w-2xl">
                  {currentSlide.usp}
                </p>
              </div>

              {/* CTA Row — tracked clicks */}
              <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <Link
                  href={currentSlide.href}
                  onClick={() => handleCtaClick(currentSlide)}
                  className="group inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
                  style={{
                    background: currentSlide.accentColor,
                    boxShadow: `0 4px 24px ${currentSlide.glowColor}`,
                  }}
                >
                  {currentSlide.cta}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href={currentSlide.reviewHref}
                  onClick={() => handleReviewClick(currentSlide)}
                  className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
                >
                  Read Full Review
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {/* Risk Warning */}
              <div className="mt-6 pt-4" style={{ borderTop: '1px solid rgba(100,116,139,0.2)' }}>
                <p className="text-[11px] leading-relaxed text-slate-500">
                  <span className="font-semibold text-slate-400">Capital at risk.</span>{' '}
                  {currentSlide.riskWarning}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom Controls */}
        <div className="mt-5 flex items-center justify-between px-1">
          <ProgressDots
            count={slides.length}
            active={activeIndex}
            onSelect={(i) => {
              goTo(i);
              setIsPaused(true);
              setTimeout(() => setIsPaused(false), 8000);
            }}
            accentColor={currentSlide.accentColor}
          />

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 tabular-nums">
              {activeIndex + 1}/{slides.length}
            </span>
            <div className="w-20">
              <AutoProgressBar
                duration={AUTOPLAY_INTERVAL}
                isActive={!isPaused}
                accentColor={currentSlide.accentColor}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
