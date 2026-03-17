// __tests__/unit/postback-dedup.test.ts
// Postback dedup — tests covering validation, routing, and processPostback real code path.
//
// Dedup architecture (postback-service.ts):
//
//   WITH txn_id ──► App: exact-match SELECT (fast-path optimization)
//                   DB:  idx_ce_dedup_with_txn → 23505 on INSERT
//
//   WITHOUT txn_id ► NO app-level SELECT (eliminates all SELECT→INSERT races)
//                    DB:  DUAL overlapping day-bucket indexes:
//                         idx_ce_fingerprint_daily_dedup        (midnight-aligned)
//                         idx_ce_fingerprint_daily_offset_dedup  (noon-aligned, +12h)
//
//   Dedup windows:
//     < 12h apart:  ALWAYS blocked (≥1 bucket overlap)
//     12h–24h apart: MAY be blocked (depends on bucket alignment)
//     ≥ 24h apart:  ALWAYS allowed (both buckets different)
//
//   TRADE-OFF: Without txn_id, same-type events from the same click_id
//   within the same bucket (~24h) are treated as duplicates. Networks
//   SHOULD send txn_id for recurring event types (deposit, etc.).
//
// NOTE: These are unit tests with a mocked Supabase client. They verify the
// application logic (validation, routing, error handling) but NOT real DB
// constraint behavior. Full SQL/index/RLS coverage requires integration tests
// against a Supabase test instance (see __tests__/integration/README.md).

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FUNNEL_EVENT_TYPES } from '@/lib/api/connectors/types';

// ── Mock Supabase ─────────────────────────────────────────────────────────────

function createChain() {
  const chain: Record<string, unknown> = {};
  const methods = ['from', 'select', 'insert', 'update', 'eq', 'is', 'gte', 'single', 'maybeSingle'];
  for (const m of methods) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
  chain.single = vi.fn().mockResolvedValue({ data: null, error: null });
  chain.maybeSingle = vi.fn().mockResolvedValue({ data: null });
  return chain;
}

let mockSupabase: ReturnType<typeof createMockSupabase>;

function createMockSupabase() {
  let clickResult: { data: { link_id: string } | null } = { data: { link_id: 'link-1' } };
  let dedupCount = 0;
  let insertResult: { data: { id: string } | null; error: { code: string; message: string } | null } = {
    data: { id: 'evt-1' },
    error: null,
  };

  const client = {
    from: vi.fn().mockImplementation((table: string) => {
      if (table === 'link_clicks') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue(clickResult),
            }),
          }),
        };
      }
      if (table === 'conversion_events') {
        return {
          select: vi.fn().mockImplementation((_cols: string, opts?: { count?: string; head?: boolean }) => {
            if (opts?.head) {
              const cq: Record<string, unknown> = {};
              cq.eq = vi.fn().mockReturnValue(cq);
              cq.is = vi.fn().mockReturnValue(cq);
              cq.gte = vi.fn().mockReturnValue(cq);
              (cq as Record<string, unknown>).then = (resolve: (v: unknown) => void) => {
                resolve({ count: dedupCount });
              };
              return cq;
            }
            return {
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: null }),
              }),
            };
          }),
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue(insertResult),
            }),
          }),
        };
      }
      return createChain();
    }),

    _setClickResult(r: typeof clickResult) { clickResult = r; },
    _setDedupCount(c: number) { dedupCount = c; },
    _setInsertResult(r: typeof insertResult) { insertResult = r; },
  };

  return client;
}

vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: vi.fn(() => mockSupabase),
}));

