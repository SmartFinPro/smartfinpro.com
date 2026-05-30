import { Flame } from 'lucide-react';
import { getCtaHeatmapData } from '@/lib/actions/cta-analytics';
import { getAlertSettings } from '@/lib/actions/spike-monitor';
import { getRevenueForecast } from '@/lib/actions/revenue-forecast';
import { CtaHeatmap } from '@/components/dashboard/cta-heatmap';
import { RevenueForecast } from '@/components/dashboard/revenue-forecast';
import { ChunkErrorBoundary } from '@/components/dashboard/chunk-error-boundary';
import { PageHeader } from '@/components/dashboard/ui';

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
      <PageHeader
        icon={Flame}
        title="CTA Click Heatmap"
        description={`Click density across all ${data.cells.length || 194} pages — find your conversion winners`}
      />

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
