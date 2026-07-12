// lib/analytics/event-queue.ts
// Generic, schema-agnostic client-analytics primitives (batching, trailing
// debounce, impression dedup). tool_v1 is the first consumer. The cockpit_v1
// copies in lib/analytics/cockpit-events.ts are FROZEN — never modify them,
// never import their values here (type-only imports are fine). No React, no
// DOM, no server imports — unit-testable in plain node.

export type TimerHandle = ReturnType<typeof setTimeout> | number | object;

export interface EventQueueOptions<T> {
  send: (events: T[]) => void;
  /** Server-side hard cap per batch — keep in sync with the batch schema. */
  hardCap: number;
  maxBatch?: number;       // default 12
  flushDelayMs?: number;   // default 800
  schedule?: (fn: () => void, ms: number) => TimerHandle;
  cancel?: (handle: TimerHandle) => void;
}

export interface EventQueue<T> {
  enqueue(event: T, opts?: { immediate?: boolean }): void;
  flush(): void;
  size(): number;
}

export function createEventQueue<T>(options: EventQueueOptions<T>): EventQueue<T> {
  const maxBatch = options.maxBatch ?? 12;
  const flushDelayMs = options.flushDelayMs ?? 800;
  const schedule = options.schedule ?? ((fn, ms) => setTimeout(fn, ms));
  const cancel = options.cancel ?? ((h) => clearTimeout(h as ReturnType<typeof setTimeout>));

  let queue: T[] = [];
  let timer: TimerHandle | null = null;

  function flush(): void {
    if (timer !== null) {
      try { cancel(timer); } catch { /* fail-soft */ }
      timer = null;
    }
    while (queue.length > 0) {
      const batch = queue.slice(0, options.hardCap);
      queue = queue.slice(options.hardCap);
      try { options.send(batch); } catch { /* dropped batch is acceptable; a throwing tracker is not */ }
    }
  }

  function enqueue(event: T, opts?: { immediate?: boolean }): void {
    queue.push(event);
    if (opts?.immediate || queue.length >= maxBatch) { flush(); return; }
    if (timer === null) timer = schedule(flush, flushDelayMs);
  }

  return { enqueue, flush, size: () => queue.length };
}

export function createTrailingDebounce<T>(
  fn: (value: T) => void,
  delayMs: number,
  schedule: (cb: () => void, ms: number) => TimerHandle = (cb, ms) => setTimeout(cb, ms),
  cancel: (handle: TimerHandle) => void = (h) => clearTimeout(h as ReturnType<typeof setTimeout>),
): (value: T) => void {
  let timer: TimerHandle | null = null;
  let last: T;
  return (value: T) => {
    last = value;
    if (timer !== null) { try { cancel(timer); } catch { /* fail-soft */ } }
    timer = schedule(() => {
      timer = null;
      try { fn(last); } catch { /* fail-soft */ }
    }, delayMs);
  };
}

export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface ImpressionDeduper {
  hasSeen(key: string): boolean;
  /** Marks the key as seen. Returns true when newly marked (= fire the event). */
  markSeen(key: string): boolean;
}

/** Key-parameterized dedup (the frozen cockpit version hardcodes 'sfp_ck_imp_v1'). */
export function createImpressionDeduper(
  storageKey: string,
  storage?: KeyValueStorage | null,
  cap = 500,
): ImpressionDeduper {
  const seen = new Set<string>();
  if (storage) {
    try {
      const raw = storage.getItem(storageKey);
      if (raw) {
        const arr: unknown = JSON.parse(raw);
        if (Array.isArray(arr)) for (const k of arr) if (typeof k === 'string') seen.add(k);
      }
    } catch { /* corrupt / unavailable storage → in-memory-only dedup */ }
  }
  return {
    hasSeen: (key) => seen.has(key),
    markSeen(key) {
      if (seen.has(key)) return false;
      seen.add(key);
      if (storage) {
        try {
          let arr = [...seen];
          if (arr.length > cap) arr = arr.slice(arr.length - cap);
          storage.setItem(storageKey, JSON.stringify(arr));
        } catch { /* quota / privacy mode → in-memory only */ }
      }
      return true;
    },
  };
}
