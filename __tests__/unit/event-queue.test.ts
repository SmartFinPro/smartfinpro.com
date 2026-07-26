// __tests__/unit/event-queue.test.ts
// Generic event-queue primitives (lib/analytics/event-queue.ts) — the
// schema-agnostic, key-parameterized sibling of the frozen cockpit-events.ts
// batching/debounce/dedup logic. tool_v1 is the first consumer.
//
// Per the brief, timer behavior is exercised via an INJECTED schedule/cancel
// pair (no vi.useFakeTimers() global needed) — the injected fn is invoked
// manually to simulate "the delay elapsed".

import { describe, it, expect, vi } from 'vitest';
import {
  createEventQueue,
  createTrailingDebounce,
  createImpressionDeduper,
  type KeyValueStorage,
} from '@/lib/analytics/event-queue';

function makeManualScheduler() {
  const scheduled: Array<{ fn: () => void; ms: number }> = [];
  const cancelled: unknown[] = [];
  const schedule = (fn: () => void, ms: number) => {
    const handle = { fn, ms };
    scheduled.push(handle);
    return handle;
  };
  const cancel = (handle: unknown) => {
    cancelled.push(handle);
  };
  return { schedule, cancel, scheduled, cancelled };
}

describe('createEventQueue()', () => {
  it('flushes when the queue reaches maxBatch (12 enqueues → 1 send with 12)', () => {
    const send = vi.fn();
    const q = createEventQueue<string>({ send, hardCap: 20, maxBatch: 12 });
    for (let i = 0; i < 11; i++) q.enqueue(`e${i}`);
    expect(send).not.toHaveBeenCalled();
    q.enqueue('e11');
    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][0]).toHaveLength(12);
    expect(q.size()).toBe(0);
  });

  it('flushes after flushDelayMs via an injected schedule (no global fake timers)', () => {
    const send = vi.fn();
    const { schedule, cancel, scheduled } = makeManualScheduler();
    const q = createEventQueue<string>({ send, hardCap: 20, flushDelayMs: 800, schedule, cancel });
    q.enqueue('a');
    q.enqueue('b');
    expect(send).not.toHaveBeenCalled();
    expect(scheduled).toHaveLength(1);
    expect(scheduled[0].ms).toBe(800);
    // Simulate the timer firing.
    scheduled[0].fn();
    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][0]).toEqual(['a', 'b']);
  });

  it('immediate:true sends synchronously including current queue contents', () => {
    const send = vi.fn();
    const q = createEventQueue<string>({ send, hardCap: 20 });
    q.enqueue('a');
    q.enqueue('b', { immediate: true });
    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][0]).toEqual(['a', 'b']);
    expect(q.size()).toBe(0);
  });

  it('45 events + flush() → sends split 20/20/5 by hardCap', () => {
    const send = vi.fn();
    const q = createEventQueue<number>({ send, hardCap: 20, maxBatch: 1000 });
    for (let i = 0; i < 45; i++) q.enqueue(i);
    q.flush();
    expect(send).toHaveBeenCalledTimes(3);
    expect(send.mock.calls[0][0]).toHaveLength(20);
    expect(send.mock.calls[1][0]).toHaveLength(20);
    expect(send.mock.calls[2][0]).toHaveLength(5);
  });

  it('a throwing send() never propagates out of enqueue or flush', () => {
    const send = vi.fn(() => {
      throw new Error('network down');
    });
    const q = createEventQueue<string>({ send, hardCap: 20 });
    expect(() => q.enqueue('a', { immediate: true })).not.toThrow();
    q.enqueue('b');
    expect(() => q.flush()).not.toThrow();
    expect(q.size()).toBe(0);
  });
});

describe('createTrailingDebounce()', () => {
  it('3 rapid calls → exactly 1 call with the last value', () => {
    const fn = vi.fn();
    const { schedule, cancel, scheduled } = makeManualScheduler();
    const debounced = createTrailingDebounce<number>(fn, 600, schedule, cancel);
    debounced(1);
    debounced(2);
    debounced(3);
    expect(fn).not.toHaveBeenCalled();
    // Only the final scheduled timer should be the "live" one; run it.
    scheduled[scheduled.length - 1].fn();
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(3);
  });

  it('a throwing callback never propagates', () => {
    const fn = vi.fn(() => {
      throw new Error('boom');
    });
    const { schedule, cancel, scheduled } = makeManualScheduler();
    const debounced = createTrailingDebounce<number>(fn, 100, schedule, cancel);
    debounced(1);
    expect(() => scheduled[0].fn()).not.toThrow();
  });
});

describe('createImpressionDeduper() (key-parameterized)', () => {
  function makeFakeStorage(initial: Record<string, string> = {}): KeyValueStorage & { data: Record<string, string> } {
    const data = { ...initial };
    return {
      data,
      getItem: (k) => (k in data ? data[k] : null),
      setItem: (k, v) => {
        data[k] = v;
      },
    };
  }

  it('markSeen is true the first time, false on repetition', () => {
    const d = createImpressionDeduper('sfp_test_key_a', makeFakeStorage());
    expect(d.markSeen('x')).toBe(true);
    expect(d.markSeen('x')).toBe(false);
    expect(d.hasSeen('x')).toBe(true);
  });

  it('two dedupers with different storageKeys share no state', () => {
    const storage = makeFakeStorage();
    const dA = createImpressionDeduper('sfp_test_key_a', storage);
    const dB = createImpressionDeduper('sfp_test_key_b', storage);
    dA.markSeen('shared');
    expect(dB.markSeen('shared')).toBe(true); // not seen under key B's storage slot
    expect(dA.hasSeen('shared')).toBe(true);
    expect(dB.hasSeen('shared')).toBe(true); // seen locally now, but was independent at markSeen-time
  });

  it('cap trims the oldest entries', () => {
    const storage = makeFakeStorage();
    const d = createImpressionDeduper('sfp_test_cap', storage, 500);
    for (let i = 0; i < 510; i++) d.markSeen(`k${i}`);
    const persisted = JSON.parse(storage.data['sfp_test_cap']) as string[];
    expect(persisted).toHaveLength(500);
    expect(persisted).not.toContain('k0');
    expect(persisted).toContain('k509');
  });

  it('corrupt storage JSON → fail-soft in-memory dedup', () => {
    const storage = makeFakeStorage({ sfp_test_corrupt: '{not-json' });
    const d = createImpressionDeduper('sfp_test_corrupt', storage);
    expect(d.markSeen('a')).toBe(true);
    expect(d.markSeen('a')).toBe(false);
  });
});
