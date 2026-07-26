// lib/rules/assumptions.ts
//
// Editorial long-run assumptions (real return scenarios + inflation) used by
// Wealth Horizon-style projections (SPEC 8.3). These are NOT regulatory facts —
// they are redaktionelle Annahmen with a documented methodology/derivation.
//
// sourceUrl intentionally points at the future on-site methodology section
// (https://smartfinpro.com/tools/retirement-calculator#methodology), per the
// FDL Phase 0 plan (Task 4, Step 2). That anchor/section does not exist yet —
// it ships with Phase 4. Until then these entries are labelled
// 'Editorial long-run assumption' rather than cited to an external authority,
// and the derivation lives in SPEC 8.3
// (docs/superpowers/specs/2026-07-12-financial-decision-lab-design.md).
// Do NOT cite the SPEC file itself as sourceUrl — it is not a public URL.

import type { RulePack } from './types';

const METHODOLOGY_URL = 'https://smartfinpro.com/tools/retirement-calculator#methodology';
const VERIFIED_AT = '2026-07-12';

export const ASSUMPTION_RULES: RulePack = {
  realReturnConservative: [
    {
      value: 0.03,
      effectiveFrom: '2026-07-12',
      sourceUrl: METHODOLOGY_URL,
      verifiedAt: VERIFIED_AT,
      label: 'Editorial long-run assumption',
      category: 'assumption',
    },
  ],
  realReturnBase: [
    {
      value: 0.05,
      effectiveFrom: '2026-07-12',
      sourceUrl: METHODOLOGY_URL,
      verifiedAt: VERIFIED_AT,
      label: 'Editorial long-run assumption',
      category: 'assumption',
    },
  ],
  realReturnOptimistic: [
    {
      value: 0.065,
      effectiveFrom: '2026-07-12',
      sourceUrl: METHODOLOGY_URL,
      verifiedAt: VERIFIED_AT,
      label: 'Editorial long-run assumption',
      category: 'assumption',
    },
  ],
  inflationAssumption: [
    {
      value: 0.025,
      effectiveFrom: '2026-07-12',
      sourceUrl: METHODOLOGY_URL,
      verifiedAt: VERIFIED_AT,
      label: 'Editorial long-run assumption',
      category: 'assumption',
    },
  ],
};
