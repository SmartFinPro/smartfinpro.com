// __tests__/unit/research-deferred-navigation.test.ts
// Pins the scheduling contract behind commit bed106f
// ("fix(research): stop losing the first filter-chip navigation") — see
// lib/research/deferred-navigation.ts and its use in
// components/research/ResearchHub.tsx's `pushUrl`. That fix defers a
// filter-chip's `router.push()` by one task to dodge a race the App Router
// loses ~9-11% of the time in the ~100-200ms window after mount (see the
// e2e regression guard, e2e/research-filter-chip-navigation.spec.ts, and
// the audit report audits/reports/research-discovery-pr3.md). The e2e guard
// is the system-level, probabilistic proof; THIS test pins the scheduling
// contract deterministically, with an injected scheduler — no real timers,
// no jsdom/RTL (this repo's vitest runs in the `node` environment; see
// vitest.config.ts).
//
// Injected-scheduler pattern matches __tests__/unit/aria-live-throttle.test.ts
// (createLiveAnnouncer) rather than vi.useFakeTimers().
//
// NOTE on `{ scroll: false }`: that option is bound into the `push` callback
// at ResearchHub.tsx's call site, not inside `schedulePush` itself — it has
// no representation in this module's signature, so it cannot be asserted by
// a test against this module. Verified instead by reading
// components/research/ResearchHub.tsx's `pushUrl` (see the audit report).

import { describe, it, expect, vi } from 'vitest';
import { schedulePush } from '@/lib/research/deferred-navigation';

function makeManualScheduler() {
  const queued: Array<() => void> = [];
  const schedule = (fn: () => void) => {
    queued.push(fn);
  };
  const runAll = () => {
    // Snapshot first: a callback that schedules again should not be picked
    // up by this same flush (mirrors real setTimeout semantics).
    const batch = queued.splice(0, queued.length);
    for (const fn of batch) fn();
  };
  return { schedule, queued, runAll };
}

describe('schedulePush()', () => {
  it('does not push in the calling stack — only once the scheduled callback runs', () => {
    const push = vi.fn();
    const { schedule, runAll } = makeManualScheduler();

    schedulePush(push, '/research?category=trading', schedule);

    // The defining contract of the bed106f fix: nothing fires synchronously.
    expect(push).not.toHaveBeenCalled();

    runAll();

    expect(push).toHaveBeenCalledTimes(1);
  });

  it('pushes exactly once per call — never zero, never two', () => {
    const push = vi.fn();
    const { schedule, runAll } = makeManualScheduler();

    schedulePush(push, '/research?type=dossier', schedule);
    runAll();

    expect(push).toHaveBeenCalledTimes(1);

    // A second flush (nothing new queued) must not re-fire the first push —
    // guards against a double-schedule regression as strongly as the
    // "exactly one" assertion above does.
    runAll();
    expect(push).toHaveBeenCalledTimes(1);
  });

  it('passes the href through byte-identical — no re-derivation between scheduling and execution', () => {
    const push = vi.fn();
    const { schedule, runAll } = makeManualScheduler();
    const href = '/research?category=trading&status=provisional&q=robo%20advisor';

    schedulePush(push, href, schedule);
    runAll();

    expect(push).toHaveBeenCalledWith(href);
    expect(push).toHaveBeenCalledTimes(1);
  });

  it('defaults to a macrotask scheduler (setTimeout) when none is injected', async () => {
    const push = vi.fn();

    schedulePush(push, '/research');

    // Still nothing synchronously — the default scheduler must not be
    // microtask/synchronous either.
    expect(push).not.toHaveBeenCalled();

    await new Promise<void>((resolve) => setTimeout(resolve, 0));

    expect(push).toHaveBeenCalledTimes(1);
    expect(push).toHaveBeenCalledWith('/research');
  });
});
