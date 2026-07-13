'use client';
// components/tools/shell/result-panel.tsx
// State machine is `advancePanelState` (lib/tools/shell-types.ts); this
// component only RENDERS a given PanelState — it does not own transitions
// (the tool page's input handling calls advancePanelState and re-renders).
// Sections are in the FIXED order from SPEC 6.1: (1) answer → (2) primary
// number+range → (3) ScenarioChart → (4) ImpactLevers → (5) AssumptionsDrawer
// → (6) NextBestAction. insufficient-data/error render guidance INSTEAD of
// (2)-(6), never a blank panel.
//
// `announce` is an externally-supplied throttled callback (built via
// lib/tools/aria-live.ts createLiveAnnouncer by the page/shell that also owns
// the actual `aria-live="polite"` DOM node) — ResultPanel's job is only to
// call it with the right sentence at the right time, not to own the live
// region itself (keeps the throttle's backing state out of this component's
// re-render cycle).

import { useEffect } from 'react';
import type { Lever, PanelState, ToolResult } from '@/lib/tools/shell-types';
import type { ToolContext } from '@/lib/analytics/tool-events';
import { ScenarioChart } from './scenario-chart';
import { ImpactLevers } from './impact-levers';
import { AssumptionsDrawer } from './assumptions-drawer';
import { NextBestAction } from './next-best-action';

export interface ResultPanelProps {
  state: PanelState;
  result: ToolResult | null;             // null except in result/stale-data (initial: worked example passed separately)
  exampleResult: ToolResult;             // SSR worked example — rendered while state ∈ {initial, ready}
  ctx: ToolContext;                      // analytics context, forwarded to NextBestAction's tracker leaf
  onLeverApply?: (lever: Lever) => void; // fires trackInputChange(controlRole:'lever')
  announce: (sentence: string) => void;  // throttled aria-live (lib/tools/aria-live.ts)
  /** Additive, optional: missing-field jump links for the insufficient-data guidance block. */
  missingFields?: { label: string; anchor: string }[];
  /** Additive, optional: retry handler for the error state's "Try again" action. */
  onRetry?: () => void;
  children?: never;
}

const CHIP_LABEL = { example: 'Example result', yours: 'Your result', shared: 'Shared scenario' } as const;

function StateChip({ resultState }: { resultState: ToolResult['resultState'] }) {
  const styles =
    resultState === 'yours'
      ? { background: 'var(--sfp-navy)', color: '#fff', border: 'none' }
      : resultState === 'shared'
        ? { background: 'var(--sfp-sky)', color: 'var(--sfp-navy)', border: '1px solid var(--sfp-navy)' }
        : { background: 'transparent', color: 'var(--sfp-slate)', border: '1px dashed var(--tool-border-strong)' };
  return (
    <span
      className="result-chip inline-flex flex-none items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={styles}
    >
      {CHIP_LABEL[resultState]}
    </span>
  );
}

function formatPrimary(primary: ToolResult['primary']): string {
  if (primary.format === 'currency') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: primary.currency ?? 'USD',
      maximumFractionDigits: 0,
    }).format(primary.value);
  }
  if (primary.format === 'percent') return `${primary.value}%`;
  if (primary.format === 'years') return `${primary.value} yrs`;
  return String(primary.value);
}

function formatRangeBound(primary: ToolResult['primary'], v: number): string {
  if (primary.format === 'currency') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: primary.currency ?? 'USD',
      maximumFractionDigits: 0,
    }).format(v);
  }
  if (primary.format === 'percent') return `${v}%`;
  if (primary.format === 'years') return `${v} yrs`;
  return String(v);
}

export function ResultPanel({
  state,
  result,
  exampleResult,
  ctx,
  onLeverApply,
  announce,
  missingFields,
  onRetry,
  children: _children,
}: ResultPanelProps) {
  const showingExample = state === 'initial' || state === 'ready' || state === 'calculating';
  const active = showingExample ? exampleResult : result;

  useEffect(() => {
    if ((state === 'result' || state === 'stale-data') && result) {
      announce(result.answer);
    }
  }, [state, result, announce]);

  return (
    <div
      className="panel panel-pad flex flex-col gap-4 rounded-tool-panel border p-5"
      style={{ borderColor: 'var(--tool-border)', background: 'var(--tool-surface)', boxShadow: 'var(--tool-shadow)' }}
    >
      <div className="chip-row flex flex-wrap items-center gap-2.5">
        <StateChip resultState={showingExample ? exampleResult.resultState : (result?.resultState ?? 'example')} />
        {state === 'stale-data' ? (
          <span
            className="warning-block flex items-center gap-2 rounded-tool-control border px-3 py-1.5 text-sm"
            style={{
              background: 'var(--sfp-warning-bg)',
              borderColor: 'var(--sfp-warning-border)',
              color: 'var(--sfp-warning-foreground)',
            }}
          >
            Some rules were last verified a while ago — results may be outdated.
          </span>
        ) : null}
      </div>

      {state === 'insufficient-data' ? (
        <div role="status" className="flex flex-col gap-2 text-sm text-[var(--sfp-ink)]">
          <p className="answer m-0 text-[18px] leading-[26px]">
            We need a few more details before we can calculate your result.
          </p>
          {missingFields && missingFields.length > 0 ? (
            <ul className="flex flex-col gap-1">
              {missingFields.map((f) => (
                <li key={f.anchor}>
                  <a href={`#${f.anchor}`} className="text-[var(--sfp-navy)] no-underline hover:underline">
                    {f.label}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : state === 'error' ? (
        <div role="alert" className="flex flex-col gap-2 text-sm text-[var(--sfp-ink)]">
          <p className="answer m-0 text-[18px] leading-[26px]">
            Something went wrong while calculating your result. Your inputs are still here.
          </p>
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="btn min-h-11 w-fit rounded-tool-control border px-4 text-sm font-semibold"
              style={{ borderColor: 'var(--tool-border-strong)', background: 'var(--tool-surface)', color: 'var(--sfp-ink)' }}
            >
              Try again
            </button>
          ) : null}
        </div>
      ) : active ? (
        <>
          {/* (1) answer sentence */}
          <p className="answer m-0 text-[18px] leading-[26px] text-[var(--sfp-ink)]">
            {state === 'calculating' ? <span aria-hidden="true">…</span> : active.answer}
          </p>

          {/* (2) primary number + range */}
          <div className="flex flex-col gap-1">
            {state === 'calculating' ? (
              <div
                aria-hidden="true"
                className="h-[52px] w-[220px] animate-pulse rounded-tool-control"
                style={{ background: 'var(--tool-surface-muted)' }}
              />
            ) : (
              <>
                <span className="t-num-hero tabular-nums text-[44px] font-bold leading-[52px] text-[var(--sfp-ink)]">
                  {formatPrimary(active.primary)}
                </span>
                <span className="range-note text-sm text-[var(--sfp-slate)]">
                  Realistic range: {formatRangeBound(active.primary, active.primary.range.low)} –{' '}
                  {formatRangeBound(active.primary, active.primary.range.high)}
                </span>
              </>
            )}
          </div>

          {/* (3) scenario visual */}
          <ScenarioChart data={active.scenario} />

          {/* (4) exactly 3 levers */}
          <ImpactLevers levers={active.levers} onApply={onLeverApply} />

          {/* (5) assumptions + sources */}
          <AssumptionsDrawer assumptions={active.assumptions} sources={active.sources} />

          {/* (6) exactly one next best action */}
          <NextBestAction action={active.nextAction} ctx={ctx} />
        </>
      ) : null}
    </div>
  );
}
