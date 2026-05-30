import { describe, it, expect } from 'vitest';
import { computeWidgetHealth, type SystemStatus } from '@/lib/dashboard/status';

describe('computeWidgetHealth', () => {
  it('returns "operational" only when source healthy AND not stale AND no error', () => {
    expect(computeWidgetHealth({
      source: 'live',
      lastSuccessfulAt: new Date().toISOString(),
      maxAgeMinutes: 60,
      errorState: null,
      sampleSize: 100,
    })).toBe<SystemStatus>('operational');
  });

  it('returns "stale" when lastSuccessfulAt older than maxAgeMinutes', () => {
    const old = new Date(Date.now() - 1000 * 60 * 90).toISOString();

    expect(computeWidgetHealth({
      source: 'live',
      lastSuccessfulAt: old,
      maxAgeMinutes: 60,
      errorState: null,
      sampleSize: 100,
    })).toBe<SystemStatus>('stale');
  });

  it('returns "degraded" when errorState present', () => {
    expect(computeWidgetHealth({
      source: 'live',
      lastSuccessfulAt: new Date().toISOString(),
      maxAgeMinutes: 60,
      errorState: 'partial-failure',
      sampleSize: 50,
    })).toBe<SystemStatus>('degraded');
  });

  it('returns "never-run" when lastSuccessfulAt is null', () => {
    expect(computeWidgetHealth({
      source: 'live',
      lastSuccessfulAt: null,
      maxAgeMinutes: 60,
      errorState: null,
      sampleSize: 0,
    })).toBe<SystemStatus>('never-run');
  });
});
