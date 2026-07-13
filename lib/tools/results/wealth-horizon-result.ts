// lib/tools/results/wealth-horizon-result.ts
// Adapter: pure RetirementInputs + RuleSnapshot → ToolResult (SPEC 8.1) for
// Wealth Horizon US (FDL 4.2). This is the ONLY place that turns engine
// numbers into displayable copy — the page (RSC worked example) and the
// island (live result) both call this same function so the two never drift
// and no second calculation path exists in the UI layer.

import { projectRetirement } from '@/lib/calc/retirement/engine';
import type { RetirementInputs, ScenarioResult } from '@/lib/calc/retirement/types';
import type { RuleSnapshot } from '@/lib/rules';
import { formatCurrency, formatPercent, MARKET_CURRENCY, MARKET_LOCALE } from '@/lib/tools/field-format';
import type { AssumptionEntry, ResultState, RuleSourceRef, ToolResult } from '@/lib/tools/shell-types';

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

/** Pure inverse of the engine's `fiDate = asOfYear + (age - currentAge)` —
 *  turns a projected FI year back into the row age it corresponds to, for
 *  the chart marker's x-position. Not a second money calculation: it reuses
 *  the exact asOf/currentAge the engine already used, no new arithmetic on
 *  balances. */
function fiAge(fiDate: string | null, inputs: RetirementInputs, rules: RuleSnapshot): number | null {
  if (!fiDate) return null;
  const asOfYear = Number(rules.asOf.slice(0, 4));
  const parsedFiYear = Number(fiDate);
  if (!Number.isFinite(parsedFiYear)) return null;
  return inputs.currentAge + (parsedFiYear - asOfYear);
}

function buildAnswer(
  focus: ScenarioResult,
  focusScenario: WealthHorizonScenarioKey,
  inputs: RetirementInputs,
  currency: ToolResult['primary']['currency'],
  locale: string,
): string {
  const withdrawal = formatCurrency(focus.illustrativeMonthlyWithdrawal, currency!, locale);
  if (focus.fiDate) {
    return `In the ${focusScenario} scenario, you're on track for an illustrative retirement withdrawal of about ${withdrawal} a month in today's money by age ${inputs.retireAge}, reaching financial independence around ${focus.fiDate}.`;
  }
  const gap = formatCurrency(focus.incomeGapMonthly, currency!, locale);
  return `In the ${focusScenario} scenario, your illustrative retirement withdrawal is about ${withdrawal} a month in today's money by age ${inputs.retireAge} — financial independence isn't reached by then, leaving an income gap of about ${gap} a month.`;
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

  const markerAge = fiAge(focus.fiDate, inputs, rules);
  const markers = markerAge !== null ? [{ x: markerAge, label: `FI ${focus.fiDate}` }] : [];

  const textAlternative = `Projected balance at age ${inputs.retireAge} (today's money): `
    + `${formatCurrency(conservative.balanceAtRetire, currency, locale)} conservative, `
    + `${formatCurrency(base.balanceAtRetire, currency, locale)} base, `
    + `${formatCurrency(optimistic.balanceAtRetire, currency, locale)} optimistic. `
    + (focus.fiDate
      ? `Financial independence in the ${focusScenario} scenario is projected around ${focus.fiDate}.`
      : `Financial independence in the ${focusScenario} scenario is not reached by your chosen retirement age.`);

  return {
    answer: buildAnswer(focus, focusScenario, inputs, currency, locale),
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
