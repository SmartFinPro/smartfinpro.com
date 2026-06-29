import { describe, expect, it } from 'vitest';
import { mapCockpitRow } from '@/lib/comparison/loader';
import { roboAdvisorsConfig } from '@/lib/comparison/topics/robo-advisors';
import type { AffiliateLink } from '@/types';

const baseRow = {
  slug: 'wealthfront',
  market: 'us',
  category: 'personal-finance',
  topic: 'robo-advisors',
  display_name: 'Wealthfront',
  is_affiliate: true,
  review_slug: 'wealthfront-review',
  external_url: null,
  management_fee: 0.25,
  account_minimum: 500,
  attributes: {
    tlh: true,
    human_advisor: false,
    account_types: ['taxable', 'ira'],
    sipc: true,
    frac: true,
    sri: false,
    crypto: false,
  },
  source_type: 'official',
  confidence: 'high',
  score: 9,
  rating: 4.6,
  is_top_pick: true,
};

const link = (status: AffiliateLink['tracking_status']): AffiliateLink =>
  ({ slug: 'wealthfront', tracking_status: status }) as AffiliateLink;

describe('mapCockpitRow — attribution gate', () => {
  it("renders 'offer' when an active link is verified", () => {
    const links = new Map([['wealthfront', link('verified')]]);
    const p = mapCockpitRow(baseRow, links, roboAdvisorsConfig)!;
    expect(p.ctaMode).toBe('offer');
    expect(p.offerAttribution).toBe('verified');
  });

  it("renders 'offer' but flags dashboard_only attribution", () => {
    const links = new Map([['wealthfront', link('dashboard_only')]]);
    const p = mapCockpitRow(baseRow, links, roboAdvisorsConfig)!;
    expect(p.ctaMode).toBe('offer');
    expect(p.offerAttribution).toBe('dashboard_only');
  });

  it("falls back to 'review' when the link is unverified (no hidden /go)", () => {
    const links = new Map([['wealthfront', link('unverified')]]);
    const p = mapCockpitRow(baseRow, links, roboAdvisorsConfig)!;
    expect(p.ctaMode).toBe('review');
    expect(p.offerAttribution).toBeNull();
  });

  it("falls back to 'review' when there is no active link at all", () => {
    expect(mapCockpitRow(baseRow, new Map(), roboAdvisorsConfig)!.ctaMode).toBe('review');
  });

  it("falls back to 'visit' when not affiliate and no review_slug", () => {
    const row = { ...baseRow, is_affiliate: false, review_slug: null, external_url: 'https://x.co' };
    expect(mapCockpitRow(row, new Map(), roboAdvisorsConfig)!.ctaMode).toBe('visit');
  });

  it('excludes a row whose attributes fail the topic schema', () => {
    const row = { ...baseRow, attributes: { tlh: 'yes' } };
    expect(mapCockpitRow(row, new Map(), roboAdvisorsConfig)).toBeNull();
  });

  it('maps the generic topic fields', () => {
    const p = mapCockpitRow(baseRow, new Map(), roboAdvisorsConfig)!;
    expect(p.managementFee).toBe(0.25);
    expect(p.accountMinimum).toBe(500);
    expect(p.attributes.tlh).toBe(true);
    expect(p.sourceType).toBe('official');
    expect(p.topic).toBe('robo-advisors');
  });
});
