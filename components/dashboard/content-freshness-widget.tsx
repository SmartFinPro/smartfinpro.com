'use client';

import { Clock, AlertTriangle, CheckCircle2, Timer, RefreshCw } from 'lucide-react';
import type { FreshnessStats, FreshnessRow } from '@/lib/actions/content-freshness';

// ── Freshness Bar ──────────────────────────────────────────────

function FreshnessBar({ fresh, aging, stale, total }: { fresh: number; aging: number; stale: number; total: number }) {
  if (total === 0) return null;

  const freshPct = (fresh / total) * 100;
  const agingPct = (aging / total) * 100;
  const stalePct = (stale / total) * 100;

  return (
    <div className="space-y-2">
      <div className="flex h-3 rounded-full overflow-hidden bg-slate-100">
        {freshPct > 0 && (
          <div
            className="bg-emerald-500 transition-all"
            style={{ width: `${freshPct}%` }}
            title={`Fresh: ${fresh} articles (${freshPct.toFixed(0)}%)`}
          />
        )}
        {agingPct > 0 && (
          <div
            className="bg-amber-400 transition-all"
            style={{ width: `${agingPct}%` }}
            title={`Aging: ${aging} articles (${agingPct.toFixed(0)}%)`}
          />
        )}
        {stalePct > 0 && (
          <div
            className="bg-red-400 transition-all"
            style={{ width: `${stalePct}%` }}
            title={`Stale: ${stale} articles (${stalePct.toFixed(0)}%)`}
          />
        )}
      </div>
      <div className="flex items-center gap-4 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          Fresh (&lt;90d): {fresh}
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          Aging (90–180d): {aging}
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
          Stale (&gt;180d): {stale}
        </span>
      </div>
    </div>
  );
}

// ── Market Breakdown Mini ──────────────────────────────────────

