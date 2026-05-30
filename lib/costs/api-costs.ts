// lib/costs/api-costs.ts
// API cost recorder + aggregator — tracks what we SPEND on external APIs.
//
// recordApiCost() is fire-and-forget: it NEVER throws and never blocks the
// caller. Mirrors recordNotification() (lib/notifications.ts) — failures are
// logged to stdout only, so a broken DB connection can't break an API call
// that already succeeded.
//
// Pricing constants are public list prices in USD. Anthropic is billed per
// 1M tokens (separate input/output rates); Serper/Resend are per-unit.
//
// Usage:
//   import { recordApiCost } from '@/lib/costs/api-costs';
//   await recordApiCost({ provider: 'anthropic', operation: 'messages.create',
//     model, inputTokens, outputTokens, source: 'genesis' });

import 'server-only';

// ── Pricing constants (USD) ────────────────────────────────────────────────

// Anthropic — $ per 1,000,000 tokens, keyed by a model-name substring.
// Current public Claude pricing (matched longest-substring-first via order).
interface ModelPrice {
  /** $ per 1M input tokens */
  input: number;
  /** $ per 1M output tokens */
  output: number;
}

export const ANTHROPIC_PRICING: { match: string; price: ModelPrice }[] = [
  { match: 'opus', price: { input: 15, output: 75 } },
  { match: 'haiku', price: { input: 0.8, output: 4 } },
  { match: 'sonnet', price: { input: 3, output: 15 } },
];

// Sane default if the model name matches nothing above (assume Sonnet-tier).
export const ANTHROPIC_DEFAULT_PRICE: ModelPrice = { input: 3, output: 15 };

// Serper — ~$0.001 per search (credit pricing).
export const SERPER_COST_PER_SEARCH = 0.001;

// Resend — ~$0.0004 per email (≈ $20 / 50k emails).
export const RESEND_COST_PER_EMAIL = 0.0004;

// TODO(cost): instrument remaining serper call-sites (7 other call-sites beyond
// lib/actions/ranking.ts + lib/actions/competitors.ts are intentionally left
// uninstrumented to keep recorded volume bounded to scheduled paths).

// ── Types ───────────────────────────────────────────────────────────────────

export type ApiCostProvider = 'anthropic' | 'serper' | 'resend';

export interface RecordApiCostInput {
  provider: ApiCostProvider;
  operation: string;
  model?: string;
  inputTokens?: number;
  outputTokens?: number;
  units?: number;
  costUsd?: number;
  source?: string;
  metadata?: Record<string, unknown>;
}

export interface ApiCostSummary {
  totalUsd: number;
  events: number;
  byProvider: { provider: string; costUsd: number; events: number }[];
  byDay: { date: string; costUsd: number }[];
}

// ── Pricing helpers ───────────────────────────────────────────────────────

function priceForModel(model: string | undefined): ModelPrice {
  if (!model) return ANTHROPIC_DEFAULT_PRICE;
  const lower = model.toLowerCase();
  for (const { match, price } of ANTHROPIC_PRICING) {
    if (lower.includes(match)) return price;
  }
  return ANTHROPIC_DEFAULT_PRICE;
}

/** Compute USD cost for an Anthropic call from token usage. */
export function computeAnthropicCost(
  model: string | undefined,
  inputTokens = 0,
  outputTokens = 0,
): number {
  const price = priceForModel(model);
  return (inputTokens / 1_000_000) * price.input + (outputTokens / 1_000_000) * price.output;
}

function deriveCostUsd(input: RecordApiCostInput): number {
  if (typeof input.costUsd === 'number' && Number.isFinite(input.costUsd)) {
    return input.costUsd;
  }
  switch (input.provider) {
    case 'anthropic':
      return computeAnthropicCost(input.model, input.inputTokens, input.outputTokens);
    case 'serper':
      return (input.units ?? 0) * SERPER_COST_PER_SEARCH;
    case 'resend':
      return (input.units ?? 0) * RESEND_COST_PER_EMAIL;
    default:
      return 0;
  }
}

function formatErr(err: unknown): string {
  if (err instanceof Error) return err.message;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

// ── Producer ────────────────────────────────────────────────────────────────

/**
 * Insert an api_cost_events row. NEVER throws — cost recording must not break
 * the caller (the API call already succeeded). Returns `true` if the row was
 * persisted, `false` otherwise (DB error, table not yet migrated, connection
 * failure). If `costUsd` is not provided it is computed from tokens×pricing
 * (anthropic) or units×per-unit (serper/resend).
 */
export async function recordApiCost(input: RecordApiCostInput): Promise<boolean> {
  try {
    const costUsd = deriveCostUsd(input);

    const { createServiceClient } = await import('@/lib/supabase/server');
    const supabase = createServiceClient();

    const { error } = await supabase.from('api_cost_events').insert({
      provider: input.provider,
      operation: input.operation,
      model: input.model ?? null,
      input_tokens: input.inputTokens ?? null,
      output_tokens: input.outputTokens ?? null,
      units: input.units ?? null,
      cost_usd: costUsd,
      source: input.source ?? null,
      metadata: input.metadata ?? {},
    });

    if (error) {
      console.error(JSON.stringify({
        level: 'error',
        ts: new Date().toISOString(),
        msg: '[recordApiCost] insert failed',
        error: error.message,
        provider: input.provider,
      }));
      return false;
    }
    return true;
  } catch (err) {
    // Never throw — cost recording must not break the caller.
    console.error(JSON.stringify({
      level: 'error',
      ts: new Date().toISOString(),
      msg: '[recordApiCost] unexpected failure',
      error: formatErr(err),
    }));
    return false;
  }
}

// ── Aggregator ────────────────────────────────────────────────────────────

interface ApiCostRow {
  provider: string;
  cost_usd: number | string | null;
  created_at: string;
}

/**
 * Aggregate api_cost_events over the last `days`. Graceful: returns zeros if
 * the table is missing / not yet migrated or any query fails.
 */
export async function getApiCostSummary(opts: { days: number }): Promise<ApiCostSummary> {
  const empty: ApiCostSummary = { totalUsd: 0, events: 0, byProvider: [], byDay: [] };
  try {
    const since = new Date(Date.now() - opts.days * 24 * 60 * 60 * 1000);

    const { createServiceClient } = await import('@/lib/supabase/server');
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('api_cost_events')
      .select('provider, cost_usd, created_at')
      .gte('created_at', since.toISOString());

    if (error || !data) return empty;

    const rows = data as ApiCostRow[];

    let totalUsd = 0;
    const providerMap = new Map<string, { costUsd: number; events: number }>();
    const dayMap = new Map<string, number>();

    for (const row of rows) {
      const cost = Number(row.cost_usd) || 0;
      totalUsd += cost;

      const p = providerMap.get(row.provider) || { costUsd: 0, events: 0 };
      p.costUsd += cost;
      p.events += 1;
      providerMap.set(row.provider, p);

      const day = row.created_at.slice(0, 10);
      dayMap.set(day, (dayMap.get(day) || 0) + cost);
    }

    const byProvider = Array.from(providerMap.entries())
      .map(([provider, v]) => ({
        provider,
        costUsd: parseFloat(v.costUsd.toFixed(6)),
        events: v.events,
      }))
      .sort((a, b) => b.costUsd - a.costUsd);

    const byDay = Array.from(dayMap.entries())
      .map(([date, costUsd]) => ({ date, costUsd: parseFloat(costUsd.toFixed(6)) }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalUsd: parseFloat(totalUsd.toFixed(6)),
      events: rows.length,
      byProvider,
      byDay,
    };
  } catch {
    return empty;
  }
}
