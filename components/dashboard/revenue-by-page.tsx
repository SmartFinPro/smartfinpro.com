'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { RevenueByPage } from '@/lib/actions/revenue';
import { WidgetErrorBoundary } from '@/components/dashboard/widget-error-boundary';

interface RevenueByPageProps {
  pages: RevenueByPage[];
}

function TrendBadge({ trend, change }: { trend: 'up' | 'down' | 'neutral'; change: number }) {
  if (trend === 'neutral' || change === 0) {
    return <Minus className="h-3 w-3 text-slate-400" />;
  }

  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${
      trend === 'up' ? 'text-emerald-600' : 'text-red-500'
    }`}>
      {trend === 'up' ? (
        <TrendingUp className="h-3 w-3" />
      ) : (
        <TrendingDown className="h-3 w-3" />
      )}
      {change}%
    </span>
  );
}

function formatSlug(slug: string): string {
  // /uk/forex/pepperstone-review → pepperstone-review
  const parts = slug.split('/').filter(Boolean);
  return parts[parts.length - 1] || slug;
}

function getMarketBadge(slug: string): { label: string; color: string } | null {
  if (slug.startsWith('/uk/')) return { label: 'UK', color: 'bg-emerald-100 text-emerald-700' };
  if (slug.startsWith('/au/')) return { label: 'AU', color: 'bg-amber-100 text-amber-700' };
  if (slug.startsWith('/ca/')) return { label: 'CA', color: 'bg-red-100 text-red-700' };
  return { label: 'US', color: 'bg-blue-100 text-blue-700' };
}

export function RevenueByPageTable({ pages }: RevenueByPageProps) {
  if (!pages || pages.length === 0) {
    return (
      <WidgetErrorBoundary label="Revenue by Page" minHeight="h-48">
        <div className="py-8 text-center text-slate-500 text-sm">
          No page revenue data yet. Revenue attribution will appear as clicks and conversions are tracked.
        </div>
      </WidgetErrorBoundary>
    );
  }

  // Show top 15 pages
  const topPages = pages.slice(0, 15);

  return (
    <WidgetErrorBoundary label="Revenue by Page" minHeight="h-48">
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="text-left py-3 px-3 font-medium text-slate-500 text-xs uppercase tracking-wider">Page</th>
            <th className="text-right py-3 px-3 font-medium text-slate-500 text-xs uppercase tracking-wider">Revenue</th>
            <th className="text-right py-3 px-3 font-medium text-slate-500 text-xs uppercase tracking-wider">EPC</th>
            <th className="text-right py-3 px-3 font-medium text-slate-500 text-xs uppercase tracking-wider">Clicks</th>
            <th className="text-right py-3 px-3 font-medium text-slate-500 text-xs uppercase tracking-wider">Conv.</th>
            <th className="text-right py-3 px-3 font-medium text-slate-500 text-xs uppercase tracking-wider">CR</th>
            <th className="text-left py-3 px-3 font-medium text-slate-500 text-xs uppercase tracking-wider">Top Partner</th>
            <th className="text-center py-3 px-3 font-medium text-slate-500 text-xs uppercase tracking-wider">Trend</th>
          </tr>
        </thead>
        <tbody>
          {topPages.map((page, index) => {
            const market = getMarketBadge(page.pageSlug);
            const totalRevenue = page.approvedRevenue + page.pendingRevenue;

            return (
              <tr
                key={page.pageSlug}
                className="border-b border-slate-50 hover:bg-slate-50 transition-colors"
              >
                <td className="py-3 px-3 max-w-[280px]">
                  <div className="flex items-center gap-2">
                    {index < 3 && (
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        index === 0 ? 'bg-amber-100 text-amber-700' :
                        index === 1 ? 'bg-slate-100 text-slate-600' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {index + 1}
                      </span>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        {market && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${market.color} flex-shrink-0`}>
                            {market.label}
                          </span>
                        )}
                        <span className="font-medium text-slate-900 truncate">
                          {formatSlug(page.pageSlug)}
                        </span>
                      </div>
                      <span className="text-slate-400 text-xs truncate block">
                        {page.pageSlug}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-3 text-right">
                  <div>
                    <span className="font-semibold text-slate-900 tabular-nums">
                      ${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    {page.pendingRevenue > 0 && (
                      <div className="text-[10px] text-amber-600">
                        ${page.pendingRevenue.toFixed(2)} pending
                      </div>
                    )}
                  </div>
                </td>
                <td className="py-3 px-3 text-right">
                  <span className={`font-medium tabular-nums ${
                    page.epc >= 1 ? 'text-emerald-600' :
                    page.epc >= 0.5 ? 'text-slate-700' :
                    'text-slate-400'
                  }`}>
                    ${page.epc.toFixed(2)}
                  </span>
                </td>
                <td className="py-3 px-3 text-right text-slate-600 tabular-nums">
                  {page.totalClicks.toLocaleString('en-US')}
                </td>
                <td className="py-3 px-3 text-right text-slate-600 tabular-nums">
                  {page.totalConversions}
                </td>
                <td className="py-3 px-3 text-right">
                  <span className={`tabular-nums ${
                    page.conversionRate >= 5 ? 'text-emerald-600 font-medium' :
                    page.conversionRate >= 2 ? 'text-slate-700' :
                    'text-slate-400'
                  }`}>
                    {page.conversionRate.toFixed(1)}%
                  </span>
                </td>
                <td className="py-3 px-3 text-left">
                  <span className="text-slate-600 text-xs">
                    {page.topPartner}
                  </span>
                </td>
                <td className="py-3 px-3 text-center">
                  <TrendBadge trend={page.trend} change={page.trendChange} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
    </WidgetErrorBoundary>
  );
}
