'use client';

import {
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Activity,
  Shield,
  Zap,
  BarChart3,
  FileText,
  DollarSign,
  Search,
  Link2,
  Telescope,
  Radar,
  ChevronRight,
  Users,
  MousePointerClick,
  Wallet,
  Target,
} from 'lucide-react';
import Link from 'next/link';
import type { TimeComparison, TimeRange, TimeSeriesData, GlobalMarketIntelligence, MarketPerformance } from '@/lib/actions/dashboard';
import type { DeployStats } from '@/lib/actions/deploy-logs';
import { WidgetErrorBoundary } from '@/components/dashboard/widget-error-boundary';
import {
  computeWidgetHealth,
  STATUS_LABEL,
  type SystemStatus,
} from '@/lib/dashboard/status';

// ── Types ──────────────────────────────────────────────────────

interface PerformanceAlertStats {
  totalLowPerformancePages: number;
  criticalPages: number;
  warningPages: number;
  potentialLostRevenue: number;
}

interface ExecutiveOverviewProps {
  stats: {
    revenueInRange: number;
    totalClicksInRange: number;
    leadsInRange: number;
    totalRevenue: number;
    totalClicks: number;
    revenueComparison: TimeComparison;
    clicksComparison: TimeComparison;
    leadsComparison: TimeComparison;
    conversionRate: string;
    clicksOverTime: TimeSeriesData[];
  };
  globalMarkets: GlobalMarketIntelligence;
  deployStats: DeployStats;
  cronHealth: {
    source: 'live' | 'empty';
    healthy: number;
    warning: number;
    stale: number;
    errors: number;
    neverRun: number;
    totalJobs: number;
    lastObservedAt: string | null;
    lastSuccessfulAt: string | null;
  };
  webVitalsHealth: {
    source: 'live' | 'empty';
    sampleSize: number;
    poorCount: number;
    warningCount: number;
    lastRecordedAt: string | null;
  };
  alertStats: PerformanceAlertStats;
  range: TimeRange;
  comparisonLabel: string;
}

// ── Helpers ────────────────────────────────────────────────────

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

// ── Trend Badge ────────────────────────────────────────────────

