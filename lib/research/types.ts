// lib/research/types.ts
// Research Library — honest BEST-X data contract, the single external
// validation boundary (Zod), and the deterministic degradation core.
//
// `deriveResearchScore` is the correctness-critical heart and the ONLY
// sanctioned way to construct an `audited` record from raw data. It turns the
// raw, possibly-incomplete provenance carried on a ProductForComparison into a
// discriminated ResearchScore. A record that does not fully satisfy the
// `audited` invariants is DEGRADED — never dropped — so the Cockpit that reads
// the same product_attributes rows is never affected:
//   • editorial `research_status = 'unavailable'` → 'unavailable' (hard-suppress)
//   • no usable 0–10 score                        → 'unavailable' (no score, no rank)
//   • score present but an invariant or a
//     required Tier-1 field-source missing         → 'provisional' (facts only, no rank)
//   • editorial `research_status = 'audited'` +
//     all invariants + every required field-source → 'audited' (score + rank)
//
// `research_status` acts as an editorial CEILING (degrade-only): the adapter can
// lower the status when data is incomplete, never raise it above the editor's
// intent. `audited` therefore requires explicit editorial opt-in AND complete data.
//
// The shared FieldSource type lives in @/lib/comparison/types so the Comparison
// core (DecisionBridge) and this Discovery module share ONE provenance
// vocabulary. Zod is the ONLY runtime validation used here.

import { z } from 'zod';
import type { FieldSource, ConfidenceLevel } from '@/lib/comparison/types';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const isIsoDate = (v: string): boolean => ISO_DATE.test(v) && !Number.isNaN(Date.parse(v));
const isHttpsUrl = (v: string): boolean => {
  try {
    return new URL(v).protocol === 'https:';
  } catch {
    return false;
  }
};

// ── Zod: the single external validation boundary ──────────────────────────

/** Runtime schema for one Tier-1 fact's provenance. Annotated to the shared
 *  FieldSource type so schema and type can never drift. */
export const FieldSourceSchema: z.ZodType<FieldSource> = z.object({
  sourceUrl: z.string().refine(isHttpsUrl, 'sourceUrl must be an HTTPS URL'),
  sourceType: z.enum(['official', 'regulator', 'editorial', 'user_reviews']),
  verifiedAt: z.string().refine(isIsoDate, 'verifiedAt must be an ISO date (YYYY-MM-DD)'),
});

const scoreValue = z.number().min(0).max(10); // finite 0–10 (NaN / Infinity fail min/max)
const subScoresSchema = z.record(z.string(), scoreValue);
const confidenceSchema = z.enum(['high', 'medium', 'low']);
const fieldSourcesSchema = z.record(z.string(), FieldSourceSchema);
// .trim() so whitespace-only text can never back a prominent audited score.
const requiredText = z.string().trim().min(1);

const AuditedSchema = z.object({
  status: z.literal('audited'),
  score: scoreValue,
  subScores: subScoresSchema,
  methodologyVersion: requiredText,
  dataVerifiedAt: z.string().refine(isIsoDate),
  confidence: confidenceSchema,
  confidenceReason: requiredText,
  fieldSources: fieldSourcesSchema,
});

const ProvisionalSchema = z.object({
  status: z.literal('provisional'),
  score: scoreValue.nullable(),
  subScores: subScoresSchema,
  methodologyVersion: requiredText.nullable(),
  dataVerifiedAt: z.string().refine(isIsoDate).nullable(),
  confidence: confidenceSchema.nullable(),
  confidenceReason: requiredText.nullable(),
  fieldSources: fieldSourcesSchema,
});

const UnavailableSchema = z.object({
  status: z.literal('unavailable'),
  score: z.null(),
  subScores: z.record(z.string(), z.never()),
  methodologyVersion: z.null(),
  dataVerifiedAt: z.null(),
  confidence: z.null(),
  confidenceReason: z.null(),
  fieldSources: z.record(z.string(), z.never()),
});

/**
 * SHAPE-only contract. Validates that an object is a structurally valid
 * ResearchScore, but CANNOT enforce the topic-specific "every visible Tier-1
 * fact carries a source" invariant — it does not know the required keys.
 * Use `makeResearchScoreSchema(requiredFieldKeys)` when that guarantee is
 * needed, and treat `deriveResearchScore` as the ONLY sanctioned constructor
 * of an `audited` record.
 */
export const ResearchScoreSchema = z.discriminatedUnion('status', [
  AuditedSchema,
  ProvisionalSchema,
  UnavailableSchema,
]);

export type ResearchScore = z.infer<typeof ResearchScoreSchema>;
export type AuditedResearchScore = z.infer<typeof AuditedSchema>;
export type ProvisionalResearchScore = z.infer<typeof ProvisionalSchema>;
export type UnavailableResearchScore = z.infer<typeof UnavailableSchema>;

/**
 * TOPIC-AWARE contract: the shape schema PLUS the honesty invariant that an
 * `audited` record carries a field-source for every required Tier-1 fact key.
 * This is the schema-level enforcement the plan (§4) calls for; `ResearchScore`
 * alone cannot express it because the required keys are per-topic.
 */
