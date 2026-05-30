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
import { LiveDashboardBar } from '@/components/dashboard/live-dashboard-bar';
import { LiveClicksFeed } from '@/components/dashboard/live-clicks-feed';
import { PageHeader, StatCard, FilterBar } from '@/components/dashboard/ui';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface AnalyticsPageProps {
  searchParams: Promise<{ range?: string; silo?: string }>;
}

export default async function AnalyticsPage({ searchParams }: AnalyticsPageProps) {
  const params = await searchParams;
  const range = (params.range as TimeRange) || '7d';
  const silo = params.silo || 'all';
  const stats = await getAnalyticsStats(range, silo);

  const rangeLabels: Record<TimeRange, string> = {
    '24h': 'last 24 hours',
    '7d': 'last 7 days',
    '30d': 'last 30 days',
    'all': 'all time',
  };

  return (
    <div className="space-y-6">
      {/* Live Stats Bar — real-time active visitors, today's PVs + clicks */}
      <LiveDashboardBar />

      {/* Page Header */}
      <PageHeader
        icon={BarChart3}
        title="Traffic Analytics"
        description={`Detailed traffic analysis for ${rangeLabels[range]}${silo !== 'all' ? ` • ${silo.replace(/-/g, ' ')}` : ''}`}
        actions={
          <FilterBar>
            <SimulationButton />
            <SiloFilterDropdown currentSilo={silo} />
            <WidgetErrorBoundary label="Time Range" minHeight="h-10">
              <Suspense fallback={<div className="h-10 w-40 bg-slate-200 animate-pulse rounded-lg" />}>
                <TimeRangeSelector />
              </Suspense>
            </WidgetErrorBoundary>
          </FilterBar>
        }
      />

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
        <StatCard
          label="Page Views"
          value={stats.overview.pageViewsInRange.toLocaleString('en-US')}
          subtext={`${stats.overview.totalPageViews.toLocaleString('en-US')} total`}
          icon={FileText}
          tone="green"
        />
        <StatCard
          label="Unique Sessions"
          value={stats.overview.uniqueSessions.toLocaleString('en-US')}
          subtext="unique visitors"
          icon={Users}
          tone="blue"
        />
        <StatCard
          label="Avg. Time on Page"
          value={`${Math.floor(stats.overview.avgTimeOnPage / 60)}:${(stats.overview.avgTimeOnPage % 60).toString().padStart(2, '0')}`}
          subtext="min:sec"
          icon={Clock}
          tone="navy"
        />
        <StatCard
          label="Avg. Scroll Depth"
          value={`${stats.overview.avgScrollDepth}%`}
          subtext="of page content"
          icon={ScrollText}
          tone="amber"
        />
        <StatCard
          label="Bounce Rate"
          value={`${stats.overview.bounceRate}%`}
          subtext="single page visits"
          icon={TrendingDown}
          tone="red"
        />
      </div>

      {/* Traffic Chart + Live Clicks Feed */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="dashboard-card overflow-hidden lg:col-span-2">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-slate-400" />
            <h3 className="font-semibold text-slate-800">Traffic Over Time</h3>
          </div>
          <div className="p-6">
            <TrafficChart data={stats.pageViewsOverTime} />
          </div>
        </div>
        <LiveClicksFeed />
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
