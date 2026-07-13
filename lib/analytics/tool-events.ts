// lib/analytics/tool-events.ts
// Pure logic for the Financial Decision Lab tool tracking (schema tool_v1).
// Strictly ADDITIVE sibling of cockpit_v1 — shares the analytics_events
// table and POST /api/track, but with its own event names, its own strict
// Zod schema and its own batch type 'tool_event_batch'. No React, no DOM.
// The 'use client' binding lives in lib/analytics/tool-tracking.ts (PR 1.2).

import type { ShellMode, ToolId, ToolMarket } from '@/lib/tools/registry/types';

export const TOOL_SCHEMA_VERSION = 'tool_v1';
export const TOOL_EVENT_CATEGORY = 'tool';
/**
 * Day 0 of the 7–14-day analytics baseline window (Spec 0.5.1), set to the
 * real merge date of PR 1.3 (Money Leak / Broker Quiz / Trading Cost
 * instrumentation — the first real tool_v1 traffic). Consumed by
 * lib/analytics/analytics-annotations.ts as the 'Baseline start (tool_v1)'
 * marker and by the dashboard's getBaselineWindow(). Fable corrects this
 * value at push time if the actual merge date slips.
 */
export const TOOL_BASELINE_START = '2026-07-13';
/** Keep in sync with TrackToolEventBatchSchema (.max(20)). */
export const TOOL_EVENT_BATCH_HARD_CAP = 20;
export const TOOL_IMPRESSION_STORAGE_KEY = 'sfp_tool_seen_v1';
/** tool_input_change caps per funnel key — separate budgets per role. */
export const FIELD_INPUT_CAP = 40;
export const LEVER_INPUT_CAP = 10;
export const INPUT_DEBOUNCE_MS = 600;
/** Alternative qualification: result qualified-visible ≥ 20 s AND ≥ 3 inputs. */
export const QUALIFIED_VISIBLE_MS = 20_000;
export const QUALIFIED_MIN_INPUTS = 3;

export const TOOL_EVENT_NAMES = [
  'tool_view', 'tool_start', 'tool_input_change', 'tool_first_result',
  'tool_qualified_decision', 'tool_scenario_compare', 'tool_result_share',
  'tool_report_download', 'tool_report_email', 'tool_next_action_click',
  'tool_cockpit_cta_click', 'tool_calculation_error',
] as const;
export type ToolEventName = (typeof TOOL_EVENT_NAMES)[number];

export type ToolResultState = 'example' | 'yours' | 'shared';
export type ControlRole = 'field' | 'lever';
export type NextActionKind = 'cockpit' | 'review' | 'provider' | 'tool';
export type QualifiedVia =
  | 'scenario_compare' | 'lever' | 'next_action' | 'share' | 'report' | 'visibility';

export interface ToolContext {
  toolId: ToolId;
  market: ToolMarket;
  /** Canonical pathname WITHOUT query or fragment (funnel dedupe scope). */
  variantPath: string;
  shellMode: ShellMode;
}

export interface ToolV1Properties extends ToolContext {
  schemaVersion: typeof TOOL_SCHEMA_VERSION;
  resultState?: ToolResultState;
  inputKey?: string;
  /** Bucketed value only — NEVER raw amounts (privacy contract, Spec 10.2). */
  inputBucket?: string;
  controlRole?: ControlRole;
  ttfvMs?: number;
  qualifiedVia?: QualifiedVia;
  scenario?: string;
  shareFieldCount?: number;
  format?: 'pdf' | 'email';
  nextActionKind?: NextActionKind;
  bridgeHref?: string;
  errorKind?: string;
}

/** The `data` record POSTed to /api/track (columns of analytics_events). */
export interface ToolEventData {
  eventName: ToolEventName;
  eventCategory: typeof TOOL_EVENT_CATEGORY;
  eventAction: string;
  eventLabel: string;
  eventValue?: number;
  pagePath: string;
  properties: ToolV1Properties;
}

