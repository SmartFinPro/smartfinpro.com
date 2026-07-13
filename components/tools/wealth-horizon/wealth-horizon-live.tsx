'use client';
// components/tools/wealth-horizon/wealth-horizon-live.tsx
// Wealth Horizon v4 — consistent slider-only input surface (bindende
// User-Direktive 13.07.2026, superseding v3's "no sliders anywhere" Clean-
// Redesign rule for Normal mode specifically). Structural reference is
// still a Quirion-style ETF-savings-plan calculator — ONE big white panel,
// numbered steps on the left, a calm single-hero result on the right. Every
// displayed number still comes from buildWealthHorizonResult()/the
// retirement engine — no second calc path lives in this file (harte Regel,
// unverändert seit v1).
//
// v3 replaced the v2 3-way scenario switcher with two plain fields —
// "Expected annual return" (nominal) and "Expected inflation" — converted to
// the engine's REAL-terms RuleSnapshot by
// lib/tools/results/wealth-horizon-real-return.ts (engine itself stays real
// and untouched); that bridge is UNCHANGED in v4. The v2 Lifetime Path
// corridor/decumulation chart stays replaced by the v3 stacked
// contribution-vs-growth bar chart (contribution-growth-chart.tsx).
//
// v4 additions (this file):
//   - Every Normal-mode numeric field (Steps 1/2/4/5 + Advanced settings) is
//     now a slider-only control (./slider-field.tsx) — CurrencyField/
//     IntegerField/PercentageField + PresetChips are GONE from Normal mode.
//     Account-breakdown ("detailed accounts") mode is explicitly OUT of
//     scope — it keeps its existing text fields (SPEC 7.3 Financial Field
//     family), since that's a different, opt-in editing surface.
//   - SPEC-Regel-7-Abweichung (dokumentiert, bindende User-Direktive
//     13.07.2026): SPEC design rule 7 requires numeric direct entry
//     alongside any slider. Wealth Horizon v4's Normal mode deliberately
//     ships slider-only per this explicit instruction — the native
//     <input type="range"> stays fully keyboard-operable (arrow keys,
//     Home/End) and aria-valuetext always carries the exact formatted
//     value, so the control stays screen-reader accessible without a
//     parallel text box. See slider-field.tsx's own header for the same
//     note.
//   - Step 3's two age IntegerFields are replaced by one two-handle
//     lifetime-range slider (./lifetime-range.tsx).
//   - Step 2 gained a same-step "Increase contributions each year" slider
//     (contributionGrowthPct, 0–5%) wired straight to the engine's new
//     RetirementBaseInputs.contributionGrowthPct (lib/calc/retirement/
//     engine.ts) — a dynamic hint below it uses the engine's OWN
//     monthlyContributionInYear() helper, so the UI copy and the engine's
//     actual math can never diverge.
//
// Parametrized to run all 4 markets from ONE island (props identical in
// spirit to the v1/v2/v3 WealthHorizonLiveProps — FDL 4.3 parametrization
// untouched).

import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { ImpactLevers } from '@/components/tools/shell/impact-levers';
import { AssumptionsDrawer } from '@/components/tools/shell/assumptions-drawer';
import { NextBestAction } from '@/components/tools/shell/next-best-action';
import { ResultMiniBar } from '@/components/tools/shell/result-mini-bar';
import { CurrencyField } from '@/components/tools/shell/fields/currency-field';
import { BaseField } from '@/components/tools/shell/fields/base-field';
import { createLiveAnnouncer } from '@/lib/tools/aria-live';
import { advancePanelState, type Lever, type PanelState, type ToolCurrency, type ToolResult } from '@/lib/tools/shell-types';
import { useToolTracking } from '@/lib/analytics/tool-tracking';
import type { ToolContext, InputBucketKind } from '@/lib/analytics/tool-events';
import type { ToolMarket } from '@/lib/tools/registry/types';
import { getTool } from '@/lib/tools/registry';
import type { RuleSnapshot } from '@/lib/rules';
import { formatCurrency, formatPercent } from '@/lib/tools/field-format';
import {
  applyLever,
  buildContributionChecks,
  LEVER_EXTRA_MONTHLY,
  monthlyContributionInYear,
} from '@/lib/calc/retirement/engine';
import type {
  RetirementAccountInput,
  RetirementAccountType,
  RetirementInputs,
} from '@/lib/calc/retirement/types';
import { buildWealthHorizonResult } from '@/lib/tools/results/wealth-horizon-result';
import { buildRealReturnRuleSnapshot, type RealReturnClamp } from '@/lib/tools/results/wealth-horizon-real-return';
import { buildContributionGrowthSeries } from '@/lib/tools/results/wealth-horizon-contribution-series';
import { interpolateCountUp } from '@/lib/tools/count-up';
import { ContributionGrowthChart } from './contribution-growth-chart';
import type { StackedBarInput } from '@/lib/calc/chart-geometry';
import { SliderField } from './slider-field';
import { LifetimeRange, type LifetimeValues } from './lifetime-range';

/** Account types whose contribution room is a PERSONAL figure the user must
 *  supply (`availableRoom`) — never derived from a national maximum. Single
 *  source shared with lib/calc/retirement/engine.ts's own roomTypes list
 *  (kept here as a literal, not imported, because it's UI-rendering
 *  classification, not a calculation). */
const ROOM_ACCOUNT_TYPES: RetirementAccountType[] = ['ca-tfsa', 'ca-rrsp', 'au-super'];

