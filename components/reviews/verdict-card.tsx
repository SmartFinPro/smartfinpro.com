// components/reviews/verdict-card.tsx — V2 "Our Verdict" + BEST-X Score card (T8)
// ============================================================
// Server Component. Renders the Betreiber-Konzept §7 contract: a
// two-column card (desktop) — left "Our Verdict" (hand-verified prose,
// Georgia), right BestXScore (score/10, band label, rank phrase, the
// mandatory methodology sentence). Border, not shadow; radius 16-20px; no
// table, no donut/radial chart.
//
// Null-degradation (plan Pflicht, tested in
// __tests__/unit/verdict-card.test.ts): `position === null` means the
// product isn't in an audited cockpit field yet. The right BestXScore panel
// is entirely omitted — never backfilled from a frontmatter `rating` (T0d
// forbids that substitution) — and the card continues single-column with
// only the verdict prose.
//
// Source-of-truth (T0d): `verdict` is hand-verified frontmatter
// (lib/reviews/verdict-frontmatter.ts) — never DB `best_for`/`pros`/`cons`/
// `deep_dive`. `position` (score/rank) is the T0b-audited cockpit row —
// never frontmatter `rating`.
//
// Above-the-fold word budget (Konzept §7.4, 300-380 words total) is
// enforced upstream by the verdict-frontmatter Zod schema's per-field word
// counts, not by truncating here.
// ============================================================

import Link from 'next/link';
import type { VerdictBlock } from '@/lib/reviews/verdict-frontmatter';
import type { DecisionBridgeData } from '@/lib/comparison/types';
import { scoreLabel, rankPhrase } from '@/lib/reviews/score-label';
import { ScoreBreakdown } from './score-breakdown';

/** The audited cockpit position for the reviewed product — same shape as
 *  DecisionBridgeData['position'], reused rather than redefined. */
export type ReviewPosition = NonNullable<DecisionBridgeData['position']>;

export interface VerdictCardProps {
  verdict: VerdictBlock;
  /**
   * Resolved internal review link for verdict.bestAlternative, or
   * null/undefined when that competitor has no review yet — rendered as
   * plain text, never a dead link (same convention as
   * DecisionBridgeFieldRow.reviewHref in lib/comparison/types.ts).
   */
  bestAlternativeHref?: string | null;
  /** Audited cockpit position (T0b) — null when the product isn't in this field yet. */
  position: ReviewPosition | null;
  /** Total field size — required to phrase `position`'s rank; ignored when `position` is null. */
  fieldCount: number;
  /** Defaults to '/methodology' — the same target decision-bridge.tsx's "How we score" link uses. */
  scoreHref?: string;
}

