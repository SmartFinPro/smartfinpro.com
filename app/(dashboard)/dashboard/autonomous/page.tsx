// app/(dashboard)/dashboard/autonomous/page.tsx
import { createServiceClient } from '@/lib/supabase/server';
import {
  Bot,
  CheckCircle2,
  XCircle,
  Clock,
  Minus,
  Brain,
  Zap,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// ── Types ──────────────────────────────────────────────────────

interface ActionRow {
  id: string;
  dedupe_key: string;
  action_type: string;
  risk_tier: number;
  slug: string | null;
  market: string | null;
  description: string;
  outcome: string;
  outcome_metrics: Record<string, unknown> | null;
  executed_at: string;
  measured_at: string | null;
  undone_at: string | null;
}

interface InsightRow {
  id: string;
  insight_type: string;
  slug: string | null;
  market: string | null;
  title: string;
  risk_tier: number;
  expected_revenue_impact: number;
  confidence: number;
  status: string;
  created_at: string;
}

interface LearningRow {
  id: string;
  category: string;
  market: string | null;
  learning: string;
  confidence: number;
  sample_size: number;
  first_observed_at: string;
  last_confirmed_at: string;
  evidence: Record<string, unknown>;
}

interface SettingRow {
  key: string;
  value: string;
}

// ── Helper functions ───────────────────────────────────────────

function formatAge(dateStr: string): string {
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function outcomeIcon(outcome: string) {
  switch (outcome) {
    case 'positive':
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case 'negative':
      return <XCircle className="h-4 w-4 text-red-500" />;
    case 'pending':
      return <Clock className="h-4 w-4 text-amber-500" />;
    default:
      return <Minus className="h-4 w-4 text-slate-400" />;
  }
}

function tierBadge(tier: number) {
  const colors: Record<number, string> = {
    0: 'bg-slate-100 text-slate-600',
    1: 'bg-blue-50 text-blue-700',
    2: 'bg-amber-50 text-amber-700',
    3: 'bg-red-50 text-red-700',
  };
  const labels: Record<number, string> = {
    0: 'Silent',
    1: 'Notify',
    2: 'Undo',
    3: 'Approval',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${colors[tier] ?? colors[0]}`}>
      T{tier} · {labels[tier] ?? 'Unknown'}
    </span>
  );
}

function statusBadge(status: string) {
  const colors: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-700',
    executing: 'bg-blue-50 text-blue-700',
    completed: 'bg-green-50 text-green-700',
    failed: 'bg-red-50 text-red-700',
    dismissed: 'bg-slate-50 text-slate-500',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${colors[status] ?? colors.pending}`}>
      {status}
    </span>
  );
}

function confidenceBar(confidence: number) {
  const pct = Math.round(confidence * 100);
  const color = pct >= 80 ? 'bg-green-500' : pct >= 60 ? 'bg-amber-500' : 'bg-red-400';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] text-slate-500 tabular-nums w-8">{pct}%</span>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────

export default async function AutonomousPage() {
  const supabase = createServiceClient();

  // Fetch everything in parallel
  const [actionsResult, insightsResult, learningsResult, settingsResult, auditResult] =
    await Promise.all([
      supabase
        .from('autonomous_actions')
        .select('*')
        .order('executed_at', { ascending: false })
        .limit(50),
      supabase
        .from('insights')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30),
      supabase
        .from('learnings')
        .select('*')
        .order('confidence', { ascending: false })
        .limit(20),
      supabase
        .from('system_settings')
        .select('key, value')
        .in('key', [
          'auto_executor_enabled',
          'simulation_mode',
          'feedback_loop_enabled',
          'insight_engine_enabled',
          'auto_executor_max_tier',
          'auto_executor_daily_budget',
        ]),
      supabase
        .from('cron_run_audit')
        .select('*')
        .in('job_name', ['insight-engine', 'auto-executor', 'feedback-loop'])
        .order('started_at', { ascending: false })
        .limit(15),
    ]);

  const actions = (actionsResult.data ?? []) as ActionRow[];
  const insights = (insightsResult.data ?? []) as InsightRow[];
  const learnings = (learningsResult.data ?? []) as LearningRow[];
  const settingsMap = new Map<string, string>();
  for (const row of (settingsResult.data ?? []) as SettingRow[]) {
    settingsMap.set(row.key, row.value);
  }
  const audits = auditResult.data ?? [];

  // Outcome stats
  const measured = actions.filter((a) => a.outcome !== 'pending');
  const positive = measured.filter((a) => a.outcome === 'positive').length;
  const negative = measured.filter((a) => a.outcome === 'negative').length;
  const neutral = measured.filter((a) => a.outcome === 'neutral').length;
  const successRate = measured.length > 0 ? Math.round((positive / measured.length) * 100) : 0;

  const card = 'bg-white border border-slate-200 rounded-lg shadow-sm';

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Bot className="h-7 w-7 text-[var(--sfp-navy)]" />
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Autonomous System</h1>
            <p className="text-sm text-slate-500">
              Self-optimizing revenue engine — actions, outcomes, and learnings
            </p>
          </div>
        </div>

        {/* System Status Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className={`${card} p-4`}>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Auto-Executor</p>
            <p className={`text-lg font-bold ${settingsMap.get('auto_executor_enabled') === 'true' ? 'text-green-600' : 'text-slate-400'}`}>
              {settingsMap.get('auto_executor_enabled') === 'true' ? 'ENABLED' : 'DISABLED'}
            </p>
          </div>
          <div className={`${card} p-4`}>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Mode</p>
            <p className={`text-lg font-bold ${settingsMap.get('simulation_mode') === 'true' ? 'text-amber-600' : 'text-green-600'}`}>
              {settingsMap.get('simulation_mode') === 'true' ? 'SIMULATION' : 'LIVE'}
            </p>
          </div>
          <div className={`${card} p-4`}>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Max Tier</p>
            <p className="text-lg font-bold text-slate-900">
              T{settingsMap.get('auto_executor_max_tier') ?? '1'}
            </p>
          </div>
          <div className={`${card} p-4`}>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Daily Budget</p>
            <p className="text-lg font-bold text-slate-900">
              {settingsMap.get('auto_executor_daily_budget') ?? '5'}
            </p>
          </div>
          <div className={`${card} p-4`}>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Success Rate</p>
            <p className={`text-lg font-bold ${successRate >= 70 ? 'text-green-600' : successRate >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
              {measured.length > 0 ? `${successRate}%` : '—'}
            </p>
          </div>
          <div className={`${card} p-4`}>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Total Actions</p>
            <p className="text-lg font-bold text-slate-900">{actions.length}</p>
          </div>
        </div>

        {/* Outcome Summary Bar */}
        {measured.length > 0 && (
          <div className={`${card} p-4 mb-8`}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-slate-900">Outcome Distribution</p>
              <p className="text-xs text-slate-500">{measured.length} measured actions</p>
            </div>
            <div className="flex h-4 rounded-full overflow-hidden bg-slate-100">
              {positive > 0 && (
                <div
                  className="bg-green-500 flex items-center justify-center text-[9px] font-bold text-white"
                  style={{ width: `${(positive / measured.length) * 100}%` }}
                >
                  {positive}
                </div>
              )}
              {neutral > 0 && (
                <div
                  className="bg-slate-300 flex items-center justify-center text-[9px] font-bold text-slate-600"
                  style={{ width: `${(neutral / measured.length) * 100}%` }}
                >
                  {neutral}
                </div>
              )}
              {negative > 0 && (
                <div
                  className="bg-red-400 flex items-center justify-center text-[9px] font-bold text-white"
                  style={{ width: `${(negative / measured.length) * 100}%` }}
                >
                  {negative}
                </div>
              )}
            </div>
            <div className="flex gap-6 mt-2 text-xs text-slate-500">
              <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-500" /> {positive} positive</span>
              <span className="flex items-center gap-1"><Minus className="h-3 w-3 text-slate-400" /> {neutral} neutral</span>
              <span className="flex items-center gap-1"><XCircle className="h-3 w-3 text-red-400" /> {negative} negative</span>
            </div>
          </div>
        )}

        {/* Two Column: Actions + Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Actions Table */}
          <div className={card}>
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <Zap className="h-4 w-4 text-[var(--sfp-navy)]" />
              <h2 className="text-sm font-semibold text-slate-900">Autonomous Actions</h2>
              <span className="text-xs text-slate-400 ml-auto">{actions.length} total</span>
            </div>
            <div className="divide-y divide-slate-50 max-h-[500px] overflow-y-auto">
              {actions.length === 0 ? (
                <div className="p-6 text-center text-sm text-slate-400">No actions recorded yet</div>
              ) : (
                actions.map((action) => (
                  <div key={action.id} className="px-6 py-3 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-2 mb-1">
                      {outcomeIcon(action.outcome)}
                      <span className="text-sm text-slate-700 font-medium truncate flex-1">
                        {action.description}
                      </span>
                      {tierBadge(action.risk_tier)}
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-slate-400 ml-6">
                      <span>{action.action_type}</span>
                      <span>{action.market ?? 'global'}</span>
                      <span>{formatAge(action.executed_at)}</span>
                      {action.undone_at && (
                        <span className="text-red-500 font-medium">UNDONE</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Insights Table */}
          <div className={card}>
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[var(--sfp-navy)]" />
              <h2 className="text-sm font-semibold text-slate-900">Insights</h2>
              <span className="text-xs text-slate-400 ml-auto">{insights.length} total</span>
            </div>
            <div className="divide-y divide-slate-50 max-h-[500px] overflow-y-auto">
              {insights.length === 0 ? (
                <div className="p-6 text-center text-sm text-slate-400">No insights generated yet</div>
              ) : (
                insights.map((insight) => (
                  <div key={insight.id} className="px-6 py-3 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-2 mb-1">
                      {statusBadge(insight.status)}
                      <span className="text-sm text-slate-700 font-medium truncate flex-1">
                        {insight.title}
                      </span>
                      {tierBadge(insight.risk_tier)}
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-slate-400 ml-6">
                      <span>{insight.insight_type}</span>
                      <span>{insight.market ?? 'global'}</span>
                      <span>${Number(insight.expected_revenue_impact).toFixed(0)}/mo impact</span>
                      <span>{formatAge(insight.created_at)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Learnings */}
        <div className={`${card} mb-8`}>
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <Brain className="h-4 w-4 text-[var(--sfp-navy)]" />
            <h2 className="text-sm font-semibold text-slate-900">System Learnings</h2>
            <span className="text-xs text-slate-400 ml-auto">{learnings.length} accumulated</span>
          </div>
          <div className="divide-y divide-slate-50">
            {learnings.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-400">
                No learnings yet — feedback loop will populate after actions are measured
              </div>
            ) : (
              learnings.map((learning) => (
                <div key={learning.id} className="px-6 py-4">
                  <div className="flex items-start gap-3">
                    <Brain className="h-4 w-4 text-[var(--sfp-navy)] mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700 font-medium">{learning.learning}</p>
                      <div className="mt-1.5 w-40">
                        {confidenceBar(learning.confidence)}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] text-slate-400">
                        {learning.sample_size} samples
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {learning.market ?? 'global'} · {learning.category.replace(/_/g, ' ')}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Cron Audit Log */}
        <div className={card}>
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-[var(--sfp-navy)]" />
            <h2 className="text-sm font-semibold text-slate-900">Cron Run Audit</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wide border-b border-slate-100">
                  <th className="px-6 py-3">Job</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Duration</th>
                  <th className="px-6 py-3">Processed</th>
                  <th className="px-6 py-3">When</th>
                  <th className="px-6 py-3">Error</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {audits.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-slate-400">
                      No audit records yet
                    </td>
                  </tr>
                ) : (
                  audits.map((audit: Record<string, unknown>) => (
                    <tr key={audit.id as string} className="hover:bg-slate-50">
                      <td className="px-6 py-3 font-medium text-slate-700">
                        {audit.job_name as string}
                      </td>
                      <td className="px-6 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                          audit.status === 'success' ? 'bg-green-50 text-green-700' :
                          audit.status === 'error' ? 'bg-red-50 text-red-700' :
                          audit.status === 'running' ? 'bg-blue-50 text-blue-700' :
                          'bg-slate-50 text-slate-600'
                        }`}>
                          {audit.status as string}
                        </span>
                      </td>
                      <td className="px-6 py-3 tabular-nums text-slate-600">
                        {audit.duration_ms ? `${((audit.duration_ms as number) / 1000).toFixed(1)}s` : '—'}
                      </td>
                      <td className="px-6 py-3 tabular-nums text-slate-600">
                        {(audit.processed_count as number) ?? '—'}
                      </td>
                      <td className="px-6 py-3 text-slate-500">
                        {audit.started_at ? formatAge(audit.started_at as string) : '—'}
                      </td>
                      <td className="px-6 py-3 text-red-500 text-xs truncate max-w-48">
                        {(audit.error_message as string) ?? ''}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
