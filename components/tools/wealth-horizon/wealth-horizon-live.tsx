'use client';
// components/tools/wealth-horizon/wealth-horizon-live.tsx
// Wealth Horizon v2 — Live-Workspace client island. Replaces the v1
// GuidedJourney (3-step wizard + "See my result" gate) with an always-live
// canvas (SPEC LiveCanvasLayout, shellMode 'live-canvas' — bindende
// Design-Direktive 13.07.2026, dokumentierte Abweichung von Spec-5.2's
// GuidedJourney default for this tool). Every displayed number still comes
// from buildWealthHorizonResult()/the retirement engine — no second calc
// path lives in this file (harte Regel, unverändert aus v1).
//
// Parametrized to run all 4 markets from ONE island (props identical to the
// v1 WealthHorizonJourneyProps — FDL 4.3 parametrization untouched).

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { LiveCanvasLayout } from '@/components/tools/shell/live-canvas';
import { ImpactLevers } from '@/components/tools/shell/impact-levers';
import { AssumptionsDrawer } from '@/components/tools/shell/assumptions-drawer';
import { NextBestAction } from '@/components/tools/shell/next-best-action';
import { ResultMiniBar } from '@/components/tools/shell/result-mini-bar';
import { CurrencyField } from '@/components/tools/shell/fields/currency-field';
import { IntegerField } from '@/components/tools/shell/fields/integer-field';
import { PercentageField } from '@/components/tools/shell/fields/percentage-field';
import { SegmentedControl } from '@/components/tools/shell/fields/segmented-control';
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
} from '@/lib/calc/retirement/engine';
import type {
  RetirementAccountInput,
  RetirementAccountType,
  RetirementInputs,
} from '@/lib/calc/retirement/types';
import {
  buildWealthHorizonResult,
  type WealthHorizonScenarioKey,
} from '@/lib/tools/results/wealth-horizon-result';
import { LifetimeChart } from './lifetime-chart';
import type { LifetimeSeriesInput } from '@/lib/calc/chart-geometry';

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
  currency: ToolCurrency;
  locale: string;
  /** Account types selectable in "detailed accounts" mode, market subset of
   *  RetirementAccountType (FDL 4.3 parametrization). */
  accountTypeOptions: { value: RetirementAccountType; label: string }[];
  /** Short account-type shorthand for the Simple-mode "tax-advantaged
   *  balance" field label, e.g. "401(k)/IRA" | "ISA/SIPP" | "TFSA/RRSP" | "Super". */
  taxAdvantagedLabel: string;
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

