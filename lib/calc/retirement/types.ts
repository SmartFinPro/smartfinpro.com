// lib/calc/retirement/types.ts
// Wealth Horizon v1 types — word-for-word from SPEC 8.3
// (docs/superpowers/specs/2026-07-12-financial-decision-lab-design.md).
// Pure types only, no React/DOM.

import type { Lever } from '@/lib/tools/shell-types';
import type { ToolMarket } from '@/lib/tools/registry/types';

// SPEC 8.3 writes `market: Market`; ToolMarket is the FDL-wide canonical
// union already established by lib/tools/registry (PR 0.4/2.1) — aliased
// here so the field name/shape matches the spec exactly without introducing
// a second, divergent Market union.
export type Market = ToolMarket;

export type RetirementAccountType =
  | 'us-401k' | 'us-traditional-ira' | 'us-roth-ira' | 'us-taxable'
  | 'uk-isa' | 'uk-sipp' | 'uk-taxable'
  | 'ca-tfsa' | 'ca-rrsp' | 'ca-taxable'
  | 'au-super' | 'au-taxable';

export interface RetirementAccountInput {
  id: string;
  type: RetirementAccountType;
  balance: number;
  employeeContributionMonthly: number;
  employerContributionMonthly?: number;
  contributedYtd?: number;
  availableRoom?: number; // user input / official personal value only; never derived from a national maximum
}

export interface RetirementBaseInputs {
  market: Market;
  currentAge: number;
  retireAge: number;
  annualFeePct: number;
  targetMonthlyIncomeToday: number;
  expectedRetirementBenefit?: {
    monthlyAmountToday: number; // taken from the user's official estimator/statement
    startsAtAge: number;
    source: 'user-estimate'; // engine never auto-estimates entitlement/amount
  };
  withdrawalRatePct: number; // 2.5–5.0, default 4.0 — adjustable, part of the inputs
  /** Optional REAL annual escalation of employee contributions, in percent
   *  (0–5). Increases are in today's purchasing power ON TOP of inflation —
   *  the whole model is real, so no second inflation application exists
   *  anywhere. 0/undefined ⇒ flat contributions, results bit-identical to
   *  the pre-v4 engine (invariant-tested). Applies to employee contributions
   *  only (simple total or each account's employeeContributionMonthly);
   *  employer match stays flat (documented v1 simplification). Advisory
   *  contribution checks keep using year-1 amounts (existing convention). */
  contributionGrowthPct?: number;
}

export type RetirementInputs = RetirementBaseInputs & (
  | {
      contributionMode: 'simple';
      simple: {
        taxAdvantagedBalance: number;
        taxableBalance: number;
        employeeContributionMonthly: number;
        employerContributionMonthly?: number;
      };
      accounts?: never;
    }
  | {
      contributionMode: 'account-breakdown';
      accounts: [RetirementAccountInput, ...RetirementAccountInput[]];
      simple?: never;
    }
);

export interface ScenarioResult {
  key: 'conservative' | 'base' | 'optimistic';
  rows: { age: number; balance: number }[]; // real, annual
  balanceAtRetire: number;
  illustrativeMonthlyWithdrawal: number; // balance × withdrawalRate / 12 — NEVER "sustainable"/guarantee wording
  incomeGapMonthly: number; // target − withdrawal − benefit, but benefit only from startsAtAge
  fiDate: string | null; // first year in which withdrawal + (already-started) benefit ≥ target
  /** Post-retirement path in TODAY'S money: same real rNet, fee applied once,
   *  constant illustrative withdrawal (from balanceAtRetire × rate). The
   *  user-entered benefit is INCOME, not an asset — it never enters this
   *  balance path (documented; it already reduces incomeGapMonthly). */
  decumulationRows: { age: number; balance: number }[]; // retireAge..min(90, depletion age)
  /** First age (integer) at which the balance would hit ≤ 0 under the
   *  illustrative withdrawal; null when funds last to age 90 in this scenario. */
  depletionAge: number | null;
  /** fiDate as an AGE (currentAge + (fiYear − asOfYear)); null when fiDate is null. */
  fiAge: number | null;
}

export interface EngineResult {
  scenarios: [ScenarioResult, ScenarioResult, ScenarioResult];
  levers: [Lever, Lever, Lever]; // Fees −0.5pp · +$X/month · retire age +2y (priority by delta)
  contributionChecks: {
    accountId?: string;
    ruleKey?: string;
    status: 'not-applicable' | 'ok' | 'warning' | 'clamped';
    amountApplied: number;
    message: string;
  }[];
  bands?: unknown[]; // Phase-6 slot (Monte Carlo percentile bands), unused in v1
}
