import { Suspense } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  MousePointer,
  BarChart3,
  Globe,
  ArrowUpRight,
  Target,
  Zap,
} from 'lucide-react';
import { getAutoRevenueStats } from '@/lib/actions/revenue';
import { RevenueByProductTable } from '@/components/dashboard/revenue-by-product';
import { RevenueByMarketGrid } from '@/components/dashboard/revenue-by-market';
import { EPCTrendChart } from '@/components/dashboard/epc-trend-chart';
import { RevenueChart } from '@/components/dashboard/revenue-chart';
import { RecentConversions } from '@/components/dashboard/recent-conversions';
import { WidgetErrorBoundary } from '@/components/dashboard/widget-error-boundary';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Skeleton loader
function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-200 rounded ${className}`} />;
}

// Stat card component
function StatCard({
  label,
  value,
  subtext,
  icon: Icon,
  iconColor,
  trend,
  trendValue,
}: {
  label: string;
  value: string;
  subtext?: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: number;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-slate-500">{label}</p>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-3xl font-semibold text-slate-900 tabular-nums">
              {value}
            </p>
            {trend && trendValue !== undefined && trendValue !== 0 && (
              <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${
                trend === 'up' ? 'text-emerald-600' : 'text-red-500'
              }`}>
                {trend === 'up' ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {trendValue}%
              </span>
            )}
          </div>
          {subtext && (
            <p className="text-sm text-slate-400 mt-1">{subtext}</p>
          )}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconColor}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export default async function RevenuePage() {
  const stats = await getAutoRevenueStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Revenue Analytics</h1>
        <p className="text-slate-500 mt-1">
          Automatic revenue tracking from affiliate conversions
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Revenue"
          value={`$${stats.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtext="from approved conversions"
          icon={DollarSign}
          iconColor="bg-emerald-50 text-emerald-500"
          trend={stats.revenueTrend}
          trendValue={stats.revenueTrendChange}
        />
        <StatCard
          label="Global EPC"
          value={`$${stats.globalEPC.toFixed(2)}`}
          subtext="earnings per click"
          icon={Zap}
          iconColor="bg-purple-50 text-purple-500"
          trend={stats.epcTrend}
          trendValue={stats.epcTrendChange}
        />
        <StatCard
          label="Total Clicks"
          value={stats.totalClicks.toLocaleString('en-US')}
          subtext="last 30 days"
          icon={MousePointer}
          iconColor="bg-blue-50 text-blue-500"
        />
        <StatCard
          label="Conversion Rate"
          value={`${stats.globalConversionRate.toFixed(2)}%`}
          subtext={`${stats.totalConversions} conversions`}
          icon={Target}
          iconColor="bg-amber-50 text-amber-500"
        />
      </div>

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
        {/* EPC Trend */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-500" />
            <h3 className="font-semibold text-slate-900">EPC Trend</h3>
            <span className="text-xs text-slate-400 ml-auto">Last 7 days</span>
          </div>
          <div className="p-6">
            <EPCTrendChart data={stats.epcTrendData} globalEPC={stats.globalEPC} />
          </div>
        </div>

        {/* Monthly Revenue */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-emerald-500" />
            <h3 className="font-semibold text-slate-900">Monthly Revenue</h3>
          </div>
          <div className="p-6">
            <RevenueChart data={stats.conversionsByMonth} />
          </div>
        </div>
      </div>

      {/* Revenue by Product */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <ArrowUpRight className="h-5 w-5 text-slate-400" />
          <h3 className="font-semibold text-slate-900">Top Products by Revenue</h3>
          <span className="text-xs text-slate-400 ml-auto">All time</span>
        </div>
        <div className="p-4">
          <WidgetErrorBoundary label="Revenue by Product" minHeight="h-64">
            <Suspense fallback={<Skeleton className="h-64" />}>
              <RevenueByProductTable products={stats.revenueByProduct} />
            </Suspense>
          </WidgetErrorBoundary>
        </div>
      </div>

      {/* Recent Conversions */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-emerald-500" />
          <h3 className="font-semibold text-slate-900">Recent Conversions</h3>
        </div>
        <div className="p-6">
          <WidgetErrorBoundary label="Recent Conversions" minHeight="h-48">
            <Suspense fallback={<Skeleton className="h-48" />}>
              <RecentConversions conversions={stats.recentConversions} />
            </Suspense>
          </WidgetErrorBoundary>
        </div>
      </div>
    </div>
  );
}
