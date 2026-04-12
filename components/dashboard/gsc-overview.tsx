'use client';

// components/dashboard/gsc-overview.tsx
// Google Search Console Overview — real search performance data
// Shows: KPIs, Daily Trend Chart, Top Keywords, Top Pages, Winners/Losers

import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Eye,
  MousePointerClick,
  TrendingUp,
  TrendingDown,
  Target,
  FileText,
  ArrowUp,
  ArrowDown,
  Loader2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Settings,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { DASHBOARD_CHART, CHART_NEUTRAL, BRAND } from '@/lib/constants/brand-colors';
import { WidgetErrorBoundary } from '@/components/dashboard/widget-error-boundary';

// ── Types ──────────────────────────────────────────────────

interface GSCData {
  configured: boolean;
  message?: string;
  error?: string;
  range?: { start: string; end: string; label: string };
  overview?: {
    totalClicks: number;
    totalImpressions: number;
    avgPosition: number;
    avgCTR: number;
  };
  marketBreakdown?: Record<string, { clicks: number; impressions: number }>;
  dailyTrend?: Array<{
    date: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>;
  topKeywords?: Array<{
    keyword: string;
    page: string;
    market: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>;
  topPages?: Array<{
    page: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>;
  winnersLosers?: {
    winners: Array<{
      keyword: string;
      position: number;
      positionDelta: number;
      clicks: number;
      impressions: number;
    }>;
    losers: Array<{
      keyword: string;
      position: number;
      positionDelta: number;
      clicks: number;
      impressions: number;
    }>;
  };
}

type GSCRange = '7d' | '28d' | '90d';

// ── Main Component ─────────────────────────────────────────

export function GSCOverview() {
  const [data, setData] = useState<GSCData | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<GSCRange>('28d');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard/gsc-analytics?range=${range}`);
      const json = await res.json();
      setData(json);
    } catch {
      setData({ configured: false, error: 'Verbindungsfehler' });
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Not configured state ────────────────────────────────
  if (!loading && data && !data.configured) {
    return (
      <WidgetErrorBoundary label="GSC Overview" minHeight="h-48">
      <div className="dashboard-card p-8">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-amber-50">
            <Settings className="h-6 w-6 text-amber-500" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 text-lg">Google Search Console verbinden</h3>
            <p className="text-slate-500 mt-1 text-sm">
              Verbinde dein GSC-Konto um echte Suchdaten (Impressions, Clicks, Rankings) zu sehen.
            </p>
            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <p>Benötigte Umgebungsvariablen:</p>
              <ul className="list-disc list-inside space-y-1 text-xs text-slate-500">
                <li><code className="bg-slate-100 px-1 rounded">GSC_CLIENT_EMAIL</code> — Service Account E-Mail</li>
                <li><code className="bg-slate-100 px-1 rounded">GSC_PRIVATE_KEY</code> — RSA Private Key (PEM)</li>
                <li><code className="bg-slate-100 px-1 rounded">GSC_SITE_URL</code> — Property URL (z.B. https://smartfinpro.com)</li>
              </ul>
            </div>
            <a
              href="/api/dashboard/gsc-test"
              target="_blank"
              className="inline-flex items-center gap-1.5 mt-4 text-sm font-medium px-4 py-2 rounded-lg"
              style={{ background: 'var(--sfp-sky)', color: 'var(--sfp-navy)' }}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Verbindung testen
            </a>
          </div>
        </div>
      </div>
      </WidgetErrorBoundary>
    );
  }

  // ── Loading state ───────────────────────────────────────
  if (loading) {
    return (
      <WidgetErrorBoundary label="GSC Overview" minHeight="h-48">
      <div className="dashboard-card p-12 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        <span className="ml-3 text-slate-500">GSC-Daten werden geladen…</span>
      </div>
      </WidgetErrorBoundary>
    );
  }

  // ── Error state ─────────────────────────────────────────
  if (data?.error) {
    return (
      <WidgetErrorBoundary label="GSC Overview" minHeight="h-48">
      <div className="dashboard-card p-6">
        <div className="flex items-center gap-3 text-amber-600">
          <AlertTriangle className="h-5 w-5" />
          <span className="font-medium">GSC Fehler:</span>
          <span className="text-sm text-slate-500">{data.error}</span>
        </div>
        <button
          onClick={fetchData}
          className="mt-3 text-sm flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
          style={{ background: 'var(--sfp-sky)', color: 'var(--sfp-navy)' }}
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Erneut versuchen
        </button>
      </div>
      </WidgetErrorBoundary>
    );
  }

  if (!data?.overview) return null;

  const overview = data.overview;
  const rangeLabels: Record<GSCRange, string> = {
    '7d': '7 Tage',
    '28d': '28 Tage',
    '90d': '90 Tage',
  };

  return (
    <WidgetErrorBoundary label="GSC Overview" minHeight="h-48">
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Search className="h-5 w-5 text-slate-400" />
          <h2 className="text-lg font-semibold text-slate-800">Google Search Console</h2>
          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: '#dcfce7', color: '#166534' }}>
            Live
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchData} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors" title="Aktualisieren">
            <RefreshCw className="h-4 w-4 text-slate-400" />
          </button>
          <div className="flex rounded-lg border border-slate-200 overflow-hidden text-sm">
            {(['7d', '28d', '90d'] as GSCRange[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className="px-3 py-1.5 font-medium transition-colors"
                style={{
                  background: range === r ? 'var(--sfp-navy)' : 'transparent',
                  color: range === r ? 'white' : 'var(--sfp-slate)',
                }}
              >
                {rangeLabels[r]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          label="Impressions"
          value={overview.totalImpressions.toLocaleString('de-DE')}
          icon={<Eye className="h-5 w-5" />}
          iconClass="bg-blue-50 text-blue-500"
          sub="Suchergebnisse angezeigt"
        />
        <KPICard
          label="Clicks"
          value={overview.totalClicks.toLocaleString('de-DE')}
          icon={<MousePointerClick className="h-5 w-5" />}
          iconClass="bg-emerald-50 text-emerald-500"
          sub="Klicks aus der Suche"
        />
        <KPICard
          label="Ø CTR"
          value={`${overview.avgCTR}%`}
          icon={<Target className="h-5 w-5" />}
          iconClass="bg-purple-50 text-purple-500"
          sub="Click-Through-Rate"
        />
        <KPICard
          label="Ø Position"
          value={overview.avgPosition.toFixed(1)}
          icon={<TrendingUp className="h-5 w-5" />}
          iconClass="bg-amber-50 text-amber-500"
          sub="Durchschnittliches Ranking"
        />
      </div>

      {/* Daily Trend Chart */}
      {data.dailyTrend && data.dailyTrend.length > 0 && (
        <div className="dashboard-card overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-slate-400" />
            <h3 className="font-semibold text-slate-800">Search Performance</h3>
            <span className="text-xs text-slate-400 ml-2">
              {data.range?.start} — {data.range?.end}
            </span>
          </div>
          <div className="p-6">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.dailyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_NEUTRAL.grid} />
                  <XAxis
                    dataKey="date"
                    stroke={CHART_NEUTRAL.axisText}
                    fontSize={12}
                    tickFormatter={(d: string) => {
                      const date = new Date(d);
                      return `${date.getDate()}.${date.getMonth() + 1}`;
                    }}
                  />
                  <YAxis
                    yAxisId="left"
                    stroke={CHART_NEUTRAL.axisText}
                    fontSize={12}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke={CHART_NEUTRAL.axisText}
                    fontSize={12}
                  />
                  <Tooltip
                    contentStyle={{
                      background: CHART_NEUTRAL.tooltipBg,
                      border: `1px solid ${CHART_NEUTRAL.tooltipBorder}`,
                      borderRadius: '8px',
                      fontSize: '13px',
                    }}
                    labelFormatter={(d: string) => {
                      const date = new Date(d);
                      return date.toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' });
                    }}
                  />
                  <Legend />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="impressions"
                    name="Impressions"
                    stroke={DASHBOARD_CHART.sessions}
                    fill={DASHBOARD_CHART.sessions}
                    fillOpacity={0.1}
                    strokeWidth={2}
                  />
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="clicks"
                    name="Clicks"
                    stroke={DASHBOARD_CHART.primary}
                    fill={DASHBOARD_CHART.primary}
                    fillOpacity={0.15}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Market Breakdown */}
      {data.marketBreakdown && Object.keys(data.marketBreakdown).length > 0 && (
        <div className="dashboard-card overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <Search className="h-5 w-5 text-slate-400" />
            <h3 className="font-semibold text-slate-800">Performance nach Markt</h3>
          </div>
          <div className="p-6">
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {Object.entries(data.marketBreakdown)
                .sort((a, b) => b[1].clicks - a[1].clicks)
                .map(([market, mktData]) => (
                  <div key={market} className="rounded-xl border border-slate-100 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-slate-700 uppercase">{market}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--sfp-sky)', color: 'var(--sfp-navy)' }}>
                        {marketFlag(market)}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Clicks</span>
                        <span className="font-medium text-slate-800">{mktData.clicks.toLocaleString('de-DE')}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Impressions</span>
                        <span className="font-medium text-slate-800">{mktData.impressions.toLocaleString('de-DE')}</span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Top Keywords + Top Pages side by side */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top Keywords */}
        {data.topKeywords && data.topKeywords.length > 0 && (
          <div className="dashboard-card overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <Search className="h-5 w-5 text-slate-400" />
              <h3 className="font-semibold text-slate-800">Top Keywords</h3>
              <span className="text-xs text-slate-400 ml-auto">{data.topKeywords.length} Keywords</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'var(--sfp-sky)' }}>
                    <th className="px-4 py-2.5 text-left font-medium text-slate-700">#</th>
                    <th className="px-4 py-2.5 text-left font-medium text-slate-700">Keyword</th>
                    <th className="px-4 py-2.5 text-right font-medium text-slate-700">Pos.</th>
                    <th className="px-4 py-2.5 text-right font-medium text-slate-700">Clicks</th>
                    <th className="px-4 py-2.5 text-right font-medium text-slate-700">Impr.</th>
                    <th className="px-4 py-2.5 text-right font-medium text-slate-700">CTR</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topKeywords.slice(0, 15).map((kw, i) => (
                    <tr
                      key={kw.keyword}
                      className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-4 py-2 text-slate-400 text-xs">{i + 1}</td>
                      <td className="px-4 py-2 font-medium text-slate-700 max-w-[200px] truncate">
                        {kw.keyword}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <PositionBadge position={kw.position} />
                      </td>
                      <td className="px-4 py-2 text-right font-medium text-slate-800">{kw.clicks}</td>
                      <td className="px-4 py-2 text-right text-slate-500">{kw.impressions.toLocaleString('de-DE')}</td>
                      <td className="px-4 py-2 text-right text-slate-500">{kw.ctr}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Top Pages */}
        {data.topPages && data.topPages.length > 0 && (
          <div className="dashboard-card overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <FileText className="h-5 w-5 text-slate-400" />
              <h3 className="font-semibold text-slate-800">Top Pages</h3>
              <span className="text-xs text-slate-400 ml-auto">{data.topPages.length} Seiten</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'var(--sfp-sky)' }}>
                    <th className="px-4 py-2.5 text-left font-medium text-slate-700">#</th>
                    <th className="px-4 py-2.5 text-left font-medium text-slate-700">Seite</th>
                    <th className="px-4 py-2.5 text-right font-medium text-slate-700">Clicks</th>
                    <th className="px-4 py-2.5 text-right font-medium text-slate-700">Impr.</th>
                    <th className="px-4 py-2.5 text-right font-medium text-slate-700">Pos.</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topPages.slice(0, 15).map((page, i) => (
                    <tr
                      key={page.page}
                      className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-4 py-2 text-slate-400 text-xs">{i + 1}</td>
                      <td className="px-4 py-2 font-medium text-slate-700 max-w-[250px] truncate" title={page.page}>
                        {page.page}
                      </td>
                      <td className="px-4 py-2 text-right font-medium text-slate-800">{page.clicks}</td>
                      <td className="px-4 py-2 text-right text-slate-500">{page.impressions.toLocaleString('de-DE')}</td>
                      <td className="px-4 py-2 text-right">
                        <PositionBadge position={page.position} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Winners & Losers */}
      {data.winnersLosers && (data.winnersLosers.winners.length > 0 || data.winnersLosers.losers.length > 0) && (
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Winners */}
          <div className="dashboard-card overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              <h3 className="font-semibold text-slate-800">Winners</h3>
              <span className="text-xs text-emerald-600 ml-1">Position verbessert</span>
            </div>
            <div className="p-4 space-y-2">
              {data.winnersLosers.winners.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">Noch keine Daten</p>
              ) : (
                data.winnersLosers.winners.slice(0, 8).map((kw) => (
                  <div key={kw.keyword} className="flex items-center justify-between rounded-lg px-3 py-2 bg-emerald-50/50">
                    <span className="text-sm font-medium text-slate-700 truncate max-w-[200px]">{kw.keyword}</span>
                    <div className="flex items-center gap-3">
                      <PositionBadge position={kw.position} />
                      <span className="flex items-center gap-0.5 text-xs font-semibold text-emerald-600">
                        <ArrowUp className="h-3 w-3" />
                        +{kw.positionDelta}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Losers */}
          <div className="dashboard-card overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-500" />
              <h3 className="font-semibold text-slate-800">Losers</h3>
              <span className="text-xs text-red-600 ml-1">Position verschlechtert</span>
            </div>
            <div className="p-4 space-y-2">
              {data.winnersLosers.losers.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">Noch keine Daten</p>
              ) : (
                data.winnersLosers.losers.slice(0, 8).map((kw) => (
                  <div key={kw.keyword} className="flex items-center justify-between rounded-lg px-3 py-2 bg-red-50/50">
                    <span className="text-sm font-medium text-slate-700 truncate max-w-[200px]">{kw.keyword}</span>
                    <div className="flex items-center gap-3">
                      <PositionBadge position={kw.position} />
                      <span className="flex items-center gap-0.5 text-xs font-semibold text-red-600">
                        <ArrowDown className="h-3 w-3" />
                        {kw.positionDelta}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* No data fallback */}
      {(!data.topKeywords || data.topKeywords.length === 0) &&
       (!data.dailyTrend || data.dailyTrend.length === 0) && (
        <div className="dashboard-card p-8 text-center">
          <Search className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-700">Noch keine GSC-Daten verfügbar</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            Deine Seiten wurden gerade erst indexiert. Google braucht typischerweise 2-5 Tage
            bis erste Impressions und Rankings in der Search Console erscheinen.
          </p>
          <p className="text-xs text-slate-400 mt-3">
            Zeitraum: {data.range?.start} — {data.range?.end} (3 Tage Datenverzögerung)
          </p>
        </div>
      )}
    </div>
    </WidgetErrorBoundary>
  );
}

// ── Sub-Components ─────────────────────────────────────────

function KPICard({
  label,
  value,
  icon,
  iconClass,
  sub,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  iconClass: string;
  sub: string;
}) {
  return (
    <div className="dashboard-card p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="text-3xl font-semibold text-slate-800 mt-1">{value}</p>
          <p className="text-sm text-slate-400 mt-2">{sub}</p>
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconClass}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function PositionBadge({ position }: { position: number }) {
  let bg = '#fef3c7'; // amber-100
  let color = '#92400e'; // amber-800

  if (position <= 3) {
    bg = '#dcfce7'; // green-100
    color = '#166534'; // green-800
  } else if (position <= 10) {
    bg = '#dbeafe'; // blue-100
    color = '#1e40af'; // blue-800
  } else if (position > 20) {
    bg = '#fee2e2'; // red-100
    color = '#991b1b'; // red-800
  }

  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold tabular-nums"
      style={{ background: bg, color }}
    >
      {position}
    </span>
  );
}

function marketFlag(market: string): string {
  const flags: Record<string, string> = {
    us: '🇺🇸 US',
    uk: '🇬🇧 UK',
    ca: '🇨🇦 CA',
    au: '🇦🇺 AU',
  };
  return flags[market] || market.toUpperCase();
}
