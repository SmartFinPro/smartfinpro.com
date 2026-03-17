// __tests__/integration/postback-dedup-db.test.ts
// Integration tests for postback dedup — real PostgreSQL constraints.
//
// These tests require a live Supabase instance with all migrations applied.
// They verify actual DB behavior that unit tests (mocked Supabase) cannot:
//   - UNIQUE index constraint violations (23505)
//   - IMMUTABLE function correctness (sfp_day_bucket, sfp_day_bucket_offset)
//   - Partial index WHERE clause (network_event_id IS NULL)
//   - Concurrent transaction race conditions
//
// Run:  npm run test:integration
// Env:  SUPABASE_TEST_URL, SUPABASE_TEST_SERVICE_KEY (in .env.test.local)
//
// The tests use service_role to bypass RLS. All test rows are cleaned up
// via afterEach/afterAll using a dedicated TEST_CLICK_ID prefix.

import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { BLOCKED_PROJECT_REFS } from '@/lib/audit/constants';

// ── Skip when no test DB configured ──────────────────────────────────────────

const TEST_URL = process.env.SUPABASE_TEST_URL;
const TEST_KEY = process.env.SUPABASE_TEST_SERVICE_KEY;
const SKIP = !TEST_URL || !TEST_KEY;

// ── Production guard-rail ────────────────────────────────────────────────────
// Hard-block known production project refs to prevent accidental data mutation.
// Single source of truth: lib/audit/constants.ts (shared with AuditStatusWidget).

function assertNotProduction(url: string): void {
  const host = new URL(url).hostname; // e.g. "devkeyhniwdxsqvoscdu.supabase.co"
  for (const ref of BLOCKED_PROJECT_REFS) {
    if (host.startsWith(ref)) {
      throw new Error(
        `[SAFETY] SUPABASE_TEST_URL points to PRODUCTION project "${ref}". ` +
        `Integration tests must run against a separate test project. ` +
        `Create a dedicated Supabase project and set SUPABASE_TEST_URL accordingly.`,
      );
    }
  }
}

// Deterministic test UUIDs — easily filterable for cleanup
const TEST_CLICK_ID = 'deadbeef-0000-4000-a000-000000000001';

// ── Helpers ──────────────────────────────────────────────────────────────────

function getClient(): SupabaseClient {
  if (!TEST_URL || !TEST_KEY) throw new Error('Missing test DB credentials');
  assertNotProduction(TEST_URL);
  return createClient(TEST_URL, TEST_KEY);
}

function makeRow(overrides: Record<string, unknown> = {}) {
  return {
    click_id: TEST_CLICK_ID,
    link_id: null, // no FK constraint needed (nullable)
    event_type: 'deposit',
    event_value: null,
    event_currency: 'USD',
    network: null,
    network_event_id: null,
    metadata: {},
    occurred_at: '2026-03-08T12:00:00Z',
    ...overrides,
  };
}

// JS mirrors of the DB functions (must match exactly)
function jsDayBucket(iso: string): number {
  return Math.floor(new Date(iso).getTime() / 1000 / 86400);
}
function jsDayBucketOffset(iso: string): number {
  return Math.floor((new Date(iso).getTime() / 1000 + 43200) / 86400);
}

// ── Suite ────────────────────────────────────────────────────────────────────