export interface WealthHorizonLiveProps {
  market: ToolMarket;
  variantPath: string;
  rules: RuleSnapshot;
  exampleResult: ToolResult;
  /** Fable-Review Fix 2 (v2, still binding in v3) — the SAME RetirementInputs
   *  the page used to build `exampleResult` server-side. The island's
   *  initial `useState` is seeded from this, never from a second hard-coded
   *  literal, so the SSR worked example and the live start state can never
   *  drift apart again. */
  defaultInputs: Extract<RetirementInputs, { contributionMode: 'simple' }>;
  /** v3 addition — the Step-4/5 "Expected annual return"/"Expected
   *  inflation" starting values, shared the same way `defaultInputs` is (one
   *  constant read by both the SSR page and this island's useState seed —
   *  lib/tools/results/wealth-horizon-defaults.ts). */
  defaultReturnAssumptions: { returnNominalPct: number; inflationPct: number };
  currency: ToolCurrency;
  locale: string;
  /** Account types selectable in "detailed accounts" mode, market subset of
   *  RetirementAccountType (FDL 4.3 parametrization). */
  accountTypeOptions: { value: RetirementAccountType; label: string }[];
  /** Local name for the market's state/national retirement benefit, e.g.
   *  "Social Security", "State Pension", "CPP/OAS", "Age Pension". */
  benefitName: string;
  benefitLinkUrl: string;
  benefitLinkLabel: string;
}

const ACCOUNT_TYPE_HELP: Partial<Record<RetirementAccountType, string>> = {
  'ca-tfsa': 'This is your personal room from CRA MyAccount — never derived from the national maximum.',
  'ca-rrsp': 'This is your personal room from CRA MyAccount — never derived from the national maximum.',
  'au-super':
    'Your personal unused concessional cap carry-forward, from your ATO online account (myGov) — never derived from the national cap.',
};

/** Step 4's three return presets — now rendered as clickable slider TICKS
 *  (v4) rather than preset chip buttons (v3). The label IS still the
 *  trackScenarioCompare() argument (lowercased), NOT the engine's
 *  conservative/base/optimistic scenario keys (that 3-way switcher is gone
 *  since v3 — see lib/tools/results/wealth-horizon-real-return.ts's header). */
const RETURN_PRESETS: { key: 'conservative' | 'balanced' | 'optimistic'; label: string; value: number }[] = [
  { key: 'conservative', label: 'Conservative 5.5%', value: 5.5 },
  { key: 'balanced', label: 'Balanced 7.5%', value: 7.5 },
  { key: 'optimistic', label: 'Optimistic 9%', value: 9 },
];

function leverTrackingValue(lever: Lever): { value: number; kind: InputBucketKind } {
  if (lever.key === 'fees') return { value: lever.apply?.annualFeePct ?? 0, kind: 'percent' };
  if (lever.key === 'retire-later') return { value: 2, kind: 'years' };
  return { value: LEVER_EXTRA_MONTHLY, kind: 'currency' };
}

function checkChipStyle(status: 'not-applicable' | 'ok' | 'warning' | 'clamped'): CSSProperties {
  if (status === 'warning' || status === 'clamped') {
    return { background: 'var(--sfp-warning-bg)', borderColor: 'var(--sfp-warning-border)', color: 'var(--sfp-warning-foreground)' };
  }
  return { background: 'var(--tool-surface-muted)', borderColor: 'var(--tool-border)', color: 'var(--sfp-slate)' };
}

const CONTEXT_CHIP_STYLE: CSSProperties = { background: 'var(--sfp-sky)', borderColor: 'var(--sfp-sky)', color: 'var(--sfp-navy)' };

// ── v3 layout primitives (local to this file — not shared, so they never
//    drift from the DESIGN-DIREKTIVE's exact numbers: 28px badge, 15px title) ─

function NumberedStep({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex h-7 w-7 flex-none items-center justify-center rounded-full text-[13px] font-semibold tabular-nums text-white"
          style={{ background: 'var(--sfp-navy)' }}
        >
          {n}
        </span>
        <h3 className="m-0 text-[15px] font-semibold text-[var(--sfp-ink)]">{title}</h3>
      </div>
      <div className="flex flex-col gap-3 pl-10">{children}</div>
    </div>
  );
}

function GoldPill({ children }: { children: ReactNode }) {
  return (
    <span
      data-testid="fi-pill"
      className="inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold"
      style={{
        background: 'color-mix(in srgb, var(--sfp-gold) 14%, transparent)',
        border: '1px solid color-mix(in srgb, var(--sfp-gold) 45%, transparent)',
        // --sfp-warning-foreground (#8A5A00) statt reinem Gold: #F5A623 auf
        // hellem Tint hat nur ~1.9:1 Kontrast — dunkles Amber ist AA-fest.
        color: 'var(--sfp-warning-foreground)',
      }}
    >
      {children}
    </span>
  );
}

/** Hero count-up (DESIGN-DIREKTIVE item 2): ~500ms ease-out from the
 *  PREVIOUS displayed value to the new one, via requestAnimationFrame — the
 *  pure easing/interpolation math is unit-tested (lib/tools/count-up.ts).
 *  `prefers-reduced-motion: reduce` sets the value immediately, no rAF loop. */
function useCountUp(target: number): number {
  const [display, setDisplay] = useState(target);
  const prevRef = useRef(target);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setDisplay(target);
      prevRef.current = target;
      return;
    }
    const from = prevRef.current;
    const to = target;
    if (from === to) return undefined;
    const duration = 500;
    const startTime = performance.now();
    function tick(now: number): void {
      const progress = Math.min(1, (now - startTime) / duration);
      setDisplay(interpolateCountUp(from, to, progress));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        prevRef.current = to;
      }
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  return display;
}

