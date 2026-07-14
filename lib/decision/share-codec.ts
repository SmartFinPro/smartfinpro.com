// lib/decision/share-codec.ts
//
// Entsteht vorgezogen aus PR 2.3 (4.4 wurde per User-Entscheidung vor 2.2/2.3
// gezogen); 2.3 verdrahtet später share-result.tsx (components/tools/shell/
// share-result.tsx, PR 2.1's UI hull) + die debt-payoff-Allowlist.
//
// Fragment-Share-Codec (SPEC 8.7, docs/superpowers/specs/2026-07-12-
// financial-decision-lab-design.md §8.7) — pure lib, no React/DOM. Format:
// `{path}#s=base64url(JSON)` — NEVER a query parameter (fragments never
// leave the browser: no server logs, no Referrer header, canonical stays
// clean).
//
// PRIVACY CONTRACT (bindend, Opus-Review-Gate):
// - Only keys declared in the SOURCE tool's registry `shareableFields`
//   allowlist (lib/tools/registry/registry.ts) can ever appear in the
//   payload — every other key is silently dropped, never surfaced as an
//   error.
// - Raw amounts NEVER travel in the payload. By convention every bucketed
//   field name ends in `Band` and must carry a pre-bucketed STRING label in
//   the shape lib/analytics/tool-events.ts's toInputBucket()/edgeBucket()
//   produces (`"1000-2500"` / `"lt100"` / `"gte1000000"`). A NUMBER found
//   under a `*Band` key is treated as a contract violation and the field is
//   DROPPED (never rounded-and-kept) — the caller must bucket via
//   toInputBucket() before calling encodeShare().
// - Non-Band fields (e.g. `retireAge`, `withdrawalRatePct`, `scenario`,
//   `strategy`, `taxBand`) are coarse/discrete by nature — never "exact
//   amounts you typed" — and are allowed as exact values, but still clamped
//   to a plausible range/shape and rounded to a safe precision as
//   defense-in-depth against a mis-wired caller.
// - Any failure anywhere (unknown tool, empty allowlist, empty result after
//   filtering, >1500 chars, JSON/base64 errors, corrupt/foreign-versioned
//   fragment) returns null — callers render the 'example'/'your result'
//   state, never a broken link or a thrown error.

import { z } from 'zod';
import { getTool, TOOL_ID_VALUES } from '@/lib/tools/registry';
import type { ToolId } from '@/lib/tools/registry/types';

export interface SharePayload {
  v: 1;
  t: ToolId;
  i: Record<string, number | string>;
}

/** Cap on the ENCODED fragment string (after base64url) — SPEC 8.7 "~1500 chars". */
export const SHARE_FRAGMENT_MAX_LENGTH = 1500;

/** Matches lib/analytics/tool-events.ts's edgeBucket() output shapes exactly. */
const BAND_VALUE_RE = /^(lt\d+(\.\d+)?|gte\d+(\.\d+)?|\d+(\.\d+)?-\d+(\.\d+)?|invalid)$/;

/** Safe bounds for common non-Band numeric field names across tools (SPEC
 *  8.7) — these are coarse/discrete by nature, never "exact amounts you
 *  typed". Anything not listed falls back to DEFAULT_NUMERIC_CLAMP. */
const NUMERIC_FIELD_CLAMPS: Record<string, { min: number; max: number; decimals: number }> = {
  retireAge: { min: 40, max: 85, decimals: 0 },
  currentAge: { min: 16, max: 100, decimals: 0 },
  withdrawalRatePct: { min: 1, max: 10, decimals: 1 },
  termYears: { min: 1, max: 40, decimals: 0 },
  timeHorizon: { min: 1, max: 40, decimals: 0 },
};
const DEFAULT_NUMERIC_CLAMP = { min: -1_000_000, max: 1_000_000, decimals: 2 };
const MAX_STRING_FIELD_LENGTH = 40;

function isBandKey(key: string): boolean {
  return key.endsWith('Band');
}

function base64UrlEncode(input: string): string {
  const base64 =
    typeof window === 'undefined'
      ? Buffer.from(input, 'utf-8').toString('base64')
      : btoa(unescape(encodeURIComponent(input)));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(input: string): string | null {
  try {
    const padded = input.replace(/-/g, '+').replace(/_/g, '/');
    const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
    const base64 = padded + pad;
    return typeof window === 'undefined'
      ? Buffer.from(base64, 'base64').toString('utf-8')
      : decodeURIComponent(escape(atob(base64)));
  } catch {
    return null;
  }
}

/** Sanitizes ONE field value (shared by encode + decode). Returns null if the
 *  field must be dropped (bad shape / privacy violation / out-of-shape). */
function sanitizeFieldValue(key: string, value: number | string): number | string | null {
  if (isBandKey(key)) {
    if (typeof value !== 'string' || !BAND_VALUE_RE.test(value)) return null;
    return value;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed || trimmed.length > MAX_STRING_FIELD_LENGTH) return null;
    return trimmed;
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return null;
    const clamp = NUMERIC_FIELD_CLAMPS[key] ?? DEFAULT_NUMERIC_CLAMP;
    const bounded = Math.min(clamp.max, Math.max(clamp.min, value));
    const factor = 10 ** clamp.decimals;
    return Math.round(bounded * factor) / factor;
  }
  return null;
}

