export type SystemStatus = 'operational' | 'degraded' | 'stale' | 'down' | 'never-run' | 'unknown';
export type DataSource = 'live' | 'seeded' | 'placeholder' | 'cached';

export interface WidgetHealthInput {
  source: DataSource;
  lastSuccessfulAt: string | null;
  maxAgeMinutes: number;
  errorState: string | null;
  sampleSize: number;
}

export function isStale(lastSuccessfulAt: string | null, maxAgeMinutes: number): boolean {
  if (!lastSuccessfulAt) return false;
  const ageMinutes = (Date.now() - new Date(lastSuccessfulAt).getTime()) / 60000;
  return ageMinutes > maxAgeMinutes;
}

export function computeWidgetHealth(input: WidgetHealthInput): SystemStatus {
  if (input.errorState) return 'degraded';
  if (!input.lastSuccessfulAt) return 'never-run';
  if (isStale(input.lastSuccessfulAt, input.maxAgeMinutes)) return 'stale';
  if (input.source === 'placeholder') return 'degraded';
  return 'operational';
}

export const STATUS_COLOR: Record<SystemStatus, string> = {
  operational: 'emerald',
  degraded: 'amber',
  stale: 'amber',
  down: 'red',
  'never-run': 'slate',
  unknown: 'slate',
};

export const STATUS_LABEL: Record<SystemStatus, string> = {
  operational: 'Operational',
  degraded: 'Degraded',
  stale: 'Stale data',
  down: 'Down',
  'never-run': 'Never run',
  unknown: 'Unknown',
};
