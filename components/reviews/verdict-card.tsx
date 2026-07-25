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
// `verdict.topStrengths` is deliberately NOT rendered (operator, 2026-07-21:
// "too much information here"). Two of its three items restate `bestFor`
// exactly — "No broker-imposed per-contract fee on US options" against "US
// options traders avoiding broker contract fees", and the $100,000 practice
// account against two separate bestFor lines — and both facts appear a THIRD
// time in the Essential Facts rail. The one item that was unique
// (TradingView charting) is carried by the body. The field stays in the
// frontmatter and its schema; only this rendering drops.
//
// Above-the-fold word budget (Konzept §7.4, 300-380 words total) is
// enforced upstream by the verdict-frontmatter Zod schema's per-field word
// counts, not by truncating here.
// ============================================================

import Link from 'next/link';
import type { ReactNode } from 'react';
import type { VerdictBlock } from '@/lib/reviews/verdict-frontmatter';
import type { DecisionBridgeData } from '@/lib/comparison/types';
import { scoreLabel, rankPhrase } from '@/lib/reviews/score-label';
import { ScoreBreakdown } from './score-breakdown';
import { EssentialFactsGrid } from './essential-facts-grid';
import { CALLOUT_ARTICLE } from '@/lib/reviews/callout-style';
import { BestForNotFor } from './best-for-not-for';
import { MinusCircleIcon } from '@/components/marketing/check-icon';
import type { EssentialFact } from '@/lib/reviews/verdict-frontmatter';

/** The audited cockpit position for the reviewed product — same shape as
 *  DecisionBridgeData['position'], reused rather than redefined. */
export type ReviewPosition = NonNullable<DecisionBridgeData['position']>;

export interface VerdictCardProps {
  verdict: VerdictBlock;
  /** Rendered in the right rail under the score, filling space the score
   *  panel leaves empty — see the note at the render site. */
  essentialFacts?: EssentialFact[];
  /** Audited cockpit position (T0b) — null when the product isn't in this field yet. */
  position: ReviewPosition | null;
  /** Total field size — required to phrase `position`'s rank; ignored when `position` is null. */
  fieldCount: number;
  /** Defaults to '/methodology' — the same target decision-bridge.tsx's "How we score" link uses. */
  scoreHref?: string;
  /** Compact CTA/disclosure surface, inserted after audience fit on mobile/tablet. */
  mobileActions?: ReactNode;
}

