// __tests__/unit/research-score.test.ts
// P1 contract tests — the Research Library BEST-X data contract:
// FieldSource validation, the discriminated ResearchScore schema, and the
// deterministic degradation (deriveResearchScore) that keeps invalid rows from
// ever surfacing as a prominent score/rank (and never drops a row).

import { describe, it, expect } from 'vitest';
import {
  FieldSourceSchema,
  ResearchScoreSchema,
  makeResearchScoreSchema,
  deriveResearchScore,
  type ResearchScoreInput,
} from '@/lib/research/types';

// Trading-platforms visible Tier-1 facts (TopicConfig specColumn keys).
const REQUIRED = ['optionsFee', 'minDeposit', 'extendedHours', 'tradingview'] as const;

const src = (over: Partial<{ sourceUrl: string; sourceType: string; verifiedAt: string }> = {}) => ({
  sourceUrl: 'https://www.interactivebrokers.com/en/pricing/commissions-options.php',
  sourceType: 'official',
  verifiedAt: '2026-07-03',
  ...over,
});

const fullSources = () =>
  Object.fromEntries(REQUIRED.map((k) => [k, src()])) as Record<string, ReturnType<typeof src>>;

const auditedInput = (over: Partial<ResearchScoreInput> = {}): ResearchScoreInput => ({
  researchStatus: 'audited',
  score: 9.1,
  subScores: { pricing: 9.5, platform: 8.7 },
  methodologyVersion: 'trading-platforms-v1',
  dataVerifiedAt: '2026-07-03',
  confidence: 'high',
  confidenceReason: 'Core pricing verified against official pages.',
  fieldSources: fullSources(),
  ...over,
});

describe('FieldSourceSchema', () => {
  it('accepts a well-formed HTTPS source', () => {
    expect(FieldSourceSchema.safeParse(src()).success).toBe(true);
  });

  it('rejects a non-HTTPS URL', () => {
    expect(FieldSourceSchema.safeParse(src({ sourceUrl: 'http://x.com' })).success).toBe(false);
  });

  it('rejects a garbage URL', () => {
    expect(FieldSourceSchema.safeParse(src({ sourceUrl: 'not-a-url' })).success).toBe(false);
  });

  it('rejects a non-ISO verifiedAt date', () => {
    expect(FieldSourceSchema.safeParse(src({ verifiedAt: '07/03/2026' })).success).toBe(false);
  });

  it('rejects a calendar-invalid date that matches the ISO shape', () => {
    expect(FieldSourceSchema.safeParse(src({ verifiedAt: '2026-13-40' })).success).toBe(false);
  });

  it('rejects an unknown sourceType', () => {
    expect(FieldSourceSchema.safeParse(src({ sourceType: 'blog' })).success).toBe(false);
  });
});

describe('ResearchScoreSchema', () => {
  it('rejects an audited score above 10', () => {
    const bad = { ...auditedInput(), score: 11 };
    expect(ResearchScoreSchema.safeParse({ ...bad, status: 'audited' }).success).toBe(false);
  });

  it('unavailable must carry empty subScores and fieldSources', () => {
    const ok = ResearchScoreSchema.safeParse({
      status: 'unavailable',
      score: null,
      subScores: {},
      methodologyVersion: null,
      dataVerifiedAt: null,
      confidence: null,
      confidenceReason: null,
      fieldSources: {},
    });
    expect(ok.success).toBe(true);
    const bad = ResearchScoreSchema.safeParse({
      status: 'unavailable',
      score: null,
      subScores: { pricing: 9 }, // must be empty
      methodologyVersion: null,
      dataVerifiedAt: null,
      confidence: null,
      confidenceReason: null,
      fieldSources: {},
    });
    expect(bad.success).toBe(false);
  });
});

describe('deriveResearchScore — audited path', () => {
  it('keeps a fully-backed record audited with score + rankable data', () => {
    const r = deriveResearchScore(auditedInput(), REQUIRED);
    expect(r.status).toBe('audited');
    if (r.status === 'audited') {
      expect(r.score).toBe(9.1);
      expect(r.confidence).toBe('high');
      expect(Object.keys(r.fieldSources)).toEqual(expect.arrayContaining([...REQUIRED]));
    }
  });
});

