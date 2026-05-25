import { describe, expect, it, vi } from 'vitest';
import { insertCronLogCompatible } from '@/lib/logging';

describe('insertCronLogCompatible', () => {
  it('persists canonical status when the DB accepts it', async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    const supabase = {
      from: vi.fn(() => ({ insert })),
    };

    const result = await insertCronLogCompatible(supabase as never, {
      job_name: 'ev-refresh',
      status: 'success',
      duration_ms: 123,
      error: null,
      metadata: null,
      executed_at: '2026-05-24T00:00:00.000Z',
    });

    expect(result).toEqual({ persistedStatus: 'success', usedFallback: false });
    expect(insert).toHaveBeenCalledTimes(1);
  });

  it('falls back to legacy completed when a status check constraint rejects success', async () => {
    const insert = vi
      .fn()
      .mockResolvedValueOnce({ error: new Error('new row for relation \"cron_logs\" violates check constraint \"cron_logs_status_check\"') })
      .mockResolvedValueOnce({ error: null });
    const supabase = {
      from: vi.fn(() => ({ insert })),
    };

    const result = await insertCronLogCompatible(supabase as never, {
      job_name: 'ev-refresh',
      status: 'success',
      duration_ms: 123,
      error: null,
      metadata: { source: 'dashboard-trigger' },
      executed_at: '2026-05-24T00:00:00.000Z',
    });

    expect(result).toEqual({ persistedStatus: 'completed', usedFallback: true });
    expect(insert).toHaveBeenCalledTimes(2);
    expect(insert.mock.calls[1]?.[0]).toMatchObject({
      status: 'completed',
      metadata: {
        source: 'dashboard-trigger',
        canonicalStatus: 'success',
        compatibilityFallback: true,
      },
    });
  });

  it('also falls back when the insert throws the constraint error directly', async () => {
    const insert = vi
      .fn()
      .mockRejectedValueOnce({ message: 'new row for relation "cron_logs" violates check constraint "cron_logs_status_check"' })
      .mockResolvedValueOnce({ error: null });
    const supabase = {
      from: vi.fn(() => ({ insert })),
    };

    const result = await insertCronLogCompatible(supabase as never, {
      job_name: 'ev-refresh',
      status: 'success',
      duration_ms: 123,
      error: null,
      metadata: null,
      executed_at: '2026-05-24T00:00:00.000Z',
    });

    expect(result).toEqual({ persistedStatus: 'completed', usedFallback: true });
    expect(insert).toHaveBeenCalledTimes(2);
  });

  it('stores canonical error status in metadata when legacy fallback is needed', async () => {
    const insert = vi
      .fn()
      .mockResolvedValueOnce({ error: new Error('new row for relation \"cron_logs\" violates check constraint \"cron_logs_status_check\"') })
      .mockResolvedValueOnce({ error: null });
    const supabase = {
      from: vi.fn(() => ({ insert })),
    };

    const result = await insertCronLogCompatible(supabase as never, {
      job_name: 'sync-competitors',
      status: 'error',
      duration_ms: 8000,
      error: '34 keyword scans failed',
      metadata: { source: 'dashboard-trigger' },
      executed_at: '2026-05-25T00:00:00.000Z',
    });

    expect(result).toEqual({ persistedStatus: 'completed', usedFallback: true });
    expect(insert.mock.calls[1]?.[0]).toMatchObject({
      status: 'completed',
      metadata: {
        source: 'dashboard-trigger',
        canonicalStatus: 'error',
        compatibilityFallback: true,
      },
    });
  });
});
