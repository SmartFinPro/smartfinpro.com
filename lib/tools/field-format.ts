// lib/tools/field-format.ts
// Pure locale-aware parsing/formatting for the Financial Field family
// (fields/currency-field.tsx, percentage-field.tsx, duration-field.tsx,
// integer-field.tsx). No React, no DOM — safe to unit-test directly and
// safe to import from RSC contexts (e.g. a worked-example server render)
// if ever needed. Numeric direct entry is ALWAYS available (SPEC design
// rule 7); parsing happens on raw user text, formatting on committed values.

import type { ToolCurrency } from '@/lib/tools/shell-types';
import type { ToolMarket } from '@/lib/tools/registry/types';

export const MARKET_LOCALE: Record<ToolMarket, string> = {
  us: 'en-US',
  uk: 'en-GB',
  ca: 'en-CA',
  au: 'en-AU',
};

export const MARKET_CURRENCY: Record<ToolMarket, ToolCurrency> = {
  us: 'USD',
  uk: 'GBP',
  ca: 'CAD',
  au: 'AUD',
};

const CURRENCY_SYMBOL: Record<ToolCurrency, string> = {
  USD: '$',
  GBP: '£',
  CAD: 'CA$',
  AUD: 'A$',
};

export function currencyAffix(currency: ToolCurrency): string {
  return CURRENCY_SYMBOL[currency];
}

/**
 * Strips currency symbols/affixes and thousands separators, returns the
 * numeric value. Returns null for empty/unparseable input (caller decides
 * whether that's a validation error or just "not yet typed").
 *
 * Examples: "1,250.50" (en-US) → 1250.5; "£12,000" → 12000; "" → null.
 * Locale is accepted for API symmetry with formatting but parsing itself is
 * locale-agnostic (strip everything that isn't a digit, dot or minus) —
 * every supported market (US/UK/CA/AU) uses '.' as the decimal separator
 * and ',' as the grouping separator, so no locale-specific parse table is
 * needed today (documented assumption, revisit if a ','-decimal market is
 * ever added).
 */
export function parseCurrencyInput(raw: string): number | null {
  if (raw == null) return null;
  const trimmed = raw.trim();
  if (trimmed === '') return null;
  // Strip everything except digits, '.', '-'
  const stripped = trimmed.replace(/[^0-9.\-]/g, '');
  if (stripped === '' || stripped === '-' || stripped === '.') return null;
  const value = Number(stripped);
  return Number.isFinite(value) ? value : null;
}

/** Same stripping rules — percentage/duration/integer fields share the parser. */
export function parseNumericInput(raw: string): number | null {
  return parseCurrencyInput(raw);
}

export function formatCurrency(value: number, currency: ToolCurrency, locale: string): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
    }).format(value);
  } catch {
    return `${currencyAffix(currency)}${value.toLocaleString(locale)}`;
  }
}

export function formatPercent(value: number, locale: string, fractionDigits = 1): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'percent',
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(value / 100);
  } catch {
    return `${value.toFixed(fractionDigits)}%`;
  }
}

export function formatInteger(value: number, locale: string): string {
  try {
    return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value);
  } catch {
    return String(Math.round(value));
  }
}

/** Clamp is applied ONLY on blur/commit (never while the user is mid-keystroke). */
export function clamp(value: number, min?: number, max?: number): number {
  let v = value;
  if (typeof min === 'number') v = Math.max(min, v);
  if (typeof max === 'number') v = Math.min(max, v);
  return v;
}

export type { ToolMarket };
