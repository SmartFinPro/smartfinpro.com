import { describe, expect, it } from 'vitest';
import { inferTriggeredCronLogOutcome } from '@/lib/dashboard/trigger-cron-status';

describe('inferTriggeredCronLogOutcome', () => {
  it('treats plain 200 success responses as success', () => {
    expect(
      inferTriggeredCronLogOutcome({
        httpStatus: 200,
        bodyText: JSON.stringify({ ok: true, success: true }),
      }),
    ).toEqual({ status: 'success', error: null });
  });

  it('treats 207 and partial bodies as partial instead of success', () => {
    expect(
      inferTriggeredCronLogOutcome({
        httpStatus: 207,
        bodyText: JSON.stringify({ success: false, partial: true, message: 'No enabled connectors found' }),
      }),
    ).toEqual({
      status: 'partial',
      error: 'No enabled connectors found',
    });
  });

  it('treats 5xx responses as errors with body context', () => {
    expect(
      inferTriggeredCronLogOutcome({
        httpStatus: 500,
        bodyText: JSON.stringify({ error: 'Sync failed' }),
      }),
    ).toEqual({
      status: 'error',
      error: 'HTTP 500: Sync failed',
    });
  });
});