function TrendBadge({ comparison, label }: { comparison: TimeComparison; label: string }) {
  if (comparison.trend === 'neutral' || comparison.change === 0) {
    return <span className="text-[11px] text-slate-400 mt-1 block">No change vs {label}</span>;
  }

  const isUp = comparison.trend === 'up';
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-medium mt-1 ${isUp ? 'text-emerald-600' : 'text-red-500'}`}>
      {isUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {Math.abs(comparison.change)}% vs {label}
    </span>
  );
}

// ── Mini Sparkline ─────────────────────────────────────────────

function MiniSparkline({ data, color = 'var(--sfp-navy)' }: { data: number[]; color?: string }) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const w = 80;
  const h = 24;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  });

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="opacity-40">
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ── Status Row ─────────────────────────────────────────────────

function StatusRow({
  icon: Icon,
  label,
  status,
  detail,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  status: SystemStatus;
  detail: string;
  href: string;
}) {
  const dotColor = status === 'operational'
    ? 'bg-emerald-500'
    : status === 'degraded' || status === 'stale'
      ? 'bg-amber-500'
      : status === 'down'
        ? 'bg-red-500'
        : 'bg-slate-400';

  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors group"
    >
      <Icon className="h-4 w-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
      <span className="text-xs font-medium text-slate-700 flex-1">{label}</span>
      <span className={`w-2 h-2 rounded-full ${dotColor}`} />
      <span className="text-[11px] text-slate-400 group-hover:text-slate-600 transition-colors">{detail}</span>
      <ChevronRight className="h-3 w-3 text-slate-300 group-hover:text-slate-500 transition-colors" />
    </Link>
  );
}

// ── Quick Nav Card ─────────────────────────────────────────────

function QuickNavCard({
  icon: Icon,
  label,
  href,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  accent: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-2 p-3 rounded-xl border border-slate-100 bg-white
                 hover:shadow-md hover:scale-105 hover:border-slate-200
                 transition-all duration-200 group"
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
        style={{ background: accent }}
      >
        <Icon className="h-4 w-4 text-white" />
      </div>
      <span className="text-[11px] font-medium text-slate-600 group-hover:text-slate-900 transition-colors">
        {label}
      </span>
    </Link>
  );
}

// ── Market Bar ─────────────────────────────────────────────────

function MarketBar({ market, maxRevenue }: { market: MarketPerformance; maxRevenue: number }) {
  const share = maxRevenue > 0 ? (market.revenue / maxRevenue) * 100 : 0;

  return (
    <div className="flex items-center gap-3">
      <span className="text-base">{market.flag}</span>
      <span className="text-xs font-semibold text-slate-700 w-6">{market.market}</span>
      <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${Math.max(share, 3)}%`, background: 'var(--sfp-navy)' }}
        />
      </div>
      <span className="text-xs font-semibold text-slate-700 tabular-nums w-16 text-right">
        {formatCurrency(market.revenue)}
      </span>
      {market.revenueTrend !== 'neutral' && (
        <span className={`text-[10px] font-medium tabular-nums w-10 text-right ${
          market.revenueTrend === 'up' ? 'text-emerald-600' : 'text-red-500'
        }`}>
          {market.revenueTrend === 'up' ? '+' : ''}{market.revenueChange}%
        </span>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────

export function ExecutiveOverview({
  stats,
  globalMarkets,
  deployStats,
  cronHealth,
  webVitalsHealth,
  alertStats,
  range,
  comparisonLabel,
}: ExecutiveOverviewProps) {
  const epc = stats.totalClicks > 0
    ? (stats.totalRevenue / stats.totalClicks).toFixed(2)
    : '0.00';

  const sparklineValues = stats.clicksOverTime.map((d) => d.clicks);
  const maxMarketRevenue = Math.max(...globalMarkets.markets.map((m) => m.revenue), 1);

  const alertCount = alertStats.totalLowPerformancePages;
  const hasCritical = alertStats.criticalPages > 0;
  const deployStatus = computeDeployStatus(deployStats);
  const cronStatus = computeCronStatus(cronHealth);
  const revenueStatus = computeRevenueStatus(stats);
  const webVitalsStatus = computeWebVitalsStatus(webVitalsHealth);
  const alertStatus: SystemStatus = hasCritical ? 'down' : alertCount > 0 ? 'degraded' : 'operational';
  const overallStatus = computeOverallStatus([
    deployStatus,
    cronStatus,
    revenueStatus,
    webVitalsStatus,
    alertStatus,
  ]);
  const overallPill = getOverallPill(overallStatus);
  const deployDetail = getDeployDetail(deployStats, deployStatus);
  const cronDetail = getCronDetail(cronHealth, cronStatus);
  const webVitalsDetail = getWebVitalsDetail(webVitalsHealth, webVitalsStatus);
  const revenueDetail = getRevenueDetail(stats, revenueStatus);

  const rangeLabels: Record<TimeRange, string> = {
    '24h': 'Last 24 Hours',
    '7d': 'Last 7 Days',
    '30d': 'Last 30 Days',
    'all': 'All Time',
  };

  return (
    <WidgetErrorBoundary label="Executive Overview" minHeight="h-64">
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden mb-8">
      {/* Gradient accent bar */}
      <div className="h-1" style={{ background: 'linear-gradient(90deg, var(--sfp-navy) 0%, var(--sfp-gold) 100%)' }} />

      <div className="p-6 lg:p-8">
        {/* ── Header ──────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-7">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-slate-900 tracking-tight">
              Command Center
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Platform Intelligence · {rangeLabels[range]}
            </p>
          </div>
          <div className={`flex items-center gap-2.5 px-3 py-1.5 rounded-full ${overallPill.wrapperClass}`}>
            <span className="relative flex h-2 w-2">
              <span className={`animate-pulse absolute inline-flex h-full w-full rounded-full ${overallPill.pulseClass} opacity-75`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${overallPill.dotClass}`} />
            </span>
            <span className={`text-[11px] font-medium ${overallPill.textClass}`}>{overallPill.label}</span>
          </div>
        </div>

        {/* ── KPI Cards ───────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Revenue */}
          <div className="relative bg-gradient-to-br from-slate-50 to-white rounded-xl p-5 border border-slate-100 overflow-hidden">
            <div className="absolute top-3 right-3 opacity-30">
              <MiniSparkline data={sparklineValues} color="var(--sfp-green)" />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--sfp-green)' }}>
                <Wallet className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Revenue</span>
            </div>
            <p className="text-2xl lg:text-3xl font-bold text-slate-900 tabular-nums">
              {formatCurrency(stats.revenueInRange)}
            </p>
            <TrendBadge comparison={stats.revenueComparison} label={comparisonLabel} />
          </div>

          {/* Clicks */}
          <div className="relative bg-gradient-to-br from-slate-50 to-white rounded-xl p-5 border border-slate-100 overflow-hidden">
            <div className="absolute top-3 right-3 opacity-30">
              <MiniSparkline data={sparklineValues} color="var(--sfp-navy)" />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--sfp-navy)' }}>
                <MousePointerClick className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Clicks</span>
            </div>
            <p className="text-2xl lg:text-3xl font-bold text-slate-900 tabular-nums">
              {formatNumber(stats.totalClicksInRange)}
            </p>
            <TrendBadge comparison={stats.clicksComparison} label={comparisonLabel} />
          </div>

          {/* Leads */}
          <div className="relative bg-gradient-to-br from-slate-50 to-white rounded-xl p-5 border border-slate-100 overflow-hidden">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--sfp-gold)' }}>
                <Users className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Leads</span>
            </div>
            <p className="text-2xl lg:text-3xl font-bold text-slate-900 tabular-nums">
              {formatNumber(stats.leadsInRange)}
            </p>
            <TrendBadge comparison={stats.leadsComparison} label={comparisonLabel} />
          </div>

          {/* EPC */}
          <div className="relative bg-gradient-to-br from-slate-50 to-white rounded-xl p-5 border border-slate-100 overflow-hidden">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--sfp-navy)' }}>
                <Target className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Earnings / Click</span>
            </div>
            <p className="text-2xl lg:text-3xl font-bold text-slate-900 tabular-nums">
              ${epc}
            </p>
            <span className="text-[11px] text-slate-400 mt-1 block">
              {stats.conversionRate}% conversion rate
            </span>
          </div>
        </div>

        {/* ── Market Share + Platform Pulse ────────────────────── */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Market Share */}
          <div className="rounded-xl border border-slate-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Market Performance
              </h3>
              {globalMarkets.leaderMarket && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                      style={{ background: 'var(--sfp-sky)', color: 'var(--sfp-navy)' }}>
                  🏆 {globalMarkets.leaderMarket} leads
                </span>
              )}
            </div>

            {globalMarkets.markets.length > 0 ? (
              <div className="space-y-3">
                {globalMarkets.markets
                  .sort((a, b) => b.revenue - a.revenue)
                  .map((market) => (
                    <MarketBar key={market.market} market={market} maxRevenue={maxMarketRevenue} />
                  ))}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Total Revenue</span>
                  <span className="text-sm font-bold text-slate-900 tabular-nums">
                    {formatCurrency(globalMarkets.totalGlobalRevenue)}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-4">No market data available</p>
            )}
          </div>

          {/* Platform Pulse */}
          <div className="rounded-xl border border-slate-100 p-5">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
              Platform Pulse
            </h3>
            <div className="space-y-0.5">
              <StatusRow
                icon={Zap}
                label="Deploy Pipeline"
                status={deployStatus}
                detail={deployDetail}
                href="/dashboard"
              />
              <StatusRow
                icon={Shield}
                label="Cron Health"
                status={cronStatus}
                detail={cronDetail}
                href="/dashboard/cron-health"
              />
              <StatusRow
                icon={Activity}
                label="Web Vitals"
                status={webVitalsStatus}
                detail={webVitalsDetail}
                href="/dashboard/web-vitals"
              />
              <StatusRow
                icon={Shield}
                label="Performance Alerts"
                status={alertStatus}
                detail={alertCount > 0 ? `${alertCount} page${alertCount !== 1 ? 's' : ''}` : 'All clear'}
                href="/dashboard/analytics"
              />
              <StatusRow
                icon={TrendingUp}
                label="Revenue Pipeline"
                status={revenueStatus}
                detail={revenueDetail}
                href="/dashboard/revenue"
              />
            </div>
          </div>
        </div>

        {/* ── Quick Navigation ────────────────────────────────── */}
        <div>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Quick Navigation
          </h3>
          <div className="grid grid-cols-4 lg:grid-cols-8 gap-2">
            <QuickNavCard icon={BarChart3} label="Analytics" href="/dashboard/analytics" accent="var(--sfp-navy)" />
            <QuickNavCard icon={DollarSign} label="Revenue" href="/dashboard/revenue" accent="var(--sfp-green)" />
            <QuickNavCard icon={FileText} label="Content" href="/dashboard/content/hub" accent="var(--sfp-navy)" />
            <QuickNavCard icon={Search} label="Rankings" href="/dashboard/ranking" accent="#6366F1" />
            <QuickNavCard icon={Link2} label="Links" href="/dashboard/links" accent="var(--sfp-gold)" />
            <QuickNavCard icon={Telescope} label="Opportunities" href="/dashboard/opportunities" accent="var(--sfp-green)" />
            <QuickNavCard icon={Radar} label="Competitors" href="/dashboard/competitors" accent="#8B5CF6" />
            <QuickNavCard icon={Shield} label="Compliance" href="/dashboard/compliance" accent="var(--sfp-navy)" />
          </div>
        </div>
      </div>
    </div>
    </WidgetErrorBoundary>
  );
}

