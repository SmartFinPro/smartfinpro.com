export type CanonicalCronStatus = 'success' | 'error' | 'partial' | 'skipped' | 'unknown';
export type CronRuntimeState = 'healthy' | 'warning' | 'stale' | 'error' | 'never-run';

export interface CronLogLike {
  status: string;
  executed_at: string;
}

export function normalizeCronStatus(status: string | null | undefined): CanonicalCronStatus {
  if (!status) return 'unknown';
  if (status === 'completed') return 'success';
  if (status === 'success' || status === 'error' || status === 'partial' || status === 'skipped') {
    return status;
  }
  return 'unknown';
}

export function getCronRuntimeState(
  log: CronLogLike | undefined,
  maxMinutes: number,
): CronRuntimeState {
  if (!log) return 'never-run';

  const normalizedStatus = normalizeCronStatus(log.status);
  const ageMinutes = (Date.now() - new Date(log.executed_at).getTime()) / 60000;

  if (normalizedStatus === 'error') return 'error';
  if (ageMinutes > maxMinutes) return 'stale';
  if (normalizedStatus === 'partial') return 'warning';
  if (ageMinutes > maxMinutes * 0.75) return 'warning';
  return 'healthy';
}

export function isSuccessfulCronStatus(status: string | null | undefined): boolean {
  return normalizeCronStatus(status) === 'success';
}
