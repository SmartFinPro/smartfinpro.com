'use client';
// components/home/wealth-horizon-hero-card.tsx
//
// Compact "Wealth Horizon" astronaut card — ports the approved mobile
// (.wh-v4m) composition from the Fable design mockup
// (wealth-horizon-banner-v4-image.html) into a real component.
//
// Exploratory placement (Task 9 / FDL homepage-magnet spike): rendered as a
// ~390px-wide overlay in the top-right corner of the US homepage Hero only.
// Bespoke navy-card gradients + photo mask/melt are intentionally scoped
// here via a local <style> block — this mirrors the approved "navy card"
// exception in CLAUDE.md (dark/glassmorphism is otherwise forbidden outside
// BOFU protocol pages). No entrance animation: the mockup's default no-JS
// state is the settled end-state, which is what we want for this spike.

import type { CSSProperties } from 'react';
import { getToolEntryHref } from '@/lib/tools/registry';
import type { ToolMarket } from '@/lib/tools/registry/types';

// Per-market card palette lives in a server-safe module so the homepage
// (a Server Component) can derive the flush banderole gradient from the same
// single source of truth. See lib/home/wealth-horizon-palette.ts.
import { PALETTES } from '@/lib/home/wealth-horizon-palette';

interface WealthHorizonHeroCardProps {
  /** Which market's retirement tool to link to — the card is otherwise
   *  identical across markets (copy is currency-neutral: "in today's money").
   *  Each market resolves to its own localized tool + local currency. */
  market: ToolMarket;
  className?: string;
  style?: CSSProperties;
}

/** Fire-and-forget CTA-click tracking via the existing generic endpoint —
 *  same pattern as the other marketing CTAs. `slug`/`market` are per-market. */
function trackClick(slug: string, market: ToolMarket): void {
  try {
    fetch('/api/track-cta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug,
        provider: 'wealth-horizon',
        variant: 'hero_card',
        market,
      }),
      keepalive: true,
    }).catch(() => null);
  } catch { /* non-critical */ }
}

