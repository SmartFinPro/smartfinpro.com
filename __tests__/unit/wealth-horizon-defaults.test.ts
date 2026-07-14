// __tests__/unit/wealth-horizon-defaults.test.ts
// Wealth Horizon v2 Fable-Design-Review Fix 2 — WEALTH_HORIZON_DEFAULT_INPUTS
// is the single shared source both the SSR worked example (page.tsx, via
// buildWealthHorizonResult) and the Live-Workspace island's `useState` seed
// (defaultInputs prop) read from. This test locks the exact numbers (so a
// future edit can't silently reintroduce the pre-Fix-2 mismatch between the
// two) and proves that building a result from the defaults at 'example' and
// at 'yours'/'base' (the island's live recompute with untouched state)
// produces content-identical numbers — the whole point of Fix 3 (scenario
// switching can show live numbers before any field is touched).

import { describe, it, expect } from 'vitest';
import { resolveRuleSnapshot } from '@/lib/rules';
import { WEALTH_HORIZON_DEFAULT_INPUTS } from '@/lib/tools/results/wealth-horizon-defaults';
import {
  buildWealthHorizonResult,
  WEALTH_HORIZON_US_RULE_KEYS,
  WEALTH_HORIZON_UK_RULE_KEYS,
  WEALTH_HORIZON_CA_RULE_KEYS,
  WEALTH_HORIZON_AU_RULE_KEYS,
} from '@/lib/tools/results/wealth-horizon-result';

const ASOF = '2026-07-13';

const RULE_KEYS_BY_MARKET = {
  us: WEALTH_HORIZON_US_RULE_KEYS,
  uk: WEALTH_HORIZON_UK_RULE_KEYS,
  ca: WEALTH_HORIZON_CA_RULE_KEYS,
  au: WEALTH_HORIZON_AU_RULE_KEYS,
} as const;

describe('WEALTH_HORIZON_DEFAULT_INPUTS', () => {
  it('has exactly one entry per market, all in Simple contribution mode', () => {
    expect(Object.keys(WEALTH_HORIZON_DEFAULT_INPUTS).sort()).toEqual(['au', 'ca', 'uk', 'us']);
    for (const market of ['us', 'uk', 'ca', 'au'] as const) {
      const inputs = WEALTH_HORIZON_DEFAULT_INPUTS[market];
      expect(inputs.contributionMode).toBe('simple');
      expect(inputs.market).toBe(market);
    }
  });

  it('locks the exact default persona numbers (30/65/$20,000/$5,000/$400/0.5%/4.0%, target $4,000)', () => {
    for (const market of ['us', 'uk', 'ca', 'au'] as const) {
      const inputs = WEALTH_HORIZON_DEFAULT_INPUTS[market];
      expect(inputs.currentAge).toBe(30);
      expect(inputs.retireAge).toBe(65);
      expect(inputs.annualFeePct).toBe(0.5);
      expect(inputs.targetMonthlyIncomeToday).toBe(4000);
      expect(inputs.withdrawalRatePct).toBe(4.0);
      expect(inputs.simple.taxAdvantagedBalance).toBe(20000);
      expect(inputs.simple.taxableBalance).toBe(5000);
      expect(inputs.simple.employeeContributionMonthly).toBe(400);
      expect(inputs.simple.employerContributionMonthly).toBe(0);
    }
  });

  it('the same numbers are identical across all 4 markets (only `market` differs)', () => {
    const { market: _us, ...usRest } = WEALTH_HORIZON_DEFAULT_INPUTS.us;
    for (const market of ['uk', 'ca', 'au'] as const) {
      const { market: _m, ...rest } = WEALTH_HORIZON_DEFAULT_INPUTS[market];
      expect(rest).toEqual(usRest);
    }
  });

  it('building a result from the defaults at resultState "example" and "yours"/base produces identical scenario numbers (Fix 3 precondition)', () => {
    for (const market of ['us', 'uk', 'ca', 'au'] as const) {
      const rules = resolveRuleSnapshot(market, [...RULE_KEYS_BY_MARKET[market]], ASOF);
      const inputs = WEALTH_HORIZON_DEFAULT_INPUTS[market];
      const exampleResult = buildWealthHorizonResult(inputs, rules, 'example');
      const liveResult = buildWealthHorizonResult(inputs, rules, 'yours', 'base');

      expect(liveResult.primary.value).toBe(exampleResult.primary.value);
      expect(liveResult.answer).toBe(exampleResult.answer);
      expect(liveResult.scenario).toEqual(exampleResult.scenario);
    }
  });
});
