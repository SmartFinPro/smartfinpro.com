import Link from 'next/link';
import { Users, MousePointer, DollarSign, Target, TrendingUp, BarChart3 } from 'lucide-react';
import { getCohortData } from '@/lib/actions/cohorts';
import { PageHeader, StatCard, SectionCard, EmptyState } from '@/components/dashboard/ui';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface CohortsPageProps {
  searchParams: Promise<{ weeks?: string }>;
}

const WEEK_PRESETS = [8, 12, 26] as const;

function money(n: number): string {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function pct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

export default async function CohortsPage({ searchParams }: CohortsPageProps) {
  const params = await searchParams;
  const parsed = Number(params.weeks);
  const weeks = (WEEK_PRESETS as readonly number[]).includes(parsed) ? parsed : 12;

  const result = await getCohortData(weeks);
  const data = result.success ? result.data : undefined;
  const hasData = !!data && data.cohorts.length > 0;

  const weekSelector = (
    <div className="inline-flex items-center bg-slate-100 border border-slate-200 rounded-lg p-1">
      {WEEK_PRESETS.map((w) => (
        <Link
          key={w}
          href={`/dashboard/cohorts?weeks=${w}`}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
            weeks === w ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {w}w
        </Link>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Users}
        title="Earnings per Click"
        description="How much a click earns over time — clicks grouped by their entry week, cumulative approved revenue per click (tracked postback events)"
        actions={weekSelector}
      />

      {!hasData ? (
        <SectionCard>
          <EmptyState
            icon={Users}
            title="Noch keine Kohorten-Daten"
            description={
              result.success
                ? `Keine Klicks im gewählten Fenster (letzte ${weeks} Wochen). Sobald Klicks und approved Conversions vorliegen, erscheint hier die Kohorten-Matrix.`
                : 'Kohorten-Daten konnten nicht geladen werden.'
            }
          />
        </SectionCard>
      ) : (
        <>
          {/* KPI row */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <StatCard label="Total Clicks" value={data!.kpis.totalClicks.toLocaleString('en-US')} icon={MousePointer} tone="navy" />
            <StatCard label="Approved Revenue" value={money(data!.kpis.totalApprovedRevenueUsd)} subtext="USD · tracked events" icon={DollarSign} tone="green" />
            <StatCard label="Conversion Rate" value={pct(data!.kpis.conversionRate)} subtext={`${data!.kpis.convertingClicks.toLocaleString('en-US')} converting clicks`} icon={Target} tone="amber" />
            <StatCard label="Avg Earnings / Click" value={money(data!.kpis.avgLtvPerClick)} icon={TrendingUp} tone="navy" />
            <StatCard label="Avg Earnings / Click @ Week 4" value={money(data!.kpis.avgLtvPerClickAtW4)} subtext="mature weeks only" icon={BarChart3} tone="blue" />
          </div>

          {/* Cohort matrix */}
          <SectionCard
            title="Cumulative earnings per click — by entry week"
            icon={Users}
            tone="navy"
            description={`${data!.cohorts.length} weekly groups · age W0–W${data!.maxAgeWeeks} (weeks since the click)`}
            contentClassName="p-0"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wide border-b border-slate-100">
                    <th className="px-4 py-3 sticky left-0 bg-white">Cohort week</th>
                    <th className="px-3 py-3 text-right">Size</th>
                    {Array.from({ length: data!.maxAgeWeeks + 1 }, (_, age) => (
                      <th key={age} className="px-3 py-3 text-right tabular-nums">W{age}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data!.cohorts.map((row) => (
                    <tr key={row.cohort} className="border-b border-slate-50 hover:bg-slate-50/60">
                      <td className="px-4 py-2.5 font-medium text-slate-800 whitespace-nowrap sticky left-0 bg-white">{row.cohort}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-slate-600">{row.size.toLocaleString('en-US')}</td>
                      {row.ltvPerClick.map((ltv, age) => (
                        <td key={age} className="px-3 py-2.5 text-right tabular-nums text-slate-700">
                          {ltv > 0 ? money(ltv) : <span className="text-slate-300">–</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </>
      )}
    </div>
  );
}
