// lib/rules/index.ts
//
// Versioned market-rule lookup for the Financial Decision Lab (SPEC 8.4).
//
// getRule/getRuleMeta resolve a rule key to the entry whose
// [effectiveFrom, effectiveTo] window contains `asOf`.
//   - dev/test: throws on an unknown key or a miss with no matching window
//     (fail loud — a silent wrong number in a financial calculator is worse
//     than a build-time/test-time crash).
//   - production: fails soft to the newest known entry and logs a warning,
//     so a transient data gap never takes a tool offline for users.

import { logger } from '@/lib/logging';
import { US_RULES } from './us';
import { UK_RULES } from './uk';
import { CA_RULES } from './ca';
import { AU_RULES } from './au';
import type { RuleEntry, RulePack } from './types';

export type { RuleCategory, RuleEntry, RulePack } from './types';

export const RULE_PACKS: Record<'us' | 'uk' | 'ca' | 'au', RulePack> = {
  us: US_RULES,
  uk: UK_RULES,
  ca: CA_RULES,
  au: AU_RULES,
};

export function getRuleMeta(
  market: keyof typeof RULE_PACKS,
  key: string,
  asOf: string
): RuleEntry {
  const entries = RULE_PACKS[market]?.[key];

  if (!entries?.length) {
    if (process.env.NODE_ENV !== 'production') {
      throw new Error(`Unknown rule ${market}.${key}`);
    }
    logger.warn(`Unknown rule ${market}.${key} — no fallback entry available`, { market, key, asOf });
    throw new Error(`Unknown rule ${market}.${key}`);
  }

  const match = [...entries]
    .reverse()
    .find((e) => e.effectiveFrom <= asOf && (!e.effectiveTo || asOf <= e.effectiveTo));

  if (match) return match;

  if (process.env.NODE_ENV !== 'production') {
    throw new Error(`No rule window ${market}.${key} @ ${asOf}`);
  }

  const fallback = entries[entries.length - 1];
  logger.warn(`No rule window ${market}.${key} @ ${asOf} — falling back to newest entry`, {
    market,
    key,
    asOf,
    fallbackEffectiveFrom: fallback.effectiveFrom,
  });
  return fallback;
}

export function getRule(market: keyof typeof RULE_PACKS, key: string, asOf: string): number {
  return getRuleMeta(market, key, asOf).value;
}
