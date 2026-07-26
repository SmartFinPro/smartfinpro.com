'use client';
// lib/decision/use-decision-state.ts
import { useCallback, useSyncExternalStore } from 'react';
import { readDecisionState, writeDecisionState } from './store';
import type { DecisionStateV1 } from './types';

// Cross-component sync within the tab via a custom event (sessionStorage
// fires no 'storage' event in the same tab).
const CHANGE_EVENT = 'sfp-decision-change';
let cache: { raw: string | null; value: DecisionStateV1 | null } = { raw: null, value: null };

function getSnapshot(): DecisionStateV1 | null {
  if (typeof window === 'undefined') return null;
  const raw = window.sessionStorage.getItem('sfp_decision_v1');
  if (raw === cache.raw) return cache.value; // referential stability for useSyncExternalStore
  cache = { raw, value: readDecisionState() };
  return cache.value;
}

export function useDecisionState(): {
  state: DecisionStateV1 | null;
  update: (fn: (prev: DecisionStateV1 | null) => Omit<DecisionStateV1, 'v' | 'updatedAt'>) => void;
} {
  const state = useSyncExternalStore(
    (onChange) => {
      window.addEventListener(CHANGE_EVENT, onChange);
      return () => window.removeEventListener(CHANGE_EVENT, onChange);
    },
    getSnapshot,
    () => null, // server snapshot
  );
  const update = useCallback((fn: Parameters<typeof writeDecisionState>[0]) => {
    writeDecisionState(fn);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);
  return { state, update };
}
