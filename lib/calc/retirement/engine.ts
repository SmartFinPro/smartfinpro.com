// lib/calc/retirement/engine.ts
// Wealth Horizon v1 — pure real-terms projection (SPEC 8.3, binding).
// Everything is in today's purchasing power; scenario returns are REAL
// returns. The 2.5% inflation assumption exists ONLY in documentation —
// using it anywhere in this file is a contract violation (invariant-tested).
// No React, no DOM, no Date.now — asOf comes from the RuleSnapshot.
//
// Binding model conventions (SPEC 8.3 / PR 4.1 brief — also repeated in the
// AssumptionsDrawer copy of the consuming route, PR 4.2+):
//   1. Everything in today's purchasing power; scenario returns are REAL
//      returns from rules.values.realReturn{Conservative,Base,Optimistic};
//      the inflation assumption is used NOWHERE in this engine.
//   2. rNet = rScenario − annualFeePct/100 (fee applied EXACTLY once);
//      contributions land at year-end; contributions stop at retireAge.
//   3. illustrativeMonthlyWithdrawal = balanceAtRetire × withdrawalRatePct/100
//      / 12 — this field name is binding, never "sustainable".
//   4. The benefit counts exactly 0 before startsAtAge.
//   5. fiDate = first year ≤ retireAge where balance×rate/12 + benefit ≥
//      target; otherwise null.
//   6. incomeGapMonthly = max(0, target − withdrawal − benefit(retireAge)).

import type {
  EngineResult,
  Market,
  RetirementAccountInput,
  RetirementAccountType,
  RetirementInputs,
  ScenarioResult,
} from './types';
import type { Lever } from '@/lib/tools/shell-types';
import type { RuleSnapshot } from '@/lib/rules';
import { MARKET_CURRENCY, MARKET_LOCALE, formatCurrency } from '@/lib/tools/field-format';

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

// ── Input validation ─────────────────────────────────────────────────────

export function validateInputs(inputs: RetirementInputs): void {
  if (!Number.isFinite(inputs.currentAge) || !Number.isFinite(inputs.retireAge)) {
    throw new TypeError('currentAge/retireAge must be finite numbers');
  }
  if (inputs.currentAge < 0 || inputs.currentAge >= inputs.retireAge) {
    throw new TypeError('currentAge must be < retireAge');
  }
  if (inputs.retireAge > 80) {
    throw new TypeError('retireAge must be <= 80');
  }
  if (inputs.withdrawalRatePct < 2.5 || inputs.withdrawalRatePct > 5.0) {
    throw new TypeError('withdrawalRatePct must be within [2.5, 5.0]');
  }
  if (inputs.annualFeePct < 0 || inputs.annualFeePct > 3) {
    throw new TypeError('annualFeePct must be within [0, 3]');
  }
  if (inputs.contributionMode === 'account-breakdown' && inputs.accounts.length === 0) {
    throw new TypeError('account-breakdown mode requires at least one account');
  }
}

// ── Contributions ─────────────────────────────────────────────────────────

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

  const rows: { age: number; balance: number }[] = [{ age: inputs.currentAge, balance: round2(contrib.startingBalance) }];
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

function deferralCapKey(type: RetirementAccountType): string | null {
  switch (type) {
    case 'us-401k': return 'k401Limit';
    case 'us-traditional-ira':
    case 'us-roth-ira': return 'iraLimit';
    case 'uk-isa': return 'isaAllowance';
    case 'au-super': return 'concessionalCap';
    default: return null;
  }
}

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
  const capKey = deferralCapKey(a.type);
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

export const LEVER_EXTRA_MONTHLY = 200;   // in today's money units of the tool's market currency

function projectAll(inputs: RetirementInputs, rules: RuleSnapshot): { scenarios: [ScenarioResult, ScenarioResult, ScenarioResult] } {
  const contrib = totalContributions(inputs, rules);
  const scenarios = SCENARIO_KEYS.map((k) => projectScenario(k, inputs, rules, contrib)) as
    [ScenarioResult, ScenarioResult, ScenarioResult];
  return { scenarios };
}

/** Merges a flat lever patch into RetirementInputs. Top-level scalar fields
 *  (annualFeePct, retireAge, …) apply directly. `employeeContributionMonthly`
 *  is special-cased: it is not itself a top-level RetirementInputs field (it
 *  lives inside `simple` or a single account), so a patch carrying this key
 *  is treated as an ADDITIVE delta applied to simple mode's employee
 *  contribution, or — in account-breakdown mode — to the first account's
 *  employee contribution (the lever represents one incremental "add $X/mo"
 *  action, not a per-account allocation decision; precise per-account
 *  targeting is a GuidedJourney/4.2 UI concern, out of scope for this pure
 *  engine PR). */
/**
 * Applies a Lever's `apply` patch to inputs. This is the ONLY sanctioned way
 * to consume `Lever.apply` — a naive `for (k,v) of apply: setField(k,v)`
 * would misinterpret `employeeContributionMonthly` as an ABSOLUTE value
 * (unlike the scalar keys, which ARE absolute), silently turning "Add
 * $200/mo" into "set contribution to $200/mo" for a user already
 * contributing more than that. Consumers (e.g. PR 4.2's GuidedJourney)
 * MUST call this function rather than reimplementing patch application.
 *
 * `rules` is required (FDL 4.2 clamp-fix) so the account-breakdown branch
 * can consult resolveAccountContribution() and target a NON-clamped account
 * — see mutateInputs below for the documented bug this closes.
 */
