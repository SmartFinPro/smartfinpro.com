// Tool: get_conversion_funnel (read-only)
// Funnel stages from conversion_events (registration → kyc_submitted →
// kyc_approved → ftd → approved → reversed).
//
// rate_vs_prev_stage = count / count_of_previous_stage (stufenweise).
// First stage is rate vs total_clicks. Matches lib/actions/funnel.ts:145.

import { getServiceClient } from '../lib/supabase.js';
import { withAudit } from '../lib/audit.js';
import { GetConversionFunnelInput, formatZodError } from '../lib/validation.js';
import type { FunnelStage } from '../types.js';

export const TOOL_NAME = 'get_conversion_funnel';

export const TOOL_DESCRIPTION =
  'Conversion funnel stages (registration, kyc_submitted, kyc_approved, ftd, approved, reversed) ' +
  'with stepwise conversion rate (count / prev_stage_count). Read-only.';

export const TOOL_INPUT_SCHEMA = GetConversionFunnelInput;

const STAGE_ORDER = [
  'registration',
  'kyc_submitted',
  'kyc_approved',
  'ftd',
  'approved',
  'reversed',
] as const;

interface Result {
  total_clicks: number;
  stages: FunnelStage[];
  window_days: number;
  filters_applied: {
    slug?: string;
    market?: string;
    partner_name?: string;
  };
}

export const handle = withAudit(
  TOOL_NAME,
  async (rawArgs: unknown): Promise<Result> => {
    const parsed = GetConversionFunnelInput.safeParse(rawArgs);
    if (!parsed.success) throw new Error(formatZodError(parsed.error));
    const args = parsed.data;

    const supabase = getServiceClient();
    const sinceISO = new Date(Date.now() - args.days * 86_400_000).toISOString();

    // ── Clicks in window (denominator for stage 1) ──────────────────────
    let clickQ = supabase
      .from('link_clicks')
      .select('link_id, affiliate_links!inner (slug, market, partner_name)', {
        count: 'exact',
        head: true,
      })
      .gte('clicked_at', sinceISO);
    if (args.slug) clickQ = clickQ.eq('affiliate_links.slug', args.slug);
    if (args.market) clickQ = clickQ.eq('affiliate_links.market', args.market);
    if (args.partner_name) clickQ = clickQ.eq('affiliate_links.partner_name', args.partner_name);

    const { count: totalClicks, error: clickErr } = await clickQ;
    if (clickErr) throw new Error(`supabase clicks: ${clickErr.message}`);

    // ── Events per stage ────────────────────────────────────────────────
    let evQ = supabase
      .from('conversion_events')
      .select('event_type, link_id, affiliate_links!inner (slug, market, partner_name)')
      .gte('received_at', sinceISO);
    if (args.slug) evQ = evQ.eq('affiliate_links.slug', args.slug);
    if (args.market) evQ = evQ.eq('affiliate_links.market', args.market);
    if (args.partner_name) evQ = evQ.eq('affiliate_links.partner_name', args.partner_name);

    const { data: events, error: evErr } = await evQ;
    if (evErr) throw new Error(`supabase conversion_events: ${evErr.message}`);

    const countByStage = new Map<string, number>();
    for (const row of events ?? []) {
      const t = (row as { event_type: string }).event_type;
      countByStage.set(t, (countByStage.get(t) ?? 0) + 1);
    }

    // ── Build stepwise rate ─────────────────────────────────────────────
    const clicks = totalClicks ?? 0;
    const stages: FunnelStage[] = [];
    let prevCount = clicks;
    for (const stage of STAGE_ORDER) {
      const count = countByStage.get(stage) ?? 0;
      const rate = prevCount > 0 ? count / prevCount : 0;
      stages.push({
        event_type: stage,
        count,
        rate_vs_prev_stage: Math.round(rate * 10_000) / 10_000,
      });
      // reversed is a side-metric — don't chain it as denominator
      if (stage !== 'reversed' && count > 0) prevCount = count;
    }

    return {
      total_clicks: clicks,
      stages,
      window_days: args.days,
      filters_applied: {
        ...(args.slug && { slug: args.slug }),
        ...(args.market && { market: args.market }),
        ...(args.partner_name && { partner_name: args.partner_name }),
      },
    };
  },
);
