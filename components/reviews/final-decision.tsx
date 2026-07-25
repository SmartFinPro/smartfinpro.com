// components/reviews/final-decision.tsx — V2 "Final Decision" layout zone (T12)
// ============================================================
// Server Component. Downstream layout zone — NOT one of the 7
// REVIEW_V2_ANCHORS nav entries (T0a: Final Decision/Methodology/FAQ are
// deliberately nav-less).
//
// Heading is literally "Final Decision" — never "Recommendation" (plan
// Integritäts-Adaptionen table, row 4: SmartFinPro makes no personalized
// recommendation to any individual reader).
//
// Source-of-truth (T0d): `finalDecision` is hand-verified frontmatter
// (lib/reviews/verdict-frontmatter.ts, 80-140 words, word-count-validated at
// the schema layer, not here).
//
// "Choose X if / Choose Y instead if" pairs — REMOVED (2026-07-25, external
// design audit). The pairs were derived, on purpose, from fields that were
// already audited and already rendered elsewhere: `verdict.bestFor` (the list
// VerdictCard/BestForNotFor shows) and each `alternatives[].whyInstead` (the
// field alternatives-section.tsx shows). That kept the component free of
// invented prose — at the cost of saying everything twice. Measured on the
// built page: `bestFor` appeared 2x, every `whyInstead` 3x. This section is
// now what its heading promises — the closing judgement and one way onward:
// H2 → prose → CTA.
//
// The gold "compare" CTA is likewise gone from most pages: AlternativesSection
// ends with the identical button pointing at the identical cockpit href, one
// section above, and the two rendered ~5px apart. The layout now passes
// `compareHref` only when there is no Alternatives section to carry it (see
// review-layout-v2.tsx) — so a review without alternatives keeps its compare
// route, and the prop contract here is unchanged.
// ============================================================

import Link from 'next/link';
import { BUTTON_COMPARE, BUTTON_VISIT, AFFILIATE_LINK_TEXT } from './button-style';

export interface FinalDecisionProps {
  productName: string;
  /** 80-140 words — verdict-frontmatter.ts VerdictFrontmatterSchema.finalDecision. */
  finalDecision: string;
  /** Primary CTA — the editorial cockpit compare link. Omitted when absent, and the layout omits it whenever AlternativesSection already carries the same link (see file header). */
  compareHref?: string | null;
  compareLabel?: string;
  /** Secondary CTA — "Visit {productName}". Omitted entirely (Null-Degradation Pflicht: only the editorial CTA remains) when absent. */
  affiliateUrl?: string | null;
}

export function FinalDecision({
  productName,
  finalDecision,
  compareHref,
  compareLabel = 'Compare alternatives',
  affiliateUrl,
}: FinalDecisionProps) {
  const hasCta = Boolean(compareHref) || Boolean(affiliateUrl);

  return (
    <section aria-labelledby="final-decision-heading" style={{ fontFamily: 'var(--font-primary)' }}>
      <h2
        id="final-decision-heading"
        style={{
          fontFamily: 'var(--font-secondary)',
          fontSize: '22px',
          fontWeight: 400,
          letterSpacing: '-0.01em',
          color: 'var(--sfp-ink)',
          margin: '0 0 16px',
        }}
      >
        Final Decision
      </h2>

      <p
        style={{
          fontFamily: 'var(--font-secondary)',
          fontSize: '16.5px',
          lineHeight: 1.7,
          color: 'var(--sfp-ink)',
          margin: '0 0 20px',
        }}
      >
        {finalDecision}
      </p>

      {hasCta && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
          {compareHref && (
            <Link href={compareHref} className={BUTTON_COMPARE}>
              {compareLabel}
            </Link>
          )}
          {affiliateUrl && (
            <a
              href={affiliateUrl}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className={BUTTON_VISIT}
              style={AFFILIATE_LINK_TEXT}
            >
              Visit {productName}
            </a>
          )}
        </div>
      )}
    </section>
  );
}
