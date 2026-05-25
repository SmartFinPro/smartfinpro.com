export type CanonicalCronStatus = 'success' | 'error' | 'partial' | 'skipped' | 'unknown';
export type CronRuntimeState = 'healthy' | 'warning' | 'stale' | 'error' | 'never-run';

export interface CronLogLike {
  status: string;
  executed_at: string;
  metadata?: {
    canonicalStatus?: string | null;
  } | null;
}

export function normalizeCronStatus(status: string | null | undefined): CanonicalCronStatus {
  if (!status) return 'unknown';
  if (status === 'completed') return 'success';
  if (status === 'success' || status === 'error' || status === 'partial' || status === 'skipped') {
    return status;
  }
  return 'unknown';
}

export function getResolvedCronStatus(
  log: Pick<CronLogLike, 'status' | 'metadata'> | undefined,
): CanonicalCronStatus {
  const canonicalStatus = log?.metadata?.canonicalStatus;
  if (canonicalStatus) {
    return normalizeCronStatus(canonicalStatus);
  }
  return normalizeCronStatus(log?.status);
}

export function getCronRuntimeState(
  log: CronLogLike | undefined,
  maxMinutes: number,
): CronRuntimeState {
  if (!log) return 'never-run';

  const normalizedStatus = getResolvedCronStatus(log);
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

export function isSuccessfulCronLog(
  log: Pick<CronLogLike, 'status' | 'metadata'> | undefined,
): boolean {
  return getResolvedCronStatus(log) === 'success';
}