export function WealthHorizonLive({
  market,
  variantPath,
  rules,
  exampleResult,
  defaultInputs,
  defaultReturnAssumptions,
  currency,
  locale,
  accountTypeOptions,
  benefitName,
  benefitLinkUrl,
  benefitLinkLabel,
}: WealthHorizonLiveProps) {
  const ctx: ToolContext = useMemo(
    () => ({ toolId: 'wealth-horizon', market, variantPath, shellMode: getTool('wealth-horizon').shellMode }),
    [market, variantPath],
  );
  const tracker = useToolTracking(ctx);

  const initialAccountType = accountTypeOptions[0]!.value;

  const [mode, setMode] = useState<'simple' | 'account-breakdown'>('simple');
  const [base, setBase] = useState({
    currentAge: defaultInputs.currentAge,
    retireAge: defaultInputs.retireAge,
    targetMonthlyIncomeToday: defaultInputs.targetMonthlyIncomeToday,
    annualFeePct: defaultInputs.annualFeePct,
    withdrawalRatePct: defaultInputs.withdrawalRatePct,
  });
  // v3 Step 1/2 — collapsed to ONE "Starting amount" number (the engine only
  // ever sums taxAdvantagedBalance+taxableBalance into a single
  // startingBalance — see lib/calc/retirement/engine.ts's
  // totalContributions() — so seeding from the SUM of the v2 defaults
  // preserves exact numeric parity with WEALTH_HORIZON_DEFAULT_INPUTS/
  // exampleResult while presenting one clean field). Employer match moves to
  // Advanced settings (documented v3 UI decision — see the report's "offene
  // Punkte").
  const [startingAmount, setStartingAmount] = useState(
    defaultInputs.simple.taxAdvantagedBalance + defaultInputs.simple.taxableBalance,
  );
  const [monthlyContribution, setMonthlyContribution] = useState(defaultInputs.simple.employeeContributionMonthly);
  const [employerContributionMonthly, setEmployerContributionMonthly] = useState(
    defaultInputs.simple.employerContributionMonthly ?? 0,
  );
  const [accounts, setAccounts] = useState<RetirementAccountInput[]>([
    {
      id: 'acc-1',
      type: initialAccountType,
      balance: defaultInputs.simple.taxAdvantagedBalance,
      employeeContributionMonthly: defaultInputs.simple.employeeContributionMonthly,
    },
  ]);
  const [benefit, setBenefit] = useState({ enabled: false, monthlyAmountToday: 0, startsAtAge: 67 });

  // v3 Step 4/5 — nominal return + inflation (real return handed to the
  // engine via buildRealReturnRuleSnapshot below, never these raw numbers).
  const [returnNominalPct, setReturnNominalPct] = useState(defaultReturnAssumptions.returnNominalPct);
  const [inflationPct, setInflationPct] = useState(defaultReturnAssumptions.inflationPct);

  // v4 Step 2 addition — optional REAL annual escalation of employee
  // contributions (0–5%, default 0 = flat, bit-identical to pre-v4 engine
  // behavior). Fed straight into RetirementBaseInputs.contributionGrowthPct
  // below (lib/calc/retirement/engine.ts's own escalation loop).
  const [contributionGrowthPct, setContributionGrowthPct] = useState(0);

  // AU-only helper state (never part of RetirementInputs itself; it only
  // pre-fills an employer-contribution field, which stays freely editable
  // afterward — "editable suggestion, never fixed").
  const [auEligibleEarnings, setAuEligibleEarnings] = useState<number | ''>('');

  // Live-Workspace: no step flow, no "See my result" gate. panelState still
  // flows through advancePanelState (INPUT_CHANGED → CALC_STARTED →
  // CALC_SUCCEEDED) on the FIRST real field change, driving the
  // 'example' → 'yours' resultState transition — the calc itself is
  // synchronous/pure, so both events fire together, never leaving a visible
  // 'calculating' frame.
  const [panelState, setPanelState] = useState<PanelState>('initial');
  const [announcement, setAnnouncement] = useState('');
  const nextAccountId = useRef(2);
  const firstResultTracked = useRef(false);

  const announcerRef = useRef<ReturnType<typeof createLiveAnnouncer> | null>(null);
  if (!announcerRef.current) announcerRef.current = createLiveAnnouncer((s) => setAnnouncement(s));
  const announce = announcerRef.current.announce;
  void announce; // reserved for future stale-data/error announcements (unchanged from v2 wiring)

  useEffect(() => {
    tracker.trackView();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const inputs: RetirementInputs = useMemo(() => {
    const expectedRetirementBenefit = benefit.enabled
      ? { monthlyAmountToday: benefit.monthlyAmountToday, startsAtAge: benefit.startsAtAge, source: 'user-estimate' as const }
      : undefined;
    if (mode === 'simple') {
      return {
        market,
        currentAge: base.currentAge,
        retireAge: base.retireAge,
        targetMonthlyIncomeToday: base.targetMonthlyIncomeToday,
        annualFeePct: base.annualFeePct,
        withdrawalRatePct: base.withdrawalRatePct,
        contributionGrowthPct,
        expectedRetirementBenefit,
        contributionMode: 'simple',
        simple: {
          taxAdvantagedBalance: startingAmount,
          taxableBalance: 0,
          employeeContributionMonthly: monthlyContribution,
          employerContributionMonthly,
        },
      };
    }
    return {
      market,
      currentAge: base.currentAge,
      retireAge: base.retireAge,
      targetMonthlyIncomeToday: base.targetMonthlyIncomeToday,
      annualFeePct: base.annualFeePct,
      withdrawalRatePct: base.withdrawalRatePct,
      contributionGrowthPct,
      expectedRetirementBenefit,
      contributionMode: 'account-breakdown',
      accounts: accounts as [RetirementAccountInput, ...RetirementAccountInput[]],
    };
  }, [market, mode, base, startingAmount, monthlyContribution, employerContributionMonthly, accounts, benefit, contributionGrowthPct]);

  const contributionChecks = useMemo(() => buildContributionChecks(inputs, rules), [inputs, rules]);

  const showExample = panelState !== 'result' && panelState !== 'stale-data';
  const resultState = showExample ? 'example' : 'yours';

  // v3 "Rendite→Engine" bridge (DESIGN-DIREKTIVE, binding) — the engine stays
  // REAL and untouched; this clones `rules` with realReturnBase/
  // Conservative/Optimistic overridden from the user's nominal return +
  // inflation (clamped to [0.5, 8]). See
  // lib/tools/results/wealth-horizon-real-return.ts.
  const { rules: effectiveRules, clamp: realReturnClamp }: { rules: RuleSnapshot; clamp: RealReturnClamp } = useMemo(
    () => buildRealReturnRuleSnapshot(rules, returnNominalPct, inflationPct),
    [rules, returnNominalPct, inflationPct],
  );

  // Live recompute — sync/pure, no debounce on the calculation itself (only
  // the ANALYTICS side is debounced, via tracker.trackInputChange's own
  // 600ms trailing debounce). focusScenario is always 'base' in v3 — the
  // old 3-way scenario switcher is gone (conservative/optimistic still exist
  // purely to populate primary.range, Result Contract slot 2).
  const liveResult = useMemo(
    () => buildWealthHorizonResult(inputs, effectiveRules, 'yours', 'base'),
    [inputs, effectiveRules],
  );
  const active: ToolResult = liveResult;

  function markInteracted(): void {
    setPanelState((s) => {
      if (s === 'result' || s === 'stale-data') return s;
      const afterInput = advancePanelState(s, { type: 'INPUT_CHANGED', complete: true });
      return advancePanelState(afterInput, { type: 'CALC_SUCCEEDED', stale: false });
    });
    if (!firstResultTracked.current) {
      firstResultTracked.current = true;
      tracker.trackFirstResult();
    }
  }

  function trackField(inputKey: string, rawValue: number, kind: InputBucketKind): void {
    markInteracted();
    tracker.trackStart(inputKey);
    tracker.trackInputChange(inputKey, rawValue, kind);
  }

  function trackCategorical(inputKey: string, bucket: string): void {
    markInteracted();
    tracker.trackStart(inputKey);
    tracker.trackCategoricalInputChange(inputKey, bucket);
  }

  // v4 Step 3 — the two-handle lifetime-range slider reports BOTH ages
  // together on every change (LifetimeRange's onChange contract); track only
  // whichever one actually moved, via the SAME trackField mechanism the old
  // separate IntegerFields used (inputKey/kind unchanged: 'currentAge'/
  // 'retireAge', kind 'years') so analytics stays identical to v3.
  function handleLifetimeChange(next: LifetimeValues): void {
    if (next.today !== base.currentAge) trackField('currentAge', next.today, 'years');
    if (next.retirement !== base.retireAge) trackField('retireAge', next.retirement, 'years');
    setBase((b) => ({ ...b, currentAge: next.today, retireAge: next.retirement }));
  }

  function updateAccount(index: number, patch: Partial<RetirementAccountInput>): void {
    setAccounts((prev) => prev.map((a, i) => (i === index ? { ...a, ...patch } : a)));
  }

  function addAccount(): void {
    const id = `acc-${nextAccountId.current++}`;
    setAccounts((prev) => [...prev, { id, type: initialAccountType, balance: 0, employeeContributionMonthly: 0 }]);
  }

  function removeAccount(index: number): void {
    setAccounts((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  }

  function handleLeverApply(lever: Lever): void {
    markInteracted();
    const { value, kind } = leverTrackingValue(lever);
    tracker.trackInputChange(`lever:${lever.key}`, value, kind, 'lever');
    const mutated = applyLever(inputs, lever, rules); // NEVER re-clamp here — Simple mode never clamps.
    setBase({
      currentAge: mutated.currentAge,
      retireAge: mutated.retireAge,
      targetMonthlyIncomeToday: mutated.targetMonthlyIncomeToday,
      annualFeePct: mutated.annualFeePct,
      withdrawalRatePct: mutated.withdrawalRatePct,
    });
    if (mutated.contributionMode === 'simple') {
      setStartingAmount(mutated.simple.taxAdvantagedBalance + mutated.simple.taxableBalance);
      setMonthlyContribution(mutated.simple.employeeContributionMonthly);
      setEmployerContributionMonthly(mutated.simple.employerContributionMonthly ?? 0);
    } else {
      setAccounts(mutated.accounts);
    }
  }

  // v3 Step 4 preset chips — DESIGN-DIREKTIVE: "Preset-Chips von Schritt 4
  // feuern stattdessen trackScenarioCompare(...)" (instead of
  // tool_input_change). A preset click still IS a real input change (it
  // moves returnNominalPct), so it still flips Example→Your result via
  // markInteracted() — only the ANALYTICS event differs from a manual edit.
  function handleReturnPresetSelect(preset: (typeof RETURN_PRESETS)[number]): void {
    markInteracted();
    setReturnNominalPct(preset.value);
    tracker.trackScenarioCompare(preset.key);
  }

  function jumpToResult(): void {
    document.getElementById('wealth-horizon-result')?.scrollIntoView({ behavior: 'auto', block: 'start' });
  }

  // AU SG helper — "annualEligibleEarnings × SG rate / 12", always an
  // editable suggestion: applying it just pre-fills an ordinary, still-freely
  // editable employer-contribution field.
  const sgRate = market === 'au' ? rules.values.superGuaranteeRate : undefined;
  const sgSuggestedMonthly =
    market === 'au' && typeof sgRate === 'number' && typeof auEligibleEarnings === 'number' && auEligibleEarnings > 0
      ? Math.round(((auEligibleEarnings * sgRate) / 12) * 100) / 100
      : null;

  function applySgSuggestion(): void {
    if (sgSuggestedMonthly === null) return;
    markInteracted();
    if (mode === 'simple') {
      setEmployerContributionMonthly(sgSuggestedMonthly);
    } else {
      const auIndex = accounts.findIndex((a) => a.type === 'au-super');
      updateAccount(auIndex === -1 ? 0 : auIndex, { employerContributionMonthly: sgSuggestedMonthly });
    }
  }

  const marketContextChip =
    market === 'uk' ? (
      <p data-testid="uk-isa-allowance-chip" className="m-0 w-fit rounded-tool-control border px-3 py-2 text-xs" style={CONTEXT_CHIP_STYLE}>
        UK ISA allowance: {formatCurrency(rules.values.isaAllowance, currency, locale)}/yr, all ISA types combined.
      </p>
    ) : market === 'au' ? (
      <div className="flex flex-col gap-3 rounded-tool-control border p-3" style={{ borderColor: 'var(--tool-border)' }}>
        <p data-testid="au-concessional-cap-chip" className="m-0 w-fit rounded-tool-control border px-3 py-2 text-xs" style={CONTEXT_CHIP_STYLE}>
          Concessional (before-tax) cap: {formatCurrency(rules.values.concessionalCap, currency, locale)}/yr.
        </p>
        <p className="m-0 text-sm font-medium text-[var(--sfp-ink)]">
          Super Guarantee contribution helper ({formatPercent((sgRate ?? 0) * 100, locale, 0)})
        </p>
        <CurrencyField
          label="Your annual eligible earnings (for the SG estimate)"
          inputKey="auAnnualEligibleEarnings"
          value={auEligibleEarnings}
          currency={currency}
          locale={locale}
          min={0}
          onChange={(v) => setAuEligibleEarnings(v)}
        />
        <button
          type="button"
          onClick={applySgSuggestion}
          disabled={sgSuggestedMonthly === null}
          className="w-fit rounded-tool-control border px-3 py-2 text-xs font-semibold disabled:opacity-50"
          style={{ borderColor: 'var(--tool-border-strong)', background: 'var(--tool-surface)', color: 'var(--sfp-ink)' }}
        >
          {sgSuggestedMonthly !== null
            ? `Use suggested employer contribution (${formatCurrency(sgSuggestedMonthly, currency, locale)}/mo) — you can still edit it`
            : 'Enter your eligible earnings to see a suggested employer contribution'}
        </button>
      </div>
    ) : null;

  // ── Steps 1 & 2 — Starting amount / Monthly contribution (Simple mode), or
  //    the full account-breakdown editor when the user has switched to
  //    detailed accounts (Advanced settings toggle, below). ─────────────────
  const accountBreakdownEditor = (
    <div className="flex flex-col gap-4">
      {accounts.map((account, i) => {
        const check = contributionChecks[i];
        const isRoomType = ROOM_ACCOUNT_TYPES.includes(account.type);
        return (
          <div key={account.id} className="flex flex-col gap-3 rounded-tool-control border p-3" style={{ borderColor: 'var(--tool-border)' }}>
            <BaseField label="Account type" inputKey={`account-${i}-type`}>
              {({ inputId }) => (
                <select
                  id={inputId}
                  value={account.type}
                  onChange={(e) => {
                    const type = e.target.value as RetirementAccountType;
                    updateAccount(i, { type });
                    trackCategorical(`account-${i}-type`, type);
                  }}
                  className="min-h-11 rounded-tool-control border px-3 text-[15px]"
                  style={{ borderColor: 'var(--tool-border)', background: 'var(--tool-surface)', color: 'var(--sfp-ink)' }}
                >
                  {accountTypeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              )}
            </BaseField>
            <CurrencyField
              label="Balance"
              inputKey={`account-${i}-balance`}
              value={account.balance}
              currency={currency}
              locale={locale}
              min={0}
              onChange={(v) => {
                if (v === '') return;
                updateAccount(i, { balance: v });
                trackField(`account-${i}-balance`, v, 'currency');
              }}
            />
            <CurrencyField
              label="Your monthly contribution"
              inputKey={`account-${i}-employee`}
              value={account.employeeContributionMonthly}
              currency={currency}
              locale={locale}
              min={0}
              onChange={(v) => {
                if (v === '') return;
                updateAccount(i, { employeeContributionMonthly: v });
                trackField(`account-${i}-employee`, v, 'currency');
              }}
            />
            <CurrencyField
              label="Employer match (monthly, optional)"
              inputKey={`account-${i}-employer`}
              value={account.employerContributionMonthly ?? ''}
              currency={currency}
              locale={locale}
              min={0}
              onChange={(v) => {
                updateAccount(i, { employerContributionMonthly: v === '' ? undefined : v });
                if (v !== '') trackField(`account-${i}-employer`, v, 'currency');
              }}
            />
            <CurrencyField
              label="Contributed so far this year (optional)"
              inputKey={`account-${i}-ytd`}
              value={account.contributedYtd ?? ''}
              currency={currency}
              locale={locale}
              min={0}
              onChange={(v) => {
                updateAccount(i, { contributedYtd: v === '' ? undefined : v });
                if (v !== '') trackField(`account-${i}-ytd`, v, 'currency');
              }}
            />
            {isRoomType ? (
              <CurrencyField
                label="Available room (optional)"
                inputKey={`account-${i}-room`}
                value={account.availableRoom ?? ''}
                currency={currency}
                locale={locale}
                min={0}
                help={ACCOUNT_TYPE_HELP[account.type]}
                onChange={(v) => {
                  updateAccount(i, { availableRoom: v === '' ? undefined : v });
                  if (v !== '') trackField(`account-${i}-room`, v, 'currency');
                }}
              />
            ) : null}
            {check ? (
              <p data-testid={`contribution-hint-${i}`} className="m-0 rounded-tool-control border px-3 py-2 text-xs" style={checkChipStyle(check.status)}>
                {check.message}
              </p>
            ) : null}
            {accounts.length > 1 ? (
              <button type="button" onClick={() => removeAccount(i)} className="w-fit text-xs font-semibold text-[var(--sfp-red)] underline">
                Remove account
              </button>
            ) : null}
          </div>
        );
      })}
      <button
        type="button"
        onClick={addAccount}
        className="btn min-h-11 w-fit rounded-tool-control border px-4 text-sm font-semibold"
        style={{ borderColor: 'var(--tool-border-strong)', background: 'var(--tool-surface)', color: 'var(--sfp-ink)' }}
      >
        + Add another account
      </button>
    </div>
  );

  // v4 — every Normal-mode slider's live-value formatter, shared so the
  // hero number and every slider display the same currency/percent style.
  const fmtCurrency = (v: number) => formatCurrency(v, currency, locale);
  const fmtPercent1 = (v: number) => formatPercent(v, locale, 1);

  // Step 2's dynamic escalation hint — ALWAYS year 10, using the engine's
  // OWN monthlyContributionInYear() helper (never a second formula), so the
  // copy can never drift from what the engine actually projects.
  const escalatedYear10 = monthlyContributionInYear(monthlyContribution, contributionGrowthPct, 10);

  const inputsColumn = (
    <div className="flex flex-col gap-7">
      {mode === 'simple' ? (
        <>
          <NumberedStep n={1} title="Starting amount">
            <SliderField
              label="Starting amount"
              inputKey="startingAmount"
              value={startingAmount}
              min={0}
              max={1_000_000}
              step={1_000}
              format={fmtCurrency}
              onChange={(v) => {
                setStartingAmount(v);
                trackField('startingAmount', v, 'currency');
              }}
            />
          </NumberedStep>

          <NumberedStep n={2} title="Monthly contribution">
            <SliderField
              label="Monthly contribution"
              inputKey="monthlyContribution"
              value={monthlyContribution}
              min={0}
              max={5_000}
              step={50}
              format={fmtCurrency}
              onChange={(v) => {
                setMonthlyContribution(v);
                trackField('monthlyContribution', v, 'currency');
              }}
            />
            {contributionChecks[0] ? (
              <p data-testid="contribution-hint" className="m-0 rounded-tool-control border px-3 py-2 text-xs" style={checkChipStyle(contributionChecks[0].status)}>
                {contributionChecks[0].message}
              </p>
            ) : null}
            <SliderField
              label="Increase contributions each year"
              inputKey="contributionGrowthPct"
              value={contributionGrowthPct}
              min={0}
              max={5}
              step={0.5}
              format={fmtPercent1}
              onChange={(v) => {
                setContributionGrowthPct(v);
                trackField('contributionGrowthPct', v, 'percent');
              }}
            />
            {contributionGrowthPct > 0 ? (
              <p data-testid="contribution-growth-hint" className="m-0 text-xs text-[var(--sfp-slate)]">
                {fmtCurrency(monthlyContribution)}/month becomes {fmtCurrency(escalatedYear10)}/month in year 10 (in
                today&rsquo;s money)
              </p>
            ) : null}
          </NumberedStep>
        </>
      ) : (
        <NumberedStep n={1} title="Your accounts">{accountBreakdownEditor}</NumberedStep>
      )}

      <NumberedStep n={mode === 'simple' ? 3 : 2} title="Your age today & at retirement">
        <LifetimeRange
          today={base.currentAge}
          retirement={base.retireAge}
          onChange={handleLifetimeChange}
          todayInputKey="currentAge"
          retirementInputKey="retireAge"
        />
      </NumberedStep>

      <NumberedStep n={mode === 'simple' ? 4 : 3} title="Expected annual return">
        <SliderField
          label="Expected annual return"
          inputKey="returnNominalPct"
          value={returnNominalPct}
          min={0}
          max={12}
          step={0.5}
          format={fmtPercent1}
          onChange={(v) => {
            setReturnNominalPct(v);
            trackField('returnNominalPct', v, 'percent');
          }}
          ticks={RETURN_PRESETS.map((p) => ({ value: p.value, label: p.label }))}
          onTickClick={(tick) => {
            const preset = RETURN_PRESETS.find((p) => p.value === tick.value)!;
            handleReturnPresetSelect(preset);
          }}
        />
        <p className="m-0 text-xs text-[var(--sfp-slate)]">Nominal, before inflation.</p>
      </NumberedStep>

      <NumberedStep n={mode === 'simple' ? 5 : 4} title="Expected inflation">
        <SliderField
          label="Expected inflation"
          inputKey="inflationPct"
          value={inflationPct}
          min={0}
          max={6}
          step={0.1}
          format={fmtPercent1}
          help="Used to show everything in today's purchasing power"
          onChange={(v) => {
            setInflationPct(v);
            trackField('inflationPct', v, 'percent');
          }}
        />
        {realReturnClamp.clamped ? (
          <p data-testid="real-return-clamp-warning" className="m-0 rounded-tool-control border px-3 py-2 text-xs" style={checkChipStyle('warning')}>
            Real return (nominal − inflation) works out to {realReturnClamp.rawRealPct.toFixed(1)}% — outside the range we
            can project, so we&rsquo;re using {realReturnClamp.realPct.toFixed(1)}% instead.
          </p>
        ) : null}
      </NumberedStep>

      {/* Advanced settings — native <details>, no panel-in-panel (DESIGN-DIREKTIVE, unchanged from v3); every field inside is now a slider too (v4). */}
      <details className="wh-advanced">
        <summary className="cursor-pointer text-sm font-semibold text-[var(--sfp-navy)]">Advanced settings</summary>
        <div className="mt-4 flex flex-col gap-4">
          <SliderField
            label="Annual fee"
            inputKey="annualFeePct"
            value={base.annualFeePct}
            min={0}
            max={2}
            step={0.1}
            format={fmtPercent1}
            onChange={(v) => {
              setBase((b) => ({ ...b, annualFeePct: v }));
              trackField('annualFeePct', v, 'percent');
            }}
          />
          <SliderField
            label="Withdrawal rate"
            inputKey="withdrawalRatePct"
            value={base.withdrawalRatePct}
            min={2.5}
            max={5.0}
            step={0.1}
            format={fmtPercent1}
            onChange={(v) => {
              setBase((b) => ({ ...b, withdrawalRatePct: v }));
              trackField('withdrawalRatePct', v, 'percent');
            }}
          />
          <SliderField
            label="What monthly income do you want in retirement?"
            inputKey="targetMonthlyIncomeToday"
            value={base.targetMonthlyIncomeToday}
            min={0}
            max={15_000}
            step={100}
            format={fmtCurrency}
            onChange={(v) => {
              setBase((b) => ({ ...b, targetMonthlyIncomeToday: v }));
              trackField('targetMonthlyIncomeToday', v, 'currency');
            }}
          />
          {mode === 'simple' ? (
            <SliderField
              label="Employer match (monthly, optional)"
              inputKey="employerContributionMonthly"
              value={employerContributionMonthly}
              min={0}
              max={2_000}
              step={50}
              format={fmtCurrency}
              onChange={(v) => {
                setEmployerContributionMonthly(v);
                trackField('employerContributionMonthly', v, 'currency');
              }}
            />
          ) : null}
          {marketContextChip}
          <div className="flex flex-col gap-3 rounded-tool-control border p-3" style={{ borderColor: 'var(--tool-border)' }}>
            <button
              type="button"
              onClick={() => setBenefit((b) => ({ ...b, enabled: !b.enabled }))}
              className="w-fit text-sm font-semibold text-[var(--sfp-navy)] underline"
            >
              {benefit.enabled ? 'Remove expected benefit' : `+ Add expected ${benefitName} benefit`}
            </button>
            {benefit.enabled ? (
              <>
                <SliderField
                  label="Expected monthly benefit (today's money)"
                  inputKey="benefitMonthlyAmountToday"
                  value={benefit.monthlyAmountToday}
                  min={0}
                  max={5_000}
                  step={50}
                  format={fmtCurrency}
                  onChange={(v) => {
                    setBenefit((b) => ({ ...b, monthlyAmountToday: v }));
                    trackField('benefitMonthlyAmountToday', v, 'currency');
                  }}
                />
                <SliderField
                  label="Age benefit starts"
                  inputKey="benefitStartsAtAge"
                  value={benefit.startsAtAge}
                  min={55}
                  max={75}
                  step={1}
                  format={(v) => String(v)}
                  onChange={(v) => {
                    setBenefit((b) => ({ ...b, startsAtAge: v }));
                    trackField('benefitStartsAtAge', v, 'years');
                  }}
                />
                <p className="m-0 text-xs text-[var(--sfp-slate)]">
                  Get your own estimate from the{' '}
                  <a href={benefitLinkUrl} className="text-[var(--sfp-navy)] no-underline hover:underline">
                    {benefitLinkLabel}
                  </a>{' '}
                  — this calculator never estimates entitlement or amount for you.
                </p>
              </>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => {
              const next = mode === 'simple' ? 'account-breakdown' : 'simple';
              setMode(next);
              trackCategorical('contributionMode', next);
            }}
            className="w-fit text-xs font-semibold text-[var(--sfp-navy)] underline"
          >
            {mode === 'simple' ? 'Switch to detailed accounts →' : '← Back to simple mode'}
          </button>
        </div>
      </details>
    </div>
  );

  // ── Result canvas (always visible, Result Contract order unchanged from
  //    slot 4 onward: ImpactLevers → AssumptionsDrawer → NextBestAction) ────
  const corridor = active.scenario.kind === 'corridor' ? active.scenario : null;
  const fiAge = corridor?.fiAge ?? null;
  const withdrawalMonthly = corridor?.withdrawalMonthly ?? active.primary.value;
  const balanceAtRetire = corridor?.balanceAtRetire ?? 0;
  const depletionAge = corridor?.depletionAge ?? null;
  const retireAge = corridor?.retireAge ?? base.retireAge;
  const endAge = corridor?.endAge ?? 90;

  const financiallyFree = fiAge !== null && fiAge <= retireAge;

  const displayedBalance = useCountUp(balanceAtRetire);

  const longevityText = depletionAge !== null ? `funds run out around age ${depletionAge}` : `funds last beyond age ${endAge}`;
  const item3Text = `≈ ${formatCurrency(withdrawalMonthly, currency, locale)}/mo illustrative retirement withdrawal · ${longevityText}`;

  const miniBarSummary = financiallyFree
    ? `FI at ${fiAge} · ${formatCurrency(balanceAtRetire, currency, locale)} at ${retireAge}`
    : `${formatCurrency(balanceAtRetire, currency, locale)} at ${retireAge}`;

  // Step 4/5 preset totals — mode-aware (Simple: single field + employer
  // match; account-breakdown: summed across accounts). Feeds BOTH the
  // stacked bar chart and the two summary tiles below it.
  const startingAmountTotal = mode === 'simple' ? startingAmount : accounts.reduce((sum, a) => sum + a.balance, 0);
  const monthlyContributionTotal =
    mode === 'simple'
      ? monthlyContribution + employerContributionMonthly
      : accounts.reduce((sum, a) => sum + a.employeeContributionMonthly + (a.employerContributionMonthly ?? 0), 0);

  const baseRows = corridor?.series.find((s) => s.key === 'base')?.rows.map((r) => ({ age: r.x, balance: r.y })) ?? [];
  const contributionGrowthSeries = buildContributionGrowthSeries(baseRows, base.currentAge, startingAmountTotal, monthlyContributionTotal);
  const chartBars: StackedBarInput[] = contributionGrowthSeries.map((p) => ({ age: p.age, contributions: p.contributions, growth: p.growth }));
  const lastPoint = contributionGrowthSeries[contributionGrowthSeries.length - 1];
  const totalContributions = lastPoint?.contributions ?? startingAmountTotal;
  const expectedGrowth = lastPoint?.growth ?? 0;

  const resultCanvas = (
    <div id="wealth-horizon-result" className="flex flex-col gap-5">
      {/* (1) state chip + "in today's money" badge */}
      <div className="chip-row flex flex-wrap items-center gap-2.5">
        <span
          className="result-chip inline-flex flex-none items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold"
          style={
            resultState === 'yours'
              ? { background: 'var(--sfp-navy)', color: '#fff', border: 'none' }
              : { background: 'transparent', color: 'var(--sfp-slate)', border: '1px dashed var(--tool-border-strong)' }
          }
        >
          {resultState === 'yours' ? 'Your result' : 'Example result'}
        </span>
        <span className="whitespace-nowrap text-xs font-medium text-[var(--sfp-slate)]">{"in today's money"}</span>
      </div>

      {/* (2) label + big number, count-up */}
      <div className="flex flex-col gap-1">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--sfp-slate)]">
          Hypothetical balance at retirement (age {retireAge})
        </span>
        <span className="tabular-nums text-[clamp(32px,6vw,44px)] font-semibold leading-[1.1] text-[var(--sfp-ink)]">
          {formatCurrency(Math.round(displayedBalance), currency, locale)}
        </span>
      </div>

      {/* (3) one calm text line + optional gold pill */}
      <div className="flex flex-wrap items-center gap-2">
        <p className="answer m-0 text-[15px] leading-6 text-[var(--sfp-slate)]">{item3Text}</p>
        {financiallyFree ? <GoldPill>Financially free at {fiAge}</GoldPill> : null}
      </div>

      {/* (4) the chart — stacked contribution/growth bars */}
      {corridor ? (
        <ContributionGrowthChart bars={chartBars} currency={currency} locale={locale} textAlternative={corridor.textAlternative} />
      ) : null}

      {/* (5) two summary tiles */}
      <div className="grid grid-cols-2 gap-2.5">
        <SummaryTile label="Total contributions" value={formatCurrency(totalContributions, currency, locale)} />
        <SummaryTile label="Expected growth" value={formatCurrency(expectedGrowth, currency, locale)} />
      </div>

      {/* (6) exactly 3 levers */}
      <ImpactLevers levers={active.levers} onApply={handleLeverApply} />

      {/* (6) assumptions + sources */}
      <AssumptionsDrawer assumptions={active.assumptions} sources={active.sources} />

      {/* (6) exactly one next best action */}
      <NextBestAction action={active.nextAction} ctx={ctx} />
    </div>
  );

  return (
    <div className={resultState === 'yours' ? 'pb-[72px] sm:pb-0' : ''}>
      <div role="status" aria-live="polite" className="sr-only">
        {announcement}
      </div>
      <div className="rounded-tool-panel border" style={{ borderColor: 'var(--tool-border)', background: 'var(--tool-surface)' }}>
        <div className="grid grid-cols-1 gap-8 p-6 sm:p-8 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-5">{inputsColumn}</div>
          <div className="lg:sticky lg:top-4 lg:col-span-7 lg:self-start">{resultCanvas}</div>
        </div>
      </div>
      <ResultMiniBar visible={resultState === 'yours'} summary={miniBarSummary} onJump={jumpToResult} />
    </div>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-tool-control p-3" style={{ background: 'var(--tool-surface-muted)' }}>
      <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--sfp-slate)]">{label}</span>
      <span className="tabular-nums text-[20px] font-semibold text-[var(--sfp-ink)]">{value}</span>
    </div>
  );
}
