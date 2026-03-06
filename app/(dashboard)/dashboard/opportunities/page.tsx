// app/(dashboard)/dashboard/opportunities/page.tsx
// Smart-Scan 2026 — Affiliate Opportunity Dashboard

import { createServiceClient } from '@/lib/supabase/service';
import { OpportunitiesClient } from './opportunities-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const MARKETS = ['all', 'us', 'uk', 'ca', 'au'] as const;
const STATUSES = ['new', 'reviewing', 'approved', 'rejected', 'published'] as const;

async function getOpportunities() {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('affiliate_opportunities')
    .select('*')
    .order('trust_score', { ascending: false })
    .order('discovered_at', { ascending: false })
    .limit(200);

  if (error) {
    console.error('[opportunities] fetch error:', error.message);
    return [];
  }
  return data ?? [];
}

async function getStats() {
  const supabase = createServiceClient();

  const [
    { count: total },
    { count: newCount },
    { count: approved },
    { data: topOpps },
  ] = await Promise.all([
    supabase.from('affiliate_opportunities').select('*', { count: 'exact', head: true }),
    supabase.from('affiliate_opportunities').select('*', { count: 'exact', head: true }).eq('status', 'new'),
    supabase.from('affiliate_opportunities').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
    supabase.from('affiliate_opportunities')
      .select('revenue_forecast_monthly')
      .eq('status', 'approved')
      .not('revenue_forecast_monthly', 'is', null),
  ]);

  const totalRevenueForecast = (topOpps ?? [])
    .reduce((sum, o) => sum + (o.revenue_forecast_monthly ?? 0), 0);

  return {
    total:                total ?? 0,
    new:                  newCount ?? 0,
    approved:             approved ?? 0,
    totalRevenueForecast,
  };
}

export default async function OpportunitiesPage() {
  const [opportunities, stats] = await Promise.all([getOpportunities(), getStats()]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--sfp-ink)' }}>
          Affiliate Opportunities
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Smart-Scan 2026 — automatisch entdeckt via Serper.dev + Claude-Analyse
        </p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Gesamt"
          value={stats.total}
          sub="entdeckte Programme"
          color="var(--sfp-navy)"
        />
        <StatCard
          label="Neu"
          value={stats.new}
          sub="warten auf Review"
          color="var(--sfp-gold)"
          highlight={stats.new > 0}
        />
        <StatCard
          label="Genehmigt"
          value={stats.approved}
          sub="bereit für Content"
          color="var(--sfp-green)"
        />
        <StatCard
          label="Umsatz-Forecast"
          value={`$${stats.totalRevenueForecast.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
          sub="/ Monat (genehmigte)"
          color="var(--sfp-navy)"
        />
      </div>

      {/* Client-side filterable grid */}
      <OpportunitiesClient opportunities={opportunities} />
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  color,
  highlight = false,
}: {
  label: string;
  value: string | number;
  sub: string;
  color: string;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-2xl border bg-white shadow-sm overflow-hidden ${highlight ? 'border-amber-300' : 'border-gray-200'}`}>
      <div style={{ height: 3, background: color }} />
      <div className="p-4">
        <p className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-1">{label}</p>
        <p className="text-2xl font-bold" style={{ color }}>{value}</p>
        <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
      </div>
    </div>
  );
}
