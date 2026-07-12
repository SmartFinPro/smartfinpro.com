// lib/rules/uk.ts
//
// UK ISA allowances and Capital Gains Tax rates. Sources: gov.uk
// (SPEC 1.5 + 8.4). verifiedAt reflects the date these figures were
// last checked against the primary source (2026-07-12).
//
// NOTE on cashIsaAllowance's 2027-04-06 entry: SPEC 1.5 cites this change
// to "gov.uk/individual-savings-accounts + gov.uk 'ISA reform 2027'
// Factsheet (Autumn Budget 2025)" but does not give a distinct URL for the
// factsheet itself. We reuse the general ISA allowance page URL below
// (a real, already-cited gov.uk source) rather than fabricate a specific
// factsheet link. Flagged for follow-up verification once a stable
// factsheet URL is confirmed.

import type { RulePack } from './types';
import { ASSUMPTION_RULES } from './assumptions';

const ISA_SOURCE = 'https://www.gov.uk/individual-savings-accounts';
const CGT_SOURCE = 'https://www.gov.uk/capital-gains-tax/rates';
const VERIFIED_AT = '2026-07-12';

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
      sourceUrl: ISA_SOURCE,
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
  ...ASSUMPTION_RULES,
};
