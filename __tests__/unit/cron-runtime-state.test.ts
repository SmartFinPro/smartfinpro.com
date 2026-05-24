import { describe, expect, it } from 'vitest';
import {
  getCronRuntimeState,
  isSuccessfulCronStatus,
  normalizeCronStatus,
} from '@/lib/dashboard/cron-status';

describe('normalizeCronStatus', () => {
  it('maps legacy completed to success', () => {
    expect(normalizeCronStatus('completed')).toBe('success');
  });

  it('passes canonical statuses through unchanged', () => {
    expect(normalizeCronStatus('success')).toBe('success');
    expect(normalizeCronStatus('partial')).toBe('partial');
    expect(normalizeCronStatus('error')).toBe('error');
    expect(normalizeCronStatus('skipped')).toBe('skipped');
  });
});

describe('getCronRuntimeState', () => {
  it('returns never-run when no log exists', () => {
    expect(getCronRuntimeState(undefined, 60)).toBe('never-run');
  });

  it('returns stale for old legacy completed runs instead of error', () => {
    const old = new Date(Date.now() - 90 * 60 * 1000).toISOString();
    expect(getCronRuntimeState({ status: 'completed', executed_at: old }, 60)).toBe('stale');
  });

  it('returns error for explicit error status', () => {
    const now = new Date().toISOString();
    expect(getCronRuntimeState({ status: 'error', executed_at: now }, 60)).toBe('error');
  });
});

describe('isSuccessfulCronStatus', () => {
  it('treats completed as successful for rollout compatibility', () => {
    expect(isSuccessfulCronStatus('completed')).toBe(true);
    expect(isSuccessfulCronStatus('success')).toBe(true);
    expect(isSuccessfulCronStatus('error')).toBe(false);
  });
});
