// Tool: get_revenue_stats (read-only)
// Aggregated revenue/clicks/EPC for approved conversions in time window.
//
// IMPORTANT: Matches dashboard logic in lib/actions/revenue.ts:167
// which filters status = 'approved' only. Pending revenue is excluded
// from main totals; optionally reported as separate field.

import { getServiceClient } from '../lib/supabase.js';
import { withAudit } from '../lib/audit.js';
import { GetRevenueStatsInput, formatZodError } from '../lib/validation.js';
import type { RevenueByMarket, TopProduct } from '../types.js';

export const TOOL_NAME = 'get_revenue_stats';

export const TOOL_DESCRIPTION =
  'Aggregated revenue stats across approved conversions in the given time window. ' +
  'Returns total_revenue, total_clicks, conversion_rate, EPC, split by market and top products. ' +
  'Only counts status=approved (matches dashboard). Read-only.';

export const TOOL_INPUT_SCHEMA = GetRevenueStatsInput;

interface Result {
  total_revenue: number;
  total_clicks: number;
  total_conversions: number;
  pending_revenue: number;
  conversion_rate: number;
  epc: number;
  revenue_by_market: RevenueByMarket[];
  top_products: TopProduct[];
  window_days: number;
}

export const handle = withAudit(
  TOOL_NAME,
  async (rawArgs: unknown): Promise<Result> => {
    const parsed = GetRevenueStatsInput.safeParse(rawArgs);
    if (!parsed.success) throw new Error(formatZodError(parsed.error));
    const args = parsed.data;

    const supabase = getServiceClient();
    const sinceISO = new Date(Date.now() - args.days * 86_400_000).toISOString();

    // ── Conversions (approved + pending separately) ─────────────────────
    let convQ = supabase
      .from('conversions')
      .select(
        'commission_earned, status, network, converted_at, link_id, ' +
          'affiliate_links!inner (partner_name, market)',
      )
      .gte('converted_at', sinceISO);
    if (args.market) convQ = convQ.eq('affiliate_links.market', args.market);
    if (args.partner_name) convQ = convQ.eq('affiliate_links.partner_name', args.partner_name);

    const { data: convs, error: convErr } = await convQ;
    if (convErr) throw new Error(`supabase conversions: ${convErr.message}`);

    // ── Clicks in same window + same filters ────────────────────────────
    let clickQ = supabase
      .from('link_clicks')
      .select('link_id, affiliate_links!inner (partner_name, market)', { count: 'exact', head: true })
      .gte('clicked_at', sinceISO);
    if (args.market) clickQ = clickQ.eq('affiliate_links.market', args.market);
    if (args.partner_name) clickQ = clickQ.eq('affiliate_links.partner_name', args.partner_name);

    const { count: clickCount, error: clickErr } = await clickQ;
    if (clickErr) throw new Error(`supabase clicks: ${clickErr.message}`);

    // ── Aggregate ────────────────────────────────────────────────────────
    const rows = (convs ?? []) as unknown as Array<{
      commission_earned: number | null;
      status: string;
      affiliate_links: { partner_name: string; market: string } | null;
    }>;

    const approved = rows.filter((r) => r.status === 'approved');
    const pending = rows.filter((r) => r.status === 'pending');

    const totalRevenue = approved.reduce((sum, r) => sum + Number(r.commission_earned ?? 0), 0);
    const pendingRevenue = pending.reduce((sum, r) => sum + Number(r.commission_earned ?? 0), 0);
    const totalClicks = clickCount ?? 0;
    const totalConversions = approved.length;

    const conversionRate = totalClicks > 0 ? totalConversions / totalClicks : 0;
    const epc = totalClicks > 0 ? totalRevenue / totalClicks : 0;

    // Revenue by market (clicks require separate aggregation, out-of-scope for V1 nicety)
    const byMarketMap = new Map<string, { revenue: number; clicks: number }>();
    for (const r of approved) {
      const m = r.affiliate_links?.market ?? 'unknown';
      const cur = byMarketMap.get(m) ?? { revenue: 0, clicks: 0 };
      cur.revenue += Number(r.commission_earned ?? 0);
      byMarketMap.set(m, cur);
    }
    const revenue_by_market: RevenueByMarket[] = [...byMarketMap.entries()]
      .map(([market, v]) => ({ market, revenue: v.revenue, clicks: v.clicks }))
      .sort((a, b) => b.revenue - a.revenue);

    // Top products by revenue
    const byProductMap = new Map<string, { revenue: number; conversions: number }>();
    for (const r of approved) {
      const p = r.affiliate_links?.partner_name ?? 'unknown';
      const cur = byProductMap.get(p) ?? { revenue: 0, conversions: 0 };
      cur.revenue += Number(r.commission_earned ?? 0);
      cur.conversions += 1;
      byProductMap.set(p, cur);
    }
    const top_products: TopProduct[] = [...byProductMap.entries()]
      .map(([partner_name, v]) => ({ partner_name, revenue: v.revenue, conversions: v.conversions }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    return {
      total_revenue: round2(totalRevenue),
      total_clicks: totalClicks,
      total_conversions: totalConversions,
      pending_revenue: round2(pendingRevenue),
      conversion_rate: round4(conversionRate),
      epc: round4(epc),
      revenue_by_market,
      top_products,
      window_days: args.days,
    };
  },
);

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
function round4(n: number): number {
  return Math.round(n * 10_000) / 10_000;
}
