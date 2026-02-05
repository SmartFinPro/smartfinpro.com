import { Suspense } from 'react';
import {
  DollarSign,
  MousePointer,
  TrendingUp,
  TrendingDown,
  Link2,
  Globe,
  FileText,
  Smartphone,
  Filter,
  ScrollText,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { getDashboardStats, TimeRange } from '@/lib/actions/dashboard';
import { getLowPerformancePages, getPerformanceAlertStats } from '@/lib/actions/performance-alerts';
import { ClicksChart } from '@/components/dashboard/clicks-chart';
import { RecentClicksLive } from '@/components/dashboard/recent-clicks-live';
import { TopLinksLive } from '@/components/dashboard/top-links-live';
import { GeoStats } from '@/components/dashboard/geo-stats';
import { WorldMap } from '@/components/dashboard/world-map';
import { TopPages } from '@/components/dashboard/top-pages';
import { DeviceChart } from '@/components/dashboard/device-chart';
import { ConversionFunnel } from '@/components/dashboard/conversion-funnel';
import { TimeRangeSelector } from '@/components/dashboard/time-range-selector';
import { ScrollDepthStats } from '@/components/dashboard/scroll-depth-stats';
import { ProblemArticles } from '@/components/dashboard/problem-articles';
import { PerformanceAlerts } from '@/components/dashboard/performance-alerts';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface DashboardPageProps {
  searchParams: Promise<{ range?: string }>;
}

// Stat card icon colors
const iconStyles = {
  clicks: 'bg-emerald-50 text-emerald-500',
  links: 'bg-blue-50 text-blue-500',
  revenue: 'bg-purple-50 text-purple-500',
  scroll: 'bg-amber-50 text-amber-500',
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const range = (params.range as TimeRange) || '24h';

  // Fetch dashboard stats and performance alerts in parallel
  const [stats, lowPerformancePages, performanceAlertStats] = await Promise.all([
    getDashboardStats(range),
    getLowPerformancePages(),
    getPerformanceAlertStats(),
  ]);

  const rangeLabels: Record<TimeRange, string> = {
    '24h': 'last 24 hours',
    '7d': 'last 7 days',
    '30d': 'last 30 days',
    'all': 'all time',
  };

  // Calculate EPC for the stat card
  const overallEpc = stats.totalClicks > 0
    ? (stats.totalRevenue / stats.totalClicks).toFixed(2)
    : '0.00';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Analytics Overview</h1>
          <p className="text-slate-500 mt-1">
            Showing data for {rangeLabels[range]}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Suspense fallback={<div className="h-10 w-40 bg-slate-200 animate-pulse rounded-lg" />}>
            <TimeRangeSelector />
          </Suspense>
          <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition-colors">
            Add Data
            <span className="text-emerald-200 text-xs">⌘K</span>
          </button>
        </div>
      </div>

      {/* Stats Grid - Canua Style */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Clicks */}
        <div className="dashboard-card p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Clicks</p>
              <p className="text-3xl font-semibold text-slate-800 mt-1">
                {stats.totalClicks.toLocaleString()}
              </p>
              <div className="flex items-center gap-1 mt-2 text-sm text-emerald-500">
                <ArrowUpRight className="h-4 w-4" />
                <span>{stats.totalClicksInRange} in {rangeLabels[range]}</span>
              </div>
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconStyles.clicks}`}>
              <MousePointer className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Active Links */}
        <div className="dashboard-card p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500">Active Links</p>
              <p className="text-3xl font-semibold text-slate-800 mt-1">
                {stats.activeLinks}
              </p>
              <p className="text-sm text-slate-400 mt-2">tracking enabled</p>
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconStyles.links}`}>
              <Link2 className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="dashboard-card p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Revenue</p>
              <p className="text-3xl font-semibold text-slate-800 mt-1">
                <span className="text-lg text-slate-400">$</span>
                {stats.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <div className="flex items-center gap-1 mt-2 text-sm text-emerald-500">
                <ArrowUpRight className="h-4 w-4" />
                <span>${overallEpc} EPC</span>
              </div>
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconStyles.revenue}`}>
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Avg Scroll Depth */}
        <div className="dashboard-card p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500">Avg Scroll Depth</p>
              <p className="text-3xl font-semibold text-slate-800 mt-1">
                {stats.averageScrollDepth}%
              </p>
              <p className="text-sm text-slate-400 mt-2">{stats.scrollDepthStats.length} pages tracked</p>
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconStyles.scroll}`}>
              <ScrollText className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Low-Performance Alerts */}
      {lowPerformancePages.length > 0 && (
        <PerformanceAlerts
          pages={lowPerformancePages}
          stats={performanceAlertStats}
        />
      )}

      {/* Clicks Chart + Conversion Funnel */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="dashboard-card lg:col-span-2 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800">Clicks Over Time</h3>
          </div>
          <div className="p-6">
            <ClicksChart data={stats.clicksOverTime} />
          </div>
        </div>

        <div className="dashboard-card overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <Filter className="h-5 w-5 text-slate-400" />
            <h3 className="font-semibold text-slate-800">Conversion Funnel</h3>
          </div>
          <div className="p-6">
            <ConversionFunnel
              clicks={stats.funnelData.clicks}
              conversions={stats.funnelData.conversions}
              approvedConversions={stats.funnelData.approvedConversions}
              approvedRevenue={stats.funnelData.approvedRevenue}
            />
          </div>
        </div>
      </div>

      {/* Geo + Devices */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="dashboard-card lg:col-span-2 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <Globe className="h-5 w-5 text-slate-400" />
            <h3 className="font-semibold text-slate-800">Geographic Distribution</h3>
          </div>
          <div className="p-6 space-y-4">
            <WorldMap data={stats.geoStats} />
            <div className="border-t border-slate-100 pt-4">
              <GeoStats data={stats.geoStats} />
            </div>
          </div>
        </div>

        <div className="dashboard-card overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-slate-400" />
            <h3 className="font-semibold text-slate-800">Devices</h3>
          </div>
          <div className="p-6">
            <DeviceChart data={stats.deviceStats} />
          </div>
        </div>
      </div>

      {/* Top Links + Top Pages + Recent */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="dashboard-card overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <Link2 className="h-5 w-5 text-slate-400" />
            <h3 className="font-semibold text-slate-800">Top Performing Links</h3>
          </div>
          <div className="p-6">
            <TopLinksLive links={stats.topLinks} />
          </div>
        </div>

        <div className="dashboard-card overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <FileText className="h-5 w-5 text-slate-400" />
            <h3 className="font-semibold text-slate-800">Top Pages</h3>
          </div>
          <div className="p-6">
            <TopPages data={stats.topPages} />
          </div>
        </div>

        <div className="dashboard-card overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800">Recent Clicks</h3>
          </div>
          <div className="p-6">
            <RecentClicksLive clicks={stats.recentClicks} />
          </div>
        </div>
      </div>

      {/* Problem Articles */}
      <div className="dashboard-card overflow-hidden border-amber-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <div>
            <h3 className="font-semibold text-slate-800">Optimization Potential</h3>
            <p className="text-sm text-slate-500 mt-0.5">
              Articles with high engagement but low affiliate click rate
            </p>
          </div>
        </div>
        <div className="p-6">
          <ProblemArticles data={stats.problemArticles} />
        </div>
      </div>

      {/* Scroll Depth Analysis */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="dashboard-card overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <ScrollText className="h-5 w-5 text-slate-400" />
            <div>
              <h3 className="font-semibold text-slate-800">Article Scroll Depth</h3>
              <p className="text-sm text-slate-500 mt-0.5">How far users scroll on each article</p>
            </div>
          </div>
          <div className="p-6">
            <ScrollDepthStats
              data={stats.scrollDepthStats}
              averageScrollDepth={stats.averageScrollDepth}
            />
          </div>
        </div>

        <div className="dashboard-card overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-slate-400" />
            <div>
              <h3 className="font-semibold text-slate-800">Content Engagement Insights</h3>
              <p className="text-sm text-slate-500 mt-0.5">Understand how users engage with your content</p>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl text-center">
                  <div className="text-3xl font-semibold text-emerald-500">{stats.averageScrollDepth}%</div>
                  <div className="text-sm text-slate-500 mt-1">Avg Scroll Depth</div>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl text-center">
                  <div className="text-3xl font-semibold text-blue-500">{stats.conversionRate}%</div>
                  <div className="text-sm text-slate-500 mt-1">Click-to-Sale</div>
                </div>
              </div>
              <div className="text-sm text-slate-600">
                <p className="font-medium mb-2">Scroll Depth Guide:</p>
                <ul className="space-y-1.5 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span><span className="font-medium">80%+</span> - Excellent engagement</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span><span className="font-medium">40-80%</span> - Consider earlier CTAs</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    <span><span className="font-medium">&lt;40%</span> - Review intro/headlines</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