describe('deriveResearchScore — degradation is deterministic', () => {
  it('degrades to provisional when one required field-source is missing', () => {
    const sources = fullSources();
    delete sources.tradingview;
    const r = deriveResearchScore(auditedInput({ fieldSources: sources }), REQUIRED);
    expect(r.status).toBe('provisional');
  });

  it('degrades to provisional when a required field-source is invalid (dropped)', () => {
    const sources = fullSources();
    sources.minDeposit = src({ sourceUrl: 'http://insecure.example' });
    const r = deriveResearchScore(auditedInput({ fieldSources: sources }), REQUIRED);
    expect(r.status).toBe('provisional');
  });

  it('degrades to provisional when researchStatus is not "audited"', () => {
    const r = deriveResearchScore(auditedInput({ researchStatus: 'provisional' }), REQUIRED);
    expect(r.status).toBe('provisional');
  });

  it('degrades to provisional when confidenceReason is missing', () => {
    const r = deriveResearchScore(auditedInput({ confidenceReason: null }), REQUIRED);
    expect(r.status).toBe('provisional');
  });

  it('degrades to provisional when methodologyVersion is missing', () => {
    const r = deriveResearchScore(auditedInput({ methodologyVersion: '' }), REQUIRED);
    expect(r.status).toBe('provisional');
  });

  it('degrades to unavailable when the score is out of range', () => {
    expect(deriveResearchScore(auditedInput({ score: 11 }), REQUIRED).status).toBe('unavailable');
  });

  it('degrades to unavailable when the score is null / NaN', () => {
    expect(deriveResearchScore(auditedInput({ score: null }), REQUIRED).status).toBe('unavailable');
    expect(deriveResearchScore(auditedInput({ score: Number.NaN }), REQUIRED).status).toBe('unavailable');
  });

  it('editorial research_status="unavailable" hard-suppresses even with a valid score', () => {
    const r = deriveResearchScore(auditedInput({ researchStatus: 'unavailable' }), REQUIRED);
    expect(r.status).toBe('unavailable');
    expect(r.score).toBeNull();
  });

  it('degrades to provisional when methodologyVersion is whitespace-only', () => {
    expect(deriveResearchScore(auditedInput({ methodologyVersion: '   ' }), REQUIRED).status).toBe(
      'provisional',
    );
  });

  it('degrades to provisional when confidenceReason is whitespace-only', () => {
    expect(deriveResearchScore(auditedInput({ confidenceReason: '   ' }), REQUIRED).status).toBe(
      'provisional',
    );
  });

  it('is deterministic — identical input yields identical status', () => {
    const input = auditedInput({ researchStatus: 'provisional' });
    const a = deriveResearchScore(input, REQUIRED);
    const b = deriveResearchScore(input, REQUIRED);
    expect(a).toEqual(b);
  });
});

describe('makeResearchScoreSchema — topic-aware completeness', () => {
  const auditedObj = (sources: Record<string, ReturnType<typeof src>>) => ({
    status: 'audited' as const,
    score: 9,
    subScores: { pricing: 9 },
    methodologyVersion: 'trading-platforms-v1',
    dataVerifiedAt: '2026-07-03',
    confidence: 'high' as const,
    confidenceReason: 'verified',
    fieldSources: sources,
  });

  it('accepts an audited record with a source for every required key', () => {
    expect(makeResearchScoreSchema(REQUIRED).safeParse(auditedObj(fullSources())).success).toBe(true);
  });

  it('rejects an audited record missing a required field-source', () => {
    const partial = fullSources();
    delete partial.extendedHours;
    expect(makeResearchScoreSchema(REQUIRED).safeParse(auditedObj(partial)).success).toBe(false);
  });

  it('shape-only ResearchScoreSchema still accepts the incomplete audited record (documents the distinction)', () => {
    const partial = fullSources();
    delete partial.extendedHours;
    expect(ResearchScoreSchema.safeParse(auditedObj(partial)).success).toBe(true);
  });

  it('never throws and always returns a validated union member', () => {
    const weird: ResearchScoreInput = {
      researchStatus: 'audited',
      score: 8,
      subScores: { pricing: 999, ok: 7 }, // 999 dropped as invalid
      methodologyVersion: 'v1',
      dataVerifiedAt: '2026-07-03',
      confidence: 'medium',
      confidenceReason: 'partial',
      fieldSources: { optionsFee: src(), junk: { nope: true } },
    };
    const r = deriveResearchScore(weird, REQUIRED);
    // missing minDeposit/extendedHours/tradingview sources → provisional
    expect(r.status).toBe('provisional');
    expect(ResearchScoreSchema.safeParse(r).success).toBe(true);
    if (r.status === 'provisional') {
      expect(r.subScores).toEqual({ ok: 7 }); // 999 sanitized out
    }
  });
});
