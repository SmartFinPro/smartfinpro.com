#!/usr/bin/env node
/**
 * scripts/smoke-test.mjs
 * Post-deploy smoke test — runs 15 critical URLs against the live site.
 *
 * Checks per URL:
 *   1. HTTP status === 200
 *   2. <link rel="canonical"> present + correct host
 *   3. <meta name="robots"> does NOT contain "noindex"
 *   4. <script type="application/ld+json"> (JSON-LD schema) present
 *   5. Title tag is non-empty
 *
 * Exit code 0 = all passed. Exit code 1 = at least one check failed.
 *
 * Usage:
 *   node scripts/smoke-test.mjs [BASE_URL]
 *   BASE_URL defaults to NEXT_PUBLIC_SITE_URL env var or https://smartfinpro.com
 *
 * Integrated into deploy.yml after Step 11 (Health Check):
 *   - name: Smoke Test
 *     run: node scripts/smoke-test.mjs ${{ secrets.NEXT_PUBLIC_SITE_URL }}
 *     continue-on-error: true
 */

const BASE_URL = process.argv[2] || process.env.NEXT_PUBLIC_SITE_URL || 'https://smartfinpro.com';

// Critical URLs: representative pages from every market, category, and page type
const CRITICAL_URLS = [
  // Market homepages
  '/us',
  '/uk',
  '/ca',
  '/au',
  // Category hub pages (pillar pages)
  '/us/trading',
  '/us/ai-tools',
  '/uk/personal-finance',
  '/au/superannuation',
  '/ca/forex',
  // Individual review pages (leaf pages) — most likely to break
  '/us/trading/etoro-review',
  '/uk/trading/etoro-review-uk',
  '/us/cybersecurity/nordvpn-review',
  // Tool pages
  '/tools/trading-cost-calculator',
  '/tools/broker-finder',
  // Static page
  '/affiliate-disclosure',
];

const TIMEOUT_MS = 15_000;

// ANSI color helpers
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

let passed = 0;
let failed = 0;
const failures = [];

async function fetchWithTimeout(url, ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'User-Agent': 'SmartFinPro-SmokeTest/1.0' },
    });
    clearTimeout(timer);
    return res;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