function computeDeployStatus(deployStats: DeployStats): SystemStatus {
  const lastSuccessfulAt = deployStats.recentDeploys.find((deploy) => deploy.status === 'success')?.deployed_at ?? null;
  const errorState = deployStats.lastDeploy && deployStats.lastDeploy.status !== 'success'
    ? deployStats.lastDeploy.status
    : null;

  const baseStatus = computeWidgetHealth({
    source: deployStats.source === 'live' ? 'live' : 'cached',
    lastSuccessfulAt,
    maxAgeMinutes: 7 * 24 * 60,
    errorState,
    sampleSize: deployStats.totalDeploys,
  });

  return deployStats.source === 'empty' ? 'never-run' : baseStatus;
}

function computeCronStatus(cronHealth: ExecutiveOverviewProps['cronHealth']): SystemStatus {
  if (cronHealth.source === 'empty') return 'never-run';
  if (cronHealth.errors > 0) return 'down';
  if (cronHealth.stale > 0) return 'stale';
  if (cronHealth.warning > 0) return 'degraded';
  if (cronHealth.neverRun === cronHealth.totalJobs) return 'never-run';
  if (cronHealth.neverRun > 0) return 'degraded';

  const baseStatus = computeWidgetHealth({
    source: 'live',
    lastSuccessfulAt: cronHealth.lastSuccessfulAt ?? cronHealth.lastObservedAt,
    maxAgeMinutes: 24 * 60,
    errorState: null,
    sampleSize: cronHealth.healthy + cronHealth.warning + cronHealth.stale + cronHealth.errors + cronHealth.neverRun,
  });

  return baseStatus;
}

