import { describe, expect, it } from 'vitest';
import { CRON_DEFINITIONS, CRON_DEFINITIONS_BY_NAME, isKnownCronJob } from '@/lib/dashboard/cron-definitions';

describe('CRON_DEFINITIONS', () => {
  it('tracks the 23 scheduled jobs from the GitHub Actions workflow', () => {
    expect(CRON_DEFINITIONS).toHaveLength(23);
    expect(CRON_DEFINITIONS.map((job) => job.name)).toEqual(expect.arrayContaining([
      'sync-rankings',
      'auto-executor',
      'feedback-loop',
      'insight-engine',
    ]));
  });

  it('preserves scheduler-specific request methods for manual triggers', () => {
    expect(CRON_DEFINITIONS_BY_NAME.get('ev-refresh')?.requestMethod).toBe('POST');
    expect(CRON_DEFINITIONS_BY_NAME.get('weekly-report')?.requestMethod).toBe('POST');
    expect(CRON_DEFINITIONS_BY_NAME.get('spike-monitor')?.requestMethod).toBe('GET');
  });

  it('recognizes valid cron jobs and rejects unknown names', () => {
    expect(isKnownCronJob('sync-rankings')).toBe(true);
    expect(isKnownCronJob('totally-unknown-job')).toBe(false);
  });
});
