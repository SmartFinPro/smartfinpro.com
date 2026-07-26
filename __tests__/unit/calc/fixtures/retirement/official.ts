// __tests__/unit/calc/fixtures/retirement/official.ts
//
// sourceType: 'official' — regulatory limits, no projections. Each entry
// asserts resolveAccountContribution's clamp decision against a published
// 2026 statutory limit (SPEC 8.3/8.4, PR 4.1 brief). asOf is fixed to a date
// within the 2026 windows so RULE_PACKS resolve deterministically.

export interface OfficialLimitFixture {
  name: string;
  source: string;
  sourceType: 'official';
  asOf: string;
  market: 'us' | 'uk' | 'ca' | 'au';
  ruleKey: string;
  expectedValue: number;
}

export const OFFICIAL_LIMIT_FIXTURES: OfficialLimitFixture[] = [
  {
    name: 'US 401(k) employee deferral limit 2026',
    source: 'IRS Notice 2025-67',
    sourceType: 'official',
    asOf: '2026-07-12',
    market: 'us',
    ruleKey: 'k401Limit',
    expectedValue: 24500,
  },
  {
    name: 'US 401(k) catch-up (age 50+) 2026',
    source: 'IRS Notice 2025-67',
    sourceType: 'official',
    asOf: '2026-07-12',
    market: 'us',
    ruleKey: 'k401CatchUp',
    expectedValue: 8000,
  },
  {
    name: 'US 401(k) enhanced catch-up (age 60-63) 2026',
    source: 'IRS Notice 2025-67',
    sourceType: 'official',
    asOf: '2026-07-12',
    market: 'us',
    ruleKey: 'k401CatchUpAge60To63',
    expectedValue: 11250,
  },
  {
    name: 'US 401(k) total contribution limit (employee + employer) 2026',
    source: 'IRS Notice 2025-67',
    sourceType: 'official',
    asOf: '2026-07-12',
    market: 'us',
    ruleKey: 'k401TotalContributionLimit',
    expectedValue: 72000,
  },
  {
    name: 'US IRA contribution limit 2026',
    source: 'IRS Notice 2025-67',
    sourceType: 'official',
    asOf: '2026-07-12',
    market: 'us',
    ruleKey: 'iraLimit',
    expectedValue: 7500,
  },
  {
    name: 'US IRA catch-up (age 50+) 2026',
    source: 'IRS Notice 2025-67',
    sourceType: 'official',
    asOf: '2026-07-12',
    market: 'us',
    ruleKey: 'iraCatchUp',
    expectedValue: 1100,
  },
  {
    name: 'CA RRSP limit 2026',
    source: 'CRA',
    sourceType: 'official',
    asOf: '2026-07-12',
    market: 'ca',
    ruleKey: 'rrspLimit',
    expectedValue: 33810,
  },
  {
    name: 'CA TFSA cumulative room 2026',
    source: 'CRA',
    sourceType: 'official',
    asOf: '2026-07-12',
    market: 'ca',
    ruleKey: 'tfsaCumulative',
    expectedValue: 109000,
  },
  {
    name: 'AU Super Guarantee rate (from 2025-07-01)',
    source: 'ATO',
    sourceType: 'official',
    asOf: '2026-07-12',
    market: 'au',
    ruleKey: 'superGuaranteeRate',
    expectedValue: 0.12,
  },
  {
    name: 'AU concessional cap (from 2026-07-01)',
    source: 'ATO',
    sourceType: 'official',
    asOf: '2026-07-12',
    market: 'au',
    ruleKey: 'concessionalCap',
    expectedValue: 32500,
  },
  {
    name: 'AU non-concessional cap (from 2026-07-01)',
    source: 'ATO',
    sourceType: 'official',
    asOf: '2026-07-12',
    market: 'au',
    ruleKey: 'nonConcessionalCap',
    expectedValue: 130000,
  },
  {
    name: 'UK ISA allowance 2026',
    source: 'gov.uk',
    sourceType: 'official',
    asOf: '2026-07-12',
    market: 'uk',
    ruleKey: 'isaAllowance',
    expectedValue: 20000,
  },
];