/** Filters against the source tool's shareableFields allowlist, buckets/
 *  rounds values, enforces the ~1500-char cap. Returns null on ANY failure. */
export function encodeShare(toolId: ToolId, fields: Record<string, number | string>): string | null {
  try {
    const tool = getTool(toolId);
    const allow = tool?.shareableFields;
    if (!allow || allow.length === 0) return null;

    const filtered: Record<string, number | string> = {};
    for (const key of allow) {
      if (!Object.prototype.hasOwnProperty.call(fields, key)) continue;
      const safe = sanitizeFieldValue(key, fields[key]);
      if (safe === null) continue;
      filtered[key] = safe;
    }
    if (Object.keys(filtered).length === 0) return null;

    const payload: SharePayload = { v: 1, t: toolId, i: filtered };
    const encoded = base64UrlEncode(JSON.stringify(payload));
    if (encoded.length === 0 || encoded.length > SHARE_FRAGMENT_MAX_LENGTH) return null;
    return encoded;
  } catch {
    return null;
  }
}

const ShareEnvelopeSchema = z
  .object({
    v: z.literal(1),
    t: z.enum(TOOL_ID_VALUES),
    i: z.record(z.string(), z.union([z.number(), z.string()])),
  })
  .strict();

/** zod-validates the envelope shape + version + known ToolId, then filters
 *  every field against the tool's OWN shareableFields allowlist and clamps
 *  it to a plausible range (same policy as encodeShare). null on ANY
 *  failure — corrupt base64/JSON, wrong version, unknown tool, or an empty
 *  result after filtering. */
export function decodeShare(fragment: string): SharePayload | null {
  try {
    if (!fragment || fragment.length > SHARE_FRAGMENT_MAX_LENGTH) return null;
    const json = base64UrlDecode(fragment);
    if (!json) return null;

    const parsed = ShareEnvelopeSchema.safeParse(JSON.parse(json));
    if (!parsed.success) return null;
    const { t: toolId, i: rawFields } = parsed.data;

    const tool = getTool(toolId);
    const allow = tool?.shareableFields;
    if (!allow || allow.length === 0) return null;

    const cleaned: Record<string, number | string> = {};
    for (const key of allow) {
      const v = rawFields[key];
      if (v === undefined) continue;
      const safe = sanitizeFieldValue(key, v);
      if (safe === null) continue;
      cleaned[key] = safe;
    }
    if (Object.keys(cleaned).length === 0) return null;

    return { v: 1, t: toolId, i: cleaned };
  } catch {
    return null;
  }
}

/** `${origin}${path}#s=${encoded}` — NEVER a query parameter (SPEC 8.7). Pass
 *  origin='' for a purely relative, environment-agnostic link. */
export function buildShareUrl(origin: string, path: string, encoded: string): string {
  return `${origin}${path}#s=${encoded}`;
}

const FIELD_LABELS: Record<string, string> = {
  ageBand: 'age range',
  currentAgeBand: 'age range',
  balanceBand: 'savings range',
  contributionBand: 'contribution range',
  feeBand: 'fee level',
  debtCountBand: 'debt count',
  totalDebtBand: 'debt range',
  extraPaymentBand: 'extra payment range',
  incomeBand: 'income range',
  retireAge: 'retirement age',
  withdrawalRatePct: 'withdrawal rate',
  scenario: 'selected scenario',
  strategy: 'payoff strategy',
  taxBand: 'tax band',
};

function labelFor(key: string): string {
  return FIELD_LABELS[key] ?? key.replace(/Band$/, '').replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();
}

/** Human-readable preview sentence for the ShareResult UI, e.g. "This link
 *  includes: age range, savings range and contribution range. It never
 *  includes exact amounts you typed." */
export function humanFieldList(toolId: ToolId, payload: SharePayload): string {
  void toolId; // reserved for future per-tool copy variants; payload.i is the source of truth today
  const keys = Object.keys(payload.i);
  if (keys.length === 0) return 'This link includes: no identifying details.';
  const labels = keys.map(labelFor);
  const joined = labels.length === 1 ? labels[0] : `${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}`;
  return `This link includes: ${joined}. It never includes exact amounts you typed.`;
}
