// lib/reviews/verdict-frontmatter.ts — V2 review verdict-frontmatter Zod schema
// ============================================================
// T5 (2026-07-18 review-redesign V2 foundation, plan "Technische Härtung"
// point 3): the Betreiber-Konzept's §30.1 word-length rules ("summary must
// be 70-120 words", etc.) used to be editorial guidance enforced only by a
// human reading the diff. Encoded here as Zod refinements instead, so a
// violation fails `npx vitest run`, not a review.
//
// normalizeVerdictFrontmatter() NEVER throws during the build — Next.js
// content loading (lib/mdx/index.ts) must not crash on a malformed MDX
// frontmatter block. It always returns { ok: true, data } or
// { ok: false, issues }; a later quality-gate/validator task consumes
// `issues` (see the parent plan's Skalierung section,
// `scripts/validate-review-v2.ts`) — this module does not fail the build
// by itself.
//
// Word counting: reuses the exact `countWords()` implementation from
// scripts/lib/rendered-word-count.mjs (exported there for this purpose in
// this same commit) rather than duplicating the whitespace-token logic in
// TypeScript. Direct ESM import of a .mjs file from a .ts file works
// out of the box here — this project's tsconfig has `allowJs: true` +
// `moduleResolution: "bundler"`, so `tsc --noEmit` and the Next.js webpack
// build both resolve and (via the .mjs file's JSDoc annotations) type-check
// the import without a separate .d.ts shim.
// ============================================================

import { z } from 'zod';
import { countWords } from '@/scripts/lib/rendered-word-count.mjs';
import { MDX_ANCHOR_IDS, type MdxAnchorId } from '@/lib/reviews/section-anchors';

// ── Word-count refinement helper ────────────────────────────────────────
// Single implementation backing every §30.1 length rule below (positioning,
// summary, each sectionVerdicts value, finalDecision, faq[].answer) — no
// per-field copy of the min/max comparison.
function wordCountString(min: number, max: number) {
  return z.string().superRefine((value, ctx) => {
    const count = countWords(value);
    if (count < min || count > max) {
      ctx.addIssue({
        code: 'custom',
        message: `must be ${min}-${max} words (got ${count})`,
      });
    }
  });
}

// ── verdict block ────────────────────────────────────────────────────────
const BestAlternativeSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  reason: z.string().min(1),
});

const VerdictBlockSchema = z.object({
  /** 18-30 words — one-sentence positioning ("who this is for, in one line"). */
  positioning: wordCountString(18, 30),
  /** 70-120 words — the verdict-card prose summary. */
  summary: wordCountString(70, 120),
  bestFor: z.array(z.string().min(1)).min(1).max(3),
  notFor: z.array(z.string().min(1)).min(1).max(3),
  topStrengths: z.array(z.string().min(1)).min(1).max(3),
  mainLimitation: z.string().min(1),
  bestAlternative: BestAlternativeSchema.optional(),
});

export type VerdictBlock = z.infer<typeof VerdictBlockSchema>;

// ── sectionVerdicts ──────────────────────────────────────────────────────
// Exactly the 5 mdx-owned anchor ids from section-anchors.ts are valid keys
// (`.strict()` rejects anything else, including the 2 layout-owned ids) —
// this is the "Keys gegen section-anchors.ts validiert" requirement.
const sectionVerdictsShape = Object.fromEntries(
  MDX_ANCHOR_IDS.map((id) => [id, wordCountString(15, 30).optional()])
) as Record<MdxAnchorId, z.ZodOptional<ReturnType<typeof wordCountString>>>;

const SectionVerdictsSchema = z.object(sectionVerdictsShape).strict();

export type SectionVerdicts = z.infer<typeof SectionVerdictsSchema>;

// ── essentialFacts ───────────────────────────────────────────────────────
const EssentialFactSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
  context: z.string().optional(),
  /** ISO date (YYYY-MM-DD) — Pflicht (Konzept §9.3/§29.2: asOf allein genügt nicht ohne sourceHref). */
  asOf: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'asOf must be an ISO date (YYYY-MM-DD)'),
  /** Absolute source URL — Pflicht alongside asOf. */
  sourceHref: z.string().url('sourceHref must be a valid absolute URL'),
});

/** 4-6 entries — a shorter list under-supports the verdict; a longer one dilutes it. */
const EssentialFactsSchema = z.array(EssentialFactSchema).min(4).max(6);

export type EssentialFact = z.infer<typeof EssentialFactSchema>;

// ── alternatives ─────────────────────────────────────────────────────────
const AlternativeFactSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
});

const AlternativeEntrySchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  whyInstead: z.string().min(1),
  facts: z.array(AlternativeFactSchema).optional(),
});

/** 2-3 entries per the Betreiber-Konzept's Alternatives section cap. */
const AlternativesSchema = z.array(AlternativeEntrySchema).min(2).max(3);

export type AlternativeEntry = z.infer<typeof AlternativeEntrySchema>;

// ── top-level bundle ─────────────────────────────────────────────────────
// `finalDecision` and `faq` are validated here for their §30.1 length rules
// ("falls im Block") but are intentionally NOT added to ContentMeta in this
// commit — that field list is the closed 7-field set from the plan
// (reviewLayout/verdict/essentialFacts/alternatives/updateLog/
// sectionVerdicts/dataVerifiedDate). Wiring finalDecision/faq into
// ContentMeta belongs to whichever later task builds the FinalDecision/FAQ
// V2 layout zones (T12) that actually consume them; this schema is ready
// for that once it lands. The field names (`finalDecision`, `faq` —
// singular, distinct from V1's `faqs`) match what
// scripts/lib/rendered-word-count.mjs already reads from raw MDX
// frontmatter for the T0e whole-page word-count gate.
export const VerdictFrontmatterSchema = z.object({
  verdict: VerdictBlockSchema,
  essentialFacts: EssentialFactsSchema,
  alternatives: AlternativesSchema,
  sectionVerdicts: SectionVerdictsSchema.optional(),
  /** 80-140 words, optional at the schema level — only checked when present. */
  finalDecision: wordCountString(80, 140).optional(),
  faq: z
    .array(
      z.object({
        question: z.string().min(1),
        /** 40-100 words. */
        answer: wordCountString(40, 100),
      })
    )
    .optional(),
});

export type VerdictFrontmatter = z.infer<typeof VerdictFrontmatterSchema>;

export interface VerdictFrontmatterIssue {
  /** Dot-joined Zod issue path, e.g. "essentialFacts.0.sourceHref". Root-level issues use "(root)". */
  path: string;
  message: string;
}

export type NormalizeVerdictFrontmatterResult =
  | { ok: true; data: VerdictFrontmatter }
  | { ok: false; issues: VerdictFrontmatterIssue[] };

/**
 * Validates + normalizes a V2 review's verdict-frontmatter bundle.
 *
 * Never throws — a malformed/missing block returns `{ ok: false, issues }`
 * instead of crashing MDX content loading. Callers (a later quality-gate
 * validator, per the plan's Skalierung section) decide what to do with
 * `issues`.
 */
export function normalizeVerdictFrontmatter(raw: unknown): NormalizeVerdictFrontmatterResult {
  const result = VerdictFrontmatterSchema.safeParse(raw);
  if (result.success) {
    return { ok: true, data: result.data };
  }
  const issues: VerdictFrontmatterIssue[] = result.error.issues.map((issue) => ({
    path: issue.path.length > 0 ? issue.path.join('.') : '(root)',
    message: issue.message,
  }));
  return { ok: false, issues };
}
