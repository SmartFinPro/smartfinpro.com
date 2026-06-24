// __tests__/unit/cohorts-data-layer.test.ts
// Regression guard for lib/actions/cohorts.ts (getCohortData), the Supabase data
// layer behind the "Earnings per Click" dashboard (PR #26).
//
// Why this file exists: the conversion_events table's currency column is named
// `event_currency` (supabase/migrations/20260307150000_conversion_events.sql:33,
// and every other reader — funnel.ts, postback-service.ts, sync-service.ts —
// uses it). A shipped revision queried the non-existent `currency` column, which
// Postgres rejects at runtime ("column ... does not exist"), silently emptying
// EPC/LTV revenue. These tests lock the column name both structurally (the SELECT
// string) and behaviourally (the value must reach the FX conversion).
//
// Mock style mirrors __tests__/unit/postback-dedup.test.ts: a chainable Supabase
// stub; the query builder is awaitable (Promise.all awaits thenables).

import { describe, it, expect, vi, beforeEach } from 'vitest';

type QueryResult = { data: unknown[] | null; error: { message: string } | null };

const h = vi.hoisted(() => {
  const state = {
    linkClicks: { data: [] as unknown[] | null, error: null as { message: string } | null },
    conversionEvents: { data: [] as unknown[] | null, error: null as { message: string } | null },
    selectCols: { link_clicks: [] as string[], conversion_events: [] as string[] },
  };

  // Chainable, awaitable query builder. Every filter returns the same builder;
  // `.select()` records the requested columns; awaiting it yields {data,error}.
  function chain(table: 'link_clicks' | 'conversion_events') {
    const c: Record<string, unknown> = {};
    for (const m of ['eq', 'gte', 'not', 'limit']) c[m] = (..._args: unknown[]) => c;
    c.select = (cols: string) => {
      state.selectCols[table].push(cols);
      return c;
    };
    c.then = (resolve: (v: QueryResult) => unknown) =>
      resolve(table === 'link_clicks' ? state.linkClicks : state.conversionEvents);
    return c;
  }

  const supabase = {
    from: (table: string) => {
      if (table === 'link_clicks') return chain('link_clicks');
      if (table === 'conversion_events') return chain('conversion_events');
      throw new Error(`unexpected table queried: ${table}`);
    },
  };

  // EUR converts at 1.1; anything else (incl. null/undefined/USD) passes through.
  // So a row read from the WRONG column (-> undefined currency) would NOT convert.
  const toUSD = vi.fn((value: number, currency: string | null) =>
    currency === 'EUR' ? value * 1.1 : value,
  );
  const loadFxRates = vi.fn(async () => {});

  return { state, supabase, toUSD, loadFxRates };
});

vi.mock('server-only', () => ({}));
vi.mock('@/lib/supabase/server', () => ({ createServiceClient: () => h.supabase }));
vi.mock('@/lib/logging', () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));
vi.mock('@/lib/fx-rates', () => ({ loadFxRates: h.loadFxRates, toUSD: h.toUSD }));

import { getCohortData } from '@/lib/actions/cohorts';

beforeEach(() => {
  h.state.linkClicks = { data: [], error: null };
  h.state.conversionEvents = { data: [], error: null };
  h.state.selectCols.link_clicks = [];
  h.state.selectCols.conversion_events = [];
  h.toUSD.mockClear();
  h.loadFxRates.mockClear();
});

describe('getCohortData — conversion_events column contract', () => {
  it('selects the real `event_currency` column, never the non-existent `currency`', async () => {
    await getCohortData();

    const sel = h.state.selectCols.conversion_events[0] ?? '';
    const cols = sel.split(',').map((s) => s.trim());

    expect(cols).toContain('event_currency');
    // The regression: conversion_events has no bare `currency` column.
    expect(cols).not.toContain('currency');
  });
});

describe('getCohortData — FX conversion wiring', () => {
  it('feeds event_currency into toUSD so non-USD revenue is converted', async () => {
    h.state.linkClicks = {
      data: [{ click_id: 'c1', clicked_at: '2026-06-01T00:00:00Z' }],
      error: null,
    };
    h.state.conversionEvents = {
      data: [
        {
          click_id: 'c1',
          received_at: '2026-06-02T00:00:00Z',
          event_value: 100,
          event_currency: 'EUR',
          event_type: 'approved',
        },
      ],
      error: null,
    };

    const res = await getCohortData();

    expect(res.success).toBe(true);
    // The currency that reached toUSD proves which column was read. If the code
    // queried `currency`, the row (keyed by `event_currency`) would yield
    // undefined here and the assertion would fail.
    expect(h.toUSD).toHaveBeenCalledWith(100, 'EUR');
    // …and the converted value flows through to the KPI: 100 EUR × 1.1 = 110 USD.
    expect(res.data?.kpis.totalApprovedRevenueUsd).toBeCloseTo(110, 5);
  });
});

describe('getCohortData — query error handling', () => {
  it('surfaces the Postgres error the wrong column would raise, without throwing', async () => {
    h.state.conversionEvents = {
      data: null,
      error: { message: 'column conversion_events.currency does not exist' },
    };

    const res = await getCohortData();

    expect(res.success).toBe(false);
    expect(res.error).toContain('does not exist');
  });
});
