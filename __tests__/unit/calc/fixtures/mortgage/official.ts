// __tests__/unit/calc/fixtures/mortgage/official.ts
//
// sourceType: 'official' — regulatory/underwriting guideline values, no
// projections. Each entry asserts getRule against a freshly verified (PR
// 5.1, 2026-07-13) RuleEntry in lib/rules/ca.ts. asOf is fixed to a date
// within the current (open-ended) effective windows so RULE_PACKS resolve
// deterministically. See lib/rules/ca.ts header comment for the full
// verification trail (sourceUrl per entry, drift-vs-spec-placeholder notes).

export interface OfficialMortgageRuleFixture {
  name: string;
  source: string;
  sourceType: 'official';
  asOf: string;
  market: 'ca';
  ruleKey: string;
  expectedValue: number;
}

export const OFFICIAL_MORTGAGE_RULE_FIXTURES: OfficialMortgageRuleFixture[] = [
  {
    name: 'OSFI B-20 minimum qualifying rate floor (5.25%)',
    source: 'osfi-bsif.gc.ca — Minimum qualifying rate for uninsured mortgages',
    sourceType: 'official',
    asOf: '2026-07-13',
    market: 'ca',
    ruleKey: 'osfiQualifyingRateFloor',
    expectedValue: 0.0525,
  },
  {
    name: 'CMHC GDS ratio guideline (39%)',
    source: 'cmhc-schl.gc.ca — CMHC Reviews Underwriting Criteria (2021-07-05)',
    sourceType: 'official',
    asOf: '2026-07-13',
    market: 'ca',
    ruleKey: 'gdsThreshold',
    expectedValue: 0.39,
  },
  {
    name: 'CMHC TDS ratio guideline (44%)',
    source: 'cmhc-schl.gc.ca — CMHC Reviews Underwriting Criteria (2021-07-05)',
    sourceType: 'official',
    asOf: '2026-07-13',
    market: 'ca',
    ruleKey: 'tdsThreshold',
    expectedValue: 0.44,
  },
  {
    name: 'CMHC premium — LTV up to 65% (0.60%)',
    source: 'cmhc-schl.gc.ca — premium-information-for-homeowner-and-small-rental-loans',
    sourceType: 'official',
    asOf: '2026-07-13',
    market: 'ca',
    ruleKey: 'cmhcPremiumLtv65',
    expectedValue: 0.006,
  },
  {
    name: 'CMHC premium — LTV 65.01-75% (1.70%)',
    source: 'cmhc-schl.gc.ca — premium-information-for-homeowner-and-small-rental-loans',
    sourceType: 'official',
    asOf: '2026-07-13',
    market: 'ca',
    ruleKey: 'cmhcPremiumLtv75',
    expectedValue: 0.017,
  },
  {
    name: 'CMHC premium — LTV 75.01-80% (2.40%)',
    source: 'cmhc-schl.gc.ca — premium-information-for-homeowner-and-small-rental-loans',
    sourceType: 'official',
    asOf: '2026-07-13',
    market: 'ca',
    ruleKey: 'cmhcPremiumLtv80',
    expectedValue: 0.024,
  },
  {
    name: 'CMHC premium — LTV 80.01-85% (2.80%)',
    source: 'cmhc-schl.gc.ca — premium-information-for-homeowner-and-small-rental-loans',
    sourceType: 'official',
    asOf: '2026-07-13',
    market: 'ca',
    ruleKey: 'cmhcPremiumLtv85',
    expectedValue: 0.028,
  },
  {
    name: 'CMHC premium — LTV 85.01-90% (3.10%)',
    source: 'cmhc-schl.gc.ca — premium-information-for-homeowner-and-small-rental-loans',
    sourceType: 'official',
    asOf: '2026-07-13',
    market: 'ca',
    ruleKey: 'cmhcPremiumLtv90',
    expectedValue: 0.031,
  },
  {
    name: 'CMHC premium — LTV 90.01-95% (4.00%)',
    source: 'cmhc-schl.gc.ca — premium-information-for-homeowner-and-small-rental-loans',
    sourceType: 'official',
    asOf: '2026-07-13',
    market: 'ca',
    ruleKey: 'cmhcPremiumLtv95',
    expectedValue: 0.04,
  },
  {
    name: 'CMHC premium — LTV 90.01-95%, non-traditional down payment (4.50%)',
    source: 'cmhc-schl.gc.ca — cmhc-mortgage-loan-insurance-cost',
    sourceType: 'official',
    asOf: '2026-07-13',
    market: 'ca',
    ruleKey: 'cmhcPremiumLtv95NonTraditional',
    expectedValue: 0.045,
  },
];
