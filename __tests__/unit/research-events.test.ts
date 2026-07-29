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

// Task 6 (unified-research-discovery-pr2-hubs plan, spec §12): the universal
// hub binds its tracker with topic: 'hub' for its whole lifetime — a GLOBAL
// event (search, the hub-wide filter chip) keeps that bound topic; an ITEM
// event overrides it via `dimensions`.
const HUB_CTX: ResearchContext = {
  market: 'us',
  topic: 'hub',
  pagePath: '/research',
};

// PR 3 Task 1 (spec §12) — the Homepage Quick Finder's own CTA event.
const FINDER_CTX: ResearchContext = {
  market: 'us',
  topic: 'hub',
  pagePath: '/',
};

describe('research_v1 event names', () => {
  it('is exactly the seven events of the additive contract (PR 3 Task 1 adds research_finder_cta)', () => {
    expect([...RESEARCH_EVENT_NAMES]).toEqual([
      'research_search',
      'research_filter_change',
      'research_evidence_open',
      'research_review_click',
      'research_shortlist_change',
      'research_cockpit_handoff',
      'research_finder_cta',
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

  // PR 3 review fix: properties.queryLength is capped at 500 by the strict
  // wire schema (ResearchV1PropertiesSchema, lib/validation/index.ts:240,
  // z.number().int().min(0).max(500)), but toQueryLength itself had no
  // ceiling. An uncapped length over 500 fails that Zod max, and since the
  // properties bag is a single item in a batch array, the WHOLE event batch
  // is rejected (400) — not just this one field. trackFinderCta sends its
  // event immediately and alone, so one over-long query on a CTA click lost
  // its entire event. Clamping here guarantees toQueryLength can never
  // itself produce a value the wire schema would reject.
  it('clamps at exactly the wire cap (500) so a longer query never gets its whole event rejected', () => {
    expect(toQueryLength('a'.repeat(500))).toBe(500);
  });

  it('clamps a query one character over the wire cap down to 500', () => {
    expect(toQueryLength('a'.repeat(501))).toBe(500);
  });

  it('clamps a wildly over-long query (e.g. a pasted paragraph) down to 500', () => {
    expect(toQueryLength('a'.repeat(2000))).toBe(500);
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

// PR 5 gap-close (this task) — Task 6 (unified-research-discovery-pr2-hubs
// plan) only ever wired 'status'|'confidence'|'fresh' through ResearchFacet,
// leaving the category/type chips both hubs and the Homepage Quick Finder
// actually render analytically unmeasurable. Additive: 'category' and 'type'
// join the union, deriveLabel/deriveValue stay untouched (both are already
// facet-agnostic — label is the facet name itself, value is resultCount).
describe('research_filter_change — category/type facets (PR 5 gap-close)', () => {
  it('labels by facet for a category chip, same shape as the frozen three', () => {
    const data = buildResearchEventData('research_filter_change', CTX, {
      facet: 'category',
      value: 'trading',
      active: true,
      resultCount: 5,
    });
    expect(data.eventAction).toBe('filter_change');
    expect(data.eventLabel).toBe('category');
    expect(data.eventValue).toBe(5);
    expect(data.properties.facet).toBe('category');
    expect(data.properties.value).toBe('trading');
    expect(data.properties.active).toBe(true);
  });

  it('labels by facet for a type chip and keeps an explicit cleared value', () => {
    const data = buildResearchEventData('research_filter_change', CTX, {
      facet: 'type',
      value: null,
      active: false,
      resultCount: 12,
    });
    expect(data.eventAction).toBe('filter_change');
    expect(data.eventLabel).toBe('type');
    expect(data.eventValue).toBe(12);
    expect(data.properties.facet).toBe('type');
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

// Task 6 (unified-research-discovery-pr2-hubs plan, spec §12) — additive hub
// dimensions: `surface`/`kind`/`trigger`/`category` as new optional
// properties, and the builder's new `dimensions` argument which overrides
// `topic`/stamps `category` ONLY while constructing `properties` — it is
// never itself a serialized key (`topicOverride` is a build-time argument,
// not a property).
describe('hub dimensions (Task 6, spec §12)', () => {
  it('uses hub context for global events', () => {
    const event = buildResearchEventData('research_search', HUB_CTX, {
      surface: 'hub',
      queryLength: 4,
      resultCount: 2,
    });
    expect(event.properties.topic).toBe('hub');
    expect(event.properties.surface).toBe('hub');
  });

  it('overrides topic and category for an item event', () => {
    const event = buildResearchEventData(
      'research_review_click',
      HUB_CTX,
      { productSlug: 'fidelity', kind: 'dossier' },
      { topic: 'trading-platforms', category: 'trading' },
    );
    expect(event.properties.topic).toBe('trading-platforms');
    expect(event.properties.category).toBe('trading');
  });

  it('an item event without a dimensions override falls back to the bound ctx.topic and carries no category', () => {
    const event = buildResearchEventData('research_evidence_open', HUB_CTX, {
      productSlug: 'fidelity',
      status: 'audited',
      dataPoints: 3,
      kind: 'dossier',
    });
    expect(event.properties.topic).toBe('hub');
    expect(event.properties.category).toBeUndefined();
  });

  it('every pre-Task-6 call site (no 4th argument at all) stays byte-identical', () => {
    const event = buildResearchEventData('research_search', CTX, { queryLength: 6, resultCount: 1 });
    expect(event.properties.topic).toBe('trading-platforms');
    expect(event.properties.surface).toBeUndefined();
    expect(event.properties.kind).toBeUndefined();
    expect(event.properties.trigger).toBeUndefined();
    expect(event.properties.category).toBeUndefined();
  });

  it("carries kind ('review' | 'dossier') independently of the topic/category override", () => {
    const reviewEvent = buildResearchEventData(
      'research_review_click',
      HUB_CTX,
      { productSlug: 'merrill-edge', status: 'unavailable', rank: null, position: 3, kind: 'review' },
    );
    expect(reviewEvent.properties.kind).toBe('review');
    expect(reviewEvent.properties.topic).toBe('hub');
    expect(reviewEvent.properties.category).toBeUndefined();
  });
});

// PR 3 Task 1 (spec §12) — the Homepage Quick Finder's own event, additive
// on top of the frozen six: `trigger: 'view_all'` (the Finder's main CTA, a
// GLOBAL event, topic 'hub') and `trigger: 'dossier_item'` (a Cockpit-only
// card's CTA, an ITEM event carrying the card's real topic/category).
describe('research_finder_cta (PR 3 Task 1, spec §12)', () => {
  it('includes the Finder CTA event in the additive contract', () => {
    expect(RESEARCH_EVENT_NAMES).toContain('research_finder_cta');
  });

  it('builds a view-all Finder CTA without raw query text', () => {
    const event = buildResearchEventData('research_finder_cta', FINDER_CTX, {
      surface: 'finder',
      trigger: 'view_all',
      queryLength: 6,
      resultCount: 2,
    });
    expect(event.eventAction).toBe('finder_cta');
    expect(event.properties.trigger).toBe('view_all');
    expect(JSON.stringify(event)).not.toContain('schwab');
  });

  it('builds a dossier-item CTA with actual topic and category', () => {
    const event = buildResearchEventData(
      'research_finder_cta',
      FINDER_CTX,
      {
        surface: 'finder',
        kind: 'dossier',
        trigger: 'dossier_item',
        productSlug: 'merrill-edge',
      },
      { topic: 'trading-platforms', category: 'trading' },
    );
    expect(event.properties.topic).toBe('trading-platforms');
    expect(event.properties.category).toBe('trading');
  });

  it("reports the resultCount VISIBLE AT CLICK TIME as the event value — the exact caller-supplied number, never recomputed", () => {
    const event = buildResearchEventData('research_finder_cta', FINDER_CTX, {
      surface: 'finder',
      trigger: 'view_all',
      queryLength: 6,
      resultCount: 4,
    });
    expect(event.eventValue).toBe(4);
    expect(event.properties.resultCount).toBe(4);
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
