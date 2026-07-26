// lib/reviews/score-label.ts — BEST-X 0-10 score band label + small-field rank phrasing
// ============================================================
// T4 (2026-07-18 review-redesign V2 foundation).
//
// scoreLabel(): maps a 0-10 BEST-X score to one editorial band label. One
// exported source (SCORE_BANDS) — no component may hardcode its own
// threshold copy.
//
// rankPhrase(): the Betreiber-Review flagged that showing "Top 20%" for a
// 9-candidate field is pseudo-precision — a percentile implies a much
// larger, more granular population than 9 items actually support. Below a
// field of 20, this always renders "Rank {rank} of {fieldCount}" instead;
// percentile phrasing ("Top {p}%") is only offered once the field is large
// enough (>= 20) for a percentile to mean anything.
// ============================================================

export interface ScoreBand {
  /** Inclusive lower bound of this band, on the 0-10 scale. */
  min: number;
  label: string;
}

/**
 * The BEST-X score bands, ordered from highest to lowest threshold. The
 * single source of truth for score → label mapping — {@link scoreLabel}
 * just walks this list.
 *
 *   >= 9.0        Excellent
 *   8.5 – 8.9     Very Good
 *   8.0 – 8.4     Good
 *   7.0 – 7.9     Fair
 *   <  7.0        Mixed
 */
export const SCORE_BANDS: readonly ScoreBand[] = [
  { min: 9.0, label: 'Excellent' },
  { min: 8.5, label: 'Very Good' },
  { min: 8.0, label: 'Good' },
  { min: 7.0, label: 'Fair' },
  { min: Number.NEGATIVE_INFINITY, label: 'Mixed' },
];

/** Maps a 0-10 BEST-X score to its editorial band label (see {@link SCORE_BANDS}). */
export function scoreLabel(score: number): string {
  const band = SCORE_BANDS.find((b) => score >= b.min);
  // SCORE_BANDS always has a -Infinity floor entry, so `band` is never
  // undefined for a finite `score` — the fallback below only guards NaN.
  return band ? band.label : 'Mixed';
}

/** Field size at/above which a percentile ("Top X%") is meaningful instead of pseudo-precise. */
const PERCENTILE_FIELD_COUNT_THRESHOLD = 20;

/**
 * Phrases a product's rank within its comparison field.
 *
 * - `fieldCount < 20` → always `"Rank {rank} of {fieldCount}"` — never a
 *   percent/percentile. (At 9 products, "Top 20%" would be pseudo-precision:
 *   the same one-product swing changes the percentile by >10 points.)
 * - `fieldCount >= 20` → `"Top {p}%"`, where `p` is `rank / fieldCount`
 *   rounded to the nearest whole percent, clamped to [1, 99].
 */
export function rankPhrase(rank: number, fieldCount: number): string {
  if (fieldCount < PERCENTILE_FIELD_COUNT_THRESHOLD) {
    return `Rank ${rank} of ${fieldCount}`;
  }
  const rawPercentile = (rank / fieldCount) * 100;
  const percentile = Math.min(99, Math.max(1, Math.round(rawPercentile)));
  return `Top ${percentile}%`;
}
