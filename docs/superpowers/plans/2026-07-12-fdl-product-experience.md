# FDL Product Experience Implementation Plan (Phasen 1–5)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Die 20 Tool-Routen werden zum Financial Decision Lab: additives `tool_v1`-Tracking mit North-Star „Qualified Decisions Completed", die ToolShell mit drei Modi, vier Major Tools (Money Leak Pilot, Broker Journey, Wealth Horizon neu, Home Lab) und der Decision-Launcher-Hub — in 15 Haupt-PRs + 3 Indexability-Gate-PRs, jeder einzeln revertbar.

**Architecture:** Alles ist strikt additiv zu cockpit_v1 (Sibling-Typ `tool_event_batch`, eigene strict-Schemas, eigener Dashboard-Tab); die Shell entsteht als ungemountetes Fundament (PR 2.1) und wird Tool für Tool montiert; pure Engines (`lib/calc/`) + versionierte Marktregeln (`lib/rules/`) trennen Rechnung von UI; geteilter Zustand läuft über `DecisionStateV1` (sessionStorage) und Fragment-Share-Links mit per-Tool-Allowlist.

**Tech Stack:** Next.js 16 App Router · React 19 RSC · Tailwind v3.4 (Config in `tailwind.config.ts`!) · Supabase `analytics_events` (JSONB, keine Migration) · Zod · Vitest · Playwright (global `javaScriptEnabled:false`; JS-on nur via `test.use`) · recharts nur im Dashboard.

**Bindende Referenzdokumente:**
- Spec: `docs/superpowers/specs/2026-07-12-financial-decision-lab-design.md` (Kap. 6–10 sind Vertrag; bei Konflikt gewinnt die Spec, Abweichungen werden im PR-Text als Entscheidung dokumentiert)
- High-Fi-Referenz: `docs/superpowers/specs/assets/2026-07-12-fdl/hifi/` (`hifi-tokens.css` = einzige Token-Quelle für PR 2.1; PNGs = Pixel-Abnahme-Referenz)
- Foundation-Plan (Stil-Vorbild, abgeschlossen): `docs/superpowers/plans/2026-07-12-fdl-phase-0-foundation.md`

---

## 0. Verbindliche Rahmenregeln (gelten für JEDEN PR)

### 0.1 cockpit_v1-Freeze

`lib/analytics/cockpit-events.ts`, `lib/analytics/cockpit-tracking.ts`, `lib/actions/cockpit-analytics.ts`, alle `cockpit_*`-Schemas in `lib/validation/index.ts` und der `event_batch`-Case in `app/api/track/route.ts` werden **niemals modifiziert** (GA-Aliase laufen bis ~11.08.2026). Erlaubt sind ausschließlich **additive** Zeilen in geteilten Dateien (`TrackSchema.type`-Enum, neue `case`, neue Schemas darunter). Jeder PR weist im Text nach: `git diff main -- lib/analytics/cockpit-events.ts lib/analytics/cockpit-tracking.ts` ist leer.

### 0.2 Standard-Gates (jeder PR, vor Push)

1. `npx tsc --noEmit` — clean
2. `npm run check:imports` + `npm run check:hydration` (ab PR 2.1 mit den dort re-gescopten Guards)
3. `npx vitest run` — voll, keine Skips
4. `npm run build` — lokal, 0 Errors (CI baut ohne private Secrets; nie `SUPABASE_SERVICE_KEY` zur Build-Zeit voraussetzen)
5. Relevante Playwright-Specs (JS-off-Specs gegen `npm run build && node .next/standalone/server.js`-Stand bzw. wie im jeweiligen Brief)
6. CI Required Check **build** grün vor Merge; Merge-Reihenfolge laut Wellenplan
7. Rollback-Pfad = `git revert` des Merge-Commits — kein PR darf einen Zustand hinterlassen, in dem ein Revert eine andere Phase bricht

### 0.3 Modell-Governance (Zuordnung siehe je Brief)

Sonnet 5 implementiert nach Brief in frischer Subagent-Session; Fable reviewt jeden Diff; **Opus 4.8 reviewt blockierend vor Merge**: 1.1, 2.1, 2.2, 2.3, 3.2, 4.1, 4.2, 5.1, 5.2. Kein Modell erklärt Erfolg ohne tatsächlich gelaufene Tests + Build.

### 0.4 Subagent-Brief-Boilerplate (Kopf jedes Task-Briefs)

