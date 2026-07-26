// __tests__/unit/cockpit-events.test.ts
// Pure-core tests for the cockpit_v1 tracking schema:
// buildCockpitEventData column mapping + parseCockpitPath.

import { describe, it, expect } from 'vitest';
import {
  buildCockpitEventData,
  parseCockpitPath,
  COCKPIT_SCHEMA_VERSION,
  type CockpitContext,
  type CockpitEventName,
} from '@/lib/analytics/cockpit-events';

const CTX: CockpitContext = { market: 'au', category: 'personal-finance', topic: 'robo-advisors' };
const PATH = '/au/personal-finance/best/robo-advisors';

// ─────────────────────────────────────────────────────────────────────────────
// buildCockpitEventData — column mapping for all 12 events
// ─────────────────────────────────────────────────────────────────────────────
describe('buildCockpitEventData()', () => {
  it('stamps schemaVersion, category and context on every event', () => {
    const names: CockpitEventName[] = [
      'cockpit_view', 'cockpit_product_impression', 'cockpit_cta_click',
      'cockpit_sort_change', 'cockpit_filter_change', 'cockpit_compare_toggle',
      'cockpit_details_toggle', 'cockpit_matcher_open', 'cockpit_matcher_answer',
      'cockpit_matcher_complete', 'cockpit_amount_change', 'cockpit_years_change',
    ];
    for (const name of names) {
      const d = buildCockpitEventData(name, CTX, PATH);
      expect(d.eventName).toBe(name);
      expect(d.eventCategory).toBe('cockpit');
      expect(d.pagePath).toBe(PATH);
      expect(d.properties.schemaVersion).toBe(COCKPIT_SCHEMA_VERSION);
      expect(d.properties.market).toBe('au');
      expect(d.properties.category).toBe('personal-finance');
      expect(d.properties.topic).toBe('robo-advisors');
    }
  });

  it('reserved attribution fields are absent unless explicitly set', () => {
    const d = buildCockpitEventData('cockpit_cta_click', CTX, PATH, { productSlug: 'stake' });
    expect('affiliateNetwork' in d.properties).toBe(false);
    expect('affiliateClickId' in d.properties).toBe(false);
    expect('estimatedCommission' in d.properties).toBe(false);
  });

  it.each([
    ['cockpit_view', { surface: 'table' as const }, 'view', 'table', undefined],
    ['cockpit_product_impression', { productSlug: 'stake', rank: 2 }, 'impression', 'stake', 2],
    ['cockpit_cta_click', { productSlug: 'stake', rank: 1 }, 'cta_click', 'stake', 1],
    ['cockpit_sort_change', { sortKey: 'cost' }, 'sort_change', 'cost', undefined],
    ['cockpit_filter_change', { filterKey: 'noMonthly', resultCount: 4 }, 'filter_change', 'noMonthly', 4],
    ['cockpit_compare_toggle', { productSlug: 'stake', selectionCount: 3 }, 'compare_toggle', 'stake', 3],
    ['cockpit_details_toggle', { productSlug: 'stake', rank: 5 }, 'details_toggle', 'stake', 5],
    ['cockpit_matcher_open', {}, 'matcher_open', 'matcher', undefined],
    ['cockpit_matcher_answer', { matcherQuestion: 'q1', matcherAnswer: 'a' }, 'matcher_answer', 'q1', undefined],
    ['cockpit_matcher_complete', { topMatchSlug: 'stake', fitScore: 87 }, 'matcher_complete', 'stake', 87],
    ['cockpit_amount_change', { amount: 50000 }, 'amount_change', 'amount', 50000],
    ['cockpit_years_change', { years: 15 }, 'years_change', 'years', 15],
  ] as const)('%s → action/label/value mapping', (name, props, action, label, value) => {
    const d = buildCockpitEventData(name as CockpitEventName, CTX, PATH, props);
    expect(d.eventAction).toBe(action);
    expect(d.eventLabel).toBe(label);
    expect(d.eventValue).toBe(value);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// parseCockpitPath — all four markets are prefixed (US uses /us/... too)
// ─────────────────────────────────────────────────────────────────────────────
describe('parseCockpitPath()', () => {
  it.each([
    ['/us/personal-finance/best/robo-advisors', 'us', 'personal-finance', 'robo-advisors'],
    ['/uk/personal-finance/best/investing-apps', 'uk', 'personal-finance', 'investing-apps'],
    ['/ca/personal-finance/best/robo-advisors', 'ca', 'personal-finance', 'robo-advisors'],
    ['/au/forex/best/forex-brokers', 'au', 'forex', 'forex-brokers'],
  ])('parses %s', (path, market, category, topic) => {
    expect(parseCockpitPath(path)).toEqual({ market, category, topic });
  });

  it('accepts a trailing slash and strips query/hash', () => {
    expect(parseCockpitPath('/au/forex/best/forex-brokers/')).toEqual({
      market: 'au', category: 'forex', topic: 'forex-brokers',
    });
    expect(parseCockpitPath('/us/trading/best/trading-platforms?view=table#compare')).toEqual({
      market: 'us', category: 'trading', topic: 'trading-platforms',
    });
  });

  it('returns null for non-cockpit and unprefixed paths', () => {
    expect(parseCockpitPath('/us/personal-finance/wealthfront-review')).toBeNull();
    expect(parseCockpitPath('/personal-finance/best/robo-advisors')).toBeNull(); // no unprefixed cockpit routes
    expect(parseCockpitPath('/de/personal-finance/best/robo-advisors')).toBeNull();
    expect(parseCockpitPath('/us/personal-finance/best/robo-advisors/extra')).toBeNull();
    expect(parseCockpitPath('')).toBeNull();
    expect(parseCockpitPath(null)).toBeNull();
    expect(parseCockpitPath(undefined)).toBeNull();
  });
});
