// lib/tools/shell-types.ts
// Result Contract of the Financial Decision Lab (SPEC 8.1) — pure types,
// no React. Every major tool page builds a ToolResult server-side (worked
// example) and the island rebuilds it client-side from user inputs.

export type ResultState = 'example' | 'yours' | 'shared';
export type ToolCurrency = 'USD' | 'GBP' | 'CAD' | 'AUD';

export interface Lever {
  key: string;                      // controlRole:'lever' events reference this key
  title: string;
  deltaLabel: string;               // "Save ~$120–180/mo" — always a range/circa, never exact promises
  // Optional input mutation (live application). Semantics are NOT uniform:
  // most keys are ABSOLUTE new values, but a per-engine documented subset
  // may be an ADDITIVE delta instead (e.g. the retirement engine's
  // `employeeContributionMonthly` — see lib/calc/retirement/engine.ts's
  // applyLever()). Consumers MUST use the engine's own apply function
  // (e.g. applyLever) rather than reimplementing a generic setField loop,
  // or they will silently misapply delta-semantic keys as absolutes.
  apply?: Partial<Record<string, number>>;
}

export interface AssumptionEntry {
  label: string;                    // EN, UI-ready
  value: string;                    // formatted, e.g. "5.0% real return"
  note?: string;
}

export interface RuleSourceRef {
  label: string;
  url: string;
  effectiveFrom: string;            // ISO
  verifiedAt: string;               // ISO
}

// Signature visuals — one discriminated union, rendered by ScenarioChart
// in RSC (worked example) AND island (live result) from the same geometry.
export type ScenarioVisualData =
  | { kind: 'corridor'; series: { key: 'conservative' | 'base' | 'optimistic'; rows: { x: number; y: number }[] }[];
      markers: { x: number; label: string }[]; xLabel: string; yLabel: string; textAlternative: string }
  | { kind: 'bars'; bars: { key: string; label: string; value: number; emphasis?: boolean }[];
      total?: { label: string; value: number }; textAlternative: string }
  | { kind: 'stack'; segments: { key: string; label: string; value: number }[];
      cap?: { label: string; value: number }; textAlternative: string }
  | { kind: 'range'; low: number; high: number; marker?: { value: number; label: string };
      axisLow: number; axisHigh: number; textAlternative: string };

export interface ToolResult {
  answer: string;                                   // (1) one sentence, EN
  primary: {
    label: string;
    value: number;
    range: { low: number; high: number };           // (2) realistic band, mandatory
    format: 'currency' | 'percent' | 'years' | 'date';
    currency?: ToolCurrency;
  };
  scenario: ScenarioVisualData;                     // (3)
  levers: [Lever, Lever, Lever];                    // (4) exactly three, prioritized
  assumptions: AssumptionEntry[];                   // (5)
  sources: RuleSourceRef[];
  verifiedAt: string;                               // min(verifiedAt of critical rules), ISO
  nextAction: { href: string; label: string; kind: 'cockpit' | 'review' | 'provider' | 'tool' }; // (6) exactly one
  share?: { allowedFields: string[]; preview: string };
  report?: { formats: ('pdf' | 'email')[] };
  resultState: ResultState;
}

// Result panel state machine (SPEC 6.5) — pure, unit-tested.
export type PanelState =
  | 'initial' | 'ready' | 'calculating' | 'result'
  | 'insufficient-data' | 'stale-data' | 'error';

export type PanelEvent =
  | { type: 'INPUTS_PREFILLED' }                    // shared link / decision-state prefill
  | { type: 'INPUT_CHANGED'; complete: boolean }    // complete = all required inputs valid
  | { type: 'CALC_STARTED' }
  | { type: 'CALC_SUCCEEDED'; stale: boolean }      // stale = a critical rule exceeded its SLA
  | { type: 'CALC_FAILED' }
  | { type: 'RESET' };

export function advancePanelState(state: PanelState, event: PanelEvent): PanelState {
  switch (event.type) {
    case 'RESET': return 'initial';
    case 'INPUTS_PREFILLED': return 'ready';
    case 'INPUT_CHANGED':
      if (state === 'result' || state === 'stale-data') return event.complete ? state : 'insufficient-data';
      return event.complete ? 'ready' : state === 'initial' ? 'initial' : 'insufficient-data';
    case 'CALC_STARTED': return 'calculating';
    case 'CALC_SUCCEEDED': return event.stale ? 'stale-data' : 'result';
    case 'CALC_FAILED': return 'error';
  }
}
