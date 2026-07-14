// lib/decision/wealth-horizon-prefill.ts
// FDL 4.4 — pure mapping from a decoded SharePayload originating at one of
// the 3 supporting savings widgets (superannuation / tfsa-rrsp / isa) onto a
// PARTIAL set of Wealth Horizon's Normal-mode inputs. Only fields Wealth
// Horizon actually understands are ever set — everything else in the
// payload is silently ignored. An invalid payload (wrong source tool, no
// usable fields) returns null.
//
// Deviation from the 4.4 brief (documented, not discussed): "mind. Balance +
// monatlicher Beitrag" is the ASPIRATION, not a hard requirement — the
// tfsa-rrsp-calculator widget has no monthly-contribution input at all (its
// "TFSA/RRSP contributed so far" fields are balances), so only ageBand +
// balanceBand travel for that source tool. isa-tax-savings-calculator has
// neither an age nor a balance field (its only continuous input is the
// annual ISA contribution), so only contributionBand travels for isa.
//
// No React/DOM — pure, unit-tested (see __tests__/unit/wealth-horizon-
// prefill.test.ts).

import type { SharePayload } from './share-codec';
import type { ToolId } from '@/lib/tools/registry/types';

export interface WealthHorizonPrefill {
  currentAge?: number;
  retireAge?: number;
  startingAmount?: number;
  monthlyContribution?: number;
}

/** The 3 supporting-tool source ids this bridge accepts. Wealth Horizon's own
 *  scenario id ('wealth-horizon') and every other ToolId are rejected —
 *  this module is one-directional (widgets → Wealth Horizon). */
const SOURCE_TOOL_IDS: ReadonlySet<ToolId> = new Set<ToolId>(['superannuation', 'tfsa-rrsp', 'isa']);

/** Display label for the "Using your {label} inputs — edit" line. */
export const PREFILL_SOURCE_LABEL: Partial<Record<ToolId, string>> = {
  superannuation: 'Super',
  'tfsa-rrsp': 'TFSA',
  isa: 'ISA',
};

/** Parses a toInputBucket()-style band label ("1000-2500" / "lt100" /
 *  "gte1000000" / "invalid") into a representative midpoint. Mirrors the
 *  edge-bucket shapes in lib/analytics/tool-events.ts closely enough for a
 *  prefill's purposes — deliberately approximate, never exact (that's the
 *  whole point of a band). */
export function bandMidpoint(band: string): number | null {
  if (band === 'invalid') return null;
  const lt = /^lt(\d+(?:\.\d+)?)$/.exec(band);
  if (lt) return Number(lt[1]) / 2;
  const gte = /^gte(\d+(?:\.\d+)?)$/.exec(band);
  if (gte) return Number(gte[1]);
  const range = /^(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)$/.exec(band);
  if (range) return (Number(range[1]) + Number(range[2])) / 2;
  return null;
}

/** Exported so the 3 supporting widgets can reuse the identical clamp/step
 *  policy for the REVERSE direction (WH → widget rücklinks, FDL 4.4 task E)
 *  without duplicating the arithmetic three times. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function roundToStep(value: number, step: number): number {
  return Math.round(value / step) * step;
}

/** Maps a decoded SharePayload from superannuation/tfsa-rrsp/isa onto a
 *  partial WealthHorizonPrefill. Ranges/steps mirror wealth-horizon-live.tsx's
 *  own SliderField bounds (startingAmount 0–1,000,000 step 1,000; monthly
 *  contribution 0–5,000 step 50; age 18–80) so a prefilled value is always
 *  representable on the slider it lands on. */
export function buildWealthHorizonPrefill(payload: SharePayload): WealthHorizonPrefill | null {
  if (!SOURCE_TOOL_IDS.has(payload.t)) return null;

  const out: WealthHorizonPrefill = {};

  const ageBand = payload.i.ageBand;
  if (typeof ageBand === 'string') {
    const mid = bandMidpoint(ageBand);
    if (mid !== null) out.currentAge = Math.round(clamp(mid, 18, 80));
  }

  const balanceBand = payload.i.balanceBand;
  if (typeof balanceBand === 'string') {
    const mid = bandMidpoint(balanceBand);
    if (mid !== null) out.startingAmount = roundToStep(clamp(mid, 0, 1_000_000), 1_000);
  }

  const contributionBand = payload.i.contributionBand;
  if (typeof contributionBand === 'string') {
    const mid = bandMidpoint(contributionBand);
    if (mid !== null) out.monthlyContribution = roundToStep(clamp(mid, 0, 5_000), 50);
  }

  return Object.keys(out).length > 0 ? out : null;
}