export function applyLever(inputs: RetirementInputs, lever: Lever, rules: RuleSnapshot): RetirementInputs {
  return lever.apply ? mutateInputs(inputs, lever.apply, rules) : inputs;
}

function mutateInputs(
  inputs: RetirementInputs,
  patch: Partial<Record<string, number>>,
  rules: RuleSnapshot,
): RetirementInputs {
  const scalarKeys: (keyof RetirementInputs)[] = ['currentAge', 'retireAge', 'annualFeePct', 'targetMonthlyIncomeToday', 'withdrawalRatePct'];
  let next: RetirementInputs = { ...inputs };
  for (const k of scalarKeys) {
    const v = patch[k as string];
    if (typeof v === 'number') {
      (next as unknown as Record<string, unknown>)[k as string] = v;
    }
  }
  if (typeof patch.employeeContributionMonthly === 'number') {
    const extra = patch.employeeContributionMonthly;
    if (next.contributionMode === 'simple') {
      next = { ...next, simple: { ...next.simple, employeeContributionMonthly: next.simple.employeeContributionMonthly + extra } };
    } else {
      // FDL 4.2 clamp-fix (documented Opus follow-up): a live demo confirmed
      // "Add $200/mo" showed +$0 when accounts[0] was already clamped — the
      // delta landed on the clamped account and was immediately re-clamped
      // back to the same capped value by the engine's own
      // totalContributions()/resolveAccountContribution() pass. Target the
      // FIRST account whose clamp status is NOT 'clamped' (order preserved);
      // if every account is clamped, fall back to the LAST account
      // (documented v1 fallback — see the FDL 4.2 regression test).
      const accounts = next.accounts;
      let targetIndex = accounts.findIndex(
        (a) => resolveAccountContribution(a, next.currentAge, rules).check.status !== 'clamped',
      );
      if (targetIndex === -1) targetIndex = accounts.length - 1;
      const nextAccounts = accounts.map((a, i) =>
        i === targetIndex ? { ...a, employeeContributionMonthly: a.employeeContributionMonthly + extra } : a,
      ) as [RetirementAccountInput, ...RetirementAccountInput[]];
      next = { ...next, accounts: nextAccounts };
    }
  }
  return next;
}

function addMonthly(extra: number): Partial<Record<string, number>> {
  return { employeeContributionMonthly: extra };
}

function formatApprox(delta: number, market: Market): string {
  const currency = MARKET_CURRENCY[market];
  const locale = MARKET_LOCALE[market];
  return formatCurrency(Math.round(Math.abs(delta) / 10) * 10, currency, locale);
}

function variant(
  key: string,
  title: string,
  patch: Partial<Record<string, number>>,
  inputs: RetirementInputs,
  rules: RuleSnapshot,
  base: number,
): { lever: Lever; delta: number } {
  const mutated = mutateInputs(inputs, patch, rules);
  const newBalance = projectAll(mutated, rules).scenarios[1].balanceAtRetire;
  const delta = newBalance - base;
  // Opus follow-up (FDL 4.3, raised in the #95 review): the "contribution"
  // lever can legitimately land a $0 delta when every account is already at
  // its statutory or personal-room clamp — mutateInputs's all-clamped
  // fallback still adds LEVER_EXTRA_MONTHLY to an account's raw
  // employeeContributionMonthly, but resolveAccountContribution() re-clamps
  // it straight back to the same appliedMonthly, so the projection does not
  // move. "≈ +$0 at retirement" reads as if the lever failed for an
  // unrelated reason; label this specific, honest case instead. No second
  // calculation path — delta is still the exact number computed above.
  const deltaLabel =
    key === 'contribution' && delta === 0
      ? `≈ ${formatApprox(0, inputs.market)} (limits reached)`
      : `≈ +${formatApprox(delta, inputs.market)} at retirement`;
  return {
    lever: { key, title, deltaLabel, apply: patch },
    delta,
  };
}

export function buildLevers(inputs: RetirementInputs, rules: RuleSnapshot): [Lever, Lever, Lever] {
  const base = projectAll(inputs, rules).scenarios[1].balanceAtRetire;
  const candidates: { lever: Lever; delta: number }[] = [
    variant('fees', 'Cut fees by 0.5 pp', { annualFeePct: Math.max(0, inputs.annualFeePct - 0.5) }, inputs, rules, base),
    variant('contribution', `Add ${LEVER_EXTRA_MONTHLY}/mo`, addMonthly(LEVER_EXTRA_MONTHLY), inputs, rules, base),
    variant('retire-later', 'Retire 2 years later', { retireAge: inputs.retireAge + 2 }, inputs, rules, base),
  ].sort((a, b) => b.delta - a.delta);
  return candidates.map((c) => c.lever) as [Lever, Lever, Lever];
}

export function projectRetirement(inputs: RetirementInputs, rules: RuleSnapshot): EngineResult {
  validateInputs(inputs);   // currentAge < retireAge <= 80, withdrawalRatePct in [2.5, 5.0], fee in [0, 3], throws TypeError
  const checks = buildContributionChecks(inputs, rules);
  const contrib = totalContributions(inputs, rules);   // same clamp source as checks (resolveAccountContribution)
  const scenarios = SCENARIO_KEYS.map((k) => projectScenario(k, inputs, rules, contrib)) as
    [ScenarioResult, ScenarioResult, ScenarioResult];
  return { scenarios, levers: buildLevers(inputs, rules), contributionChecks: checks };
}
