// __tests__/unit/decision-store.test.ts
// DecisionStateV1 (lib/decision/) — the shared, session-scoped decision state
// that Quiz/Trading-Cost/Comparison will produce/consume from PR 3.2 onward.
// This PR (3.1) ships the store itself with no consumer — these tests are
// the only thing exercising it.
//
// vitest's default environment is `node` (see vitest.config.ts) — there is no
// global `window`/`sessionStorage` unless a test stubs one. That default
// state is exactly what SSR looks like, so the "SSR path" test below simply
// runs without stubbing anything. Browser-path tests stub a minimal
// `window.sessionStorage` on globalThis, mirroring the pattern already used
// in __tests__/unit/tool-tracking.test.ts.

import { describe, it, expect, afterEach } from 'vitest';
import {
  DECISION_STORAGE_KEY,
  DecisionStateSchema,
  type DecisionStateV1,
} from '@/lib/decision/types';
import {
  readDecisionState,
  writeDecisionState,
  clearDecisionState,
} from '@/lib/decision/store';

/** Minimal in-memory Storage stub, mirroring window.sessionStorage's surface. */
function fakeStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => {
      store.set(k, v);
    },
    removeItem: (k: string) => {
      store.delete(k);
    },
    clear: () => store.clear(),
    key: (i: number) => Array.from(store.keys())[i] ?? null,
    get length() {
      return store.size;
    },
  } as Storage;
}

function stubBrowserEnv(): Storage {
  const storage = fakeStorage();
  Object.defineProperty(globalThis, 'window', {
    value: { sessionStorage: storage },
    configurable: true,
    writable: true,
  });
  return storage;
}

function teardownBrowserEnv(): void {
  delete (globalThis as Record<string, unknown>).window;
}

afterEach(() => {
  teardownBrowserEnv();
});

describe('DecisionStateSchema (.strict())', () => {
  it('rejects unknown top-level keys', () => {
    const result = DecisionStateSchema.safeParse({
      v: 1,
      updatedAt: new Date().toISOString(),
      notAKnownField: 'nope',
    });
    expect(result.success).toBe(false);
  });

  it('accepts a minimal valid state (no optional namespaces)', () => {
    const result = DecisionStateSchema.safeParse({
      v: 1,
      updatedAt: new Date().toISOString(),
    });
    expect(result.success).toBe(true);
  });
});

describe('readDecisionState() / writeDecisionState() — roundtrip', () => {
  it('write then read returns the same broker payload', () => {
    stubBrowserEnv();
    const written = writeDecisionState(() => ({
      broker: {
        market: 'us',
        quizAnswers: { q1: 'a' },
        profile: {
          experience: 'beginner',
          instruments: ['stocks'],
          tradesPerMonth: 5,
          avgTradeSize: 500,
          priorities: ['low-fees'],
        },
        shortlistSlugs: ['broker-a'],
      },
    }));

    expect(written).not.toBeNull();
    const read = readDecisionState();
    expect(read).not.toBeNull();
    expect(read?.v).toBe(1);
    expect(read?.broker?.market).toBe('us');
    expect(read?.broker?.shortlistSlugs).toEqual(['broker-a']);
  });
});

describe('readDecisionState() — corrupt payload', () => {
  it('returns null and removes the key when stored JSON is malformed', () => {
    const storage = stubBrowserEnv();
    storage.setItem(DECISION_STORAGE_KEY, '{not valid json');

    const result = readDecisionState();

    expect(result).toBeNull();
    expect(storage.getItem(DECISION_STORAGE_KEY)).toBeNull();
  });
});

describe('readDecisionState() — foreign version', () => {
  it('discards a {v:2} payload instead of migrating it', () => {
    const storage = stubBrowserEnv();
    storage.setItem(
      DECISION_STORAGE_KEY,
      JSON.stringify({ v: 2, updatedAt: new Date().toISOString() }),
    );

    const result = readDecisionState();

    expect(result).toBeNull();
    expect(storage.getItem(DECISION_STORAGE_KEY)).toBeNull();
  });
});

describe('SSR safety — no window global', () => {
  it('readDecisionState/writeDecisionState/clearDecisionState are no-ops off the browser', () => {
    expect(typeof globalThis.window).toBe('undefined');

    expect(readDecisionState()).toBeNull();
    expect(writeDecisionState(() => ({ home: { market: 'uk', inputs: {} } }))).toBeNull();
    expect(() => clearDecisionState()).not.toThrow();
  });
});

describe('writeDecisionState() — invalid shape', () => {
  it('does not persist anything when the produced shape fails schema validation', () => {
    const storage = stubBrowserEnv();

    const result = writeDecisionState(
      () =>
        ({
          broker: {
            market: 'zz', // not a valid ToolMarket
            quizAnswers: {},
            profile: {
              experience: 'beginner',
              instruments: [],
              tradesPerMonth: 1,
              avgTradeSize: 1,
              priorities: [],
            },
            shortlistSlugs: [],
          },
        }) as unknown as Omit<DecisionStateV1, 'v' | 'updatedAt'>,
    );

    expect(result).toBeNull();
    expect(storage.getItem(DECISION_STORAGE_KEY)).toBeNull();
  });
});

describe('writeDecisionState() — update-merge preserves foreign namespaces', () => {
  it('a broker-only write does not delete a previously written home namespace', () => {
    stubBrowserEnv();

    writeDecisionState((prev) => ({
      ...prev,
      home: { market: 'ca', inputs: { price: 500000 } },
    }));

    writeDecisionState((prev) => ({
      ...prev,
      broker: {
        market: 'ca',
        quizAnswers: { q1: 'x' },
        profile: {
          experience: 'advanced',
          instruments: ['forex'],
          tradesPerMonth: 20,
          avgTradeSize: 2000,
          priorities: ['speed'],
        },
        shortlistSlugs: ['broker-b'],
      },
    }));

    const final = readDecisionState();
    expect(final?.home?.market).toBe('ca');
    expect(final?.home?.inputs.price).toBe(500000);
    expect(final?.broker?.shortlistSlugs).toEqual(['broker-b']);
  });
});
