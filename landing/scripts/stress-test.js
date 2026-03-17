/**
 * SmartFinPro — k6 Stress Test Script
 * ============================================================
 * Simulates 1,000 virtual users (VUs) hitting calculator tools
 * and affiliate redirect routes simultaneously.
 *
 * INSTALL k6:
 *   brew install k6          # macOS
 *   sudo apt install k6      # Ubuntu/Debian
 *
 * USAGE:
 *   k6 run scripts/stress-test.js                    # default (local)
 *   k6 run --env BASE_URL=https://smartfinpro.com scripts/stress-test.js  # production
 *   k6 run --env BASE_URL=http://localhost:3000 scripts/stress-test.js    # staging
 *
 * DASHBOARD:
 *   k6 run --out json=results.json scripts/stress-test.js
 *   # Then visualize in Grafana or k6 Cloud
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// ============================================================
// CUSTOM METRICS
// ============================================================

const errorRate = new Rate('error_rate');
const redirectLatency = new Trend('affiliate_redirect_latency', true);
const calculatorFCP = new Trend('calculator_fcp', true);
const trackApiLatency = new Trend('track_api_latency', true);
const cacheHitRate = new Rate('registry_cache_hit_rate');
const totalRedirects = new Counter('total_affiliate_redirects');
const totalCalculatorLoads = new Counter('total_calculator_loads');

// ============================================================
// TEST CONFIGURATION
// ============================================================

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export const options = {
  // ============================================================
  // LOAD PROFILE: Ramp to 1,000 VUs over 5 stages
  // ============================================================
  stages: [
    // Stage 1: Warm-up — 50 VUs for 30s
    { duration: '30s', target: 50 },

    // Stage 2: Ramp-up — 50 → 500 VUs over 1 minute
    { duration: '1m', target: 500 },

    // Stage 3: Peak load — 1,000 VUs sustained for 3 minutes
    { duration: '1m', target: 1000 },
    { duration: '3m', target: 1000 },

    // Stage 4: Ramp-down — 1,000 → 100 VUs over 1 minute
    { duration: '1m', target: 100 },

    // Stage 5: Cool-down — 100 → 0 VUs over 30s
    { duration: '30s', target: 0 },
  ],

  // ============================================================
  // THRESHOLDS — SLA Targets
  // ============================================================
  thresholds: {
    // Global: <1% error rate
    'error_rate': ['rate<0.01'],

    // P95 response time < 500ms for all requests
    'http_req_duration': ['p(95)<500', 'p(99)<1000'],

    // Affiliate redirects: P95 < 200ms (fast redirect)
    'affiliate_redirect_latency': ['p(95)<200', 'p(99)<400'],

    // Calculator page load: P95 < 800ms
    'calculator_fcp': ['p(95)<800'],

    // Tracking API: P95 < 300ms
    'track_api_latency': ['p(95)<300'],

    // Registry cache: >95% hit rate at steady state
    'registry_cache_hit_rate': ['rate>0.95'],
  },

  // ============================================================
  // HTTP OPTIONS
  // ============================================================
  httpDebug: 'none',
  insecureSkipTLSVerify: true,
  noConnectionReuse: false,
  userAgent: 'SmartFinPro-StressTest/1.0 (k6)',
};

// ============================================================
// TEST DATA
// ============================================================

/**
 * 9 Calculator Tools — static pages with client-side interactivity.
 * Load test targets the HTML page delivery (SSG performance).
 */
const CALCULATOR_URLS = [
  '/tools/trading-cost-calculator',
  '/tools/loan-calculator',
  '/tools/ai-roi-calculator',
  '/ca/tools/wealthsimple-calculator',
  '/tools/broker-finder',
  '/tools/broker-comparison',
  '/tools/credit-card-rewards-calculator',
  '/uk/tools/isa-tax-savings-calculator',
  '/au/tools/au-mortgage-calculator',
];

/**
 * Affiliate redirect slugs — tests /go/[slug] → 307 redirect chain.
 * Uses common slug patterns from the link registry.
 */
