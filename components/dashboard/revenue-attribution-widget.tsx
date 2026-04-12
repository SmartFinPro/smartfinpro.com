// components/dashboard/revenue-attribution-widget.tsx
// Revenue Attribution by Page — shows which articles generate the most affiliate revenue
// Method: EPC (Earnings Per Click) per link, attributed to referring pages
// Server Component — direct Supabase query, no client state

import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/server';
import { DollarSign, ArrowRight, TrendingUp, FileText } from 'lucide-react';
import { WidgetErrorBoundary } from '@/components/dashboard/widget-error-boundary';

interface PageRevenueStat {
  pagePath: string;
  clicks: number;
  attributedRevenue: number;
  epc: number; // avg earnings per click from that page
}

async function getRevenueByPage(): Promise<PageRevenueStat[]> {
  const supabase = createServiceClient();
  const since = new Date(Date.now() - 90 * 86400_000).toISOString();

  // Step 1: Get approved conversions → revenue per link_id
  const { data: conversions } = await supabase
    .from('conversions')
    .select('link_id, commission_earned')
    .eq('status', 'approved');

  if (!conversions?.length) return [];

  // Build revenue map: link_id → total approved revenue
  const revenueByLink = new Map<string, number>();
  for (const c of conversions) {
    if (!c.link_id || !c.commission_earned) continue;
    revenueByLink.set(c.link_id, (revenueByLink.get(c.link_id) ?? 0) + c.commission_earned);
  }

  // Step 2: Get all clicks (last 90 days) with referrer + link_id
  const { data: clicks } = await supabase
    .from('link_clicks')
    .select('link_id, referrer')
    .gte('clicked_at', since)
    .not('referrer', 'is', null)
    .not('link_id', 'is', null);

  if (!clicks?.length) return [];

  // Step 3: Calculate EPC per link_id (revenue / total clicks to that link)
  const clicksByLink = new Map<string, number>();
  for (const click of clicks) {
    if (!click.link_id) continue;
    clicksByLink.set(click.link_id, (clicksByLink.get(click.link_id) ?? 0) + 1);
  }
  const epcByLink = new Map<string, number>();
  for (const [linkId, rev] of revenueByLink) {
    const totalClicks = clicksByLink.get(linkId) ?? 0;
    if (totalClicks > 0) {
      epcByLink.set(linkId, rev / totalClicks);
    }
  }

  // Step 4: Attribute revenue to pages via referrer → link_id → EPC
  const pageStats = new Map<string, { clicks: number; revenue: number }>();
  for (const click of clicks) {
    if (!click.link_id || !click.referrer) continue;
    const epc = epcByLink.get(click.link_id) ?? 0;
    if (epc === 0) continue; // Skip links with no conversions

    let pagePath: string;
    try {
      pagePath = new URL(click.referrer).pathname;
    } catch {
      pagePath = click.referrer;
    }
    // Normalize to clean path (strip trailing slash except root)
    pagePath = pagePath.replace(/\/$/, '') || '/';

    const cur = pageStats.get(pagePath) ?? { clicks: 0, revenue: 0 };
    pageStats.set(pagePath, { clicks: cur.clicks + 1, revenue: cur.revenue + epc });
  }

  // Step 5: Sort by attributed revenue, return top 10
  return Array.from(pageStats.entries())
    .map(([pagePath, { clicks, revenue }]) => ({
      pagePath,
      clicks,
      attributedRevenue: revenue,
      epc: clicks > 0 ? revenue / clicks : 0,
    }))
    .sort((a, b) => b.attributedRevenue - a.attributedRevenue)
    .slice(0, 10);
}

function formatCurrency(value: number): string {
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}k`;
  return `$${value.toFixed(0)}`;
}

function formatEpc(value: number): string {
  return `$${value.toFixed(2)}`;
}

function truncatePath(path: string, maxLen = 44): string {
  if (path.length <= maxLen) return path;
  return '…' + path.slice(-(maxLen - 1));
}

export async function RevenueAttributionWidget() {
  let pages: PageRevenueStat[] = [];
  try {
    pages = await getRevenueByPage();
  } catch {
    // Silently fail — widget is non-critical
  }

  const hasData = pages.length > 0;
  const maxRevenue = pages[0]?.attributedRevenue ?? 1;
  const totalAttributed = pages.reduce((s, p) => s + p.attributedRevenue, 0);

  return (
    <WidgetErrorBoundary label="Revenue Attribution" minHeight="h-48">
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <DollarSign className="h-4 w-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-900">Revenue Attribution</h3>
          {hasData && (
            <span className="text-[10px] font-medium text-slate-400 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full">
              Last 90 days
            </span>
          )}
        </div>
        <Link
          href="/dashboard/revenue"
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors"
        >
          Full Report <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="p-5">
        {!hasData ? (
          /* No-data state */
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-3">
              <FileText className="h-5 w-5 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-600 mb-1">No attribution data yet</p>
            <p className="text-xs text-slate-400 max-w-[200px]">
              Data appears once affiliate links generate approved conversions.
            </p>
          </div>
        ) : (
          <>
            {/* Summary */}
            <div className="flex items-center gap-2 mb-4 text-xs text-slate-500">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              <span>
                <strong className="font-semibold text-slate-700">
                  {formatCurrency(totalAttributed)}
                </strong>{' '}
                total attributed · top {pages.length} pages
              </span>
            </div>

            {/* Page rows */}
            <div className="space-y-2.5">
              {pages.map((page, i) => {
                const barWidth = Math.max(4, (page.attributedRevenue / maxRevenue) * 100);
                const isTop = i === 0;
                return (
                  <div key={page.pagePath}>
                    {/* Path + metrics */}
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        {isTop && (
                          <span className="shrink-0 text-[9px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">
                            #1
                          </span>
                        )}
                        <span
                          className="text-[11px] font-mono text-slate-600 truncate"
                          title={page.pagePath}
                        >
                          {truncatePath(page.pagePath)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-2">
                        <span className="text-[10px] text-slate-400 tabular-nums">
                          {page.clicks} clicks
                        </span>
                        <span className="text-[10px] text-slate-400 tabular-nums">
                          {formatEpc(page.epc)} EPC
                        </span>
                        <span
                          className={`text-xs font-semibold tabular-nums ${
                            isTop ? 'text-emerald-700' : 'text-slate-700'
                          }`}
                        >
                          {formatCurrency(page.attributedRevenue)}
                        </span>
                      </div>
                    </div>
                    {/* Revenue bar */}
                    <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isTop ? 'bg-emerald-400' : 'bg-violet-300'
                        }`}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer note */}
            <p className="text-[10px] text-slate-400 mt-4 text-right">
              EPC-weighted attribution · approved conversions only
            </p>
          </>
        )}
      </div>
    </div>
    </WidgetErrorBoundary>
  );
}
