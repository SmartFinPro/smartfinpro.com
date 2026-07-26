// lib/rules/au.ts
//
// Australian superannuation guarantee rate and contribution caps.
// Source: ato.gov.au (SPEC 1.5 + 8.4). verifiedAt reflects the date
// these figures were last checked against the primary source (2026-07-12).
//
// NOTE on superGuaranteeRate's sourceUrl: the FDL Phase 0 plan cites the
// contributions-caps URL below for concessionalCap/nonConcessionalCap and
// separately notes "(+ Key-rates-Seite für SG)" for the Super Guarantee
// rate, without giving that page's exact URL. SPEC 1.5 cites the SG rate
// to "ato.gov.au Key superannuation rates and thresholds" (the landing
// page for that section). We use that page's canonical URL here rather
// than fabricate a deeper path; flagged for follow-up verification.

import type { RulePack } from './types';
import { ASSUMPTION_RULES } from './assumptions';

const ATO_CAPS_SOURCE =
  'https://www.ato.gov.au/tax-rates-and-codes/key-superannuation-rates-and-thresholds/contributions-caps';
const ATO_KEY_RATES_SOURCE =
  'https://www.ato.gov.au/tax-rates-and-codes/key-superannuation-rates-and-thresholds';
const VERIFIED_AT = '2026-07-12';

export const AU_RULES: RulePack = {
  superGuaranteeRate: [
    {
      value: 0.115,
      effectiveFrom: '2024-07-01',
      effectiveTo: '2025-06-30',
      sourceUrl: ATO_KEY_RATES_SOURCE,
      verifiedAt: VERIFIED_AT,
      label: 'Super Guarantee (SG) rate',
      category: 'limit',
    },
    {
      value: 0.12,
      effectiveFrom: '2025-07-01',
      sourceUrl: ATO_KEY_RATES_SOURCE,
      verifiedAt: VERIFIED_AT,
      label: 'Super Guarantee (SG) rate',
      category: 'limit',
    },
  ],
  concessionalCap: [
    {
      value: 30000,
      effectiveFrom: '2024-07-01',
      effectiveTo: '2026-06-30',
      sourceUrl: ATO_CAPS_SOURCE,
      verifiedAt: VERIFIED_AT,
      label: 'Concessional (before-tax) contributions cap',
      category: 'limit',
    },
    {
      value: 32500,
      effectiveFrom: '2026-07-01',
      sourceUrl: ATO_CAPS_SOURCE,
      verifiedAt: VERIFIED_AT,
      label: 'Concessional (before-tax) contributions cap',
      category: 'limit',
    },
  ],
  nonConcessionalCap: [
    {
      value: 120000,
      effectiveFrom: '2024-07-01',
      effectiveTo: '2026-06-30',
      sourceUrl: ATO_CAPS_SOURCE,
      verifiedAt: VERIFIED_AT,
      label: 'Non-concessional (after-tax) contributions cap',
      category: 'limit',
    },
    {
      value: 130000,
      effectiveFrom: '2026-07-01',
      sourceUrl: ATO_CAPS_SOURCE,
      verifiedAt: VERIFIED_AT,
      label: 'Non-concessional (after-tax) contributions cap',
      category: 'limit',
    },
  ],
  ...ASSUMPTION_RULES,
};