const EVENT_ACTIONS: Record<ToolEventName, string> = {
  tool_view: 'view',
  tool_start: 'start',
  tool_input_change: 'input_change',
  tool_first_result: 'first_result',
  tool_qualified_decision: 'qualified_decision',
  tool_scenario_compare: 'scenario_compare',
  tool_result_share: 'share',
  tool_report_download: 'report_download',
  tool_report_email: 'report_email',
  tool_next_action_click: 'next_action',
  tool_cockpit_cta_click: 'cockpit_cta',
  tool_calculation_error: 'calculation_error',
};

function deriveLabel(name: ToolEventName, p: ToolV1Properties): string {
  switch (name) {
    case 'tool_start':
    case 'tool_input_change':
      return p.inputKey ?? '';
    case 'tool_qualified_decision':
      return p.qualifiedVia ?? '';
    case 'tool_scenario_compare':
      return p.scenario ?? '';
    case 'tool_report_download':
    case 'tool_report_email':
      return p.format ?? '';
    case 'tool_next_action_click':
      return p.nextActionKind ?? '';
    case 'tool_cockpit_cta_click':
      return p.bridgeHref ?? '';
    case 'tool_calculation_error':
      return p.errorKind ?? '';
    default:
      return p.toolId;
  }
}

function deriveValue(name: ToolEventName, p: ToolV1Properties): number | undefined {
  switch (name) {
    case 'tool_first_result': return p.ttfvMs;
    case 'tool_result_share': return p.shareFieldCount;
    default: return undefined;
  }
}

/** Builds the /api/track `data` record for one tool event. */
export function buildToolEventData(
  name: ToolEventName,
  ctx: ToolContext,
  props: Omit<Partial<ToolV1Properties>, 'schemaVersion' | keyof ToolContext> = {},
): ToolEventData {
  const properties: ToolV1Properties = {
    schemaVersion: TOOL_SCHEMA_VERSION,
    toolId: ctx.toolId,
    market: ctx.market,
    variantPath: ctx.variantPath,
    shellMode: ctx.shellMode,
    ...props,
  };
  return {
    eventName: name,
    eventCategory: TOOL_EVENT_CATEGORY,
    eventAction: EVENT_ACTIONS[name],
    eventLabel: deriveLabel(name, properties),
    eventValue: deriveValue(name, properties),
    pagePath: ctx.variantPath,
    properties,
  };
}

/** Unified funnel dedupe key (Spec 10.1): sessionId + toolId + market + variantPath. */
export function funnelKey(sessionId: string, ctx: ToolContext): string {
  return `${sessionId}|${ctx.toolId}|${ctx.market}|${ctx.variantPath}`;
}

/**
 * Rate-limit weight for a 'tool_event_batch' request — one token per event,
 * clamped to the hard cap (mirrors computeTrackRateLimitWeight for cockpit
 * batches; that function is frozen and stays cockpit-only).
 */
export function computeToolBatchWeight(rawEventsLength: unknown): number {
  const n = typeof rawEventsLength === 'number' && Number.isFinite(rawEventsLength) ? rawEventsLength : 0;
  return Math.max(1, Math.min(n, TOOL_EVENT_BATCH_HARD_CAP));
}

// ── Input buckets (privacy: raw values never leave the browser) ─────────────

export type InputBucketKind = 'currency' | 'percent' | 'years' | 'count';

const CURRENCY_EDGES = [0, 100, 250, 500, 1_000, 2_500, 5_000, 10_000, 25_000, 50_000, 100_000, 250_000, 500_000, 1_000_000];
const PERCENT_EDGES = [0, 1, 2, 3, 5, 7, 10, 15, 25, 50];
const YEARS_EDGES = [0, 1, 2, 5, 10, 15, 20, 25, 30, 40];
const COUNT_EDGES = [0, 1, 2, 3, 5, 10, 20, 50];

function edgeBucket(value: number, edges: number[]): string {
  if (!Number.isFinite(value)) return 'invalid';
  if (value < edges[0]) return `lt${edges[0]}`;
  for (let i = edges.length - 1; i >= 0; i--) {
    if (value >= edges[i]) {
      if (i === edges.length - 1) return `gte${edges[i]}`;
      // The lowest positive bucket reads as "below the next edge" rather
      // than "edges[0]-edges[1]" (edges[0] is 0, the domain floor, not a
      // meaningful bucket boundary of its own — e.g. 99 → 'lt100', not '0-100').
      if (i === 0) return `lt${edges[i + 1]}`;
      return `${edges[i]}-${edges[i + 1]}`;
    }
  }
  return 'invalid';
}

