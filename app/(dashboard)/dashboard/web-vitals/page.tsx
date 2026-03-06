// app/(dashboard)/dashboard/web-vitals/page.tsx
// AP-13 Phase 4 — Core Web Vitals Dashboard

import { createServiceClient } from '@/lib/supabase/service';
import { WebVitalsClient } from './web-vitals-client';

export const dynamic    = 'force-dynamic';
export const revalidate = 0;

type Rating = 'good' | 'needs-improvement' | 'poor';

interface MetricSummary {
  name:        string;
  p75:         number;
  rating:      Rating;
  good:        number;
  needsImprovement: number;
  poor:        number;
  total:       number;
  unit:        string;
  target:      number;
}

interface TimeSeriesPoint {
  date:    string;
  lcp_p75: number | null;
  inp_p75: number | null;
  cls_p75: number | null;
}

// Google CWV thresholds (2026)
const TARGETS: Record<string, { good: number; poor: number; unit: string }> = {
  LCP:  { good: 2500,  poor: 4000,  unit: 'ms'   },
  INP:  { good: 200,   poor: 500,   unit: 'ms'   },
  CLS:  { good: 0.1,   poor: 0.25,  unit: ''     },
  FCP:  { good: 1800,  poor: 3000,  unit: 'ms'   },
  TTFB: { good: 800,   poor: 1800,  unit: 'ms'   },
};

async function getMetricSummaries(): Promise<MetricSummary[]> {
  const supabase = createServiceClient();
  const since = new Date(Date.now() - 7 * 86400_000).toISOString();

  const { data } = await supabase
    .from('web_vitals')
    .select('name, value, rating')
    .gte('recorded_at', since);

  if (!data?.length) return [];

  const byMetric: Record<string, { values: number[]; ratings: Rating[] }> = {};

  for (const row of data) {
    if (!byMetric[row.name]) byMetric[row.name] = { values: [], ratings: [] };
    byMetric[row.name].values.push(row.value);
    byMetric[row.name].ratings.push(row.rating as Rating);
  }

  return Object.entries(TARGETS).map(([name, cfg]) => {
    const metric = byMetric[name];
    if (!metric) {
      return {
        name, unit: cfg.unit, target: cfg.good,
        p75: 0, rating: 'good' as Rating,
        good: 0, needsImprovement: 0, poor: 0, total: 0,
      };
    }

    const sorted = [...metric.values].sort((a, b) => a - b);
    const p75Idx = Math.floor(sorted.length * 0.75);
    const p75    = sorted[p75Idx] ?? 0;

    const rating: Rating =
      p75 <= cfg.good ? 'good' :
      p75 > cfg.poor  ? 'poor' : 'needs-improvement';

    const good             = metric.ratings.filter((r) => r === 'good').length;
    const poor             = metric.ratings.filter((r) => r === 'poor').length;
    const needsImprovement = metric.ratings.filter((r) => r === 'needs-improvement').length;

    return { name, unit: cfg.unit, target: cfg.good, p75, rating, good, needsImprovement, poor, total: metric.values.length };
  });
}

async function getTimeSeries(): Promise<TimeSeriesPoint[]> {
  const supabase = createServiceClient();
  const since    = new Date(Date.now() - 14 * 86400_000).toISOString();

  const { data } = await supabase
    .from('web_vitals')
    .select('name, value, recorded_at')
    .in('name', ['LCP', 'INP', 'CLS'])
    .gte('recorded_at', since)
    .order('recorded_at');

  if (!data?.length) return [];

  // Group by date
  const byDate: Record<string, { lcp: number[]; inp: number[]; cls: number[] }> = {};

  for (const row of data) {
    const date = row.recorded_at.slice(0, 10);
    if (!byDate[date]) byDate[date] = { lcp: [], inp: [], cls: [] };
    if (row.name === 'LCP') byDate[date].lcp.push(row.value);
    if (row.name === 'INP') byDate[date].inp.push(row.value);
    if (row.name === 'CLS') byDate[date].cls.push(row.value);
  }

  return Object.entries(byDate).sort(([a], [b]) => a.localeCompare(b)).map(([date, g]) => ({
    date,
    lcp_p75: p75(g.lcp),
    inp_p75: p75(g.inp),
    cls_p75: p75(g.cls),
  }));
}

async function getTopSlowPages(): Promise<{ page_url: string; p75: number; count: number }[]> {
  const supabase = createServiceClient();
  const since    = new Date(Date.now() - 7 * 86400_000).toISOString();

  const { data } = await supabase
    .from('web_vitals')
    .select('page_url, value')
    .eq('name', 'LCP')
    .eq('rating', 'poor')
    .gte('recorded_at', since)
    .not('page_url', 'is', null);

  if (!data?.length) return [];

  const byPage: Record<string, number[]> = {};
  for (const r of data) {
    const key = r.page_url as string;
    if (!byPage[key]) byPage[key] = [];
    byPage[key].push(r.value);
  }

  return Object.entries(byPage)
    .map(([page_url, values]) => ({ page_url, p75: p75(values) ?? 0, count: values.length }))
    .sort((a, b) => b.p75 - a.p75)
    .slice(0, 10);
}

function p75(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length * 0.75)] ?? null;
}

export default async function WebVitalsPage() {
  const [metrics, timeSeries, slowPages] = await Promise.all([
    getMetricSummaries(),
    getTimeSeries(),
    getTopSlowPages(),
  ]);

  const hasData = metrics.some((m) => m.total > 0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--sfp-ink)' }}>
          Core Web Vitals
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Real User Monitoring (RUM) — letzte 7 Tage · Google-Zielwerte 2026
        </p>
      </div>

      {!hasData ? (
        <NoDataState />
      ) : (
        <WebVitalsClient metrics={metrics} timeSeries={timeSeries} slowPages={slowPages} />
      )}
    </div>
  );
}

function NoDataState() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-8 text-center">
      <div className="text-4xl mb-4">📊</div>
      <h3 className="text-lg font-semibold text-slate-700 mb-2">Noch keine Daten</h3>
      <p className="text-sm text-slate-500 max-w-md mx-auto mb-4">
        Der WebVitalsReporter ist aktiv und sammelt ab sofort Daten von echten Nutzern.
        Erste Metriken erscheinen hier innerhalb von 24 Stunden nach dem nächsten Deployment.
      </p>
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
        style={{ background: 'var(--sfp-green)' }}>
        ✅ Tracking aktiv — warte auf ersten Traffic
      </div>
    </div>
  );
}
