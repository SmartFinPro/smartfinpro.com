// components/research/ScoreBadge.tsx
// Research Library — the audited BEST-X score lockup for the Research Dossier
// card's "score module" (plan: card hierarchy §2). Server Component (no
// state/events). Deliberately NOT a colored pill/gauge — a plain, large
// numeral with its editorial band label directly beneath reads like an
// institutional rating stamp (Moody's/S&P register), which is the "Research
// Dossier" premium bar this redesign targets. Color is a supporting cue only
// on the numeral itself; the text label and an sr-only sentence are always
// present alongside it, so the signal never depends on color alone.
//
// Only ever called for `audited` records (adapter guarantees `displayScore`
// is a number only when `research.status === 'audited'` — see
// lib/research/adapter.ts). Provisional/unavailable products render
// VerificationStatus instead, never this component.

import { scoreLabel } from '@/lib/reviews/score-label';

export interface ScoreBadgeProps {
  /** The audited BEST-X score, 0-10. */
  score: number;
  /** 'featured' renders a larger numeral for the #1 Featured Dossier card
   *  (card hierarchy §"#1 = Featured Dossier") — the score module is one of
   *  the visual cues that the top card carries more weight than the rest. */
  size?: 'default' | 'featured';
  /** Audited rank — announced in the sr-only sentence so a screen-reader user
   *  hears the rank the visible (aria-hidden) rank chip carries. */
  rank?: number | null;
}

/** Subtle color cue aligned to the SCORE_BANDS thresholds (9.0 / 8.0 / 7.0) —
 *  green≥9, gold-dark≥8, navy≥7, slate below. Decorative support for the text
 *  label, which is what actually carries the meaning. */
function bandColor(score: number): string {
  if (score >= 9.0) return 'var(--sfp-green)';
  if (score >= 8.0) return 'var(--sfp-gold-dark)';
  if (score >= 7.0) return 'var(--sfp-navy)';
  return 'var(--sfp-slate)';
}

export function ScoreBadge({ score, size = 'default', rank = null }: ScoreBadgeProps) {
  const label = scoreLabel(score);
  const color = bandColor(score);
  const numeralClass = size === 'featured' ? 'text-4xl' : 'text-2xl';

  return (
    <div className="flex flex-col items-end">
      <span aria-hidden="true" className={`${numeralClass} font-extrabold leading-none tabular-nums`} style={{ color }}>
        {score.toFixed(1)}
      </span>
      <span
        aria-hidden="true"
        className="mt-1 text-[11px] font-bold uppercase tracking-wider"
        style={{ color: 'var(--sfp-slate)' }}
      >
        {label}
      </span>
      <span className="sr-only">
        {`${rank !== null ? `Ranked number ${rank}. ` : ''}BEST-X Score ${score.toFixed(1)} out of 10, rated ${label}.`}
      </span>
    </div>
  );
}
