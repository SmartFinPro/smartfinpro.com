// lib/rules/ca.ts
//
// Canadian RRSP/TFSA limits. Source: canada.ca (CRA) MP/RRSP/DPSP/TFSA
// limits and YMYL page (SPEC 1.5 + 8.4). verifiedAt reflects the date
// these figures were last checked against the primary source (2026-07-12).
//
// PR 5.1 addition (mortgage affordability engine, CA): OSFI B-20 stress-test
// floor, CMHC GDS/TDS underwriting benchmarks, and CMHC mortgage loan
// insurance premium schedule by LTV band. All verified against primary
// sources on 2026-07-13 — see per-entry sourceUrl. These are UNDERWRITING
// GUIDELINES, not statutory law — every label below says "guideline",
// never "legally required" (binding wording rule, FDL 5.1 brief).
//
// Drift note vs. FDL Phase-0 spec placeholders (documented in full in the
// PR 5.1 report): the OSFI floor (5.25%) and CMHC TDS max (44%) match the
// spec's placeholder values exactly after verification — no drift. The
// spec's ambiguous GDS placeholder ("0.32/0.39") is resolved to 0.39: that
// is CMHC's own published max GDS ratio for insured mortgages (primary
// source below); 0.32 is a widely-repeated conventional/uninsured-lending
// industry convention with no single canonical CMHC (or other regulator)
// citation, so it is deliberately NOT encoded as a RuleEntry here.

import type { RulePack } from './types';
import { ASSUMPTION_RULES } from './assumptions';

const CRA_SOURCE =
  'https://www.canada.ca/en/revenue-agency/services/tax/registered-plans-administrators/pspa/mp-rrsp-dpsp-tfsa-limits-ympe.html';
const VERIFIED_AT = '2026-07-12';

// OSFI Guideline B-20 — minimum qualifying rate (stress-test floor) for
// uninsured mortgages. Confirmed unchanged by OSFI as of Jan 29, 2026
// ("the greater of the mortgage contract rate plus 2% or 5.25%").
// Floor introduced 2021-06-01 (OSFI backgrounder / 2021 guidance letter).
const OSFI_MQR_SOURCE =
  'https://www.osfi-bsif.gc.ca/en/supervision/financial-institutions/banks/minimum-qualifying-rate-uninsured-mortgages';
const OSFI_VERIFIED_AT = '2026-07-13';

// CMHC — GDS/TDS underwriting benchmarks for insured (high-ratio) mortgages.
// Effective 2021-07-05 ("CMHC Reviews Underwriting Criteria" notice:
// "CMHC will consider a Gross Debt Service (GDS) ratio up to 39% and Total
// Debt Service (TDS) ratio up to 44% for borrowers who have a strong
// history of managing their payment obligations.").
const CMHC_GDS_TDS_SOURCE =
  'https://www.cmhc-schl.gc.ca/media-newsroom/notices/2021/cmhc-reviews-underwriting-criteria';
const CMHC_GDS_TDS_VERIFIED_AT = '2026-07-13';

// CMHC — mortgage loan insurance premium schedule by loan-to-value (LTV)
// band, standard 25-year amortization, homeowner purchase loans. Cross-
// checked against two CMHC pages (consumer cost page + professional premium
// -information page); both agree on all 6 bands + the non-traditional-
// down-payment surcharge band. Neither page states an explicit "effective
// from" date in body text; the premium-information page's own "Date
// Published: March 31, 2018" is used here as a conservative effectiveFrom
// proxy (flagged for Opus review — the schedule itself may predate that
// page revision, but 2018-03-31 is the latest date CMHC's own page commits
// to in writing, so it cannot overstate how long the schedule has been in
// force). A 0.20pp surcharge applies for 30-year amortizations (available
// since Aug/Dec 2024 for first-time buyers / new builds) — NOT modeled in
// this v1 engine (termYears is a free input, no amortization-tier premium
// adjustment); flagged as an open scope note in the PR 5.1 report.
const CMHC_PREMIUM_SOURCE =
  'https://www.cmhc-schl.gc.ca/professionals/project-funding-and-mortgage-financing/mortgage-loan-insurance/mortgage-loan-insurance-homeownership-programs/premium-information-for-homeowner-and-small-rental-loans';
