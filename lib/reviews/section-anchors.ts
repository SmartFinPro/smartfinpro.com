// lib/reviews/section-anchors.ts — Nav-anchor / zone-ownership matrix (V2 reviews)
// ============================================================
// T0a (2026-07-18 review-redesign V2, Betreiber-Review Rev. 2.1 hardening
// point 2): the review-redesign concept caps V2 review pages at exactly 7
// nav points, with each anchor owned by EITHER the Layout (rendered by a
// fixed component, e.g. VerdictCard) OR the MDX body (rendered by the
// article's own H2s) — never both, to prevent double-rendering.
//
// This matrix used to live only as a markdown table in the plan. That
// drifts: the Nav, the ReviewLayoutV2 zone renderer, and the future
// quality-gate validator would each need their own copy of "which 7
// ids, in which order, owned by whom" and could silently disagree. This
// file is the SINGLE typed source — Nav, Layout, and Validator all import
// REVIEW_V2_ANCHORS (or the derived MDX_ANCHOR_IDS) instead of re-typing
// the list. See docs/superpowers/specs/2026-07-18-etoro-cockpit-audit.md
// and the parent plan's T0a section for the full rationale.
// ============================================================

/** Who renders a given nav anchor's content. */
export type ReviewV2AnchorOwner = 'layout' | 'mdx';

export interface ReviewV2AnchorDef {
  /** Stable id — doubles as the DOM anchor (`#id`) and the MDX H2 heading id for `owner: 'mdx'` entries. */
  id: string;
  /** Human-readable nav label. */
  title: string;
  owner: ReviewV2AnchorOwner;
}

/**
 * The exact, ordered 7-anchor nav matrix for a V2 review page.
 *
 * - `owner: 'layout'` (Verdict, Alternatives) — rendered by a fixed React
 *   component (VerdictCard / AlternativesSection), never by MDX.
 * - `owner: 'mdx'` (Fees, Markets & Tools, Platform Experience,
 *   Safety & Regulation, Support) — rendered by the article's own MDX H2s;
 *   the MDX body must contain exactly these 5 H2 headings, with matching ids.
 *
 * Final Decision, Methodology, and FAQ are deliberately NOT in this list —
 * they are downstream Layout zones without a nav entry (see plan T0a).
 */
export const REVIEW_V2_ANCHORS = [
  { id: 'verdict', title: 'Verdict', owner: 'layout' },
  { id: 'fees', title: 'Fees', owner: 'mdx' },
  { id: 'markets', title: 'Markets & Tools', owner: 'mdx' },
  { id: 'platform', title: 'Platform Experience', owner: 'mdx' },
  { id: 'safety', title: 'Safety & Regulation', owner: 'mdx' },
  { id: 'support', title: 'Support', owner: 'mdx' },
  { id: 'alternatives', title: 'Alternatives', owner: 'layout' },
] as const satisfies readonly ReviewV2AnchorDef[];

/** One entry of {@link REVIEW_V2_ANCHORS}. */
export type ReviewV2Anchor = (typeof REVIEW_V2_ANCHORS)[number];

/** Union of all 7 anchor ids, e.g. `'verdict' | 'fees' | ... | 'alternatives'`. */
export type ReviewV2AnchorId = ReviewV2Anchor['id'];

/** The subset of anchor ids owned by MDX (exactly 5) — the sectionVerdicts key whitelist. */
export type MdxAnchorId = Extract<ReviewV2Anchor, { owner: 'mdx' }>['id'];

/**
 * The 5 mdx-owned anchor ids, derived from {@link REVIEW_V2_ANCHORS} (never
 * hand-typed separately). Used to: (a) assert the MDX body has exactly
 * these 5 H2s, and (b) whitelist `sectionVerdicts` frontmatter keys — see
 * lib/reviews/verdict-frontmatter.ts.
 */
export const MDX_ANCHOR_IDS: readonly MdxAnchorId[] = REVIEW_V2_ANCHORS.filter(
  (anchor): anchor is Extract<ReviewV2Anchor, { owner: 'mdx' }> => anchor.owner === 'mdx'
).map((anchor) => anchor.id);