export function WealthHorizonLive({
  market,
  variantPath,
  rules,
  exampleResult,
  currency,
  locale,
  accountTypeOptions,
  taxAdvantagedLabel,
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
    currentAge: 30,
    retireAge: 65,
    targetMonthlyIncomeToday: 4000,
    annualFeePct: 0.5,
    withdrawalRatePct: 4.0,
  });
  const [simple, setSimple] = useState({
    taxAdvantagedBalance: 20000,
    taxableBalance: 5000,
    employeeContributionMonthly: 400,
    employerContributionMonthly: 0,
  });
  const [accounts, setAccounts] = useState<RetirementAccountInput[]>([
    { id: 'acc-1', type: initialAccountType, balance: 20000, employeeContributionMonthly: 400 },
  ]);
  const [benefit, setBenefit] = useState({ enabled: false, monthlyAmountToday: 0, startsAtAge: 67 });
  const [focusScenario, setFocusScenario] = useState<WealthHorizonScenarioKey>('base');

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
        expectedRetirementBenefit,
        contributionMode: 'simple',
        simple,
      };
    }
    return {
      market,
      currentAge: base.currentAge,
      retireAge: base.retireAge,
      targetMonthlyIncomeToday: base.targetMonthlyIncomeToday,
      annualFeePct: base.annualFeePct,
      withdrawalRatePct: base.withdrawalRatePct,
      expectedRetirementBenefit,
      contributionMode: 'account-breakdown',
      accounts: accounts as [RetirementAccountInput, ...RetirementAccountInput[]],
    };
  }, [market, mode, base, simple, accounts, benefit]);

  const contributionChecks = useMemo(() => buildContributionChecks(inputs, rules), [inputs, rules]);

  const showExample = panelState !== 'result' && panelState !== 'stale-data';
  const resultState = showExample ? 'example' : 'yours';

  // Live recompute — sync/pure, no debounce on the calculation itself (only
  // the ANALYTICS side is debounced, via tracker.trackInputChange's own
  // 600ms trailing debounce).
  const liveResult = useMemo(
    () => buildWealthHorizonResult(inputs, rules, 'yours', focusScenario),
    [inputs, rules, focusScenario],
  );
  const active: ToolResult = showExample ? exampleResult : liveResult;

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
      setSimple({ ...mutated.simple, employerContributionMonthly: mutated.simple.employerContributionMonthly ?? 0 });
    } else {
      setAccounts(mutated.accounts);
    }
  }

  function handleScenarioChange(scenario: WealthHorizonScenarioKey): void {
    // Switching the scenario lens looks at the CURRENT input state (defaults
    // until the user has touched anything) — the moment you compare
    // scenarios you're looking at your own numbers, not the fixed worked
    // example, so this counts as the first interaction too (documented
    // product decision — the exampleResult prop is a finished ToolResult
    // pre-built server-side at 'base' only, so it cannot itself be
    // re-scenario'd client-side without a second calc path).
    markInteracted();
    tracker.trackScenarioCompare(scenario);
    setFocusScenario(scenario);
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
      setSimple((s) => ({ ...s, employerContributionMonthly: sgSuggestedMonthly }));
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

  // ── Group 1 — About you ─────────────────────────────────────────────────
  const aboutYouContent = (
    <div className="flex flex-col gap-4">
      <h2 className="m-0 text-base font-semibold text-[var(--sfp-ink)]">About you</h2>
      <div className="rounded-tool-control border p-3.5" style={{ borderColor: 'var(--tool-border-strong)', background: 'var(--sfp-sky)' }}>
        <CurrencyField
          label="What monthly income do you want in retirement?"
          inputKey="targetMonthlyIncomeToday"
          value={base.targetMonthlyIncomeToday}
          currency={currency}
          locale={locale}
          min={0}
          onChange={(v) => {
            if (v === '') return;
            setBase((b) => ({ ...b, targetMonthlyIncomeToday: v }));
            trackField('targetMonthlyIncomeToday', v, 'currency');
          }}
        />
      </div>
      <IntegerField
        label="Your current age"
        inputKey="currentAge"
        value={base.currentAge}
        min={18}
        max={79}
        slider={{ min: 18, max: 70, step: 1 }}
        onChange={(v) => {
          if (v === '') return;
          setBase((b) => ({ ...b, currentAge: v }));
          trackField('currentAge', v, 'years');
        }}
      />
      <IntegerField
        label="Planned retirement age"
        inputKey="retireAge"
        value={base.retireAge}
        min={base.currentAge + 1}
        max={80}
        slider={{ min: 40, max: 80, step: 1 }}
        onChange={(v) => {
          if (v === '') return;
          setBase((b) => ({ ...b, retireAge: v }));
          trackField('retireAge', v, 'years');
        }}
      />
    </div>
  );

  // ── Group 2 — Your money ────────────────────────────────────────────────
  const yourMoneyContent = (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="m-0 text-base font-semibold text-[var(--sfp-ink)]">Your money</h2>
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

      {marketContextChip}

      {mode === 'simple' ? (
        <div className="flex flex-col gap-4">
          <CurrencyField
            label={`Tax-advantaged balance (${taxAdvantagedLabel})`}
            inputKey="taxAdvantagedBalance"
            value={simple.taxAdvantagedBalance}
            currency={currency}
            locale={locale}
            min={0}
            onChange={(v) => {
              if (v === '') return;
              setSimple((s) => ({ ...s, taxAdvantagedBalance: v }));
              trackField('taxAdvantagedBalance', v, 'currency');
            }}
          />
          <CurrencyField
            label="Taxable account balance"
            inputKey="taxableBalance"
            value={simple.taxableBalance}
            currency={currency}
            locale={locale}
            min={0}
            onChange={(v) => {
              if (v === '') return;
              setSimple((s) => ({ ...s, taxableBalance: v }));
              trackField('taxableBalance', v, 'currency');
            }}
          />
          <CurrencyField
            label="Your monthly contribution"
            inputKey="employeeContributionMonthly"
            value={simple.employeeContributionMonthly}
            currency={currency}
            locale={locale}
            min={0}
            slider={{ min: 0, max: 5000, step: 50 }}
            onChange={(v) => {
              if (v === '') return;
              setSimple((s) => ({ ...s, employeeContributionMonthly: v }));
              trackField('employeeContributionMonthly', v, 'currency');
            }}
          />
          <CurrencyField
            label="Employer match (monthly, optional)"
            inputKey="employerContributionMonthly"
            value={simple.employerContributionMonthly}
            currency={currency}
            locale={locale}
            min={0}
            onChange={(v) => {
              setSimple((s) => ({ ...s, employerContributionMonthly: v === '' ? 0 : v }));
              if (v !== '') trackField('employerContributionMonthly', v, 'currency');
            }}
          />
          {contributionChecks[0] ? (
            <p
              data-testid="contribution-hint"
              className="m-0 rounded-tool-control border px-3 py-2 text-xs"
              style={checkChipStyle(contributionChecks[0].status)}
            >
              {contributionChecks[0].message}
            </p>
          ) : null}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {accounts.map((account, i) => {
            const check = contributionChecks[i];
            const isRoomType = ROOM_ACCOUNT_TYPES.includes(account.type);
            return (
              <div
                key={account.id}
                className="flex flex-col gap-3 rounded-tool-control border p-3"
                style={{ borderColor: 'var(--tool-border)' }}
              >
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
                  <p
                    data-testid={`contribution-hint-${i}`}
                    className="m-0 rounded-tool-control border px-3 py-2 text-xs"
                    style={checkChipStyle(check.status)}
                  >
                    {check.message}
                  </p>
                ) : null}
                {accounts.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => removeAccount(i)}
                    className="w-fit text-xs font-semibold text-[var(--sfp-red)] underline"
                  >
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
      )}
    </div>
  );

  // ── Group 3 — Assumptions ───────────────────────────────────────────────
  const assumptionsContent = (
    <div className="flex flex-col gap-4">
      <h2 className="m-0 text-base font-semibold text-[var(--sfp-ink)]">Assumptions</h2>
      <PercentageField
        label="Annual fee"
        inputKey="annualFeePct"
        value={base.annualFeePct}
        min={0}
        max={3}
        slider={{ min: 0, max: 3, step: 0.1 }}
        onChange={(v) => {
          if (v === '') return;
          setBase((b) => ({ ...b, annualFeePct: v }));
          trackField('annualFeePct', v, 'percent');
        }}
      />
      <PercentageField
        label="Withdrawal rate"
        inputKey="withdrawalRatePct"
        value={base.withdrawalRatePct}
        min={2.5}
        max={5.0}
        slider={{ min: 2.5, max: 5.0, step: 0.1 }}
        onChange={(v) => {
          if (v === '') return;
          setBase((b) => ({ ...b, withdrawalRatePct: v }));
          trackField('withdrawalRatePct', v, 'percent');
        }}
      />
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
            <CurrencyField
              label="Expected monthly benefit (today's money)"
              inputKey="benefitMonthlyAmountToday"
              value={benefit.monthlyAmountToday}
              currency={currency}
              locale={locale}
              min={0}
              onChange={(v) => {
                if (v === '') return;
                setBenefit((b) => ({ ...b, monthlyAmountToday: v }));
                trackField('benefitMonthlyAmountToday', v, 'currency');
              }}
            />
            <IntegerField
              label="Age benefit starts"
              inputKey="benefitStartsAtAge"
              value={benefit.startsAtAge}
              min={base.currentAge}
              max={100}
              onChange={(v) => {
                if (v === '') return;
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
    </div>
  );

  const inputsColumn = (
    <div className="flex flex-col gap-8">
      {aboutYouContent}
      {yourMoneyContent}
      {assumptionsContent}
    </div>
  );

  // ── Result canvas (always visible, Result Contract order unchanged from
  //    slot 4 onward: ImpactLevers → AssumptionsDrawer → NextBestAction) ────
  const corridor = active.scenario.kind === 'corridor' ? active.scenario : null;
  const fiAge = corridor?.fiAge ?? null;
  const gap = corridor?.incomeGapMonthly ?? 0;
  const withdrawalMonthly = corridor?.withdrawalMonthly ?? active.primary.value;
  const balanceAtRetire = corridor?.balanceAtRetire ?? 0;
  const depletionAge = corridor?.depletionAge ?? null;
  const retireAge = corridor?.retireAge ?? base.retireAge;
  const endAge = corridor?.endAge ?? 90;
  const milestones = corridor?.milestones ?? [];

  const financiallyFree = fiAge !== null && fiAge <= retireAge;
  const headline = financiallyFree
    ? (
      <>
        Financially free at <span style={{ color: 'var(--sfp-gold)' }}>{fiAge}</span>
      </>
    )
    : (
      <>
        <span className="tabular-nums">{formatCurrency(gap, currency, locale)}</span>/mo short of freedom at {retireAge}
      </>
    );

  const miniBarSummary = financiallyFree
    ? `FI at ${fiAge} · ≈${formatCurrency(withdrawalMonthly, currency, locale)}/mo`
    : `${formatCurrency(gap, currency, locale)}/mo short`;

  const lifetimeSeries: LifetimeSeriesInput[] = useMemo(() => {
    if (active.scenario.kind !== 'corridor') return [];
    const decumulationByKey = new Map((active.scenario.decumulation ?? []).map((d) => [d.key, d.rows]));
    return active.scenario.series.map((s) => ({
      key: s.key,
      accumulation: s.rows.map((r) => ({ age: r.x, balance: r.y })),
      decumulation: (decumulationByKey.get(s.key) ?? []).map((r) => ({ age: r.x, balance: r.y })),
    }));
  }, [active.scenario]);

  const resultCanvas = (
    <div id="wealth-horizon-result" className="flex flex-col gap-5">
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
      </div>

      {/* Hero */}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--sfp-slate)]">
          Your projection — in today&rsquo;s money
        </span>
        <h2 className="m-0 text-[34px] font-semibold leading-[42px] text-[var(--sfp-ink)]">{headline}</h2>
        <p className="answer m-0 text-[16px] leading-6 text-[var(--sfp-slate)]">{active.answer}</p>
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        <StatChip label={`Balance at ${retireAge}`} value={formatCurrency(balanceAtRetire, currency, locale)} />
        <StatChip label="Illustrative withdrawal /mo" value={formatCurrency(withdrawalMonthly, currency, locale)} />
        <StatChip label="Your income goal" value={formatCurrency(base.targetMonthlyIncomeToday, currency, locale)} />
      </div>

      {/* Scenario switcher */}
      <div className="flex justify-end">
        <SegmentedControl
          label="Scenario"
          inputKey="scenario"
          value={focusScenario}
          options={[
            { value: 'conservative', label: 'Conservative' },
            { value: 'base', label: 'Base' },
            { value: 'optimistic', label: 'Optimistic' },
          ]}
          onChange={handleScenarioChange}
        />
      </div>

      {/* Lifetime Path chart */}
      {corridor ? (
        <LifetimeChart
          series={lifetimeSeries}
          currentAge={base.currentAge}
          retireAge={retireAge}
          endAge={endAge}
          fiAge={fiAge}
          depletionAge={depletionAge}
          milestones={milestones}
          withdrawalMonthly={withdrawalMonthly}
          currency={currency}
          locale={locale}
          textAlternative={corridor.textAlternative}
        />
      ) : null}

      {/* Milestones chip row */}
      {milestones.length > 0 ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {milestones.map((m, i) => (
            <span
              key={i}
              data-testid="milestone-chip"
              className="flex-none whitespace-nowrap rounded-full border px-3 py-1 text-xs font-semibold tabular-nums"
              style={{ borderColor: 'var(--tool-border-strong)', color: 'var(--sfp-ink)', background: 'var(--tool-surface)' }}
            >
              {m.label}
            </span>
          ))}
        </div>
      ) : null}

      {/* (4) exactly 3 levers */}
      <ImpactLevers levers={active.levers} onApply={handleLeverApply} />

      {/* (5) assumptions + sources */}
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
      <LiveCanvasLayout inputs={inputsColumn} result={resultCanvas} />
      <ResultMiniBar visible={resultState === 'yours'} summary={miniBarSummary} onJump={jumpToResult} />
    </div>
  );
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="flex flex-col gap-0.5 rounded-tool-control border p-3"
      style={{ borderColor: 'var(--tool-border)', background: 'var(--tool-surface)' }}
    >
      <span className="text-xs text-[var(--sfp-slate)]">{label}</span>
      <span className="tabular-nums text-[17px] font-bold text-[var(--sfp-ink)]">{value}</span>
    </div>
  );
}
