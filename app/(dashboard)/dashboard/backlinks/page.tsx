// app/(dashboard)/dashboard/backlinks/page.tsx
import { Link2, TrendingUp, AlertTriangle, CheckCircle2, Clock, ExternalLink, Globe } from 'lucide-react';
import { getBacklinkDashboardData } from '@/lib/actions/backlink-automation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// ── Status badge helper ──────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; bg: string; text: string }> = {
    live:          { label: 'Live', bg: 'bg-green-100', text: 'text-green-700' },
    lost:          { label: 'Lost', bg: 'bg-red-100', text: 'text-red-600' },
    nofollow:      { label: 'NoFollow', bg: 'bg-amber-100', text: 'text-amber-700' },
    unverified:    { label: 'Unverified', bg: 'bg-slate-100', text: 'text-slate-600' },
    pending:       { label: 'Pending', bg: 'bg-blue-100', text: 'text-blue-700' },
    posted:        { label: 'Posted', bg: 'bg-green-100', text: 'text-green-700' },
    manual_review: { label: 'Manual', bg: 'bg-violet-100', text: 'text-violet-700' },
    failed:        { label: 'Failed', bg: 'bg-red-100', text: 'text-red-600' },
    skipped:       { label: 'Skipped', bg: 'bg-slate-100', text: 'text-slate-500' },
  };
  const c = config[status] ?? { label: status, bg: 'bg-slate-100', text: 'text-slate-600' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
}

// ── Platform badge ────────────────────────────────────────────────────────────
function PlatformBadge({ platform }: { platform: string }) {
  const icons: Record<string, string> = {
    reddit: '🟠',
    quora: '🔴',
    medium: '⚫',
    forum: '💬',
    stackexchange: '🔷',
    hackernews: '🟡',
    pr: '📢',
  };
  return (
    <span className="text-sm">
      {icons[platform] ?? '🌐'} {platform}
    </span>
  );
}

// ── DA Score badge ─────────────────────────────────────────────────────────────
function DaBadge({ da }: { da: number | null }) {
  if (da === null) return <span className="text-slate-400 text-xs">—</span>;
  const color = da >= 80 ? 'text-green-600 font-bold' : da >= 60 ? 'text-blue-600 font-semibold' : 'text-slate-600';
  return <span className={`text-sm ${color}`}>DA {da}</span>;
}

