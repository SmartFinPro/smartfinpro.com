'use client';

// components/dashboard/tool-analytics.tsx
// Tool Analytics (tool_v1) widget — QDR funnel (North-Star first), TTFV,
// mobile drop-off, volume guard with dated annotations, tracking health,
// and placeholder tiles pending postback integration.
//
// Fetches /api/dashboard/tool-analytics on filter change (pattern:
// cockpit-analytics.tsx). This file MUST NEVER import any server action
// module (the directory one level up, under lib/) — only fetch(). Types
// come from the sibling pure module lib/analytics/tool-analytics-aggregate.ts,
// which has zero server/DB imports and is safe for a 'use client' file to
// import directly.

import { useCallback, useState } from 'react';
import {
  AlertTriangle,
  Clock,
  Eye,
  Gauge,
  Globe,
  Loader2,
  MousePointerClick,
  RefreshCw,
  Repeat,
  Smartphone,
  Table2,
  Target,
  Wrench,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type {
  ToolAnalyticsData,
  ToolAnalyticsDays,
} from '@/lib/analytics/tool-analytics-aggregate';
import { getBaselineWindow } from '@/lib/analytics/analytics-annotations';
import { TOOL_ID_VALUES, TOOL_REGISTRY } from '@/lib/tools/registry';
import { StatCard, SectionCard, EmptyState, FilterBar } from '@/components/dashboard/ui';
import { WidgetErrorBoundary } from '@/components/dashboard/widget-error-boundary';
import { CHART_NEUTRAL } from '@/lib/constants/brand-colors';

const MARKET_FLAGS: Record<string, string> = { us: '🇺🇸', uk: '🇬🇧', ca: '🇨🇦', au: '🇦🇺' };
const DAY_RANGES: ToolAnalyticsDays[] = [7, 14, 30, 90];
const MARKETS = ['all', 'us', 'uk', 'ca', 'au'] as const;
const DEVICES = ['all', 'desktop', 'mobile'] as const;

const EVENT_COLORS = ['#F5A623', '#1A6B3A', '#1B4F8C', '#D64045', '#7c3aed', '#0891b2', '#be185d', '#65a30d'];

function fmtPct(v: number | null): string {
  return v === null ? '—' : `${v.toFixed(1)}%`;
}

function fmtMs(v: number | null): string {
  if (v === null) return '—';
  if (v < 1000) return `${Math.round(v)} ms`;
  return `${(v / 1000).toFixed(1)} s`;
}

export function ToolAnalytics({
  initialData,
  initialError,
}: {
  initialData: ToolAnalyticsData | null;
  initialError: string | null;
}) {
  const [data, setData] = useState<ToolAnalyticsData | null>(initialData);
  const [error, setError] = useState<string | null>(initialError);
  const [loading, setLoading] = useState(false);
  const [days, setDays] = useState<ToolAnalyticsDays>(initialData?.days ?? 7);
  const [market, setMarket] = useState<(typeof MARKETS)[number]>('all');
  const [toolId, setToolId] = useState<'all' | (typeof TOOL_ID_VALUES)[number]>('all');
  const [device, setDevice] = useState<(typeof DEVICES)[number]>('all');

  const fetchData = useCallback(
    async (d: ToolAnalyticsDays, m: string, t: string, dev: string) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ days: String(d) });
        if (m !== 'all') params.set('market', m);
        if (t !== 'all') params.set('toolId', t);
        if (dev !== 'all') params.set('device', dev);
        const res = await fetch(`/api/dashboard/tool-analytics?${params}`);
        const json = await res.json();
        if (json.success && json.data) {
          setData(json.data);
          setError(null);
        } else {
          setError(json.error || `HTTP ${res.status}`);
        }
      } catch {
        setError('Failed to load tool analytics');
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const onDays = (d: ToolAnalyticsDays) => {
    setDays(d);
    void fetchData(d, market, toolId, device);
  };
  const onMarket = (m: (typeof MARKETS)[number]) => {
    setMarket(m);
    void fetchData(days, m, toolId, device);
  };
  const onTool = (t: string) => {
    setToolId(t as (typeof TOOL_ID_VALUES)[number] | 'all');
    void fetchData(days, market, t, device);
  };
  const onDevice = (dev: (typeof DEVICES)[number]) => {
    setDevice(dev);
    void fetchData(days, market, toolId, dev);
  };

  if (!data) {
    return (
      <SectionCard title="Tool Analytics" icon={Wrench}>
        <EmptyState icon={AlertTriangle} title="No data" description={error ?? 'Tool analytics unavailable.'} />
      </SectionCard>
    );
  }

  const k = data.kpis;
  const baseline = getBaselineWindow(data.annotations);

  // Pivot volume rows into one series row per day, one field per event name
  // — the shape recharts <Bar> stacks need.
  const eventNames = [...new Set(data.volume.map((v) => v.eventName))].sort();
  const volumeByDay = new Map<string, Record<string, number | string>>();
  for (const v of data.volume) {
    let entry = volumeByDay.get(v.day);
    if (!entry) {
      entry = { day: v.day };
      volumeByDay.set(v.day, entry);
    }
    entry[v.eventName] = v.rows;
  }
  const volumeSeries = [...volumeByDay.values()].sort((a, b) =>
    String(a.day).localeCompare(String(b.day)),
  );
  const volumeWarnings = data.volume.filter((v) => v.warning);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <FilterBar>
        <div className="inline-flex rounded-lg border border-slate-200 bg-white overflow-hidden">
          {DAY_RANGES.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => onDays(d)}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                days === d ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
        <div className="inline-flex rounded-lg border border-slate-200 bg-white overflow-hidden">
          {MARKETS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => onMarket(m)}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                market === m ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {m === 'all' ? 'All' : `${MARKET_FLAGS[m]} ${m.toUpperCase()}`}
            </button>
          ))}
        </div>
        <select
          value={toolId}
          onChange={(e) => onTool(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600"
        >
          <option value="all">All tools</option>
          {TOOL_ID_VALUES.map((id) => (
            <option key={id} value={id}>
              {TOOL_REGISTRY[id]?.name ?? id}
            </option>
          ))}
        </select>
        <div className="inline-flex rounded-lg border border-slate-200 bg-white overflow-hidden">
          {DEVICES.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => onDevice(d)}
              className={`px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                device === d ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
        {loading && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
        <button
          type="button"
          onClick={() => fetchData(days, market, toolId, device)}
          className="ml-auto inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </FilterBar>

      {data.truncated && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          This window contains more than 100k rows — values are incomplete. Pick a shorter time range.
        </div>
      )}
      {k.views === 0 && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 text-slate-400" />
          No tool_v1 events in this window yet — this is expected until the pilot tools are instrumented (PR 1.3) and
          the baseline window (7-14 days) has elapsed.
        </div>
      )}
      {baseline ? (
        <div className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
          Baseline window: {baseline.start} → {baseline.end}. No CRO-changing merge should land in this range (Spec
          0.5).
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
          Baseline window not started yet — <code>TOOL_BASELINE_START</code> is set on the PR 1.3 merge.
        </div>
      )}

      {/* Block 1 — KPI row, QDR first (North-Star) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Qualified Decision Rate (QDR)"
          value={fmtPct(k.qdr)}
          subtext="tool_qualified_decision ÷ tool_view — North-Star"
          icon={Target}
          tone="gold"
        />
        <StatCard
          label="Views"
          value={k.views.toLocaleString('en-US')}
          subtext={`${k.qualified.toLocaleString('en-US')} qualified decisions`}
          icon={Eye}
        />
        <StatCard
          label="Tracking coverage"
          value={`${k.reportingCount}/${k.expectedTotal}`}
          subtext={`${k.silentCount} silent · ${k.lowTrafficCount} low-traffic · ${k.noTrafficCount} no-traffic`}
          icon={AlertTriangle}
          tone={k.silentCount > 0 ? 'red' : k.reportingCount === k.expectedTotal && k.expectedTotal > 0 ? 'green' : 'gold'}
        />
        <StatCard
          label="Volume guard"
          value={volumeWarnings.length === 0 ? 'OK' : `${volumeWarnings.length} alert(s)`}
          subtext="tool_input_change > 5,000 rows/day"
          icon={Gauge}
          tone={volumeWarnings.length > 0 ? 'red' : 'green'}
        />
      </div>

      {/* Block 2 — Funnel table (QDR prominent) */}
      <WidgetErrorBoundary label="Tool funnel">
        <SectionCard
          title="Funnel by tool × market"
          description="QDR = qualified ÷ views (North-Star) · TTFV = median time to first result"
          icon={Table2}
          contentClassName="p-0"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-4 py-2.5 font-medium">Tool</th>
                  <th className="px-3 py-2.5 font-medium text-right">Views</th>
                  <th className="px-3 py-2.5 font-medium text-right">Starts</th>
                  <th className="px-3 py-2.5 font-medium text-right">Results</th>
                  <th className="px-3 py-2.5 font-medium text-right">TTFV</th>
                  <th className="px-3 py-2.5 font-medium text-right">Completion</th>
                  <th className="px-3 py-2.5 font-medium text-right bg-amber-50">QDR</th>
                  <th className="px-3 py-2.5 font-medium text-right">Result→Action</th>
                  <th className="px-3 py-2.5 font-medium text-right">Share/Report</th>
                  <th className="px-3 py-2.5 font-medium text-right" title="Not cross-session/device user identity — session-storage-scoped only">
                    Return (session window)
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.funnel.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-slate-400">
                      No tool_v1 events in this window yet.
                    </td>
                  </tr>
                )}
                {data.funnel.map((row) => (
                  <tr key={`${row.toolId}|${row.market}`} className="border-b border-slate-50 hover:bg-slate-50/60">
                    <td className="px-4 py-2.5">
                      <span className="mr-1.5">{MARKET_FLAGS[row.market] ?? row.market}</span>
                      <span className="font-medium text-slate-800">{TOOL_REGISTRY[row.toolId]?.name ?? row.toolId}</span>
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{row.views.toLocaleString('en-US')}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{row.starts.toLocaleString('en-US')}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{row.firstResults.toLocaleString('en-US')}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{fmtMs(row.ttfvMedianMs)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{fmtPct(row.completionRate)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums font-semibold bg-amber-50">{fmtPct(row.qdr)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-slate-500">{fmtPct(row.resultToActionRate)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-slate-500">{fmtPct(row.shareReportRate)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-slate-500">{fmtPct(row.returnWithinSessionRate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </WidgetErrorBoundary>

      {/* Block 3 — Mobile drop-off + Postback placeholders */}
      <div className="grid lg:grid-cols-2 gap-6">
        <WidgetErrorBoundary label="Mobile drop-off">
          <SectionCard
            title="Mobile drop-off"
            description="1 − completion(mobile) ÷ completion(desktop) — null when desktop views < 50"
            icon={Smartphone}
            contentClassName="p-4"
          >
            {data.mobileDropoff.length === 0 ? (
              <EmptyState icon={Smartphone} title="No device data yet" tone="slate" />
            ) : (
              <div className="space-y-2">
                {data.mobileDropoff.map((row) => (
                  <div
                    key={`${row.toolId}|${row.market}`}
                    className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"
                  >
                    <span className="text-slate-700">
                      <span className="mr-1.5">{MARKET_FLAGS[row.market] ?? row.market}</span>
                      {TOOL_REGISTRY[row.toolId]?.name ?? row.toolId}
                    </span>
                    <span className="tabular-nums font-medium text-slate-900">{fmtPct(row.value)}</span>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </WidgetErrorBoundary>

        <WidgetErrorBoundary label="Revenue metrics (pending)">
          <SectionCard
            title="Revenue & provider metrics"
            description="Postback integration is a separate, not-yet-scheduled workstream"
            icon={MousePointerClick}
            contentClassName="p-4"
          >
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'EPC (Earnings per Click)' },
                { label: 'Revenue per Qualified Session' },
                { label: 'Approval Rate' },
                { label: 'Postback coverage' },
              ].map((m) => (
                <div key={m.label} className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-4">
                  <div className="text-xs text-slate-500">{m.label}</div>
                  <div className="mt-1 text-lg font-semibold text-slate-300">—</div>
                  <div className="text-[11px] uppercase tracking-wide text-slate-400">pending postback integration</div>
                </div>
              ))}
            </div>
          </SectionCard>
        </WidgetErrorBoundary>
      </div>

      {/* Block 4 — Volume guard (rows/day per event_name) with annotations */}
      <WidgetErrorBoundary label="Volume guard" minHeight="h-64">
        <SectionCard
          title="Volume guard"
          description="rows/day per event_name — tool_input_change warns above 5,000/day; dated markers = UX-changing merges (Spec 0.5.3)"
          icon={Gauge}
          contentClassName="p-4"
        >
          {volumeSeries.length === 0 ? (
            <EmptyState icon={Gauge} title="No event volume yet" tone="slate" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={volumeSeries} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_NEUTRAL.grid} strokeOpacity={0.3} vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: CHART_NEUTRAL.axisText }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: CHART_NEUTRAL.axisText }} tickLine={false} axisLine={false} allowDecimals={false} width={40} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: CHART_NEUTRAL.tooltipBg,
                    border: `1px solid ${CHART_NEUTRAL.tooltipBorder}`,
                    borderRadius: '6px',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                {eventNames.map((name, i) => (
                  <Bar key={name} dataKey={name} stackId="events" fill={EVENT_COLORS[i % EVENT_COLORS.length]} />
                ))}
                {data.annotations.map((a) => (
                  <ReferenceLine
                    key={a.date}
                    x={a.date}
                    stroke="#D64045"
                    strokeDasharray="4 4"
                    label={{ value: a.label, fontSize: 10, fill: '#D64045', position: 'top' }}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          )}
          {volumeWarnings.length > 0 && (
            <div className="mt-3 space-y-1 border-t border-slate-100 pt-3">
              {volumeWarnings.map((w) => (
                <div key={`${w.day}|${w.eventName}`} className="flex items-center gap-2 text-xs text-red-700">
                  <AlertTriangle className="h-3 w-3" />
                  {w.day} — {w.eventName}: {w.rows.toLocaleString('en-US')} rows/day (&gt; 5,000)
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </WidgetErrorBoundary>

      {/* Block 5 — Health grid */}
      <WidgetErrorBoundary label="Tool health">
        <SectionCard
          title="Tracking health"
          description={`${k.expectedTotal} expected tool routes (registry manifest) — pageviews are not bot-filtered while tool events are, so routes need ≥5 pageviews before "silent" is meaningful (below that: "low-traffic")`}
          icon={Globe}
          tone={k.silentCount > 0 ? 'red' : 'green'}
          contentClassName="p-0"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-4 py-2.5 font-medium">Route</th>
                  <th className="px-3 py-2.5 font-medium text-right">Pageviews</th>
                  <th className="px-3 py-2.5 font-medium text-right">Events</th>
                  <th className="px-3 py-2.5 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.health.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                      No live tool routes registered for this filter.
                    </td>
                  </tr>
                )}
                {data.health.map((h) => (
                  <tr key={`${h.toolId}|${h.market}`} className="border-b border-slate-50">
                    <td className="px-4 py-2.5">
                      <span className="mr-1.5">{MARKET_FLAGS[h.market] ?? h.market}</span>
                      <span className="text-slate-700">{h.path}</span>
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{h.pageviews.toLocaleString('en-US')}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{h.events.toLocaleString('en-US')}</td>
                    <td className="px-3 py-2.5 text-right">
                      {h.status === 'silent' ? (
                        <span className="inline-flex items-center gap-1 rounded bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                          <AlertTriangle className="h-3 w-3" /> silent
                        </span>
                      ) : h.status === 'reporting' ? (
                        <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">reporting</span>
                      ) : h.status === 'low_traffic' ? (
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">low traffic</span>
                      ) : (
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-400">no traffic</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="border-t border-slate-100 px-4 py-2.5 text-xs text-slate-400">
            Routes marked <span className="font-medium text-slate-500">hidden</span> in the tool registry (e.g. Wealth
            Horizon UK/CA/AU, added FDL 4.3) are reachable only via direct link until their launch PR — &quot;silent&quot;
            or &quot;no traffic&quot; is expected for them until then, not a tracking problem.
          </p>
        </SectionCard>
      </WidgetErrorBoundary>

      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Clock className="h-3.5 w-3.5" />
        <Repeat className="h-3.5 w-3.5" />
        &quot;Return (session window)&quot; measures sessions whose tool_view fired on ≥2 distinct calendar days within
        this session&apos;s storage — it is NOT cross-device/cross-visit user identity.
      </div>
    </div>
  );
}
