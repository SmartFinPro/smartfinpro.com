// lib/tools/results/wealth-horizon-result.ts
// Adapter: pure RetirementInputs + RuleSnapshot → ToolResult (SPEC 8.1) for
// Wealth Horizon US (FDL 4.2). This is the ONLY place that turns engine
// numbers into displayable copy — the page (RSC worked example) and the
// island (live result) both call this same function so the two never drift
// and no second calculation path exists in the UI layer.

import { projectRetirement } from '@/lib/calc/retirement/engine';
import type { RetirementInputs, ScenarioResult } from '@/lib/calc/retirement/types';
import type { RuleSnapshot } from '@/lib/rules';
import { findMilestoneCrossings } from '@/lib/calc/chart-geometry';
import { formatCompactCurrency, formatCurrency, formatPercent, MARKET_CURRENCY, MARKET_LOCALE } from '@/lib/tools/field-format';
import type { AssumptionEntry, ResultState, RuleSourceRef, ToolResult } from '@/lib/tools/shell-types';

/** Lifetime Path chart horizon end age (Wealth Horizon v2 — SPEC "full life
 *  horizon" contract): currentAge..LIFETIME_END_AGE, covering both the
 *  accumulation and decumulation phases in one continuous axis. */
export const LIFETIME_END_AGE = 90;

/** Milestone thresholds (Wealth Horizon v2), applied to the BASE scenario's
 *  accumulation line only — max 4 by construction (one entry per threshold
 *  that's actually crossed before retireAge). */
const MILESTONE_THRESHOLDS = [100_000, 250_000, 500_000, 1_000_000];

function formatMilestoneLabel(value: number, age: number, currency: ToolResult['primary']['currency'], locale: string): string {
  return `${formatCompactCurrency(value, currency ?? 'USD', locale)} · ${age}`;
}

export type WealthHorizonScenarioKey = 'conservative' | 'base' | 'optimistic';

/**
 * SPEC 8.3 negative wording list, binding for every market's copy (page
 * belowFold, journey island, adapter-built answer/assumptions). Single
 * exported source — imported by the unit test AND every Wealth Horizon e2e
 * spec (FDL 4.3 Opus follow-up from #95) so the list can never drift between
 * suites.
 */
export const FORBIDDEN_WORDS = ['sustainable', 'guaranteed', 'you will have'] as const;

/**
 * SPEC 4.5 local placeholder bridge — registry-driven `getBridge()` ships in
 * PR 3.4 (Registry-Brücken). Deliberately `kind: 'tool'`, NOT `'cockpit'`:
 * SPEC 4.5's real Wealth Horizon bridge target is the robo-advisors cockpit
 * (`/us/personal-finance/best/robo-advisors`), but wiring a NEW cockpit CTA
 * path for a brand-new major tool during the active tool_v1 analytics
 * baseline window (0.5) would contaminate that baseline. This local, tool-
 * only bridge is reciprocal to Money Leak Scanner's own bridge into Wealth
 * Horizon (SPEC 9.3: "Money Leak ×4 → Wealth Horizon, invest the savings").
 */
const WEALTH_HORIZON_NEXT_ACTION: ToolResult['nextAction'] = {
  href: '/tools/money-leak-scanner',
  label: 'Find more money to put toward this plan — scan for hidden monthly leaks',
  kind: 'tool',
};

function scenarioByKey(scenarios: readonly ScenarioResult[], key: WealthHorizonScenarioKey): ScenarioResult {
  const found = scenarios.find((s) => s.key === key);
  if (!found) throw new Error(`missing scenario ${key}`);
  return found;
}

