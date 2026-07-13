// lib/rules/uk.ts
//
// UK ISA allowances and Capital Gains Tax rates. Sources: gov.uk
// (SPEC 1.5 + 8.4). verifiedAt reflects the date these figures were
// last checked against the primary source (2026-07-12).
//
import type { RulePack } from './types';
import { ASSUMPTION_RULES } from './assumptions';

const ISA_SOURCE = 'https://www.gov.uk/individual-savings-accounts';
const ISA_2027_REFORM_SOURCE =
  'https://www.gov.uk/government/publications/fiscal-events-2026-factsheets/isa-reform-2027-anti-circumvention-rules-factsheet';
const CGT_SOURCE = 'https://www.gov.uk/capital-gains-tax/rates';
const VERIFIED_AT = '2026-07-12';

// PR 5.1 addition (remortgage engine, UK): typical remortgage arrangement
// (product) fee. This is EXPLICITLY an editable default, not a "live rate" —
// there is no single regulator-set arrangement fee in the UK mortgage
// market; lenders set their own, from £0 fee-free deals up to £2,000+ on
// the lowest-rate deals. Cross-checked two consumer-finance sources:
// HomeOwners Alliance ("£0 – £2,000+"; "£500 to £1,000 but could be £2,000
// or more" for the best rates) and Uswitch ("around £1,000-£2,000 on
// average"). £999 sits inside both ranges and matches a very common actual
// UK product-fee price point; users can override it per-deal in the UI.
const UK_ARRANGEMENT_FEE_SOURCE = 'https://hoa.org.uk/advice/guides-for-homeowners/for-owners/remortgaging-costs/';
const UK_ARRANGEMENT_FEE_VERIFIED_AT = '2026-07-13';

export const UK_RULES: RulePack = {
  isaAllowance: [
    {
      value: 20000,
      effectiveFrom: '2025-04-06',
      sourceUrl: ISA_SOURCE,
      verifiedAt: VERIFIED_AT,
      label: 'ISA annual allowance (all ISA types combined)',
      category: 'limit',
    },
  ],
  cashIsaAllowance: [
    {
      value: 20000,
      effectiveFrom: '2025-04-06',
      effectiveTo: '2027-04-05',
      sourceUrl: ISA_SOURCE,
      verifiedAt: VERIFIED_AT,
      label: 'Cash ISA allowance',
      category: 'limit',
    },
    {
      value: 12000,
      effectiveFrom: '2027-04-06',
      sourceUrl: ISA_2027_REFORM_SOURCE,
      verifiedAt: VERIFIED_AT,
      label: 'Cash ISA allowance (under 65, from Autumn Budget 2025 reform)',
      category: 'limit',
    },
  ],
  cgtBasicRate: [
    {
      value: 0.18,
      effectiveFrom: '2024-10-30',
      sourceUrl: CGT_SOURCE,
      verifiedAt: VERIFIED_AT,
      label: 'Capital Gains Tax — basic rate',
      category: 'tax',
    },
  ],
  cgtHigherRate: [
    {
      value: 0.24,
      effectiveFrom: '2024-10-30',
      sourceUrl: CGT_SOURCE,
      verifiedAt: VERIFIED_AT,
      label: 'Capital Gains Tax — higher/additional rate',
      category: 'tax',
    },
  ],
  cgtAllowance: [
    {
      value: 3000,
      effectiveFrom: '2024-04-06',
      sourceUrl: CGT_SOURCE,
      verifiedAt: VERIFIED_AT,
      label: 'Capital Gains Tax annual exempt amount',
      category: 'tax',
    },
  ],
  dividendAllowance: [
    {
      value: 500,
      effectiveFrom: '2024-04-06',
      sourceUrl: CGT_SOURCE,
      verifiedAt: VERIFIED_AT,
      label: 'Dividend allowance',
      category: 'tax',
    },
  ],
  remortgageArrangementFeeDefault: [
    {
      value: 999,
      effectiveFrom: '2026-07-13',
      sourceUrl: UK_ARRANGEMENT_FEE_SOURCE,
      verifiedAt: UK_ARRANGEMENT_FEE_VERIFIED_AT,
      label: 'Typical remortgage arrangement fee (editable default, guideline)',
      category: 'assumption',
    },
  ],
  ...ASSUMPTION_RULES,
};
