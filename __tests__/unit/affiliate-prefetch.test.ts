// __tests__/unit/affiliate-prefetch.test.ts
// Layer 2 of the phantom-click fix: the speculative-request guard.
//
// Production measurement (2026-07-20): 205 of 2209 rows in `link_clicks` had a
// shape no human can produce — 2+ different affiliate slugs from one IP within
// 5 s, referred by the page that renders exactly those links. Next's router had
// prefetched every `<Link href="/go/[slug]">`, so a page VIEW recorded a click
// and pinged the affiliate network.
//
// `speculativeRequestReason()` decides whether a request to /go/[slug] was made
// by a machine looking ahead rather than by a person clicking. It must be
// strict enough to catch every speculative form, and conservative enough that a
// real click is NEVER dropped — a false positive here costs revenue.

import { describe, it, expect } from 'vitest';
import { affiliatePrefetch, speculativeRequestReason } from '@/lib/affiliate/prefetch';

const GO_URL = 'https://smartfinpro.com/go/etoro';

function req(headers: Record<string, string>, url: string = GO_URL): Request {
  return new Request(url, { headers });
}

/** Headers a real Chrome sends for a top-level navigation (i.e. a click). */
const REAL_CLICK_HEADERS = {
  'user-agent': 'Mozilla/5.0 (Macintosh) AppleWebKit/537.36 Chrome/126.0 Safari/537.36',
  'sec-fetch-dest': 'document',
  'sec-fetch-mode': 'navigate',
  'sec-fetch-site': 'same-origin',
  'sec-fetch-user': '?1',
};

describe('speculativeRequestReason — speculative traffic is recognised', () => {
  it('flags a Next.js router prefetch', () => {
    expect(speculativeRequestReason(req({ 'next-router-prefetch': '1' }))).toBe('next-router-prefetch');
  });

  it('flags an RSC payload request by header', () => {
    expect(speculativeRequestReason(req({ rsc: '1' }))).toBe('rsc-payload');
  });

  it('flags an RSC payload request by _rsc query param', () => {
    expect(speculativeRequestReason(req({}, `${GO_URL}?_rsc=1abcd`))).toBe('rsc-payload');
  });

  it('flags Chrome speculation-rules prefetch via Sec-Purpose', () => {
    expect(speculativeRequestReason(req({ 'sec-purpose': 'prefetch;prerender' }))).toBe('purpose-prefetch');
  });

  it('flags the legacy Purpose: prefetch header', () => {
    expect(speculativeRequestReason(req({ purpose: 'prefetch' }))).toBe('purpose-prefetch');
  });

  it('flags Firefox link prefetching via X-Moz', () => {
    expect(speculativeRequestReason(req({ 'x-moz': 'prefetch' }))).toBe('purpose-prefetch');
  });

  it('flags a background fetch that is not a top-level navigation', () => {
    expect(
      speculativeRequestReason(req({ 'sec-fetch-dest': 'empty', 'sec-fetch-mode': 'cors' })),
    ).toBe('not-a-navigation');
  });

  it('matches header values case-insensitively', () => {
    expect(speculativeRequestReason(req({ 'sec-purpose': 'PREFETCH' }))).toBe('purpose-prefetch');
  });
});

describe('speculativeRequestReason — real clicks are never dropped', () => {
  it('allows a same-tab navigation', () => {
    expect(speculativeRequestReason(req(REAL_CLICK_HEADERS))).toBeNull();
  });

  it('allows a new-tab navigation (target="_blank" sends no Sec-Fetch-User)', () => {
    const { 'sec-fetch-user': _omitted, ...newTab } = REAL_CLICK_HEADERS;
    expect(speculativeRequestReason(req(newTab))).toBeNull();
  });

  it('allows a script-initiated navigation (window.open / location.href)', () => {
    expect(
      speculativeRequestReason(
        req({ ...REAL_CLICK_HEADERS, 'sec-fetch-site': 'none', 'sec-fetch-user': '' }),
      ),
    ).toBeNull();
  });

  it('allows browsers too old to send any Sec-Fetch-* header', () => {
    expect(speculativeRequestReason(req({ 'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0)' }))).toBeNull();
  });

  it('does not read a legitimate query string as an RSC payload request', () => {
    expect(speculativeRequestReason(req(REAL_CLICK_HEADERS, `${GO_URL}?utm_source=newsletter`))).toBeNull();
  });
});

describe('affiliatePrefetch — the <Link prefetch> value for a CTA href', () => {
  it('disables prefetch for an affiliate redirect', () => {
    expect(affiliatePrefetch('/go/etoro')).toBe(false);
  });

  it('disables prefetch for a trailing-slash affiliate redirect', () => {
    expect(affiliatePrefetch('/go/etoro/')).toBe(false);
  });

  it('leaves editorial links alone so they keep prefetching', () => {
    expect(affiliatePrefetch('/us/trading/etoro-review')).toBeUndefined();
  });

  it('leaves an external provider link alone', () => {
    expect(affiliatePrefetch('https://www.mercury.com/')).toBeUndefined();
  });

  it('treats a missing href as non-affiliate rather than throwing', () => {
    expect(affiliatePrefetch(undefined)).toBeUndefined();
  });
});
