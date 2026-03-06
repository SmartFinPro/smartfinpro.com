// components/dashboard/web-vitals-widget.tsx
// Kompaktes CWV-Status-Widget für das Haupt-Dashboard
// Zeigt LCP, INP, CLS, FCP, TTFB als Ampel-Badges + Link zur Detail-Seite

import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/server';
import { Activity, ArrowRight, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

type Rating = 'good' | 'needs-improvement' | 'poor';

const TARGETS: Record<string, { good: number; poor: number; unit: string }> = {
  LCP:  { good: 2500, poor: 4000, unit: 'ms' },
  INP:  { good: 200,  poor: 500,  unit: 'ms' },
  CLS:  { good: 0.1,  poor: 0.25, unit: ''   },
  FCP:  { good: 1800, poor: 3000, unit: 'ms' },
  TTFB: { good: 800,  poor: 1800, unit: 'ms' },
};

interface MetricStatus {
  name: string;
  p75: number;
  unit: string;
  rating: Rating;
  total: number;
}

async function getCWVStatus(): Promise<MetricStatus[]> {
  const supabase = createServiceClient();
  const since = new Date(Date.now() - 7 * 86400_000).toISOString();

  const { data } = await supabase
    .from('web_vitals')
    .select('name, value, rating')
    .gte('recorded_at', since);

  if (!data?.length) return [];

  const byMetric: Record<string, number[]> = {};
  for (const row of data) {
    if (!byMetric[row.name]) byMetric[row.name] = [];
    byMetric[row.name].push(row.value);
  }

  return Object.entries(TARGETS).map(([name, cfg]) => {
    const values = byMetric[name] ?? [];
    if (!values.length) {
      return { name, p75: 0, unit: cfg.unit, rating: 'good', total: 0 };
    }
    const sorted = [...values].sort((a, b) => a - b);
    const p75 = sorted[Math.floor(sorted.length * 0.75)] ?? 0;
    const rating: Rating =
      p75 <= cfg.good ? 'good' :
      p75 > cfg.poor  ? 'poor' : 'needs-improvement';
    return { name, p75, unit: cfg.unit, rating, total: values.length };
  });
}

function RatingBadge({ rating }: { rating: Rating }) {
  if (rating === 'good') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-50 text-green-700 border border-green-200">
        <CheckCircle className="h-3 w-3" />
        Good
      </span>
    );
  }
  if (rating === 'needs-improvement') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        <AlertTriangle className="h-3 w-3" />
        Needs Work
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200">
      <XCircle className="h-3 w-3" />
      Poor
    </span>
  );
}

function formatValue(p75: number, unit: string, name: string): string {
  if (p75 === 0) return '—';
  if (name === 'CLS') return p75.toFixed(3);
  return `${Math.round(p75)}${unit}`;
}

export async function WebVitalsWidget() {
  let metrics: MetricStatus[] = [];
  try {
    metrics = await getCWVStatus();
  } catch {
    // Silently fail — widget is non-critical
  }

  const hasData = metrics.some((m) => m.total > 0);
  const poorCount = metrics.filter((m) => m.total > 0 && m.rating === 'poor').length;
  const warnCount = metrics.filter((m) => m.total > 0 && m.rating === 'needs-improvement').length;
  const goodCount = metrics.filter((m) => m.total > 0 && m.rating === 'good').length;

  const overallStatus: Rating = poorCount > 0 ? 'poor' : warnCount > 0 ? 'needs-improvement' : 'good';

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Activity className="h-4 w-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-900">Core Web Vitals</h3>
          {hasData && <RatingBadge rating={overallStatus} />}
        </div>
        <Link
          href="/dashboard/web-vitals"
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors"
        >
          Details <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="p-5">
        {!hasData ? (
          /* No-data state */
          <div className="flex flex-col items-center justify-center py-4 text-center">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-3">
              <Activity className="h-5 w-5 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-600 mb-1">Collecting RUM data…</p>
            <p className="text-xs text-slate-400 max-w-[200px]">
              Vitals appear after your first real visitor hits a page.
            </p>
          </div>
        ) : (
          <>
            {/* Summary pills */}
            <div className="flex gap-3 mb-5 flex-wrap">
              {goodCount > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 border border-green-100">
                  <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                  <span className="text-xs font-semibold text-green-700">{goodCount} Good</span>
                </div>
              )}
              {warnCount > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-100">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                  <span className="text-xs font-semibold text-amber-700">{warnCount} Improve</span>
                </div>
              )}
              {poorCount > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 border border-red-100">
                  <XCircle className="h-3.5 w-3.5 text-red-600" />
                  <span className="text-xs font-semibold text-red-700">{poorCount} Poor</span>
                </div>
              )}
            </div>

            {/* Metric rows */}
            <div className="space-y-2.5">
              {metrics.map((m) => (
                <div key={m.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Traffic light dot */}
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{
                        background:
                          m.total === 0 ? '#CBD5E1' :
                          m.rating === 'good' ? '#16A34A' :
                          m.rating === 'needs-improvement' ? '#D97706' : '#DC2626',
                      }}
                    />
                    <span className="text-xs font-semibold text-slate-700 w-9">{m.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-slate-500">
                      {m.total === 0 ? '—' : formatValue(m.p75, m.unit, m.name)}
                    </span>
                    {m.total > 0 && (
                      <span className="text-[10px] text-slate-400">p75</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Sample count */}
            <p className="text-[10px] text-slate-400 mt-4 text-right">
              {metrics.reduce((a, m) => a + m.total, 0).toLocaleString()} samples · last 7 days
            </p>
          </>
        )}
      </div>
    </div>
  );
}
