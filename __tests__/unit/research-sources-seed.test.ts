// __tests__/unit/research-sources-seed.test.ts
// Validates the GENERATED research_sources seed migration against the
// authoritative runtime contract (FieldSourceSchema) — proving the source-matrix
// → DB provenance is contract-valid, and that the honesty rule held (eToro's
// low/open extended_hours cell was dropped → eToro under-sourced → provisional).
//
// Regenerate the seed with:
//   node scripts/research/build-trading-research-sources.mjs

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';
import { FieldSourceSchema, deriveResearchScore } from '@/lib/research/types';
import { getTopicConfig } from '@/lib/comparison/topics/index';

const SEED = 'supabase/migrations/20260719130000_seed_trading_research_sources.sql';
const REQUIRED = ['optionsFee', 'minDeposit', 'extendedHours', 'tradingview'];

interface Seed {
  slug: string;
  sources: Record<string, unknown>;
}

function parseSeeds(sql: string): Seed[] {
  const seeds: Seed[] = [];
  for (const chunk of sql.split('UPDATE public.product_attributes').slice(1)) {
    const json = chunk.match(/research_sources\s*=\s*'(.+?)'::jsonb/);
    const slug = chunk.match(/WHERE slug = '([a-z-]+)'/);
    if (!json || !slug) continue;
    seeds.push({ slug: slug[1], sources: JSON.parse(json[1].replace(/''/g, "'")) });
  }
  return seeds;
}

const seeds = parseSeeds(readFileSync(resolve(SEED), 'utf8'));

describe('generated research_sources seed', () => {
  it('covers all 9 trading-platform candidates', () => {
    expect(seeds.map((s) => s.slug).sort()).toEqual(
      [
        'charles-schwab',
        'etoro',
        'etrade',
        'fidelity',
        'interactive-brokers',
        'merrill-edge',
        'robinhood',
        'tastytrade',
        'webull',
      ].sort(),
    );
  });

  it('every seeded field-source is valid per the runtime FieldSourceSchema', () => {
    for (const { slug, sources } of seeds) {
      for (const [key, value] of Object.entries(sources)) {
        expect(REQUIRED, `${slug}.${key} unexpected key`).toContain(key);
        const parsed = FieldSourceSchema.safeParse(value);
        expect(parsed.success, `${slug}.${key} failed FieldSourceSchema`).toBe(true);
      }
    }
  });

  it('drops eToro extended_hours (low/open) → eToro is under-sourced (provisional at runtime)', () => {
    const etoro = seeds.find((s) => s.slug === 'etoro')!;
    expect(Object.keys(etoro.sources).sort()).toEqual(['minDeposit', 'optionsFee', 'tradingview']);
    expect(etoro.sources.extendedHours).toBeUndefined();
  });

  it('every other candidate has a source for all four Tier-1 facts', () => {
    for (const s of seeds.filter((x) => x.slug !== 'etoro')) {
      expect(Object.keys(s.sources).sort(), `${s.slug}`).toEqual([...REQUIRED].sort());
    }
  });

  it('the required key set matches the topic config (guards the generator REQUIRED_KEYS)', () => {
    // If this fails, a specColumn changed — update the source-matrix mapping AND
    // scripts/research/build-trading-research-sources.mjs (ATTR_TO_KEY/REQUIRED_KEYS).
    const config = getTopicConfig('trading', 'trading-platforms', 'us');
    expect(config).not.toBeNull();
    expect(config!.specColumns.map((c) => c.key)).toEqual(REQUIRED);
  });

  it('feeding the seeded eToro sources through the contract yields provisional (end-to-end)', () => {
    const etoro = seeds.find((s) => s.slug === 'etoro')!;
    const result = deriveResearchScore(
      {
        researchStatus: 'audited',
        score: 8.3,
        subScores: {},
        methodologyVersion: 'trading-platforms-v1',
        dataVerifiedAt: '2026-07-03',
        confidence: 'medium',
        confidenceReason: 'Core pricing verified; extended-hours availability unverified.',
        fieldSources: etoro.sources,
      },
      REQUIRED,
    );
    expect(result.status).toBe('provisional'); // extendedHours source intentionally absent
  });
});
