// app/(dashboard)/dashboard/cron-health/page.tsx
import { createClient } from '@supabase/supabase-js';
import { CheckCircle2, XCircle, AlertTriangle, Clock, RefreshCw } from 'lucide-react';

// All 19 active cron jobs with expected max interval (minutes)
const CRON_DEFINITIONS = [
  { name: 'spike-monitor',    label: 'Spike Monitor',         schedule: 'every 15 min',   maxMinutes: 30 },
  { name: 'perf-governance',  label: 'Perf Governance',       schedule: 'every 30 min',   maxMinutes: 60 },
  { name: 'auto-genesis',     label: 'Auto-Genesis',          schedule: 'every 30 min',   maxMinutes: 60 },
  { name: 'ev-refresh',       label: 'EV Refresh',            schedule: 'hourly :30',     maxMinutes: 90 },
  { name: 'sync-conversions', label: 'Sync Conversions',      schedule: 'hourly :00',     maxMinutes: 90 },
  { name: 'update-fx-rates',  label: 'FX Rates',              schedule: 'daily 00:05',    maxMinutes: 1500 },
  { name: 'seo-drift',        label: 'SEO Drift Check',       schedule: 'daily 01:00',    maxMinutes: 1500 },
  { name: 'check-links',      label: 'Affiliate Link Health', schedule: 'daily 02:00',    maxMinutes: 1500 },
  { name: 'sync-competitors', label: 'Sync Competitors',      schedule: 'daily 03:00',    maxMinutes: 1500 },
  { name: 'sync-revenue',     label: 'Sync Revenue',          schedule: 'daily 04:00',    maxMinutes: 1500 },
  { name: 'freshness-check',  label: 'Freshness Check',       schedule: 'daily 05:00',    maxMinutes: 1500 },
  { name: 'check-rankings',   label: 'Check Rankings',        schedule: 'daily 06:00',    maxMinutes: 1500 },
  { name: 'affiliate-scout',  label: 'Affiliate Scout',       schedule: 'daily 08:00',    maxMinutes: 1500 },
  { name: 'send-emails',      label: 'Send Emails',           schedule: 'daily 09:00',    maxMinutes: 1500 },
  { name: 'backlink-post',    label: 'Backlink Post',         schedule: 'daily 21:00',    maxMinutes: 1500 },
  { name: 'daily-strategy',   label: 'Daily Strategy',        schedule: 'daily 20:00',    maxMinutes: 1500 },
  { name: 'backlink-scout',   label: 'Backlink Scout',        schedule: 'daily 22:00',    maxMinutes: 1500 },
  { name: 'backlink-verify',  label: 'Backlink Verify',       schedule: 'daily 23:00',    maxMinutes: 1500 },
  { name: 'weekly-report',    label: 'Weekly Report',         schedule: 'Mon 07:00',      maxMinutes: 10080 },
] as const;

interface CronLog {
  job_name: string;
  status: string;
  duration_ms: number | null;
  error: string | null;
  executed_at: string;
}

function getStatus(log: CronLog | undefined, maxMinutes: number): 'green' | 'yellow' | 'red' | 'unknown' {
  if (!log) return 'unknown';
  const ageMinutes = (Date.now() - new Date(log.executed_at).getTime()) / 60000;
  if (log.status === 'error') return 'red';
  if (ageMinutes > maxMinutes) return 'red';
  if (ageMinutes > maxMinutes * 0.75) return 'yellow';
  return 'green';
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
    .select('job_name, status, duration_ms, error, executed_at')
    .order('executed_at', { ascending: false })
    .limit(200);

  // Build map: job_name → most recent log
  const latestByJob = new Map<string, CronLog>();
  for (const row of (data ?? []) as CronLog[]) {
    if (!latestByJob.has(row.job_name)) {
      latestByJob.set(row.job_name, row);
    }
  }

  const healthy  = CRON_DEFINITIONS.filter(c => getStatus(latestByJob.get(c.name), c.maxMinutes) === 'green').length;
  const warning  = CRON_DEFINITIONS.filter(c => getStatus(latestByJob.get(c.name), c.maxMinutes) === 'yellow').length;
  const dead     = CRON_DEFINITIONS.filter(c => ['red', 'unknown'].includes(getStatus(latestByJob.get(c.name), c.maxMinutes))).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Cron Health</h1>
        <p className="text-sm text-slate-500 mt-1">Live status of all 19 background jobs</p>
      </div>

      {/* Summary Tiles */}
      <div className="grid grid-cols-3 gap-4">
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
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
            <XCircle className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-800">{dead}</div>
            <div className="text-xs text-slate-500">Not run yet / Error</div>
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
            const status = getStatus(log, cron.maxMinutes);

            return (
              <div key={cron.name} className="px-5 py-3 flex items-center gap-4">
                {/* Status dot */}
                <div className="shrink-0">
                  {status === 'green'   && <CheckCircle2  className="h-4 w-4 text-emerald-500" />}
                  {status === 'yellow'  && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                  {status === 'red'     && <XCircle       className="h-4 w-4 text-red-500" />}
                  {status === 'unknown' && <Clock         className="h-4 w-4 text-slate-300" />}
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
                      <div className={`text-[11px] ${
                        log.status === 'completed' ? 'text-emerald-500' :
                        log.status === 'error'     ? 'text-red-500' :
                        'text-slate-400'
                      }`}>
                        {log.status}{log.duration_ms ? ` · ${log.duration_ms}ms` : ''}
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
