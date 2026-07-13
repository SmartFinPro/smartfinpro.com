// lib/decision/types.ts
// DecisionStateV1 — the shared, session-scoped decision state (Passport seed).
// sessionStorage ONLY in v1 (privacy default; localStorage opt-in is Phase 6).
// The cockpit NEVER reads this store (one-way bridge, CI-greped).

import { z } from 'zod';
import type { ToolMarket } from '@/lib/tools/registry/types';

export const DECISION_STORAGE_KEY = 'sfp_decision_v1';

const MarketSchema = z.enum(['us', 'uk', 'ca', 'au']);

export const DecisionStateSchema = z
  .object({
    v: z.literal(1),
    updatedAt: z.string(),
    broker: z
      .object({
        market: MarketSchema,
        quizAnswers: z.record(z.string(), z.string()),
        profile: z.object({
          experience: z.string().max(40),
          instruments: z.array(z.string().max(40)).max(10),
          tradesPerMonth: z.number().finite(),
          avgTradeSize: z.number().finite(),
          priorities: z.array(z.string().max(40)).max(10),
        }),
        shortlistSlugs: z.array(z.string().max(200)).max(10),
        costInputs: z.record(z.string(), z.number().finite()).optional(),
      })
      .optional(),
    horizon: z.object({ inputs: z.record(z.string(), z.unknown()) }).optional(),
    home: z
      .object({ market: MarketSchema, inputs: z.record(z.string(), z.number().finite()) })
      .optional(),
  })
  .strict();

export type DecisionStateV1 = z.infer<typeof DecisionStateSchema>;
export type DecisionMarket = ToolMarket;
