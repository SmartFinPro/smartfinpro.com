export type CronRequestMethod = 'GET' | 'POST';

export interface CronDefinition {
  name: string;
  label: string;
  schedule: string;
  maxMinutes: number;
  requestMethod: CronRequestMethod;
}

export const CRON_DEFINITIONS: readonly CronDefinition[] = [
  { name: 'spike-monitor',    label: 'Spike Monitor',         schedule: 'hourly :05 UTC',    maxMinutes: 90,    requestMethod: 'GET' },
  { name: 'sync-conversions', label: 'Sync Conversions',      schedule: 'hourly :05 UTC',    maxMinutes: 90,    requestMethod: 'POST' },
  { name: 'ev-refresh',       label: 'EV Refresh',            schedule: 'hourly :05 UTC',    maxMinutes: 90,    requestMethod: 'POST' },
  { name: 'perf-governance',  label: 'Perf Governance',       schedule: 'hourly :05 UTC',    maxMinutes: 90,    requestMethod: 'GET' },
  { name: 'update-fx-rates',  label: 'FX Rates',              schedule: 'daily 02:00 UTC',   maxMinutes: 1500,  requestMethod: 'POST' },
  { name: 'seo-drift',        label: 'SEO Drift Check',       schedule: 'daily 02:00 UTC',   maxMinutes: 1500,  requestMethod: 'GET' },
  { name: 'check-links',      label: 'Affiliate Link Health', schedule: 'daily 02:00 UTC',   maxMinutes: 1500,  requestMethod: 'GET' },
  { name: 'sync-competitors', label: 'Sync Competitors',      schedule: 'daily 02:00 UTC',   maxMinutes: 1500,  requestMethod: 'GET' },
  { name: 'freshness-check',  label: 'Freshness Check',       schedule: 'daily 02:00 UTC',   maxMinutes: 1500,  requestMethod: 'GET' },
  { name: 'check-rankings',   label: 'Check Rankings',        schedule: 'daily 02:00 UTC',   maxMinutes: 1500,  requestMethod: 'GET' },
  { name: 'sync-rankings',    label: 'Sync Rankings',         schedule: 'daily 02:00 UTC',   maxMinutes: 1500,  requestMethod: 'GET' },
  { name: 'affiliate-scout',  label: 'Affiliate Scout',       schedule: 'daily 02:00 UTC',   maxMinutes: 1500,  requestMethod: 'GET' },
  { name: 'send-emails',      label: 'Send Emails',           schedule: 'daily 02:00 UTC',   maxMinutes: 1500,  requestMethod: 'POST' },
  { name: 'sync-revenue',     label: 'Sync Revenue',          schedule: 'daily 02:00 UTC',   maxMinutes: 1500,  requestMethod: 'POST' },
  { name: 'daily-strategy',   label: 'Daily Strategy',        schedule: 'daily 02:00 UTC',   maxMinutes: 1500,  requestMethod: 'GET' },
  { name: 'backlink-post',    label: 'Backlink Post',         schedule: 'daily 02:00 UTC',   maxMinutes: 1500,  requestMethod: 'GET' },
  { name: 'backlink-scout',   label: 'Backlink Scout',        schedule: 'daily 02:00 UTC',   maxMinutes: 1500,  requestMethod: 'GET' },
  { name: 'backlink-verify',  label: 'Backlink Verify',       schedule: 'daily 02:00 UTC',   maxMinutes: 1500,  requestMethod: 'GET' },
  { name: 'auto-genesis',     label: 'Auto-Genesis',          schedule: 'daily 02:00 UTC',   maxMinutes: 1500,  requestMethod: 'GET' },
  { name: 'auto-executor',    label: 'Auto-Executor',         schedule: 'daily 05:00 UTC',   maxMinutes: 1500,  requestMethod: 'GET' },
  { name: 'feedback-loop',    label: 'Feedback Loop',         schedule: 'daily 22:00 UTC',   maxMinutes: 1500,  requestMethod: 'GET' },
  { name: 'insight-engine',   label: 'Insight Engine',        schedule: 'Sun 04:00 UTC',     maxMinutes: 10080, requestMethod: 'GET' },
  { name: 'weekly-report',    label: 'Weekly Report',         schedule: 'Mon 07:00 UTC',     maxMinutes: 10080, requestMethod: 'POST' },
] as const;

export type CronJobName = (typeof CRON_DEFINITIONS)[number]['name'];

export const CRON_DEFINITIONS_BY_NAME = new Map<string, CronDefinition>(
  CRON_DEFINITIONS.map((definition) => [definition.name, definition]),
);

export function isKnownCronJob(job: string): job is CronJobName {
  return CRON_DEFINITIONS_BY_NAME.has(job);
}