describe.skipIf(SKIP)('Postback dedup — real DB constraints', () => {
  let supabase: SupabaseClient;

  beforeAll(() => {
    supabase = getClient();
  });

  afterEach(async () => {
    if (!supabase) return; // guard: beforeAll may have thrown (e.g. prod safety check)
    await supabase
      .from('conversion_events')
      .delete()
      .eq('click_id', TEST_CLICK_ID);
  });

  afterAll(async () => {
    if (!supabase) return;
    await supabase
      .from('conversion_events')
      .delete()
      .eq('click_id', TEST_CLICK_ID);
  });

  // ── IMMUTABLE function correctness ────────────────────────────────────────

  it('sfp_day_bucket(ts) matches JS Math.floor(epoch / 86400)', async () => {
    const ts = '2026-03-08T23:59:00+00';
    const { data, error } = await supabase.rpc('sfp_day_bucket', { ts });
    expect(error).toBeNull();
    expect(Number(data)).toBe(jsDayBucket('2026-03-08T23:59:00Z'));
  });

  it('sfp_day_bucket_offset(ts) matches JS Math.floor((epoch + 43200) / 86400)', async () => {
    const ts = '2026-03-08T23:59:00+00';
    const { data, error } = await supabase.rpc('sfp_day_bucket_offset', { ts });
    expect(error).toBeNull();
    expect(Number(data)).toBe(jsDayBucketOffset('2026-03-08T23:59:00Z'));
  });

  // ── Bucket A: midnight-aligned index ──────────────────────────────────────

  it('same UTC day, no txn_id → second INSERT fires 23505 (Bucket A)', async () => {
    const first = makeRow({ occurred_at: '2026-03-08T10:00:00Z' });
    const { error: e1 } = await supabase.from('conversion_events').insert(first);
    expect(e1).toBeNull();

    const second = makeRow({ occurred_at: '2026-03-08T22:00:00Z' });
    const { error: e2 } = await supabase.from('conversion_events').insert(second);
    expect(e2).not.toBeNull();
    expect(e2!.code).toBe('23505');
  });

  // ── Bucket B: noon-aligned index ──────────────────────────────────────────

  it('cross-midnight same noon-window → second INSERT fires 23505 (Bucket B)', async () => {
    const first = makeRow({ occurred_at: '2026-03-08T23:59:00Z' });
    const { error: e1 } = await supabase.from('conversion_events').insert(first);
    expect(e1).toBeNull();

    // 00:01 next day — different midnight bucket, but SAME noon bucket
    const second = makeRow({ occurred_at: '2026-03-09T00:01:00Z' });
    const { error: e2 } = await supabase.from('conversion_events').insert(second);
    expect(e2).not.toBeNull();
    expect(e2!.code).toBe('23505');
  });

  // ── 12h–24h ambiguous zone ────────────────────────────────────────────────

  it('18h apart same UTC day → blocked by Bucket A', async () => {
    const first = makeRow({ occurred_at: '2026-03-08T05:00:00Z' });
    const { error: e1 } = await supabase.from('conversion_events').insert(first);
    expect(e1).toBeNull();

    const second = makeRow({ occurred_at: '2026-03-08T23:00:00Z' });
    const { error: e2 } = await supabase.from('conversion_events').insert(second);
    expect(e2).not.toBeNull();
    expect(e2!.code).toBe('23505');
  });

  it('22h apart cross-midnight → blocked by Bucket B (same noon-window)', async () => {
    const first = makeRow({ occurred_at: '2026-03-08T13:00:00Z' });
    const { error: e1 } = await supabase.from('conversion_events').insert(first);
    expect(e1).toBeNull();

    // 11:00 next day = 22h later, different midnight bucket, same noon bucket
    const second = makeRow({ occurred_at: '2026-03-09T11:00:00Z' });
    const { error: e2 } = await supabase.from('conversion_events').insert(second);
    expect(e2).not.toBeNull();
    expect(e2!.code).toBe('23505');
  });

  it('14h apart crossing BOTH boundaries → allowed', async () => {
    const first = makeRow({ occurred_at: '2026-03-08T23:00:00Z' });
    const { error: e1 } = await supabase.from('conversion_events').insert(first);
    expect(e1).toBeNull();

    // 13:00 next day = 14h later, different midnight AND different noon bucket
    const second = makeRow({ occurred_at: '2026-03-09T13:00:00Z' });
    const { error: e2 } = await supabase.from('conversion_events').insert(second);
    expect(e2).toBeNull(); // both succeed!
  });

  // ── ≥24h: always allowed ──────────────────────────────────────────────────

  it('exactly 24h apart → always allowed', async () => {
    const first = makeRow({ occurred_at: '2026-03-08T15:00:00Z' });
    const { error: e1 } = await supabase.from('conversion_events').insert(first);
    expect(e1).toBeNull();

    const second = makeRow({ occurred_at: '2026-03-09T15:00:00Z' });
    const { error: e2 } = await supabase.from('conversion_events').insert(second);
    expect(e2).toBeNull();
  });

  // ── Partial index: WITH txn_id bypasses fingerprint indexes ───────────────

  it('events WITH network_event_id bypass fingerprint indexes', async () => {
    // Two events with same click_id + event_type on same day, but different txn_ids
    // Fingerprint indexes only apply WHERE network_event_id IS NULL
    const first = makeRow({
      occurred_at: '2026-03-08T10:00:00Z',
      network_event_id: 'TXN-AAA',
    });
    const { error: e1 } = await supabase.from('conversion_events').insert(first);
    expect(e1).toBeNull();

    const second = makeRow({
      occurred_at: '2026-03-08T22:00:00Z',
      network_event_id: 'TXN-BBB',
    });
    const { error: e2 } = await supabase.from('conversion_events').insert(second);
    expect(e2).toBeNull(); // both succeed — fingerprint indexes don't apply
  });

  // ── Concurrent race condition ─────────────────────────────────────────────

  it('concurrent INSERTs: exactly one succeeds, one gets 23505', async () => {
    const row = makeRow({ event_type: 'ftd', occurred_at: '2026-03-08T12:00:00Z' });

    const results = await Promise.all([
      supabase.from('conversion_events').insert(row).select('id').single(),
      supabase.from('conversion_events').insert(row).select('id').single(),
    ]);

    const successes = results.filter(r => !r.error);
    const dupes = results.filter(r => r.error?.code === '23505');

    expect(successes).toHaveLength(1);
    expect(dupes).toHaveLength(1);
  });
});
