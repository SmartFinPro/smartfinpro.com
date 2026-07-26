// components/reviews/button-style.ts — the two review CTAs, defined once
// ============================================================
// A V2 review offers the same two actions across responsive and closing
// surfaces: "Compare all N …" (internal, to the cockpit) and "Visit <product>"
// (the affiliate link). The sidebar rendered them as rounded, hoverable
// buttons; the two in-body zones
// (Alternatives, Final Decision) rendered square boxes with no hover and no
// focus ring — the same action in three different shapes. The operator asked
// for the sidebar's design in the body, so it lives here and all three import
// it.
//
// LIVES IN components/, NOT lib/ — deliberately, and this is not a style
// preference. tailwind.config.ts scans pages/, components/ and app/ only. Put
// these strings in lib/ and Tailwind never sees them, so the arbitrary-value
// utilities (rounded-[10px], text-[13.5px], bg-[var(--sfp-blue-bright)]) are
// never generated: the buttons render square, at the inherited size, with a
// transparent background — and nothing in the build warns you. Measured that
// exact failure once already before moving the file here.
//
// CLASSES, NOT INLINE STYLE — the other load-bearing detail. An inline
// `background` (specificity 1,0,0) out-specifies a `hover:bg-…` utility
// (0,2,0), so a colour set inline silently kills its own hover. That is
// precisely why the in-body buttons had none: they set `background` inline.
//
// The one thing that MUST stay inline is the affiliate link's colour: the
// global `a[href^="/go/"]` rule in app/globals.css (gold + underline,
// specificity 0,1,1) beats Tailwind's `text-white`/`no-underline` utilities.
// Hence AFFILIATE_LINK_TEXT below — colour inline, background as a class, so
// the brightness/lift hover survives.
// ============================================================

import type { CSSProperties } from 'react';

/** Shared geometry and typography — identical on both buttons. */
const BASE =
  'inline-block text-center font-semibold no-underline rounded-[10px] px-4 py-[11px] text-[13.5px]';

/**
 * Primary, internal: "Compare all N …". Gold with ink text — the brand's
 * conversion colour, and one of the few places gold carries text: --sfp-ink on
 * --sfp-gold is 8.1:1, well clear of AA, where white on gold would be 2.0:1.
 */
export const BUTTON_COMPARE = `${BASE} bg-[var(--sfp-gold)] text-[var(--sfp-ink)] transition-colors duration-150 hover:bg-[var(--sfp-gold-dark)] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--sfp-navy)]`;

/**
 * Secondary, outbound: "Visit <product>". Brighter blue, with a lift and a
 * brightness step on hover. Pair with AFFILIATE_LINK_TEXT inline — see header.
 */
export const BUTTON_VISIT = `${BASE} bg-[var(--sfp-blue-bright)] shadow-sm transition-all duration-200 hover:brightness-110 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:brightness-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--sfp-blue-bright)]`;

/** Must be applied inline to beat the global affiliate-link rule. */
export const AFFILIATE_LINK_TEXT: CSSProperties = { color: 'white', textDecoration: 'none' };
