'use client';
// components/tools/wealth-horizon/wealth-horizon-journey.tsx
// Wealth Horizon US client island (FDL 4.2) — GuidedJourney: Basics →
// Contributions → Assumptions, then a live result canvas (corridor chart +
// scenario switcher + 3 levers). Every displayed number comes from
// buildWealthHorizonResult()/the retirement engine — no second calc path
// lives in this file (harte Regel, PR 4.2 brief).

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { GuidedJourneyLayout, type GuidedJourneyStep } from '@/components/tools/shell/guided-journey';
import { ResultPanel } from '@/components/tools/shell/result-panel';
import { ResultMiniBar } from '@/components/tools/shell/result-mini-bar';
import { CurrencyField } from '@/components/tools/shell/fields/currency-field';
import { IntegerField } from '@/components/tools/shell/fields/integer-field';
import { PercentageField } from '@/components/tools/shell/fields/percentage-field';
import { SegmentedControl } from '@/components/tools/shell/fields/segmented-control';
import { BaseField } from '@/components/tools/shell/fields/base-field';
import { createLiveAnnouncer } from '@/lib/tools/aria-live';
import { advancePanelState, type Lever, type PanelState, type ToolResult } from '@/lib/tools/shell-types';
import { useToolTracking } from '@/lib/analytics/tool-tracking';
import type { ToolContext, InputBucketKind } from '@/lib/analytics/tool-events';
import type { RuleSnapshot } from '@/lib/rules';
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

export interface WealthHorizonJourneyProps {
  market: 'us';
  rules: RuleSnapshot;
  exampleResult: ToolResult;
  ssaEstimatorUrl: string;
}

const CTX: ToolContext = {
  toolId: 'wealth-horizon',
  market: 'us',
  variantPath: '/tools/retirement-calculator',
  shellMode: 'guided-journey',
};

const ACCOUNT_TYPE_OPTIONS: { value: RetirementAccountType; label: string }[] = [
  { value: 'us-401k', label: '401(k) / 403(b)' },
  { value: 'us-traditional-ira', label: 'Traditional IRA' },
  { value: 'us-roth-ira', label: 'Roth IRA' },
  { value: 'us-taxable', label: 'Taxable brokerage' },
];

interface BaseFields {
  currentAge: number;
  retireAge: number;
  targetMonthlyIncomeToday: number;
  annualFeePct: number;
  withdrawalRatePct: number;
}

interface SimpleFields {
  taxAdvantagedBalance: number;
  taxableBalance: number;
  employeeContributionMonthly: number;
  employerContributionMonthly: number;
}

interface BenefitFields {
  enabled: boolean;
  monthlyAmountToday: number;
  startsAtAge: number;
}

const INITIAL_BASE: BaseFields = {
  currentAge: 30,
  retireAge: 65,
  targetMonthlyIncomeToday: 4000,
  annualFeePct: 0.5,
  withdrawalRatePct: 4.0,
};

const INITIAL_SIMPLE: SimpleFields = {
  taxAdvantagedBalance: 20000,
  taxableBalance: 5000,
  employeeContributionMonthly: 400,
  employerContributionMonthly: 0,
};

const INITIAL_ACCOUNTS: RetirementAccountInput[] = [
  { id: 'acc-1', type: 'us-401k', balance: 20000, employeeContributionMonthly: 400 },
];

const INITIAL_BENEFIT: BenefitFields = { enabled: false, monthlyAmountToday: 0, startsAtAge: 67 };

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