const CMHC_PREMIUM_EFFECTIVE_FROM = '2018-03-31';
const CMHC_PREMIUM_VERIFIED_AT = '2026-07-13';

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
  osfiQualifyingRateFloor: [
    {
      value: 0.0525,
      effectiveFrom: '2021-06-01',
      sourceUrl: OSFI_MQR_SOURCE,
      verifiedAt: OSFI_VERIFIED_AT,
      label: 'OSFI B-20 minimum qualifying rate floor (stress-test guideline)',
      category: 'rate',
    },
  ],
  gdsThreshold: [
    {
      value: 0.39,
      effectiveFrom: '2021-07-05',
      sourceUrl: CMHC_GDS_TDS_SOURCE,
      verifiedAt: CMHC_GDS_TDS_VERIFIED_AT,
      label: 'CMHC Gross Debt Service (GDS) ratio guideline — insured mortgages',
      category: 'limit',
    },
  ],
  tdsThreshold: [
    {
      value: 0.44,
      effectiveFrom: '2021-07-05',
      sourceUrl: CMHC_GDS_TDS_SOURCE,
      verifiedAt: CMHC_GDS_TDS_VERIFIED_AT,
      label: 'CMHC Total Debt Service (TDS) ratio guideline — insured mortgages',
      category: 'limit',
    },
  ],
  cmhcPremiumLtv65: [
    {
      value: 0.006,
      effectiveFrom: CMHC_PREMIUM_EFFECTIVE_FROM,
      sourceUrl: CMHC_PREMIUM_SOURCE,
      verifiedAt: CMHC_PREMIUM_VERIFIED_AT,
      label: 'CMHC mortgage loan insurance premium guideline — LTV up to 65%',
      category: 'rate',
    },
  ],
  cmhcPremiumLtv75: [
    {
      value: 0.017,
      effectiveFrom: CMHC_PREMIUM_EFFECTIVE_FROM,
      sourceUrl: CMHC_PREMIUM_SOURCE,
      verifiedAt: CMHC_PREMIUM_VERIFIED_AT,
      label: 'CMHC mortgage loan insurance premium guideline — LTV 65.01%-75%',
      category: 'rate',
    },
  ],
  cmhcPremiumLtv80: [
    {
      value: 0.024,
      effectiveFrom: CMHC_PREMIUM_EFFECTIVE_FROM,
      sourceUrl: CMHC_PREMIUM_SOURCE,
      verifiedAt: CMHC_PREMIUM_VERIFIED_AT,
      label: 'CMHC mortgage loan insurance premium guideline — LTV 75.01%-80%',
      category: 'rate',
    },
  ],
  cmhcPremiumLtv85: [
    {
      value: 0.028,
      effectiveFrom: CMHC_PREMIUM_EFFECTIVE_FROM,
      sourceUrl: CMHC_PREMIUM_SOURCE,
      verifiedAt: CMHC_PREMIUM_VERIFIED_AT,
      label: 'CMHC mortgage loan insurance premium guideline — LTV 80.01%-85%',
      category: 'rate',
    },
  ],
  cmhcPremiumLtv90: [
    {
      value: 0.031,
      effectiveFrom: CMHC_PREMIUM_EFFECTIVE_FROM,
      sourceUrl: CMHC_PREMIUM_SOURCE,
      verifiedAt: CMHC_PREMIUM_VERIFIED_AT,
      label: 'CMHC mortgage loan insurance premium guideline — LTV 85.01%-90%',
      category: 'rate',
    },
  ],
  cmhcPremiumLtv95: [
    {
      value: 0.04,
      effectiveFrom: CMHC_PREMIUM_EFFECTIVE_FROM,
      sourceUrl: CMHC_PREMIUM_SOURCE,
      verifiedAt: CMHC_PREMIUM_VERIFIED_AT,
      label: 'CMHC mortgage loan insurance premium guideline — LTV 90.01%-95%',
      category: 'rate',
    },
  ],
  cmhcPremiumLtv95NonTraditional: [
    {
      value: 0.045,
      effectiveFrom: CMHC_PREMIUM_EFFECTIVE_FROM,
      sourceUrl: CMHC_PREMIUM_SOURCE,
      verifiedAt: CMHC_PREMIUM_VERIFIED_AT,
      label:
        'CMHC mortgage loan insurance premium guideline — LTV 90.01%-95%, non-traditional down payment',
      category: 'rate',
    },
  ],
  ...ASSUMPTION_RULES,
};
