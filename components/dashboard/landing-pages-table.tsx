'use client';

import { ArrowUpRight, Clock, ScrollText, MousePointer } from 'lucide-react';
import type { LandingPageStat } from '@/lib/actions/analytics';
import { WidgetErrorBoundary } from '@/components/dashboard/widget-error-boundary';

interface LandingPagesTableProps {
  data: LandingPageStat[];
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

function getScrollColor(depth: number): string {
  if (depth >= 80) return 'text-emerald-500';
  if (depth >= 50) return 'text-amber-500';
  return 'text-red-500';
}

function getBounceColor(rate: number): string {
  if (rate <= 30) return 'text-emerald-500';
  if (rate <= 60) return 'text-amber-500';
  return 'text-red-500';
}

export function LandingPagesTable({ data }: LandingPagesTableProps) {
  if (!data || data.length === 0) {
    return (
      <WidgetErrorBoundary label="Landing Pages Table" minHeight="h-48">
        <div className="text-center py-8 text-slate-400">
          No landing page data available
        </div>
      </WidgetErrorBoundary>
    );
  }

  return (
    <WidgetErrorBoundary label="Landing Pages Table" minHeight="h-48">
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Page
            </th>
            <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Sessions
            </th>
            <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <span className="flex items-center justify-end gap-1">
                <Clock className="h-3 w-3" />
                Avg. Time
              </span>
            </th>
            <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <span className="flex items-center justify-end gap-1">
                <ScrollText className="h-3 w-3" />
                Scroll
              </span>
            </th>
            <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Bounce
            </th>
            <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <span className="flex items-center justify-end gap-1">
                <MousePointer className="h-3 w-3" />
                Clicks
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((page, index) => (
            <tr
              key={page.page_path}
              className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
            >
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-medium text-slate-500">
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-700 truncate max-w-[250px]">
                      {page.page_title || page.page_path}
                    </p>
                    <p className="text-xs text-slate-400 truncate max-w-[250px]">
                      {page.page_path}
                    </p>
                  </div>
                </div>
              </td>
              <td className="py-3 px-4 text-right">
                <span className="text-sm font-semibold text-slate-700">
                  {page.sessions.toLocaleString('en-US')}
                </span>
              </td>
              <td className="py-3 px-4 text-right">
                <span className="text-sm text-slate-600">
                  {formatDuration(page.avgTimeOnPage)}
                </span>
              </td>
              <td className="py-3 px-4 text-right">
                <span className={`text-sm font-medium ${getScrollColor(page.avgScrollDepth)}`}>
                  {page.avgScrollDepth}%
                </span>
              </td>
              <td className="py-3 px-4 text-right">
                <span className={`text-sm font-medium ${getBounceColor(page.bounceRate)}`}>
                  {page.bounceRate}%
                </span>
              </td>
              <td className="py-3 px-4 text-right">
                <span className="text-sm font-semibold text-emerald-600">
                  {page.affiliateClicks}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </WidgetErrorBoundary>
  );
}
