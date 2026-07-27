// __tests__/unit/research-events.test.ts
// Pure core of the research_v1 analytics contract
// (docs/research-library/analytics-research-v1.md — frozen). No DOM, no React:
// the event shape, the derived label/value columns, the rate-limit weight and
// the privacy rule that the raw search string NEVER leaves the browser.
//
// research_v1 is a strictly additive sibling of tool_v1 / cockpit_v1 — those
// modules are never imported or modified here.

import { describe, it, expect } from 'vitest';
import {
  RESEARCH_SCHEMA_VERSION,
  RESEARCH_EVENT_CATEGORY,
  RESEARCH_EVENT_NAMES,
  RESEARCH_EVENT_BATCH_HARD_CAP,
  buildResearchEventData,
  computeResearchBatchWeight,
  toQueryLength,
  type ResearchContext,
} from '@/lib/analytics/research-events';

const CTX: ResearchContext = {
  market: 'us',
  topic: 'trading-platforms',
  pagePath: '/research',
};

describe('research_v1 event names', () => {
  it('is exactly the six events of the frozen contract', () => {
    expect([...RESEARCH_EVENT_NAMES]).toEqual([
      'research_search',
      'research_filter_change',
      'research_evidence_open',
      'research_review_click',
      'research_shortlist_change',
      'research_cockpit_handoff',
    ]);
  });
});

describe('buildResearchEventData — shared envelope', () => {
  it('stamps schemaVersion, category, market, topic and pagePath on every event', () => {
    for (const name of RESEARCH_EVENT_NAMES) {
      const data = buildResearchEventData(name, CTX);
      expect(data.eventName).toBe(name);
      expect(data.eventCategory).toBe(RESEARCH_EVENT_CATEGORY);
      expect(data.pagePath).toBe('/research');
      expect(data.properties.schemaVersion).toBe(RESEARCH_SCHEMA_VERSION);
      expect(data.properties.market).toBe('us');
      expect(data.properties.topic).toBe('trading-platforms');
    }
  });
});

describe('research_search', () => {
  it('carries the query LENGTH and result count — never the query itself', () => {
    const raw = '  Fidelity  ';
    const data = buildResearchEventData('research_search', CTX, {
      queryLength: toQueryLength(raw),
      resultCount: 2,
    });
    expect(data.properties.queryLength).toBe(8);
    expect(data.properties.resultCount).toBe(2);
    expect(JSON.stringify(data).toLowerCase()).not.toContain('fidelity');
  });

  it('reports the result count as the numeric event value', () => {
    const data = buildResearchEventData('research_search', CTX, { queryLength: 4, resultCount: 0 });
    expect(data.eventAction).toBe('search');
    expect(data.eventValue).toBe(0);
    expect(data.eventLabel).toBe('trading-platforms');
  });
});

describe('toQueryLength', () => {
  it('measures the trimmed query', () => {
    expect(toQueryLength('  schwab ')).toBe(6);
    expect(toQueryLength('   ')).toBe(0);
    expect(toQueryLength('')).toBe(0);
  });
});

describe('research_filter_change', () => {
  it('labels by facet and keeps an explicit cleared value', () => {
    const data = buildResearchEventData('research_filter_change', CTX, {
      facet: 'status',
      value: null,
      active: false,
      resultCount: 9,
    });
    expect(data.eventAction).toBe('filter_change');
    expect(data.eventLabel).toBe('status');
    expect(data.eventValue).toBe(9);
    expect(data.properties.value).toBeNull();
    expect(data.properties.active).toBe(false);
  });
});

describe('research_evidence_open', () => {
  it('labels by product slug and reports the data-point count as the value', () => {
    const data = buildResearchEventData('research_evidence_open', CTX, {
      productSlug: 'charles-schwab',
      status: 'audited',
      dataPoints: 4,
    });
    expect(data.eventAction).toBe('evidence_open');
    expect(data.eventLabel).toBe('charles-schwab');
    expect(data.eventValue).toBe(4);
    expect(data.properties.status).toBe('audited');
  });
});

describe('research_review_click', () => {
  it('reports the 1-based rendered position as the value and keeps a null rank', () => {
    const data = buildResearchEventData('research_review_click', CTX, {
      productSlug: 'etoro',
      status: 'provisional',
      rank: null,
      position: 7,
    });
    expect(data.eventAction).toBe('review_click');
    expect(data.eventLabel).toBe('etoro');
    expect(data.eventValue).toBe(7);
    expect(data.properties.rank).toBeNull();
  });
});

describe('research_shortlist_change', () => {
  it('labels by action and reports the new size', () => {
    const added = buildResearchEventData('research_shortlist_change', CTX, {
      action: 'add',
      productSlug: 'fidelity',
      count: 1,
    });
    expect(added.eventAction).toBe('shortlist_change');
    expect(added.eventLabel).toBe('add');
    expect(added.eventValue).toBe(1);
  });

  it("carries a null productSlug for 'clear'", () => {
    const cleared = buildResearchEventData('research_shortlist_change', CTX, {
      action: 'clear',
      productSlug: null,
      count: 0,
    });
    expect(cleared.eventLabel).toBe('clear');
    expect(cleared.eventValue).toBe(0);
    expect(cleared.properties.productSlug).toBeNull();
  });
});

describe('research_cockpit_handoff', () => {
  it('carries the shortlisted slugs and their count', () => {
    const data = buildResearchEventData('research_cockpit_handoff', CTX, {
      productSlugs: ['fidelity', 'charles-schwab'],
      count: 2,
    });
    expect(data.eventAction).toBe('cockpit_handoff');
    expect(data.eventLabel).toBe('fidelity,charles-schwab');
    expect(data.eventValue).toBe(2);
    expect(data.properties.productSlugs).toEqual(['fidelity', 'charles-schwab']);
  });
});

describe('computeResearchBatchWeight', () => {
  it('costs one token per event, at least one, clamped to the hard cap', () => {
    expect(computeResearchBatchWeight(0)).toBe(1);
    expect(computeResearchBatchWeight(5)).toBe(5);
    expect(computeResearchBatchWeight(100)).toBe(RESEARCH_EVENT_BATCH_HARD_CAP);
  });

  it('treats a non-numeric length as a single token', () => {
    expect(computeResearchBatchWeight(undefined)).toBe(1);
    expect(computeResearchBatchWeight('12')).toBe(1);
    expect(computeResearchBatchWeight(Number.NaN)).toBe(1);
  });
});
