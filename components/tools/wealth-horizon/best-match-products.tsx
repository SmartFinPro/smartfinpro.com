'use client';
// components/tools/wealth-horizon/best-match-products.tsx
// Auftrag 3 (User-Direktive 14.07.2026) — "Best matches for your retirement
// plan". Structure/visual anatomy is the Money Leak Scanner's own
// recommendation section (components/tools/money-leak-scanner/
// RecommendationCard.tsx — read-only reference, NOT imported/modified):
// a card row, gold left accent bar, title, one-sentence blurb, a filled
// gold CTA button with an arrow icon, the whole card as one clickable link.
// Money Leak's card additionally shows a per-product savings figure and a
// per-product compliance label — Wealth Horizon's cards have no equivalent
// data for either (no engine-derived savings estimate per product, and the
// disclosure is a single section-level line instead), so those two
// elements are intentionally omitted rather than faked.
//
// Reuses the EXISTING AffiliateDisclosure component
// (components/ui/affiliate-disclosure.tsx) — the same component the Best-X
// cockpit route itself renders — for the one disclosure line above the
// card row, and the existing trackNextAction contract
// (components/tools/shell/next-best-action-cta.tsx's pattern) for the CTA
// click: no new analytics event. kind 'offer' → NextActionKind 'provider';
// kind 'cockpit' → NextActionKind 'cockpit' (fires the existing
// tool_next_action_click → tool_cockpit_cta_click double-log).
//
// SSR note: WEALTH_HORIZON_PRODUCTS is plain per-market data, so this
// section is static — even mounted inside the 'use client'
// WealthHorizonLive island, Next.js still server-renders client components
// for the initial paint, so the cards + disclosure are present in JS-off
// HTML; only the onClick tracking call is client-only behavior.

import { ArrowRight } from 'lucide-react';
import { AffiliateDisclosure } from '@/components/ui/affiliate-disclosure';
import type { ProductCard } from '@/lib/tools/results/wealth-horizon-products';
import type { ToolMarket } from '@/lib/tools/registry/types';
import type { NextActionKind } from '@/lib/analytics/tool-events';

export interface BestMatchProductsProps {
  market: ToolMarket;
  products: ProductCard[];
  onCardClick: (kind: NextActionKind, href: string) => void;
}

export function BestMatchProducts({ market, products, onCardClick }: BestMatchProductsProps) {
  return (
    <div className="flex flex-col gap-4" data-testid="best-match-products">
      <h2 className="t-h2 m-0 text-[22px] font-semibold leading-[28px] text-[var(--sfp-ink)]">
        Best matches for your retirement plan
      </h2>
      <AffiliateDisclosure market={market} position="top" className="m-0" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <a
            key={product.href}
            data-testid="product-card"
            href={product.href}
            target={product.kind === 'offer' ? '_blank' : undefined}
            rel={product.kind === 'offer' ? 'noopener sponsored' : undefined}
            onClick={() => onCardClick(product.kind === 'offer' ? 'provider' : 'cockpit', product.href)}
            className="wh-step-card group relative flex flex-col gap-2 no-underline transition-all hover:shadow-md hover:-translate-y-0.5"
          >
            <span
              aria-hidden="true"
              className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full"
              style={{ background: 'var(--sfp-gold)' }}
            />
            <span className="ml-2 text-[15px] font-bold text-[var(--sfp-ink)]">{product.name}</span>
            <p className="ml-2 m-0 text-[13px] leading-5 text-[var(--sfp-slate)]">{product.blurb}</p>
            <span
              className="ml-2 mt-1 inline-flex w-fit items-center gap-2 rounded-tool-control px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-white transition-transform group-hover:translate-x-0.5"
              style={{ background: 'var(--sfp-gold)' }}
            >
              {product.cta}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
