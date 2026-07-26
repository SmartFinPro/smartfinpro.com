// lib/reviews/callout-style.ts — the one look every review callout uses
// ============================================================
// A review page carries several short, set-apart passages: the opening verdict
// summary, a one-line verdict at the head of each MDX section, the editorial
// aside (`<SmartFinProTake>`), and the Market Check conclusion in the sidebar.
// They say different things but they are the same KIND of thing, so they must
// look the same. They did not: three different backgrounds, two typefaces and
// four sizes had accumulated across the components that render them, which is
// what made the page look unsettled.
//
// The look is defined here, once, and imported by every one of them. A plain
// data module (no JSX, no 'use client') so both Server Components
// (verdict-card) and client ones (section-blocks, decision-bridge) can share
// it without pulling each other into the wrong module graph.
//
// The visual is taken from SmartFinProTake, which the operator picked as the
// reference: --sfp-sky panel, 2px navy edge, serif. Note --sfp-sky, not
// --sfp-gray — the tint is what separates a callout from a plain grey card,
// and the serif is what separates an editorial judgement from running text.
// Colour contrast: --sfp-ink on --sfp-sky is ~14:1, well clear of AA.
// ============================================================

import type { CSSProperties } from 'react';

/**
 * Article-column callouts. 18px matches the running text set by
 * review-layout-v2 — a highlighted passage must never render smaller than the
 * paragraphs around it, which inverts the emphasis.
 */
export const CALLOUT_ARTICLE: CSSProperties = {
  background: 'var(--sfp-sky)',
  borderLeft: '2px solid var(--sfp-navy)',
  padding: '14px 16px',
  fontFamily: 'var(--font-secondary)',
  fontSize: '18px',
  lineHeight: 1.6,
  color: 'var(--sfp-ink)',
};

/**
 * Same identity at sidebar scale. The rail is roughly a third of the article
 * column, where 18px would break to about 25 characters a line — so the SIZE
 * is contextual while the panel, the edge and the typeface are not.
 */
export const CALLOUT_RAIL: CSSProperties = {
  background: 'var(--sfp-sky)',
  borderLeft: '2px solid var(--sfp-navy)',
  padding: '11px 13px',
  fontFamily: 'var(--font-secondary)',
  fontSize: '14px',
  lineHeight: 1.55,
  color: 'var(--sfp-ink)',
};

/**
 * The one section-eyebrow every zone of the verdict card uses: "Best for",
 * "Not for", "Main limitation", "Score Breakdown", "Essential Facts"
 * (operator, 2026-07-26). Two conventions had accumulated — the first two
 * in the article serif at sentence case, the rest in this uppercase-tracked
 * sans — which read as two different label languages in one card. This is
 * the sans, uppercase-tracked one; it wins because it was already the
 * majority convention (Score Breakdown + Essential Facts).
 */
export const SECTION_LABEL: CSSProperties = {
  fontSize: '10px',
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--sfp-slate)',
  fontWeight: 600,
  marginBottom: '10px',
};
