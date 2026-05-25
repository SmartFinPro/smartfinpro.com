// app/(dashboard)/dashboard/cron-health/page.tsx
import { createClient } from '@supabase/supabase-js';
import { CheckCircle2, XCircle, AlertTriangle, Clock, RefreshCw } from 'lucide-react';
import { CRON_DEFINITIONS } from '@/lib/dashboard/cron-definitions';
import { getCronRuntimeState, getResolvedCronStatus } from '@/lib/dashboard/cron-status';
import { TriggerButton } from './trigger-button';

interface CronLog {
  job_name: string;
  status: string;
  metadata?: {
    canonicalStatus?: string | null;
  } | null;
  duration_ms: number | null;
  error: string | null;
  executed_at: string;
}

function formatAge(executedAt: string): string {
  const mins = Math.floor((Date.now() - new Date(executedAt).getTime()) / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default async function CronHealthPage() {
  // Use service role key to bypass RLS for dashboard reads
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
  );

  // Fetch latest run for each job in one query
  const { data } = await supabase
    .from('cron_logs')
    .select('job_name, status, metadata, duration_ms, error, executed_at')
    .order('executed_at', { ascending: false })
    .limit(200);

  // Build map: job_name → most recent log
  const latestByJob = new Map<string, CronLog>();
  for (const row of (data ?? []) as CronLog[]) {
    if (!latestByJob.has(row.job_name)) {
      latestByJob.set(row.job_name, row);
    }
  }

  const healthy = CRON_DEFINITIONS.filter((c) => getCronRuntimeState(latestByJob.get(c.name), c.maxMinutes) === 'healthy').length;
  const warning = CRON_DEFINITIONS.filter((c) => getCronRuntimeState(latestByJob.get(c.name), c.maxMinutes) === 'warning').length;
  const stale = CRON_DEFINITIONS.filter((c) => getCronRuntimeState(latestByJob.get(c.name), c.maxMinutes) === 'stale').length;
  const errorOrNeverRun = CRON_DEFINITIONS.filter((c) => {
    const runtimeState = getCronRuntimeState(latestByJob.get(c.name), c.maxMinutes);
    return runtimeState === 'error' || runtimeState === 'never-run';
  }).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Cron Health</h1>
        <p className="text-sm text-slate-500 mt-1">Live status of all {CRON_DEFINITIONS.length} scheduled background jobs</p>
      </div>

      {/* Summary Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-800">{healthy}</div>
            <div className="text-xs text-slate-500">Healthy</div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-800">{warning}</div>
            <div className="text-xs text-slate-500">Warning</div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
            <Clock className="h-5 w-5 text-slate-500" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-800">{stale}</div>
            <div className="text-xs text-slate-500">Stale</div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
            <XCircle className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-800">{errorOrNeverRun}</div>
            <div className="text-xs text-slate-500">Error / Never run</div>
          </div>
        </div>
      </div>

      {/* Cron Grid */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-700">All Jobs</span>
          <span className="text-xs text-slate-400">Refreshes on page load</span>
        </div>
        <div className="divide-y divide-slate-100">
          {CRON_DEFINITIONS.map((cron) => {
            const log = latestByJob.get(cron.name);
            const runtimeState = getCronRuntimeState(log, cron.maxMinutes);
            const normalizedStatus = getResolvedCronStatus(log);
            const statusText = log
              ? `${normalizedStatus}${log.duration_ms ? ` · ${log.duration_ms}ms` : ''}`
              : 'never run';
            const statusClass =
              runtimeState === 'healthy' ? 'text-emerald-500' :
              runtimeState === 'warning' ? 'text-amber-500' :
              runtimeState === 'stale' ? 'text-slate-500' :
              runtimeState === 'error' ? 'text-red-500' :
              'text-slate-400';

            return (
              <div key={cron.name} className="px-5 py-3 flex items-center gap-4">
                {/* Status dot */}
                <div className="shrink-0">
                  {runtimeState === 'healthy' && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                  {runtimeState === 'warning' && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                  {runtimeState === 'stale' && <Clock className="h-4 w-4 text-slate-500" />}
                  {runtimeState === 'error' && <XCircle className="h-4 w-4 text-red-500" />}
                  {runtimeState === 'never-run' && <Clock className="h-4 w-4 text-slate-300" />}
                </div>

                {/* Job name + schedule */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-700">{cron.label}</div>
                  <div className="text-xs text-slate-400 font-mono">{cron.schedule}</div>
                </div>

                {/* Last run */}
                <div className="text-right shrink-0">
                  {log ? (
                    <>
                      <div className="text-xs font-medium text-slate-600">{formatAge(log.executed_at)}</div>
                      <div
                        className={`text-[11px] ${statusClass}`}
                        data-testid={`cron-status-${normalizedStatus}`}
                        title={normalizedStatus !== log.status ? `Stored status: ${log.status}` : undefined}
                      >
                        {statusText}
                      </div>
                    </>
                  ) : (
                    <div className="text-xs text-slate-400">never run</div>
                  )}
                </div>

                {/* Error badge */}
                {log?.error && (
                  <div className="ml-2 px-2 py-0.5 bg-red-50 border border-red-200 rounded text-[11px] text-red-600 max-w-[180px] truncate" title={log.error}>
                    {log.error}
                  </div>
                )}

                {/* Trigger button */}
                <TriggerButton job={cron.name} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer hint */}
      <p className="text-xs text-slate-400 flex items-center gap-1">
        <RefreshCw className="h-3 w-3" />
        Hard-reload (⌘R) um aktuellen Status zu laden
      </p>
    </div>
  );
}
