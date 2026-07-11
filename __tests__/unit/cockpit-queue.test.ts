// __tests__/unit/cockpit-queue.test.ts
// Event queue batching: flush at maxBatch / after flushDelayMs / immediate,
// server hard-cap per send, fail-soft send, trailing slider debounce.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  buildCockpitEventData,
  createEventQueue,
  createTrailingDebounce,
  EVENT_BATCH_HARD_CAP,
  type CockpitEventData,
} from '@/lib/analytics/cockpit-events';

const CTX = { market: 'us', category: 'trading', topic: 'trading-platforms' };

function evt(n = 0): CockpitEventData {
  return buildCockpitEventData('cockpit_product_impression', CTX, '/us/trading/best/trading-platforms', {
    productSlug: `p${n}`,
    rank: n,
  });
}

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe('createEventQueue()', () => {
  it('flushes after flushDelayMs (single trailing timer)', () => {
    const send = vi.fn();
    const q = createEventQueue({ send, maxBatch: 12, flushDelayMs: 800 });
    q.enqueue(evt(1));
    q.enqueue(evt(2));
    expect(send).not.toHaveBeenCalled();
    vi.advanceTimersByTime(799);
    expect(send).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][0]).toHaveLength(2);
    expect(q.size()).toBe(0);
  });

  it('flushes when the queue reaches maxBatch', () => {
    const send = vi.fn();
    const q = createEventQueue({ send, maxBatch: 3 });
    q.enqueue(evt(1));
    q.enqueue(evt(2));
    expect(send).not.toHaveBeenCalled();
    q.enqueue(evt(3));
    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][0]).toHaveLength(3);
  });

  it('immediate:true flushes synchronously (CTA click before navigation)', () => {
    const send = vi.fn();
    const q = createEventQueue({ send });
    q.enqueue(evt(1));
    q.enqueue(evt(2), { immediate: true });
    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][0]).toHaveLength(2);
  });

  it('never sends more than EVENT_BATCH_HARD_CAP per send()', () => {
    const send = vi.fn();
    const q = createEventQueue({ send, maxBatch: 1000 });
    for (let i = 0; i < 45; i++) q.enqueue(evt(i));
    q.flush();
    expect(send).toHaveBeenCalledTimes(3); // 20 + 20 + 5
    for (const call of send.mock.calls) {
      expect((call[0] as CockpitEventData[]).length).toBeLessThanOrEqual(EVENT_BATCH_HARD_CAP);
    }
  });

  it('a throwing send() never propagates (fail-soft) and the queue drains', () => {
    const send = vi.fn(() => {
      throw new Error('network down');
    });
    const q = createEventQueue({ send });
    q.enqueue(evt(1));
    expect(() => q.flush()).not.toThrow();
    expect(q.size()).toBe(0);
  });

  it('does not double-send after a timer flush followed by manual flush', () => {
    const send = vi.fn();
    const q = createEventQueue({ send, flushDelayMs: 800 });
    q.enqueue(evt(1));
    vi.advanceTimersByTime(800);
    q.flush();
    expect(send).toHaveBeenCalledTimes(1);
  });
});

describe('createTrailingDebounce()', () => {
  it('emits exactly one trailing value after rapid calls', () => {
    const fn = vi.fn();
    const debounced = createTrailingDebounce<number>(fn, 800);
    for (let v = 1; v <= 10; v++) debounced(v);
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(800);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(10); // settled value only
  });

  it('separate debouncers do not interfere (amount vs years)', () => {
    const amount = vi.fn();
    const years = vi.fn();
    const dAmount = createTrailingDebounce<number>(amount, 800);
    const dYears = createTrailingDebounce<number>(years, 800);
    dAmount(50000);
    vi.advanceTimersByTime(400);
    dYears(15);
    vi.advanceTimersByTime(400); // amount settles at 800ms
    expect(amount).toHaveBeenCalledWith(50000);
    expect(years).not.toHaveBeenCalled();
    vi.advanceTimersByTime(400); // years settles at its own 800ms
    expect(years).toHaveBeenCalledWith(15);
  });

  it('a throwing callback never propagates', () => {
    const fn = vi.fn(() => {
      throw new Error('boom');
    });
    const debounced = createTrailingDebounce<number>(fn, 100);
    debounced(1);
    expect(() => vi.advanceTimersByTime(100)).not.toThrow();
  });
});