function buildAnswer(
  focus: ScenarioResult,
  inputs: RetirementInputs,
  currency: ToolResult['primary']['currency'],
  locale: string,
): string {
  // Wealth Horizon v3 (Clean-Redesign, Fable-Direktive) — the old 3-way
  // scenario switcher is gone (replaced by a single user-entered "Expected
  // annual return" + "Expected inflation" pair, see
  // lib/tools/results/wealth-horizon-real-return.ts), so this sentence no
  // longer names a scenario ("In the base scenario, …") — there is nothing
  // left in the UI for that phrase to refer to. `focus` is always the
  // engine's 'base' scenario now (buildWealthHorizonResult below always
  // calls this with focusScenario 'base'); conservative/optimistic still
  // exist purely to populate primary.range (Result Contract slot 2).
  const withdrawal = formatCurrency(focus.illustrativeMonthlyWithdrawal, currency!, locale);
  if (focus.fiDate) {
    return `You're on track for an illustrative retirement withdrawal of about ${withdrawal} a month in today's money by age ${inputs.retireAge}, reaching financial independence around ${focus.fiDate}.`;
  }
  const gap = formatCurrency(focus.incomeGapMonthly, currency!, locale);
  return `Your illustrative retirement withdrawal is about ${withdrawal} a month in today's money by age ${inputs.retireAge} — financial independence isn't reached by then, leaving an income gap of about ${gap} a month.`;
}

function minVerifiedAt(rules: RuleSnapshot): string {
  const dates = Object.values(rules.meta).map((m) => m.verifiedAt);
  if (dates.length === 0) return rules.asOf;
  return dates.reduce((min, d) => (d < min ? d : min));
}

function buildAssumptions(inputs: RetirementInputs, rules: RuleSnapshot, locale: string): AssumptionEntry[] {
  const pct = (v: number | undefined) => (typeof v === 'number' ? formatPercent(v * 100, locale, 1) : 'n/a');
  return [
    { label: 'Conservative real return', value: pct(rules.values.realReturnConservative), note: 'editorial planning scenario, not a forecast' },
    { label: 'Base real return', value: pct(rules.values.realReturnBase), note: 'editorial planning scenario, not a forecast' },
    { label: 'Optimistic real return', value: pct(rules.values.realReturnOptimistic), note: 'editorial planning scenario, not a forecast' },
    { label: 'Annual fee (subtracted from each scenario)', value: formatPercent(inputs.annualFeePct, locale, 2) },
    { label: 'Withdrawal rate', value: formatPercent(inputs.withdrawalRatePct, locale, 1) },
    {
      label: 'Contribution timing',
      value: 'Year-end',
      note: 'contributions land once per year and stop at your chosen retirement age',
    },
    {
      label: 'Inflation (documentation only)',
      value: typeof rules.values.inflationAssumption === 'number' ? pct(rules.values.inflationAssumption) : 'n/a',
      note: "not applied a second time — every figure above is already in today's money; this rate only shows nominal ≈ real + inflation",
    },
  ];
}

