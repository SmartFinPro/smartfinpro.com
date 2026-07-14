// __tests__/unit/field-format.test.ts
// Pure parsing/formatting for the Financial Field family
// (lib/tools/field-format.ts) — currency parsing, locale formatting per
// market, min/max clamp semantics. No React, no DOM.

import { describe, it, expect } from 'vitest';
import {
  parseCurrencyInput,
  parseNumericInput,
  formatCurrency,
  formatPercent,
  formatInteger,
  clamp,
  currencyAffix,
  MARKET_LOCALE,
  MARKET_CURRENCY,
} from '@/lib/tools/field-format';

describe('parseCurrencyInput()', () => {
  it('"1,250.50" (en-US grouping) parses to 1250.5', () => {
    expect(parseCurrencyInput('1,250.50')).toBe(1250.5);
  });

  it('"£12,000" strips the currency affix and grouping', () => {
    expect(parseCurrencyInput('£12,000')).toBe(12000);
  });

  it('"$9,999,999" (large value) parses correctly', () => {
    expect(parseCurrencyInput('$9,999,999')).toBe(9999999);
  });

  it('"CA$1,234.56" strips a multi-char affix', () => {
    expect(parseCurrencyInput('CA$1,234.56')).toBe(1234.56);
  });

  it('empty string returns null (not 0 — caller must distinguish "not typed" from zero)', () => {
    expect(parseCurrencyInput('')).toBeNull();
    expect(parseCurrencyInput('   ')).toBeNull();
  });

  it('unparseable input returns null instead of NaN', () => {
    expect(parseCurrencyInput('abc')).toBeNull();
    expect(parseCurrencyInput('-')).toBeNull();
    expect(parseCurrencyInput('.')).toBeNull();
  });

  it('negative values parse correctly', () => {
    expect(parseCurrencyInput('-500')).toBe(-500);
  });

  it('parseNumericInput shares the same stripping rules', () => {
    expect(parseNumericInput('45.5%'.replace('%', ''))).toBe(45.5);
  });
});

describe('formatCurrency() / formatPercent() / formatInteger()', () => {
  it('formats USD/GBP/CAD/AUD via each market locale', () => {
    expect(formatCurrency(1250, 'USD', MARKET_LOCALE.us)).toContain('1,250');
    expect(formatCurrency(1250, 'GBP', MARKET_LOCALE.uk)).toContain('1,250');
    expect(formatCurrency(1250, 'CAD', MARKET_LOCALE.ca)).toContain('1,250');
    expect(formatCurrency(1250, 'AUD', MARKET_LOCALE.au)).toContain('1,250');
  });

  it('MARKET_CURRENCY maps each market to its canonical currency', () => {
    expect(MARKET_CURRENCY.us).toBe('USD');
    expect(MARKET_CURRENCY.uk).toBe('GBP');
    expect(MARKET_CURRENCY.ca).toBe('CAD');
    expect(MARKET_CURRENCY.au).toBe('AUD');
  });

  it('formatPercent renders a percentage with the given fraction digits', () => {
    expect(formatPercent(5, 'en-US', 1)).toContain('5');
    expect(formatPercent(5, 'en-US', 1)).toContain('%');
  });

  it('formatInteger renders grouped digits with no decimals', () => {
    const out = formatInteger(1234567, 'en-US');
    expect(out).toContain('1,234,567');
    expect(out).not.toContain('.');
  });

  it('currencyAffix returns the visible symbol per currency', () => {
    expect(currencyAffix('USD')).toBe('$');
    expect(currencyAffix('GBP')).toBe('£');
  });

  // Wealth Horizon v2 Fable-Design-Review Fix 1 — a 30-year PROJECTION
  // showing cents ("$1,387.93/mo") reads as false precision. Every
  // user-visible amount is now whole-currency-unit only, in every market
  // locale, regardless of whether the underlying value is fractional.
  it('rounds fractional values to whole currency units (no cents), per market locale', () => {
    expect(formatCurrency(1387.93, 'USD', MARKET_LOCALE.us)).not.toContain('.');
    expect(formatCurrency(3612.07, 'USD', MARKET_LOCALE.us)).not.toContain('.');
    expect(formatCurrency(1083620.65, 'USD', MARKET_LOCALE.us)).not.toContain('.');
    expect(formatCurrency(1387.93, 'GBP', MARKET_LOCALE.uk)).not.toContain('.');
    expect(formatCurrency(1387.93, 'CAD', MARKET_LOCALE.ca)).not.toContain('.');
    expect(formatCurrency(1387.93, 'AUD', MARKET_LOCALE.au)).not.toContain('.');
  });

  it('still formats already-whole values with no decimals (unchanged behavior)', () => {
    expect(formatCurrency(1250, 'USD', MARKET_LOCALE.us)).not.toContain('.');
  });
});

describe('clamp()', () => {
  it('clamps below min up to min', () => {
    expect(clamp(-5, 0, 100)).toBe(0);
  });

  it('clamps above max down to max', () => {
    expect(clamp(500, 0, 100)).toBe(100);
  });

  it('passes through values already within range', () => {
    expect(clamp(50, 0, 100)).toBe(50);
  });

  it('is a no-op when min/max are undefined', () => {
    expect(clamp(12345)).toBe(12345);
  });
});