function computeRevenueStatus(stats: ExecutiveOverviewProps['stats']): SystemStatus {
  const hasObservedPipeline = stats.totalClicks > 0 || stats.totalRevenue > 0;
  const baseStatus = computeWidgetHealth({
    source: 'live',
    lastSuccessfulAt: hasObservedPipeline ? new Date().toISOString() : null,
    maxAgeMinutes: 60,
    errorState: stats.totalClicks > 0 && stats.totalRevenue === 0 ? 'no-revenue' : null,
    sampleSize: stats.totalClicks,
  });

  return baseStatus;
}

function computeWebVitalsStatus(webVitalsHealth: ExecutiveOverviewProps['webVitalsHealth']): SystemStatus {
  const baseStatus = computeWidgetHealth({
    source: webVitalsHealth.source === 'live' ? 'live' : 'cached',
    lastSuccessfulAt: webVitalsHealth.lastRecordedAt,
    maxAgeMinutes: 24 * 60,
    errorState: null,
    sampleSize: webVitalsHealth.sampleSize,
  });

  if (baseStatus !== 'operational') return baseStatus;
  if (webVitalsHealth.poorCount > 0) return 'down';
  if (webVitalsHealth.warningCount > 0) return 'degraded';
  return 'operational';
}

function computeOverallStatus(statuses: SystemStatus[]): SystemStatus {
  if (statuses.some((status) => status === 'down')) return 'down';
  if (statuses.some((status) => status === 'degraded')) return 'degraded';
  if (statuses.some((status) => status === 'stale')) return 'stale';
  if (statuses.every((status) => status === 'operational')) return 'operational';
  if (statuses.some((status) => status === 'never-run')) return 'never-run';
  return 'unknown';
}

