import { Suspense } from 'react';
import {
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  AlertTriangle,
  Lightbulb,
  CheckCircle,
  AlertCircle,
  Globe,
} from 'lucide-react';
import { getDashboardStats, getGlobalMarketIntelligence, TimeRange, TimeComparison, ActionItem, GlobalMarketIntelligence } from '@/lib/actions/dashboard';
import { getLowPerformancePages, getPerformanceAlertStats } from '@/lib/actions/performance-alerts';
import { ClicksChart } from '@/components/dashboard/clicks-chart';
import { RecentClicksLive } from '@/components/dashboard/recent-clicks-live';
import { TopLinksLive } from '@/components/dashboard/top-links-live';
import { TopPages } from '@/components/dashboard/top-pages';
import { DeviceChart } from '@/components/dashboard/device-chart';
import { ConversionFunnel } from '@/components/dashboard/conversion-funnel';
import { TimeRangeSelector } from '@/components/dashboard/time-range-selector';
import { ScrollDepthStats } from '@/components/dashboard/scroll-depth-stats';
import { ProblemArticles } from '@/components/dashboard/problem-articles';
import { PerformanceAlerts } from '@/components/dashboard/performance-alerts';
import { MarketHealthGrid } from '@/components/dashboard/market-health-grid';
import { MarketOpportunities } from '@/components/dashboard/market-opportunities';
import { WorldMap } from '@/components/dashboard/world-map';
import { ClickDetailsTable } from '@/components/dashboard/click-details-table';
import { SystemIntegrityWidget } from '@/components/dashboard/system-integrity-widget';
import { WebVitalsWidget } from '@/components/dashboard/web-vitals-widget';
import { RevenueAttributionWidget } from '@/components/dashboard/revenue-attribution-widget';
import { AuditStatusWidget } from '@/components/dashboard/audit-status-widget';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const maxDuration = 15; // Hard limit: 15 seconds max server render

interface DashboardPageProps {
  searchParams: Promise<{ range?: string }>;
}

// ── Timeout wrapper: prevents Supabase from hanging indefinitely ──
function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

// Clean card style - white with subtle border and shadow
const card = 'bg-white border border-slate-200 rounded-lg shadow-sm';