export function WealthHorizonHeroCard({ market, className, style }: WealthHorizonHeroCardProps) {
  // Per-market tool route (US /tools/retirement-calculator, UK /uk/tools/pension-calculator,
  // CA & AU /<m>/tools/retirement-calculator). Resolved from the registry, never hardcoded.
  const href = getToolEntryHref('wealth-horizon', market) ?? '/tools/retirement-calculator';
  // Analytics slug: the path without its leading slash or any query string
  // (TrackCtaSchema allows only [a-z0-9/_-]).
  const slug = href.replace(/^\//, '').replace(/\?.*$/, '');
  const p = PALETTES[market] ?? PALETTES.us;
  // Per-market palette applied as CSS custom properties — the scoped <style>
  // block below only ever references var(--wh-*), so values swap per market
  // while the CSS stays single-source.
  const paletteVars = {
    '--wh-abyss-rgb': p.abyssRgb,
    '--wh-depth-rgb': p.depthRgb,
    '--wh-lift-rgb': p.liftRgb,
    '--wh-bottom-rgb': p.bottomRgb,
    '--wh-glow-rgb': p.glowRgb,
    '--wh-mid-rgb': p.midRgb,
    '--wh-text-lo': p.textLo,
    '--wh-text-micro': p.textMicro,
    '--wh-eyebrow': p.eyebrow,
  } as CSSProperties;
  return (
    <div className={className} style={style}>
      <a
        className="wh-card"
        style={paletteVars}
        href={href}
        onClick={() => trackClick(slug, market)}
        aria-label="Wealth Horizon — build your freedom projection with the retirement calculator"
      >
        <div className="wh-copy">
          <div className="wh-col-a">
            <div className="wh-eyebrow">SmartFinPro · Wealth Horizon</div>
            <h2 className="wh-headline">See when work could become optional.</h2>
            <p className="wh-support">
              Explore how today&rsquo;s choices could shape your retirement income &mdash; in today&rsquo;s money.
            </p>
          </div>
          <div className="wh-col-b">
          {/* The entire card is the link (parent <a>); this pill is a visual
              affordance only, so it is aria-hidden to avoid a duplicate name. */}
          <span className="wh-cta" aria-hidden="true">
            <span>Build my freedom projection</span>
            <span className="arr" aria-hidden="true">
              <svg width="13" height="13" viewBox="0 0 13 13">
                <path
                  d="M2 6.5h8M6.8 3l3.5 3.5L6.8 10"
                  stroke="#163D6E"
                  strokeWidth="1.6"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </span>
          <span className="wh-trust">
            <span className="seg">No signup</span>{' '}
            <span className="dot">·</span>{' '}
            <span className="seg">About 3 minutes</span>{' '}
            <span className="dot">·</span>{' '}
            <span className="seg">Your inputs stay private</span>
          </span>
          </div>
        </div>
        {/* TEST variant: photo area removed — text + CTA only, ~half height.
            (Astronaut Image + .wh-photo/tint/melt temporarily taken out.) */}
      </a>

      <style>{`
        .wh-card {
          /* Per-market RGB triplets (--wh-*-rgb) + text tones arrive via the
             inline style above (PALETTES). Everything below derives from them
             — including hairline, shadows and the photo tint/melt — so the
             whole surface shifts hue together per market. The fallbacks here
             are the US navy family. */
          --wh-abyss: rgb(var(--wh-abyss-rgb, 10, 39, 67));
          --wh-depth: rgb(var(--wh-depth-rgb, 15, 63, 104));
          --wh-lift: rgb(var(--wh-lift-rgb, 25, 104, 166));
          --wh-bottom: rgb(var(--wh-bottom-rgb, 7, 26, 46));
          --wh-champagne: #D8B36B;
          --wh-hairline-out: rgba(var(--wh-abyss-rgb, 10, 39, 67), .55);
          --wh-hairline-in: rgba(232, 240, 251, .16);
          --wh-text-hi: #F4F8FD;

          position: relative;
          display: flex;
          flex-direction: column;
          min-height: 0;
          border-radius: 14px;
          overflow: hidden;
          isolation: isolate;
          border: 1px solid var(--wh-hairline-out);
          box-shadow:
            inset 0 0 0 1px var(--wh-hairline-in),
            0 1px 2px rgba(var(--wh-bottom-rgb, 7, 26, 46), .20),
            0 14px 38px -12px rgba(var(--wh-bottom-rgb, 7, 26, 46), .35);
          background:
            radial-gradient(120% 160% at 18% -18%, var(--wh-lift) 0%, rgba(var(--wh-lift-rgb, 25, 104, 166), 0) 52%),
            radial-gradient(95% 130% at 88% 118%, rgba(var(--wh-glow-rgb, 20, 84, 139), .55) 0%, rgba(var(--wh-glow-rgb, 20, 84, 139), 0) 58%),
            linear-gradient(168deg, var(--wh-depth) 0%, var(--wh-abyss) 62%, var(--wh-bottom) 100%);
          color: var(--wh-text-hi);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          /* The whole card is the link now (single <a>), so nothing inside is
             a separate anchor — clicking anywhere navigates to the tool. */
          text-decoration: none;
          cursor: pointer;
        }
        .wh-card:focus-visible {
          outline: 2px solid var(--sfp-sky, #E8F0FB);
          outline-offset: 3px;
        }
        .wh-card::before {
          content: "";
          position: absolute;
          inset: 7px;
          border-radius: 9px;
          border: 1px solid rgba(232, 240, 251, .09);
          pointer-events: none;
          z-index: 3;
        }
        .wh-copy {
          position: relative;
          z-index: 4;
          padding: 18px 32px;
          display: flex;
          flex-direction: row;      /* wide, flat band: text left, CTA right */
          align-items: center;
          gap: 34px;
        }
        .wh-col-a {
          display: flex;
          flex-direction: column;
          gap: 7px;
          flex: 1 1 auto;
          min-width: 0;
        }
        .wh-col-b {
          display: flex;
          flex-direction: column;
          gap: 9px;
          flex: 0 0 auto;
          width: 272px;
          align-items: stretch;
        }
        .wh-eyebrow {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 10.5px;
          letter-spacing: .22em;
          text-transform: uppercase;
          color: var(--wh-eyebrow, var(--wh-champagne));
          font-weight: 600;
        }
        .wh-eyebrow::before {
          content: "";
          width: 22px;
          height: 1px;
          background: var(--wh-eyebrow, var(--wh-champagne));
          opacity: .8;
          flex: 0 0 auto;
        }
        .wh-headline {
          font-family: "Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", Georgia, "Times New Roman", serif;
          font-size: 20px;
          font-weight: 600;
          line-height: 1.14;
          color: var(--wh-text-hi);
          margin: 0;
        }
        .wh-support {
          font-size: 12.5px;
          line-height: 1.45;
          color: var(--wh-text-lo);
          margin: 0;
        }
        .wh-trust {
          display: block;
          width: 100%;
          font-size: 11px;
          line-height: 1.5;
          color: var(--wh-text-micro);
          letter-spacing: .02em;
        }
        .wh-trust .dot { margin: 0 3px; opacity: .55; }
        .wh-trust .seg { white-space: nowrap; }

        .wh-cta {
          position: relative;
          overflow: hidden;
          display: inline-flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          min-height: 44px;
          width: 100%;
          max-width: 272px;
          padding: 0 7px 0 20px;
          border-radius: 999px;
          background: linear-gradient(180deg, #E3C283 0%, var(--wh-champagne) 45%, #C9A35B 100%);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, .45),
            inset 0 -1px 0 rgba(94, 70, 26, .30),
            0 2px 10px -2px rgba(0, 0, 0, .45);
          color: var(--sfp-navy-dark, #163D6E);
          font-weight: 700;
          font-size: 14px;
          letter-spacing: .01em;
          text-decoration: none;
          cursor: pointer;
          transition: transform .25s ease, box-shadow .25s ease, filter .25s ease;
        }
        .wh-card:hover .wh-cta {
          filter: brightness(1.03);
          transform: translateY(-1px);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, .5), inset 0 -1px 0 rgba(94, 70, 26, .3), 0 6px 18px -4px rgba(0, 0, 0, .5);
        }
        .wh-cta .arr {
          flex: 0 0 auto;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          border: 1px solid rgba(22, 61, 110, .45);
          background: rgba(255, 255, 255, .22);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: transform .3s cubic-bezier(.34,1.4,.5,1), background .25s ease;
        }
        .wh-card:hover .wh-cta .arr { transform: translateX(2px); background: rgba(255, 255, 255, .4); }
        .wh-cta .arr svg { display: block; }
        .wh-cta::after {
          content: "";
          position: absolute;
          inset: -2px;
          pointer-events: none;
          background: linear-gradient(105deg, transparent 42%, rgba(255,255,255,.45) 50%, transparent 58%);
          transform: translateX(-130%);
        }
        .wh-card:hover .wh-cta::after { transform: translateX(130%); transition: transform .9s ease .05s; }

        .wh-photo {
          position: relative;
          inset: auto;
          width: 100%;
          height: 252px;
          margin-top: 2px;
          z-index: 2;
          pointer-events: none;
          overflow: hidden;
          -webkit-mask-image: linear-gradient(180deg, transparent 0%, rgba(0,0,0,.5) 24%, #000 50%);
                  mask-image: linear-gradient(180deg, transparent 0%, rgba(0,0,0,.5) 24%, #000 50%);
        }
        .wh-photo img {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: 50% 44%;
          filter: saturate(.9) brightness(1);
        }
        /* Palette harmony as a NORMAL-blend top-gradient, NOT multiply.
           The card sets isolation:isolate, so a multiply tint would composite
           against the card's own dark body and crush the astronaut to near-black
           (it only looked right on the light mockup page, where the un-isolated
           multiply leaked onto the light backdrop). On the real dark card, a
           subtle normal-blend melt keeps the figure legible while still tying
           the cool photo into the card body. Both layers use the SAME per-market
           hue family as the card body (mid/abyss/depth/bottom vars), so there is
           no color seam where the astronaut fades in — teal melt on CA, warm
           amber melt on UK/AU, navy on US. */
        .wh-photo-tint {
          position: absolute;
          inset: 0;
          z-index: 1;
          background: linear-gradient(180deg,
            rgba(var(--wh-mid-rgb, 14, 53, 86), .55) 0%,
            rgba(var(--wh-mid-rgb, 14, 53, 86), .12) 42%,
            rgba(var(--wh-mid-rgb, 14, 53, 86), 0) 70%);
        }
        .wh-photo-melt {
          position: absolute;
          inset: 0;
          z-index: 2;
          background:
            linear-gradient(180deg,
              rgba(var(--wh-abyss-rgb, 10, 39, 67), .88) 0%,
              rgba(var(--wh-mid-rgb, 14, 53, 86), .38) 28%,
              rgba(var(--wh-depth-rgb, 15, 63, 104), 0) 54%),
            linear-gradient(0deg,
              rgba(var(--wh-bottom-rgb, 7, 26, 46), .34) 0%,
              rgba(var(--wh-bottom-rgb, 7, 26, 46), 0) 24%);
        }

        @media (prefers-reduced-motion: reduce) {
          .wh-cta, .wh-cta .arr, .wh-cta::after { transition: none; }
        }
      `}</style>
    </div>
  );
}

export default WealthHorizonHeroCard;