function getOverallPill(status: SystemStatus) {
  switch (status) {
    case 'operational':
      return {
        label: 'All Systems Operational',
        wrapperClass: 'bg-emerald-50 border border-emerald-100',
        pulseClass: 'bg-emerald-400',
        dotClass: 'bg-emerald-500',
        textClass: 'text-emerald-700',
      };
    case 'down':
      return {
        label: 'Critical Systems Down',
        wrapperClass: 'bg-red-50 border border-red-100',
        pulseClass: 'bg-red-400',
        dotClass: 'bg-red-500',
        textClass: 'text-red-700',
      };
    case 'degraded':
      return {
        label: 'System Degraded',
        wrapperClass: 'bg-amber-50 border border-amber-100',
        pulseClass: 'bg-amber-400',
        dotClass: 'bg-amber-500',
        textClass: 'text-amber-700',
      };
    case 'stale':
      return {
        label: 'Stale System Data',
        wrapperClass: 'bg-amber-50 border border-amber-100',
        pulseClass: 'bg-amber-400',
        dotClass: 'bg-amber-500',
        textClass: 'text-amber-700',
      };
    default:
      return {
        label: `System ${STATUS_LABEL[status]}`,
        wrapperClass: 'bg-slate-50 border border-slate-200',
        pulseClass: 'bg-slate-300',
        dotClass: 'bg-slate-400',
        textClass: 'text-slate-600',
      };
  }
}

function getDeployDetail(deployStats: DeployStats, status: SystemStatus): string {
  if (status === 'never-run') return 'No deploy data';
  if (status === 'stale') return 'Deploy data stale';
  if (deployStats.lastDeploy?.status === 'failed') return 'Last deploy failed';
  if (deployStats.lastDeploy?.status === 'rolled_back') return 'Last deploy rolled back';
  return `${deployStats.successRate}% success`;
}

function getCronDetail(cronHealth: ExecutiveOverviewProps['cronHealth'], status: SystemStatus): string {
  if (status === 'never-run') return 'No cron logs yet';
  if (cronHealth.errors > 0) return `${cronHealth.errors} error${cronHealth.errors === 1 ? '' : 's'}`;
  if (cronHealth.stale > 0) return `${cronHealth.stale} stale`;
  if (cronHealth.warning > 0) return `${cronHealth.warning} warning`;
  if (cronHealth.neverRun > 0) return `${cronHealth.neverRun} never run`;
  return `${cronHealth.healthy}/${cronHealth.totalJobs} healthy`;
}

function getWebVitalsDetail(webVitalsHealth: ExecutiveOverviewProps['webVitalsHealth'], status: SystemStatus): string {
  if (status === 'never-run') return 'No RUM data yet';
  if (status === 'stale') return 'Vitals data stale';
  if (webVitalsHealth.poorCount > 0) return `${webVitalsHealth.poorCount} poor metrics`;
  if (webVitalsHealth.warningCount > 0) return `${webVitalsHealth.warningCount} needs work`;
  return `${webVitalsHealth.sampleSize} samples`;
}

function getRevenueDetail(stats: ExecutiveOverviewProps['stats'], status: SystemStatus): string {
  if (status === 'never-run') return 'No revenue data';
  if (stats.totalRevenue > 0) return formatCurrency(stats.totalRevenue);
  if (stats.totalClicks > 0) return `${formatNumber(stats.totalClicks)} clicks, no revenue`;
  return 'No revenue';
}