1. `git fetch origin` — lokale `origin/main`-Refs sind erfahrungsgemäß stale; Branch IMMER von frisch gefetchtem `origin/main`.
2. Worktree-Setup: `.env.local` aus dem Haupt-Repo kopieren, `node_modules` symlinken (sonst „supabaseUrl is required" / Preview findet next nicht).
3. Kein `git push` durch Subagenten — Fable reviewt, pusht, öffnet den PR (`gh pr create --body-file`, nie Inline-Body).
4. Tests zuerst schreiben, rot sehen, dann implementieren.
5. Bei Unsicherheit über Spec-Auslegung: melden, nicht improvisieren (MODEL HANDOFF).

### 0.5 Baseline-Integritäts-Vertrag (bindend)

1. Das Baseline-Fenster (7–14 Tage) startet mit dem Merge von **PR 1.3**. Währenddessen wird **kein PR gemerged, der öffentliche Tool-UX, Hub-Einstiegslogik oder CTA-Pfade ändert** — erlaubt sind ungemountete/interne Arbeit (2.1), reine lib-PRs (4.1, 5.1, 3.1) und Dashboard-PRs (1.4).
2. **PR 2.4 (Decision Launcher) merged erst nach Baseline-Ende UND frühestens 3 Tage nach 2.2** (Ein-Variablen-Regel: Pilot-UX-Effekt und Hub-Einstiegs-Effekt müssen in den Daten trennbar bleiben).
3. **Datierte Analytics-Annotationen:** PR 1.4 führt `ANALYTICS_ANNOTATIONS: { date: string; label: string }[]` ein (`lib/analytics/analytics-annotations.ts`); der Dashboard-Tab rendert sie als vertikale Marker. **Jeder UX-verändernde Merge (2.2, 2.4, 3.2, 3.3, 5.2, 5.3a–d) MUSS seine Annotation im selben PR ergänzen.** Baseline-Start/-Ende und die Session-Key-Konsolidierung (1.2) werden nachgetragen, sobald 1.4 existiert.

### 0.6 Wellenplan

| Welle | PRs | Regel |
|---|---|---|
| W1 | **1.1** solo | zentrale geteilte Dateien; Opus blockt |
| W2 | 1.2 ∥ 1.4 | file-disjunkt |
| W3 | 1.3 (startet Baseline-Uhr) ∥ 2.1 (Opus blockt) | 2.1 ist ungemountet → baseline-neutral |
| — | **Baseline-Pause 7–14 Tage** | Bauarbeit läuft weiter, keine UX-Merges (0.5) |
| W4 | **2.2** zuerst; **2.4 ≥ 3 Tage nach 2.2**; 2.3 nach 2.2 (geteilte Allowlist-Datei); ∥ 4.1 | Opus blockt 2.2/2.3/4.1 |
| W5 | 3.1 ∥ 5.1 (+ 4.1 falls nicht in W4) | drei reine lib-PRs |
| W6 | Kette 3.2→3.3→3.4 ∥ Kette 4.2→4.3→4.4 | file-disjunkt |
| W7 | 5.2 → 5.3a → (5.3b ∥ 5.3c) → 5.3d | Gate-PRs 2.3g/5.2g/5.3a-g trailing |

### 0.7 Top-Risiken (Kurzreferenz)

cockpit-Kontamination (→ Sibling + Snapshot-Test + Regressions-e2e `cockpit-tracking`) · Baseline×UX-Kollision (→ 0.5) · Hydration-False-Positives beim `ssr:false`-Ausstieg (→ schrumpfende 16-Widget-Allowlist, 2.1) · `dynamic-calculators.tsx`-Leichen (→ jeder Migrations-PR löscht seinen `Dynamic*`-Export + Grep; 5.3d beweist 0 Konsumenten) · Quiz-A/B-Integrität (→ `sfp_quiz_cta_variant`-Key + CTA-Verhalten byte-gleich, 3.2) · `tool_input_change`-Flut (→ 600 ms Debounce, FIELD_CAP 40, LEVER_CAP 10, Buckets, Volumen-Kachel 1.4) · YMYL-Quellenlücken (→ Verifikation VOR Implementierung in 3.2/5.1, Opus blockt) · WH-Fehlrechnung (→ Invariant-Vektoren + 7-Punkte-Opus-Review, 4.1) · Turbopack-Client→Action-Trap (→ `check:imports` deckt ab 2.1 `components/tools`; Widgets sprechen nur `fetch('/api/...')`).

---

# Phase 1 — tool_v1 (Vorphase)

## PR 1.1 — tool_v1 Core: Queue, Events, Validation, Route-Case

**Ziel:** Der komplette serverseitige und pure-clientseitige tool_v1-Vertrag existiert und ist getestet, ohne dass irgendein Tool ihn schon benutzt.

**Modell/Review:** Fable-Referenz (dieser Brief) → Sonnet 5 implementiert → **Opus 4.8 blockierender Review** (Prüfauftrag: die 5 AK-Aspekte unten + Schema-Vollständigkeit gegen Spec 10.2).

**Dateien:**
- Create: `lib/analytics/event-queue.ts` (generische Primitives)
- Create: `lib/analytics/tool-events.ts` (pure core)
- Modify: `lib/validation/index.ts` (additiv unter den cockpit-Schemas)
- Modify: `app/api/track/route.ts` (eine neue `case` + Gewichts-Weiche; `event_batch`-Case byte-identisch)
- Modify: `lib/tools/registry/index.ts` (additiv: `TOOL_ID_VALUES`-Export)
- Test: `__tests__/unit/event-queue.test.ts`, `__tests__/unit/tool-events.test.ts`, `__tests__/unit/tool-validation.test.ts`, `__tests__/unit/track-route-tool-batch.test.ts`, `__tests__/unit/track-contract-snapshot.test.ts`

### Referenz-Code

**`lib/analytics/event-queue.ts`** (vollständig — generische Fassung der eingefrorenen cockpit-Primitives; Logik 1:1 aus `cockpit-events.ts:324-411`, nur generisch und key-parametrisiert):

```ts
// lib/analytics/event-queue.ts
// Generic, schema-agnostic client-analytics primitives (batching, trailing
// debounce, impression dedup). tool_v1 is the first consumer. The cockpit_v1
// copies in lib/analytics/cockpit-events.ts are FROZEN — never modify them,
// never import their values here (type-only imports are fine). No React, no
// DOM, no server imports — unit-testable in plain node.

export type TimerHandle = ReturnType<typeof setTimeout> | number | object;

export interface EventQueueOptions<T> {
  send: (events: T[]) => void;
  /** Server-side hard cap per batch — keep in sync with the batch schema. */
  hardCap: number;
  maxBatch?: number;       // default 12
  flushDelayMs?: number;   // default 800
  schedule?: (fn: () => void, ms: number) => TimerHandle;
  cancel?: (handle: TimerHandle) => void;
}

export interface EventQueue<T> {
  enqueue(event: T, opts?: { immediate?: boolean }): void;
  flush(): void;
  size(): number;
}

export function createEventQueue<T>(options: EventQueueOptions<T>): EventQueue<T> {
  const maxBatch = options.maxBatch ?? 12;
  const flushDelayMs = options.flushDelayMs ?? 800;
  const schedule = options.schedule ?? ((fn, ms) => setTimeout(fn, ms));
  const cancel = options.cancel ?? ((h) => clearTimeout(h as ReturnType<typeof setTimeout>));

  let queue: T[] = [];
  let timer: TimerHandle | null = null;

  function flush(): void {
    if (timer !== null) {
      try { cancel(timer); } catch { /* fail-soft */ }
      timer = null;
    }
    while (queue.length > 0) {
      const batch = queue.slice(0, options.hardCap);
      queue = queue.slice(options.hardCap);
      try { options.send(batch); } catch { /* dropped batch is acceptable; a throwing tracker is not */ }
    }
  }

  function enqueue(event: T, opts?: { immediate?: boolean }): void {
    queue.push(event);
    if (opts?.immediate || queue.length >= maxBatch) { flush(); return; }
    if (timer === null) timer = schedule(flush, flushDelayMs);
  }

  return { enqueue, flush, size: () => queue.length };
}

export function createTrailingDebounce<T>(
  fn: (value: T) => void,
  delayMs: number,
  schedule: (cb: () => void, ms: number) => TimerHandle = (cb, ms) => setTimeout(cb, ms),
  cancel: (handle: TimerHandle) => void = (h) => clearTimeout(h as ReturnType<typeof setTimeout>),
): (value: T) => void {
  let timer: TimerHandle | null = null;
  let last: T;
  return (value: T) => {
    last = value;
    if (timer !== null) { try { cancel(timer); } catch { /* fail-soft */ } }
    timer = schedule(() => {
      timer = null;
      try { fn(last); } catch { /* fail-soft */ }
    }, delayMs);
  };
}

export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface ImpressionDeduper {
  hasSeen(key: string): boolean;
  /** Marks the key as seen. Returns true when newly marked (= fire the event). */
  markSeen(key: string): boolean;
}

/** Key-parameterized dedup (the frozen cockpit version hardcodes 'sfp_ck_imp_v1'). */
export function createImpressionDeduper(
  storageKey: string,
  storage?: KeyValueStorage | null,
  cap = 500,
): ImpressionDeduper {
  const seen = new Set<string>();
  if (storage) {
    try {
      const raw = storage.getItem(storageKey);
      if (raw) {
        const arr: unknown = JSON.parse(raw);
        if (Array.isArray(arr)) for (const k of arr) if (typeof k === 'string') seen.add(k);
      }
    } catch { /* corrupt / unavailable storage → in-memory-only dedup */ }
  }
  return {
    hasSeen: (key) => seen.has(key),
    markSeen(key) {
      if (seen.has(key)) return false;
      seen.add(key);
      if (storage) {
        try {
          let arr = [...seen];
          if (arr.length > cap) arr = arr.slice(arr.length - cap);
          storage.setItem(storageKey, JSON.stringify(arr));
        } catch { /* quota / privacy mode → in-memory only */ }
      }
      return true;
    },
  };
}
```

**`lib/analytics/tool-events.ts`** (vollständig):

```ts
// lib/analytics/tool-events.ts
// Pure logic for the Financial Decision Lab tool tracking (schema tool_v1).
// Strictly ADDITIVE sibling of cockpit_v1 — shares the analytics_events
// table and POST /api/track, but with its own event names, its own strict
// Zod schema and its own batch type 'tool_event_batch'. No React, no DOM.
// The 'use client' binding lives in lib/analytics/tool-tracking.ts (PR 1.2).

import type { ShellMode, ToolId, ToolMarket } from '@/lib/tools/registry/types';

export const TOOL_SCHEMA_VERSION = 'tool_v1';
export const TOOL_EVENT_CATEGORY = 'tool';
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
      return i === edges.length - 1 ? `gte${edges[i]}` : `${edges[i]}-${edges[i + 1]}`;
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
```

**`lib/validation/index.ts`** — additiv DIREKT NACH `TrackEventBatchSchema` (Zeile 143) einfügen; zusätzlich im bestehenden `TrackSchema` das Enum erweitern:

```ts
// TrackSchema (bestehend, Zeile 42): NUR das Enum additiv erweitern —
type: z.enum(['pageview', 'event', 'event_batch', 'tool_event_batch', 'scroll', 'time_on_page']),

// ── tool_v1 (strictly additive sibling of the cockpit_v1 schemas above) ─────
import { TOOL_ID_VALUES } from '@/lib/tools/registry';   // top-of-file import

const TOOL_EVENT_NAMES = [
  'tool_view', 'tool_start', 'tool_input_change', 'tool_first_result',
  'tool_qualified_decision', 'tool_scenario_compare', 'tool_result_share',
  'tool_report_download', 'tool_report_email', 'tool_next_action_click',
  'tool_cockpit_cta_click', 'tool_calculation_error',
] as const;

/** Strict tool_v1 properties bag — unknown keys rejected (.strict()).
 *  Keep in sync with ToolV1Properties in lib/analytics/tool-events.ts. */
const ToolV1PropertiesSchema = z
  .object({
    schemaVersion: z.literal('tool_v1'),
    toolId: z.enum(TOOL_ID_VALUES),
    market: z.enum(VALID_MARKETS),
    variantPath: z.string().max(300),
    shellMode: z.enum(['live-canvas', 'guided-journey', 'precision-worksheet']),
    resultState: z.enum(['example', 'yours', 'shared']).optional(),
    inputKey: z.string().max(60).optional(),
    inputBucket: z.string().max(40).optional(),
    controlRole: z.enum(['field', 'lever']).optional(),
    ttfvMs: z.number().int().min(0).max(86_400_000).optional(),
    qualifiedVia: z.enum(['scenario_compare', 'lever', 'next_action', 'share', 'report', 'visibility']).optional(),
    scenario: z.string().max(40).optional(),
    shareFieldCount: z.number().int().min(0).max(40).optional(),
    format: z.enum(['pdf', 'email']).optional(),
    nextActionKind: z.enum(['cockpit', 'review', 'provider', 'tool']).optional(),
    bridgeHref: z.string().max(300).optional(),
    errorKind: z.string().max(80).optional(),
  })
  .strict();

export const TrackToolEventItemSchema = z.object({
  eventName: z.enum(TOOL_EVENT_NAMES),
  eventCategory: z.literal('tool'),
  eventAction: z.string().max(40).optional(),
  eventLabel: z.string().max(300).optional(),
  eventValue: z.number().finite().optional(),
  pagePath: z.string().max(300).optional(),
  properties: ToolV1PropertiesSchema,          // Pflicht — der Vertrag gehört dem Schema
});
export type TrackToolEventItem = z.infer<typeof TrackToolEventItemSchema>;

/** Hard cap must stay in sync with TOOL_EVENT_BATCH_HARD_CAP in lib/analytics/tool-events.ts */
export const TrackToolEventBatchSchema = z.array(TrackToolEventItemSchema).min(1).max(20);
```

**`lib/tools/registry/index.ts`** — additiv (nach den bestehenden Exports):

```ts
/** Runtime tuple of all ToolIds for z.enum — single source, no duplicate list. */
export const TOOL_ID_VALUES = Object.keys(TOOL_REGISTRY) as [ToolId, ...ToolId[]];
```

**`app/api/track/route.ts`** — zwei chirurgische Ergänzungen:

1. Gewichts-Weiche (ersetzt NUR die `const weight`-Zeile; `computeTrackRateLimitWeight`-Import bleibt):

```ts
import { computeToolBatchWeight } from '@/lib/analytics/tool-events';
// ...
const weight = body.type === 'tool_event_batch'
  ? computeToolBatchWeight(rawEventsLength)
  : computeTrackRateLimitWeight(body.type, rawEventsLength);
```

2. Neue `case` NACH dem `event_batch`-Case (dieser bleibt byte-identisch):

```ts
case 'tool_event_batch': {
  // tool_v1 sibling of event_batch — own strict schema, whole-batch bot gate.
  const parsedBatch = TrackToolEventBatchSchema.safeParse(body.data.events);
  if (!parsedBatch.success) {
    return NextResponse.json({ error: 'Invalid tool event batch' }, { status: 400 });
  }
  // Every item's eventCategory is the literal 'tool' (schema-enforced) — a
  // bot UA therefore drops the WHOLE batch, no partial filtering needed.
  if (isBotUserAgent(userAgent)) {
    return NextResponse.json({ success: true, skipped: true });
  }
  const rows = parsedBatch.data.map((e) => ({
    session_id: body.sessionId,
    event_name: e.eventName,
    event_category: e.eventCategory,
    event_action: e.eventAction || null,
    event_label: e.eventLabel || null,
    event_value: e.eventValue ?? null,
    page_path: e.pagePath || null,
    properties: e.properties,
    device_type: deviceInfo.deviceType,
    country_code: countryCode,
  }));
  const { error } = await supabase.from('analytics_events').insert(rows);
  if (error) {
    if (process.env.NODE_ENV === 'development') logger.warn('Analytics: tool event batch insert failed');
  }
  return NextResponse.json({ success: true });
}
```

(`TrackToolEventBatchSchema` in den bestehenden `@/lib/validation`-Import aufnehmen.)

### Tests-first (konkret; erst rot, dann grün)

`__tests__/unit/event-queue.test.ts`:
1. flush bei `maxBatch` erreicht (12 enqueues → 1 send mit 12)
2. flush nach `flushDelayMs` via injiziertem `schedule` (kein Fake-Timer-Global nötig)
3. `immediate: true` sendet sofort inkl. Queue-Inhalt
4. 45 Events + `flush()` → sends mit 20/20/5 (hardCap-Splitting)
5. werfender `send` propagiert nie (enqueue/flush werfen nicht)
6. `createTrailingDebounce`: 3 schnelle Calls → genau 1 Aufruf mit letztem Wert
7. Deduper: `markSeen` true→false bei Wiederholung; zwei Deduper mit verschiedenen `storageKey`s teilen keinen State; Cap 500 trimmt älteste; korruptes Storage-JSON → fail-soft in-memory

`__tests__/unit/tool-events.test.ts`:
1. `buildToolEventData('tool_first_result', ctx, {ttfvMs: 3200})` → eventAction 'first_result', eventValue 3200, pagePath = variantPath, properties.schemaVersion 'tool_v1'
2. Label-Ableitungen: input_change→inputKey, qualified→qualifiedVia, next_action→nextActionKind, cockpit_cta→bridgeHref, error→errorKind
3. `funnelKey` enthält alle 4 Bestandteile in fixer Reihenfolge
4. `toInputBucket(99,'currency')==='lt100'`, `(100,'currency')==='100-250'`, `(1_500_000,'currency')==='gte1000000'`, `(-5,'currency')==='lt0'`, `(NaN,…)==='invalid'`
5. Gate: 40× field erlaubt, 41. blockiert; lever hat eigenes Budget (nach 40 fields sind 10 levers weiter erlaubt, 11. blockiert)
6. Visibility-Reducer: visible@0 → hidden@5000 → visible@8000 → `qualifiedVisibleMs(state, 10000) === 7000`; Hintergrundzeit zählt nie; doppeltes visible ist idempotent
7. Prädikat: jede der 6 Signal-Routen einzeln → qualified mit korrektem `via`; Visibility-Route erst bei ≥20000 ms UND ≥3 Inputs; `firstResultFired:false` → nie; `alreadyQualified:true` → nie
8. `computeToolBatchWeight`: 0/undefined→1, 12→12, 500→20

`__tests__/unit/tool-validation.test.ts`:
1. gültiger 3-Event-Batch parst
2. unbekannter Property-Key (`{foo:1}`) → Reject (.strict())
3. `eventCategory: 'cockpit'` im Tool-Item → Reject
4. 21 Items → Reject; 0 Items → Reject
5. `TrackSchema` akzeptiert `type: 'tool_event_batch'`
6. `toolId: 'nicht-existent'` → Reject; alle Keys aus `TOOL_ID_VALUES` → Pass
7. fehlendes `properties` → Reject (Pflichtfeld, anders als cockpit)

`__tests__/unit/track-route-tool-batch.test.ts` (Supabase via `vi.mock('@/lib/supabase/server')`, `logger` gemockt; Request-Objekte direkt an `POST`):
1. valider Batch (3 Events) → 200 `{success:true}`, `from('analytics_events')` genau 1×, `insert` genau 1× mit 3 Rows, `event_category` überall 'tool'
2. Bot-UA (`Googlebot`) → 200 `{success:true, skipped:true}`, **0** Insert-Aufrufe
3. invalider Batch (unbekannter Key) → 400, 0 Inserts
4. 20-Event-Batch von einer frischen IP: Gewicht = 20 (nach 5 solchen Requests = 100 Tokens ist der 6. → 429)
5. cockpit-`event_batch` funktioniert unverändert (Regressions-Fixture aus dem bestehenden Vertrag)

`__tests__/unit/track-contract-snapshot.test.ts` (Guard gegen cockpit-Drift):
1. `TrackSchema.shape.type.options` `toMatchInlineSnapshot` — genau `['pageview','event','event_batch','tool_event_batch','scroll','time_on_page']`
2. Golden-Fixture eines vollständigen cockpit_v1-Batches (alle 12 Eventnamen, reale Property-Beispiele) → `TrackEventBatchSchema.safeParse(...).success === true`
3. cockpit-Item mit unbekanntem Key → weiterhin Reject (strict bleibt strict)

### Akzeptanzkriterien

- [ ] **Rate-Limit-Gewichtung:** `tool_event_batch` kostet 1 Token pro Event (auf 20 geclampt) — per Unit-Test am Route-Handler bewiesen (Test 4 oben); cockpit-Gewichtung unverändert
- [ ] **Bot-Gate:** Bot-UA verwirft den GANZEN Batch (200 + `skipped:true`, 0 DB-Aufrufe) — kein partielles Filtern
- [ ] **strict-Zod-Sibling:** `ToolV1PropertiesSchema.strict()` lehnt unbekannte Keys ab; kein cockpit-Schema wurde angefasst (Diff-Nachweis im PR-Text)
- [ ] **EIN Insert pro Batch:** genau ein `insert`-Aufruf mit N Rows (Test 1)
- [ ] **Snapshot-Test des cockpit-Schemas** grün (Enum-Snapshot + Golden-Fixture)
- [ ] `git diff main -- lib/analytics/cockpit-events.ts lib/analytics/cockpit-tracking.ts` leer; `route.ts`-Diff besteht nur aus Import, Gewichts-Weiche und neuer `case`
- [ ] Kein Client/UI-Code berührt — dieser PR ist unsichtbar für Nutzer
- [ ] `npx playwright test e2e/cockpit-tracking.spec.ts` grün (Regressions-Gate)

### Gates

Standard-Gates 0.2 + `npx playwright test e2e/cockpit-tracking.spec.ts` + Opus-Review-Protokoll im PR-Text.

---

## PR 1.2 — Client-Binding + Session-Key-Konsolidierung

**Ziel:** `'use client'`-Binding (`tool-tracking.ts`) macht den 1.1-Vertrag von React aus nutzbar, und alle Komponenten teilen eine Session-ID-Quelle.

**Modell/Review:** Sonnet 5; Fable-Review (kein Opus nötig — Muster ist cockpit-tracking 1:1).

**Dateien:**
- Create: `lib/analytics/tool-tracking.ts` (`'use client'`)
- Modify: `components/marketing/tracked-affiliate-link.tsx`, `components/marketing/trust-block-tracker.tsx`, `components/marketing/xray-score.tsx`, `components/marketing/comparison-hub.tsx` (die 4 `sfp_sid`/`'sfp_session'`-Nutzer, grep-verifiziert) + `components/tools/money-leak-scanner/MoneyLeakScanner.tsx` (eigene `sfp_session_id`-Duplikat-Implementierung) — je NUR die Session-ID-Zeilen auf `getOrCreateAnalyticsSessionId()` aus `@/lib/analytics/session` umstellen (das Quiz-Duplikat in `broker-finder-quiz.tsx` bleibt bis 3.2!)
- Test: `__tests__/unit/tool-tracking.test.ts`, `e2e/tool-tracking.spec.ts` (JS-on via `test.use({ javaScriptEnabled: true })`, Route-Intercept auf `/api/track`)

**Referenz-Signaturen** (Implementierungsmuster = `lib/analytics/cockpit-tracking.ts`, insbesondere Killswitch-, sendBeacon→keepalive- und pagehide-Handling dort 1:1 übernehmen):

```ts
'use client';
// lib/analytics/tool-tracking.ts
import { getOrCreateAnalyticsSessionId } from '@/lib/analytics/session';
import { createEventQueue, createImpressionDeduper, createTrailingDebounce } from '@/lib/analytics/event-queue';
import { buildToolEventData, funnelKey, isQualifiedDecision, advanceQualifiedVisibility, /* … */ } from '@/lib/analytics/tool-events';

export interface ToolTracker {
  trackView(): void;                                        // dedupe 1×/funnelKey (Deduper-Key TOOL_IMPRESSION_STORAGE_KEY)
  trackStart(inputKey: string): void;                       // dedupe 1×/funnelKey
  trackInputChange(inputKey: string, rawValue: number, kind: InputBucketKind, role?: ControlRole): void; // 600ms-Debounce PRO inputKey, Gate, Bucket
  trackFirstResult(): void;                                 // dedupe; ttfvMs = now − viewAt
  trackScenarioCompare(scenario: string): void;
  trackShare(shareFieldCount: number): void;
  trackReport(format: 'pdf' | 'email'): void;
  trackNextAction(kind: NextActionKind, href: string): void; // kind 'cockpit' → feuert ZUERST next_action, DANN tool_cockpit_cta_click; beide immediate:true
  trackError(errorKind: string): void;
  bindResultVisibility(el: Element): () => void;            // IntersectionObserver threshold 0.5 + visibilitychange → Reducer; Rückgabe = cleanup
  flush(): void;                                            // für pagehide
}

export function createToolTracker(ctx: ToolContext): ToolTracker;
export function useToolTracking(ctx: ToolContext): ToolTracker;  // stable via useRef; bindet pagehide-flush
```

Versand: `navigator.sendBeacon('/api/track', blob)` → Fallback `fetch(..., { keepalive: true })`; Payload `{ type: 'tool_event_batch', sessionId, data: { events } }`. GA-Mirror NUR für `tool_view`, `tool_qualified_decision`, `tool_cockpit_cta_click` (gtag-Guard wie im cockpit-Muster) — **keine Legacy-Aliase**. Qualified-Check läuft nach jedem Signal-Event und auf einem 1-s-Intervall solange Visibility akkumuliert; feuert genau 1× (persistiert im Deduper unter `q|`-Präfix des funnelKey).

**Tests-first:** Unit: trackInputChange debounced pro Feld (2 Felder parallel = 2 Events), Gate greift, View/Start/FirstResult-Dedupe über zwei Tracker-Instanzen mit gleichem Storage, cockpit-CTA-Doppelfeuer-Reihenfolge, Qualified feuert 1× (via mock storage). e2e: Seite mit Test-Harness (nutzt das in 1.3 instrumentierte Money-Leak NICHT — stattdessen minimale Playwright-Page-Evaluate-Bindung gegen `createToolTracker`) → intercepted `/api/track`-POST hat `type:'tool_event_batch'` und valides Item-Shape.

**Akzeptanzkriterien:**
- [ ] Grep-Gate: `rg "sfp_sid|'sfp_session'" components lib` liefert 0 Treffer (Ausnahme: `broker-finder-quiz.tsx`, dokumentiert bis 3.2)
- [ ] Kein visuelles/funktionales Delta in den 5 umgestellten Komponenten (nur Session-ID-Quelle)
- [ ] GA-Mirror-Whitelist exakt 3 Events; kein `gtag`-Call für andere
- [ ] `e2e/cockpit-tracking.spec.ts` grün
- [ ] Hinweis im PR-Text: Same-Session-Joins brechen am Deploy-Tag (Annotation folgt in 1.4)

**Gates:** Standard 0.2 + `e2e/tool-tracking.spec.ts` lokal (CI-Job kommt erst mit 2.1 — im PR-Text vermerken).

---

## PR 1.3 — Instrumentierung Money Leak + Quiz + Trading Cost → Baseline-Start

**Ziel:** Die drei bereits meistgenutzten Tools senden tool_v1-Events — ohne jede sichtbare UI-Änderung — und starten damit die 7–14-Tage-Baseline.

**Modell/Review:** Sonnet 5; Fable-Review mit explizitem „keine UI-Änderung"-Check.

**Dateien:**
- Modify: `components/tools/money-leak-scanner/MoneyLeakScanner.tsx` (+ ggf. Unterkomponenten, in denen die kaputten Calls liegen): **alle `fetch('/api/track-cta', …)`-Aufrufe ersatzlos entfernen** (sie liefern seit jeher 400) und durch `useToolTracking` ersetzen; die funktionierenden `/api/tools/money-leak/{scan,unlock}`-Calls bleiben byte-gleich
- Modify: `components/tools/broker-finder-quiz.tsx`: tool_v1 NUR ZUSÄTZLICH — die bestehenden `quiz_*`-Single-Events, der eigene `sfp_session_id`-sessionStorage-Block und der A/B-Key `sfp_quiz_cta_variant` bleiben **byte-gleich** (Konsolidierung erst 3.2)
- Modify: Trading-Cost-Widget (Datei per Registry-`variants`-Pfad → Page-Import auflösen): view/start/input_change/first_result
- Modify: `lib/analytics/tool-events.ts`: `export const TOOL_BASELINE_START = '<MERGE-DATUM ISO>';` (Agent setzt das reale Merge-Datum vor dem Merge; Fable korrigiert beim Push falls nötig)
- Test: `e2e/tool-instrumentation.spec.ts` (JS-on): je Tool wird `tool_view` gebatcht gesendet; **kein** Request an `/api/track-cta` mehr; Quiz sendet weiterhin seine `quiz_started`-Singles UNVERÄNDERT parallel

**Referenz:** Event-Mapping je Tool: `tool_view` beim Mount (Deduper), `tool_start` bei erster echter Feldinteraktion, `tool_input_change` (kind je Feld: currency/percent/years/count), `tool_first_result` beim ersten Ergebnis-Render aus Nutzereingaben, Money Leak zusätzlich `tool_next_action_click` auf den bestehenden Ergebnis-CTAs (kind nach Ziel). `ToolContext` kommt aus der Registry (`getTool(id)` + `usePathname()`-Variante bzw. Props von der Page — RSC übergibt `toolId`/`market`/`variantPath`/`shellMode` als Props, Client leitet nichts her).

**Tests-first:** e2e-Spec zuerst (rot: track-cta-Call existiert noch / kein tool_event_batch), dann instrumentieren.

**Akzeptanzkriterien:**
- [ ] „Keine UI-Änderung"-Beweis im PR-Text: DOM-Snapshot/Screenshot-Diff der 3 Tool-Routen leer (Playwright `toHaveScreenshot` oder HTML-Diff)
- [ ] `rg "track-cta" components/tools/money-leak-scanner` → 0 Treffer
- [ ] Quiz: `sfp_quiz_cta_variant`-Logik und `quiz_*`-Eventnamen im Diff unberührt
- [ ] `TOOL_BASELINE_START` gesetzt; PR-Text erklärt Baseline-Fenster-Regeln (0.5)
- [ ] Ab Merge: KEINE UX-verändernden Merges bis Baseline-Ende (0.5)

**Gates:** Standard 0.2 + `e2e/tool-instrumentation.spec.ts` + `e2e/cockpit-tracking.spec.ts`.

---

## PR 1.4 — Dashboard-Tab `/dashboard/analytics/tools`

**Ziel:** Alle tool_v1-Metriken (Spec 10.4) inkl. North-Star QDR, Health gegen das Registry-Manifest, Volumen-Wache und datierte Annotations-Marker sind im Dashboard sichtbar.

**Modell/Review:** Sonnet 5; Fable-Review.

**Dateien:**
- Create: `lib/analytics/analytics-annotations.ts` — `export const ANALYTICS_ANNOTATIONS: { date: string; label: string }[]` (initial: Baseline-Start aus `TOOL_BASELINE_START`, Session-Key-Konsolidierung mit 1.2-Merge-Datum)
- Create: `lib/actions/tool-analytics.ts` (`'use server'` + `'server-only'`; Muster `lib/actions/cockpit-analytics.ts`: `fetchAllPaged` PAGE_SIZE 10_000 / HARD_CAP 100_000, select-then-aggregate-in-JS auf `analytics_events` mit `event_category = 'tool'`)
- Create: `app/api/dashboard/tool-analytics/route.ts` (GET-Proxy mit Dashboard-Session-Check via `isValidDashboardSessionValue(cookieValue, DASHBOARD_SECRET)` — Client-Komponente FETCHT, importiert NIE die Action; bekannte Falle: Wert-Import aus lib/actions lässt Dashboard-Suspense ewig hängen)
- Create: `app/(dashboard)/dashboard/analytics/tools/page.tsx` (`force-dynamic`), `components/dashboard/tool-analytics.tsx` (`'use client'`, recharts erlaubt, `WidgetErrorBoundary` um jedes Widget)
- Modify: `app/(dashboard)/layout.tsx` (Nav-Eintrag bei den Analytics-Links, ~Z. 79), `components/dashboard/command-palette.tsx` (~Z. 61)
- Test: `__tests__/unit/tool-analytics.test.ts` (Aggregationslogik als pure Funktionen exportieren + testen), `e2e/dashboard-smoke`-Erweiterung falls vorhanden

**Referenz-Signaturen:**

```ts
// lib/actions/tool-analytics.ts
export interface ToolAnalyticsFilters { days: 7 | 14 | 30 | 90; market?: ToolMarket; toolId?: ToolId; device?: string }
export interface ToolFunnelRow {
  toolId: ToolId; market: ToolMarket; views: number; starts: number;
  firstResults: number; qualified: number; ttfvMedianMs: number | null;
  completionRate: number; qdr: number; resultToActionRate: number;
  shareReportRate: number; scenarioComparesPerResultSession: number;
}
export interface ToolHealthRow { toolId: ToolId; market: ToolMarket; path: string;
  status: 'reporting' | 'silent' | 'low_traffic' | 'no_traffic' }   // silent = ≥5 Pageviews, 0 Events
export interface ToolVolumeRow { day: string; eventName: string; rows: number }
export async function getToolAnalytics(filters: ToolAnalyticsFilters): Promise<{ success: boolean;
  data?: { funnel: ToolFunnelRow[]; health: ToolHealthRow[]; volume: ToolVolumeRow[];
           mobileDropoff: { toolId: ToolId; value: number | null }[];
           annotations: { date: string; label: string }[] }; error?: string }>
```

Health nutzt `getExpectedTrackingManifest()` (29 funktionale Einträge) × Ist-Events × `page_views` je Pfad. Kacheln: Funnel-Tabelle (QDR prominent als North-Star), TTFV, Mobile Drop-off (`1 − completion(mobile)/completion(desktop)`, null bei <50 Desktop-Views), Volumen-Wache (rows/day je event_name, Warnschwelle >5.000/Tag für `tool_input_change`), Health-Grid, Annotations als vertikale `ReferenceLine`s in den Zeitreihen, „Return within session window" ehrlich beschriftet, Platzhalter-Kacheln EPC/RPQS/Approval/Postback-Abdeckung mit Label „pending postback integration".

**Tests-first:** Aggregation pure testen: Funnel-Raten aus synthetischen Rows (inkl. Division-by-zero → 0), Median-TTFV ungerade/gerade Anzahl, Health-Klassifikation aller 4 Stati, Volumen-Gruppierung, Dedupe-Scope (gleiche Session×Tool×Markt×Pfad zählt 1 View).

**Akzeptanzkriterien:**
- [ ] `/dashboard/analytics/tools` rendert mit 0 Events sinnvoll („no_traffic"-Health, leere Funnel-Staten — kein Crash)
- [ ] North-Star QDR als erste Kachel; Annotationen sichtbar, Baseline-Fenster als schraffierter Bereich
- [ ] `/dashboard/tools/money-leak` (Ops-Seite) unberührt
- [ ] Client-Komponente enthält keinen `lib/actions`-Import (fetch-only)
- [ ] Nav + Command-Palette führen zur Seite

**Gates:** Standard 0.2 + Dashboard lokal mit Prod-Daten-Read verifiziert (dev liest PROD-Supabase — nur SELECTs!).

---

# Phase 2 — ToolShell + Piloten + Decision Launcher

## PR 2.1 — Shell-Fundament (ungemountet)

**Ziel:** Das komplette Shell-Inventar (Rahmen, 3 Modus-Layouts, Financial-Field-Familie, Result-Panel-State-Machine, Chart-Geometrie, Tokens) existiert getestet im Repo, ist aber **nirgends gemountet** — risikofrei revertbar und baseline-neutral.

**Modell/Review:** Fable-Referenz (dieser Brief) → Sonnet 5 → **Opus 4.8 blockierender Review** (Fokus: SSR/Hydration-Vertrag, A11y-Verträge, Token-Treue zu hifi-tokens.css).

**Dateien:**
- Create: `lib/tools/shell-types.ts`
- Create: `lib/calc/chart-geometry.ts`
- Create: `components/tools/shell/`: `tool-shell.tsx`, `tool-trust-strip.tsx`, `live-canvas.tsx`, `guided-journey.tsx`, `precision-worksheet.tsx`, `input-panel.tsx`, `fields/base-field.tsx`, `fields/currency-field.tsx`, `fields/percentage-field.tsx`, `fields/duration-field.tsx`, `fields/integer-field.tsx`, `fields/estimate-range.tsx`, `fields/segmented-control.tsx`, `result-panel.tsx`, `scenario-chart.tsx`, `impact-levers.tsx`, `assumptions-drawer.tsx`, `next-best-action.tsx`, `share-result.tsx`, `result-mini-bar.tsx`
- Modify: `app/globals.css` (Token-Block), `tailwind.config.ts` (`theme.extend`-Mapping)
- Modify: `scripts/check-client-server-imports.sh` (DIRS += `components/tools`), `scripts/check-hydration-safety.sh` (pauschale `components/tools/`-Exemption → explizite 16-Widget-Legacy-Allowlist; `components/tools/shell/` und künftig `hub/` voll gedeckt)
- Modify: `.github/workflows/pr-checks.yml` (EIN neuer Job `tool-e2e`)
- Test: `__tests__/unit/chart-geometry.test.ts`, `__tests__/unit/result-panel-machine.test.ts`, `__tests__/unit/aria-live-throttle.test.ts`, `__tests__/unit/field-format.test.ts` — **kein e2e in 2.1** (die Shell ist nirgends gemountet; es wird KEINE Preview-/Harness-Route angelegt). RSC-Komponenten zusätzlich per Render-zu-String-Smoke (`react-dom/server` `renderToStaticMarkup`) gegen ein Beispiel-`ToolResult` testen; das erste echte JS-off-e2e kommt mit dem Piloten 2.2

> **Wichtig:** `tool-json-ld.tsx` und `web-application-schema.tsx` existieren bereits (PR 0.7) — NICHT neu bauen.

### Referenz-Code

**`lib/tools/shell-types.ts`** (vollständig — Spec 8.1 wortgleich + Visual-Typen):

```ts
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
  apply?: Partial<Record<string, number>>;  // optional input mutation (live application)
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
```

**`lib/calc/chart-geometry.ts`** — pure SVG-Geometrie (kein React). Vollständige Referenz für die Korridor-Funktion; die übrigen folgen demselben Muster (normierte viewBox, Rückgabe = fertige Pfad-/Rect-Daten):

```ts
// lib/calc/chart-geometry.ts
// Pure geometry for the signature visuals — consumed by ScenarioChart (RSC
// and island render the SAME markup from the same data) and by the hub
// miniatures (buildMini). No React, no DOM, no Date.now.

export interface ChartFrame { width: number; height: number; padX: number; padY: number }
export const DEFAULT_FRAME: ChartFrame = { width: 640, height: 280, padX: 44, padY: 24 };

export interface CorridorLayout {
  /** SVG path 'd' per scenario key, drawn in the frame's coordinate space. */
  paths: { key: string; d: string }[];
  /** Filled band between conservative and optimistic (single path). */
  bandD: string;
  markers: { x: number; y: number; label: string }[];
  xTicks: { x: number; label: string }[];
  yTicks: { y: number; label: string }[];
}

export function buildCorridorPath(
  series: { key: string; rows: { x: number; y: number }[] }[],
  markers: { x: number; label: string }[],
  frame: ChartFrame = DEFAULT_FRAME,
  formatY: (v: number) => string = (v) => String(v),
): CorridorLayout {
  const all = series.flatMap((s) => s.rows);
  if (all.length === 0) return { paths: [], bandD: '', markers: [], xTicks: [], yTicks: [] };
  const xMin = Math.min(...all.map((r) => r.x));
  const xMax = Math.max(...all.map((r) => r.x));
  const yMax = Math.max(...all.map((r) => r.y), 1);
  const innerW = frame.width - 2 * frame.padX;
  const innerH = frame.height - 2 * frame.padY;
  const sx = (x: number) => frame.padX + (xMax === xMin ? 0 : ((x - xMin) / (xMax - xMin)) * innerW);
  const sy = (y: number) => frame.height - frame.padY - (y / yMax) * innerH;
  const toPath = (rows: { x: number; y: number }[]) =>
    rows.map((r, i) => `${i === 0 ? 'M' : 'L'}${sx(r.x).toFixed(1)},${sy(r.y).toFixed(1)}`).join(' ');

  const cons = series.find((s) => s.key === 'conservative')?.rows ?? [];
  const opti = series.find((s) => s.key === 'optimistic')?.rows ?? [];
  const bandD = cons.length && opti.length
    ? `${toPath(opti)} ${[...cons].reverse().map((r) => `L${sx(r.x).toFixed(1)},${sy(r.y).toFixed(1)}`).join(' ')} Z`
    : '';

  const yStep = yMax / 4;
  return {
    paths: series.map((s) => ({ key: s.key, d: toPath(s.rows) })),
    bandD,
    markers: markers.map((m) => {
      const row = series.find((s) => s.key === 'base')?.rows.find((r) => r.x === m.x)
        ?? all.find((r) => r.x === m.x);
      return { x: sx(m.x), y: row ? sy(row.y) : frame.padY, label: m.label };
    }),
    xTicks: [xMin, Math.round((xMin + xMax) / 2), xMax].map((x) => ({ x: sx(x), label: String(x) })),
    yTicks: [0, 1, 2, 3, 4].map((i) => ({ y: sy(i * yStep), label: formatY(i * yStep) })),
  };
}

// Same pattern — signatures binding, implementation analogous:
export interface BarLayout { bars: { key: string; label: string; x: number; y: number; w: number; h: number; emphasis: boolean }[]; totalLabel?: { x: number; y: number; text: string } }
export function buildBarLayout(bars: { key: string; label: string; value: number; emphasis?: boolean }[], frame?: ChartFrame): BarLayout;

export interface StackLayout { segments: { key: string; label: string; x: number; w: number }[]; capX?: number }
export function buildStackLayout(segments: { key: string; label: string; value: number }[], cap?: number, frame?: ChartFrame): StackLayout;

export interface RangeLayout { trackX: number; trackW: number; bandX: number; bandW: number; markerX?: number }
export function buildRangeLayout(low: number, high: number, axisLow: number, axisHigh: number, marker?: number, frame?: ChartFrame): RangeLayout;

/** Hub miniature: 120×64 frame, reduced tick set, same visual kinds. */
export function buildMini(data: import('@/lib/tools/shell-types').ScenarioVisualData): { viewBox: string; body: /* kind-specific layout */ CorridorLayout | BarLayout | StackLayout | RangeLayout };
```

**Token-Block** — den kompletten `:root`-Block aus `docs/superpowers/specs/assets/2026-07-12-fdl/hifi/hifi-tokens.css` **1:1** (inkl. `--tool-radius-control: 6px`, `--tool-radius-panel: 8px`, Surfaces, Borders, `--tool-motion: 200ms cubic-bezier(0.2,0,0,1)`, Warning-Set `--sfp-warning-bg/-border/-foreground/-icon`, Typo-Werte) nach `app/globals.css` übernehmen; `tailwind.config.ts` `theme.extend` mappt: `borderRadius: { 'tool-control': 'var(--tool-radius-control)', 'tool-panel': 'var(--tool-radius-panel)' }`, `colors: { 'tool-surface': 'var(--tool-surface)', … , 'warning-bg': 'var(--sfp-warning-bg)', … }`, `transitionTimingFunction`/`transitionDuration` für `--tool-motion`. **Keine Farbverläufe, keine Hover-Translationen, `prefers-reduced-motion` deaktiviert Transitions.**

**`fields/base-field.tsx`** (Kern der Field-Familie; alle 6 Typen komponieren sie):

```tsx
'use client';
// components/tools/shell/fields/base-field.tsx
import { useId } from 'react';

export interface BaseFieldProps {
  label: string;
  inputKey: string;                       // = analytics inputKey
  help?: string;
  error?: string | null;
  notSureHint?: string;                   // renders an "I'm not sure" estimate affordance
  required?: boolean;
  children: (ids: { inputId: string; helpId?: string; errorId?: string }) => React.ReactNode;
}

export function BaseField({ label, help, error, required, children }: BaseFieldProps) {
  const inputId = useId();
  const helpId = help ? `${inputId}-help` : undefined;
  const errorId = error ? `${inputId}-err` : undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-[var(--sfp-ink)]">
        {label}{required ? <span aria-hidden="true"> *</span> : null}
      </label>
      {children({ inputId, helpId, errorId })}
      {help ? <p id={helpId} className="text-xs text-[var(--sfp-slate)]">{help}</p> : null}
      {error ? <p id={errorId} role="alert" className="text-xs text-[var(--sfp-red)]">{error}</p> : null}
    </div>
  );
}
```

`CurrencyField` (Referenz; Percentage/Duration/Integer analog mit eigenem Suffix/Step/Parser):

```tsx
'use client';
// components/tools/shell/fields/currency-field.tsx
// Numeric direct entry ALWAYS; optional coupled slider is an add-on, never
// the only input (SPEC design rule 7). Locale formatting via Intl.NumberFormat.
export interface CurrencyFieldProps extends Omit<BaseFieldProps, 'children'> {
  value: number | '';
  onChange: (v: number | '') => void;    // parent debounces analytics via trackInputChange
  currency: ToolCurrency;
  locale: string;                        // 'en-US' | 'en-GB' | 'en-CA' | 'en-AU' — from market
  min?: number; max?: number; step?: number;
  slider?: { min: number; max: number; step: number };
}
// Implementation notes (binding):
// - <input inputMode="decimal"> + visible currency affix; parse on blur, keep raw digits while typing
// - h-11 (44px touch target), rounded-tool-control, border-[var(--tool-border)]
// - value display uses font-variant-numeric: tabular-nums (class 'tabular-nums')
// - slider (when present): <input type="range"> synced BOTH directions, aria-label `${label} slider`
// - aria-invalid + aria-describedby wired from BaseField ids
```

**`result-panel.tsx`** — Vertrag (State-Machine ist `advancePanelState`; Sektionen in FIXER Reihenfolge):

```tsx
'use client';
export interface ResultPanelProps {
  state: PanelState;
  result: ToolResult | null;             // null except in result/stale-data (initial: worked example passed separately)
  exampleResult: ToolResult;             // SSR worked example — rendered while state ∈ {initial, ready}
  onLeverApply?: (lever: Lever) => void; // fires trackInputChange(controlRole:'lever')
  announce: (sentence: string) => void;  // throttled aria-live (see below)
  children?: never;
}
// Binding render order inside the panel (SPEC design rule 3):
// [state chip: Example result / Your result / Shared scenario / Stale data / Error]
// (1) answer sentence → (2) primary number + range (max 44/52, tabular-nums)
// (3) <ScenarioChart data={result.scenario}/> → (4) <ImpactLevers levers/> (exactly 3)
// (5) <AssumptionsDrawer assumptions sources/> → (6) <NextBestAction …/> (exactly one)
// states insufficient-data/error render guidance INSTEAD of (2)-(6), never a blank panel.
```

aria-live-Drossel als pure Funktion (eigene Datei ODER in `result-panel.tsx` exportiert, Unit-Test Pflicht):

```ts
/** Returns a function that forwards at most one announcement per intervalMs
 *  (trailing — the LAST sentence wins), and never announces during drag. */
export function createLiveAnnouncer(
  setText: (s: string) => void,
  intervalMs = 1000,
  schedule = (fn: () => void, ms: number) => setTimeout(fn, ms),
): { announce: (s: string) => void; setDragging: (d: boolean) => void }
```

**Übrige Komponenten — bindende Prop-Verträge** (Implementierung nach Spec 6.x/7.3 + High-Fi-PNGs):

```ts
// tool-shell.tsx (RSC) — gemeinsamer Rahmen
interface ToolShellProps {
  toolId: ToolId; market: ToolMarket;
  breadcrumb: { label: string; href: string }[];
  h1: string; benefit: string;                       // 1 Satz
  estimatedMinutes: number;
  verifiedAt: string;                                // min(verifiedAt) — an TrustStrip
  methodologyHref: string; privacyHref: string;
  children: React.ReactNode;                         // Modus-Layout
  belowFold: React.ReactNode;                        // RSC: Methodik, Worked Example, FAQ, Quellen
}
// Workspace: max-w-[1220px], grid-cols-12, gap-6 lg:gap-8; KEINE verschachtelten Cards.

// tool-trust-strip.tsx (RSC): { market, estimatedMinutes, verifiedAt } → "US · ~3 min · Data verified 12 Jul 2026"

// live-canvas.tsx: { inputs: ReactNode; result: ReactNode } — Inputs 5 Spalten, Result 7, Result dauerhaft sichtbar
// guided-journey.tsx ('use client'): { steps: { key; title; content: ReactNode }[]; interim?: ReactNode; result: ReactNode }
//   — Fortschritt (Step x of y), Zwischenergebnis-Slot, Ergebnis-Canvas nach letztem Schritt
// precision-worksheet.tsx: { sections: { key; title; content }[]; assumptions: ReactNode; result: ReactNode }
//   — Abschnitts-Formular links, Annahmen-Spalte, Detail-Resultat

// scenario-chart.tsx (RSC-fähig, KEIN 'use client'): { data: ScenarioVisualData; mini?: boolean }
//   — pures SVG aus chart-geometry; direkte Labels; <title>+<desc> = textAlternative;
//   Szenarien via Strichmuster (stroke-dasharray) ZUSÄTZLICH zur Farbe unterscheidbar
// impact-levers.tsx ('use client'): { levers: [Lever,Lever,Lever]; onApply?: (l: Lever) => void }
// assumptions-drawer.tsx (RSC): { assumptions: AssumptionEntry[]; sources: RuleSourceRef[] } — natives <details>,
//   je Quelle eigenes Effective + Verified Date
// next-best-action.tsx (RSC + Tracker-Leaf wie components/marketing/cockpit-verdict-cta.tsx):
//   { action: ToolResult['nextAction']; ctx: ToolContext } — bei kind 'cockpit' feuert der Leaf ZUERST
//   tool_next_action_click, DANN tool_cockpit_cta_click (beide immediate); niemals preventDefault
// share-result.tsx ('use client'): { toolId; buildPayload: () => Record<string, number|string> | null }
//   — 2.1 liefert nur UI-Hülle + Vorschau-Vertrag; Codec kommt in 2.3 (Interface: encodeShare/decodeShare)
// result-mini-bar.tsx ('use client'): { visible: boolean; summary: string; onJump: () => void }
//   — mobil, erst nach belastbarem Resultat, nie 2-zeilig (High-Fi v2: nowrap+ellipsis), verdeckt keine Inhalte
```

**Guard-Änderungen:**
- `check-client-server-imports.sh`: `DIRS=(lib/mdx components/marketing components/content components/ui components/tools)` (verifiziert: kein Bestands-Widget importiert Server Actions — MoneyLeakScanner fetcht nur)
- `check-hydration-safety.sh`: `*/components/tools/*`-Exemption ersetzen durch explizite Datei-Allowlist der 16 Legacy-Widgets (Kommentar: „shrinking allowlist — jeder Migrations-PR löscht seine Zeile; leer + Mechanik entfernt in 5.3d")

**CI-Job `tool-e2e`** in `.github/workflows/pr-checks.yml` (Muster: bestehender `cockpit-tracking`-Job; PORT 3002; Path-Filter `components/tools/**, lib/tools/**, lib/calc/**, lib/rules/**, lib/decision/**, lib/analytics/tool*, lib/analytics/event-queue.ts, e2e/tool-*`): baut Standalone, startet Server, läuft `npx playwright test e2e/tool-seo.spec.ts e2e/tool-tracking.spec.ts e2e/tool-instrumentation.spec.ts` (Liste wächst mit den Phasen).

### Tests-first (konkret)

1. `chart-geometry.test.ts`: Korridor mit 2 Serien × 3 Punkten → Pfade beginnen mit `M`, Band schließt mit `Z`, Marker auf Base-Serie gesnappt; leere Serie → leere Layouts (kein Throw); yMax 0 → kein NaN (yMax-Floor 1); Bar/Stack/Range-Grundfälle; `buildMini` viewBox `0 0 120 64`
2. `result-panel-machine.test.ts`: alle Übergänge aus dem Referenz-Code, insbesondere: `result` + unvollständiger Input → `insufficient-data`; `CALC_SUCCEEDED{stale:true}` → `stale-data`; `RESET` aus jedem State → `initial`
3. `aria-live-throttle.test.ts`: 5 announce in 300 ms → genau 1 sofort + 1 trailing mit letztem Satz; `setDragging(true)` unterdrückt vollständig, Release announced letzten Stand
4. `field-format.test.ts`: Currency-Parser („1,250.50" → 1250.5 bei en-US; „£12,000" strippt Affix), Locale-Formatierung je Markt, min/max-Clamp erst on blur

### Akzeptanzkriterien

- [ ] **Ändert keine öffentliche Tool-UX — Shell nirgends gemountet; Screenshot-Diff der 20 Tool-Routen leer** (Playwright-Screenshot-Vergleich gegen main im PR-Text belegt)
- [ ] Token-Werte byte-gleich mit `hifi-tokens.css` (Diff-Ausgabe im PR-Text); keine Gradients, keine Hover-Translationen, reduced-motion respektiert
- [ ] Kein `use client` auf `tool-shell.tsx`, `scenario-chart.tsx`, `assumptions-drawer.tsx`, `tool-trust-strip.tsx` (RSC-Vertrag)
- [ ] Beide Guards laufen grün MIT neuem Scope; Allowlist enthält exakt die 16 Legacy-Widgets
- [ ] CI-Job `tool-e2e` läuft in diesem PR (Path-Filter matcht) und ist grün
- [ ] `npm run build`: First-Load-JS der Tool-Routen unverändert (Shell ist tree-shaken, da unreferenziert)
- [ ] Kein framer-motion-Import in `components/tools/shell/` (Motion nur via `--tool-motion`-CSS)

**Gates:** Standard 0.2 + Opus-Review-Protokoll + Screenshot-Diff-Nachweis.

---

## PR 2.2 — Pilot: Money Leak Scanner → LiveCanvas

**Ziel:** Das erste Major Tool läuft komplett in der Shell (SSR-Worked-Example, Result Contract, Design-AK) — das dokumentierte 4-Schritt-Migrationsmuster für alle weiteren Tools.

**Merge-Regel:** NACH Baseline-Ende (0.5). **Modell/Review:** Sonnet 5 → **Opus-Finalprüfung** (SSR/No-JS + Event-Parität).

**Dateien:**
- Create: `lib/tools/results/money-leak-result.ts` — Adapter `buildMoneyLeakResult(inputs: MoneyLeakInputs): ToolResult` ÜBER dem bestehenden `lib/money-leak/*` (Engine wird NICHT neu gebaut; `answer`/`primary.range`/exakt 3 Levers/`scenario: {kind:'bars'}` aus den vorhandenen Score-Engine-Ausgaben abgeleitet; `nextAction` als lokale Konstante mit dem Spec-4.5-Wert — Umstellung auf `getBridge` erfolgt erst in 3.4, das Registry-Feld existiert hier noch nicht)
- Modify: 4 Money-Leak-Pages (`app/(marketing)/tools/money-leak-scanner/page.tsx` + uk/ca/au): RSC-Komposition `ToolShell > LiveCanvas > {InputPanel-Island, ResultPanel-Island}` + serverseitiges Worked Example (`exampleResult = buildMoneyLeakResult(EXAMPLE_INPUTS)`, gelabelt „Example result") + BelowFold (bestehende Methodik/FAQ-Inhalte übernehmen)
- Modify: neue Island `components/tools/money-leak-scanner/money-leak-canvas.tsx` (ersetzt `MoneyLeakScanner.tsx`-Monolith; scan/unlock-API-Calls ziehen 1:1 um; Unlock-E-Mail-Formular erst nach sichtbarem Ergebnis)
- Delete: alte Money-Leak-Komponenten + deren `Dynamic*`-Export in `components/tools/dynamic-calculators.tsx` + Allowlist-Zeile in `check-hydration-safety.sh`
- Modify: `lib/analytics/analytics-annotations.ts` (+ `{date: <merge>, label: 'Money Leak → Shell (2.2)'}`)
- Test: `e2e/tool-shell-money-leak.spec.ts` (JS-off: H1, Trust-Strip, „Example result"-Chip, Answer-Satz, SVG-Chart, 3 Levers, AssumptionsDrawer, genau 1 NextAction im Server-HTML) + Event-Paritäts-Erweiterung in `e2e/tool-instrumentation.spec.ts` (JS-on: gleiche Events wie 1.3 feuern aus der Shell)

**Tests-first:** JS-off-Spec zuerst gegen die alte Seite laufen lassen (rot: kein Example-Chip/kein SSR-Ergebnis), dann migrieren.

**Akzeptanzkriterien:**
- [ ] No-JS zeigt das komplette Worked Example (Playwright-Default `javaScriptEnabled:false`)
- [ ] `/api/tools/money-leak/{scan,unlock}` Request/Response byte-kompatibel (bestehende Consumer-Verträge unberührt)
- [ ] Event-Parität zu 1.3: view/start/input_change/first_result/next_action feuern identisch benannt
- [ ] Design-AK (Spec 6.6) bei 1280×720 und 390×844 erfüllt: H1+Nutzen, Trust-Signal, erste Eingabe und Ergebnisbeginn sichtbar; keine abgeschnittenen Zahlen; ResultMiniBar einzeilig
- [ ] Hydration-Allowlist um Money-Leak-Zeile kürzer; `rg "DynamicMoneyLeak" -l` → 0
- [ ] First-Load-JS-Diff der Route im PR-Text (Budget: nicht schlechter als −0/+10 kB)
- [ ] Annotation ergänzt

**Gates:** Standard 0.2 + `tool-e2e`-Job + visuelle Prüfung 1440/1280/1024/390/360 + Opus-Protokoll.

---

## PR 2.3 — Debt Payoff → PrecisionWorksheet + Share-Codec

**Ziel:** Erste Engine-Extraktion aus einem 472-LOC-Widget, das dokumentierte Muster für `ssr:false`-Widgets, und der Fragment-Share-Codec inkl. Allowlist.

**Merge-Regel:** nach 2.2 (geteilte Allowlist-Datei). **Modell/Review:** Sonnet 5 → **Opus reviewt Share-Codec/Privacy blockierend**.

**Dateien:**
- Create: `lib/calc/debt/payoff.ts` — `buildPayoffPlan(debts: Debt[], strategy: 'avalanche'|'snowball', extraMonthly: number): PayoffPlan` (pure; `Debt {id, label, balance, aprPct, minPayment}`; `PayoffPlan {months, debtFreeDate: null, totalInterest, perDebt: {...}[], schedule: {month, remaining}[]}` — Datum erst in der UI aus asOf abgeleitet, Engine bleibt Date-frei)
- Create: `lib/decision/share-codec.ts` (**entsteht HIER**, nicht in 3.1):

```ts
export interface SharePayload { v: 1; t: ToolId; i: Record<string, number | string> }
/** Filters against the tool's shareableFields allowlist, buckets/rounds
 *  values, enforces ~1500-char cap. Returns null on ANY failure. */
export function encodeShare(toolId: ToolId, fields: Record<string, number | string>): string | null;
export function decodeShare(fragment: string): SharePayload | null;   // zod + range clamps; null on failure
export function buildShareUrl(origin: string, path: string, encoded: string): string; // `${origin}${path}#s=${encoded}`
export function humanFieldList(toolId: ToolId, payload: SharePayload): string; // preview sentence
```

- Modify: `lib/tools/registry/types.ts` + `registry.ts` additiv: `shareableFields?: string[]` (Einträge initial nur debt-payoff: `['debtCountBand','totalDebtBand','strategy','extraPaymentBand']` — Spec 8.7)
- Modify: Debt-Payoff-Page → `ToolShell > PrecisionWorksheet`; neue Island; alte Komponente + `Dynamic*`-Export löschen; Allowlist-Zeile raus; ShareResult mit Codec + sichtbarer Vorschau verdrahten
- Modify: Annotation (+ 2.3-Merge)
- Test: `__tests__/unit/calc/debt-payoff.test.ts`, `__tests__/unit/share-codec.test.ts`, `e2e/tool-shell-debt-payoff.spec.ts` (JS-off + JS-on-Share: `#s=`-Link öffnen → „Shared scenario"-Chip client-seitig, SSR-HTML zeigt weiterhin „Example result")

**Tests-first (Vektoren, sourceType bindend):**
- `reference`: 2 Golden Fixtures (3 Schulden, avalanche + snowball) — per Tabellenkalkulation doppelt gerechnet, Rechenweg im Fixture-Kommentar
- `invariant`: Avalanche-Gesamtzins ≤ Snowball-Gesamtzins (gleiche Inputs); mehr `extraMonthly` ⇒ nie mehr Monate; Null-Zins ⇒ totalInterest 0 und months = ceil(balance/payment); minPayment deckt Zins nicht → definierter `{error:'payment-too-low'}`-Pfad statt Endlosschleife
- Codec: Roundtrip; Nicht-Allowlist-Feld wird still gefiltert; Rohbetrag-Feld (`totalDebt: 53211`) erscheint NIE im Payload (nur `totalDebtBand`); >1500 Zeichen → null; korruptes/fremd-versioniertes Fragment → null; Clamp außerhalb Range

**Akzeptanzkriterien:**
- [ ] Widget rechnet ausschließlich über `lib/calc/debt/payoff.ts` (kein Rechenpfad mehr in der Komponente)
- [ ] Share-Link ist IMMER `#s=`-Fragment (kein Queryparameter irgendwo; e2e prüft `location.search === ''`)
- [ ] Share-Vorschau sichtbar VOR dem Kopieren („This link includes: … It never includes exact amounts you typed.")
- [ ] 4-Schritt-Muster für `ssr:false`-Widgets im PR-Text dokumentiert (Referenz für 5.3)
- [ ] Opus-Privacy-Protokoll: kein Rohbetrag kann den Browser verlassen (Codec + Events)

**Gates:** Standard 0.2 + `tool-e2e` + Opus-Protokoll.

## PR 2.3g — Indexability-Gate: debt-payoff

**Ziel:** `debt-payoff` wird indexierbar — oder nachweislich nicht.
**Modell:** Sonnet 5 (Checkliste), Fable entscheidet.
**Dateien:** Modify: `lib/tools/registry/registry.ts` (`indexable: true` der Variante — Sitemap/robots folgen automatisch, PR 0.2/0.6-Mechanik). Test: `e2e/tool-seo.spec.ts` deckt Canonical/robots bereits registry-getrieben ab.
**Akzeptanzkriterien:** ausgefüllte 10-Kriterien-Checkliste im PR-Text (1 Calc getestet ✓2.3 · 2 Daten aktuell · 3 Search Intent bestätigt · 4 Methodik+Quellen · 5 Canonical/hreflang · 6 Schema valide · 7 interne Links · 8 Mobile UX · 9 keine kritischen Fehler · 10 keine Kannibalisierung); jedes Kriterium mit Beleg. Nicht bestanden → PR wird NICHT geöffnet, Befund im Plan-Status notiert.

---

## PR 2.4 — Hub → Decision Launcher

**Ziel:** Die 4 Hub-Seiten werden zum Decision Launcher (Spec 6.3): ≤220 px H1-Bereich, Marktumschalter, Major-Decision-Panels mit „Example"-Miniaturen, Supporting-Tools nach `decisionCategory` gruppiert.

**Merge-Regel:** nach Baseline-Ende UND ≥3 Tage nach 2.2 (0.5). Entwicklung darf parallel zu 2.2 laufen (disjunkte Dateien). **Modell/Review:** Sonnet 5; Fable-Review + Design-AK-Abnahme.

**Dateien:**
- Create: `components/tools/hub/`: `decision-launcher.tsx` (RSC), `decision-panel.tsx` (RSC; Mini-SVG via `buildMini` + „Example"-Chip), `supporting-groups.tsx` (RSC), `market-switcher.tsx` (`'use client'`, navigiert zwischen den 4 Hub-Pfaden)
- Modify: `lib/tools/registry/types.ts` + `registry.ts` additiv: `hubExample?: ScenarioVisualData` je Major Tool (statische Worked-Example-Daten; Money Leak bars, Broker range, Home stack; Wealth Horizon folgt 4.2)
- Modify: 4 Hub-Pages (`app/(marketing)/tools/page.tsx`, `app/uk/tools/page.tsx`, `app/ca/tools/page.tsx`, `app/au/tools/page.tsx`) — NUR Komposition; Daten weiterhin ausschließlich über die 0.6-Accessoren (`getToolsForMarket`, `getToolEntryHref` mit `?market=` für die Broker-Panels, `getHubPathForMarket`)
- Modify: Annotation (+ 2.4-Merge)
- Test: `e2e/tool-hub.spec.ts` (JS-off): US-Hub zeigt **exakt 3** Major-Panels (Money Leak, Broker, Wealth-Horizon-Platzhalter erst ab 4.2 — bis dahin 2 Panels + Supporting; die Panel-Zahl kommt aus der Registry, der Test asserted registry-konsistent statt hart „3"), UK/CA/AU je nach Verfügbarkeit; jede Miniatur trägt sichtbar „Example"; H1-Bereich ≤220 px (bounding-box-Assertion bei 1280×720); keine „Popular"-Badges

**Referenz:** Panel-Reihenfolge = Spec 4.1 („Find where my money is going" · „Plan my financial future" · „Choose the right broker" · „Understand what home I can afford"); nicht verfügbare Decisions eines Markts erscheinen nicht (kein Coming-Soon-Panel). Nav/Footer/Sitemap bleiben unangetastet (bereits registry-getrieben).

**Tests-first:** e2e-Spec zuerst (rot gegen aktuelles Karten-Raster), dann bauen.

**Akzeptanzkriterien:**
- [ ] Bei 1280×720 alle verfügbaren Major Decisions im ersten Viewport erkennbar (Design-AK, Screenshot im PR)
- [ ] Kein dekorativer Hero/Verlauf/Punktmuster; H1-Bereich ≤220 px
- [ ] Alle Links kommen aus Registry-Accessoren (kein neues hartcodiertes Array — `rg "money-leak-scanner" app/(marketing)/tools/page.tsx` zeigt nur Accessor-Nutzung)
- [ ] Supporting-Gruppen folgen `decisionCategory`; Broker-Panels nutzen `?market=`-Links auf UK/CA/AU
- [ ] fs-Parity- und tool-seo-Tests grün (Hub-Metadaten unverändert aus PR 0.2)
- [ ] Annotation ergänzt

**Gates:** Standard 0.2 + `tool-e2e` + visuelle Prüfung 1440/1280/1024/390/360.

---

# Phase 3 — Broker Decision Journey

## PR 3.1 — DecisionState-Store

**Ziel:** `DecisionStateV1` (sessionStorage, zod-validiert, SSR-safe) existiert getestet — der Passport-Keim, den Quiz/Trading-Cost/Comparison ab 3.2 teilen.

**Modell/Review:** Fable-Referenz (dieser Brief) → Sonnet 5; Fable-Review.

**Dateien:**
- Create: `lib/decision/types.ts`, `lib/decision/store.ts`, `lib/decision/use-decision-state.ts`
- Modify: `.github/workflows/pr-checks.yml` ODER `scripts/`-Guard: CI-Grep-Gate „kein `lib/decision`-Import in Cockpit-Code" (`rg "lib/decision" lib/comparison components/marketing/comparison-hub.tsx lib/actions/cockpit-analytics.ts` muss leer sein — als Step im `tool-e2e`-Job; Verzeichnisliste beim Bau gegen die realen Cockpit-Pfade verifizieren)
- Test: `__tests__/unit/decision-store.test.ts`

### Referenz-Code

**`lib/decision/types.ts`** (vollständig — Spec 8.6):

```ts
// lib/decision/types.ts
// DecisionStateV1 — the shared, session-scoped decision state (Passport seed).
// sessionStorage ONLY in v1 (privacy default; localStorage opt-in is Phase 6).
// The cockpit NEVER reads this store (one-way bridge, CI-greped).

import { z } from 'zod';
import type { ToolMarket } from '@/lib/tools/registry/types';

export const DECISION_STORAGE_KEY = 'sfp_decision_v1';

const MarketSchema = z.enum(['us', 'uk', 'ca', 'au']);

export const DecisionStateSchema = z
  .object({
    v: z.literal(1),
    updatedAt: z.string(),
    broker: z
      .object({
        market: MarketSchema,
        quizAnswers: z.record(z.string(), z.string()),
        profile: z.object({
          experience: z.string().max(40),
          instruments: z.array(z.string().max(40)).max(10),
          tradesPerMonth: z.number().finite(),
          avgTradeSize: z.number().finite(),
          priorities: z.array(z.string().max(40)).max(10),
        }),
        shortlistSlugs: z.array(z.string().max(200)).max(10),
        costInputs: z.record(z.string(), z.number().finite()).optional(),
      })
      .optional(),
    horizon: z.object({ inputs: z.record(z.string(), z.unknown()) }).optional(),
    home: z
      .object({ market: MarketSchema, inputs: z.record(z.string(), z.number().finite()) })
      .optional(),
  })
  .strict();

export type DecisionStateV1 = z.infer<typeof DecisionStateSchema>;
export type DecisionMarket = ToolMarket;
```

**`lib/decision/store.ts`** (vollständig):

```ts
// lib/decision/store.ts
// SSR-safe accessors — every function is a no-op / null outside the browser.
// Corrupt or foreign-version payloads are DISCARDED, never migrated in v1.

import { DECISION_STORAGE_KEY, DecisionStateSchema, type DecisionStateV1 } from './types';

function storage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try { return window.sessionStorage; } catch { return null; } // privacy mode
}

export function readDecisionState(): DecisionStateV1 | null {
  const s = storage();
  if (!s) return null;
  try {
    const raw = s.getItem(DECISION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = DecisionStateSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) { s.removeItem(DECISION_STORAGE_KEY); return null; }
    return parsed.data;
  } catch { return null; }
}

export function writeDecisionState(
  update: (prev: DecisionStateV1 | null) => Omit<DecisionStateV1, 'v' | 'updatedAt'>,
  nowIso: string = new Date().toISOString(),
): DecisionStateV1 | null {
  const s = storage();
  if (!s) return null;
  const next: DecisionStateV1 = { v: 1, updatedAt: nowIso, ...update(readDecisionState()) };
  const parsed = DecisionStateSchema.safeParse(next);
  if (!parsed.success) return null;                 // never persist an invalid shape
  try { s.setItem(DECISION_STORAGE_KEY, JSON.stringify(parsed.data)); } catch { /* quota */ }
  return parsed.data;
}

export function clearDecisionState(): void {
  const s = storage();
  if (!s) return;
  try { s.removeItem(DECISION_STORAGE_KEY); } catch { /* noop */ }
}
```

**`lib/decision/use-decision-state.ts`** (vollständig):

```ts
'use client';
// lib/decision/use-decision-state.ts
import { useCallback, useSyncExternalStore } from 'react';
import { readDecisionState, writeDecisionState } from './store';
import type { DecisionStateV1 } from './types';

// Cross-component sync within the tab via a custom event (sessionStorage
// fires no 'storage' event in the same tab).
const CHANGE_EVENT = 'sfp-decision-change';
let cache: { raw: string | null; value: DecisionStateV1 | null } = { raw: null, value: null };

function getSnapshot(): DecisionStateV1 | null {
  if (typeof window === 'undefined') return null;
  const raw = window.sessionStorage.getItem('sfp_decision_v1');
  if (raw === cache.raw) return cache.value;        // referential stability for useSyncExternalStore
  cache = { raw, value: readDecisionState() };
  return cache.value;
}

export function useDecisionState(): {
  state: DecisionStateV1 | null;
  update: (fn: (prev: DecisionStateV1 | null) => Omit<DecisionStateV1, 'v' | 'updatedAt'>) => void;
} {
  const state = useSyncExternalStore(
    (onChange) => {
      window.addEventListener(CHANGE_EVENT, onChange);
      return () => window.removeEventListener(CHANGE_EVENT, onChange);
    },
    getSnapshot,
    () => null,                                     // server snapshot
  );
  const update = useCallback((fn: Parameters<typeof writeDecisionState>[0]) => {
    writeDecisionState(fn);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);
  return { state, update };
}
```

**Tests-first:** Roundtrip write→read; korruptes JSON → null + Key entfernt; fremde Version `{v:2}` → verworfen; `.strict()` lehnt Zusatzfelder ab; SSR-Pfad (window undefined via vitest environment node) → alle Funktionen no-op/null; `writeDecisionState` mit invalider Shape persistiert nichts; update-merge erhält fremde Namespaces (broker-Write löscht `home` nicht).

**Akzeptanzkriterien:**
- [ ] CI-Grep-Gate aktiv und grün (kein Cockpit-Import)
- [ ] Kein Konsument in diesem PR (Store ungenutzt = revertfrei)
- [ ] sessionStorage only; kein localStorage-Pfad in v1

**Gates:** Standard 0.2.

---

## PR 3.2 — Broker-Marktdaten + Quiz als Store-Producer

**Ziel:** Die Inline-Brokerdaten des Quiz ziehen mit **belegter Marktverfügbarkeit** nach `lib/calc/brokerage/data.ts`, und das Quiz schreibt das Profil in den DecisionState.

**Modell/Review:** Fable-Quellen-Brief (unten) → Sonnet 5 → **Opus 4.8 blockierender Review** (Fokus: Verfügbarkeits-Quellen je Anbieter, A/B-Integrität).

**Dateien:**
- Create: `lib/calc/brokerage/data.ts` — `BROKERS: BrokerRecord[]` + `brokerCosts` aus `components/tools/broker-finder-quiz.tsx` (857 LOC) herausgehoben; NEU je Anbieter: `availableMarkets: ToolMarket[]` + `availabilitySources: { market: ToolMarket; url: string; verifiedAt: string }[]`
- Modify: `components/tools/broker-finder-quiz.tsx`: liest validierten `?market=`-Param (ungültig/fehlend → 'us'; erste Store-Aktion), Matching marktgefiltert über `availableMarkets`, schreibt `broker.{market,quizAnswers,profile,shortlistSlugs}` via `useDecisionState`, Session-Key-Duplikat (`sfp_session_id`-Eigenbau) → `getOrCreateAnalyticsSessionId()`
- Modify: Annotation (+ 3.2-Merge)
- Test: `__tests__/unit/brokerage-data.test.ts`, `e2e/broker-quiz-store.spec.ts` (JS-on)

**Quellen-Brief (bindend, VOR Implementierung):** Für JEDEN Anbieter in `BROKERS` wird die Verfügbarkeit je Markt gegen mindestens eine Primärquelle verifiziert und mit URL + `verifiedAt` dokumentiert: Regulator-Register (FINRA BrokerCheck / FCA Register / ASIC Professional Registers / CIRO Dealers We Regulate) ODER die offizielle Länder-/Legal-Seite des Anbieters. **Kein Anbieter erscheint in einem Markt ohne Nachweis** (SPEC 4.2). Nicht belegbare Anbieter-Markt-Paare werden entfernt und im PR-Text gelistet. Web-Recherche macht der Sonnet-Agent; Opus prüft die Belege stichprobenartig nach.

**Tests-first:** Unit: jeder BROKERS-Eintrag hat ≥1 Markt und je Markt eine Quelle mit `verifiedAt` (Struktur-Test verhindert künftige unbelegte Einträge); Markt-Filter liefert für 'uk' nur UK-belegte Anbieter. e2e: Quiz auf `?market=uk` durchspielen → sessionStorage `sfp_decision_v1` enthält `broker.market:'uk'` + Shortlist nur UK-belegte Slugs; ungültiger `?market=xx` → 'us'.

**Akzeptanzkriterien:**
- [ ] **A/B-Integrität byte-gleich:** `sfp_quiz_cta_variant`-Key, Varianten-Zuweisung (`Math.random`-Lazy-Init) und CTA-Rendering im Diff unberührt; `quiz_*`-Events unverändert
- [ ] Quiz rechnet/matched ausschließlich über `lib/calc/brokerage/data.ts` (keine Inline-Arrays mehr; `rg "spread|commission" components/tools/broker-finder-quiz.tsx` zeigt keine Datenliterale)
- [ ] Jede Anbieter-Markt-Behauptung hat Quelle+Datum; Opus-Protokoll bestätigt Stichprobe
- [ ] Grep-Gate aus 1.2 jetzt ohne Quiz-Ausnahme grün
- [ ] tool_v1-Events aus 1.3 feuern unverändert weiter

**Gates:** Standard 0.2 + `tool-e2e` + Opus-Protokoll.

---

## PR 3.3 — Trading-Cost-Prefill + Comparison-Shortlist

**Ziel:** Journey-Schritte 2+3: Trading Cost startet mit Quiz-Profil im State `ready` („Using your quiz answers — edit"), Broker Comparison prä-selektiert die Shortlist; beide rechnen über `lib/calc/brokerage/`.

**Modell/Review:** Sonnet 5; Fable-Review.

**Dateien:**
- Create: `lib/calc/brokerage/costs.ts` — `estimateAnnualCosts(profile: TraderProfile, brokers: BrokerRecord[]): CostEstimate[]` (pure; TraderProfile aus DecisionState-`profile` ableitbar; getrennt vom cockpit-eigenen `lib/comparison/cost.ts`)
- Modify: Trading-Cost-Widget: liest `useDecisionState().broker` → Felder vorbefüllt, PanelState `ready` (INPUTS_PREFILLED), sichtbare Zeile „Using your quiz answers — edit"; ohne Store-Daten unverändertes Verhalten; schreibt `broker.costInputs` zurück
- Modify: Broker-Comparison-Widget: `shortlistSlugs` prä-selektiert (sichtbar als „Your shortlist"), auf `data.ts` umgestellt
- Modify: Annotation (+ 3.3-Merge)
- Test: `__tests__/unit/brokerage-costs.test.ts` (reference-Fixture doppelt gerechnet + Invarianten: mehr Trades ⇒ nie geringere Kosten; 0 Trades ⇒ nur Fixkosten), `e2e/broker-journey.spec.ts` erster Teil (Quiz→Trading-Cost ohne Doppeleingabe)

**Akzeptanzkriterien:**
- [ ] Ohne DecisionState: beide Tools verhalten sich exakt wie vorher (Null-Fall-e2e)
- [ ] Prefill-Zustand zeigt Herkunfts-Zeile + Edit-Möglichkeit; State-Chip bleibt „Your result"-Pfad (kein „Shared scenario")
- [ ] Kein Cockpit-Code liest den Store (Grep-Gate grün)

**Gates:** Standard 0.2 + `tool-e2e`.

---

## PR 3.4 — Registry-Brücken + Journey-E2E ×4 Märkte

**Ziel:** Jedes Tool hat seine EINE Cockpit-/Folge-Brücke aus der Registry (Spec 4.5), und die komplette Broker-Journey ist über alle 4 Märkte end-to-end getestet.

**Modell/Review:** Sonnet 5; Fable-Review.

**Dateien:**
- Modify: `lib/tools/registry/types.ts` + `registry.ts` additiv: `bridge?: { market: ToolMarket; href: string; label: string; kind: 'cockpit' | 'review' | 'tool' }[]` — Werte exakt aus Spec-Tabelle 4.5 für ALLE Tools; `getBridge(id, market)`-Accessor
- Modify: NextBestAction-Konsumenten (bisher Money Leak 2.2, Debt 2.3) beziehen `nextAction` aus `getBridge` statt lokaler Konstanten
- Create: `__tests__/unit/registry-bridges.test.ts` — **Build-Test gegen `BEST_X_MANIFEST`**: jede `kind:'cockpit'`-Brücke zeigt auf eine existierende, NICHT `coming_soon`-Cockpit-Route; jede `kind:'tool'`-Brücke auf eine live Registry-Variante
- Create: `e2e/broker-journey.spec.ts` komplett (JS-on, `test.use`): je Markt us/uk/ca/au: Quiz → Shortlist → Trading Cost (Prefill, keine Doppeleingabe) → Comparison (Prä-Selektion) → Brücke; Assertions: Regulator-Nennung + Währungssymbol passend zum Markt, Event-Reihenfolge (view→start→…→next_action[→cockpit_cta]), Canonical der 3 Routen bleibt parameterlos trotz `?market=`

**Tests-first:** Bridge-Manifest-Test zuerst (rot solange Registry-Feld fehlt).

**Akzeptanzkriterien:**
- [ ] Kein Tool hat mehr eine hartcodierte Brücken-URL (Grep: `"/us/.*best/" components/tools` → nur Registry)
- [ ] 4-Märkte-e2e grün; `?market=`-Wechsel mitten in der Journey trennt Funnel-Keys korrekt (variantPath+market im Batch geprüft)
- [ ] `tool_cockpit_cta_click` feuert NUR bei kind 'cockpit', immer NACH `tool_next_action_click`

**Gates:** Standard 0.2 + `tool-e2e`.

---

# Phase 4 — Wealth Horizon

## PR 4.1 — Retirement-Engine + Testvektoren

**Ziel:** `lib/calc/retirement/engine.ts` implementiert das bindende Realwert-Modell (Spec 8.3) pure und vollständig vektorisiert — noch ohne jede Route.

**Modell/Review:** Fable-Referenz (dieser Brief) → Sonnet 5 → **Opus 4.8 blockierender Review mit 7 definierten Prüfpunkten:** (1) Realwert-Invariante / kein zweiter Inflationsabzug, (2) Fee genau 1× abgezogen, (3) Clamp-Vertrag: Simple nie / Breakdown nur mit passendem Kontotyp+YTD bzw. Room, (4) Benefit-Semantik `startsAtAge` + FI-Definition, (5) US-Limit-Trennung Deferral/Catch-up (inkl. 60–63 = 11.250)/Gesamtbeitrag, (6) Lever-Determinismus + Ranking, (7) Fixture-Rechenwege nachvollzogen.

**Dateien:**
- Create: `lib/calc/retirement/types.ts` (Typen aus Spec 8.3 wortgleich: `RetirementAccountType`, `RetirementAccountInput`, `RetirementBaseInputs`, `RetirementInputs`, `ScenarioResult`, `EngineResult`)
- Create: `lib/calc/retirement/engine.ts`
- Modify (nur falls nötig, additiv): `lib/rules/index.ts` — `resolveRuleSnapshot(market, keys, asOf): RuleSnapshot` verifizieren; fehlt der Accessor aus Spec 8.4, hier ergänzen: `RuleSnapshot { asOf: string; values: Record<string, number>; meta: Record<string, { verifiedAt: string; sourceUrl: string; label: string }> }`
- Test: `__tests__/unit/calc/retirement-engine.test.ts` + Fixtures `__tests__/unit/calc/fixtures/retirement/*.ts`

### Referenz-Code

**Bindende Modellkonventionen** (gehören als Kommentarblock in die Engine UND in den AssumptionsDrawer-Text der Routen):
1. Alles in heutiger Kaufkraft; Szenario-Renditen sind REALE Renditen aus `rules.values.realReturn{Conservative,Base,Optimistic}`; die Inflationsannahme wird NIRGENDS in der Engine verwendet.
2. Jahresschritt: `balance(a+1) = balance(a) × (1 + rNet) + annualContribution`, mit `rNet = rScenario − annualFeePct/100` (Fee GENAU einmal); Beiträge am Jahresende ohne unterjähriges Wachstum; Beiträge stoppen ab `retireAge`.
3. `illustrativeMonthlyWithdrawal = balanceAtRetire × withdrawalRatePct/100 / 12` — Feldname bindend, nie „sustainable".
4. Benefit zählt in Projektion, Gap und FI **exakt 0 vor `startsAtAge`**.
5. `fiDate` = erstes Jahr ≤ retireAge, in dem `balance(age) × rate/12 + benefit(age) ≥ target`; sonst `null` (Semantik v1: „nicht bis zum gewählten Rentenalter erreicht" — UI formuliert genau so).
6. `incomeGapMonthly = max(0, target − withdrawal − benefit(retireAge))`.

**`lib/calc/retirement/engine.ts`** (vollständig):

```ts
// lib/calc/retirement/engine.ts
// Wealth Horizon v1 — pure real-terms projection (SPEC 8.3, binding).
// Everything is in today's purchasing power; scenario returns are REAL
// returns. The 2.5% inflation assumption exists ONLY in documentation —
// using it anywhere in this file is a contract violation (invariant-tested).
// No React, no DOM, no Date.now — asOf comes from the RuleSnapshot.

import type {
  EngineResult, RetirementAccountInput, RetirementInputs, ScenarioResult,
} from './types';
import type { Lever } from '@/lib/tools/shell-types';
import type { RuleSnapshot } from '@/lib/rules';
// RuleSnapshot lebt in lib/rules (siehe Dateien-Sektion): { asOf: string;
// values: Record<string, number>; meta: Record<string, { verifiedAt; sourceUrl; label }> }

const SCENARIO_KEYS = ['conservative', 'base', 'optimistic'] as const;

function scenarioRate(rules: RuleSnapshot, key: (typeof SCENARIO_KEYS)[number]): number {
  const map = {
    conservative: 'realReturnConservative',
    base: 'realReturnBase',
    optimistic: 'realReturnOptimistic',
  } as const;
  const v = rules.values[map[key]];
  if (typeof v !== 'number') throw new Error(`missing rule ${map[key]}`);
  return v;
}

interface Contributions { employeeMonthly: number; employerMonthly: number; startingBalance: number }

/** Sums contributions using the SAME clamp decisions the checks report
 *  (resolveAccountContribution below is the single source for both). */
function totalContributions(inputs: RetirementInputs, rules: RuleSnapshot): Contributions {
  if (inputs.contributionMode === 'simple') {
    return {   // simple mode NEVER clamps — totals used as entered
      employeeMonthly: inputs.simple.employeeContributionMonthly,
      employerMonthly: inputs.simple.employerContributionMonthly ?? 0,
      startingBalance: inputs.simple.taxAdvantagedBalance + inputs.simple.taxableBalance,
    };
  }
  return inputs.accounts.reduce<Contributions>(
    (acc, a) => ({
      employeeMonthly: acc.employeeMonthly
        + resolveAccountContribution(a, inputs.currentAge, rules).appliedMonthly,
      employerMonthly: acc.employerMonthly + (a.employerContributionMonthly ?? 0),
      startingBalance: acc.startingBalance + a.balance,
    }),
    { employeeMonthly: 0, employerMonthly: 0, startingBalance: 0 },
  );
}

function benefitAt(age: number, inputs: RetirementInputs): number {
  const b = inputs.expectedRetirementBenefit;
  if (!b) return 0;
  return age >= b.startsAtAge ? b.monthlyAmountToday : 0;   // exactly 0 before startsAtAge
}

function projectScenario(
  key: (typeof SCENARIO_KEYS)[number],
  inputs: RetirementInputs,
  rules: RuleSnapshot,
  contrib: Contributions,
): ScenarioResult {
  const rNet = scenarioRate(rules, key) - inputs.annualFeePct / 100;  // fee exactly once
  const annualContribution = (contrib.employeeMonthly + contrib.employerMonthly) * 12;
  const asOfYear = Number(rules.asOf.slice(0, 4));

  const rows: { age: number; balance: number }[] = [{ age: inputs.currentAge, balance: contrib.startingBalance }];
  let balance = contrib.startingBalance;
  for (let age = inputs.currentAge + 1; age <= inputs.retireAge; age++) {
    // Contributions flow in every yearly step up to and INCLUDING the step
    // landing on retireAge (= the final working year); v1 projects no rows
    // beyond retireAge. Fixtures use exactly this convention.
    balance = balance * (1 + rNet) + annualContribution;
    rows.push({ age, balance: round2(balance) });
  }

  const rate = inputs.withdrawalRatePct / 100;
  const balanceAtRetire = rows[rows.length - 1].balance;
  const withdrawal = round2((balanceAtRetire * rate) / 12);
  const benefitAtRetire = benefitAt(inputs.retireAge, inputs);
  const gap = Math.max(0, round2(inputs.targetMonthlyIncomeToday - withdrawal - benefitAtRetire));

  let fiDate: string | null = null;
  for (const row of rows) {
    const capacity = (row.balance * rate) / 12 + benefitAt(row.age, inputs);
    if (capacity >= inputs.targetMonthlyIncomeToday) {
      fiDate = String(asOfYear + (row.age - inputs.currentAge));
      break;
    }
  }

  return {
    key, rows, balanceAtRetire,
    illustrativeMonthlyWithdrawal: withdrawal,
    incomeGapMonthly: gap,
    fiDate,
  };
}

function round2(n: number): number { return Math.round(n * 100) / 100; }

// ── Contribution checks (contract SPEC 8.3) ──────────────────────────────────
// Simple mode NEVER clamps — single 'not-applicable' hint entry.
// Account breakdown: a statutory cap applies ONLY with matching account type
// AND contributedYtd; personal room (TFSA/RRSP/AU carry-forward) ONLY with
// availableRoom. Everything else → 'warning' message, amount NOT clamped.
// US: deferral limit = k401Limit + catch-up (age ≥ 50 → k401CatchUp; age
// 60–63 → k401CatchUpAge60To63 INSTEAD). Age basis: currentAge at asOf
// (documented v1 simplification — advisory checks, not per-projection-year).

type Check = EngineResult['contributionChecks'][number];

/** ONE shared clamp decision — engine contributions and check entries can
 *  never diverge because both come from this function. */
export function resolveAccountContribution(
  a: RetirementAccountInput,
  currentAge: number,
  rules: RuleSnapshot,
): { appliedMonthly: number; check: Check } {
  const annual = a.employeeContributionMonthly * 12;

  // (1) Personal room (TFSA/RRSP/AU carry-forward) — ONLY with availableRoom.
  const roomTypes = ['ca-tfsa', 'ca-rrsp', 'au-super'];
  if (roomTypes.includes(a.type) && typeof a.availableRoom === 'number') {
    if (annual > a.availableRoom) {
      const appliedMonthly = round2(a.availableRoom / 12);
      return { appliedMonthly, check: { accountId: a.id, status: 'clamped', amountApplied: appliedMonthly,
        message: `Clamped to your available room (${a.availableRoom}/yr).` } };
    }
    return { appliedMonthly: a.employeeContributionMonthly,
      check: { accountId: a.id, status: 'ok', amountApplied: a.employeeContributionMonthly, message: 'Within your available room.' } };
  }

  // (2) Statutory employee-deferral cap — ONLY with matching type AND contributedYtd.
  //     US: k401Limit + catch-up (≥50 → k401CatchUp; 60–63 → k401CatchUpAge60To63 INSTEAD).
  const capKey = deferralCapKey(a.type);   // 'us-401k'→'k401Limit', 'us-*-ira'→'iraLimit', 'uk-isa'→'isaAllowance', 'au-super'→'concessionalCap', sonst null
  if (capKey && typeof a.contributedYtd === 'number') {
    let cap = rules.values[capKey] ?? Number.POSITIVE_INFINITY;
    if (a.type === 'us-401k') {
      if (currentAge >= 60 && currentAge <= 63) cap += rules.values.k401CatchUpAge60To63 ?? 0;
      else if (currentAge >= 50) cap += rules.values.k401CatchUp ?? 0;
    } else if ((a.type === 'us-traditional-ira' || a.type === 'us-roth-ira') && currentAge >= 50) {
      cap += rules.values.iraCatchUp ?? 0;
    }
    const remaining = Math.max(0, cap - a.contributedYtd);
    if (annual > remaining) {
      const appliedMonthly = round2(remaining / 12);
      return { appliedMonthly, check: { accountId: a.id, ruleKey: capKey, status: 'clamped', amountApplied: appliedMonthly,
        message: `Clamped to the ${rules.meta[capKey]?.label ?? capKey} minus your YTD contributions.` } };
    }
    return { appliedMonthly: a.employeeContributionMonthly,
      check: { accountId: a.id, ruleKey: capKey, status: 'ok', amountApplied: a.employeeContributionMonthly, message: 'Within the annual limit.' } };
  }

  // (3) Cap exists but no YTD/room data → advisory warning, NEVER clamped.
  if (capKey && rules.values[capKey] !== undefined && annual > rules.values[capKey]) {
    return { appliedMonthly: a.employeeContributionMonthly,
      check: { accountId: a.id, ruleKey: capKey, status: 'warning', amountApplied: a.employeeContributionMonthly,
        message: `May exceed the ${rules.meta[capKey]?.label ?? capKey} — add your YTD contributions to check.` } };
  }
  return { appliedMonthly: a.employeeContributionMonthly,
    check: { accountId: a.id, status: 'ok', amountApplied: a.employeeContributionMonthly, message: 'No limit check applicable.' } };
}

export function buildContributionChecks(inputs: RetirementInputs, rules: RuleSnapshot): Check[] {
  if (inputs.contributionMode === 'simple') {
    // Simple mode NEVER clamps — single advisory entry (contract SPEC 8.3).
    return [{ status: 'not-applicable', amountApplied: inputs.simple.employeeContributionMonthly,
      message: 'Totals are used as entered; account-level limits may apply — switch to account breakdown to check.' }];
  }
  return inputs.accounts.map((a) => resolveAccountContribution(a, inputs.currentAge, rules).check);
}

// ── Levers (deterministic, ranked by base-scenario delta) ────────────────────

const LEVER_EXTRA_MONTHLY = 200;   // in today's money units of the tool's market currency

export function buildLevers(inputs: RetirementInputs, rules: RuleSnapshot): [Lever, Lever, Lever] {
  const base = projectAll(inputs, rules).scenarios[1].balanceAtRetire;
  const candidates: { lever: Lever; delta: number }[] = [
    variant('fees', 'Cut fees by 0.5 pp', { annualFeePct: Math.max(0, inputs.annualFeePct - 0.5) }),
    variant('contribution', `Add ${LEVER_EXTRA_MONTHLY}/mo`, addMonthly(inputs, LEVER_EXTRA_MONTHLY)),
    variant('retire-later', 'Retire 2 years later', { retireAge: inputs.retireAge + 2 }),
  ].sort((a, b) => b.delta - a.delta);
  return candidates.map((c) => c.lever) as [Lever, Lever, Lever];
  // variant(): re-runs projectAll with the mutated inputs, delta = new base
  // balanceAtRetire − base; deltaLabel = `≈ +${formatApprox(delta)} at retirement`
  // (always a circa value — never an exact promise).
}

export function projectRetirement(inputs: RetirementInputs, rules: RuleSnapshot): EngineResult {
  validateInputs(inputs);   // currentAge < retireAge ≤ 80, withdrawalRatePct ∈ [2.5, 5.0], fee ∈ [0, 3], throws TypeError
  const checks = buildContributionChecks(inputs, rules);
  const contrib = totalContributions(inputs, rules);   // same clamp source as checks (resolveAccountContribution)
  const scenarios = SCENARIO_KEYS.map((k) => projectScenario(k, inputs, rules, contrib)) as
    [ScenarioResult, ScenarioResult, ScenarioResult];
  return { scenarios, levers: buildLevers(inputs, rules), contributionChecks: checks };
}
```

> **Implementierungs-Hinweise (bindend):** (a) Die Skizze oben zeigt die Struktur; `resolveAccountContribution` als EINE geteilte Funktion bauen, damit Engine und Checks nie divergieren. (b) `projectAll`/`variant`/`addMonthly` sind interne Helfer — `buildLevers` darf `projectScenario` wiederverwenden, aber ohne Endlos-Rekursion über `projectRetirement` (Levers rufen NICHT wieder buildLevers). (c) Jahres-Konvention exakt wie oben (Beiträge Jahresende, letzter Beitrag im Jahr `retireAge`); die reference-Fixtures verwenden dieselbe Konvention und dokumentieren sie im Kommentar.

### Tests-first (Vektoren nach `sourceType`, Fixture-Format `{name, source, sourceType, asOf, inputs, expected, tolerance}`)

- `official` (Limits, keine Projektionen!): US 2026 k401 24.500 / Catch-up 8.000 / 60–63 11.250 / Gesamt 72.000; IRA 7.500/1.100; CA RRSP 33.810, TFSA kumulativ 109.000; AU SG 12 %, Caps 32.500/130.000; UK ISA 20.000 — je als Check-/Clamp-Assertion gegen `lib/rules` (Quellen bereits in den RuleEntries aus PR 0.4/#81)
- `reference` (Golden Fixtures, doppelt gerechnet, Rechenweg im Kommentar): (1) US simple: 35→65, Balance 50.000, 500/mo employee + 250/mo employer, Fee 0,5 %, Rate 4,0 % → alle drei Szenarien: balanceAtRetire, withdrawal, gap gegen Tabellenkalkulation (tolerance 0.02); (2) UK account-breakdown mit ISA+SIPP; (3) AU mit Benefit ab 67 bei retireAge 60 (Benefit zählt bei Retire NICHT, in FI-Suche ab 67 schon — hier retireAge-bounded → prüft Benefit-0-Regel)
- `invariant`:
  1. **Realwert-Trennung:** dieselbe Projektion mit zusätzlich 2,5 % Inflationsabzug weicht vom Erwartungswert ab (Guard gegen Doppelbereinigung — der Test rechnet die „falsche" Variante explizit aus und asserted Ungleichheit > tolerance)
  2. Fee genau 1×: Engine(fee 1,0) === Engine(fee 0) mit rNet-Handrechnung; doppelte Anwendung würde Fixture 1 brechen
  3. Monotonie: mehr Beitrag ⇒ balanceAtRetire nie kleiner (3 Stützstellen)
  4. Nullrendite: rNet 0 ⇒ balanceAtRetire = Start + Summe Beiträge (exakt)
  5. Entnahmerate: 2,5 % ⇒ withdrawal < 4,0 %-Fall; Rate außerhalb [2,5, 5,0] ⇒ throw
  6. Simple clampet nie (Beitrag 10× über Cap → amountApplied unverändert, status 'not-applicable')
  7. Breakdown clampet nie ohne YTD/Room (status 'warning', Betrag unverändert); MIT `contributedYtd` → 'clamped' und amountApplied = (Limit − YTD)/12-Konvention aus dem Check
  8. Benefit vor `startsAtAge` exakt 0 (Projektion, Gap, FI)
  9. retireAge +2 (Lever) ⇒ balanceAtRetire steigt bei positiver Rendite
  10. Determinismus: zwei Aufrufe identisch (keine Date/Random-Nutzung — zusätzlich `rg "Date.now|Math.random" lib/calc/retirement` leer)

### Akzeptanzkriterien

- [ ] Alle Vektoren grün; jede reference-Fixture dokumentiert ihren Rechenweg im Kommentar
- [ ] `rg "inflation" lib/calc/retirement/` → 0 Treffer außerhalb von Kommentaren
- [ ] Feld heißt überall `illustrativeMonthlyWithdrawal`; `rg -i "sustainable" lib/calc/retirement` → 0
- [ ] Opus-Protokoll beantwortet alle 7 Prüfpunkte einzeln
- [ ] Kein UI-/Routen-Code in diesem PR (reine lib — baseline-neutral, jederzeit mergebar)

**Gates:** Standard 0.2 + Opus-Protokoll.

---

## PR 4.2 — US-Route `/tools/retirement-calculator` (GuidedJourney)

**Ziel:** Wealth Horizon US live in der Shell — bewusst **noindex** bis der 4er-Cluster komplett ist (dokumentierte Abweichung von Spec 9.2, Index-Flip in 4.3).

**Modell/Review:** Sonnet 5 → **Opus-Finalprüfung** (Wording + Rules-Bindung).

**Dateien:**
- Modify: `lib/tools/registry/types.ts` (`ToolId` + `'wealth-horizon'`) + `registry.ts` (Definition: tier 'major', decisionCategory 'retire', shellMode 'guided-journey', US-Variante `{path:'/tools/retirement-calculator', indexable:false, title/description/h1 aus Spec 9.1}`, `shareableFields` aus Spec 8.7, `hubExample` kind 'corridor') — **im SELBEN PR wie die Page** (fs-Parity-Test erzwingt Atomarität)
- Create: `app/(marketing)/tools/retirement-calculator/page.tsx` (RSC: `buildToolMetadata('wealth-horizon','us')`, `revalidate = 86400`, Worked Example serverseitig via `projectRetirement(EXAMPLE_INPUTS, resolveRuleSnapshot('us', WH_RULE_KEYS, asOf))`, BelowFold mit Methodik/Herleitung der Realrenditen/FAQ aus Spec-Quellen inkl. SSA-Estimator-Link)
- Create: `components/tools/wealth-horizon/wealth-horizon-journey.tsx` (`'use client'`; 3 Schritte: Basics → Contributions [simple|account-breakdown-Toggle] → Assumptions; danach Live-Ergebnis mit Korridor, 3 Levers via `onLeverApply` → `setField` OHNE Clamp, Slider synchron beidseitig)
- Create: Adapter `lib/tools/results/wealth-horizon-result.ts` — `buildWealthHorizonResult(inputs, rules): ToolResult` (answer-Satz, primary = Bandbreite conservative↔optimistic der withdrawal, scenario 'corridor' mit FI-Markern, nextAction aus `getBridge` falls 3.4 bereits gemerged ist, sonst lokale Spec-4.5-Konstante mit Umstellung in 3.4/Folge-PR — beide Ketten laufen parallel in W6)
- Modify: `registry.ts` `hubExample` → US-Hub zeigt jetzt 3 Panels (2.4-Mechanik, registry-getrieben)
- Test: `e2e/tool-shell-wealth-horizon.spec.ts`: JS-off (Worked Example komplett, „in today's money" prominent, „Illustrative retirement withdrawal" als Label, Entnahmerate 2,5–5,0 sichtbar einstellbar im HTML, robots noindex); JS-on (Szenario-Umschaltung feuert `tool_scenario_compare`, Lever feuert `tool_input_change{controlRole:'lever'}`)

**Tests-first:** Wording-e2e zuerst (rot: Route existiert nicht), inkl. Negativ-Assertions: Seite enthält NIRGENDS „sustainable", „guaranteed", „you will have".

**Akzeptanzkriterien:**
- [ ] fs-Parity + tool-seo grün mit 21. Route; `robots: noindex` + NICHT in Sitemap (indexable:false steuert beides)
- [ ] Simple-Mode clampet nie (UI-e2e: Beitrag über Cap → Hinweis, Wert bleibt)
- [ ] Benefit-Feld verlinkt SSA-Estimator; Startalter-Feld vorhanden; Quelle 'user-estimate' fest
- [ ] Alle Zahlen `tabular-nums`; zentrale Ergebniszahl ≤44/52
- [ ] Design-AK 1280×720/390×844 (Screenshots im PR)
- [ ] Annotation NICHT nötig (noindex, kein Bestands-Traffic betroffen) — im PR-Text begründet

**Gates:** Standard 0.2 + `tool-e2e` + Opus-Protokoll.

---

## PR 4.3 — UK/CA/AU-Routen + hreflang-Cluster + atomarer Index-Flip

**Ziel:** `pension-calculator` (UK!), `retirement-calculator` (CA/AU) mit markt-spezifischen Rules, dann der 4er-Cluster (x-default US) und `indexable:true` für ALLE 4 in einem Commit.

**Modell/Review:** Sonnet 5; Fable-Review (Rules-Werte sind bereits Opus-geprüft aus #81).

**Dateien:**
- Create: `app/uk/tools/pension-calculator/page.tsx`, `app/ca/tools/retirement-calculator/page.tsx`, `app/au/tools/retirement-calculator/page.tsx` (gleiche Komposition, markt-eigene EXAMPLE_INPUTS + Benefit-Links: GOV.UK State Pension / Canadian Retirement Income Calculator / Moneysmart)
- Modify: `registry.ts`: 3 weitere Varianten + **im selben Commit** `indexable:true` auf allen 4 (atomarer Flip; hreflang entsteht automatisch aus `variants` via `buildToolMetadata`)
- Test: `e2e/tool-seo.spec.ts` deckt neue Routen registry-getrieben; zusätzlich markt-spezifische Rules-Assertions in `e2e/tool-shell-wealth-horizon.spec.ts`: AU-Seite nennt „12%" SG + Cap „$32,500"; UK-Seite nennt ISA/SIPP; CA nennt TFSA/RRSP-Räume nur als user-supplied Room

**Akzeptanzkriterien:**
- [ ] hreflang-Cluster vollständig reziprok ×4 + x-default→US (e2e-Assertion)
- [ ] Kein Zwischenzustand: vor diesem PR 4 Routen noindex, danach 4 indexierbar + Sitemap (ein Merge)
- [ ] AU-Beitrags-Helfer (`annualEligibleEarnings × SG/12`) editierbar; CA Room nie aus nationalem Maximum abgeleitet
- [ ] UK-Slug ist `pension-calculator` (Head-Term, Spec 9.1)

**Gates:** Standard 0.2 + `tool-e2e`.

---

## PR 4.4 — Supporting-Deep-Links (super/tfsa/isa ↔ Wealth Horizon)

**Ziel:** Die drei Supporting-Sparrechner und Wealth Horizon verlinken sich wechselseitig mit Fragment-Prefill über den 2.3-Codec.

**Modell/Review:** Sonnet 5; Fable-Review.

**Dateien:**
- Modify: `registry.ts`: `shareableFields` für superannuation/tfsa-rrsp/isa (nur Bänder + Modus-Felder)
- Modify: Superannuation-/TFSA-RRSP-/ISA-Widgets: „Project this in Wealth Horizon"-Link (Fragment mit gebuckten Feldern via `encodeShare`); Wealth Horizon: „Model just your {Super/TFSA/ISA}"-Rücklinks
- Modify: `wealth-horizon-journey.tsx`: Deep-Link-Prefill rendert **Chip „Your result"-Pfad mit sichtbarer Zeile „Using your {tool} inputs — edit"** — NICHT „Shared scenario" (Shared ausschließlich bei echtem Share; bindende Entscheidung)
- Test: `e2e/wealth-horizon-deeplinks.spec.ts` (JS-on): Super→WH übernimmt Bänder, Zeile sichtbar, Chip korrekt; Fragment enthält NIE Rohbeträge (`expect(fragment).not.toContain(<eingegebener Rohwert>)`)

**Akzeptanzkriterien:**
- [ ] Prefill-Fluss beidseitig; ohne Fragment unverändertes Verhalten
- [ ] Kein Rohbetrag im Fragment (Test); Canonicals bleiben clean
- [ ] `tool_view` auf WH mit Deep-Link zählt im selben Funnel-Scope (variantPath ohne Fragment)

**Gates:** Standard 0.2 + `tool-e2e`.

---

# Phase 5 — Home Decision Lab + Rest-Migrationen

## PR 5.1 — Mortgage-Engines ×3 + Testvektoren

**Ziel:** `repayment` (AU), `affordability` (CA, GDS/TDS/Stress/CMHC) und `remortgage` (UK) als pure Engines — mit **Quellen-Verifikation VOR der Implementierung**.

**Modell/Review:** Fable-Referenz (dieser Brief) + Quellen-Verifikationsauftrag → Sonnet 5 → **Opus 4.8 blockierender Review** (Regel-Korrektheit gegen die verifizierten Primärquellen).

**Quellen-Verifikation (bindend, Schritt 1 des Task-Briefs, VOR jedem Engine-Code):** Der Agent verifiziert per Web-Recherche gegen Primärquellen und legt die Ergebnisse als `RuleEntry`s (mit `sourceUrl` + `verifiedAt`, category 'limit' bzw. 'rate') in `lib/rules/ca.ts`/`uk.ts`/`au.ts` ab:
1. **OSFI B-20 Qualifying Rate** (Stress-Test: höherer Wert aus Vertragszins + 2 pp und Mindest-Qualifying-Rate — aktuellen Floor-Wert verifizieren, Spec-Platzhalter 5,25 % NICHT ungeprüft übernehmen)
2. **GDS/TDS-Richtwerte** (CMHC-Underwriting: Spec-Platzhalter 0,32/0,39 bzw. 0,44 — gegen aktuelle CMHC-Kriterien verifizieren; Label „guideline", NIE „gesetzlich")
3. **CMHC-Prämien-Stufen** nach LTV (Bänder + Prozentsätze von cmhc-schl.gc.ca)
4. UK-Kontext: typische Arrangement-Fee-Spanne NUR als editierbarer Default mit Quelle, kein „Live-Zins"
5. AU: keine neuen Pflichtwerte (Zins bleibt Nutzereingabe mit dated Kontext-Quelle)

**Quellen schlagen Spec-Platzhalter; jede Abweichung wird im PR-Text als Drift ausgewiesen.**

**Dateien:**
- Create: `lib/calc/mortgage/repayment.ts`, `lib/calc/mortgage/affordability.ts`, `lib/calc/mortgage/remortgage.ts`
- Modify (additiv): `lib/rules/{ca,uk,au}.ts` (verifizierte Einträge oben)
- Test: `__tests__/unit/calc/mortgage-repayment.test.ts`, `mortgage-affordability.test.ts`, `mortgage-remortgage.test.ts`

### Referenz-Signaturen + Kernformeln

```ts
// lib/calc/mortgage/repayment.ts (AU) — pure, monthly amortization
export interface RepaymentInputs {
  principal: number; annualRatePct: number; termYears: number;
  offsetBalance?: number;                 // reduces interest-bearing principal each month
  repaymentFrequency?: 'monthly';         // v1: monthly only (fortnightly = Phase-6-Kandidat)
}
export interface RepaymentResult {
  monthlyPayment: number;                 // standard annuity on FULL principal (offset shortens term, not payment)
  totalInterest: number;
  months: number;                         // actual months incl. offset effect
  schedule: { month: number; remaining: number; interest: number }[];
  offsetSavings?: { interestSaved: number; monthsSaved: number };
}
export function computeRepayment(inputs: RepaymentInputs): RepaymentResult;
// Kern: payment = P × r/(1−(1+r)^−n), r = annualRatePct/100/12, n = termYears×12.
// Offset-Monat: interest = max(0, remaining − offsetBalance) × r; payment fix;
// remaining += interest − payment. rate 0 ⇒ payment = P/n (Grenzfall, getestet).

// lib/calc/mortgage/affordability.ts (CA)
export interface AffordabilityInputs {
  grossAnnualIncome: number; monthlyDebts: number; downPayment: number;
  contractRatePct: number; termYears: number;
  monthlyHeatingCost: number; annualPropertyTax: number; condoFeesMonthly?: number;
}
export interface AffordabilityResult {
  qualifyingRatePct: number;              // max(contract + 2, floor aus Rules) — Stress-Test
  maxPurchasePrice: { low: number; high: number };   // Bandbreite: GDS-bound vs TDS-bound
  paymentStack: { key: 'principal-interest' | 'tax' | 'heat' | 'condo-half'; label: string; value: number }[];
  gdsAtMax: number; tdsAtMax: number;     // gegen Rules-Richtwerte
  cmhc: { required: boolean; premiumPct: number; premiumAmount: number } | null;  // LTV-Stufen aus Rules
  riskBuffer: { paymentAtContract: number; paymentAtQualifying: number };         // sichtbarer Puffer
}
export function computeAffordability(inputs: AffordabilityInputs, rules: RuleSnapshot): AffordabilityResult;
// GDS = (P&I@qualifying + tax/12 + heat + condo/2) / (income/12) ≤ gdsThreshold;
// TDS = GDS-Zähler + monthlyDebts ≤ tdsThreshold; maxPrice per Bisektion über P&I
// (Bisektion deterministisch, 60 Iterationen, Toleranz $1).

// lib/calc/mortgage/remortgage.ts (UK)
export interface RemortgageInputs {
  currentBalance: number; currentRatePct: number; remainingTermYears: number;
  offerRatePct: number; offerDealYears: number; fees: number;   // arrangement + legal + valuation gesamt
}
export interface RemortgageResult {
  monthlySavings: number;                 // current payment − offer payment (gleiche Restlaufzeit)
  totalInterestCurrentDeal: number;       // über offerDealYears
  totalInterestOfferDeal: number;
  breakEvenMonths: number | null;         // ceil(fees / monthlySavings); null wenn savings ≤ 0
  netSavingsOverDeal: number;             // (monthlySavings × dealMonths) − fees
}
export function compareRemortgage(inputs: RemortgageInputs): RemortgageResult;
```

**Tests-first (Vektoren):**
- `official`: CMHC-Prämienstufen + GDS/TDS/Qualifying-Floor exakt gegen die frisch verifizierten RuleEntries (Werte hier bewusst NICHT vorweggenommen — Quelle gewinnt)
- `reference`: je Engine 2 Golden Fixtures doppelt gerechnet (Annuität gegen Tabellenkalkulation; Affordability-Grenzfall knapp unter/über GDS-Grenze; Remortgage mit Break-even Monat 14)
- `invariant`: Stress +2 pp ⇒ maxPurchasePrice sinkt monoton; Offset-Monotonie (mehr Offset ⇒ nie mehr Zins, nie längere Laufzeit); Zins 0 ⇒ payment = P/n und totalInterest 0; GDS-bound ≤ TDS-bound-Preis wenn Debts > 0; breakEvenMonths null bei negativem Saving; fees 0 ⇒ breakEven 0/1; Bisektion konvergiert (maxPrice±1 erfüllt/verletzt Grenze)

**Akzeptanzkriterien:**
- [ ] Alle Regel-Werte stammen aus `lib/rules` mit sourceUrl+verifiedAt — `rg "0\.32|0\.39|0\.44|5\.25" lib/calc/mortgage` → 0 Treffer (keine hartcodierten Richtwerte)
- [ ] Drift Spec-Platzhalter ↔ verifizierte Werte im PR-Text tabelliert
- [ ] Label-Wording „guideline" im Rules-Label; nirgends „legally required"
- [ ] Reine lib — keine Route berührt (jederzeit mergebar)
- [ ] Opus-Protokoll bestätigt Formeln + Quellen

**Gates:** Standard 0.2 + Opus-Protokoll.

---

## PR 5.2 — Home-Lab-Shell (3 Routen) + Gate-PR 5.2g

**Ziel:** au-mortgage, ca-affordability und uk-remortgage laufen als Home Decision Lab in der PrecisionWorksheet-Shell (URLs unverändert), mit Payment Stack, Risikopuffer und Warning-Token-Block.

**Modell/Review:** Sonnet 5 → **Opus-Finalprüfung** (Zahlen-Bindung UI↔Engine).

**Dateien:**
- Create: Adapter `lib/tools/results/home-lab-results.ts` (`buildRepaymentResult`/`buildAffordabilityResult`/`buildRemortgageResult` → `ToolResult`; scenario kinds: repayment 'corridor' (Restschuld), affordability 'range' + paymentStack als 'stack', remortgage 'bars' (current vs offer vs break-even-Marker))
- Modify: 3 Pages (`app/au/tools/au-mortgage-calculator/`, `app/ca/tools/ca-mortgage-affordability-calculator/`, `app/uk/tools/remortgage-calculator/`) → ToolShell + PrecisionWorksheet; je neue Island; alte Komponenten + `Dynamic*`-Exports (au/ca sind dynamic-Muster; remortgage statisch) löschen; 3 Allowlist-Zeilen raus
- Modify: `registry.ts`: `shareableFields` Home Lab (Spec 8.7: priceBand, depositBand, termYears, ratePct, market) + `hubExample` kind 'stack'
- Modify: Zins-Eingabefelder zeigen Quelle+Datum der Kontext-Rule („Reference rate as of {date} — {source}; edit to match your offer"); Stress-/Puffer-Block nutzt `--sfp-warning-*`-Token
- Modify: Annotation (+ 5.2-Merge)
- Test: `e2e/tool-shell-home-lab.spec.ts` (JS-off ×3: Worked Example, Payment Stack sichtbar, Warning-Block mit Warning-Tokens, GDS/TDS-Werte identisch mit Engine-Fixture)

**Akzeptanzkriterien:**
- [ ] URLs/Slugs unverändert (kein Redirect nötig); Metadaten weiter aus PR 0.2
- [ ] `export const revalidate = 86400` auf allen 3 Pages (Spec 8.5 — Regel-Stichtags-Flips greifen ohne Deploy); Stale-SLA-Verletzung einer kritischen Rule rendert State `stale-data`
- [ ] Jede angezeigte Zahl kommt aus dem Adapter (kein zweiter Rechenpfad in der Island)
- [ ] Risikopuffer-Anzeige: Rate bei Vertragszins vs. Qualifying-/Stress-Zins nebeneinander
- [ ] 3 Allowlist-Zeilen entfernt; framer-motion-Import aus remortgage-Widget entfernt
- [ ] Design-AK 1280×720/390×844 je Route

**Gates:** Standard 0.2 + `tool-e2e` + Opus-Protokoll.

## PR 5.2g — Indexability-Gate: uk/remortgage

Wie 2.3g: `indexable:true` nur mit vollständig belegter 10-Kriterien-Checkliste im PR-Text (Calc-Tests ✓5.1, Daten ✓5.1-Verifikation, Rest einzeln belegen). Nicht bestanden → kein PR.

---

## PR 5.3 — Rest-Migrationen (4 Teil-PRs)

### 5.3a — Credit Utilization Explorer (ATOMAR) + Gate-PR 5.3a-g

**Ziel:** `credit-score-simulator` wird in EINEM PR zum „Credit Utilization & Score Impact Explorer": neue Route, 308, Registry-Slugwechsel, Band-Engine, Shell.

**Modell/Review:** Sonnet 5; Fable-Review (Slug-/Redirect-Teil ist SEO-riskant, Route ist aber noindex → risikoarm).

**Dateien:**
- Create: `lib/calc/credit/utilization.ts` — `exploreUtilization(cards: CreditCard[], actions: UtilizationAction[]): ImpactBand[]` mit `ImpactBand { actionKey; label; utilizationBefore; utilizationAfter; scoreImpact: { direction: 'up'|'down'|'neutral'; band: 'small'|'moderate'|'large' }; explanation }` — **Bänder-Typ erzwingt: keine Punkt-Scores**
- Create: `app/(marketing)/tools/credit-utilization-explorer/page.tsx` (Shell, LiveCanvas) + Island
- Modify: `next.config.ts` (308 `/tools/credit-score-simulator` → `/tools/credit-utilization-explorer`), `registry.ts` (ToolId bleibt `credit-utilization` — war schon so benannt; Variante path/title/h1 neu, `legacyPaths: ['/tools/credit-score-simulator']`), alte Route + Komponente + Dynamic-Export + Allowlist-Zeile löschen
- Test: `__tests__/unit/calc/credit-utilization.test.ts` (invariant: mehr Paydown ⇒ Utilization sinkt monoton; Richtung/Band-Mapping deterministisch; 0-Limit-Karten → definierter Fehlerpfad), Redirect-Test im bestehenden legacyPaths-Coverage-Test, `e2e/tool-shell-credit-utilization.spec.ts` (JS-off; Copy enthält „ranges instead of false precision", NIE eine exakte Score-Zahl als Versprechen)

**AK:** atomar (kein Zwischenzustand alte+neue Route live); 308 funktioniert; fs-Parity grün; framer-motion raus. **Gate-PR 5.3a-g** danach wie 2.3g.

### 5.3b — AI-ROI (Business-Kontext) + Loan (Entscheidungskontext)

**Ziel:** Beide in die Shell (LiveCanvas bzw. PrecisionWorksheet laut Registry-`shellMode`), Copy-Reframing laut Spec 9.3 (AI-ROI = B2B-Payback; Loan = „borrow or not"-Entscheidung mit Konsolidierungs-Szenario), Engines nach `lib/calc/{business/ai-roi,debt/loan}.ts` extrahiert (reference+invariant-Vektoren), Dynamic-Exports + Allowlist-Zeilen raus.
**AK:** kein Rechenpfad mehr in Komponenten; Brücken aus `getBridge`; Design-AK mobil.

### 5.3c — Wealthsimple Fees + Rewards

**Ziel:** Beide in die Shell (LiveCanvas), Engines nach `lib/calc/savings/fee-drag.ts` bzw. `lib/calc/credit/rewards.ts`, Anbieter-Preise als dated RuleEntries (Wealthsimple-Preisseite + Issuer-Verzeichnisse mit verifiedAt), Dynamic-Exports + Allowlist-Zeilen raus.
**AK:** Preis-Behauptungen nur mit Quelle+Datum im AssumptionsDrawer.

### 5.3d — isa/tfsa-rrsp/superannuation/gold-roi in die Shell + Abschluss-Aufräumen

**Ziel:** Die letzten 4 Widgets migrieren; danach ist die Legacy-Ära beendet.

**Dateien/Schritte:**
1. 4 Widgets → Shell (LiveCanvas; Engines `lib/calc/savings/{isa,tfsa-rrsp,super}.ts` + `lib/calc/gold/roi.ts`; Rules-Bindung existiert seit 0.4; Deep-Links aus 4.4 bleiben)
2. `components/tools/dynamic-calculators.tsx` **löschen** — vorher Beweis: `rg "dynamic-calculators" app components` → 0 Konsumenten
3. framer-motion: `rg "framer-motion" components/tools` → 0 → Paket bleibt (Dashboard/Marketing nutzen es weiter — NUR entfernen falls `rg "framer-motion" --type ts -l` außerhalb `components/tools` auch leer ist; sonst im PR-Text dokumentieren)
4. Hydration-Allowlist ist leer → Allowlist-Mechanik aus `check-hydration-safety.sh` entfernen (voller Scope für `components/tools`)
5. Annotation (+ 5.3d-Merge)

**AK:** `- [ ]` Allowlist leer + Mechanik entfernt · `- [ ]` dynamic-calculators.tsx gelöscht mit 0-Konsumenten-Beweis · `- [ ]` alle 20+1 Routen rendern JS-off ihr Worked Example (tool-shell-e2e-Sweep über die Registry) · `- [ ]` First-Load-JS-Bilanz aller migrierten Routen im PR-Text.

---

# Ausführung & Status

## PR-Text-Template (jeder PR)

```
## Was
<Änderung in 3–6 Zeilen; Verhaltensänderungen explizit nummeriert>

## Spec-/Plan-Referenz
Product-Experience-Plan PR <n> — <Titel>; Spec-Kapitel <x>

## Gate-Checkliste
- [ ] npx tsc --noEmit ✓
- [ ] npm run check:imports + check:hydration ✓
- [ ] npx vitest run ✓ (<n> Files / <n> Tests)
- [ ] npm run build ✓ 0 Errors
- [ ] Playwright: <Specs> ✓
- [ ] cockpit_v1-Diff leer (git diff main -- lib/analytics/cockpit-*) ✓
- [ ] <PR-spezifische AK aus dem Brief, einzeln>

## Review
<Fable-Review-Ergebnis; bei kritischen PRs: Opus-Protokoll mit Prüfpunkten>
```

## Status-Checkliste (Fable pflegt beim Merge)

- [ ] W1: PR 1.1 gemerged
- [ ] W2: PR 1.2 gemerged · PR 1.4 gemerged
- [ ] W3: PR 1.3 gemerged → **Baseline-Start am ____** · PR 2.1 gemerged
- [ ] Baseline-Ende am ____ (7–14 Tage; Entscheidung dokumentieren)
- [ ] W4: PR 2.2 gemerged (Datum ____) · PR 2.3 gemerged · PR 2.3g entschieden · PR 4.1 gemerged
- [ ] W4: PR 2.4 gemerged (≥ Baseline-Ende UND ≥ 2.2 + 3 Tage)
- [ ] W5: PR 3.1 gemerged · PR 5.1 gemerged
- [ ] W6: 3.2 → 3.3 → 3.4 gemerged · 4.2 → 4.3 → 4.4 gemerged
- [ ] W7: 5.2 gemerged · 5.2g entschieden · 5.3a(+g) → 5.3b ∥ 5.3c → 5.3d gemerged
- [ ] Abschluss: Memory-Update `fdl-decision-lab-status.md` + CLAUDE.md-Drift-Mini-PR (Tailwind v3, Tool-Zahl) separat vorschlagen




