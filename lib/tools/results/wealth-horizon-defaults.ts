// lib/tools/results/wealth-horizon-defaults.ts
// Wealth Horizon v2 Fable-Design-Review Fix 2 — single shared source for
// "the numbers the Live-Workspace starts with". Before this file, each of
// the 4 market pages hard-coded its own EXAMPLE_INPUTS persona (a 38-year-old
// with a $95k/£75k/$90k/$110k balance) for the SSR worked example, while
// components/tools/wealth-horizon/wealth-horizon-live.tsx separately
// hard-coded a DIFFERENT starting state (30/65/$20,000/$5,000/$400/0.5%/4%,
// target $4,000) for its live `useState` defaults. The two personas never
// matched, so the Hero number shown server-side (from the 38yo persona)
// never matched what the visible input fields actually said on first paint
// (the 30yo live defaults) — confusing.
//
// Fix: ONE Record<Market, RetirementInputs> here. Each page's `page.tsx`
// uses it BOTH to build the server-rendered worked example (via
// buildWealthHorizonResult) AND as the `defaultInputs` prop the island reads
// its initial `useState` from — so the SSR "Example result" and the live
// start state are now, by construction, pixel-identical.
//
// `Extract<..., { contributionMode: 'simple' }>` (not the full RetirementInputs
// union) because the Live-Workspace's Simple-mode `useState` shape always
// needs `.simple` — every market's default persona uses Simple contribution
// mode (account-breakdown is an opt-in the user switches into).

import type { Market, RetirementInputs } from '@/lib/calc/retirement/types';

type SimpleRetirementInputs = Extract<RetirementInputs, { contributionMode: 'simple' }>;

function buildDefault(market: Market): SimpleRetirementInputs {
  return {
    market,
    currentAge: 30,
    retireAge: 65,
    annualFeePct: 0.5,
    targetMonthlyIncomeToday: 4000,
    withdrawalRatePct: 4.0,
    contributionMode: 'simple',
    simple: {
      taxAdvantagedBalance: 20000,
      taxableBalance: 5000,
      employeeContributionMonthly: 400,
      employerContributionMonthly: 0,
    },
  };
}

export const WEALTH_HORIZON_DEFAULT_INPUTS: Record<Market, SimpleRetirementInputs> = {
  us: buildDefault('us'),
  uk: buildDefault('uk'),
  ca: buildDefault('ca'),
  au: buildDefault('au'),
};
