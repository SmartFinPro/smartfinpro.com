// __tests__/unit/tool-events.test.ts
// Pure tool_v1 tracking logic (lib/analytics/tool-events.ts): event builders,
// label/value derivation, funnel keys, input bucketing, input-change gate,
// qualified-visibility reducer and the qualified-decision predicate.

import { describe, it, expect } from 'vitest';
import {
  buildToolEventData,
  funnelKey,
  toInputBucket,
  createInputChangeGate,
  advanceQualifiedVisibility,
  qualifiedVisibleMs,
  isQualifiedDecision,
  computeToolBatchWeight,
  INITIAL_QUALIFIED_VISIBILITY,
  type ToolContext,
} from '@/lib/analytics/tool-events';

const CTX: ToolContext = {
  toolId: 'money-leak-scanner',
  market: 'us',
  variantPath: '/tools/money-leak-scanner',
  shellMode: 'live-canvas',
};

describe('buildToolEventData()', () => {
  it("tool_first_result: eventAction 'first_result', eventValue=ttfvMs, pagePath=variantPath, schemaVersion tool_v1", () => {
    const data = buildToolEventData('tool_first_result', CTX, { ttfvMs: 3200 });
    expect(data.eventAction).toBe('first_result');
    expect(data.eventValue).toBe(3200);
    expect(data.pagePath).toBe(CTX.variantPath);
    expect(data.properties.schemaVersion).toBe('tool_v1');
    expect(data.eventCategory).toBe('tool');
  });

  it('tool_input_change label = inputKey', () => {
    const data = buildToolEventData('tool_input_change', CTX, { inputKey: 'monthlyIncome', controlRole: 'field' });
    expect(data.eventLabel).toBe('monthlyIncome');
  });

  it('tool_qualified_decision label = qualifiedVia', () => {
    const data = buildToolEventData('tool_qualified_decision', CTX, { qualifiedVia: 'lever' });
    expect(data.eventLabel).toBe('lever');
  });

  it('tool_next_action_click label = nextActionKind', () => {
    const data = buildToolEventData('tool_next_action_click', CTX, { nextActionKind: 'cockpit' });
    expect(data.eventLabel).toBe('cockpit');
  });

  it('tool_cockpit_cta_click label = bridgeHref', () => {
    const data = buildToolEventData('tool_cockpit_cta_click', CTX, { bridgeHref: '/us/trading/best/brokers' });
    expect(data.eventLabel).toBe('/us/trading/best/brokers');
  });

  it('tool_calculation_error label = errorKind', () => {
    const data = buildToolEventData('tool_calculation_error', CTX, { errorKind: 'division_by_zero' });
    expect(data.eventLabel).toBe('division_by_zero');
  });

  it('tool_result_share eventValue = shareFieldCount', () => {
    const data = buildToolEventData('tool_result_share', CTX, { shareFieldCount: 4 });
    expect(data.eventValue).toBe(4);
  });
});

describe('funnelKey()', () => {
  it('contains sessionId, toolId, market, variantPath in fixed order', () => {
    expect(funnelKey('sess-1', CTX)).toBe('sess-1|money-leak-scanner|us|/tools/money-leak-scanner');
  });
});

describe('toInputBucket()', () => {
  it('currency edges', () => {
    expect(toInputBucket(99, 'currency')).toBe('lt100');
    expect(toInputBucket(100, 'currency')).toBe('100-250');
    expect(toInputBucket(1_500_000, 'currency')).toBe('gte1000000');
    expect(toInputBucket(-5, 'currency')).toBe('lt0');
    expect(toInputBucket(NaN, 'currency')).toBe('invalid');
  });
});

describe('createInputChangeGate()', () => {
  it('40 field changes allowed, the 41st blocked; lever has its own budget', () => {
    const gate = createInputChangeGate(40, 10);
    for (let i = 0; i < 40; i++) expect(gate.allow('field')).toBe(true);
    expect(gate.allow('field')).toBe(false);
    // Lever budget is untouched by the field cap.
    for (let i = 0; i < 10; i++) expect(gate.allow('lever')).toBe(true);
    expect(gate.allow('lever')).toBe(false);
    expect(gate.counts()).toEqual({ field: 40, lever: 10 });
  });
});