export function VerdictCard({
  verdict,
  bestAlternativeHref,
  position,
  fieldCount,
  scoreHref = '/methodology',
}: VerdictCardProps) {
  const topStrengths = verdict.topStrengths.slice(0, 3);

  return (
    <div
      className={position ? 'grid gap-8 md:grid-cols-[minmax(0,1fr)_260px]' : ''}
      style={{
        border: '1px solid var(--sfp-hairline-strong)',
        borderRadius: '18px',
        padding: '28px 30px',
        background: '#fff',
      }}
    >
      <div>
        <div
          style={{
            fontFamily: 'var(--font-primary)',
            fontSize: '10.5px',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--sfp-slate)',
            fontWeight: 600,
            marginBottom: '10px',
          }}
        >
          Our Verdict
        </div>

        <p
          style={{
            fontFamily: 'var(--font-secondary)',
            fontSize: '16.5px',
            lineHeight: 1.7,
            color: 'var(--sfp-ink)',
            margin: '0 0 18px',
          }}
        >
          {verdict.summary}
        </p>

        {topStrengths.length > 0 && (
          <ul
            style={{
              listStyle: 'none',
              margin: '0 0 16px',
              padding: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            {topStrengths.map((strength, i) => (
              <li
                key={`${i}-${strength}`}
                style={{
                  display: 'flex',
                  gap: '8px',
                  fontFamily: 'var(--font-primary)',
                  fontSize: '14px',
                  lineHeight: 1.5,
                  color: 'var(--sfp-ink)',
                }}
              >
                <span aria-hidden="true" style={{ color: 'var(--sfp-green)', fontWeight: 700 }}>
                  ✓
                </span>
                {strength}
              </li>
            ))}
          </ul>
        )}

        <div
          style={{
            display: 'flex',
            gap: '8px',
            fontFamily: 'var(--font-primary)',
            fontSize: '14px',
            lineHeight: 1.5,
            color: 'var(--sfp-ink)',
            marginBottom: '14px',
          }}
        >
          <span aria-hidden="true" style={{ color: 'var(--sfp-red)', fontWeight: 700 }}>
            −
          </span>
          <span>
            <strong style={{ fontWeight: 600 }}>Main limitation:</strong> {verdict.mainLimitation}
          </span>
        </div>

        {verdict.bestAlternative && (
          <p
            style={{
              fontFamily: 'var(--font-primary)',
              fontSize: '13.5px',
              lineHeight: 1.5,
              color: 'var(--sfp-slate)',
              margin: 0,
            }}
          >
            Best alternative:{' '}
            {bestAlternativeHref ? (
              <Link
                href={bestAlternativeHref}
                style={{ color: 'var(--sfp-navy)', textDecoration: 'none', borderBottom: '1px solid var(--sfp-hairline)' }}
              >
                {verdict.bestAlternative.name}
              </Link>
            ) : (
              <strong style={{ color: 'var(--sfp-ink)', fontWeight: 600 }}>{verdict.bestAlternative.name}</strong>
            )}
            {' — '}
            {verdict.bestAlternative.reason}
          </p>
        )}
      </div>

      {position && <BestXScore position={position} fieldCount={fieldCount} scoreHref={scoreHref} />}
    </div>
  );
}

// The unified compact score card (Betreiber-Wunsch 2026-07-19: "kompakter,
// premium enterprise"): headline number, band + rank on ONE line, the
// sub-score minibars (formerly a separate full-width zone under the card)
// hairline-separated inside the same rail, methodology sentence last. One
// coherent score surface instead of two disconnected ones.
function BestXScore({
  position,
  fieldCount,
  scoreHref,
}: {
  position: ReviewPosition;
  fieldCount: number;
  scoreHref: string;
}) {
  return (
    <div
      className="mt-6 border-t pt-6 md:mt-0 md:border-t-0 md:border-l md:pl-8 md:pt-0"
      style={{ borderColor: 'var(--sfp-hairline)', fontFamily: 'var(--font-primary)' }}
    >
      <div
        style={{
          fontVariantNumeric: 'tabular-nums',
          fontSize: 'clamp(34px, 4vw, 40px)',
          fontWeight: 700,
          color: 'var(--sfp-ink)',
          letterSpacing: '-0.02em',
          lineHeight: 1,
        }}
      >
        {position.score.toFixed(1)}
        <span style={{ fontSize: '17px', fontWeight: 400, color: 'var(--sfp-slate)' }}>/10</span>
      </div>
      <div style={{ fontSize: '12.5px', margin: '7px 0 0', lineHeight: 1.4 }}>
        <span style={{ fontWeight: 600, color: 'var(--sfp-navy)' }}>{scoreLabel(position.score)}</span>
        <span style={{ color: 'var(--sfp-slate)' }}> · {rankPhrase(position.rank, fieldCount)}</span>
      </div>
      {/* Divider-wrapper only when the breakdown actually renders — an empty
          subScores object must not leave an orphan hairline (ScoreBreakdown's
          own null-degradation contract, mirrored here for the wrapper). */}
      {position.subScores &&
        Object.values(position.subScores).some((v) => typeof v === 'number' && Number.isFinite(v)) && (
          <div
            style={{
              margin: '14px 0',
              borderTop: '1px solid var(--sfp-hairline-row)',
              paddingTop: '14px',
            }}
          >
            <ScoreBreakdown subScores={position.subScores} />
          </div>
        )}
      {/* margin-top collapses with the divider-wrapper's margin-bottom (block
          context), so the gap stays 14px with OR without the breakdown. */}
      <p style={{ fontSize: '11px', lineHeight: 1.5, color: 'var(--sfp-slate)', margin: '14px 0 0' }}>
        Calculated from verified data points from official sources. Commercial relationships do not
        affect the score. <Link href={scoreHref} style={{ color: 'var(--sfp-navy)' }}>How we score</Link>
      </p>
    </div>
  );
}
