// lib/comparison/verdict.ts
// Pure, framework-free helpers for the DecisionBridge verdict copy (Task 5b,
// Teil 1 — editorial integrity remediation). No React, no 'server-only' — so
// this can be imported both from the client component
// (components/marketing/decision-bridge.tsx) and from plain-node vitest
// specs, exactly like lib/comparison/types.ts.
//
// The operator-approved verdict has three sentences:
//   1. "Good for {best_for}." — stays OUT until Task 10 audits `best_for`
//      (it is a raw, unaudited DB field — see
//      docs/superpowers/specs/2026-07-17-cockpit-bridge-design.md, "Blocker
//      vor dem Vollausrollen: Claim-Audit über 273 Zeilen").
//   2. "Consider alternatives if {weakest dimension} is a priority." — built
//      here, from `sub_scores` only. Computed, never written.
//   3. The score-spread sentence — built inline in decision-bridge.tsx
//      (unchanged by this file).

/**
 * Label map for the weakness clause. Deliberately covers only the four
 * canonical sub-score dimensions most topics use (fees/features/ux/
 * support — see lib/comparison/types.ts SubScores doc comment). Topics with
 * different dimensions (e.g. mortgage brokers: trust/rating/coverage) have
 * no entry here on purpose — `buildWeaknessClause` returns null rather than
 * guessing a phrase for an unmapped key. Single source of truth: do not
 * duplicate this map inline anywhere else.
 */
export const WEAKNESS_LABELS: Readonly<Record<string, string>> = {
  support: 'reliable support',
  fees: 'low costs',
  ux: 'ease of use',
  features: 'a broad feature set',
};

/**
 * Minimum gap (0–10 scale) between a product's weakest sub-score and the
 * field-best value for that same dimension before the weakness is worth
 * naming in prose. Scores are recorded to one decimal; a sub-1-point gap
 * sits inside normal editorial rounding / confidence-tier noise, so flagging
 * it reads as a false warning ("consider alternatives" over a 0.2-point gap
 * is not a real trade-off a reader should weigh). A gap of >= 1.0 point —
 * 10% of the full 0–10 scale — is large enough to be an honest signal.
 */
export const MEANINGFUL_WEAKNESS_GAP = 1.0;

/**
 * Returns the "Consider alternatives if X is a priority." clause, or null
 * when the sentence would say nothing true: no label mapping for the
 * weakest key, no field-best figure to compare against, or the gap is too
 * small to be a real trade-off (see MEANINGFUL_WEAKNESS_GAP).
 */
export function buildWeaknessClause(
  weakestKey: string,
  weakestValue: number,
  fieldBestSubScores: Record<string, number>,
): string | null {
  const label = WEAKNESS_LABELS[weakestKey.toLowerCase()];
  if (!label) return null;

  const fieldBest = fieldBestSubScores[weakestKey];
  if (typeof fieldBest !== 'number' || !Number.isFinite(fieldBest)) return null;

  const gap = fieldBest - weakestValue;
  if (gap < MEANINGFUL_WEAKNESS_GAP) return null;

  return `Consider alternatives if ${label} is a priority.`;
}
