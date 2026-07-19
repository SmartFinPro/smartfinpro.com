// __tests__/unit/research-confidence-reasons-seed.test.ts
// Validates the GENERATED confidence_reason backfill (step-2 release-gate M1):
//   • it targets exactly the 8 audited-intent rows (eToro excluded)
//   • every generated text passes the authoritative forbidden-claim guard
//   • end-to-end: with the backfilled confidence_reason a fully-sourced row
//     flips provisional → audited (the whole point of the backfill)
//
// Regenerate with: node scripts/research/build-trading-confidence-reasons.mjs

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';
import { FORBIDDEN_CLAIM_PATTERNS } from '@/lib/editorial/forbidden-claims';
import { deriveResearchScore, type ResearchScoreInput } from '@/lib/research/types';

const SEED = 'supabase/migrations/20260719140000_seed_trading_confidence_reasons.sql';
const REQUIRED = ['optionsFee', 'minDeposit', 'extendedHours', 'tradingview'];

const fullSources = () =>
  Object.fromEntries(
    REQUIRED.map((k) => [k, { sourceUrl: 'https://example.com/x', sourceType: 'official', verifiedAt: '2026-07-03' }]),
  );

function parseReasons(sql: string): Record<string, string> {
  const map: Record<string, string> = {};
  for (const chunk of sql.split('UPDATE public.product_attributes').slice(1)) {
    const reason = chunk.match(/'"(.+?)"'::jsonb/);
    const slug = chunk.match(/WHERE slug = '([a-z-]+)'/);
    if (reason && slug) map[slug[1]] = reason[1].replace(/''/g, "'");
  }
  return map;
}

const reasons = parseReasons(readFileSync(resolve(SEED), 'utf8'));

describe('generated confidence_reason backfill', () => {
  it('targets exactly the 8 audited-intent rows (eToro excluded)', () => {
    expect(Object.keys(reasons).sort()).toEqual(
      [
        'charles-schwab',
        'etrade',
        'fidelity',
        'interactive-brokers',
        'merrill-edge',
        'robinhood',
        'tastytrade',
        'webull',
      ].sort(),
    );
    expect(reasons.etoro).toBeUndefined();
  });

  it('every text passes the authoritative forbidden-claim guard', () => {
    for (const [slug, text] of Object.entries(reasons)) {
      for (const { pattern, reason } of FORBIDDEN_CLAIM_PATTERNS) {
        expect(pattern.test(text), `${slug}: "${text}" hit forbidden pattern (${reason})`).toBe(false);
      }
    }
  });

  it('flips a fully-sourced row provisional → audited (and only because of the reason)', () => {
    const base = (confidenceReason: string | null): ResearchScoreInput => ({
      researchStatus: 'audited',
      score: 8.3,
      subScores: { pricing: 9 },
      methodologyVersion: 'trading-platforms-v1',
      dataVerifiedAt: '2026-07-03',
      confidence: 'high',
      confidenceReason,
      fieldSources: fullSources(),
    });
    // Without the backfilled reason → provisional.
    expect(deriveResearchScore(base(null), REQUIRED).status).toBe('provisional');
    // With the generated fidelity reason → audited.
    expect(deriveResearchScore(base(reasons.fidelity), REQUIRED).status).toBe('audited');
  });
});
