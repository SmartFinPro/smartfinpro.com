import { Flame } from 'lucide-react';
import { getCtaHeatmapData } from '@/lib/actions/cta-analytics';
import { getAlertSettings } from '@/lib/actions/spike-monitor';
import { getRevenueForecast } from '@/lib/actions/revenue-forecast';
import { CtaHeatmap } from '@/components/dashboard/cta-heatmap';
import { RevenueForecast } from '@/components/dashboard/revenue-forecast';
import { ChunkErrorBoundary } from '@/components/dashboard/chunk-error-boundary';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HeatmapPage() {
  const [heatmapResult, alertSettings, forecastResult] = await Promise.all([
    getCtaHeatmapData('7d'),
    getAlertSettings(),
    getRevenueForecast('30d'),
  ]);

  const data = heatmapResult.data ?? {
    cells: [],
    totalClicks: 0,
    maxClicks: 0,
    hottest: null,
    timeRange: '7d' as const,
  };

  const forecastData = forecastResult.data ?? {
    totalExpectedRevenue: 0,
    previousExpectedRevenue: 0,
    trend: 'neutral' as const,
    trendChange: 0,
    monthlyRunRate: 0,
    topSlugs: [],
    byMarket: [],
    byProvider: [],
    totalEmeraldClicks: 0,
    totalMatchedClicks: 0,
    avgCpa: 0,
    timeRange: '30d' as const,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-md shadow-violet-500/20">
            <Flame className="h-4.5 w-4.5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">CTA Click Heatmap</h1>
            <p className="text-sm text-slate-500">
              Click density across all {data.cells.length || 194} pages — find your conversion winners
            </p>
          </div>
        </div>
      </div>

      {/* Revenue Forecast Panel — wrapped in ChunkErrorBoundary */}
      <ChunkErrorBoundary label="RevenueForecast">
        <RevenueForecast initialData={forecastData} />
      </ChunkErrorBoundary>

      {/* Heatmap Component */}
      <ChunkErrorBoundary label="CtaHeatmap">
        <CtaHeatmap initialData={data} initialAlertSettings={alertSettings} />
      </ChunkErrorBoundary>
    </div>
  );
}
