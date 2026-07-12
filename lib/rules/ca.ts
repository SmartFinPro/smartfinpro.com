// lib/rules/ca.ts
//
// Canadian RRSP/TFSA limits. Source: canada.ca (CRA) MP/RRSP/DPSP/TFSA
// limits and YMYL page (SPEC 1.5 + 8.4). verifiedAt reflects the date
// these figures were last checked against the primary source (2026-07-12).

import type { RulePack } from './types';
import { ASSUMPTION_RULES } from './assumptions';

const CRA_SOURCE =
  'https://www.canada.ca/en/revenue-agency/services/tax/registered-plans-administrators/pspa/mp-rrsp-dpsp-tfsa-limits-ympe.html';
const VERIFIED_AT = '2026-07-12';

export const CA_RULES: RulePack = {
  rrspLimit: [
    {
      value: 32490,
      effectiveFrom: '2025-01-01',
      effectiveTo: '2025-12-31',
      sourceUrl: CRA_SOURCE,
      verifiedAt: VERIFIED_AT,
      label: 'RRSP contribution limit',
      category: 'limit',
    },
    {
      value: 33810,
      effectiveFrom: '2026-01-01',
      sourceUrl: CRA_SOURCE,
      verifiedAt: VERIFIED_AT,
      label: 'RRSP contribution limit',
      category: 'limit',
    },
  ],
  tfsaAnnual: [
    {
      value: 7000,
      effectiveFrom: '2024-01-01',
      sourceUrl: CRA_SOURCE,
      verifiedAt: VERIFIED_AT,
      label: 'TFSA annual contribution limit',
      category: 'limit',
    },
  ],
  tfsaCumulative: [
    {
      value: 102000,
      effectiveFrom: '2025-01-01',
      effectiveTo: '2025-12-31',
      sourceUrl: CRA_SOURCE,
      verifiedAt: VERIFIED_AT,
      label: 'TFSA cumulative lifetime room (since 2009, age 18+)',
      category: 'limit',
    },
    {
      value: 109000,
      effectiveFrom: '2026-01-01',
      sourceUrl: CRA_SOURCE,
      verifiedAt: VERIFIED_AT,
      label: 'TFSA cumulative lifetime room (since 2009, age 18+)',
      category: 'limit',
    },
  ],
  ...ASSUMPTION_RULES,
};
