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
// "Choose X if / Choose Y instead if" pairs — design note (Abweichung,
// flagged explicitly per the plan's "Abweichungen explizit" ask):
// verdict-frontmatter.ts's VerdictFrontmatterSchema (T5, out of scope for
// T12) has no dedicated schema for structured if/then pairs — only a single
// prose `finalDecision` string. Inventing a new frontmatter field here would
// both exceed this task's scope and risk exactly the kind of unaudited,
// components-level copy the Source-of-Truth Matrix (T0d) forbids. Instead,
// this component DERIVES the pairs entirely from fields verdict-
// frontmatter.ts ALREADY validates and this task's sibling component
// already renders: `verdict.bestFor` (already-audited "why this product",
// same list VerdictCard/BestForNotFor show) for the "Choose {productName}
// if" side, and each `alternatives[].whyInstead` (already-audited, the same
// field components/reviews/alternatives-section.tsx uses) for the
// "Choose {name} instead if" side. No new prose is invented anywhere in
// this component.
// ============================================================

import Link from 'next/link';
import type { VerdictBlock, AlternativeEntry } from '@/lib/reviews/verdict-frontmatter';

export interface FinalDecisionProps {
  productName: string;
  /** 80-140 words — verdict-frontmatter.ts VerdictFrontmatterSchema.finalDecision. */
  finalDecision: string;
  /** verdict.bestFor — reused for the "Choose {productName} if" side (see file header). */
  bestFor: VerdictBlock['bestFor'];
  /** Same alternatives array components/reviews/alternatives-section.tsx renders — reused for the "Choose {name} instead if" side. */
  alternatives: AlternativeEntry[];
  /** Primary CTA — the editorial cockpit compare link. Omitted when absent. */
  compareHref?: string | null;
  compareLabel?: string;
  /** Secondary CTA — "Visit {productName}". Omitted entirely (Null-Degradation Pflicht: only the editorial CTA remains) when absent. */
  affiliateUrl?: string | null;
}

export function FinalDecision({
  productName,
  finalDecision,
  bestFor,
  alternatives,
  compareHref,
  compareLabel = 'Compare alternatives',
  affiliateUrl,
}: FinalDecisionProps) {
  const chooseAlternatives = alternatives.slice(0, 3);
  const hasChoosePairs = bestFor.length > 0 || chooseAlternatives.length > 0;
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

      {hasChoosePairs && (
        <div className="grid gap-3 sm:grid-cols-2" style={{ margin: '0 0 24px' }}>
          {bestFor.length > 0 && (
            <div style={{ border: '1px solid var(--sfp-hairline)', borderRadius: '10px', padding: '16px 18px' }}>
              <div
                style={{
                  fontSize: '10.5px',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--sfp-navy)',
                  fontWeight: 700,
                  marginBottom: '8px',
                }}
              >
                Choose {productName} if
              </div>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {bestFor.map((reason, i) => (
                  <li key={`${i}-${reason}`} style={{ fontSize: '13.5px', lineHeight: 1.5, color: 'var(--sfp-ink)' }}>
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {chooseAlternatives.map((alt) => (
            <div key={alt.slug} style={{ border: '1px solid var(--sfp-hairline)', borderRadius: '10px', padding: '16px 18px' }}>
              <div
                style={{
                  fontSize: '10.5px',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--sfp-slate)',
                  fontWeight: 700,
                  marginBottom: '8px',
                }}
              >
                Choose {alt.name} instead if
              </div>
              <p style={{ fontSize: '13.5px', lineHeight: 1.5, color: 'var(--sfp-ink)', margin: 0 }}>{alt.whyInstead}</p>
            </div>
          ))}
        </div>
      )}

      {hasCta && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
          {compareHref && (
            <Link
              href={compareHref}
              style={{
                display: 'inline-block',
                background: 'var(--sfp-gold)',
                color: 'var(--sfp-ink)',
                fontWeight: 600,
                fontSize: '13.5px',
                padding: '9px 16px',
                textDecoration: 'none',
              }}
            >
              {compareLabel}
            </Link>
          )}
          {affiliateUrl && (
            <a
              href={affiliateUrl}
              target="_blank"
              rel="noopener noreferrer nofollow"
              style={{
                display: 'inline-block',
                background: 'transparent',
                color: 'var(--sfp-navy)',
                border: '1px solid var(--sfp-navy)',
                fontWeight: 600,
                fontSize: '13.5px',
                padding: '8px 15px',
                textDecoration: 'none',
              }}
            >
              Visit {productName}
            </a>
          )}
        </div>
      )}
    </section>
  );
}
