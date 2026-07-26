// __tests__/unit/client-cookies.test.ts
// Tests the client-side cookie helpers in lib/utils/cookies.ts
// (extracted from components/marketing/geo-suggest-banner.tsx).
//
// Vitest runs in a node environment, so `document` is stubbed with a
// minimal jar that records writes — the assertions target the exact
// cookie string handed to the browser, which is the contract under test.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getCookie, setCookie } from '@/lib/utils/cookies';

let jar: string;
let writes: string[];

beforeEach(() => {
  jar = '';
  writes = [];
  (globalThis as { document?: unknown }).document = {
    get cookie() {
      return jar;
    },
    set cookie(value: string) {
      writes.push(value);
    },
  };
});

afterEach(() => {
  delete (globalThis as { document?: unknown }).document;
});

describe('setCookie', () => {
  it('persists via max-age in seconds (days × 86 400), not via expires', () => {
    setCookie('sfp-geo-dismissed', '1', 14);

    expect(writes).toHaveLength(1);
    expect(writes[0]).toBe('sfp-geo-dismissed=1; max-age=1209600; path=/; SameSite=Lax');
  });

  it('never emits an expires attribute', () => {
    setCookie('sfp-market-pref', 'au', 30);

    expect(writes[0]).toContain('max-age=2592000');
    expect(writes[0]).not.toMatch(/expires/i);
  });
});

describe('getCookie', () => {
  it('returns the value of the named cookie among several', () => {
    jar = 'sfp-geo=uk; sfp-market-pref=au; other=x';

    expect(getCookie('sfp-market-pref')).toBe('au');
  });

  it('returns null when the cookie is missing', () => {
    jar = 'sfp-geo=uk';

    expect(getCookie('sfp-geo-dismissed')).toBeNull();
  });

  it('returns null on the server (document undefined)', () => {
    delete (globalThis as { document?: unknown }).document;

    expect(getCookie('sfp-geo')).toBeNull();
  });
});