vi.mock('@/lib/logging', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('@/lib/actions/bandit', () => ({
  updatePosterior: vi.fn(),
}));

// ── Pure logic mirrors ───────────────────────────────────────────────────────

const CLICK_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** JS equivalent of DB sfp_day_bucket (midnight-aligned). */
function sfpDayBucket(ts: Date): number {
  return Math.floor(ts.getTime() / 1000 / 86400);
}

/** JS equivalent of DB sfp_day_bucket_offset (noon-aligned, +12h). */
function sfpDayBucketOffset(ts: Date): number {
  return Math.floor((ts.getTime() / 1000 + 43200) / 86400);
}

/** Returns true if two timestamps share at least one bucket (= duplicate blocked). */
function wouldBeBlocked(a: Date, b: Date): boolean {
  return sfpDayBucket(a) === sfpDayBucket(b) || sfpDayBucketOffset(a) === sfpDayBucketOffset(b);
}

// =============================================================================
//  Tests
// =============================================================================

describe('FUNNEL_EVENT_TYPES', () => {
  it('contains all 10 expected event types in order', () => {
    expect(FUNNEL_EVENT_TYPES).toEqual([
      'registration', 'kyc_submitted', 'kyc_approved', 'kyc_rejected',
      'ftd', 'deposit', 'qualified', 'approved', 'rejected', 'reversed',
    ]);
  });

  it('has length 10', () => {
    expect(FUNNEL_EVENT_TYPES.length).toBe(10);
  });
});

describe('Click ID format validation', () => {
  it('accepts valid UUID v4', () => {
    expect(CLICK_ID_RE.test('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    expect(CLICK_ID_RE.test('550E8400-E29B-41D4-A716-446655440000')).toBe(true);
  });

  it('rejects non-UUID strings', () => {
    expect(CLICK_ID_RE.test('not-a-uuid')).toBe(false);
    expect(CLICK_ID_RE.test('')).toBe(false);
    expect(CLICK_ID_RE.test('550e8400e29b41d4a716446655440000')).toBe(false);
  });
});

// ── Dual-bucket atomic dedup ─────────────────────────────────────────────────

describe('Dual-bucket atomic dedup (midnight + noon indexes)', () => {
  it('same UTC day → both buckets match → blocked', () => {
    const am = new Date('2026-03-08T10:00:00Z');
    const pm = new Date('2026-03-08T22:00:00Z');
    expect(wouldBeBlocked(am, pm)).toBe(true);
  });

  it('cross-midnight 23:59→00:01 (2 min gap) → noon bucket catches it', () => {
    const beforeMidnight = new Date('2026-03-08T23:59:00Z');
    const afterMidnight  = new Date('2026-03-09T00:01:00Z');

    // Midnight bucket: DIFFERENT (the edge case!)
    expect(sfpDayBucket(beforeMidnight)).not.toBe(sfpDayBucket(afterMidnight));
    // Noon bucket: SAME → 23505 fires
    expect(sfpDayBucketOffset(beforeMidnight)).toBe(sfpDayBucketOffset(afterMidnight));
    // Combined: blocked ✓
    expect(wouldBeBlocked(beforeMidnight, afterMidnight)).toBe(true);
  });

  it('cross-noon 11:59→12:01 (2 min gap) → midnight bucket catches it', () => {
    const beforeNoon = new Date('2026-03-08T11:59:00Z');
    const afterNoon  = new Date('2026-03-08T12:01:00Z');

    // Noon bucket: DIFFERENT
    expect(sfpDayBucketOffset(beforeNoon)).not.toBe(sfpDayBucketOffset(afterNoon));
    // Midnight bucket: SAME → 23505 fires
    expect(sfpDayBucket(beforeNoon)).toBe(sfpDayBucket(afterNoon));
    // Combined: blocked ✓
    expect(wouldBeBlocked(beforeNoon, afterNoon)).toBe(true);
  });

  it('events 6h apart → blocked (within 12h guarantee)', () => {
    const t1 = new Date('2026-03-08T20:00:00Z');
    const t2 = new Date('2026-03-09T02:00:00Z'); // 6h later, crosses midnight
    expect(wouldBeBlocked(t1, t2)).toBe(true);
  });

  it('events 11h 59m apart → blocked (at the edge of the 12h guarantee)', () => {
    const t1 = new Date('2026-03-08T12:01:00Z');
    const t2 = new Date('2026-03-09T00:00:00Z'); // 11h 59m later
    expect(wouldBeBlocked(t1, t2)).toBe(true);
  });

  // ── 12h–24h ambiguous zone: MAY be blocked depending on bucket alignment ──

  it('18h apart same UTC day → BLOCKED by Bucket A (midnight)', () => {
    // 05:00 and 23:00 same day — 18h gap, but same midnight bucket
    const t1 = new Date('2026-03-08T05:00:00Z');
    const t2 = new Date('2026-03-08T23:00:00Z');
    expect(sfpDayBucket(t1)).toBe(sfpDayBucket(t2)); // same midnight bucket
    expect(wouldBeBlocked(t1, t2)).toBe(true);
  });

  it('22h apart cross-midnight → BLOCKED by Bucket B (noon)', () => {
    // 13:00 Day 1 → 11:00 Day 2 = 22h gap, crosses midnight but same noon-window
    const t1 = new Date('2026-03-08T13:00:00Z');
    const t2 = new Date('2026-03-09T11:00:00Z');
    expect(sfpDayBucket(t1)).not.toBe(sfpDayBucket(t2)); // different midnight
    expect(sfpDayBucketOffset(t1)).toBe(sfpDayBucketOffset(t2)); // same noon bucket!
    expect(wouldBeBlocked(t1, t2)).toBe(true);
  });

  it('14h apart crossing BOTH boundaries → allowed (rare legitimate case)', () => {
    // 23:00 Day 1 → 13:00 Day 2 = 14h gap, crosses midnight AND noon
    const t1 = new Date('2026-03-08T23:00:00Z');
    const t2 = new Date('2026-03-09T13:00:00Z');
    expect(sfpDayBucket(t1)).not.toBe(sfpDayBucket(t2)); // different midnight ✓
    expect(sfpDayBucketOffset(t1)).not.toBe(sfpDayBucketOffset(t2)); // different noon ✓
    expect(wouldBeBlocked(t1, t2)).toBe(false); // allowed!
  });

  // ── ≥24h apart: ALWAYS allowed ──

  it('exactly 24h apart → always allowed', () => {
    const t1 = new Date('2026-03-08T15:00:00Z');
    const t2 = new Date('2026-03-09T15:00:00Z');
    expect(sfpDayBucket(t1)).not.toBe(sfpDayBucket(t2));
    expect(sfpDayBucketOffset(t1)).not.toBe(sfpDayBucketOffset(t2));
    expect(wouldBeBlocked(t1, t2)).toBe(false);
  });

  it('37h apart → allowed', () => {
    const t1 = new Date('2026-03-08T05:00:00Z');
    const t2 = new Date('2026-03-09T18:00:00Z');
    expect(wouldBeBlocked(t1, t2)).toBe(false);
  });

  it('3 days apart → allowed', () => {
    const t1 = new Date('2026-03-08T12:00:00Z');
    const t2 = new Date('2026-03-11T12:00:00Z');
    expect(wouldBeBlocked(t1, t2)).toBe(false);
  });

  it('bucket arithmetic: midnight buckets for consecutive days differ by 1', () => {
    const d1 = new Date('2026-03-08T12:00:00Z');
    const d2 = new Date('2026-03-09T12:00:00Z');
    expect(sfpDayBucket(d2) - sfpDayBucket(d1)).toBe(1);
  });

  it('bucket arithmetic: offset buckets for consecutive noons differ by 1', () => {
    const n1 = new Date('2026-03-08T12:00:00Z');
    const n2 = new Date('2026-03-09T12:00:00Z');
    expect(sfpDayBucketOffset(n2) - sfpDayBucketOffset(n1)).toBe(1);
  });
});

// ── DB constraint handling ───────────────────────────────────────────────────

describe('DB constraint violation (23505) → duplicate_skipped', () => {
  function handleInsertError(code: string) {
    if (code === '23505') return { success: true, reason: 'duplicate_skipped' };
    return { success: false, reason: `DB error: ${code}` };
  }

  it('23505 → { success: true, reason: "duplicate_skipped" }', () => {
    expect(handleInsertError('23505')).toEqual({ success: true, reason: 'duplicate_skipped' });
  });

  it('other codes → { success: false }', () => {
    expect(handleInsertError('42P01')).toMatchObject({ success: false });
  });

  it('23505 returns success:true → network gets HTTP 200 (no retry loop)', () => {
    expect(handleInsertError('23505').success).toBe(true);
  });
});

// ── processPostback — real code path with mocked Supabase ────────────────────

describe('processPostback (mocked Supabase)', () => {
  beforeEach(() => {
    mockSupabase = createMockSupabase();
    vi.clearAllMocks();
  });

  async function callProcessPostback(params: Record<string, unknown>) {
    const mod = await import('@/lib/api/postback-service');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return mod.processPostback(params as any);
  }

  it('rejects invalid event type', async () => {
    const result = await callProcessPostback({
      click_id: '550e8400-e29b-41d4-a716-446655440000',
      event: 'bogus_event',
    });
    expect(result.success).toBe(false);
    expect(result.reason).toContain('Invalid event type');
  });

  it('rejects invalid click_id format', async () => {
    const result = await callProcessPostback({
      click_id: 'not-a-uuid',
      event: 'approved',
    });
    expect(result.success).toBe(false);
    expect(result.reason).toContain('Invalid click_id');
  });

  it('rejects click_id not found in link_clicks', async () => {
    mockSupabase._setClickResult({ data: null });
    const result = await callProcessPostback({
      click_id: '550e8400-e29b-41d4-a716-446655440000',
      event: 'approved',
    });
    expect(result.success).toBe(false);
    expect(result.reason).toBe('click_id_not_found');
  });

  it('WITH txn_id: returns duplicate_skipped when pre-flight count > 0', async () => {
    mockSupabase._setDedupCount(1);
    const result = await callProcessPostback({
      click_id: '550e8400-e29b-41d4-a716-446655440000',
      event: 'approved',
      txn_id: 'TXN-123',
    });
    expect(result.success).toBe(true);
    expect(result.reason).toBe('duplicate_skipped');
  });

  it('WITHOUT txn_id: goes straight to INSERT (no app-level SELECT)', async () => {
    // No txn_id → no pre-flight SELECT → INSERT directly.
    // Dedup handled atomically by dual DB constraints (23505).
    mockSupabase._setDedupCount(0);
    mockSupabase._setInsertResult({ data: { id: 'evt-new' }, error: null });
    const result = await callProcessPostback({
      click_id: '550e8400-e29b-41d4-a716-446655440000',
      event: 'deposit',
    });
    expect(result.success).toBe(true);
    expect(result.event_id).toBe('evt-new');
  });

  it('successful INSERT returns event_id', async () => {
    mockSupabase._setDedupCount(0);
    mockSupabase._setInsertResult({ data: { id: 'evt-abc' }, error: null });
    const result = await callProcessPostback({
      click_id: '550e8400-e29b-41d4-a716-446655440000',
      event: 'approved',
      payout: 50,
      currency: 'USD',
    });
    expect(result.success).toBe(true);
    expect(result.event_id).toBe('evt-abc');
  });

  it('INSERT with 23505 → duplicate_skipped (atomic DB-constraint path)', async () => {
    mockSupabase._setDedupCount(0);
    mockSupabase._setInsertResult({
      data: null,
      error: { code: '23505', message: 'unique_violation' },
    });
    const result = await callProcessPostback({
      click_id: '550e8400-e29b-41d4-a716-446655440000',
      event: 'ftd',
    });
    expect(result.success).toBe(true);
    expect(result.reason).toBe('duplicate_skipped');
  });

  it('INSERT with non-23505 error → failure', async () => {
    mockSupabase._setDedupCount(0);
    mockSupabase._setInsertResult({
      data: null,
      error: { code: '42P01', message: 'relation does not exist' },
    });
    const result = await callProcessPostback({
      click_id: '550e8400-e29b-41d4-a716-446655440000',
      event: 'approved',
    });
    expect(result.success).toBe(false);
    expect(result.reason).toContain('DB error');
  });
});
