// lib/rules/types.ts
//
// Versioned, sourced market-rule contract for the Financial Decision Lab.
// See SPEC 8.4 (docs/superpowers/specs/2026-07-12-financial-decision-lab-design.md).

export type RuleCategory = 'limit' | 'tax' | 'rate' | 'assumption';

export interface RuleEntry {
  value: number;
  effectiveFrom: string; // ISO date (YYYY-MM-DD)
  effectiveTo?: string; // ISO date; open/undefined = "bis auf Weiteres"
  sourceUrl: string; // Primärquelle (must be https://)
  verifiedAt: string; // ISO date, date of last manual verification
  label: string; // EN, UI-suitable label
  category: RuleCategory; // drives freshness SLA (8.5)
}

// Entries per key must be sorted ascending by effectiveFrom and non-overlapping.
export type RulePack = Record<string, RuleEntry[]>;