function checkCanonical(html, expectedPath) {
  const match = html.match(/<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']+)["']/i)
    || html.match(/<link[^>]+href=["']([^"']+)["'][^>]*rel=["']canonical["']/i);
  if (!match) return { ok: false, detail: 'Missing canonical tag' };
  const canonical = match[1];
  try {
    const parsedCanonical = new URL(canonical);
    const parsedBase = new URL(BASE_URL);

    // Must be HTTPS
    if (parsedCanonical.protocol !== 'https:') {
      return { ok: false, detail: `Canonical not HTTPS: ${canonical}` };
    }
    // Host must match the deployment base (no cross-domain canonicals)
    if (parsedCanonical.hostname !== parsedBase.hostname) {
      return { ok: false, detail: `Canonical host mismatch: got ${parsedCanonical.hostname}, want ${parsedBase.hostname}` };
    }
    // Path must match the expected path (no silent redirects to wrong page)
    // US market: /us prefix maps to / on the live site
    const normalizedExpected = expectedPath === '/us' ? '/' : expectedPath.replace(/^\/us\//, '/');
    const canonicalPath = parsedCanonical.pathname.replace(/\/$/, '') || '/';
    const expectedNorm = normalizedExpected.replace(/\/$/, '') || '/';
    if (canonicalPath !== expectedNorm) {
      return { ok: false, detail: `Canonical path mismatch: got ${canonicalPath}, want ${expectedNorm}` };
    }
    return { ok: true, detail: canonical };
  } catch {
    return { ok: false, detail: `Invalid canonical URL: ${canonical}` };
  }
}

function checkNoIndex(html) {
  const match = html.match(/<meta[^>]+name=["']robots["'][^>]*content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]*name=["']robots["']/i);
  if (!match) return { ok: true, detail: 'No robots meta (default = index)' };
  const content = match[1].toLowerCase();
  if (content.includes('noindex')) {
    return { ok: false, detail: `robots contains "noindex": ${match[1]}` };
  }
  return { ok: true, detail: match[1] };
}

function checkSchema(html) {
  return html.includes('application/ld+json')
    ? { ok: true, detail: 'JSON-LD found' }
    : { ok: false, detail: 'Missing JSON-LD schema' };
}

function checkTitle(html) {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (!match || !match[1].trim()) return { ok: false, detail: 'Missing or empty <title>' };
  return { ok: true, detail: match[1].trim().slice(0, 80) };
}

async function smokeTest(path) {
  const url = `${BASE_URL}${path}`;
  const checks = { status: null, canonical: null, noindex: null, schema: null, title: null };
  let allOk = true;
  let html = '';

  try {
    const res = await fetchWithTimeout(url, TIMEOUT_MS);
    checks.status = { ok: res.status === 200, detail: `HTTP ${res.status}` };

    if (res.status === 200) {
      html = await res.text();
      checks.canonical = checkCanonical(html, path);
      checks.noindex = checkNoIndex(html);
      checks.schema = checkSchema(html);
      checks.title = checkTitle(html);
    } else {
      // Non-200: mark all content checks as failed
      checks.canonical = { ok: false, detail: 'Skipped (non-200)' };
      checks.noindex = { ok: false, detail: 'Skipped (non-200)' };
      checks.schema = { ok: false, detail: 'Skipped (non-200)' };
      checks.title = { ok: false, detail: 'Skipped (non-200)' };
    }
  } catch (err) {
    const msg = err.name === 'AbortError' ? `Timeout after ${TIMEOUT_MS}ms` : String(err.message || err);
    checks.status = { ok: false, detail: msg };
    checks.canonical = checks.noindex = checks.schema = checks.title = { ok: false, detail: 'Skipped (fetch error)' };
  }

  // Determine overall pass/fail
  const checkResults = Object.values(checks);
  allOk = checkResults.every((c) => c.ok);

  if (allOk) {
    passed++;
    console.log(`${GREEN}✅ PASS${RESET} ${path}`);
    console.log(`       Status: ${checks.status.detail} | Title: ${checks.title.detail}`);
  } else {
    failed++;
    const failedChecks = Object.entries(checks)
      .filter(([, v]) => !v.ok)
      .map(([k, v]) => `${k}=${v.detail}`)
      .join(' | ');
    console.log(`${RED}❌ FAIL${RESET} ${path}`);
    console.log(`       ${RED}${failedChecks}${RESET}`);
    failures.push({ path, failedChecks });
  }

  return allOk;
}

async function run() {
  console.log(`\n${BOLD}🔥 SmartFinPro Post-Deploy Smoke Test${RESET}`);
  console.log(`   Target: ${BOLD}${BASE_URL}${RESET}`);
  console.log(`   URLs:   ${CRITICAL_URLS.length} critical pages`);
  console.log(`   Timeout: ${TIMEOUT_MS}ms per request\n`);
  console.log('─'.repeat(60));

  // Run all tests (sequential to avoid hammering the server on deploy)
  for (const path of CRITICAL_URLS) {
    await smokeTest(path);
  }

  console.log('─'.repeat(60));
  console.log(`\n${BOLD}Results:${RESET} ${GREEN}${passed} passed${RESET} / ${failed > 0 ? RED : GREEN}${failed} failed${RESET} / ${CRITICAL_URLS.length} total\n`);

  if (failures.length > 0) {
    console.log(`${RED}${BOLD}Failed URLs:${RESET}`);
    for (const f of failures) {
      console.log(`  ${RED}→${RESET} ${f.path}`);
      console.log(`    ${f.failedChecks}`);
    }
    console.log('');
    process.exit(1);
  }

  console.log(`${GREEN}${BOLD}All smoke tests passed! ✅${RESET}\n`);
  process.exit(0);
}

run().catch((err) => {
  console.error(`${RED}[smoke-test] Fatal error:${RESET}`, err);
  process.exit(1);
});