export function VerdictCard({
  verdict,
  position,
  fieldCount,
  essentialFacts,
  scoreHref = '/methodology',
  mobileActions,
}: VerdictCardProps) {

  return (
    <div
      className={position ? 'grid gap-x-8 gap-y-6 md:grid-cols-[minmax(0,1fr)_260px]' : ''}
      style={{
        border: '1px solid var(--sfp-hairline-strong)',
        borderRadius: '18px',
        padding: '28px 30px',
        background: '#fff',
      }}
    >
      {/* Score panel FIRST in the DOM, positioned into the right rail on
          desktop (md:col-start-2 md:row-start-1) — see BestXScore's own note.
          Measured before this change: on a 390px viewport the score sat
          2,509px down the page, roughly three screens below the fold, because
          it stacked after the full verdict prose. The single number the whole
          page is about was effectively invisible on mobile.
          Reordering in the DOM rather than with CSS `order` on purpose: the
          panel contains a "How we score" link, so a visual-only reorder would
          leave screen-reader and keyboard order contradicting what is on
          screen (WCAG 1.3.2 / 2.4.3). Desktop layout is unchanged. */}
      {position && (
<BestXScore position={position} fieldCount={fieldCount} scoreHref={scoreHref} />
      )}

      <div className={position ? 'md:col-start-1 md:row-start-1 md:row-span-2' : ''}>
        {/* Best for / Not for FIRST (operator, 2026-07-25, after an external
            design audit). It used to close the card, behind the summary prose
            and the limitation. Measured on a 390px viewport that put "Best for"
            1.90 viewport heights down the page: a reader had to scroll past
            roughly 400px of numbers and a 546px block of prose before finding
            out whether the product was meant for them at all — the one question
            an opening block exists to answer.
            The card now reads score → who it is for → what holds it back →
            the argument in full.
            This reorders the DOM, not just the visual order (no CSS `order`):
            these are lists a screen reader walks in sequence, and the same
            WCAG 1.3.2 / 2.4.3 reasoning that governs the score panel above
            applies here.
            Inside the card rather than as its own band below it (operator,
            2026-07-21). The left column ran out of content well before the
            score rail beside it ran out of height, so the card ended on a large
            empty rectangle while a closely related pair of lists sat in a
            separate block underneath. Same four lists, one container, and every
            mark in this card is the same icon in the same navy — the
            limitation and both of these — so it reads as one argument instead
            of four widgets. */}
        <BestForNotFor bestFor={verdict.bestFor} notFor={verdict.notFor} />

        {mobileActions}

        <div
          style={{
            display: 'flex',
            gap: '8px',
            fontFamily: 'var(--font-secondary)',
            fontSize: '18px',
            lineHeight: 1.55,
            color: 'var(--sfp-ink)',
            marginTop: '18px',
          }}
        >
          <MinusCircleIcon size={17} color="var(--sfp-navy)" style={{ flexShrink: 0, marginTop: '4px' }} />
          <span>
            <strong style={{ fontWeight: 600 }}>Main limitation:</strong> {verdict.mainLimitation}
          </span>
        </div>

        {/* No "Our Verdict" label (operator, 2026-07-21). It sat directly
            under an H1 naming the product and above the summary itself — the
            reader knows what an opening paragraph in a tinted panel is. The
            panel does the marking; the word only took a line.
            Styling comes from CALLOUT_ARTICLE so this panel, the per-section
            verdicts and the editorial aside are one look — they had drifted
            into three backgrounds and two typefaces.
            The hairline moved up here with the prose (2026-07-25): it separates
            the full argument from the quick answers above it, which is the
            break the card now has. */}
        <div style={{ marginTop: '22px', paddingTop: '20px', borderTop: '1px solid var(--sfp-hairline-row)' }}>
          <p style={{ ...CALLOUT_ARTICLE, margin: 0 }}>
            {verdict.summary}
          </p>
        </div>
      </div>

      {/* Essential Facts, in the score rail rather than as a separate band of
          tiles below the card (operator, 2026-07-21). The score panel is short
          and the verdict column beside it is long, so this rail used to run
          empty for most of its height while a five-tile grid took a full
          screen-width block further down. Same information, one section fewer.

          Desktop keeps that col 2 / row 2 rail. Mobile receives the same facts
          behind a collapsed native details control: every value and source
          remains available, but the five-row block no longer consumes the
          opening before a reader asks for it. */}
      {position && essentialFacts && essentialFacts.length > 0 && (
        <>
          <div
            className="hidden md:block md:col-start-2 md:row-start-2"
            style={{ borderTop: '1px solid var(--sfp-hairline-row)', paddingTop: '16px' }}
          >
            <EssentialFactsGrid facts={essentialFacts} />
          </div>
          <details
            className="md:hidden"
            style={{
              borderTop: '1px solid var(--sfp-hairline-row)',
              paddingTop: '16px',
              fontFamily: 'var(--font-primary)',
            }}
          >
            <summary
              className="cursor-pointer list-none [&::-webkit-details-marker]:hidden"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: 'var(--sfp-navy)',
                fontSize: '13.5px',
                fontWeight: 600,
              }}
            >
              Essential facts
              <span aria-hidden="true" style={{ color: 'var(--sfp-slate)', fontSize: '18px' }}>+</span>
            </summary>
            <div style={{ paddingTop: '16px' }}>
              <EssentialFactsGrid facts={essentialFacts} />
            </div>
          </details>
        </>
      )}
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
      // Mobile: the panel now sits ABOVE the verdict prose, so its separator
      // is a bottom rule, not a top one. Desktop: unchanged — second column,
      // left rule, no horizontal rule. col/row-start pin it to the right rail
      // even though it comes first in the DOM.
      className="mb-6 border-b pb-6 md:col-start-2 md:row-start-1 md:mb-0 md:border-b-0 md:border-l md:pb-0 md:pl-8"
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
