'use client';

// components/dashboard/cockpit-analytics.tsx
// Cockpit Analytics widget — 5 blocks: KPI row, market×topic table,
// surface/rank breakdown (+device split), engagement→CTA rates, health panel.
// Refetches /api/dashboard/cockpit-analytics on time-range/market change
// (pattern: cta-heatmap.tsx).

import { useCallback, useState } from 'react';
import {
  AlertTriangle,
  Eye,
  Gauge,
  Globe,
  Loader2,
  MousePointerClick,
  RefreshCw,
  Table2,
  Target,
  Wrench,
} from 'lucide-react';
import type {
  CockpitAnalyticsData,
  CockpitTimeRange,
} from '@/lib/actions/cockpit-analytics';
import { StatCard, SectionCard, EmptyState, FilterBar } from '@/components/dashboard/ui';

const MARKET_FLAGS: Record<string, string> = { us: '🇺🇸', uk: '🇬🇧', ca: '🇨🇦', au: '🇦🇺' };
const TIME_RANGES: CockpitTimeRange[] = ['24h', '7d', '30d'];
const MARKETS = ['all', 'us', 'uk', 'ca', 'au'] as const;

function fmtPct(v: number | null): string {
  return v === null ? '—' : `${v.toFixed(1)}%`;
}

export function CockpitAnalytics({
  initialData,
  initialError,
}: {
  initialData: CockpitAnalyticsData | null;
  initialError: string | null;
}) {
  const [data, setData] = useState<CockpitAnalyticsData | null>(initialData);
  const [error, setError] = useState<string | null>(initialError);
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState<CockpitTimeRange>(initialData?.timeRange ?? '7d');
  const [market, setMarket] = useState<(typeof MARKETS)[number]>('all');

  const fetchData = useCallback(async (tr: CockpitTimeRange, m: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ timeRange: tr });
      if (m !== 'all') params.set('market', m);
      const res = await fetch(`/api/dashboard/cockpit-analytics?${params}`);
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
        setError(null);
      } else {
        setError(json.error || `HTTP ${res.status}`);
      }
    } catch {
      setError('Failed to load cockpit analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  const onTimeRange = (tr: CockpitTimeRange) => {
    setTimeRange(tr);
    void fetchData(tr, market);
  };
  const onMarket = (m: (typeof MARKETS)[number]) => {
    setMarket(m);
    void fetchData(timeRange, m);
  };

  if (!data) {
    return (
      <SectionCard title="Cockpit Analytics" icon={Gauge}>
        <EmptyState icon={AlertTriangle} title="No data" description={error ?? 'Cockpit analytics unavailable.'} />
      </SectionCard>
    );
  }

  const k = data.kpis;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <FilterBar>
        <div className="inline-flex rounded-lg border border-slate-200 bg-white overflow-hidden">
          {TIME_RANGES.map((tr) => (
            <button
              key={tr}
              type="button"
              onClick={() => onTimeRange(tr)}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                timeRange === tr ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tr}
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
        {loading && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
        <button
          type="button"
          onClick={() => fetchData(timeRange, market)}
          className="ml-auto inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </FilterBar>

      {/* Warning banners */}
      {data.truncated && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          This window contains more than 100k cockpit events — values are incomplete. Pick a shorter time range.
        </div>
      )}
      {k.zeroVolume && (
        <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Cockpit pages received {k.pageviews.toLocaleString('en-US')} pageviews but ZERO cockpit events — tracking may be broken.
        </div>
      )}

      {/* Block 1 — KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Cockpit views"
          value={k.cockpitViews.toLocaleString('en-US')}
          subtext={`${k.pageviews.toLocaleString('en-US')} cockpit pageviews`}
          icon={Eye}
        />
        <StatCard
          label="CTA clicks"
          value={k.ctaClicks.toLocaleString('en-US')}
          subtext={`offer ${data.ctaSplit.offer} · visit ${data.ctaSplit.visit} · review ${data.ctaSplit.review}`}
          icon={MousePointerClick}
          tone="green"
        />
        <StatCard
          label="Overall CTR"
          value={fmtPct(k.overallCtr)}
          subtext="clicks ÷ cockpit pageviews"
          icon={Target}
          tone="gold"
          delta={
            k.volumeDeltaPct === null
              ? undefined
              : {
                  direction: k.volumeDeltaPct > 0 ? 'up' : k.volumeDeltaPct < 0 ? 'down' : 'neutral',
                  value: `${Math.abs(k.volumeDeltaPct)}% events`,
                }
          }
        />
        <StatCard
          label="Silent cockpits"
          value={k.silentCount}
          subtext={k.silentCount > 0 ? 'pages with traffic but no events' : 'all instrumented pages reporting'}
          icon={AlertTriangle}
          tone={k.silentCount > 0 ? 'red' : 'green'}
        />
      </div>

      {/* Block 2 — Market × Topic table */}
      <SectionCard
        title="Market × Topic"
        description="clicks split by rendered CTA mode; CTR = clicks ÷ pageviews"
        icon={Globe}
        contentClassName="p-0"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-4 py-2.5 font-medium">Topic</th>
                <th className="px-3 py-2.5 font-medium text-right">Pageviews</th>
                <th className="px-3 py-2.5 font-medium text-right">Views</th>
                <th className="px-3 py-2.5 font-medium text-right">Impr.</th>
                <th className="px-3 py-2.5 font-medium text-right">Clicks</th>
                <th className="px-3 py-2.5 font-medium text-right">CTR</th>
                <th className="px-3 py-2.5 font-medium text-right">Offer / Visit / Review</th>
                <th className="px-3 py-2.5 font-medium text-right">Mob / Desk</th>
              </tr>
            </thead>
            <tbody>
              {data.byTopic.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                    No cockpit events in this window yet.
                  </td>
                </tr>
              )}
              {data.byTopic.map((row) => (
                <tr key={row.pagePath} className="border-b border-slate-50 hover:bg-slate-50/60">
                  <td className="px-4 py-2.5">
                    <span className="mr-1.5">{MARKET_FLAGS[row.market] ?? row.market}</span>
                    <span className="font-medium text-slate-800">{row.topic}</span>
                    <span className="ml-1.5 text-xs text-slate-400">{row.category}</span>
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{row.pageviews.toLocaleString('en-US')}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{row.cockpitViews.toLocaleString('en-US')}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{row.impressions.toLocaleString('en-US')}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-semibold">{row.clicks.toLocaleString('en-US')}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{fmtPct(row.ctr)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-slate-500">
                    {row.offerClicks} / {row.visitClicks} / {row.reviewClicks}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-slate-500">
                    {row.mobileClicks} / {row.desktopClicks}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Block 3 — Surface & rank breakdown + device split */}
      <div className="grid lg:grid-cols-2 gap-6">
        <SectionCard
          title="Surface & rank"
          description="card/verdict CTR = viewport impressions; table/compare CTR = surface views"
          icon={Table2}
          contentClassName="p-4"
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-2 py-2 font-medium">Surface</th>
                <th className="px-2 py-2 font-medium text-right">Clicks</th>
                <th className="px-2 py-2 font-medium text-right">Denominator</th>
                <th className="px-2 py-2 font-medium text-right">CTR</th>
              </tr>
            </thead>
            <tbody>
              {data.bySurface.map((s) => (
                <tr key={s.surface} className="border-t border-slate-50">
                  <td className="px-2 py-2 font-medium text-slate-800 capitalize">{s.surface}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{s.clicks}</td>
                  <td className="px-2 py-2 text-right tabular-nums text-slate-500">
                    {s.denominator} <span className="text-xs">({s.denomKind})</span>
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums">{fmtPct(s.ctr)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-sm">
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-400">Top-3 card CTR</div>
              <div className="text-lg font-semibold tabular-nums text-slate-900">{fmtPct(data.rates.top3Ctr)}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-400">Rank 4+ card CTR</div>
              <div className="text-lg font-semibold tabular-nums text-slate-900">{fmtPct(data.rates.restCtr)}</div>
            </div>
          </div>
          {data.deviceSplit.length > 0 && (
            <div className="mt-4 border-t border-slate-100 pt-4">
              <div className="mb-2 text-xs uppercase tracking-wide text-slate-400">Device split (clicks ÷ cockpit views)</div>
              <div className="flex flex-wrap gap-4 text-sm">
                {data.deviceSplit.map((d) => (
                  <div key={d.device} className="rounded-lg bg-slate-50 px-3 py-2">
                    <span className="font-medium capitalize text-slate-700">{d.device}</span>{' '}
                    <span className="tabular-nums text-slate-500">
                      {d.clicks} / {d.views} · {fmtPct(d.ctr)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </SectionCard>

        {/* Block 4 — Engagement → CTA rates */}
        <SectionCard
          title="Engagement → CTA"
          description="how strongly each interaction correlates with a CTA click"
          icon={Gauge}
          contentClassName="p-4"
        >
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Winner impression → click', value: data.rates.winnerImpressionToClick, hint: 'rank #1 / top pick' },
              { label: 'Card impression → click', value: data.rates.cardImpressionToClick, hint: 'viewport impressions' },
              { label: 'Matcher complete → click', value: data.rates.matcherCompleteToClick, hint: 'per session' },
              { label: 'Compare usage → click', value: data.rates.compareUsageToClick, hint: 'per session' },
            ].map((r) => (
              <div key={r.label} className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                <div className="text-xs text-slate-500">{r.label}</div>
                <div className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">{fmtPct(r.value)}</div>
                <div className="text-xs text-slate-400">{r.hint}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-400">
            Destination split:{' '}
            {Object.entries(data.destinationSplit)
              .map(([kType, v]) => `${kType} ${v}`)
              .join(' · ') || '—'}
          </div>
        </SectionCard>
      </div>

      {/* Block 5 — Health panel */}
      <SectionCard
        title="Tracking health"
        description="cockpit events are bot-filtered, pageviews are not — pages need ≥5 pageviews before counting as silent"
        icon={Wrench}
        tone={k.silentCount > 0 ? 'red' : 'green'}
        contentClassName="p-0"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-4 py-2.5 font-medium">Page</th>
                <th className="px-3 py-2.5 font-medium text-right">Pageviews</th>
                <th className="px-3 py-2.5 font-medium text-right">Events</th>
                <th className="px-3 py-2.5 font-medium text-right">Clicks</th>
                <th className="px-3 py-2.5 font-medium text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.health.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                    No cockpit traffic in this window.
                  </td>
                </tr>
              )}
              {data.health.map((h) => (
                <tr key={h.pagePath} className="border-b border-slate-50">
                  <td className="px-4 py-2.5">
                    <span className="mr-1.5">{MARKET_FLAGS[h.market] ?? h.market}</span>
                    <span className="text-slate-700">{h.pagePath}</span>
                    {h.isNewMarket && (
                      <span className="ml-2 rounded bg-sky-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-sky-700">
                        new market
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{h.pageviews.toLocaleString('en-US')}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{h.events.toLocaleString('en-US')}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{h.clicks.toLocaleString('en-US')}</td>
                  <td className="px-3 py-2.5 text-right">
                    {h.silent ? (
                      <span className="inline-flex items-center gap-1 rounded bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                        <AlertTriangle className="h-3 w-3" /> silent
                      </span>
                    ) : h.events > 0 ? (
                      <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">ok</span>
                    ) : (
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">low traffic</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