export function WealthHorizonJourney({ rules, exampleResult, ssaEstimatorUrl }: WealthHorizonJourneyProps) {
  const tracker = useToolTracking(CTX);

  const [mode, setMode] = useState<'simple' | 'account-breakdown'>('simple');
  const [base, setBase] = useState<BaseFields>(INITIAL_BASE);
  const [simple, setSimple] = useState<SimpleFields>(INITIAL_SIMPLE);
  const [accounts, setAccounts] = useState<RetirementAccountInput[]>(INITIAL_ACCOUNTS);
  const [benefit, setBenefit] = useState<BenefitFields>(INITIAL_BENEFIT);
  const [focusScenario, setFocusScenario] = useState<WealthHorizonScenarioKey>('base');

  const [journeyCompleted, setJourneyCompleted] = useState(false);
  const [panelState, setPanelState] = useState<PanelState>('initial');
  const [result, setResult] = useState<ToolResult | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const nextAccountId = useRef(2);

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
        market: 'us',
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
      market: 'us',
      currentAge: base.currentAge,
      retireAge: base.retireAge,
      targetMonthlyIncomeToday: base.targetMonthlyIncomeToday,
      annualFeePct: base.annualFeePct,
      withdrawalRatePct: base.withdrawalRatePct,
      expectedRetirementBenefit,
      contributionMode: 'account-breakdown',
      accounts: accounts as [RetirementAccountInput, ...RetirementAccountInput[]],
    };
  }, [mode, base, simple, accounts, benefit]);

  const contributionChecks = useMemo(() => buildContributionChecks(inputs, rules), [inputs, rules]);

  // Recompute the real result whenever inputs/scenario change AFTER the
  // journey has completed (levers + scenario switcher both flow through
  // this single effect — no separate rebuild call needed at each call site).
  useEffect(() => {
    if (!journeyCompleted) return;
    setResult(buildWealthHorizonResult(inputs, rules, 'yours', focusScenario));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputs, rules, focusScenario, journeyCompleted]);

  function trackField(inputKey: string, rawValue: number, kind: InputBucketKind): void {
    tracker.trackStart(inputKey);
    tracker.trackInputChange(inputKey, rawValue, kind);
  }

  function trackCategorical(inputKey: string, bucket: string): void {
    tracker.trackStart(inputKey);
    tracker.trackCategoricalInputChange(inputKey, bucket);
  }

  function updateAccount(index: number, patch: Partial<RetirementAccountInput>): void {
    setAccounts((prev) => prev.map((a, i) => (i === index ? { ...a, ...patch } : a)));
  }

  function addAccount(): void {
    const id = `acc-${nextAccountId.current++}`;
    setAccounts((prev) => [...prev, { id, type: 'us-401k', balance: 0, employeeContributionMonthly: 0 }]);
  }

  function removeAccount(index: number): void {
    setAccounts((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  }

  function handleComplete(): void {
    setPanelState((s) => advancePanelState(s, { type: 'CALC_STARTED' }));
    const built = buildWealthHorizonResult(inputs, rules, 'yours', focusScenario);
    setResult(built);
    setJourneyCompleted(true);
    setPanelState((s) => advancePanelState(s, { type: 'CALC_SUCCEEDED', stale: false }));
    tracker.trackFirstResult();
  }

  function handleLeverApply(lever: Lever): void {
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
    tracker.trackScenarioCompare(scenario);
    setFocusScenario(scenario);
  }

  function jumpToResult(): void {
    document.getElementById('wealth-horizon-result')?.scrollIntoView({ behavior: 'auto', block: 'start' });
  }

  // ── Step 1 — Basics ────────────────────────────────────────────────────
  const basicsContent = (
    <div className="flex flex-col gap-4">
      <IntegerField
        label="Your current age"
        inputKey="currentAge"
        value={base.currentAge}
        min={18}
        max={79}
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
        onChange={(v) => {
          if (v === '') return;
          setBase((b) => ({ ...b, retireAge: v }));
          trackField('retireAge', v, 'years');
        }}
      />
      <CurrencyField
        label="Target monthly income (today's money)"
        inputKey="targetMonthlyIncomeToday"
        value={base.targetMonthlyIncomeToday}
        currency="USD"
        locale="en-US"
        min={0}
        onChange={(v) => {
          if (v === '') return;
          setBase((b) => ({ ...b, targetMonthlyIncomeToday: v }));
          trackField('targetMonthlyIncomeToday', v, 'currency');
        }}
      />
    </div>
  );

  // ── Step 2 — Contributions ─────────────────────────────────────────────
  const contributionsContent = (
    <div className="flex flex-col gap-4">
      <SegmentedControl
        label="Contribution mode"
        inputKey="contributionMode"
        value={mode}
        options={[
          { value: 'simple', label: 'Simple' },
          { value: 'account-breakdown', label: 'Account breakdown' },
        ]}
        onChange={(v) => {
          setMode(v);
          trackCategorical('contributionMode', v);
        }}
      />

      {mode === 'simple' ? (
        <div className="flex flex-col gap-4">
          <CurrencyField
            label="Tax-advantaged balance (401(k)/IRA)"
            inputKey="taxAdvantagedBalance"
            value={simple.taxAdvantagedBalance}
            currency="USD"
            locale="en-US"
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
            currency="USD"
            locale="en-US"
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
            currency="USD"
            locale="en-US"
            min={0}
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
            currency="USD"
            locale="en-US"
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
                      {ACCOUNT_TYPE_OPTIONS.map((opt) => (
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
                  currency="USD"
                  locale="en-US"
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
                  currency="USD"
                  locale="en-US"
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
                  currency="USD"
                  locale="en-US"
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
                  currency="USD"
                  locale="en-US"
                  min={0}
                  onChange={(v) => {
                    updateAccount(i, { contributedYtd: v === '' ? undefined : v });
                    if (v !== '') trackField(`account-${i}-ytd`, v, 'currency');
                  }}
                />
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

  // ── Step 3 — Assumptions ───────────────────────────────────────────────
  const assumptionsContent = (
    <div className="flex flex-col gap-4">
      <PercentageField
        label="Annual fee"
        inputKey="annualFeePct"
        value={base.annualFeePct}
        min={0}
        max={3}
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
          {benefit.enabled ? 'Remove expected benefit' : '+ Add expected Social Security / pension benefit'}
        </button>
        {benefit.enabled ? (
          <>
            <CurrencyField
              label="Expected monthly benefit (today's money)"
              inputKey="benefitMonthlyAmountToday"
              value={benefit.monthlyAmountToday}
              currency="USD"
              locale="en-US"
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
              <a href={ssaEstimatorUrl} className="text-[var(--sfp-navy)] no-underline hover:underline">
                SSA&rsquo;s benefits estimator
              </a>{' '}
              — this calculator never estimates entitlement or amount for you.
            </p>
          </>
        ) : null}
      </div>
    </div>
  );

  const steps: GuidedJourneyStep[] = [
    { key: 'basics', title: 'About you', content: basicsContent },
    { key: 'contributions', title: 'Savings & contributions', content: contributionsContent },
    { key: 'assumptions', title: 'Target income & assumptions', content: assumptionsContent },
  ];

  const showMiniBar = panelState === 'result' || panelState === 'stale-data';

  const resultCanvas = (
    <div id="wealth-horizon-result" className="flex flex-col gap-4 md:col-span-12">
      {journeyCompleted ? (
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
      ) : null}
      <ResultPanel
        state={panelState}
        result={result}
        exampleResult={exampleResult}
        ctx={CTX}
        onLeverApply={handleLeverApply}
        announce={announce}
      />
    </div>
  );

  return (
    <div className={showMiniBar ? 'pb-[72px] sm:pb-0' : ''}>
      <div role="status" aria-live="polite" className="sr-only">
        {announcement}
      </div>
      <GuidedJourneyLayout steps={steps} interim={resultCanvas} result={resultCanvas} onComplete={handleComplete} />
      <ResultMiniBar visible={showMiniBar} summary={result?.answer ?? exampleResult.answer} onJump={jumpToResult} />
    </div>
  );
}
