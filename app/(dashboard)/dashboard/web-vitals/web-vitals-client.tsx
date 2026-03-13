'use client';
// app/(dashboard)/dashboard/web-vitals/web-vitals-client.tsx
// CWV Dashboard — Ampel-System + Sparklines + Slow Pages

import { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';

type Rating = 'good' | 'needs-improvement' | 'poor';

interface MetricSummary {
  name: string;
  p75: number;
  rating: Rating;
  good: number;
  needsImprovement: number;
  poor: number;
  total: number;
  unit: string;
  target: number;
  budgetStatus: 'ok' | 'warning' | 'over' | null;
  budget: number;
}

interface TimeSeriesPoint {
  date:    string;
  lcp_p75: number | null;
  inp_p75: number | null;
  cls_p75: number | null;
}

interface Props {
  metrics:    MetricSummary[];
  timeSeries: TimeSeriesPoint[];
  slowPages:  { page_url: string; p75: number; count: number }[];
}

const RATING_CONFIG: Record<Rating, { bg: string; text: string; border: string; label: string; dot: string }> = {
  good:             { bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200',  label: 'Good',      dot: 'bg-green-500'  },
  'needs-improvement': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'Improve',   dot: 'bg-amber-500'  },
  poor:             { bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200',    label: 'Poor',      dot: 'bg-red-500'    },
};

const METRIC_DESCRIPTIONS: Record<string, string> = {
  LCP:  'Largest Contentful Paint — Ladezeit des größten Elements',
  INP:  'Interaction to Next Paint — Reaktionszeit auf Nutzereingaben',
  CLS:  'Cumulative Layout Shift — visuelle Stabilität',
  FCP:  'First Contentful Paint — erste sichtbare Inhalte',
  TTFB: 'Time to First Byte — Server-Antwortzeit',
};

function formatValue(value: number, unit: string, name: string): string {
  if (!value) return '—';
  if (name === 'CLS') return value.toFixed(3);
  if (unit === 'ms') return `${Math.round(value).toLocaleString()}ms`;
  return value.toString();
}

function MiniSparkline({ points, color }: { points: number[]; color: string }) {
  if (points.length < 2) return <div className="h-8 flex items-center text-xs text-slate-300">—</div>;

  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const w = 80;
  const h = 32;

  const pathD = points
    .map((v, i) => {
      const x = (i / (points.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <svg width={w} height={h} className="overflow-visible">
      <path d={pathD} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function WebVitalsClient({ metrics, timeSeries, slowPages }: Props) {
  const [activeMetric, setActiveMetric] = useState<string>('LCP');

  // Core 3 vs secondary metrics
  const core3 = metrics.filter((m) => ['LCP', 'INP', 'CLS'].includes(m.name));
  const secondary = metrics.filter((m) => ['FCP', 'TTFB'].includes(m.name));

  // Overall score: % good across Core 3
  const overallGood = core3.length
    ? core3.filter((m) => m.rating === 'good').length / core3.length
    : 0;
  const overallRating: Rating =
    overallGood === 1 ? 'good' : overallGood >= 0.5 ? 'needs-improvement' : 'poor';

  // Sparkline data for selected metric
  const sparklinePoints: number[] = timeSeries
    .map((p) => {
      if (activeMetric === 'LCP') return p.lcp_p75;
      if (activeMetric === 'INP') return p.inp_p75;
      if (activeMetric === 'CLS') return p.cls_p75;
      return null;
    })
    .filter((v): v is number => v !== null);

  const rCfg = RATING_CONFIG[overallRating];

  return (
    <div className="space-y-5">
      {/* Overall score banner */}
      <div className={`rounded-2xl border-2 p-5 flex items-center gap-4 ${rCfg.bg} ${rCfg.border}`}>
        <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold ${rCfg.bg} ${rCfg.border} border-2`}>
          <span className={rCfg.text}>{Math.round(overallGood * 100)}%</span>
        </div>
        <div>
          <p className={`font-semibold text-lg ${rCfg.text}`}>
            Core Web Vitals: {rCfg.label}
          </p>
          <p className="text-sm text-slate-500">
            {core3.filter((m) => m.rating === 'good').length} / {core3.length} Core Metriken im grünen Bereich (p75, letzte 7 Tage)
          </p>
        </div>
        <div className="ml-auto text-right hidden sm:block">
          <p className="text-xs text-slate-400">Google-Ranking-Signal</p>
          <p className={`text-sm font-semibold ${rCfg.text}`}>
            {overallRating === 'good' ? '✅ Kein CWV-Malus' : '⚠️ Ranking-Risiko'}
          </p>
        </div>
      </div>

      {/* Core 3 metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {core3.map((m) => {
          const cfg = RATING_CONFIG[m.rating];
          const goodPct = m.total ? Math.round((m.good / m.total) * 100) : 0;
          return (
            <button
              key={m.name}
              onClick={() => setActiveMetric(m.name)}
              className={`rounded-2xl border-2 overflow-hidden text-left transition-all ${cfg.border} ${activeMetric === m.name ? 'shadow-lg ring-2 ring-offset-1' : 'bg-white shadow-sm hover:shadow-md'}`}
              style={{ ['--tw-ring-color' as string]: activeMetric === m.name ? 'var(--sfp-navy)' : 'transparent' }}
            >
              <div style={{ height: 4, background: m.rating === 'good' ? 'var(--sfp-green)' : m.rating === 'poor' ? 'var(--sfp-red)' : '#F5A623' }} />
              <div className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-slate-700">{m.name}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
                    {cfg.label}
                  </span>
                </div>
                <p className="text-2xl font-bold mb-0.5" style={{ color: 'var(--sfp-ink)' }}>
                  {formatValue(m.p75, m.unit, m.name)}
                </p>
                <div className="flex items-center gap-2 mb-3">
                  <p className="text-xs text-slate-400">
                    p75 · Ziel: {m.name === 'CLS' ? `<${m.target}` : `<${m.target}ms`}
                  </p>
                  {m.budgetStatus && (
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                      m.budgetStatus === 'ok'      ? 'bg-green-50 text-green-700' :
                      m.budgetStatus === 'warning'  ? 'bg-amber-50 text-amber-700' :
                                                      'bg-red-50 text-red-700'
                    }`}>
                      {m.budgetStatus === 'ok' ? '● Budget OK' :
                       m.budgetStatus === 'warning' ? '● Near Budget' :
                       '● Over Budget'}
                    </span>
                  )}
                </div>

                {/* Good/Improve/Poor bar */}
                <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden flex mb-2">
                  <div className="bg-green-500 transition-all" style={{ width: `${m.total ? (m.good / m.total) * 100 : 0}%` }} />
                  <div className="bg-amber-400 transition-all" style={{ width: `${m.total ? (m.needsImprovement / m.total) * 100 : 0}%` }} />
                  <div className="bg-red-500 transition-all" style={{ width: `${m.total ? (m.poor / m.total) * 100 : 0}%` }} />
                </div>

                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>🟢 {goodPct}%</span>
                  <span>{m.total.toLocaleString()} Messungen</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Sparkline + description */}
      {sparklinePoints.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-semibold text-slate-700">{activeMetric} — 14-Tage-Verlauf (p75)</p>
              <p className="text-xs text-slate-400">{METRIC_DESCRIPTIONS[activeMetric]}</p>
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-500">
              {sparklinePoints.length > 1 && sparklinePoints[sparklinePoints.length - 1]! < sparklinePoints[0]!
                ? <><TrendingDown className="w-3.5 h-3.5 text-green-500" /> Verbessert</>
                : sparklinePoints[sparklinePoints.length - 1]! > sparklinePoints[0]!
                ? <><TrendingUp className="w-3.5 h-3.5 text-red-500" /> Verschlechtert</>
                : <><Minus className="w-3.5 h-3.5 text-slate-400" /> Stabil</>
              }
            </div>
          </div>
          <div className="w-full overflow-x-auto">
            <MiniSparkline
              points={sparklinePoints}
              color={
                metrics.find((m) => m.name === activeMetric)?.rating === 'good' ? '#1A6B3A' :
                metrics.find((m) => m.name === activeMetric)?.rating === 'poor' ? '#D64045' : '#F5A623'
              }
            />
          </div>
        </div>
      )}

      {/* Secondary metrics */}
      <div className="grid grid-cols-2 gap-4">
        {secondary.map((m) => {
          const cfg = RATING_CONFIG[m.rating];
          return (
            <div key={m.name} className="rounded-2xl border border-gray-200 bg-white shadow-sm p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-slate-700">{m.name}</span>
                <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
              </div>
              <p className="text-xl font-bold text-slate-800">{formatValue(m.p75, m.unit, m.name)}</p>
              <p className="text-xs text-slate-400">p75 · {m.total} Messungen</p>
            </div>
          );
        })}
      </div>

      {/* Slow pages */}
      {slowPages.length > 0 && (
        <div className="rounded-2xl border border-red-200 bg-red-50 shadow-sm overflow-hidden">
          <div style={{ height: 4, background: 'var(--sfp-red)' }} />
          <div className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <h3 className="font-semibold text-red-700">Langsamste Seiten (LCP — Poor)</h3>
            </div>
            <div className="space-y-2">
              {slowPages.map((page) => (
                <div key={page.page_url} className="flex items-center justify-between bg-white rounded-xl px-3 py-2 border border-red-200">
                  <span className="text-xs font-medium text-slate-700 truncate flex-1">{page.page_url}</span>
                  <div className="flex items-center gap-3 ml-3 shrink-0">
                    <span className="text-xs text-slate-400">{page.count}×</span>
                    <span className="text-sm font-bold text-red-600">{Math.round(page.p75).toLocaleString()}ms</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
