// __tests__/unit/bot-detect.test.ts
// Analytics-side bot UA gate (lib/analytics/bot-detect.ts) — standalone list,
// deliberately independent from the /go affiliate fraud path.

import { describe, it, expect } from 'vitest';
import { isBotUserAgent } from '@/lib/analytics/bot-detect';

describe('isBotUserAgent()', () => {
  it.each([
    'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
    'Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/120.0.0.0 Safari/537.36',
    'python-requests/2.31.0',
    'curl/8.4.0',
    'Wget/1.21.4',
    'axios/1.6.0',
    'Scrapy/2.11.0 (+https://scrapy.org)',
    'facebookexternalhit/1.1',
  ])('flags bot UA: %s', (ua) => {
    expect(isBotUserAgent(ua)).toBe(true);
  });

  it.each([
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0',
  ])('passes real browser UA: %s', (ua) => {
    expect(isBotUserAgent(ua)).toBe(false);
  });

  it('treats empty / missing UA as bot', () => {
    expect(isBotUserAgent('')).toBe(true);
    expect(isBotUserAgent('   ')).toBe(true);
    expect(isBotUserAgent(null)).toBe(true);
    expect(isBotUserAgent(undefined)).toBe(true);
  });
});
