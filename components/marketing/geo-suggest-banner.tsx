'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight } from 'lucide-react';
import { getVisitorMarketFromCookie } from '@/lib/geo/geo-cookie';
import { marketConfig } from '@/lib/i18n/config';
import type { MarketCode } from '@/lib/geo/detect-market';

// ── Cookie helpers ──────────────────────────────────────────
const DISMISSED_KEY = 'sfp-geo-dismissed';
const PREF_KEY = 'sfp-market-pref';

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.split('; ').find((c) => c.startsWith(`${name}=`));
  return match ? match.split('=')[1] : null;
}

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 86_400_000).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
}

// ── Market metadata ─────────────────────────────────────────
const MARKET_META: Record<MarketCode, { tagline: string }> = {
  us: { tagline: 'USD pricing & US-specific reviews' },
  uk: { tagline: 'FCA-regulated, GBP pricing' },
  ca: { tagline: 'CIRO-regulated, CAD pricing' },
  au: { tagline: 'ASIC-regulated, AUD pricing' },
};

// ── Resolve current market from URL ─────────────────────────
function marketFromPath(pathname: string): MarketCode {
  const seg = pathname.split('/').filter(Boolean)[0];
  if (seg === 'uk' || seg === 'ca' || seg === 'au') return seg;
  return 'us';
}

// ── Scroll threshold: switch to dark mode after hero area ───
const DARK_SCROLL_THRESHOLD = 500;

// ============================================================
// GeoSuggestBanner
// Frosted-glass banner — top-right, just below the navbar.
// Auto-switches from light (over hero) to dark (over content).
// ============================================================

export function GeoSuggestBanner() {
  const pathname = usePathname();
  const [suggestedMarket, setSuggestedMarket] = useState<MarketCode | null>(null);
  const [visible, setVisible] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (getCookie(DISMISSED_KEY) || getCookie(PREF_KEY)) return;

    const geoMarket = getVisitorMarketFromCookie();
    if (!geoMarket) return;

    const currentMarket = marketFromPath(pathname);
    if (geoMarket === currentMarket) return;

    setSuggestedMarket(geoMarket);
    const timer = setTimeout(() => setVisible(true), 1500);
    return () => clearTimeout(timer);
  }, [pathname]);

  // ── Scroll listener for adaptive color scheme ──────────────
  const handleScroll = useCallback(() => {
    setIsDark(window.scrollY > DARK_SCROLL_THRESHOLD);
  }, []);

  useEffect(() => {
    if (!visible) return;
    handleScroll(); // set initial state
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [visible, handleScroll]);

  const handleSwitch = () => {
    if (!suggestedMarket) return;
    setCookie(PREF_KEY, suggestedMarket, 30);
    const currentMarket = marketFromPath(pathname);
    // All markets use /{market}/... URL pattern (including US)
    const newPath = pathname.replace(`/${currentMarket}`, `/${suggestedMarket}`) || `/${suggestedMarket}`;
    window.location.href = newPath;
  };

  const handleDismiss = () => {
    setVisible(false);
    setCookie(DISMISSED_KEY, '1', 14);
  };

  const handleStay = () => {
    setVisible(false);
    setCookie(PREF_KEY, marketFromPath(pathname), 30);
    setCookie(DISMISSED_KEY, '1', 30);
  };

  if (!suggestedMarket) return null;

  const mc = marketConfig[suggestedMarket];
  const meta = MARKET_META[suggestedMarket];

  // ── Adaptive color tokens ──────────────────────────────────
  const colors = isDark
    ? {
        bg: 'rgba(30, 30, 40, 0.85)',
        border: 'rgba(255,255,255,0.12)',
        shadow: '0 8px 32px rgba(0,0,0,0.25)',
        text: '#ffffff',
        sub: 'rgba(255,255,255,0.55)',
        btnBg: 'rgba(255,255,255,0.12)',
        btnBorder: 'rgba(255,255,255,0.25)',
        btnHoverBg: 'rgba(255,255,255,0.2)',
        stayColor: 'rgba(255,255,255,0.45)',
        stayHover: 'rgba(255,255,255,0.8)',
        dismissColor: 'rgba(255,255,255,0.35)',
        dismissHover: 'rgba(255,255,255,0.8)',
      }
    : {
        bg: 'rgba(255,255,255,0.12)',
        border: 'rgba(255,255,255,0.5)',
        shadow: '0 8px 32px rgba(0,0,0,0.15)',
        text: '#ffffff',
        sub: 'rgba(255,255,255,0.6)',
        btnBg: 'rgba(255,255,255,0.15)',
        btnBorder: 'rgba(255,255,255,0.5)',
        btnHoverBg: 'rgba(255,255,255,0.25)',
        stayColor: 'rgba(255,255,255,0.5)',
        stayHover: 'rgba(255,255,255,0.9)',
        dismissColor: 'rgba(255,255,255,0.4)',
        dismissHover: 'rgba(255,255,255,0.9)',
      };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 350 }}
          style={{ position: 'fixed', top: 72, right: 16, zIndex: 50 }}
          className="sm:right-6"
        >
          <div
            className="rounded-xl border overflow-hidden transition-all duration-500"
            style={{
              background: colors.bg,
              borderColor: colors.border,
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              boxShadow: colors.shadow,
            }}
          >
            {/* Content row */}
            <div className="flex items-center gap-3 py-3 pl-4 pr-3">
              {/* Flag */}
              <span
                className="text-3xl sm:text-4xl leading-none block flex-shrink-0"
                style={{ filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.2))' }}
              >
                {mc.flag}
              </span>

              {/* Text */}
              <div className="min-w-0">
                <p
                  className="text-sm font-semibold leading-snug transition-colors duration-500"
                  style={{ color: colors.text, textShadow: isDark ? 'none' : '0 1px 4px rgba(0,0,0,0.3)' }}
                >
                  Visiting from {mc.name}?
                </p>
                <p
                  className="text-[11px] mt-0.5 leading-snug transition-colors duration-500"
                  style={{ color: colors.sub }}
                >
                  {meta.tagline}
                </p>
              </div>

              {/* Switch CTA */}
              <button
                onClick={handleSwitch}
                className="flex-shrink-0 inline-flex items-center gap-1.5 h-9 px-4 text-xs font-semibold rounded-md border transition-all duration-500 hover:scale-[1.03]"
                style={{
                  color: colors.text,
                  background: colors.btnBg,
                  borderColor: colors.btnBorder,
                  backdropFilter: 'blur(4px)',
                  WebkitBackdropFilter: 'blur(4px)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = colors.btnHoverBg;
                  e.currentTarget.style.boxShadow = '0 0 20px rgba(255,255,255,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = colors.btnBg;
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                Switch
                <ArrowRight className="h-3 w-3" />
              </button>

              {/* Stay */}
              <button
                onClick={handleStay}
                className="flex-shrink-0 text-[11px] font-medium transition-colors duration-500"
                style={{ color: colors.stayColor }}
                onMouseEnter={(e) => (e.currentTarget.style.color = colors.stayHover)}
                onMouseLeave={(e) => (e.currentTarget.style.color = colors.stayColor)}
              >
                Stay
              </button>

              {/* Dismiss */}
              <button
                onClick={handleDismiss}
                className="flex-shrink-0 p-1 rounded-md transition-all duration-500"
                style={{ color: colors.dismissColor }}
                onMouseEnter={(e) => (e.currentTarget.style.color = colors.dismissHover)}
                onMouseLeave={(e) => (e.currentTarget.style.color = colors.dismissColor)}
                aria-label="Dismiss location suggestion"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
