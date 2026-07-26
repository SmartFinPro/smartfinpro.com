// lib/tools/results/wealth-horizon-real-return.ts
// Wealth Horizon v3 (Fable-Direktive nach User-Feedback "v2 war zu unruhig") —
// "Rendite→Engine (Vertrags-konform)": the retirement engine
// (lib/calc/retirement/engine.ts) stays REAL and UNTOUCHED — it still reads
// rules.values.realReturn{Conservative,Base,Optimistic} directly, exactly as
// before. The v3 UI replaced the old 3-way scenario switcher with two plain
// fields the user actually understands — "Expected annual return" (nominal)
// and "Expected inflation" — so this module is the ONE place that turns
// those two nominal-terms UI inputs into the real-terms RuleSnapshot the
// engine has always expected.
//
// realPct = returnNominalPct − inflationPct (a documented approximation —
// see the Methodology paragraph added to all 4 Wealth Horizon pages: "real
// return ≈ nominal − inflation"). Conservative/optimistic are then a ±1.5pp
// editorial uncertainty band around that single realPct — NOT a second set
// of user inputs — so `primary.range` (Result Contract slot 2, mandatory)
// stays populated exactly as before, just re-centered on the user's own
// return assumption instead of the old fixed 3/5/6.5% trio.
//
// Clamp: realPct is clamped to [0.5, 8] before it reaches the engine (an
// engine given e.g. a −40% real return would still "work" numerically, but
// projecting decades on an assumption that extreme is not a useful
// illustration) — `clamped` is returned so the caller can show a warning
// without silently hiding what happened.

import type { RuleSnapshot } from '@/lib/rules';

export const REAL_RETURN_CLAMP_MIN = 0.5;
export const REAL_RETURN_CLAMP_MAX = 8;

/** Editorial uncertainty band, in percentage points, applied symmetrically
 *  around the user's single real-return assumption to populate the
 *  engine's conservative/optimistic scenarios (and therefore
 *  ToolResult.primary.range — Result Contract slot 2, still mandatory). */
export const REAL_RETURN_SCENARIO_SPREAD_PCT = 1.5;

export interface RealReturnClamp {
  /** realPct BEFORE clamping (nominal − inflation, may be out of range). */
  rawRealPct: number;
  /** realPct AFTER clamping to [REAL_RETURN_CLAMP_MIN, REAL_RETURN_CLAMP_MAX] — this is what's actually sent to the engine. */
  realPct: number;
  /** true when rawRealPct fell outside the clamp range (caller should show a warning). */
  clamped: boolean;
}

export function computeClampedRealReturn(returnNominalPct: number, inflationPct: number): RealReturnClamp {
  const rawRealPct = returnNominalPct - inflationPct;
  const realPct = Math.min(REAL_RETURN_CLAMP_MAX, Math.max(REAL_RETURN_CLAMP_MIN, rawRealPct));
  return { rawRealPct, realPct, clamped: realPct !== rawRealPct };
}

/**
 * Clones `rules` with realReturnBase/Conservative/Optimistic overridden from
 * the (clamped) user-entered nominal return + inflation. Every OTHER rule
 * value (contribution limits, ISA allowance, concessional cap, …) passes
 * through untouched — this function never mutates the input snapshot.
 */
export function buildRealReturnRuleSnapshot(
  rules: RuleSnapshot,
  returnNominalPct: number,
  inflationPct: number,
): { rules: RuleSnapshot; clamp: RealReturnClamp } {
  const clamp = computeClampedRealReturn(returnNominalPct, inflationPct);
  const realPct = clamp.realPct;
  return {
    rules: {
      ...rules,
      values: {
        ...rules.values,
        realReturnBase: realPct / 100,
        realReturnConservative: (realPct - REAL_RETURN_SCENARIO_SPREAD_PCT) / 100,
        realReturnOptimistic: (realPct + REAL_RETURN_SCENARIO_SPREAD_PCT) / 100,
      },
    },
    clamp,
  };
}
