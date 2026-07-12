// __tests__/unit/track-contract-snapshot.test.ts
// Guard against accidental cockpit_v1 drift while adding the tool_v1
// sibling schemas: locks the TrackSchema.type enum and re-validates a golden
// cockpit_v1 batch fixture (all 12 event names) against the untouched
// TrackEventBatchSchema.

import { describe, it, expect } from 'vitest';
import { TrackSchema, TrackEventBatchSchema } from '@/lib/validation';

describe('TrackSchema.type enum', () => {
  it('is exactly [pageview, event, event_batch, tool_event_batch, scroll, time_on_page]', () => {
    expect(TrackSchema.shape.type.options).toMatchInlineSnapshot(`
      [
        "pageview",
        "event",
        "event_batch",
        "tool_event_batch",
        "scroll",
        "time_on_page",
      ]
    `);
  });
});

const GOLDEN_COCKPIT_BATCH = [
  {
    eventName: 'cockpit_view',
    eventCategory: 'cockpit',
    eventAction: 'view',
    eventLabel: 'robo-advisors',
    pagePath: '/us/personal-finance/best/robo-advisors',
    properties: {
      schemaVersion: 'cockpit_v1',
      market: 'us',
      category: 'personal-finance',
      topic: 'robo-advisors',
      view: 'cards',
      surface: 'cockpit',
    },
  },
  {
    eventName: 'cockpit_product_impression',
    eventCategory: 'cockpit',
    eventAction: 'impression',
    eventLabel: 'wealthfront',
    pagePath: '/us/personal-finance/best/robo-advisors',
    properties: {
      schemaVersion: 'cockpit_v1',
      surface: 'card',
      productSlug: 'wealthfront',
      providerName: 'Wealthfront',
      rank: 1,
      isTopPick: true,
      impressionKind: 'viewport',
      productCount: 8,
    },
  },
  {
    eventName: 'cockpit_cta_click',
    eventCategory: 'cockpit',
    eventAction: 'cta_click',
    eventLabel: 'wealthfront',
    pagePath: '/us/personal-finance/best/robo-advisors',
    properties: {
      schemaVersion: 'cockpit_v1',
      surface: 'card',
      productSlug: 'wealthfront',
      providerName: 'Wealthfront',
      rank: 1,
      ctaMode: 'offer',
      destinationType: 'affiliate',
      productCtaMode: 'primary',
      ctaPosition: 'primary',
    },
  },
  {
    eventName: 'cockpit_sort_change',
    eventCategory: 'cockpit',
    eventAction: 'sort_change',
    eventLabel: 'rating',
    pagePath: '/us/personal-finance/best/robo-advisors',
    properties: {
      schemaVersion: 'cockpit_v1',
      sortKey: 'rating',
      dir: 'desc',
      trigger: 'dropdown',
    },
  },
  {
    eventName: 'cockpit_filter_change',
    eventCategory: 'cockpit',
    eventAction: 'filter_change',
    eventLabel: 'min-deposit',
    pagePath: '/us/personal-finance/best/robo-advisors',
    properties: {
      schemaVersion: 'cockpit_v1',
      filterKey: 'min-deposit',
      enabled: true,
      activeFilters: ['min-deposit'],
      resultCount: 12,
    },
  },
  {
    eventName: 'cockpit_compare_toggle',
    eventCategory: 'cockpit',
    eventAction: 'compare_toggle',
    eventLabel: 'wealthfront',
    pagePath: '/us/personal-finance/best/robo-advisors',
    properties: {
      schemaVersion: 'cockpit_v1',
      productSlug: 'wealthfront',
      selected: true,
      selectionCount: 2,
      source: 'card',
    },
  },
  {
    eventName: 'cockpit_details_toggle',
    eventCategory: 'cockpit',
    eventAction: 'details_toggle',
    eventLabel: 'wealthfront',
    pagePath: '/us/personal-finance/best/robo-advisors',
    properties: {
      schemaVersion: 'cockpit_v1',
      productSlug: 'wealthfront',
      expanded: true,
      source: 'table',
    },
  },
  {
    eventName: 'cockpit_matcher_open',
    eventCategory: 'cockpit',
    eventAction: 'matcher_open',
    eventLabel: '',
    pagePath: '/us/personal-finance/best/robo-advisors',
    properties: {
      schemaVersion: 'cockpit_v1',
      surface: 'matcher',
    },
  },
  {
    eventName: 'cockpit_matcher_answer',
    eventCategory: 'cockpit',
    eventAction: 'matcher_answer',
    eventLabel: 'risk-tolerance',
    pagePath: '/us/personal-finance/best/robo-advisors',
    properties: {
      schemaVersion: 'cockpit_v1',
      matcherQuestion: 'risk-tolerance',
      matcherAnswer: 'moderate',
      answeredCount: 1,
    },
  },
  {
    eventName: 'cockpit_matcher_complete',
    eventCategory: 'cockpit',
    eventAction: 'matcher_complete',
    eventLabel: 'wealthfront',
    pagePath: '/us/personal-finance/best/robo-advisors',
    properties: {
      schemaVersion: 'cockpit_v1',
      topMatchSlug: 'wealthfront',
      fitScore: 87,
      answeredCount: 5,
    },
  },
  {
    eventName: 'cockpit_amount_change',
    eventCategory: 'cockpit',
    eventAction: 'amount_change',
    eventLabel: '',
    pagePath: '/us/personal-finance/best/robo-advisors',
    properties: {
      schemaVersion: 'cockpit_v1',
      amount: 5000,
      costModelKind: 'monthly_plus_setup',
    },
  },
  {
    eventName: 'cockpit_years_change',
    eventCategory: 'cockpit',
    eventAction: 'years_change',
    eventLabel: '',
    pagePath: '/us/personal-finance/best/robo-advisors',
    properties: {
      schemaVersion: 'cockpit_v1',
      years: 10,
    },
  },
];

describe('Golden cockpit_v1 batch fixture (all 12 event names)', () => {
  it('TrackEventBatchSchema.safeParse(...) succeeds', () => {
    expect(GOLDEN_COCKPIT_BATCH).toHaveLength(12);
    const result = TrackEventBatchSchema.safeParse(GOLDEN_COCKPIT_BATCH);
    expect(result.success).toBe(true);
  });

  it('a cockpit item with an unknown property key is still rejected (strict stays strict)', () => {
    const withUnknownKey = [
      {
        ...GOLDEN_COCKPIT_BATCH[0],
        properties: { ...GOLDEN_COCKPIT_BATCH[0].properties, unknownField: 'x' },
      },
      ...GOLDEN_COCKPIT_BATCH.slice(1),
    ];
    const result = TrackEventBatchSchema.safeParse(withUnknownKey);
    expect(result.success).toBe(false);
  });
});
