// lib/validation/index.ts
// Central Zod schemas + validation helper for all API routes.
// Usage:
//   const parsed = validate(MySchema, await req.json());
//   if (!parsed.ok) return parsed.error; // NextResponse 400

import { z, ZodSchema, ZodError } from 'zod';
import { NextResponse } from 'next/server';

// ── Shared constants ───────────────────────────────────────────────────────
export const VALID_MARKETS = ['us', 'uk', 'ca', 'au'] as const;
export type Market = (typeof VALID_MARKETS)[number];

export const VALID_CATEGORIES = [
  'ai-tools', 'cybersecurity', 'trading', 'forex',
  'personal-finance', 'business-banking',
] as const;

// ── Validation helper ──────────────────────────────────────────────────────
type ValidationOk<T>    = { ok: true; data: T };
type ValidationFail     = { ok: false; error: ReturnType<typeof NextResponse.json> };
type ValidationResult<T> = ValidationOk<T> | ValidationFail;

export function validate<T>(schema: ZodSchema<T>, body: unknown): ValidationResult<T> {
  const result = schema.safeParse(body);
  if (result.success) {
    return { ok: true, data: result.data };
  }
  const issues = (result.error as ZodError).issues.map((i) => ({
    field: i.path.join('.'),
    message: i.message,
  }));
  return {
    ok: false,
    error: NextResponse.json({ error: 'Validation failed', issues }, { status: 400 }),
  };
}

// ── Schemas ────────────────────────────────────────────────────────────────

/** POST /api/track */
export const TrackSchema = z.object({
  type: z.enum(['pageview', 'event', 'scroll', 'time_on_page']),
  sessionId: z.string().min(8).max(128),
  data: z.record(z.string(), z.unknown()).default({}), // Zod v4: explicit key + value types
});
export type TrackPayload = z.infer<typeof TrackSchema>;

/** POST /api/track-cta */
export const TrackCtaSchema = z.object({
  slug:     z.string().min(1).max(200).regex(/^[a-z0-9/_-]+$/, 'Invalid slug format'),
  provider: z.string().min(1).max(100),
  variant:  z.string().max(50).default('primary'),
  market:   z.enum(VALID_MARKETS).optional(),
  sessionId: z.string().max(128).optional(),
});
export type TrackCtaPayload = z.infer<typeof TrackCtaSchema>;

/** POST /api/subscribe */
export const SubscribeSchema = z.object({
  email: z
    .string()
    .email('Invalid email address')
    .max(254)
    .transform((e) => e.toLowerCase().trim()),
  leadMagnet: z.string().max(100).optional(),
  source: z.string().max(200).optional(),
  market: z.enum(VALID_MARKETS).optional(),
  country: z.string().max(2).optional(),
});
export type SubscribePayload = z.infer<typeof SubscribeSchema>;

/** POST /api/web-vitals */
export const WebVitalsSchema = z.object({
  name: z.enum(['LCP', 'INP', 'CLS', 'FCP', 'TTFB', 'FID',
                 'lcp', 'inp', 'cls', 'fcp', 'ttfb', 'fid']),
  value: z.number().finite().nonnegative(),
  id: z.string().max(500).optional(),
  page_url: z.string().max(500).optional(),
  rating: z.enum(['good', 'needs-improvement', 'poor']).optional(),
  market: z.enum(VALID_MARKETS).optional(),
  delta: z.number().finite().optional(),
  metric_id: z.string().max(64).optional(),
  navigationType: z.string().max(50).optional(),
});
export type WebVitalsPayload = z.infer<typeof WebVitalsSchema>;

/** POST /api/xray/score */
export const XRayScoreSchema = z.object({
  slug: z.string().min(1).max(200).regex(/^[a-z0-9/_-]+$/, 'Invalid slug format'),
  market: z.enum(VALID_MARKETS),
  category: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/, 'Invalid category format'),
  experience: z.enum(['beginner', 'intermediate', 'advanced']),
  teamSize: z.number().int().min(1).max(500),
  monthlyBudget: z.number().min(0).max(100000),
  priority: z.enum(['low-cost', 'features', 'ease-of-use', 'compliance']),
  hourlyValue: z.number().min(0).max(10000),
  sessionId: z.string().max(128).optional(),
});
export type XRayScorePayload = z.infer<typeof XRayScoreSchema>;

/** Market code guard for cron params */
export function assertValidMarket(market: string): market is Market {
  return (VALID_MARKETS as readonly string[]).includes(market);
}
