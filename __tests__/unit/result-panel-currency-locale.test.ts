// __tests__/unit/result-panel-currency-locale.test.ts
// PR #96 documented finding: ResultPanel's currency formatter always used
// Intl.NumberFormat('en-US', ...), so non-USD amounts rendered with an
// ambiguity prefix instead of a bare "$" (e.g. CAD → "CA$1,234", AUD →
// "A$1,234") even on the CA/AU market pages. Fix: derive the locale from
// the already-present ToolResult.primary.currency via localeForCurrency()
// (components/tools/shell/result-panel.tsx) — smallest change, no new
// market/locale prop on ResultPanel.

import { describe, it, expect } from 'vitest';
import { localeForCurrency } from '@/components/tools/shell/result-panel';
import type { ToolCurrency } from '@/lib/tools/shell-types';

describe('localeForCurrency()', () => {
  it('maps each of the 4 ToolCurrency values to its own market locale', () => {
    expect(localeForCurrency('USD')).toBe('en-US');
    expect(localeForCurrency('GBP')).toBe('en-GB');
    expect(localeForCurrency('CAD')).toBe('en-CA');
    expect(localeForCurrency('AUD')).toBe('en-AU');
  });

  it('defaults to en-US when currency is undefined', () => {
    expect(localeForCurrency(undefined)).toBe('en-US');
  });

  it('CAD formats as bare "$", not "CA$" (the PR #96 regression)', () => {
    const formatted = new Intl.NumberFormat(localeForCurrency('CAD'), {
      style: 'currency',
      currency: 'CAD',
      maximumFractionDigits: 0,
    }).format(1234);
    expect(formatted).toBe('$1,234');
    expect(formatted).not.toContain('CA$');
  });

  it('AUD formats as bare "$", not "A$" (the PR #96 regression)', () => {
    const formatted = new Intl.NumberFormat(localeForCurrency('AUD'), {
      style: 'currency',
      currency: 'AUD',
      maximumFractionDigits: 0,
    }).format(1234);
    expect(formatted).toBe('$1,234');
    expect(formatted).not.toContain('A$');
  });

  it('GBP still formats with the £ sign', () => {
    const formatted = new Intl.NumberFormat(localeForCurrency('GBP'), {
      style: 'currency',
      currency: 'GBP',
      maximumFractionDigits: 0,
    }).format(1234);
    expect(formatted).toBe('£1,234');
  });

  it('USD is unaffected by the fix', () => {
    const formatted = new Intl.NumberFormat(localeForCurrency('USD'), {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(1234);
    expect(formatted).toBe('$1,234');
  });

  it('is exhaustive over ToolCurrency (compile-time check)', () => {
    const all: ToolCurrency[] = ['USD', 'GBP', 'CAD', 'AUD'];
    for (const c of all) {
      expect(typeof localeForCurrency(c)).toBe('string');
    }
  });
});