// Skeleton loader
function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-slate-100 animate-pulse rounded ${className}`} />;
}

// Simple trend indicator
function TrendIndicator({ comparison, label }: { comparison: TimeComparison; label: string }) {
  if (comparison.trend === 'neutral' || comparison.change === 0) {
    return <span className="text-sm text-slate-400">No change vs {label}</span>;
  }

  const isUp = comparison.trend === 'up';
  return (
    <span className={`inline-flex items-center gap-1 text-sm ${isUp ? 'text-green-600' : 'text-red-600'}`}>
      {isUp ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
      {comparison.change}% vs {label}
    </span>
  );
}

// Action item row
function ActionItemRow({ item }: { item: ActionItem }) {
  const icons = {
    warning: <AlertTriangle className="h-4 w-4 text-amber-500" />,
    insight: <Lightbulb className="h-4 w-4 text-blue-500" />,
    success: <CheckCircle className="h-4 w-4 text-green-500" />,
    urgent: <AlertCircle className="h-4 w-4 text-red-500" />,
  };

  const bgColors = {
    warning: 'bg-amber-50',
    insight: 'bg-blue-50',
    success: 'bg-green-50',
    urgent: 'bg-red-50',
  };

  return (
    <div className={`flex items-center gap-3 p-3 rounded-md ${bgColors[item.type]}`}>
      {icons[item.type]}
      <p className="text-sm text-slate-700 flex-1">{item.description}</p>
      {item.metric && (
        <span className="text-xs font-medium text-slate-500 bg-white px-2 py-1 rounded">
          {item.metric}
        </span>
      )}
      {item.link && (
        <Link href={item.link} className="text-slate-400 hover:text-slate-600">
          <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const range = (params.range as TimeRange) || '7d';

  // ── 10s timeout per query, empty fallback prevents infinite hang ──
  const QUERY_TIMEOUT = 10_000;

  const emptyStats = {
    totalClicks: 0, totalClicksInRange: 0, totalRevenue: 0, activeLinks: 0,
    conversionRate: '0.00', recentClicks: [], clicksOverTime: [], topLinks: [],
    geoStats: [], topPages: [], deviceStats: { mobile: 0, desktop: 0, tablet: 0, mobilePercent: 0, desktopPercent: 0, tabletPercent: 0 },
    funnelData: { clicks: 0, conversions: 0, approvedConversions: 0, approvedRevenue: 0 },
    scrollDepthStats: [], averageScrollDepth: 0, problemArticles: [],
    clicksComparison: { current: 0, previous: 0, change: 0, trend: 'neutral' as const },
    revenueComparison: { current: 0, previous: 0, change: 0, trend: 'neutral' as const },
    leadsComparison: { current: 0, previous: 0, change: 0, trend: 'neutral' as const },
    actionItems: [], leadQuality: { totalLeads: 0, avgEngagementScore: 0, highQualityLeads: 0, conversionPotential: 0 },
    revenueInRange: 0, leadsInRange: 0,
  };

  const emptyAlertStats = { totalLowPerformancePages: 0, criticalPages: 0, warningPages: 0, potentialLostRevenue: 0 };
  const emptyMarkets: GlobalMarketIntelligence = { markets: [], opportunities: [], leaderMarket: 'US', totalGlobalRevenue: 0, totalGlobalClicks: 0 };

  const [stats, lowPerformancePages, performanceAlertStats, globalMarkets] = await Promise.all([
    withTimeout(getDashboardStats(range), QUERY_TIMEOUT, emptyStats),
    withTimeout(getLowPerformancePages(), QUERY_TIMEOUT, []),
    withTimeout(getPerformanceAlertStats(), QUERY_TIMEOUT, emptyAlertStats),
    withTimeout(getGlobalMarketIntelligence(range), QUERY_TIMEOUT, emptyMarkets),
  ]);

  const rangeLabels: Record<TimeRange, string> = {
    '24h': 'last 24 hours',
    '7d': 'last 7 days',
    '30d': 'last 30 days',
    'all': 'all time',
  };

  const comparisonLabels: Record<TimeRange, string> = {
    '24h': 'yesterday',
    '7d': 'last week',
    '30d': 'last month',
    'all': 'previous',
  };

  // Formatters
  const formatNumber = (n: number) => n.toLocaleString('en-US');
  const formatCurrency = (n: number) => new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(n);

  const epc = stats.totalClicks > 0 ? (stats.totalRevenue / stats.totalClicks).toFixed(2) : '0.00';

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
            <p className="text-sm text-slate-500 mt-1">
              Overview for {rangeLabels[range]}
            </p>
          </div>
          <Suspense fallback={<Skeleton className="h-10 w-32" />}>
            <TimeRangeSelector />
          </Suspense>
        </div>

        {/* Stats Grid - 4 columns */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Revenue */}
          <div className={card}>
            <div className="p-6">
              <p className="text-sm font-medium text-slate-500 mb-1">Revenue</p>
              <p className="text-3xl font-semibold text-slate-900 tabular-nums">
                {formatCurrency(stats.revenueInRange)}
              </p>
              <div className="mt-2">
                <TrendIndicator comparison={stats.revenueComparison} label={comparisonLabels[range]} />
              </div>
            </div>
          </div>

          {/* Clicks */}
          <div className={card}>
            <div className="p-6">
              <p className="text-sm font-medium text-slate-500 mb-1">Clicks</p>
              <p className="text-3xl font-semibold text-slate-900 tabular-nums">
                {formatNumber(stats.totalClicksInRange)}
              </p>
              <div className="mt-2">
                <TrendIndicator comparison={stats.clicksComparison} label={comparisonLabels[range]} />
              </div>
            </div>
          </div>

          {/* Leads */}
          <div className={card}>
            <div className="p-6">
              <p className="text-sm font-medium text-slate-500 mb-1">Leads</p>
              <p className="text-3xl font-semibold text-slate-900 tabular-nums">
                {formatNumber(stats.leadsInRange)}
              </p>
              <div className="mt-2">
                <TrendIndicator comparison={stats.leadsComparison} label={comparisonLabels[range]} />
              </div>
            </div>
          </div>

          {/* EPC */}
          <div className={card}>
            <div className="p-6">
              <p className="text-sm font-medium text-slate-500 mb-1">Earnings Per Click</p>
              <p className="text-3xl font-semibold text-slate-900 tabular-nums">
                ${epc}
              </p>
              <div className="mt-2">
                <span className="text-sm text-slate-400">Average across all links</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Items */}
        {stats.actionItems.length > 0 && (
          <div className={`${card} mb-8`}>
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-900">Action Items</h2>
            </div>
            <div className="p-4 space-y-2">
              {stats.actionItems.map((item) => (
                <ActionItemRow key={item.id} item={item} />
              ))}
            </div>
          </div>
        )}

        {/* Performance Alerts */}
        {lowPerformancePages.length > 0 && (
          <div className="mb-8">
            <Suspense fallback={<Skeleton className="h-32" />}>
              <PerformanceAlerts pages={lowPerformancePages} stats={performanceAlertStats} />
            </Suspense>
          </div>
        )}

        {/* System Integrity + CWV + Revenue Attribution + Audit — 3-column grid */}
        <div className="grid gap-6 lg:grid-cols-3 mb-8">
          <div className="lg:col-span-2">
            <Suspense fallback={<Skeleton className="h-64" />}>
              <SystemIntegrityWidget />
            </Suspense>
          </div>
          <div className="flex flex-col gap-6">
            <Suspense fallback={<Skeleton className="h-48" />}>
              <WebVitalsWidget />
            </Suspense>
            <Suspense fallback={<Skeleton className="h-48" />}>
              <RevenueAttributionWidget />
            </Suspense>
            {/* S2S Postback Dedup Audit Status */}
            <AuditStatusWidget />
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-3 mb-8">
          {/* Click Activity */}
          <div className={`${card} lg:col-span-2`}>
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">Click Activity</h3>
            </div>
            <div className="p-6">
              <Suspense fallback={<Skeleton className="h-52" />}>
                <ClicksChart data={stats.clicksOverTime} />
              </Suspense>
            </div>
          </div>

          {/* Funnel */}
          <div className={card}>
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">Conversion Funnel</h3>
            </div>
            <div className="p-6">
              <Suspense fallback={<Skeleton className="h-52" />}>
                <ConversionFunnel
                  totalClicks={stats.funnelData.clicks}
                  stages={[
                    { event_type: 'qualified', unique_clicks: stats.funnelData.conversions, conversion_rate: stats.funnelData.clicks > 0 ? (stats.funnelData.conversions / stats.funnelData.clicks) * 100 : 0, total_value: 0 },
                    { event_type: 'approved', unique_clicks: stats.funnelData.approvedConversions, conversion_rate: stats.funnelData.conversions > 0 ? (stats.funnelData.approvedConversions / stats.funnelData.conversions) * 100 : 0, total_value: stats.funnelData.approvedRevenue },
                  ]}
                />
              </Suspense>
            </div>
          </div>
        </div>

        {/* Global Market Intelligence */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
              <Globe className="h-4 w-4 text-slate-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Global Market Health</h2>
              <p className="text-xs text-slate-500">Performance across core markets</p>
            </div>
            {globalMarkets.leaderMarket && (
              <span className="ml-auto px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-medium">
                🏆 {globalMarkets.leaderMarket} leads in ROI
              </span>
            )}
          </div>
          <Suspense fallback={<Skeleton className="h-48" />}>
            <MarketHealthGrid markets={globalMarkets.markets} />
          </Suspense>
        </div>

        {/* Market Opportunities */}
        {globalMarkets.opportunities.length > 0 && (
          <div className={`${card} mb-8`}>
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">Market Opportunities</h3>
              <p className="text-xs text-slate-500 mt-0.5">Actionable insights for regional optimization</p>
            </div>
            <div className="p-4">
              <MarketOpportunities opportunities={globalMarkets.opportunities} />
            </div>
          </div>
        )}

        {/* Geographic Distribution + Click Details */}
        <div className="grid gap-6 lg:grid-cols-3 mb-8">
          {/* World Map */}
          <div className={card}>
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">Geographic Distribution</h3>
            </div>
            <div className="p-6">
              <Suspense fallback={<Skeleton className="h-48" />}>
                <WorldMap data={stats.geoStats} />
              </Suspense>
            </div>
          </div>

          {/* Click Details Table */}
          <div className={`${card} lg:col-span-2`}>
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">Click Details</h3>
              <p className="text-xs text-slate-500 mt-0.5">Country, referrer domain, and source page for each click</p>
            </div>
            <div className="p-4 max-h-[400px] overflow-y-auto">
              <Suspense fallback={<Skeleton className="h-48" />}>
                <ClickDetailsTable clicks={stats.recentClicks} />
              </Suspense>
            </div>
          </div>
        </div>

        {/* Links, Pages, Devices, Activity */}
        <div className="grid gap-6 lg:grid-cols-4 mb-8">
          {/* Top Links */}
          <div className={card}>
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">Top Links</h3>
            </div>
            <div className="p-6">
              <Suspense fallback={<Skeleton className="h-40" />}>
                <TopLinksLive links={stats.topLinks} />
              </Suspense>
            </div>
          </div>

          {/* Top Pages */}
          <div className={card}>
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">Top Pages</h3>
            </div>
            <div className="p-6">
              <Suspense fallback={<Skeleton className="h-40" />}>
                <TopPages data={stats.topPages} />
              </Suspense>
            </div>
          </div>

          {/* Devices */}
          <div className={card}>
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">Devices</h3>
            </div>
            <div className="p-6">
              <Suspense fallback={<Skeleton className="h-40" />}>
                <DeviceChart data={stats.deviceStats} />
              </Suspense>
            </div>
          </div>

          {/* Recent Activity */}
          <div className={card}>
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Recent Activity</h3>
              <span className="w-2 h-2 rounded-full bg-green-500" />
            </div>
            <div className="p-6">
              <Suspense fallback={<Skeleton className="h-40" />}>
                <RecentClicksLive clicks={stats.recentClicks} />
              </Suspense>
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          {/* Optimization */}
          <div className={card}>
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">Optimization Opportunities</h3>
              <p className="text-xs text-slate-500 mt-0.5">Articles with high engagement but low CTR</p>
            </div>
            <div className="p-6">
              <Suspense fallback={<Skeleton className="h-40" />}>
                <ProblemArticles data={stats.problemArticles} />
              </Suspense>
            </div>
          </div>

          {/* Key Metrics */}
          <div className={card}>
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">Key Metrics</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Lead Quality Score</p>
                  <p className="text-2xl font-semibold text-slate-900 tabular-nums">
                    {stats.leadQuality.avgEngagementScore}%
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {stats.leadQuality.highQualityLeads} high-quality leads
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Conversion Rate</p>
                  <p className="text-2xl font-semibold text-slate-900 tabular-nums">
                    {stats.conversionRate}%
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Click to sale</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Avg Scroll Depth</p>
                  <p className="text-2xl font-semibold text-slate-900 tabular-nums">
                    {stats.averageScrollDepth}%
                  </p>
                  <p className="text-xs text-slate-400 mt-1">User engagement</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Active Links</p>
                  <p className="text-2xl font-semibold text-slate-900 tabular-nums">
                    {stats.activeLinks}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Tracking enabled</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Depth */}
        <div className={card}>
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900">Scroll Depth by Article</h3>
          </div>
          <div className="p-6">
            <Suspense fallback={<Skeleton className="h-40" />}>
              <ScrollDepthStats
                data={stats.scrollDepthStats}
                averageScrollDepth={stats.averageScrollDepth}
              />
            </Suspense>
          </div>
        </div>

      </div>
    </div>
  );
}
