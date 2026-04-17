import { Suspense } from 'react';
import { Droplet, Info } from 'lucide-react';
import { getMoneyLeakStats } from '@/lib/actions/money-leak-stats';
import { TimeRangeSelector } from '@/components/dashboard/time-range-selector';
import type { TimeRange } from '@/lib/actions/dashboard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  searchParams: Promise<{ range?: string }>;
}

const RANGE_LABELS: Record<TimeRange, string> = {
  '24h': 'last 24 hours',
  '7d': 'last 7 days',
  '30d': 'last 30 days',
  all: 'all time',
};

const CATEGORY_LABELS: Record<string, string> = {
  banking: 'Banking fees',
  subscriptions: 'Subscriptions',
  creditCards: 'Credit-card interest',
  insurance: 'Insurance premiums',
  investing: 'Investment fees',
  forex: 'FX & remittance',
};

function pct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

function money(n: number): string {
  return `$${Math.round(n).toLocaleString('en-US')}`;
}

export default async function MoneyLeakDashboardPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const range = (params.range as TimeRange) || '7d';
  const result = await getMoneyLeakStats(range);
  const stats = result.success ? result.data! : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Droplet className="h-6 w-6 text-amber-500" />
            Money Leak Scanner
          </h1>
          <p className="text-slate-500 mt-1">
            Lead magnet funnel · {RANGE_LABELS[range]}
          </p>
        </div>
        <Suspense fallback={<div className="h-10 w-40 bg-slate-200 animate-pulse rounded-lg" />}>
          <TimeRangeSelector />
        </Suspense>
      </div>

      {/* About */}
      <div className="dashboard-card p-5 border-l-4 border-l-amber-500">
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
            <Info className="h-4 w-4 text-amber-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 mb-1">What this measures</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Scans start anonymously and are upgraded to leads only when the user submits email.
              Recommendation CTR is clicks on matched partner cards divided by email-captured scans —
              a much tighter funnel than raw pageview CTR.
            </p>
          </div>
        </div>
      </div>

      {!stats ? (
        <div className="dashboard-card p-8 text-center text-slate-500">
          {result.error ?? 'No data yet.'}
        </div>
      ) : (
        <>
          {/* KPI grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Scans started" value={stats.totalScans.toLocaleString('en-US')} />
            <KpiCard
              label="Emails captured"
              value={stats.totalEmailsCaptured.toLocaleString('en-US')}
              sub={`${pct(stats.emailConversionRate)} of scans`}
            />
            <KpiCard
              label="Recommendation clicks"
              value={stats.totalRecommendationClicks.toLocaleString('en-US')}
              sub={`${pct(stats.recommendationCtr)} of leads`}
            />
            <KpiCard
              label="Avg annual leak"
              value={money(stats.avgAnnualLeak)}
              sub="per completed scan"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* By market */}
            <div className="dashboard-card p-5">
              <h3 className="font-semibold text-slate-800 mb-4">Performance by market</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 text-xs uppercase tracking-wider">
                    <th className="pb-2">Market</th>
                    <th className="pb-2 text-right">Scans</th>
                    <th className="pb-2 text-right">Emails</th>
                    <th className="pb-2 text-right">Conv.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stats.byMarket.map((row) => (
                    <tr key={row.market}>
                      <td className="py-2 font-medium uppercase">{row.market}</td>
                      <td className="py-2 text-right tabular-nums">{row.scans}</td>
                      <td className="py-2 text-right tabular-nums">{row.emails}</td>
                      <td className="py-2 text-right tabular-nums">
                        {row.scans > 0 ? pct(row.emails / row.scans) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Top leak categories */}
            <div className="dashboard-card p-5">
              <h3 className="font-semibold text-slate-800 mb-4">Most common leak categories</h3>
              <div className="space-y-2">
                {stats.topLeakCategories.length === 0 && (
                  <p className="text-sm text-slate-500">No data yet.</p>
                )}
                {stats.topLeakCategories.map((c) => {
                  const max = stats.topLeakCategories[0]?.count || 1;
                  const width = (c.count / max) * 100;
                  return (
                    <div key={c.category}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-700">
                          {CATEGORY_LABELS[c.category] ?? c.category}
                        </span>
                        <span className="tabular-nums text-slate-500">{c.count}</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Severity breakdown */}
          <div className="dashboard-card p-5">
            <h3 className="font-semibold text-slate-800 mb-4">Severity distribution</h3>
            <div className="grid grid-cols-4 gap-3">
              {(['low', 'medium', 'high', 'critical'] as const).map((sev) => {
                const count = stats.severityBreakdown[sev] ?? 0;
                const share = stats.totalScans > 0 ? count / stats.totalScans : 0;
                const color = {
                  low: 'text-emerald-600 bg-emerald-50',
                  medium: 'text-amber-600 bg-amber-50',
                  high: 'text-orange-600 bg-orange-50',
                  critical: 'text-red-600 bg-red-50',
                }[sev];
                return (
                  <div key={sev} className={`rounded-xl p-3 ${color}`}>
                    <div className="text-xs uppercase font-semibold tracking-wider opacity-80">
                      {sev}
                    </div>
                    <div className="text-xl font-bold tabular-nums mt-1">{count}</div>
                    <div className="text-xs opacity-70">{pct(share)} of scans</div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function KpiCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="dashboard-card p-4">
      <div className="text-xs uppercase font-semibold tracking-wider text-slate-500">{label}</div>
      <div className="text-2xl font-bold text-slate-800 tabular-nums mt-1">{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
    </div>
  );
}
