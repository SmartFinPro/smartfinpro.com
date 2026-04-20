// Tool: get_content_health (read-only)
// Reads content_health_scores rows sorted worst-first (health_score ASC).
// Does NOT re-compute scores (that's the autonomous-system cron's job);
// returns what's already persisted.

import { getServiceClient } from '../lib/supabase.js';
import { withAudit } from '../lib/audit.js';
import { GetContentHealthInput, formatZodError } from '../lib/validation.js';
import type { ContentHealthPage } from '../types.js';

export const TOOL_NAME = 'get_content_health';

export const TOOL_DESCRIPTION =
  'Read persisted content_health_scores rows. Sorted worst-first (lowest health_score). ' +
  'Does NOT re-compute. Filter by market, category, min/max score. Read-only.';

export const TOOL_INPUT_SCHEMA = GetContentHealthInput;

interface Result {
  pages: ContentHealthPage[];
  count: number;
  filters_applied: {
    market?: string;
    category?: string;
    min_score?: number;
    max_score?: number;
    limit: number;
  };
}

export const handle = withAudit(
  TOOL_NAME,
  async (rawArgs: unknown): Promise<Result> => {
    const parsed = GetContentHealthInput.safeParse(rawArgs);
    if (!parsed.success) throw new Error(formatZodError(parsed.error));
    const args = parsed.data;

    const supabase = getServiceClient();
    let q = supabase
      .from('content_health_scores')
      .select(
        'slug, market, category, health_score, monthly_revenue, monthly_clicks, epc, computed_at',
        { count: 'exact' },
      )
      .order('health_score', { ascending: true, nullsFirst: true })
      .limit(args.limit);

    if (args.market) q = q.eq('market', args.market);
    if (args.category) q = q.eq('category', args.category);
    if (typeof args.min_score === 'number') q = q.gte('health_score', args.min_score);
    if (typeof args.max_score === 'number') q = q.lte('health_score', args.max_score);

    const { data, error, count } = await q;
    if (error) throw new Error(`supabase: ${error.message}`);

    return {
      pages: (data ?? []) as ContentHealthPage[],
      count: count ?? 0,
      filters_applied: {
        ...(args.market && { market: args.market }),
        ...(args.category && { category: args.category }),
        ...(typeof args.min_score === 'number' && { min_score: args.min_score }),
        ...(typeof args.max_score === 'number' && { max_score: args.max_score }),
        limit: args.limit,
      },
    };
  },
);