function buildSources(rules: RuleSnapshot): RuleSourceRef[] {
  const seen = new Set<string>();
  const sources: RuleSourceRef[] = [];
  for (const meta of Object.values(rules.meta)) {
    const dedupeKey = `${meta.sourceUrl}|${meta.label}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    sources.push({ label: meta.label, url: meta.sourceUrl, effectiveFrom: meta.effectiveFrom, verifiedAt: meta.verifiedAt });
  }
  return sources;
}

export function buildWealthHorizonResult(
  inputs: RetirementInputs,
  rules: RuleSnapshot,
  resultState: ResultState,
  focusScenario: WealthHorizonScenarioKey = 'base',
): ToolResult {
  const engineResult = projectRetirement(inputs, rules);
  const conservative = scenarioByKey(engineResult.scenarios, 'conservative');
  const base = scenarioByKey(engineResult.scenarios, 'base');
  const optimistic = scenarioByKey(engineResult.scenarios, 'optimistic');
  const focus = scenarioByKey(engineResult.scenarios, focusScenario);

  const currency = MARKET_CURRENCY[inputs.market];
  const locale = MARKET_LOCALE[inputs.market];

  const markerAge = focus.fiAge; // engine-computed (ScenarioResult.fiAge) — single source, no second calc path
  const markers = markerAge !== null ? [{ x: markerAge, label: `FI ${focus.fiDate}` }] : [];

  // Milestones: base-scenario ACCUMULATION line only (v2 Lifetime Path
  // contract) — max 4 by construction (one per threshold actually crossed
  // before retireAge).
  const milestoneCrossings = findMilestoneCrossings(
    base.rows.map((r) => ({ age: r.age, balance: r.balance })),
    MILESTONE_THRESHOLDS,
  );
  const milestones = milestoneCrossings.map((m) => ({
    age: m.age,
    balance: m.threshold,
    label: formatMilestoneLabel(m.threshold, m.age, currency, locale),
  }));

  const textAlternative = `Projected balance at age ${inputs.retireAge} (today's money): `
    + `${formatCurrency(conservative.balanceAtRetire, currency, locale)} conservative, `
    + `${formatCurrency(base.balanceAtRetire, currency, locale)} base, `
    + `${formatCurrency(optimistic.balanceAtRetire, currency, locale)} optimistic. `
    + (focus.fiDate
      ? `Financial independence in the ${focusScenario} scenario is projected around ${focus.fiDate}. `
      : `Financial independence in the ${focusScenario} scenario is not reached by your chosen retirement age. `)
    + (focus.depletionAge !== null
      ? `Funds run out around age ${focus.depletionAge} in the ${focusScenario} scenario at the illustrative withdrawal rate.`
      : `Funds last beyond age ${LIFETIME_END_AGE} in the ${focusScenario} scenario at the illustrative withdrawal rate.`);

  return {
    answer: buildAnswer(focus, inputs, currency, locale),
    primary: {
      label: "Illustrative retirement withdrawal (monthly, in today's money)",
      value: focus.illustrativeMonthlyWithdrawal,
      range: { low: conservative.illustrativeMonthlyWithdrawal, high: optimistic.illustrativeMonthlyWithdrawal },
      format: 'currency',
      currency,
    },
    scenario: {
      kind: 'corridor',
      series: [
        { key: 'conservative', rows: conservative.rows.map((r) => ({ x: r.age, y: r.balance })) },
        { key: 'base', rows: base.rows.map((r) => ({ x: r.age, y: r.balance })) },
        { key: 'optimistic', rows: optimistic.rows.map((r) => ({ x: r.age, y: r.balance })) },
      ],
      decumulation: [
        { key: 'conservative', rows: conservative.decumulationRows.map((r) => ({ x: r.age, y: r.balance })) },
        { key: 'base', rows: base.decumulationRows.map((r) => ({ x: r.age, y: r.balance })) },
        { key: 'optimistic', rows: optimistic.decumulationRows.map((r) => ({ x: r.age, y: r.balance })) },
      ],
      retireAge: inputs.retireAge,
      endAge: LIFETIME_END_AGE,
      fiAge: focus.fiAge,
      depletionAge: focus.depletionAge,
      milestones,
      withdrawalMonthly: focus.illustrativeMonthlyWithdrawal,
      incomeGapMonthly: focus.incomeGapMonthly,
      balanceAtRetire: focus.balanceAtRetire,
      markers,
      xLabel: 'Age',
      yLabel: "Balance (today's money)",
      textAlternative,
    },
    levers: engineResult.levers,
    assumptions: buildAssumptions(inputs, rules, locale),
    sources: buildSources(rules),
    verifiedAt: minVerifiedAt(rules),
    nextAction: WEALTH_HORIZON_NEXT_ACTION,
    resultState,
  };
}

/**
 * Auftrag 2 (User-Direktive 14.07.2026) — ONE-sentence recap shown above the
 * Best-match-products section, generated from the SAME numbers the resultCanvas
 * already renders (corridor.balanceAtRetire/incomeGapMonthly, the focused
 * scenario's illustrativeMonthlyWithdrawal, inputs.targetMonthlyIncomeToday) —
 * no second calc path, this only formats. Reuses the exact "in today's money"
 * wording (SPEC 8.3) and never emits FORBIDDEN_WORDS; makes no return/
 * performance promise — it only reports the plan's own numbers back to the
 * user. Exact templates (binding, User-Direktive):
 *   achieved: "Your plan adds up to $869,691 by 65 — about $2,899/month in
 *     today's money, covering your $2,500 goal."
 *   missed:   "Your plan adds up to $507,867 by 65 — about $1,693/month in
 *     today's money, $2,307 short of your $4,000 goal."
 * `incomeGapMonthly` is passed straight from the engine's own
 * `max(0, target − withdrawal − benefit)` (ScenarioResult.incomeGapMonthly) —
 * never recomputed here, so this can never drift from buildAnswer()'s own
 * "income gap" figure above.
 */
export interface RecapSentenceInput {
  balanceAtRetire: number;
  retireAge: number;
  withdrawalMonthly: number;
  targetMonthlyIncomeToday: number;
  incomeGapMonthly: number;
  currency: ToolResult['primary']['currency'];
  locale: string;
}

export function buildRecapSentence({
  balanceAtRetire,
  retireAge,
  withdrawalMonthly,
  targetMonthlyIncomeToday,
  incomeGapMonthly,
  currency,
  locale,
}: RecapSentenceInput): string {
  const balance = formatCurrency(balanceAtRetire, currency!, locale);
  const monthly = formatCurrency(withdrawalMonthly, currency!, locale);
  const goal = formatCurrency(targetMonthlyIncomeToday, currency!, locale);
  const goalPart =
    incomeGapMonthly > 0
      ? `${formatCurrency(incomeGapMonthly, currency!, locale)} short of your ${goal} goal`
      : `covering your ${goal} goal`;

  return `Your plan adds up to ${balance} by ${retireAge} — about ${monthly}/month in today's money, ${goalPart}.`;
}

/** Rule keys Wealth Horizon US needs from resolveRuleSnapshot — single source
 *  for the page (worked example) and the island (live recompute) so the two
 *  never resolve a different rule set. */
export const WEALTH_HORIZON_US_RULE_KEYS = [
  'realReturnConservative',
  'realReturnBase',
  'realReturnOptimistic',
  'inflationAssumption',
  'k401Limit',
  'k401CatchUp',
  'k401CatchUpAge60To63',
  'iraLimit',
  'iraCatchUp',
] as const;

/** Rule keys Wealth Horizon UK needs (FDL 4.3) — isaAllowance drives the
 *  engine's uk-isa statutory-cap check (deferralCapKey) and the UI's ISA
 *  allowance context chip; both read the SAME resolved value. */
export const WEALTH_HORIZON_UK_RULE_KEYS = [
  'realReturnConservative',
  'realReturnBase',
  'realReturnOptimistic',
  'inflationAssumption',
  'isaAllowance',
] as const;

/** Rule keys Wealth Horizon CA needs (FDL 4.3). No rrspLimit/tfsaAnnual/
 *  tfsaCumulative here on purpose — ca-tfsa/ca-rrsp are 'personal room'
 *  account types in the engine (resolveAccountContribution's roomTypes),
 *  never a national-maximum-derived statutory cap (contract, SPEC 8.3). */
export const WEALTH_HORIZON_CA_RULE_KEYS = [
  'realReturnConservative',
  'realReturnBase',
  'realReturnOptimistic',
  'inflationAssumption',
] as const;

/** Rule keys Wealth Horizon AU needs (FDL 4.3) — concessionalCap drives the
 *  engine's au-super statutory-cap check AND the UI's cap chip;
 *  superGuaranteeRate drives the editable SG contribution-suggestion helper. */
export const WEALTH_HORIZON_AU_RULE_KEYS = [
  'realReturnConservative',
  'realReturnBase',
  'realReturnOptimistic',
  'inflationAssumption',
  'concessionalCap',
  'superGuaranteeRate',
] as const;