describe('Qualified-visibility reducer', () => {
  it('visible@0 → hidden@5000 → visible@8000 → qualifiedVisibleMs(state,10000) === 7000', () => {
    let state = INITIAL_QUALIFIED_VISIBILITY;
    state = advanceQualifiedVisibility(state, true, 0);
    state = advanceQualifiedVisibility(state, false, 5000);
    state = advanceQualifiedVisibility(state, true, 8000);
    expect(qualifiedVisibleMs(state, 10000)).toBe(7000);
  });

  it('background (hidden) time never counts', () => {
    let state = INITIAL_QUALIFIED_VISIBILITY;
    state = advanceQualifiedVisibility(state, true, 0);
    state = advanceQualifiedVisibility(state, false, 2000);
    // stays hidden for a long time
    expect(qualifiedVisibleMs(state, 100_000)).toBe(2000);
  });

  it('a repeated "visible" is idempotent (does not reset visibleSince)', () => {
    let state = INITIAL_QUALIFIED_VISIBILITY;
    state = advanceQualifiedVisibility(state, true, 0);
    const afterFirst = state;
    state = advanceQualifiedVisibility(state, true, 3000);
    expect(state).toEqual(afterFirst);
    expect(qualifiedVisibleMs(state, 5000)).toBe(5000);
  });
});

describe('isQualifiedDecision() (Spec 10.3 predicate)', () => {
  const base = {
    firstResultFired: true,
    scenarioCompared: false,
    leverUsed: false,
    nextActionClicked: false,
    shared: false,
    reportDownloaded: false,
    reportEmailed: false,
    qualifiedVisibleMs: 0,
    qualifyingInputCount: 0,
    alreadyQualified: false,
  };

  it('scenario_compare route', () => {
    expect(isQualifiedDecision({ ...base, scenarioCompared: true })).toEqual({ qualified: true, via: 'scenario_compare' });
  });

  it('lever route', () => {
    expect(isQualifiedDecision({ ...base, leverUsed: true })).toEqual({ qualified: true, via: 'lever' });
  });

  it('next_action route', () => {
    expect(isQualifiedDecision({ ...base, nextActionClicked: true })).toEqual({ qualified: true, via: 'next_action' });
  });

  it('share route', () => {
    expect(isQualifiedDecision({ ...base, shared: true })).toEqual({ qualified: true, via: 'share' });
  });

  it('report route (download OR email)', () => {
    expect(isQualifiedDecision({ ...base, reportDownloaded: true })).toEqual({ qualified: true, via: 'report' });
    expect(isQualifiedDecision({ ...base, reportEmailed: true })).toEqual({ qualified: true, via: 'report' });
  });

  it('visibility route only fires at >=20000ms AND >=3 inputs', () => {
    expect(isQualifiedDecision({ ...base, qualifiedVisibleMs: 19_999, qualifyingInputCount: 3 })).toEqual({
      qualified: false,
      via: null,
    });
    expect(isQualifiedDecision({ ...base, qualifiedVisibleMs: 20_000, qualifyingInputCount: 2 })).toEqual({
      qualified: false,
      via: null,
    });
    expect(isQualifiedDecision({ ...base, qualifiedVisibleMs: 20_000, qualifyingInputCount: 3 })).toEqual({
      qualified: true,
      via: 'visibility',
    });
  });

  it('firstResultFired:false never qualifies, regardless of other signals', () => {
    expect(
      isQualifiedDecision({ ...base, firstResultFired: false, scenarioCompared: true, leverUsed: true, shared: true }),
    ).toEqual({ qualified: false, via: null });
  });

  it('alreadyQualified:true never re-qualifies', () => {
    expect(isQualifiedDecision({ ...base, alreadyQualified: true, scenarioCompared: true })).toEqual({
      qualified: false,
      via: null,
    });
  });
});

describe('computeToolBatchWeight()', () => {
  it('0/undefined → 1, 12 → 12, 500 → 20 (clamped to hard cap)', () => {
    expect(computeToolBatchWeight(0)).toBe(1);
    expect(computeToolBatchWeight(undefined)).toBe(1);
    expect(computeToolBatchWeight(12)).toBe(12);
    expect(computeToolBatchWeight(500)).toBe(20);
  });
});
