'use client';

/**
 * FrictionlessCTA — End-of-page CTA with psychological triggers
 *
 * Usage in MDX:
 *   <FrictionlessCTA productName="eToro" affiliateUrl="/go/etoro" />
 *   <FrictionlessCTA
 *     productName="Wealthsimple"
 *     affiliateUrl="/go/wealthsimple"
 *     headline="Start Investing Today"
 *     socialProof="Join 2M+ Canadian investors"
 *     trustSignals={["No fees on stocks", "Free account", "Regulated by CIRO"]}
 *   />
 */

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useCTATracking } from '@/lib/hooks/use-component-tracking';
import {
  ArrowRight,
  CheckCircle,
  Shield,
  Users,
  Sparkles,
} from 'lucide-react';

interface FrictionlessCTAProps {
  productName: string;
  affiliateUrl: string;
  headline?: string;
  socialProof?: string;
  trustSignals?: string[];
  market?: string;
  reviewUrl?: string;
}

export function FrictionlessCTA({
  productName,
  affiliateUrl,
  headline = 'Ready to Get Started?',
  socialProof,
  trustSignals = ['No credit card required', 'Cancel anytime', 'Free to try'],
  reviewUrl,
}: FrictionlessCTAProps) {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { trackImpression, trackClick } = useCTATracking('frictionless');
  const impressionFired = useRef(false);

  // Animated counter for social proof
  useEffect(() => {
    if (!socialProof || !isVisible) return;

    // Extract number from social proof string, e.g. "Join 10,000+ investors" → 10000
    const match = socialProof.match(/([\d,]+)/);
    if (!match) return;

    const target = parseInt(match[1].replace(/,/g, ''), 10);
    if (isNaN(target) || target === 0) return;

    const duration = 1500; // ms
    const steps = 30;
    const stepTime = duration / steps;
    let current = 0;
    const increment = target / steps;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [socialProof, isVisible]);

  // Intersection observer for entrance animation
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Track CTA impression when visible
  useEffect(() => {
    if (isVisible && !impressionFired.current) {
      impressionFired.current = true;
      trackImpression();
    }
  }, [isVisible, trackImpression]);

  // Format the social proof string with animated count
  const formattedSocialProof = socialProof
    ? socialProof.replace(
        /([\d,]+)/,
        count > 0 ? count.toLocaleString('en-US') : '0',
      )
    : null;

  const todayStr = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div ref={ref} className="my-12">
      <section
        className={`relative overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all duration-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
        style={{ boxShadow: '0 4px 24px rgba(27, 79, 140, 0.08)' }}
      >
        <div className="relative z-10 px-8 py-12 md:px-16 md:py-16 text-center">
          {/* Headline */}
          <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: 'var(--sfp-ink)' }}>
            {headline}
          </h2>

          {/* Social Proof */}
          {formattedSocialProof && (
            <div className="flex items-center justify-center gap-2 mb-6">
              <Users className="h-5 w-5" style={{ color: 'var(--sfp-green)' }} />
              <span className="text-lg font-semibold" style={{ color: 'var(--sfp-green)' }}>
                {formattedSocialProof}
              </span>
            </div>
          )}

          {/* Trust Signals */}
          {trustSignals.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
              {trustSignals.map((signal) => (
                <span
                  key={signal}
                  className="flex items-center gap-2 text-sm"
                  style={{ color: 'var(--sfp-slate)' }}
                >
                  <CheckCircle className="h-4 w-4 shrink-0" style={{ color: 'var(--sfp-green)' }} />
                  {signal}
                </span>
              ))}
            </div>
          )}

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
            <Link
              href={affiliateUrl}
              target="_blank"
              rel="noopener sponsored"
              onClick={() => trackClick(affiliateUrl)}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-lg font-bold text-white shadow-md transition-all hover:shadow-lg hover:scale-105"
              style={{ background: 'var(--sfp-gold)', color: '#ffffff' }}
            >
              <Sparkles className="h-5 w-5" />
              Try {productName} Free
              <ArrowRight className="h-5 w-5" />
            </Link>

            {reviewUrl && (
              <Link
                href={reviewUrl}
                className="inline-flex items-center gap-2 text-sm transition-colors"
                style={{ color: 'var(--sfp-navy)' }}
              >
                Read full review
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>

          {/* Trust Badges Row */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-4">
            <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--sfp-slate)' }}>
              <Shield className="h-3.5 w-3.5" style={{ color: 'var(--sfp-navy)' }} />
              Regulated
            </span>
            <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--sfp-slate)' }}>
              <Shield className="h-3.5 w-3.5" style={{ color: 'var(--sfp-green)' }} />
              256-bit Secure
            </span>
            <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--sfp-slate)' }}>
              <CheckCircle className="h-3.5 w-3.5" style={{ color: 'var(--sfp-gold)' }} />
              Free Account
            </span>
          </div>

          {/* Update date */}
          <p className="text-xs" style={{ color: 'var(--sfp-slate)' }}>Updated {todayStr}</p>
        </div>
      </section>
    </div>
  );
}
