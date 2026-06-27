import { describe, it, expect } from 'vitest';
import { buildTrackedDestinationUrl } from '@/lib/affiliate/tracker';

const CLICK_ID = '3f2504e0-4f89-41d3-9a0c-0305e82c3301'; // valid UUID v4 shape
const SLUG_LIKE = 'silvergoldbull-us';

function params(url: string) {
  return new URL(url).searchParams;
}

describe('buildTrackedDestinationUrl — network-aware SubID passthrough', () => {
  it('CJ link: puts the click_id (UUID) in `sid` — NOT the slug (the bug we fixed)', () => {
    // CJ echoes whatever is in `sid` back in its postback; processPostback
    // rejects anything that is not a UUID matching a link_clicks row.
    const out = buildTrackedDestinationUrl(
      'https://www.kqzyfj.com/click-101710331-13287715',
      CLICK_ID,
      'Silver Gold Bull',
    );
    const p = params(out);
    expect(p.get('sid')).toBe(CLICK_ID);
    expect(p.get('sid')).not.toBe(SLUG_LIKE);
    expect(p.get('subid')).toBe(CLICK_ID);
  });

  it('detects CJ by the `Commission Junction` network value too', () => {
    const out = buildTrackedDestinationUrl(
      'https://www.anrdoezrs.net/click-123-456',
      CLICK_ID,
      'Commission Junction',
    );
    expect(params(out).get('sid')).toBe(CLICK_ID);
  });

  it('Awin link: uses `clickref`', () => {
    const out = buildTrackedDestinationUrl('https://www.awin1.com/cread.php?p=1', CLICK_ID, 'Awin');
    const p = params(out);
    expect(p.get('clickref')).toBe(CLICK_ID);
    expect(p.get('subid')).toBe(CLICK_ID);
  });

  it('Impact link: uses `subId1`', () => {
    const out = buildTrackedDestinationUrl('https://example.impact.com/c/1', CLICK_ID, 'Impact');
    expect(params(out).get('subId1')).toBe(CLICK_ID);
  });

  it('unknown network: falls back to `sid` + `subid` carrying the click_id', () => {
    const out = buildTrackedDestinationUrl('https://partner.example.com/landing', CLICK_ID, null);
    const p = params(out);
    expect(p.get('sid')).toBe(CLICK_ID);
    expect(p.get('subid')).toBe(CLICK_ID);
  });

  it('preserves existing query params on the destination URL', () => {
    const out = buildTrackedDestinationUrl(
      'https://www.kqzyfj.com/click?aff=9&url=https%3A%2F%2Fsilvergoldbull.com%2Fstorage',
      CLICK_ID,
      'Silver Gold Bull',
    );
    const p = params(out);
    expect(p.get('aff')).toBe('9');
    expect(p.get('url')).toBe('https://silvergoldbull.com/storage');
    expect(p.get('sid')).toBe(CLICK_ID);
  });

  it('passes through UTM params when provided', () => {
    const out = buildTrackedDestinationUrl('https://partner.example.com/x', CLICK_ID, null, {
      utm_source: 'smartfinpro',
      utm_medium: 'review',
      utm_campaign: 'gold',
    });
    const p = params(out);
    expect(p.get('utm_source')).toBe('smartfinpro');
    expect(p.get('utm_medium')).toBe('review');
    expect(p.get('utm_campaign')).toBe('gold');
  });
});
