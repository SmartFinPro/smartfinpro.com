// __tests__/unit/cockpit-multi-market.test.ts
// Stage-0 multi-market plumbing guards for the Comparison Cockpit:
// 1. Market-aware registry resolution (US-restricted fallback — a UK/CA/AU
//    market must NEVER receive a US config; SEO addendum §14 stop condition).
// 2. formatMoney per-market currency (incl. the Infinity "uncapped" sentinel).
// 3. formatCostLabel per costModel kind + explicit override.
// 4. Every BEST_X_MANIFEST image exists under public/ (broken-tile guard).

import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { getTopicConfig } from '@/lib/comparison/topics/index';
import { roboAdvisorsConfig } from '@/lib/comparison/topics/robo-advisors';
import { auRoboAdvisorsConfig } from '@/lib/comparison/topics/au/robo-advisors';
import { auBusinessBankAccountsConfig } from '@/lib/comparison/topics/au/business-bank-accounts';
import { auSavingsAccountsConfig } from '@/lib/comparison/topics/au/savings-accounts';
import { formatMoney, formatCostLabel } from '@/lib/comparison/money';
import { BEST_X_MANIFEST } from '@/lib/comparison/topics/manifest';

describe('getTopicConfig — market-aware registry', () => {
  it('resolves an unprefixed (US) config without a market argument', () => {
    expect(getTopicConfig('personal-finance', 'robo-advisors')).toBe(roboAdvisorsConfig);
  });

  it("resolves the unprefixed config for market 'us' (fallback allowed)", () => {
    expect(getTopicConfig('personal-finance', 'robo-advisors', 'us')).toBe(roboAdvisorsConfig);
  });

  it('NEVER falls back to a US config for a non-US market lacking its own config', () => {
    // 'debt-relief/companies' is US-only and not on any UK/CA/AU roadmap —
    // uk/ca/au must get null, never the US config (wrong currency/regulators/
    // picks otherwise). This is the core stop-condition guard, kept on a combo
    // that will never gain a market-prefixed config so this test stays valid.
    expect(getTopicConfig('debt-relief', 'companies', 'uk')).toBeNull();
    expect(getTopicConfig('debt-relief', 'companies', 'ca')).toBeNull();
    expect(getTopicConfig('debt-relief', 'companies', 'au')).toBeNull();
  });

  it('uk/ca still get null for personal-finance/robo-advisors (only au: is registered so far)', () => {
    expect(getTopicConfig('personal-finance', 'robo-advisors', 'uk')).toBeNull();
    expect(getTopicConfig('personal-finance', 'robo-advisors', 'ca')).toBeNull();
  });

  it('resolves the market-specific AU config for personal-finance/robo-advisors — never the US one', () => {
    const resolved = getTopicConfig('personal-finance', 'robo-advisors', 'au');
    expect(resolved).toBe(auRoboAdvisorsConfig);
    expect(resolved).not.toBe(roboAdvisorsConfig);
  });

  it('resolves the market-specific AU configs for business-bank-accounts and savings-accounts', () => {
    expect(getTopicConfig('business-banking', 'business-bank-accounts', 'au')).toBe(auBusinessBankAccountsConfig);
    expect(getTopicConfig('savings', 'savings-accounts', 'au')).toBe(auSavingsAccountsConfig);
  });

  it('returns null for an unknown combo in any market', () => {
    expect(getTopicConfig('savings', 'savings-accounts', 'uk')).toBeNull();
    expect(getTopicConfig('nope', 'nope')).toBeNull();
  });
});

describe('formatMoney — market currency', () => {
  it('formats per marketConfig symbol + locale', () => {
    expect(formatMoney(1234, 'us')).toBe('$1,234');
    expect(formatMoney(1234, 'uk')).toBe('£1,234');
    expect(formatMoney(1234, 'ca')).toBe('C$1,234');
    expect(formatMoney(1234, 'au')).toBe('A$1,234');
  });

  it('rounds fractional amounts', () => {
    expect(formatMoney(1234.6, 'uk')).toBe('£1,235');
  });

  it('preserves the Infinity "uncapped" sentinel (monthly-plus-setup)', () => {
    // costOverTime returns Infinity for "genuinely unknown/variable" setup fees;
    // the rendered cell must stay an honest "∞", never NaN or a huge number.
    expect(formatMoney(Infinity, 'us')).toBe('$∞');
    expect(formatMoney(Infinity, 'au')).toBe('A$∞');
  });
});

describe('formatCostLabel — per-kind defaults + override', () => {
  const inputs = { amount: 24, years: 5 };

  it('banking/compounding-fee → "N-yr cost"', () => {
    expect(formatCostLabel({ kind: 'banking' }, inputs)).toBe('5-yr cost');
    expect(formatCostLabel({ kind: 'compounding-fee' }, inputs)).toBe('5-yr cost');
  });

  it('monthly-plus-setup → "N-mo cost"', () => {
    expect(formatCostLabel({ kind: 'monthly-plus-setup' }, inputs)).toBe('24-mo cost');
  });

  it('fee-on-amount → "Cost on volume" (NOT a years label — addendum §11)', () => {
    expect(formatCostLabel({ kind: 'fee-on-amount' }, inputs)).toBe('Cost on volume');
  });

  it('explicit costLabel override wins', () => {
    expect(formatCostLabel({ kind: 'fee-on-amount', costLabel: 'Spread cost' }, inputs)).toBe('Spread cost');
  });
});

describe('BEST_X_MANIFEST — tile images exist', () => {
  it('every manifest image path resolves under public/', () => {
    for (const entry of BEST_X_MANIFEST) {
      const file = path.join(process.cwd(), 'public', entry.image);
      expect(fs.existsSync(file), `missing tile image for ${entry.market}:${entry.category}/${entry.topic}: ${entry.image}`).toBe(true);
    }
  });
});
