// lib/decision/store.ts
// SSR-safe accessors — every function is a no-op / null outside the browser.
// Corrupt or foreign-version payloads are DISCARDED, never migrated in v1.

import { DECISION_STORAGE_KEY, DecisionStateSchema, type DecisionStateV1 } from './types';

function storage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage;
  } catch {
    return null; // privacy mode
  }
}

function discard(s: Storage): void {
  try {
    s.removeItem(DECISION_STORAGE_KEY);
  } catch {
    /* noop */
  }
}

export function readDecisionState(): DecisionStateV1 | null {
  const s = storage();
  if (!s) return null;
  let raw: string | null;
  try {
    raw = s.getItem(DECISION_STORAGE_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    // Malformed JSON is discarded, same as a failed schema parse below —
    // never leave a corrupt payload sitting in sessionStorage.
    discard(s);
    return null;
  }
  const parsed = DecisionStateSchema.safeParse(json);
  if (!parsed.success) {
    discard(s);
    return null;
  }
  return parsed.data;
}

export function writeDecisionState(
  update: (prev: DecisionStateV1 | null) => Omit<DecisionStateV1, 'v' | 'updatedAt'>,
  nowIso: string = new Date().toISOString(),
): DecisionStateV1 | null {
  const s = storage();
  if (!s) return null;
  const next: DecisionStateV1 = { v: 1, updatedAt: nowIso, ...update(readDecisionState()) };
  const parsed = DecisionStateSchema.safeParse(next);
  if (!parsed.success) return null; // never persist an invalid shape
  try {
    s.setItem(DECISION_STORAGE_KEY, JSON.stringify(parsed.data));
  } catch {
    /* quota */
  }
  return parsed.data;
}

export function clearDecisionState(): void {
  const s = storage();
  if (!s) return;
  try {
    s.removeItem(DECISION_STORAGE_KEY);
  } catch {
    /* noop */
  }
}
