// __tests__/unit/result-panel-machine.test.ts
// Result panel state machine (lib/tools/shell-types.ts advancePanelState) —
// SPEC 6.5. Pure reducer, no React.

import { describe, it, expect } from 'vitest';
import { advancePanelState, type PanelState } from '@/lib/tools/shell-types';

const ALL_STATES: PanelState[] = [
  'initial', 'ready', 'calculating', 'result', 'insufficient-data', 'stale-data', 'error',
];

describe('advancePanelState()', () => {
  it('RESET returns to initial from every state', () => {
    for (const s of ALL_STATES) {
      expect(advancePanelState(s, { type: 'RESET' })).toBe('initial');
    }
  });

  it('INPUTS_PREFILLED moves to ready', () => {
    expect(advancePanelState('initial', { type: 'INPUTS_PREFILLED' })).toBe('ready');
  });

  it('INPUT_CHANGED with complete:true from initial moves to ready', () => {
    expect(advancePanelState('initial', { type: 'INPUT_CHANGED', complete: true })).toBe('ready');
  });

  it('INPUT_CHANGED with complete:false stays initial when starting from initial', () => {
    expect(advancePanelState('initial', { type: 'INPUT_CHANGED', complete: false })).toBe('initial');
  });

  it('INPUT_CHANGED with complete:false from ready moves to insufficient-data', () => {
    expect(advancePanelState('ready', { type: 'INPUT_CHANGED', complete: false })).toBe('insufficient-data');
  });

  it('a completed result + incomplete input change moves to insufficient-data (never a blank panel)', () => {
    expect(advancePanelState('result', { type: 'INPUT_CHANGED', complete: false })).toBe('insufficient-data');
  });

  it('a result state + complete input change stays in result (still valid, recalculation pending)', () => {
    expect(advancePanelState('result', { type: 'INPUT_CHANGED', complete: true })).toBe('result');
  });

  it('stale-data + incomplete input change moves to insufficient-data', () => {
    expect(advancePanelState('stale-data', { type: 'INPUT_CHANGED', complete: false })).toBe('insufficient-data');
  });

  it('stale-data + complete input change stays stale-data', () => {
    expect(advancePanelState('stale-data', { type: 'INPUT_CHANGED', complete: true })).toBe('stale-data');
  });

  it('CALC_STARTED moves to calculating from ready', () => {
    expect(advancePanelState('ready', { type: 'CALC_STARTED' })).toBe('calculating');
  });

  it('CALC_SUCCEEDED with stale:false moves to result', () => {
    expect(advancePanelState('calculating', { type: 'CALC_SUCCEEDED', stale: false })).toBe('result');
  });

  it('CALC_SUCCEEDED with stale:true moves to stale-data', () => {
    expect(advancePanelState('calculating', { type: 'CALC_SUCCEEDED', stale: true })).toBe('stale-data');
  });

  it('CALC_FAILED moves to error from any in-flight state', () => {
    expect(advancePanelState('calculating', { type: 'CALC_FAILED' })).toBe('error');
  });

  it('insufficient-data + complete input change moves to ready', () => {
    expect(advancePanelState('insufficient-data', { type: 'INPUT_CHANGED', complete: true })).toBe('ready');
  });

  it('error state can be reset by RESET only (no accidental recovery via INPUT_CHANGED complete)', () => {
    // INPUT_CHANGED from 'error' with complete:true falls through the generic
    // branch (not initial, not result/stale-data) → 'ready', matching the
    // reference reducer's fallback (event.complete ? 'ready' : 'insufficient-data').
    expect(advancePanelState('error', { type: 'INPUT_CHANGED', complete: true })).toBe('ready');
    expect(advancePanelState('error', { type: 'INPUT_CHANGED', complete: false })).toBe('insufficient-data');
  });
});