export function toInputBucket(value: number, kind: InputBucketKind): string {
  switch (kind) {
    case 'currency': return edgeBucket(value, CURRENCY_EDGES);
    case 'percent': return edgeBucket(value, PERCENT_EDGES);
    case 'years': return edgeBucket(value, YEARS_EDGES);
    case 'count': return edgeBucket(value, COUNT_EDGES);
  }
}

// ── input_change caps (per funnel key; roles have separate budgets) ──────────

export interface InputChangeGate {
  /** true = event may fire; false = cap reached, drop silently. */
  allow(role: ControlRole): boolean;
  counts(): { field: number; lever: number };
}

export function createInputChangeGate(
  fieldCap = FIELD_INPUT_CAP,
  leverCap = LEVER_INPUT_CAP,
): InputChangeGate {
  let field = 0;
  let lever = 0;
  return {
    allow(role) {
      if (role === 'lever') {
        if (lever >= leverCap) return false;
        lever += 1;
        return true;
      }
      if (field >= fieldCap) return false;
      field += 1;
      return true;
    },
    counts: () => ({ field, lever }),
  };
}

// ── Qualified visibility (pure reducer; DOM binding in tool-tracking.ts) ─────
// Tracks how long the result panel has been "qualified visible" (tab visible
// AND ≥50% of the panel in the viewport). The timer accumulates only while
// both hold; background time never counts.

export interface QualifiedVisibilityState {
  accumulatedMs: number;
  /** nowMs when the panel last BECAME qualified-visible; null while it isn't. */
  visibleSince: number | null;
}

export const INITIAL_QUALIFIED_VISIBILITY: QualifiedVisibilityState = {
  accumulatedMs: 0,
  visibleSince: null,
};

export function advanceQualifiedVisibility(
  state: QualifiedVisibilityState,
  isQualifiedVisible: boolean,
  nowMs: number,
): QualifiedVisibilityState {
  if (isQualifiedVisible) {
    return state.visibleSince !== null ? state : { ...state, visibleSince: nowMs };
  }
  if (state.visibleSince === null) return state;
  return {
    accumulatedMs: state.accumulatedMs + Math.max(0, nowMs - state.visibleSince),
    visibleSince: null,
  };
}

export function qualifiedVisibleMs(state: QualifiedVisibilityState, nowMs: number): number {
  return state.accumulatedMs + (state.visibleSince !== null ? Math.max(0, nowMs - state.visibleSince) : 0);
}

// ── Qualified-Decision predicate (Spec 10.3, binding) ────────────────────────

export interface QualifiedDecisionSignals {
  firstResultFired: boolean;
  scenarioCompared: boolean;
  leverUsed: boolean;            // any tool_input_change with controlRole 'lever'
  nextActionClicked: boolean;
  shared: boolean;
  reportDownloaded: boolean;
  reportEmailed: boolean;
  qualifiedVisibleMs: number;    // from qualifiedVisibleMs()
  qualifyingInputCount: number;  // distinct inputKeys the user actually changed
  alreadyQualified: boolean;     // fires max once per funnel key
}

export function isQualifiedDecision(
  s: QualifiedDecisionSignals,
): { qualified: boolean; via: QualifiedVia | null } {
  if (s.alreadyQualified || !s.firstResultFired) return { qualified: false, via: null };
  if (s.scenarioCompared) return { qualified: true, via: 'scenario_compare' };
  if (s.leverUsed) return { qualified: true, via: 'lever' };
  if (s.nextActionClicked) return { qualified: true, via: 'next_action' };
  if (s.shared) return { qualified: true, via: 'share' };
  if (s.reportDownloaded || s.reportEmailed) return { qualified: true, via: 'report' };
  if (s.qualifiedVisibleMs >= QUALIFIED_VISIBLE_MS && s.qualifyingInputCount >= QUALIFIED_MIN_INPUTS) {
    return { qualified: true, via: 'visibility' };
  }
  return { qualified: false, via: null };
}
