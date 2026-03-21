import { Suspense } from 'react';
import {
  BarChart3,
  Users,
  Clock,
  ScrollText,
  TrendingDown,
  Globe,
  Monitor,
  FileText,
  Target,
  Link2,
  ArrowUpRight,
  ChevronDown,
} from 'lucide-react';
import { getAnalyticsStats } from '@/lib/actions/analytics';
import { TimeRange } from '@/lib/actions/dashboard';
import { TimeRangeSelector } from '@/components/dashboard/time-range-selector';
import { SimulationButton } from '@/components/dashboard/simulation-button';
import { TrafficChart } from '@/components/dashboard/traffic-chart';
import { TrafficSources } from '@/components/dashboard/traffic-sources';
import { BrowserOSStats } from '@/components/dashboard/browser-os-stats';
import { LandingPagesTable } from '@/components/dashboard/landing-pages-table';
import { UTMCampaignsTable } from '@/components/dashboard/utm-campaigns-table';
import { ReferrersList } from '@/components/dashboard/referrers-list';
import { SiloFilterDropdown } from '@/components/dashboard/silo-filter-dropdown';
import { WidgetErrorBoundary } from '@/components/dashboard/widget-error-boundary';
import { GSCOverview } from '@/components/dashboard/gsc-overview';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface AnalyticsPageProps {
  searchParams: Promise<{ range?: string; silo?: string }>;
}

// Stat card icon colors
const iconStyles = {
  pageViews: 'bg-emerald-50 text-emerald-500',
  sessions: 'bg-blue-50 text-blue-500',
  time: 'bg-purple-50 text-purple-500',
  scroll: 'bg-amber-50 text-amber-500',
  bounce: 'bg-red-50 text-red-500',
};

export default async function AnalyticsPage({ searchParams }: AnalyticsPageProps) {
  const params = await searchParams;
  const range = (params.range as TimeRange) || '7d';
  const silo = params.silo || 'all';
  const stats = await getAnalyticsStats(range);

  const rangeLabels: Record<TimeRange, string> = {
    '24h': 'last 24 hours',
    '7d': 'last 7 days',
    '30d': 'last 30 days',
    'all': 'all time',
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-slate-400" />
            Traffic Analytics
          </h1>
          <p className="text-slate-500 mt-1">
            Detailed traffic analysis for {rangeLabels[range]} {silo !== 'all' && `• ${silo.replace(/-/g, ' ')}`}
          </p>
        </div>
        <div className="flex items-center gap-3 relative">
          <SimulationButton />
          <SiloFilterDropdown currentSilo={silo} />
          <WidgetErrorBoundary label="Time Range" minHeight="h-10">
            <Suspense fallback={<div className="h-10 w-40 bg-slate-200 animate-pulse rounded-lg" />}>
              <TimeRangeSelector />
            </Suspense>
          </WidgetErrorBoundary>
        </div>
      </div>

      {/* Google Search Console — Real Search Data */}
      <WidgetErrorBoundary label="Google Search Console" minHeight="h-32">
        <Suspense fallback={<div className="dashboard-card p-12 flex items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" /><span className="ml-3 text-slate-500">GSC-Daten laden…</span></div>}>
          <GSCOverview />
        </Suspense>
      </WidgetErrorBoundary>

      {/* Divider */}
      <div className="border-t border-slate-200 pt-2">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-slate-400" />
          On-Site Analytics
          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: '#fef3c7', color: '#92400e' }}>
            Eigenes Tracking
          </span>
        </h2>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {/* Page Views */}
        <div className="dashboard-card p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500">Page Views</p>
              <p className="text-3xl font-semibold text-slate-800 mt-1">
                {stats.overview.pageViewsInRange.toLocaleString('en-US')}
              </p>
              <p className="text-sm text-slate-400 mt-2">
                {stats.overview.totalPageViews.toLocaleString('en-US')} total
              </p>
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconStyles.pageViews}`}>
              <FileText className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Unique Sessions */}
        <div className="dashboard-card p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500">Unique Sessions</p>
              <p className="text-3xl font-semibold text-slate-800 mt-1">
                {stats.overview.uniqueSessions.toLocaleString('en-US')}
              </p>
              <p className="text-sm text-slate-400 mt-2">unique visitors</p>
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconStyles.sessions}`}>
              <Users className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Avg Time on Page */}
        <div className="dashboard-card p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500">Avg. Time on Page</p>
              <p className="text-3xl font-semibold text-slate-800 mt-1">
                {Math.floor(stats.overview.avgTimeOnPage / 60)}:
                {(stats.overview.avgTimeOnPage % 60).toString().padStart(2, '0')}
              </p>
              <p className="text-sm text-slate-400 mt-2">min:sec</p>
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconStyles.time}`}>
              <Clock className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Avg Scroll Depth */}
        <div className="dashboard-card p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500">Avg. Scroll Depth</p>
              <p className="text-3xl font-semibold text-slate-800 mt-1">
                {stats.overview.avgScrollDepth}%
              </p>
              <p className="text-sm text-slate-400 mt-2">of page content</p>
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconStyles.scroll}`}>
              <ScrollText className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Bounce Rate */}
        <div className="dashboard-card p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500">Bounce Rate</p>
              <p className="text-3xl font-semibold text-slate-800 mt-1">
                {stats.overview.bounceRate}%
              </p>
              <p className="text-sm text-slate-400 mt-2">single page visits</p>
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconStyles.bounce}`}>
              <TrendingDown className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Traffic Chart */}
      <div className="dashboard-card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-slate-400" />
          <h3 className="font-semibold text-slate-800">Traffic Over Time</h3>
        </div>
        <div className="p-6">
          <TrafficChart data={stats.pageViewsOverTime} />
        </div>
      </div>

      {/* Traffic Sources + Referrers */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="dashboard-card overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <Globe className="h-5 w-5 text-slate-400" />
            <h3 className="font-semibold text-slate-800">Traffic Sources</h3>
          </div>
          <div className="p-6">
            <TrafficSources data={stats.trafficSources} />
          </div>
        </div>

        <div className="dashboard-card overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <Link2 className="h-5 w-5 text-slate-400" />
            <h3 className="font-semibold text-slate-800">Top Referrers</h3>
          </div>
          <div className="p-6">
            <ReferrersList data={stats.referrers} />
          </div>
        </div>
      </div>

      {/* Browser & OS Stats */}
      <div className="dashboard-card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <Monitor className="h-5 w-5 text-slate-400" />
          <h3 className="font-semibold text-slate-800">Technology</h3>
        </div>
        <div className="p-6">
          <BrowserOSStats browserStats={stats.browserStats} osStats={stats.osStats} />
        </div>
      </div>

      {/* UTM Campaigns */}
      <div className="dashboard-card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <Target className="h-5 w-5 text-slate-400" />
          <div>
            <h3 className="font-semibold text-slate-800">UTM Campaigns</h3>
            <p className="text-sm text-slate-500 mt-0.5">
              Track performance of your marketing campaigns
            </p>
          </div>
        </div>
        <div className="p-6">
          <UTMCampaignsTable data={stats.utmStats} />
        </div>
      </div>

      {/* Landing Pages */}
      <div className="dashboard-card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <ArrowUpRight className="h-5 w-5 text-slate-400" />
          <div>
            <h3 className="font-semibold text-slate-800">Landing Page Performance</h3>
            <p className="text-sm text-slate-500 mt-0.5">
              First pages visitors see when entering your site
            </p>
          </div>
        </div>
        <div className="p-6">
          <LandingPagesTable data={stats.landingPages} />
        </div>
      </div>
    </div>
  );
}
