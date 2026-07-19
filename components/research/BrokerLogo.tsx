// components/research/BrokerLogo.tsx
// Research Library — real provider logo for the Research Dossier card's brand
// row. Server Component: filesystem-checked (same fs.existsSync idiom as
// components/reviews/review-sidebar.tsx's resolveLogoSrc) so a slug without a
// runtime asset falls back to the defensive monogram instead of ever
// rendering a guessed src that 404s — no client JS required either way.
//
// Runtime assets live at public/images/brokers/research/display/<slug>.webp.
// They are TIGHT-CROPPED (transparent margin trimmed — see
// scripts/research/normalize-logos.mjs), so each glyph fills ~100% of its own
// asset and every logo therefore has a DIFFERENT aspect ratio. Intrinsic
// dimensions come from the generated components/research/logo-dims.ts manifest
// (hard-coding one canvas ratio would distort them). Display size is a pure
// function of the CSS slot below: a fixed HEIGHT plus a MAX-WIDTH, with
// object-contain — a compact mark (e.g. Schwab) fills the slot height; a very
// wide wordmark (e.g. Interactive Brokers) is bounded by max-width and sits a
// touch shorter, object-left aligned. This is why trimming was necessary: on
// the old padded canvas a 44px slot rendered a ~24px glyph.

import type { CSSProperties } from 'react';
import fs from 'fs';
import path from 'path';
import Image from 'next/image';
import { LOGO_DIMS } from './logo-dims';

export interface BrokerLogoProps {
  slug: string;
  displayName: string;
  /** Defensive fallback glyph — only rendered if the slug has no logo file. */
  initial: string;
  /** Which card the logo sits in — drives the responsive slot size. */
  variant?: 'standard' | 'featured';
  className?: string;
}

/** Responsive display slot per variant: fixed height + max-width, in px,
 *  [mobile, >=sm]. Standard cards carry a score module beside the logo, so
 *  their mobile max-width is tighter to keep the name off the score on a 375px
 *  screen; the featured brand row has no score (it lives in the navy panel),
 *  so its logo can run larger. */
const LOGO_SLOTS = {
  standard: { h: 38, hLg: 48, mw: 118, mwLg: 185 },
  featured: { h: 50, hLg: 62, mw: 150, mwLg: 230 },
} as const;

function logoAssetExists(slug: string): boolean {
  try {
    return fs.existsSync(
      path.join(process.cwd(), 'public', 'images', 'brokers', 'research', 'display', `${slug}.webp`),
    );
  } catch {
    // Fails closed to the monogram fallback — never throws from a render path.
    return false;
  }
}

export function BrokerLogo({ slug, displayName, initial, variant = 'standard', className }: BrokerLogoProps) {
  const slot = LOGO_SLOTS[variant];
  const slotVars = {
    ['--logo-h']: `${slot.h}px`,
    ['--logo-h-lg']: `${slot.hLg}px`,
    ['--logo-mw']: `${slot.mw}px`,
    ['--logo-mw-lg']: `${slot.mwLg}px`,
  } as CSSProperties;

  const dim = LOGO_DIMS[slug];
  if (dim && logoAssetExists(slug)) {
    return (
      <span
        className={`inline-flex flex-shrink-0 items-center h-[var(--logo-h)] sm:h-[var(--logo-h-lg)] max-w-[var(--logo-mw)] sm:max-w-[var(--logo-mw-lg)] ${className ?? ''}`}
        style={slotVars}
      >
        <Image
          src={`/images/brokers/research/display/${slug}.webp`}
          alt={displayName}
          width={dim.w}
          height={dim.h}
          // These are already hand-optimised, lossless, tight-cropped WebP
          // wordmarks — the Next image optimiser adds nothing and its dev cache
          // would keep serving a stale pre-trim aspect ratio. Serve the raw file.
          unoptimized
          // h-full pins the slot height; w-auto keeps aspect (silences the
          // next/image one-dimension warning); max-w-full + object-contain lets
          // a very wide wordmark letterbox within the slot instead of overflowing.
          className="h-full w-auto max-w-full object-contain object-left"
        />
      </span>
    );
  }

  // Defensive fallback — the monogram, ONLY used if a logo file is ever missing
  // for a slug (per-task guarantee: all 9 current products have one).
  return (
    <span
      aria-hidden="true"
      className={`inline-flex aspect-square flex-shrink-0 items-center justify-center rounded-lg font-bold text-white h-[var(--logo-h)] sm:h-[var(--logo-h-lg)] ${className ?? ''}`}
      style={{ ...slotVars, background: 'var(--sfp-navy)', fontSize: Math.round(slot.h * 0.42) }}
    >
      {initial}
    </span>
  );
}
