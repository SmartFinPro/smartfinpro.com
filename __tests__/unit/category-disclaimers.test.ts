import { describe, expect, it } from 'vitest';
import { getCategoryDisclaimer } from '@/lib/reviews/category-disclaimers';

describe('getCategoryDisclaimer', () => {
  it('returns a CFD/leverage risk disclaimer for trading', () => {
    const text = getCategoryDisclaimer('trading');
    expect(text).not.toBeNull();
    expect(text).toMatch(/leverage/i);
    expect(text).toMatch(/risk/i);
  });

  it('returns the same CFD/leverage risk disclaimer for forex', () => {
    const trading = getCategoryDisclaimer('trading');
    const forex = getCategoryDisclaimer('forex');
    expect(forex).toBe(trading);
  });

  it('returns a debt-relief-specific disclaimer for debt-relief (not legal/tax/bankruptcy advice)', () => {
    const text = getCategoryDisclaimer('debt-relief');
    expect(text).not.toBeNull();
    expect(text).toMatch(/not legal.*tax.*bankruptcy advice/i);
  });

  it('returns a credit-repair-specific disclaimer for credit-repair', () => {
    const text = getCategoryDisclaimer('credit-repair');
    expect(text).not.toBeNull();
    expect(text?.toLowerCase()).toContain('credit');
  });

  it('never reuses the debt-relief text for credit-repair or vice versa', () => {
    const debtRelief = getCategoryDisclaimer('debt-relief');
    const creditRepair = getCategoryDisclaimer('credit-repair');
    expect(debtRelief).not.toBe(creditRepair);
  });

  it('renders nothing (returns null) for an unknown/unmapped category', () => {
    expect(getCategoryDisclaimer('ai-tools')).toBeNull();
    expect(getCategoryDisclaimer('business-banking')).toBeNull();
    expect(getCategoryDisclaimer('cybersecurity')).toBeNull();
    expect(getCategoryDisclaimer('personal-finance')).toBeNull();
    expect(getCategoryDisclaimer('some-made-up-category')).toBeNull();
    expect(getCategoryDisclaimer('')).toBeNull();
  });

  it('does not contain the removed blanket "credit profile" phrasing for trading/forex', () => {
    expect(getCategoryDisclaimer('trading')?.toLowerCase()).not.toContain('credit profile');
    expect(getCategoryDisclaimer('forex')?.toLowerCase()).not.toContain('credit profile');
  });
});