// ── Opportunity Score bar ──────────────────────────────────────────────────────
function ScoreBar({ score }: { score: number }) {
  const color = score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-blue-500' : score >= 40 ? 'bg-amber-500' : 'bg-slate-300';
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 bg-slate-100 rounded-full h-1.5">
        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs text-slate-600 tabular-nums">{score}</span>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default async function BacklinksDashboardPage() {
  const { stats, placements, opportunities, campaigns } = await getBacklinkDashboardData();

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Link2 className="h-6 w-6" style={{ color: 'var(--sfp-navy)' }} />
          Backlink Automation
        </h1>
        <p className="text-slate-500 mt-1">
          Vollautomatisierte Backlink-Strategie — Reddit · Quora · Medium · Forums · Press Releases
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span className="text-xs text-slate-500 uppercase tracking-wide font-medium">Live Backlinks</span>
          </div>
          <p className="text-3xl font-bold" style={{ color: 'var(--sfp-navy)' }}>{stats.totalLive}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <span className="text-xs text-slate-500 uppercase tracking-wide font-medium">Lost</span>
          </div>
          <p className="text-3xl font-bold text-red-500">{stats.totalLost}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Globe className="h-4 w-4" style={{ color: 'var(--sfp-gold)' }} />
            <span className="text-xs text-slate-500 uppercase tracking-wide font-medium">⌀ DA</span>
          </div>
          <p className="text-3xl font-bold" style={{ color: 'var(--sfp-navy)' }}>{stats.avgDa}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span className="text-xs text-slate-500 uppercase tracking-wide font-medium">New 7d</span>
          </div>
          <p className="text-3xl font-bold text-green-600">{stats.newThisWeek}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-4 w-4 text-violet-500" />
            <span className="text-xs text-slate-500 uppercase tracking-wide font-medium">Manual Queue</span>
          </div>
          <p className="text-3xl font-bold text-violet-600">{stats.manualQueue}</p>
        </div>
      </div>

      {/* Active Campaigns */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Gradient bar */}
        <div className="h-1" style={{ background: 'linear-gradient(90deg, var(--sfp-navy) 0%, var(--sfp-gold) 100%)' }} />
        <div className="p-5">
          <h2 className="text-base font-semibold text-slate-800 mb-4">Aktive Kampagnen</h2>
          {campaigns.length === 0 ? (
            <p className="text-slate-400 text-sm">Keine Kampagnen konfiguriert.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'var(--sfp-sky)' }}>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--sfp-ink)' }}>Kampagne</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--sfp-ink)' }}>Markt</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--sfp-ink)' }}>Kategorie</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--sfp-ink)' }}>Keywords</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--sfp-ink)' }}>Limit/Tag</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--sfp-ink)' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c, i) => (
                    <tr key={c.id} style={{ background: i % 2 === 0 ? 'white' : 'var(--sfp-gray)' }}>
                      <td className="px-4 py-3 font-medium text-slate-800">{c.name}</td>
                      <td className="px-4 py-3 text-slate-600">{c.market?.toUpperCase() ?? 'ALL'}</td>
                      <td className="px-4 py-3 text-slate-600">{c.category ?? 'All'}</td>
                      <td className="px-4 py-3 text-slate-500">{c.target_keywords.length} Keywords</td>
                      <td className="px-4 py-3 text-slate-600 tabular-nums">{c.daily_limit}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${c.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                          {c.is_active ? '● Aktiv' : '○ Pausiert'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Opportunity Queue */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="h-1" style={{ background: 'linear-gradient(90deg, var(--sfp-navy) 0%, var(--sfp-gold) 100%)' }} />
          <div className="p-5">
            <h2 className="text-base font-semibold text-slate-800 mb-4">
              Opportunity Queue
              {opportunities.length > 0 && (
                <span className="ml-2 bg-blue-100 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full">
                  {opportunities.length}
                </span>
              )}
            </h2>
            {opportunities.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Link2 className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Keine Opportunities in der Queue.</p>
                <p className="text-xs mt-1">Backlink Scout läuft alle 6h automatisch.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {opportunities.map(opp => (
                  <div key={opp.id} className="p-3 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors" style={{ background: 'var(--sfp-gray)' }}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <PlatformBadge platform={opp.platform} />
                          <span className="text-xs px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 uppercase">{opp.market}</span>
                          <StatusBadge status={opp.status} />
                        </div>
                        <p className="text-sm text-slate-700 truncate font-medium">{opp.title ?? opp.target_keyword}</p>
                        <p className="text-xs text-slate-400 truncate mt-0.5">🔑 {opp.target_keyword}</p>
                      </div>
                      <div className="flex-shrink-0 flex flex-col items-end gap-1">
                        <ScoreBar score={opp.opportunity_score} />
                        <a
                          href={opp.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-0.5"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Open
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Live Placements */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="h-1" style={{ background: 'linear-gradient(90deg, var(--sfp-navy) 0%, var(--sfp-gold) 100%)' }} />
          <div className="p-5">
            <h2 className="text-base font-semibold text-slate-800 mb-4">
              Live Placements
              {placements.filter(p => p.status === 'live').length > 0 && (
                <span className="ml-2 bg-green-100 text-green-700 text-xs font-medium px-2 py-0.5 rounded-full">
                  {placements.filter(p => p.status === 'live').length} live
                </span>
              )}
            </h2>
            {placements.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Noch keine Placements.</p>
                <p className="text-xs mt-1">Backlink Post läuft alle 4h automatisch.</p>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0" style={{ background: 'var(--sfp-sky)' }}>
                    <tr>
                      <th className="text-left px-3 py-2 text-xs font-semibold" style={{ color: 'var(--sfp-ink)' }}>Platform</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold" style={{ color: 'var(--sfp-ink)' }}>DA</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold" style={{ color: 'var(--sfp-ink)' }}>Anchor</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold" style={{ color: 'var(--sfp-ink)' }}>Status</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold" style={{ color: 'var(--sfp-ink)' }}>Link</th>
                    </tr>
                  </thead>
                  <tbody>
                    {placements.map((p, i) => (
                      <tr key={p.id} style={{ background: i % 2 === 0 ? 'white' : 'var(--sfp-gray)' }}>
                        <td className="px-3 py-2.5">
                          <PlatformBadge platform={p.platform} />
                        </td>
                        <td className="px-3 py-2.5">
                          <DaBadge da={p.domain_authority} />
                        </td>
                        <td className="px-3 py-2.5 text-slate-600 max-w-[120px] truncate text-xs">
                          {p.anchor_text ?? '—'}
                        </td>
                        <td className="px-3 py-2.5">
                          <StatusBadge status={p.status} />
                        </td>
                        <td className="px-3 py-2.5">
                          <a
                            href={p.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:text-blue-700"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Setup Guide */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="h-1" style={{ background: 'linear-gradient(90deg, var(--sfp-navy) 0%, var(--sfp-gold) 100%)' }} />
        <div className="p-5">
          <h2 className="text-base font-semibold text-slate-800 mb-4">⚙️ Setup Guide — Plattform-Accounts</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                platform: 'Reddit',
                emoji: '🟠',
                envVars: ['REDDIT_CLIENT_ID', 'REDDIT_CLIENT_SECRET', 'REDDIT_USERNAME', 'REDDIT_PASSWORD'],
                setup: 'apps.reddit.com → Create App (script type)',
                note: 'Account muss 30+ Tage alt + 50+ Karma haben',
              },
              {
                platform: 'Medium',
                emoji: '⚫',
                envVars: ['MEDIUM_API_TOKEN'],
                setup: 'medium.com/me/settings → Integration tokens',
                note: 'Artikel erscheinen mit canonical link zu SmartFinPro',
              },
              {
                platform: 'EIN Presswire',
                emoji: '📢',
                envVars: ['EIN_PRESSWIRE_API_KEY'],
                setup: 'einpresswire.com → Free Account → API Key',
                note: '3 gratis Press Releases/Monat',
              },
              {
                platform: 'Daily Limit',
                emoji: '⚡',
                envVars: ['BACKLINKS_DAILY_LIMIT'],
                setup: '.env.local → BACKLINKS_DAILY_LIMIT=10',
                note: 'Max Posts pro Backlink-Post-Run (default: 10)',
              },
            ].map(item => (
              <div key={item.platform} className="rounded-lg border border-slate-200 p-4" style={{ background: 'var(--sfp-gray)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{item.emoji}</span>
                  <span className="font-semibold text-slate-800 text-sm">{item.platform}</span>
                </div>
                <p className="text-xs text-slate-500 mb-2">{item.setup}</p>
                <div className="space-y-1">
                  {item.envVars.map(env => (
                    <code key={env} className="block text-xs px-2 py-1 rounded font-mono" style={{ background: 'var(--sfp-sky)', color: 'var(--sfp-navy)' }}>
                      {env}
                    </code>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-2 italic">{item.note}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
