'use client';

// components/marketing/cockpit-verdict-cta.tsx
// Client leaf for one Tier-1 verdict pick card. Renders the exact anchor
// markup that previously lived inline in cockpit-content.tsx (classes, hover
// gradient and rel/target behavior unchanged) and adds cockpit_v1 tracking:
// a viewport impression (surface 'verdict') and an immediate-flush
// cockpit_cta_click. Receives only serializable props — safe to render from
// the server component tree. Never preventDefault.

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { Star, ArrowUpRight } from 'lucide-react';
import { trackCockpitEvent, trackCockpitProductImpressionOnce } from '@/lib/analytics/cockpit-tracking';
import type { CockpitCtaMode, CockpitDestinationType } from '@/lib/analytics/cockpit-events';

const BORDER = '#E1E7F0';

export interface CockpitVerdictCtaProps {
  rank: number;
  name: string;
  why: string;
  rating: number;
  reviewCount: number;
  href: string;
  external: boolean;
  ctaLabel: string;
  productSlug: string;
  ctaMode: CockpitCtaMode;
  destinationType: CockpitDestinationType;
  productCtaMode: string;
  isTopPick: boolean;
  market: string;
  category: string;
  topic: string;
}

export function CockpitVerdictCta(p: CockpitVerdictCtaProps) {
  const pathname = usePathname() ?? '/';
  const ref = useRef<HTMLAnchorElement>(null);
  const fired = useRef(false);
  const ctx = { market: p.market, category: p.category, topic: p.topic };

  const propsRef = useRef(p);
  propsRef.current = p;
  const pathRef = useRef(pathname);
  pathRef.current = pathname;

  useEffect(() => {
    const el = ref.current;
    if (!el || fired.current || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !fired.current) {
            fired.current = true;
            const cur = propsRef.current;
            trackCockpitProductImpressionOnce(
              { market: cur.market, category: cur.category, topic: cur.topic },
              pathRef.current,
              {
                productSlug: cur.productSlug,
                providerName: cur.name,
                surface: 'verdict',
                impressionKind: 'viewport',
                rank: cur.rank,
                isTopPick: cur.isTopPick,
                ctaMode: cur.ctaMode,
                destinationType: cur.destinationType,
              },
            );
            observer.disconnect();
          }
        }
      },
      { threshold: 0.35 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <a
      ref={ref}
      href={p.href}
      {...(p.external ? { target: '_blank', rel: 'nofollow sponsored noopener' } : {})}
      onClick={() =>
        trackCockpitEvent(
          ctx,
          pathname,
          'cockpit_cta_click',
          {
            productSlug: p.productSlug,
            providerName: p.name,
            surface: 'verdict',
            ctaPosition: 'primary',
            rank: p.rank,
            ctaMode: p.ctaMode,
            destinationType: p.destinationType,
            productCtaMode: p.productCtaMode,
            isTopPick: p.isTopPick,
          },
          { immediate: true },
        )
      }
      className="group flex flex-col rounded-2xl border bg-white px-4 py-3.5 no-underline shadow-sm transition-all duration-200 hover:border-[rgba(26,107,58,0.25)] hover:bg-[linear-gradient(135deg,#F0F8F3_0%,#E2F0E7_100%)] hover:shadow-md"
      style={{ borderColor: BORDER }}
    >
      <span className="flex flex-wrap items-baseline gap-x-2">
        <span className="text-[15px] font-bold leading-tight text-[color:var(--sfp-ink)]">
          {p.name}
        </span>
        {p.rank === 1 && (
          <span className="rounded bg-[rgba(245,166,35,0.14)] px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.8px] text-[color:var(--sfp-gold-dark)]">
            Top pick
          </span>
        )}
      </span>
      <span className="mt-0.5 block truncate text-[12.5px] leading-snug text-[color:var(--sfp-slate)]">
        {p.why}
      </span>
      <span className="mt-2.5 flex items-center justify-between">
        <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-[color:var(--sfp-ink)]">
          {p.reviewCount === 0 ? (
            <span style={{ fontStyle: 'italic', color: 'var(--sfp-slate)' }}>Not yet rated</span>
          ) : (
            <>
              <Star size={12} aria-hidden="true" style={{ color: 'var(--sfp-gold)' }} /> {p.rating.toFixed(1)}
            </>
          )}
        </span>
        <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-[color:var(--sfp-navy)] transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-[color:var(--sfp-green)]">
          {p.ctaLabel} <ArrowUpRight size={13} aria-hidden="true" />
        </span>
      </span>
    </a>
  );
}