export function makeResearchScoreSchema(requiredFieldKeys: readonly string[]) {
  return ResearchScoreSchema.superRefine((val, ctx) => {
    if (val.status !== 'audited') return;
    for (const k of requiredFieldKeys) {
      if (val.fieldSources[k] === undefined) {
        ctx.addIssue({
          code: 'custom',
          message: `audited record is missing a field-source for required key "${k}"`,
          path: ['fieldSources', k],
        });
      }
    }
  });
}

// ── Deterministic degradation ─────────────────────────────────────────────

/** Raw, nullable provenance as carried on a ProductForComparison (whatever the
 *  DB has populated so far). */
export interface ResearchScoreInput {
  researchStatus?: string | null;
  score?: number | null;
  subScores?: Record<string, number> | null;
  methodologyVersion?: string | null;
  dataVerifiedAt?: string | null;
  confidence?: string | null;
  confidenceReason?: string | null;
  fieldSources?: Record<string, unknown> | null;
}

const UNAVAILABLE: UnavailableResearchScore = {
  status: 'unavailable',
  score: null,
  subScores: {},
  methodologyVersion: null,
  dataVerifiedAt: null,
  confidence: null,
  confidenceReason: null,
  fieldSources: {},
};

/** Keep only finite 0–10 sub-scores; drop anything invalid. Deterministic. */
function sanitizeSubScores(raw: Record<string, number> | null | undefined): Record<string, number> {
  const out: Record<string, number> = {};
  if (raw && typeof raw === 'object') {
    for (const [k, v] of Object.entries(raw)) {
      if (typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 10) out[k] = v;
    }
  }
  return out;
}

/** Keep only entries whose value passes FieldSourceSchema; drop the rest. */
function sanitizeFieldSources(
  raw: Record<string, unknown> | null | undefined,
): Record<string, FieldSource> {
  const out: Record<string, FieldSource> = {};
  if (raw && typeof raw === 'object') {
    for (const [k, v] of Object.entries(raw)) {
      const parsed = FieldSourceSchema.safeParse(v);
      if (parsed.success) out[k] = parsed.data;
    }
  }
  return out;
}

const trimmedOrNull = (v: string | null | undefined): string | null =>
  typeof v === 'string' && v.trim().length > 0 ? v.trim() : null;

/**
 * Turn raw DB-sourced provenance into a validated, discriminated ResearchScore.
 * Pure + deterministic: the same input always yields the same status. Never
 * throws and never returns null — on any problem it fails closed by degrading.
 *
 * @param requiredFieldKeys The topic's visible Tier-1 fact keys (TopicConfig
 *   specColumn keys); every one must carry a valid field-source for `audited`.
 */
export function deriveResearchScore(
  input: ResearchScoreInput,
  requiredFieldKeys: readonly string[],
): ResearchScore {
  // Editorial hard-suppress: an explicit `unavailable` intent wins over any
  // data present — the editor has said this row has no usable score to show.
  if (input.researchStatus === 'unavailable') return UNAVAILABLE;

  const score =
    typeof input.score === 'number' &&
    Number.isFinite(input.score) &&
    input.score >= 0 &&
    input.score <= 10
      ? input.score
      : null;

  // No usable 0–10 score → nothing can be shown honestly.
  if (score === null) return UNAVAILABLE;

  const subScores = sanitizeSubScores(input.subScores);
  const fieldSources = sanitizeFieldSources(input.fieldSources);

  const confidence: ConfidenceLevel | null =
    input.confidence === 'high' || input.confidence === 'medium' || input.confidence === 'low'
      ? input.confidence
      : null;
  const methodologyVersion = trimmedOrNull(input.methodologyVersion);
  const dataVerifiedAt =
    typeof input.dataVerifiedAt === 'string' && isIsoDate(input.dataVerifiedAt)
      ? input.dataVerifiedAt
      : null;
  const confidenceReason = trimmedOrNull(input.confidenceReason);

  const everyRequiredSourced =
    requiredFieldKeys.length > 0 && requiredFieldKeys.every((k) => fieldSources[k] !== undefined);

  // Narrowing note: the `!== null` checks below let TS treat each local as
  // non-null inside the block, so the audited literal needs no `!` assertions.
  if (
    input.researchStatus === 'audited' &&
    methodologyVersion !== null &&
    dataVerifiedAt !== null &&
    confidence !== null &&
    confidenceReason !== null &&
    everyRequiredSourced
  ) {
    const audited: AuditedResearchScore = {
      status: 'audited',
      score,
      subScores,
      methodologyVersion,
      dataVerifiedAt,
      confidence,
      confidenceReason,
      fieldSources,
    };
    // Defense-in-depth: the topic-aware schema re-checks shape + field-source
    // completeness. If anything is off, present it honestly as provisional.
    const parsed = makeResearchScoreSchema(requiredFieldKeys).safeParse(audited);
    if (parsed.success) return parsed.data;
  }

  const provisional: ProvisionalResearchScore = {
    status: 'provisional',
    score,
    subScores,
    methodologyVersion,
    dataVerifiedAt,
    confidence,
    confidenceReason,
    fieldSources,
  };
  const parsed = ProvisionalSchema.safeParse(provisional);
  return parsed.success ? parsed.data : UNAVAILABLE;
}
