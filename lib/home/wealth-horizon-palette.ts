// lib/home/wealth-horizon-palette.ts
// Per-market colour palette for the homepage "Wealth Horizon" featured card.
// Plain (server-safe) module — no 'use client' — so BOTH the client card
// component and the server homepage (for the flush banderole gradient) can
// import the same source of truth. Each market is oriented to the LOWER band
// of that market's hero photo, where the card straddles the hero's bottom edge.

import type { ToolMarket } from '@/lib/tools/registry/types';

export interface WHPalette {
  /** deepest body tone (gradient mid-bottom) + hairline/melt anchor */
  abyssRgb: string;
  /** gradient top / photo-melt upper-mid tone */
  depthRgb: string;
  /** top-left radial highlight ("light source" of the card) */
  liftRgb: string;
  /** darkest bottom gradient stop + drop-shadow tint */
  bottomRgb: string;
  /** bottom-right ambient glow */
  glowRgb: string;
  /** photo tint hue (between abyss and depth) — seam-free astronaut blend */
  midRgb: string;
  /** secondary body text (hue-matched so it never looks lavender/off-cast) */
  textLo: string;
  /** micro trust line text */
  textMicro: string;
  /** eyebrow text + dash — champagne on cool markets; a lighter cream-gold on
   *  the warm markets, where champagne-on-bronze would sit too close in hue
   *  to the lift highlight. The CTA champagne tokens are NOT affected. */
  eyebrow: string;
}

export const PALETTES: Record<ToolMarket, WHPalette> = {
  us: {
    // Oriented to the LOWER hero band (shadowed granite valley) — a deep,
    // desaturated blue-slate rather than the bright sky blue.
    abyssRgb: '26, 36, 48', // #1A2430
    depthRgb: '38, 52, 67', // #263443
    liftRgb: '62, 87, 110', // #3E576E — muted slate highlight
    bottomRgb: '18, 25, 31', // #12191F
    glowRgb: '53, 72, 92', // #35485C
    midRgb: '34, 48, 61', // #22303D
    textLo: '#C3CDD8',
    textMicro: '#93A2B2',
    eyebrow: '#D8B36B',
  },
  uk: {
    // Oriented to the LOWER hero band (sunlit clifftop grass), not the orange
    // sunset sky — a deep, muted olive-green where the card straddles.
    abyssRgb: '27, 36, 22', // #1B2416
    depthRgb: '46, 61, 34', // #2E3D22
    liftRgb: '85, 112, 60', // #55703C — grass-green highlight
    bottomRgb: '18, 26, 15', // #121A0F
    glowRgb: '74, 98, 52', // #4A6234
    midRgb: '40, 53, 24', // #283518
    textLo: '#D0D6BE',
    textMicro: '#A6B08C',
    eyebrow: '#D8B36B',
  },
  ca: {
    // Oriented to the LOWER hero band (turquoise lake + forest) — a deep
    // teal-green anchored on the sampled lake teal #0D6578.
    abyssRgb: '11, 42, 44', // #0B2A2C
    depthRgb: '18, 70, 74', // #12464A
    liftRgb: '25, 108, 122', // #196C7A — near sampled lake #0D6578
    bottomRgb: '6, 28, 30', // #061C1E
    glowRgb: '22, 92, 104', // #165C68
    midRgb: '13, 56, 60', // #0D383C
    textLo: '#BAD5D3',
    textMicro: '#8DB0AE',
    eyebrow: '#D8B36B',
  },
  au: {
    // Oriented to the LOWER hero band (warm red coastal rock/earth) — a deep
    // terracotta/rust rather than the golden sand of the upper frame.
    abyssRgb: '43, 26, 14', // #2B1A0E
    depthRgb: '72, 44, 22', // #482C16
    liftRgb: '131, 68, 32', // #834420 — rust/terracotta (near sampled #823C0C)
    bottomRgb: '28, 17, 8', // #1C1108
    glowRgb: '110, 58, 26', // #6E3A1A
    midRgb: '59, 36, 18', // #3B2412
    textLo: '#E6D0B8',
    textMicro: '#C4A587',
    eyebrow: '#EFD9B0',
  },
};

/** Per-market banderole gradient (card depth → lift), so the flush band below
 *  the hero reads as the same colour family as the featured card. */
export function whBandGradient(market: ToolMarket): string {
  const p = PALETTES[market] ?? PALETTES.us;
  return `linear-gradient(to bottom, rgb(${p.depthRgb}), rgb(${p.liftRgb}))`;
}
