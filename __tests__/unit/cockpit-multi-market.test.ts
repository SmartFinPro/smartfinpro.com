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
import { caRoboAdvisorsConfig } from '@/lib/comparison/topics/ca/robo-advisors';
import { caBusinessBankAccountsConfig } from '@/lib/comparison/topics/ca/business-bank-accounts';
import { caTfsaRrspPlatformsConfig } from '@/lib/comparison/topics/ca/tfsa-rrsp-platforms';
import { ukInvestingAppsConfig } from '@/lib/comparison/topics/uk/investing-apps';
import { ukBusinessBankAccountsConfig } from '@/lib/comparison/topics/uk/business-bank-accounts';
import { ukSavingsAccountsConfig } from '@/lib/comparison/topics/uk/savings-accounts';
import { formatMoney, formatCostLabel } from '@/lib/comparison/money';
import { BEST_X_MANIFEST } from '@/lib/comparison/topics/manifest';
import { buildRelatedComparisons } from '@/lib/comparison/related-comparisons';

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

  it('uk still gets null for personal-finance/robo-advisors (au: and ca: are registered, uk: is not yet)', () => {
    expect(getTopicConfig('personal-finance', 'robo-advisors', 'uk')).toBeNull();
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

  it('resolves the market-specific CA config for personal-finance/robo-advisors — never the US or AU one', () => {
    const resolved = getTopicConfig('personal-finance', 'robo-advisors', 'ca');
    expect(resolved).toBe(caRoboAdvisorsConfig);
    expect(resolved).not.toBe(roboAdvisorsConfig);
    expect(resolved).not.toBe(auRoboAdvisorsConfig);
  });

  it('resolves the market-specific CA configs for business-bank-accounts and the CA-exclusive tfsa-rrsp-platforms', () => {
    expect(getTopicConfig('business-banking', 'business-bank-accounts', 'ca')).toBe(caBusinessBankAccountsConfig);
    expect(getTopicConfig('tax-efficient-investing', 'tfsa-rrsp-platforms', 'ca')).toBe(caTfsaRrspPlatformsConfig);
  });

  it('tfsa-rrsp-platforms is CA-exclusive — every other market gets null', () => {
    expect(getTopicConfig('tax-efficient-investing', 'tfsa-rrsp-platforms', 'us')).toBeNull();
    expect(getTopicConfig('tax-efficient-investing', 'tfsa-rrsp-platforms', 'uk')).toBeNull();
    expect(getTopicConfig('tax-efficient-investing', 'tfsa-rrsp-platforms', 'au')).toBeNull();
  });

  it('resolves the market-specific UK configs for investing-apps, business-bank-accounts and savings-accounts', () => {
    expect(getTopicConfig('personal-finance', 'investing-apps', 'uk')).toBe(ukInvestingAppsConfig);
    expect(getTopicConfig('business-banking', 'business-bank-accounts', 'uk')).toBe(ukBusinessBankAccountsConfig);
    expect(getTopicConfig('savings', 'savings-accounts', 'uk')).toBe(ukSavingsAccountsConfig);
    expect(getTopicConfig('savings', 'savings-accounts', 'uk')).not.toBe(auSavingsAccountsConfig);
  });

  it('returns null for an unknown combo in any market', () => {
    expect(getTopicConfig('savings', 'savings-accounts', 'ca')).toBeNull();
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

// Table-driven guard over every registered, non-legacy AU/CA/UK rollout
// manifest entry (26 topics — the 12 pre-existing US configs are out of
// scope here; several predate the SEO addendum's §3/§7/8 gates — e.g. no
// `sources` field, one metaDescription at 133 chars — and fixing those is a
// separate undertaking, not part of this rollout). Catches exactly the
// class of defect the SEO addendum treats as a launch blocker but that no
// automated gate previously checked: manifest/registry key mismatches,
// rendered meta-description length outside 140-160 (addendum §3 —
// check:seo does not scan these TopicConfig .ts files, only MDX content,
// so this was previously undetected until a manual audit found 6
// violations across AU/CA/UK), FAQ count below the ≥5 floor (addendum §4),
// and a missing sources list (addendum §7/8).
describe('Every BEST_X_MANIFEST entry — registry resolution + config invariants', () => {
  const liveEntries = BEST_X_MANIFEST.filter((e) => !e.legacy && e.market !== 'us');

  it.each(liveEntries.map((e) => [`${e.market}:${e.category}/${e.topic}`, e] as const))(
    '%s resolves to a config matching its manifest slug/category',
    (_label, entry) => {
      const config = getTopicConfig(entry.category, entry.topic, entry.market);
      expect(config, `getTopicConfig found no config for ${entry.market}:${entry.category}/${entry.topic} — registry/manifest key mismatch`).not.toBeNull();
      expect(config!.slug).toBe(entry.topic);
      expect(config!.category).toBe(entry.category);
    },
  );

  it.each(liveEntries.map((e) => [`${e.market}:${e.category}/${e.topic}`, e] as const))(
    '%s — rendered metaDescription is 140-160 chars (SEO addendum §3)',
    (_label, entry) => {
      const config = getTopicConfig(entry.category, entry.topic, entry.market);
      const rendered = config!.metaDescription(2026);
      expect(
        rendered.length,
        `${entry.market}:${entry.category}/${entry.topic} metaDescription is ${rendered.length} chars, outside 140-160: "${rendered}"`,
      ).toBeGreaterThanOrEqual(140);
      expect(rendered.length).toBeLessThanOrEqual(160);
    },
  );

  it.each(liveEntries.map((e) => [`${e.market}:${e.category}/${e.topic}`, e] as const))(
    '%s — rendered <title> (metaTitle + " | SmartFinPro" suffix) is 45-60 chars',
    (_label, entry) => {
      const config = getTopicConfig(entry.category, entry.topic, entry.market);
      const rendered = `${config!.metaTitle(2026)} | SmartFinPro`;
      expect(
        rendered.length,
        `${entry.market}:${entry.category}/${entry.topic} rendered title is ${rendered.length} chars, outside 45-60: "${rendered}"`,
      ).toBeGreaterThanOrEqual(45);
      expect(rendered.length).toBeLessThanOrEqual(60);
    },
  );

  it.each(liveEntries.map((e) => [`${e.market}:${e.category}/${e.topic}`, e] as const))(
    '%s has at least 5 FAQ entries (SEO addendum §4)',
    (_label, entry) => {
      const config = getTopicConfig(entry.category, entry.topic, entry.market);
      expect(config!.faq.length).toBeGreaterThanOrEqual(5);
    },
  );

  it.each(liveEntries.map((e) => [`${e.market}:${e.category}/${e.topic}`, e] as const))(
    '%s has a non-empty sources list (SEO addendum §7/8)',
    (_label, entry) => {
      const config = getTopicConfig(entry.category, entry.topic, entry.market);
      expect((config!.sources ?? []).length).toBeGreaterThan(0);
      expect((config!.relatedLinks ?? []).length).toBeGreaterThan(0);
    },
  );

  it('every AU/CA/UK entry has 1-3 verdict picks with valid rank labels', () => {
    for (const entry of liveEntries) {
      const config = getTopicConfig(entry.category, entry.topic, entry.market);
      expect(config!.verdict.picks.length, `${entry.market}:${entry.category}/${entry.topic} has ${config!.verdict.picks.length} verdict picks`).toBeGreaterThan(0);
      expect(config!.verdict.picks.length).toBeLessThanOrEqual(3);
    }
  });
});

// Regression guard for the SEO addendum §7/8 "≥8 in-content internal links"
// gate, scoped to EVERY live market including 'us' — the 12 pre-existing US
// TopicConfigs set zero `relatedLinks` (not just fewer than AU/CA/UK's 2-3),
// so this must be checked market-agnostically, not just for the 26 new
// topics. Caught a real gap: an earlier fix raised the shared cross-cockpit
// cap from 3 to 6, which cleared the gate for AU/CA/UK (which do set 2-3
// relatedLinks each) but left US pages at exactly 6 — the cap is now 8
// (RELATED_COMPARISONS_CAP in lib/comparison/related-comparisons.ts) so
// every market clears the gate on cross-links alone, with zero reliance on
// relatedLinks being set at all.
describe('In-content internal link count — SEO addendum §7/8 (all markets)', () => {
  const allLiveEntries = BEST_X_MANIFEST.filter((e) => !e.legacy);

  it.each(allLiveEntries.map((e) => [`${e.market}:${e.category}/${e.topic}`, e] as const))(
    '%s has ≥8 in-content internal links (relatedLinks + cross-cockpit)',
    (_label, entry) => {
      const config = getTopicConfig(entry.category, entry.topic, entry.market);
      expect(config, `no config for ${entry.market}:${entry.category}/${entry.topic}`).not.toBeNull();
      const relatedLinksCount = (config!.relatedLinks ?? []).length;
      const crossCockpitCount = buildRelatedComparisons(entry.market, entry.category, entry.topic).length;
      const total = relatedLinksCount + crossCockpitCount;
      expect(
        total,
        `${entry.market}:${entry.category}/${entry.topic} has only ${total} in-content internal links (${relatedLinksCount} relatedLinks + ${crossCockpitCount} cross-cockpit) — below the ≥8 gate`,
      ).toBeGreaterThanOrEqual(8);
    },
  );
});
