// lib/rules/us.ts
//
// US retirement-account limits. Source: IRS Notice 2025-67
// (SPEC 1.5 + 8.4). verifiedAt reflects the date these figures were
// last checked against the primary source (2026-07-12).

import type { RulePack } from './types';
import { ASSUMPTION_RULES } from './assumptions';

const IRS_SOURCE =
  'https://www.irs.gov/newsroom/401k-limit-increases-to-24500-for-2026-ira-limit-increases-to-7500';
const VERIFIED_AT = '2026-07-12';

export const US_RULES: RulePack = {
  k401Limit: [
    {
      value: 23500,
      effectiveFrom: '2025-01-01',
      effectiveTo: '2025-12-31',
      sourceUrl: IRS_SOURCE,
      verifiedAt: VERIFIED_AT,
      label: '401(k) employee deferral limit',
      category: 'limit',
    },
    {
      value: 24500,
      effectiveFrom: '2026-01-01',
      sourceUrl: IRS_SOURCE,
      verifiedAt: VERIFIED_AT,
      label: '401(k) employee deferral limit',
      category: 'limit',
    },
  ],
  k401CatchUp: [
    {
      value: 7500,
      effectiveFrom: '2025-01-01',
      effectiveTo: '2025-12-31',
      sourceUrl: IRS_SOURCE,
      verifiedAt: VERIFIED_AT,
      label: '401(k) catch-up contribution (age 50+)',
      category: 'limit',
    },
    {
      value: 8000,
      effectiveFrom: '2026-01-01',
      sourceUrl: IRS_SOURCE,
      verifiedAt: VERIFIED_AT,
      label: '401(k) catch-up contribution (age 50+)',
      category: 'limit',
    },
  ],
  k401CatchUpAge60To63: [
    {
      value: 11250,
      effectiveFrom: '2026-01-01',
      sourceUrl: IRS_SOURCE,
      verifiedAt: VERIFIED_AT,
      label: '401(k) enhanced catch-up contribution (age 60-63)',
      category: 'limit',
    },
  ],
  k401TotalContributionLimit: [
    {
      value: 72000,
      effectiveFrom: '2026-01-01',
      sourceUrl: IRS_SOURCE,
      verifiedAt: VERIFIED_AT,
      label: '401(k) total contribution limit (employee + employer)',
      category: 'limit',
    },
  ],
  rothCatchUpWageThreshold: [
    {
      value: 150000,
      effectiveFrom: '2026-01-01',
      sourceUrl: IRS_SOURCE,
      verifiedAt: VERIFIED_AT,
      label: 'Roth catch-up mandatory wage threshold',
      category: 'limit',
    },
  ],
  iraLimit: [
    {
      value: 7000,
      effectiveFrom: '2025-01-01',
      effectiveTo: '2025-12-31',
      sourceUrl: IRS_SOURCE,
      verifiedAt: VERIFIED_AT,
      label: 'IRA contribution limit',
      category: 'limit',
    },
    {
      value: 7500,
      effectiveFrom: '2026-01-01',
      sourceUrl: IRS_SOURCE,
      verifiedAt: VERIFIED_AT,
      label: 'IRA contribution limit',
      category: 'limit',
    },
  ],
  iraCatchUp: [
    {
      value: 1000,
      effectiveFrom: '2025-01-01',
      effectiveTo: '2025-12-31',
      sourceUrl: IRS_SOURCE,
      verifiedAt: VERIFIED_AT,
      label: 'IRA catch-up contribution (age 50+)',
      category: 'limit',
    },
    {
      value: 1100,
      effectiveFrom: '2026-01-01',
      sourceUrl: IRS_SOURCE,
      verifiedAt: VERIFIED_AT,
      label: 'IRA catch-up contribution (age 50+)',
      category: 'limit',
    },
  ],
  ...ASSUMPTION_RULES,
};