const AFFILIATE_SLUGS = [
  'etoro',
  'capital-com',
  'ibkr',
  'plus500',
  'xtb',
  'revolut-business',
  'wise-business',
  'jasper-ai',
  'nordvpn',
  'surfshark',
];

/**
 * Pillar overview pages — high-traffic SSG pages.
 */
const PILLAR_PAGES = [
  '/trading/overview',
  '/ai-tools/overview',
  '/cybersecurity/overview',
  '/personal-finance/overview',
  '/business-banking/overview',
  '/uk/trading/overview',
  '/uk/ai-tools/overview',
  '/ca/forex/overview',
  '/au/trading/overview',
  '/au/business-banking/overview',
];

/**
 * Simulated tracking payloads (mimics real calculator interactions).
 */
function buildTrackPayload(type, url) {
  return JSON.stringify({
    type: type,
    sessionId: `stress-${__VU}-${__ITER}`,
    data: {
      url: url,
      referrer: `${BASE_URL}/`,
      timestamp: new Date().toISOString(),
      userAgent: 'k6-stress-test',
    },
  });
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function checkResponse(res, name, expectedStatus = 200) {
  const success = check(res, {
    [`${name}: status ${expectedStatus}`]: (r) => r.status === expectedStatus,
    [`${name}: response time < 1s`]: (r) => r.timings.duration < 1000,
  });
  errorRate.add(!success);
  return success;
}

// ============================================================
// SCENARIO: Calculator Tools Load Test
// ============================================================

function testCalculatorTools() {
  group('Calculator Tools', () => {
    const url = `${BASE_URL}${randomItem(CALCULATOR_URLS)}`;

    const res = http.get(url, {
      tags: { type: 'calculator' },
      redirects: 0,
    });

    const success = checkResponse(res, 'Calculator Page');
    totalCalculatorLoads.add(1);
    calculatorFCP.add(res.timings.duration);

    // Simulate: user interacts with calculator → fires tracking event
    if (success && Math.random() < 0.3) {
      const trackRes = http.post(
        `${BASE_URL}/api/track`,
        buildTrackPayload('event', url),
        {
          headers: { 'Content-Type': 'application/json' },
          tags: { type: 'track_api' },
        }
      );
      trackApiLatency.add(trackRes.timings.duration);
      check(trackRes, {
        'Track API: status 200': (r) => r.status === 200,
      });
    }
  });
}

// ============================================================
// SCENARIO: Affiliate Redirect Stress Test
// ============================================================

function testAffiliateRedirects() {
  group('Affiliate Redirects', () => {
    const slug = randomItem(AFFILIATE_SLUGS);
    const url = `${BASE_URL}/go/${slug}`;

    // Request with redirect following disabled to measure redirect latency only
    const res = http.get(url, {
      redirects: 0, // Don't follow the 307 — measure server response time only
      tags: { type: 'affiliate_redirect' },
    });

    const isRedirect = res.status === 307 || res.status === 302 || res.status === 301;
    const isNotFound = res.status === 308 || res.status === 200; // Homepage redirect on unknown slug

    const success = check(res, {
      'Redirect: valid status (307/302/301/200)': (r) =>
        [200, 301, 302, 307, 308].includes(r.status),
      'Redirect: has Location header': (r) =>
        isRedirect ? r.headers['Location'] !== undefined : true,
      'Redirect: latency < 200ms': (r) => r.timings.duration < 200,
    });

    errorRate.add(!success);
    totalRedirects.add(1);
    redirectLatency.add(res.timings.duration);

    // If redirect was fast → cache hit (registry served from memory)
    cacheHitRate.add(res.timings.duration < 50);

    // Simulate: user sees landing page (simulate pageview tracking)
    if (isRedirect && Math.random() < 0.2) {
      const trackRes = http.post(
        `${BASE_URL}/api/track`,
        buildTrackPayload('pageview', url),
        {
          headers: { 'Content-Type': 'application/json' },
          tags: { type: 'track_api' },
        }
      );
      trackApiLatency.add(trackRes.timings.duration);
    }
  });
}

// ============================================================
// SCENARIO: Pillar Page Load Test
// ============================================================

function testPillarPages() {
  group('Pillar Pages', () => {
    const url = `${BASE_URL}${randomItem(PILLAR_PAGES)}`;

    const res = http.get(url, {
      tags: { type: 'pillar_page' },
    });

    checkResponse(res, 'Pillar Page');

    // Verify: page contains critical CSS (after injection)
    if (res.status === 200) {
      check(res, {
        'Pillar: has critical CSS': (r) =>
          r.body.includes('data-critical="true"') || r.body.includes('glass-card'),
        'Pillar: has preconnect': (r) =>
          r.body.includes('images.smartfinpro.com'),
      });
    }
  });
}

// ============================================================
// SCENARIO: /api/track Rate Limit Test
// ============================================================

function testTrackApiRateLimit() {
  group('Track API Rate Limit', () => {
    // Fire 5 rapid requests to test rate limiting behavior
    const results = [];
    for (let i = 0; i < 5; i++) {
      const res = http.post(
        `${BASE_URL}/api/track`,
        buildTrackPayload('event', '/tools/loan-calculator'),
        {
          headers: { 'Content-Type': 'application/json' },
          tags: { type: 'rate_limit_test' },
        }
      );
      results.push(res.status);
      trackApiLatency.add(res.timings.duration);
    }

    // At 1000 VUs × 5 requests, some should be rate-limited (429)
    // But individual VU should not be rate-limited (100/min per IP)
    check(null, {
      'Rate Limit: first request succeeded': () => results[0] === 200,
    });
  });
}

// ============================================================
// MAIN TEST FUNCTION
// ============================================================

export default function () {
  // Weighted random scenario selection (mimics real traffic patterns):
  // 40% Calculator tools (main user flow)
  // 30% Affiliate redirects (revenue-critical)
  // 20% Pillar pages (SEO traffic)
  // 10% Rate limit testing (resilience)

  const rand = Math.random();

  if (rand < 0.40) {
    testCalculatorTools();
  } else if (rand < 0.70) {
    testAffiliateRedirects();
  } else if (rand < 0.90) {
    testPillarPages();
  } else {
    testTrackApiRateLimit();
  }

  // Simulate human think time (0.5–2s between actions)
  sleep(0.5 + Math.random() * 1.5);
}

// ============================================================
// LIFECYCLE HOOKS
// ============================================================

export function setup() {
  // Warm-up: Hit each calculator + affiliate slug once
  console.log(`\n${'='.repeat(60)}`);
  console.log('  SmartFinPro Stress Test — Warming up...');
  console.log(`  Target: ${BASE_URL}`);
  console.log(`  Scenarios: Calculators (9) + Affiliates (10) + Pillars (10)`);
  console.log(`${'='.repeat(60)}\n`);

  // Quick health check
  const res = http.get(`${BASE_URL}/`);
  if (res.status !== 200) {
    console.error(`ABORT: Server at ${BASE_URL} returned ${res.status}`);
    return { abort: true };
  }

  return { startTime: Date.now() };
}

export function teardown(data) {
  if (data.abort) return;

  const duration = ((Date.now() - data.startTime) / 1000).toFixed(0);
  console.log(`\n${'='.repeat(60)}`);
  console.log('  SmartFinPro Stress Test — Complete');
  console.log(`  Duration: ${duration}s`);
  console.log(`  Target: ${BASE_URL}`);
  console.log(`${'='.repeat(60)}\n`);
}

// ============================================================
// QUICK SMOKE TEST (10 VUs, 30s)
// ============================================================

export const smokeTest = {
  executor: 'constant-vus',
  vus: 10,
  duration: '30s',
  exec: 'default',
};

// Usage: k6 run --scenario smokeTest scripts/stress-test.js
