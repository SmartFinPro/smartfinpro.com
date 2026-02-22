'use client';

import { useEffect, useState, useRef } from 'react';
import { ArrowRight, X, Shield } from 'lucide-react';

interface StickyFooterCTAProps {
  productName: string;
  affiliateUrl: string;
  ctaText?: string;
  secondaryText?: string;
  showAfterScroll?: number;
  hideNearFooter?: boolean;
  market?: string;
}

const DISMISS_KEY = 'sfp_footer_cta_dismissed';

export function StickyFooterCTA({
  productName,
  affiliateUrl,
  ctaText = 'Get Started',
  secondaryText,
  showAfterScroll = 500,
  hideNearFooter = true,
  market,
}: StickyFooterCTAProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const footerObserverRef = useRef<IntersectionObserver | null>(null);

  // Check dismiss state
  useEffect(() => {
    try {
      if (sessionStorage.getItem(DISMISS_KEY) === 'true') {
        setIsDismissed(true);
      }
    } catch {}
  }, []);

  // Scroll-based visibility
  useEffect(() => {
    if (isDismissed) return;

    const onScroll = () => {
      setIsVisible(window.scrollY > showAfterScroll);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => window.removeEventListener('scroll', onScroll);
  }, [showAfterScroll, isDismissed]);

  // Hide when near footer
  useEffect(() => {
    if (!hideNearFooter || isDismissed) return;

    const footer = document.querySelector('footer');
    if (!footer) return;

    footerObserverRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(false);
        }
      },
      { threshold: 0.1 },
    );

    footerObserverRef.current.observe(footer);
    return () => footerObserverRef.current?.disconnect();
  }, [hideNearFooter, isDismissed]);

  const dismiss = () => {
    setIsDismissed(true);
    setIsVisible(false);
    try {
      sessionStorage.setItem(DISMISS_KEY, 'true');
    } catch {}
  };

  if (isDismissed) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white transition-all duration-500 ${
        isVisible
          ? 'translate-y-0 opacity-100'
          : 'translate-y-full opacity-0 pointer-events-none'
      }`}
      style={{ boxShadow: '0 -4px 20px rgba(27, 79, 140, 0.08)' }}
    >
      <div className="container mx-auto px-4 py-3">
        {/* Desktop Layout */}
        <div className="hidden items-center justify-between sm:flex">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold" style={{ color: 'var(--sfp-ink)' }}>{productName}</span>
            {secondaryText && (
              <>
                <span className="text-gray-300">·</span>
                <span className="text-xs" style={{ color: 'var(--sfp-slate)' }}>{secondaryText}</span>
              </>
            )}
            <span className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--sfp-slate)' }}>
              <Shield className="h-2.5 w-2.5" />
              Affiliate Link
            </span>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={affiliateUrl}
              rel="noopener sponsored"
              className="group flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
              style={{ background: 'var(--sfp-gold)' }}
            >
              {ctaText}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
            {/* Desktop dismiss */}
            <button
              onClick={dismiss}
              className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="flex flex-col gap-2 sm:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold" style={{ color: 'var(--sfp-ink)' }}>{productName}</span>
              {secondaryText && (
                <span className="text-[10px]" style={{ color: 'var(--sfp-slate)' }}>{secondaryText}</span>
              )}
            </div>
            <button
              onClick={dismiss}
              className="shrink-0 rounded p-1 text-gray-400 hover:text-gray-600"
              aria-label="Close"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <a
            href={affiliateUrl}
            rel="noopener sponsored"
            className="group flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg"
            style={{ background: 'var(--sfp-gold)' }}
          >
            {ctaText}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </a>
          <p className="flex items-center justify-center gap-1 text-[9px]" style={{ color: 'var(--sfp-slate)' }}>
            <Shield className="h-2.5 w-2.5" />
            Affiliate Link · Terms Apply
          </p>
        </div>
      </div>
    </div>
  );
}
