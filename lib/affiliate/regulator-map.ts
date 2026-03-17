/**
 * Primary Regulator Map — Client-safe, pure module
 *
 * Maps market x category to the single most relevant regulator abbreviation.
 * Used by <RegulatorBadge> to show a trust pill near CTA buttons.
 *
 * IMPORTANT: This file must remain 100% client-safe (no server imports).
 */

import type { Market, Category } from '@/types';

// ── Primary regulator per market x category ──────────────────────
// Returns the single most relevant regulator abbreviation.
// Categories without a clear regulator (ai-tools, cybersecurity) return ''.

const PRIMARY_REGULATOR: Record<Market, Partial<Record<Category, string>> & { default: string }> = {
  us: {
    trading: 'SEC',
    forex: 'NFA',
    'personal-finance': 'SEC',
    'business-banking': 'FDIC',
    'credit-repair': '',
    'debt-relief': '',
    default: '',
  },
  uk: {
    trading: 'FCA',
    forex: 'FCA',
    'personal-finance': 'FCA',
    'business-banking': 'FCA',
    default: '',
  },
  ca: {
    trading: 'CIRO',
    forex: 'CIRO',
    'personal-finance': 'CIRO',
    'business-banking': 'CDIC',
    default: '',
  },
  au: {
    trading: 'ASIC',
    forex: 'ASIC',
    'personal-finance': 'ASIC',
    'business-banking': 'ASIC',
    default: '',
  },
};

/**
 * Get the primary regulator abbreviation for a market x category.
 * Returns empty string if no regulator applies (e.g., ai-tools, cybersecurity).
 */
export function getPrimaryRegulator(market?: Market | string, category?: Category | string): string {
  if (!market || !category) return '';

  const m = market.toLowerCase() as Market;
  const marketMap = PRIMARY_REGULATOR[m];
  if (!marketMap) return '';

  return (marketMap as Record<string, string>)[category] ?? marketMap.default ?? '';
}

// ── Badge color classes (matching comparison-table-premium.tsx pattern) ──

export const REGULATOR_BADGE_COLORS: Record<string, string> = {
  FCA: 'bg-blue-50 text-blue-700 border-blue-200',
  ASIC: 'bg-sky-50 text-sky-700 border-sky-200',
  SEC: 'bg-blue-50 text-blue-700 border-blue-200',
  NFA: 'bg-blue-50 text-blue-700 border-blue-200',
  CIRO: 'bg-red-50 text-red-700 border-red-200',
  CDIC: 'bg-red-50 text-red-700 border-red-200',
  FDIC: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CySEC: 'bg-amber-50 text-amber-700 border-amber-200',
};
