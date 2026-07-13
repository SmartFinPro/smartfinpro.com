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
