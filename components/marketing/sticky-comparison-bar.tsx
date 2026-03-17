'use client';

/**
 * Sticky Comparison Bar — Forbes/NerdWallet-style
 * Fixes to top of viewport on scroll, shows top products with ratings + CTAs
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Star, ArrowRight, Trophy, X } from 'lucide-react';

export interface StickyProduct {
  name: string;
  rating: number;
  price: string;
  affiliateUrl: string;
  badge?: string; // "Best Overall", "Best for Beginners", etc.
}

interface StickyComparisonBarProps {
  products: StickyProduct[];
  /** Scroll distance in px before bar appears (default: 300) */
  threshold?: number;
}

const badgeColors: Record<string, string> = {
  'Best Overall': 'border',
  'Best Value': 'border',
  'Most Popular': 'border',
  'Best for Beginners': 'border',
  'Best for Active Traders': 'border',
};

const badgeStyles: Record<string, { background: string; borderColor: string; color: string }> = {
  'Best Overall': { background: 'rgba(26,107,58,0.06)', borderColor: 'rgba(26,107,58,0.2)', color: 'var(--sfp-green)' },
  'Best Value': { background: 'rgba(27,79,140,0.06)', borderColor: 'rgba(27,79,140,0.2)', color: 'var(--sfp-navy)' },
  'Most Popular': { background: 'rgba(245,166,35,0.06)', borderColor: 'rgba(245,166,35,0.2)', color: 'var(--sfp-gold)' },
  'Best for Beginners': { background: 'rgba(27,79,140,0.06)', borderColor: 'rgba(27,79,140,0.2)', color: 'var(--sfp-navy)' },
  'Best for Active Traders': { background: 'rgba(27,79,140,0.06)', borderColor: 'rgba(27,79,140,0.2)', color: 'var(--sfp-navy)' },
};

export function StickyComparisonBar({
  products,
  threshold = 300,
}: StickyComparisonBarProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (isDismissed) return;

    const handleScroll = () => {
      // Lower threshold on mobile for earlier engagement
      const effectiveThreshold = window.innerWidth < 640 ? 150 : threshold;
      setIsVisible(window.scrollY > effectiveThreshold);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold, isDismissed]);

  if (!products.length || isDismissed) return null;

  return (
    <div
      className={`fixed top-16 left-0 right-0 z-40 transition-all duration-300 ${
        isVisible
          ? 'translate-y-0 opacity-100'
          : '-translate-y-full opacity-0 pointer-events-none'
      }`}
    >
      <div
        className="border-b border-gray-200 shadow-sm"
        style={{ background: 'rgba(255, 255, 255, 0.97)' }}
      >
        <div className="container mx-auto px-4 py-3">
          {/* Mobile: Only #1 product + CTA (persistent, no dismiss) */}
          <div className="flex items-center gap-3 sm:hidden">
            {products.length > 0 && (() => {
              const top = products[0];
              return (
                <>
                  <Trophy className="h-4 w-4 shrink-0" style={{ color: 'var(--sfp-gold)' }} />
                  <span className="text-sm font-semibold truncate" style={{ color: 'var(--sfp-ink)' }}>{top.name}</span>
                  <div className="flex items-center gap-0.5 shrink-0">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3 w-3 ${
                          i < Math.floor(top.rating)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <Link
                    href={top.affiliateUrl}
                    target="_blank"
                    rel="noopener sponsored"
                    className="ml-auto inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all whitespace-nowrap shrink-0"
                    style={{ background: 'var(--sfp-gold)', color: '#ffffff' }}
                  >
                    Visit Site
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </>
              );
            })()}
          </div>

          {/* Desktop: Full comparison row */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="flex-1 overflow-x-auto scrollbar-hide">
              <div className="flex items-center gap-4 min-w-max">
                {products.slice(0, 5).map((product, index) => {
                  const bStyle = product.badge && badgeStyles[product.badge]
                    ? badgeStyles[product.badge]
                    : { background: 'var(--sfp-gray)', borderColor: 'rgba(209,213,219,1)', color: 'var(--sfp-slate)' };

                  return (
                    <div
                      key={product.name}
                      className="flex items-center gap-3"
                    >
                      {/* Rank */}
                      <span
                        className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0 border"
                        style={
                          index === 0
                            ? { background: 'rgba(245,166,35,0.1)', borderColor: 'rgba(245,166,35,0.3)', color: 'var(--sfp-gold)' }
                            : { background: 'var(--sfp-gray)', borderColor: 'rgba(209,213,219,1)', color: 'var(--sfp-slate)' }
                        }
                      >
                        {index + 1}
                      </span>

                      {/* Info */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold whitespace-nowrap" style={{ color: 'var(--sfp-ink)' }}>
                          {product.name}
                        </span>

                        {/* Winner Badge */}
                        {product.badge && (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border"
                            style={bStyle}
                          >
                            {index === 0 && (
                              <Trophy className="h-2.5 w-2.5" />
                            )}
                            {product.badge}
                          </span>
                        )}

                        {/* Stars */}
                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3 w-3 ${
                                i < Math.floor(product.rating)
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>

                        {/* Price */}
                        <span className="text-xs" style={{ color: 'var(--sfp-slate)' }}>
                          {product.price}
                        </span>

                        {/* CTA */}
                        <Link
                          href={product.affiliateUrl}
                          target="_blank"
                          rel="noopener sponsored"
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium text-white transition-colors whitespace-nowrap"
                          style={{ background: 'var(--sfp-gold)', color: '#ffffff' }}
                        >
                          Visit Site
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>

                      {/* Divider between products */}
                      {index < products.slice(0, 5).length - 1 && (
                        <div className="w-px h-8 bg-gray-200 mx-1" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Dismiss — desktop only */}
            <button
              onClick={() => setIsDismissed(true)}
              className="p-1.5 rounded-md transition-colors shrink-0 hover:bg-gray-100"
              style={{ color: 'var(--sfp-slate)' }}
              aria-label="Close comparison bar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
