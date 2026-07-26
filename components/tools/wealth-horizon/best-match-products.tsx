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

import { ArrowRight, Check } from 'lucide-react';
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
      {/* Heading row: title left, small "Advertiser disclosure" mention right
          (FTC "clear & conspicuous BEFORE the links" — the full compact text
          sits right below the cards, anchored). */}
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="t-h2 m-0 text-[22px] font-semibold leading-[28px] text-[var(--sfp-ink)]">
          Best matches for your retirement plan
        </h2>
        <a
          href="#wh-affiliate-disclosure"
          className="text-xs font-medium text-[var(--sfp-slate)] underline decoration-dotted underline-offset-2"
        >
          Advertiser disclosure
        </a>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product, i) => (
          <div
            key={product.href}
            data-testid="product-card"
            className="group flex flex-col gap-3 rounded-[14px] border border-[var(--tool-border)] bg-[var(--tool-surface)] p-5 transition-colors duration-200 hover:border-[var(--sfp-navy)]"
            style={{ boxShadow: 'var(--tool-shadow)' }}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-[16px] font-semibold leading-snug text-[var(--sfp-ink)]">{product.name}</span>
              {i === 0 ? (
                <span
                  className="whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold"
                  style={{
                    background: 'color-mix(in srgb, var(--sfp-gold) 14%, transparent)',
                    color: 'var(--sfp-warning-foreground)',
                  }}
                >
                  Top match
                </span>
              ) : null}
            </div>
            <p className="m-0 text-[13px] leading-5 text-[var(--sfp-slate)]">{product.blurb}</p>
            <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
              {product.highlights.map((h) => (
                <li key={h} className="flex items-center gap-2 text-[13px] text-[var(--sfp-ink)]">
                  <Check className="h-3.5 w-3.5 flex-none text-[var(--sfp-green)]" aria-hidden="true" />
                  {h}
                </li>
              ))}
            </ul>
            <a
              href={product.href}
              target={product.kind === 'offer' ? '_blank' : undefined}
              rel={product.kind === 'offer' ? 'noopener sponsored' : undefined}
              onClick={() => onCardClick(product.kind === 'offer' ? 'provider' : 'cockpit', product.href)}
              className="mt-auto inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold no-underline transition-colors duration-200"
              // color inline: die globale `article a`-Farbregel überstimmt
              // sonst .text-white → goldene Schrift auf Gold = unsichtbar
              // (User-Screenshot-Befund 14.07.).
              style={{ background: 'var(--sfp-gold)', color: '#fff', textDecoration: 'none' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--sfp-gold-dark)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--sfp-gold)'; }}
            >
              {product.cta}
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
            </a>
          </div>
        ))}
      </div>

      <div id="wh-affiliate-disclosure">
        <AffiliateDisclosure market={market} variant="compact" className="m-0" />
      </div>
    </div>
  );
}
