// __tests__/unit/research-validation.test.ts
// research_v1 Zod contract (lib/validation/index.ts additions) — strict sibling
// of the frozen cockpit_v1 and the tool_v1 schemas. The schema is where the
// contract is ENFORCED against any client: unknown property keys are rejected,
// the batch is capped, and a foreign eventCategory can't smuggle rows in.

import { describe, it, expect } from 'vitest';
import { TrackSchema, TrackResearchEventBatchSchema } from '@/lib/validation';
import {
  RESEARCH_EVENT_NAMES,
  buildResearchEventData,
  type ResearchContext,
} from '@/lib/analytics/research-events';

const CTX: ResearchContext = { market: 'us', topic: 'trading-platforms', pagePath: '/research' };

function researchItem(overrides: Record<string, unknown> = {}) {
  return {
    eventName: 'research_search',
    eventCategory: 'research',
    eventAction: 'search',
    eventLabel: 'trading-platforms',
    pagePath: '/research',
    properties: {
      schemaVersion: 'research_v1',
      market: 'us',
      topic: 'trading-platforms',
      queryLength: 8,
      resultCount: 2,
    },
    ...overrides,
  };
}

describe('TrackResearchEventBatchSchema', () => {
  it('accepts a real batch built by buildResearchEventData', () => {
    const batch = [
      buildResearchEventData('research_search', CTX, { queryLength: 6, resultCount: 1 }),
      buildResearchEventData('research_filter_change', CTX, {
        facet: 'status',
        value: 'audited',
        active: true,
        resultCount: 8,
      }),
      buildResearchEventData('research_evidence_open', CTX, {
        productSlug: 'charles-schwab',
        status: 'audited',
        dataPoints: 4,
      }),
      buildResearchEventData('research_review_click', CTX, {
        productSlug: 'etoro',
        status: 'provisional',
        rank: null,
        position: 9,
      }),
      buildResearchEventData('research_shortlist_change', CTX, {
        action: 'clear',
        productSlug: null,
        count: 0,
      }),
      buildResearchEventData('research_cockpit_handoff', CTX, {
        productSlugs: ['fidelity', 'charles-schwab'],
        count: 2,
      }),
      // PR 3 Task 1 (spec §12) — 7th, additive event name.
      buildResearchEventData('research_finder_cta', CTX, {
        surface: 'finder',
        trigger: 'view_all',
        queryLength: 6,
        resultCount: 4,
      }),
    ];
    expect(batch).toHaveLength(RESEARCH_EVENT_NAMES.length);
    const result = TrackResearchEventBatchSchema.safeParse(batch);
    expect(result.success).toBe(true);
  });

  it('rejects an unknown property key (.strict())', () => {
    const batch = [researchItem({ properties: { ...researchItem().properties, foo: 1 } })];
    expect(TrackResearchEventBatchSchema.safeParse(batch).success).toBe(false);
  });

  it('rejects a raw query smuggled in as a property', () => {
    const batch = [researchItem({ properties: { ...researchItem().properties, query: 'fidelity' } })];
    expect(TrackResearchEventBatchSchema.safeParse(batch).success).toBe(false);
  });

  it("rejects eventCategory 'cockpit' or 'tool' inside a research item", () => {
    expect(TrackResearchEventBatchSchema.safeParse([researchItem({ eventCategory: 'cockpit' })]).success).toBe(false);
    expect(TrackResearchEventBatchSchema.safeParse([researchItem({ eventCategory: 'tool' })]).success).toBe(false);
  });

  it('rejects a foreign event name', () => {
    expect(TrackResearchEventBatchSchema.safeParse([researchItem({ eventName: 'tool_view' })]).success).toBe(false);
  });

  it('requires the properties bag', () => {
    const { properties: _drop, ...withoutProperties } = researchItem();
    expect(TrackResearchEventBatchSchema.safeParse([withoutProperties]).success).toBe(false);
  });

  it('caps the batch at 20 and rejects an empty one', () => {
    expect(TrackResearchEventBatchSchema.safeParse(Array.from({ length: 20 }, () => researchItem())).success).toBe(true);
    expect(TrackResearchEventBatchSchema.safeParse(Array.from({ length: 21 }, () => researchItem())).success).toBe(false);
    expect(TrackResearchEventBatchSchema.safeParse([]).success).toBe(false);
  });

  it('caps productSlugs at the shortlist maximum', () => {
    const ok = researchItem({
      eventName: 'research_cockpit_handoff',
      properties: {
        schemaVersion: 'research_v1',
        market: 'us',
        topic: 'trading-platforms',
        productSlugs: ['a', 'b', 'c', 'd'],
        count: 4,
      },
    });
    expect(TrackResearchEventBatchSchema.safeParse([ok]).success).toBe(true);

    const tooMany = researchItem({
      eventName: 'research_cockpit_handoff',
      properties: {
        schemaVersion: 'research_v1',
        market: 'us',
        topic: 'trading-platforms',
        productSlugs: ['a', 'b', 'c', 'd', 'e'],
        count: 5,
      },
    });
    expect(TrackResearchEventBatchSchema.safeParse([tooMany]).success).toBe(false);
  });

  it("TrackSchema accepts type: 'research_event_batch'", () => {
    const result = TrackSchema.safeParse({
      type: 'research_event_batch',
      sessionId: 'session-12345678',
      data: { events: [researchItem()] },
    });
    expect(result.success).toBe(true);
  });
});
