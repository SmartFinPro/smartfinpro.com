// __tests__/unit/aria-live-throttle.test.ts
// Throttled aria-live announcer (lib/tools/aria-live.ts createLiveAnnouncer) —
// SPEC 6.1/8.9. Timer behavior is exercised via an INJECTED schedule fn (same
// pattern as __tests__/unit/event-queue.test.ts) — no vi.useFakeTimers().

import { describe, it, expect, vi } from 'vitest';
import { createLiveAnnouncer } from '@/lib/tools/aria-live';

function makeManualScheduler() {
  const scheduled: Array<{ fn: () => void; ms: number }> = [];
  const schedule = (fn: () => void, ms: number) => {
    const handle = { fn, ms };
    scheduled.push(handle);
    return handle;
  };
  const runLatest = () => {
    const handle = scheduled[scheduled.length - 1];
    handle.fn();
  };
  return { schedule, scheduled, runLatest };
}

describe('createLiveAnnouncer()', () => {
  it('5 announce calls within the interval → exactly 1 immediate + 1 trailing with the LAST sentence', () => {
    const setText = vi.fn();
    const { schedule, runLatest } = makeManualScheduler();
    const { announce } = createLiveAnnouncer(setText, 1000, schedule);

    announce('one');
    announce('two');
    announce('three');
    announce('four');
    announce('five');

    // Leading-edge immediate fire happened synchronously.
    expect(setText).toHaveBeenCalledTimes(1);
    expect(setText).toHaveBeenNthCalledWith(1, 'one');

    // Only one trailing timer should have been scheduled (calls 2-5 coalesce).
    runLatest();

    expect(setText).toHaveBeenCalledTimes(2);
    expect(setText).toHaveBeenNthCalledWith(2, 'five');
  });

  it('setDragging(true) fully suppresses announcements — no setText call while dragging', () => {
    const setText = vi.fn();
    const { schedule } = makeManualScheduler();
    const { announce, setDragging } = createLiveAnnouncer(setText, 1000, schedule);

    setDragging(true);
    announce('mid-drag-1');
    announce('mid-drag-2');
    expect(setText).not.toHaveBeenCalled();
  });

  it('release after dragging announces the last known state immediately', () => {
    const setText = vi.fn();
    const { schedule } = makeManualScheduler();
    const { announce, setDragging } = createLiveAnnouncer(setText, 1000, schedule);

    setDragging(true);
    announce('mid-drag-1');
    announce('settled-value');
    setDragging(false);

    expect(setText).toHaveBeenCalledTimes(1);
    expect(setText).toHaveBeenCalledWith('settled-value');
  });

  it('release with nothing announced during drag does not call setText', () => {
    const setText = vi.fn();
    const { schedule } = makeManualScheduler();
    const { setDragging } = createLiveAnnouncer(setText, 1000, schedule);

    setDragging(true);
    setDragging(false);
    expect(setText).not.toHaveBeenCalled();
  });

  it('does not schedule a second trailing timer while one is already pending', () => {
    const setText = vi.fn();
    const scheduleSpy = vi.fn((fn: () => void, ms: number) => setTimeout(fn, ms));
    const { announce } = createLiveAnnouncer(setText, 1000, scheduleSpy);

    announce('first'); // immediate, no schedule call
    announce('second'); // schedules
    announce('third'); // must NOT schedule again

    expect(scheduleSpy).toHaveBeenCalledTimes(1);
  });
});
