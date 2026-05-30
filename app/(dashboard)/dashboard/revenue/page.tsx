import { Suspense } from 'react';
import {
  DollarSign,
  TrendingUp,
  MousePointer,
  BarChart3,
  Globe,
  ArrowUpRight,
  Target,
  Zap,
  FileText,
} from 'lucide-react';
import { getAutoRevenueStats, getRevenueByPage, getAffiliateLinksForMapping, getProfitAndLoss } from '@/lib/actions/revenue';
import { PnlCard } from '@/components/dashboard/pnl-card';
import { AddConversionForm } from '@/components/dashboard/add-conversion-form';
import { RevenueByProductTable } from '@/components/dashboard/revenue-by-product';
import { RevenueByPageTable } from '@/components/dashboard/revenue-by-page';
import { RevenueByMarketGrid } from '@/components/dashboard/revenue-by-market';
import { EPCTrendChart } from '@/components/dashboard/epc-trend-chart';
import { RevenueChart } from '@/components/dashboard/revenue-chart';
import { RecentConversions } from '@/components/dashboard/recent-conversions';
import { WidgetErrorBoundary } from '@/components/dashboard/widget-error-boundary';
import { ExportButton } from '@/components/dashboard/export-button';
import { PageHeader, StatCard, SectionCard } from '@/components/dashboard/ui';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Skeleton loader
function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-200 rounded ${className}`} />;
}

export default async function RevenuePage() {
  const [stats, pageStats, affiliateLinks, pnl] = await Promise.all([
    getAutoRevenueStats(),
    getRevenueByPage(),
    getAffiliateLinksForMapping(),
    getProfitAndLoss(30),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Revenue Analytics"
        description="Automatic revenue tracking from affiliate conversions"
      />

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Revenue"
          value={`$${stats.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtext="from approved conversions"
          icon={DollarSign}
          tone="green"
          delta={
            stats.revenueTrendChange
              ? { direction: stats.revenueTrend, value: `${stats.revenueTrendChange}%` }
              : undefined
          }
        />
        <StatCard
          label="Global EPC"
          value={`$${stats.globalEPC.toFixed(2)}`}
          subtext="earnings per click"
          icon={Zap}
          tone="navy"
          delta={
            stats.epcTrendChange
              ? { direction: stats.epcTrend, value: `${stats.epcTrendChange}%` }
              : undefined
          }
        />
        <StatCard
          label="Total Clicks"
          value={stats.totalClicks.toLocaleString('en-US')}
          subtext="last 30 days"
          icon={MousePointer}
          tone="blue"
        />
        <StatCard
          label="Conversion Rate"
          value={`${stats.globalConversionRate.toFixed(2)}%`}
          subtext={`${stats.totalConversions} conversions`}
          icon={Target}
          tone="amber"
        />
      </div>

      {/* Profit & Loss (Revenue − API Cost) */}
      <WidgetErrorBoundary label="Profit & Loss" minHeight="h-40">
        <PnlCard pnl={pnl} days={30} />
      </WidgetErrorBoundary>

      {/* Revenue by Market */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
            <Globe className="h-4 w-4 text-slate-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Revenue by Market</h2>
            <p className="text-xs text-slate-500">Performance across core markets</p>
          </div>
        </div>
        <WidgetErrorBoundary label="Revenue by Market" minHeight="h-48">
          <Suspense fallback={<Skeleton className="h-48" />}>
            <RevenueByMarketGrid markets={stats.revenueByMarket} />
          </Suspense>
        </WidgetErrorBoundary>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="EPC Trend" icon={TrendingUp} tone="navy" description="Last 7 days">
          <EPCTrendChart data={stats.epcTrendData} globalEPC={stats.globalEPC} />
        </SectionCard>
        <SectionCard title="Monthly Revenue" icon={BarChart3} tone="green">
          <RevenueChart data={stats.conversionsByMonth} />
        </SectionCard>
      </div>

      {/* Revenue by Product */}
      <SectionCard
        title="Top Products by Revenue"
        icon={ArrowUpRight}
        tone="slate"
        description="All time"
        contentClassName="p-4"
      >
        <WidgetErrorBoundary label="Revenue by Product" minHeight="h-64">
          <Suspense fallback={<Skeleton className="h-64" />}>
            <RevenueByProductTable products={stats.revenueByProduct} />
          </Suspense>
        </WidgetErrorBoundary>
      </SectionCard>

      {/* Revenue by Page */}
      <SectionCard
        title="Revenue by Page"
        icon={FileText}
        tone="blue"
        description={`${pageStats.totalPages} pages tracked`}
        actions={<ExportButton dataset="revenue-by-page" />}
        contentClassName="p-4"
      >
        <WidgetErrorBoundary label="Revenue by Page" minHeight="h-64">
          <Suspense fallback={<Skeleton className="h-64" />}>
            <RevenueByPageTable pages={pageStats.pages} />
          </Suspense>
        </WidgetErrorBoundary>
      </SectionCard>

      {/* Recent Conversions */}
      <SectionCard
        title="Recent Conversions"
        icon={DollarSign}
        tone="green"
        actions={<AddConversionForm affiliateLinks={affiliateLinks} />}
      >
        <WidgetErrorBoundary label="Recent Conversions" minHeight="h-48">
          <Suspense fallback={<Skeleton className="h-48" />}>
            <RecentConversions conversions={stats.recentConversions} />
          </Suspense>
        </WidgetErrorBoundary>
      </SectionCard>
    </div>
  );
}