function MarketBreakdown({ breakdown }: { breakdown: FreshnessStats['marketBreakdown'] }) {
  const markets = Object.entries(breakdown).sort(([a], [b]) => a.localeCompare(b));
  if (markets.length === 0) return null;

  const marketColors: Record<string, string> = {
    us: 'bg-blue-100 text-blue-700',
    uk: 'bg-emerald-100 text-emerald-700',
    au: 'bg-amber-100 text-amber-700',
    ca: 'bg-red-100 text-red-700',
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {markets.map(([market, stats]) => {
        const total = stats.fresh + stats.aging + stats.stale;
        const healthPct = total > 0 ? Math.round((stats.fresh / total) * 100) : 0;

        return (
          <div key={market} className="bg-slate-50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${marketColors[market] || 'bg-slate-100 text-slate-700'}`}>
                {market.toUpperCase()}
              </span>
              <span className={`text-xs font-medium ${
                healthPct >= 80 ? 'text-emerald-600' :
                healthPct >= 50 ? 'text-amber-600' :
                'text-red-500'
              }`}>
                {healthPct}% fresh
              </span>
            </div>
            <div className="flex h-1.5 rounded-full overflow-hidden bg-slate-200">
              {stats.fresh > 0 && (
                <div className="bg-emerald-500" style={{ width: `${(stats.fresh / total) * 100}%` }} />
              )}
              {stats.aging > 0 && (
                <div className="bg-amber-400" style={{ width: `${(stats.aging / total) * 100}%` }} />
              )}
              {stats.stale > 0 && (
                <div className="bg-red-400" style={{ width: `${(stats.stale / total) * 100}%` }} />
              )}
            </div>
            <div className="flex justify-between mt-1.5 text-[10px] text-slate-400">
              <span>{stats.fresh} fresh</span>
              <span>{stats.stale} stale</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Stale Articles Table ───────────────────────────────────────

function formatSlug(slug: string): string {
  const parts = slug.split('/').filter(Boolean);
  return parts[parts.length - 1] || slug;
}

function getAgeBadge(days: number): { label: string; color: string } {
  if (days > 365) return { label: `${Math.round(days / 30)}mo`, color: 'bg-red-100 text-red-700' };
  if (days > 180) return { label: `${Math.round(days / 30)}mo`, color: 'bg-red-50 text-red-600' };
  if (days > 90) return { label: `${days}d`, color: 'bg-amber-50 text-amber-700' };
  return { label: `${days}d`, color: 'bg-emerald-50 text-emerald-700' };
}

function StaleArticlesTable({ articles }: { articles: FreshnessRow[] }) {
  if (articles.length === 0) {
    return (
      <div className="py-6 text-center text-slate-500 text-sm">
        <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-400 mb-2" />
        All content is fresh! No articles need review.
      </div>
    );
  }

  const marketColors: Record<string, string> = {
    us: 'bg-blue-100 text-blue-700',
    uk: 'bg-emerald-100 text-emerald-700',
    au: 'bg-amber-100 text-amber-700',
    ca: 'bg-red-100 text-red-700',
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="text-left py-2.5 px-3 font-medium text-slate-500 text-xs uppercase tracking-wider">Article</th>
            <th className="text-center py-2.5 px-3 font-medium text-slate-500 text-xs uppercase tracking-wider">Age</th>
            <th className="text-center py-2.5 px-3 font-medium text-slate-500 text-xs uppercase tracking-wider">Last Updated</th>
            <th className="text-center py-2.5 px-3 font-medium text-slate-500 text-xs uppercase tracking-wider">Status</th>
          </tr>
        </thead>
        <tbody>
          {articles.map((article) => {
            const ageBadge = getAgeBadge(article.age_days);
            const effectiveDate = article.modified_date ?? article.publish_date;

            return (
              <tr key={article.slug} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                <td className="py-2.5 px-3 max-w-[300px]">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${marketColors[article.market] || 'bg-slate-100 text-slate-700'}`}>
                      {article.market.toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <span className="font-medium text-slate-900 truncate block">
                        {formatSlug(article.slug)}
                      </span>
                      <span className="text-slate-400 text-xs truncate block">
                        {article.category}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="py-2.5 px-3 text-center">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${ageBadge.color}`}>
                    {ageBadge.label}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-center text-xs text-slate-500">
                  {effectiveDate
                    ? new Date(effectiveDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : '—'
                  }
                </td>
                <td className="py-2.5 px-3 text-center">
                  {article.reviewed_at ? (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                      <CheckCircle2 className="h-3 w-3" />
                      Reviewed
                    </span>
                  ) : article.needs_review ? (
                    <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                      <AlertTriangle className="h-3 w-3" />
                      Needs Review
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                      <CheckCircle2 className="h-3 w-3" />
                      OK
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Main Widget ────────────────────────────────────────────────

interface ContentFreshnessWidgetProps {
  stats: FreshnessStats;
}

export function ContentFreshnessWidget({ stats }: ContentFreshnessWidgetProps) {
  if (stats.totalArticles === 0) {
    return (
      <div className="py-8 text-center text-slate-500 text-sm">
        <RefreshCw className="h-8 w-8 mx-auto text-slate-300 mb-2" />
        No freshness data yet. The freshness-check cron job will populate this automatically.
      </div>
    );
  }

  const healthScore = stats.totalArticles > 0
    ? Math.round((stats.fresh / stats.totalArticles) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-slate-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-semibold text-slate-900 tabular-nums">{stats.totalArticles}</p>
          <p className="text-xs text-slate-500">Total Articles</p>
        </div>
        <div className="bg-emerald-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-semibold text-emerald-700 tabular-nums">{stats.fresh}</p>
          <p className="text-xs text-emerald-600">Fresh (&lt;90d)</p>
        </div>
        <div className="bg-amber-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-semibold text-amber-700 tabular-nums">{stats.aging}</p>
          <p className="text-xs text-amber-600">Aging (90–180d)</p>
        </div>
        <div className="bg-red-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-semibold text-red-600 tabular-nums">{stats.stale}</p>
          <p className="text-xs text-red-500">Stale (&gt;180d)</p>
        </div>
        <div className={`rounded-lg p-3 text-center ${
          healthScore >= 80 ? 'bg-emerald-50' :
          healthScore >= 50 ? 'bg-amber-50' :
          'bg-red-50'
        }`}>
          <p className={`text-2xl font-semibold tabular-nums ${
            healthScore >= 80 ? 'text-emerald-700' :
            healthScore >= 50 ? 'text-amber-700' :
            'text-red-600'
          }`}>{healthScore}%</p>
          <p className="text-xs text-slate-500">Health Score</p>
        </div>
      </div>

      {/* Freshness Bar */}
      <FreshnessBar
        fresh={stats.fresh}
        aging={stats.aging}
        stale={stats.stale}
        total={stats.totalArticles}
      />

      {/* Market Breakdown */}
      <div>
        <h4 className="text-sm font-medium text-slate-700 mb-3">Freshness by Market</h4>
        <MarketBreakdown breakdown={stats.marketBreakdown} />
      </div>

      {/* Stale Articles */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-slate-700">
            Articles Needing Attention
            {stats.needsReview > 0 && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                {stats.needsReview} flagged
              </span>
            )}
          </h4>
          <span className="text-xs text-slate-400">
            Avg age: {stats.avgAgeDays} days
          </span>
        </div>
        <StaleArticlesTable articles={stats.staleArticles} />
      </div>
    </div>
  );
}
