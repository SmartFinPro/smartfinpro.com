#!/usr/bin/env node
/**
 * scripts/smoke-test.mjs
 * Post-deploy smoke test — runs 15 critical URLs against the live site.
 *
 * Two check tiers:
 *   FULL  — status + canonical (host+path) + noindex + JSON-LD schema + title
 *   BASIC — status + noindex + title only
 *           (used for tool pages without generateMetadata canonical,
 *            and pages that may hit Cloudflare bot checks on certain keywords)
 *
 * Exit code 0 = all checks passed. Exit code 1 = at least one failure.
 *
 * Usage:
 *   node scripts/smoke-test.mjs [BASE_URL]
 *   BASE_URL defaults to NEXT_PUBLIC_SITE_URL env var or https://smartfinpro.com
 *
 * Integrated into deploy.yml as Step 11b (gates rollback on failure).
 */

const BASE_URL = (process.argv[2] || process.env.NEXT_PUBLIC_SITE_URL || 'https://smartfinpro.com')
  .replace(/\/$/, '');

// ── URL list ─────────────────────────────────────────────────────────────────
// tier: 'full'  → all 5 checks
// tier: 'basic' → status + noindex + title only (no canonical/schema required)
const CRITICAL_URLS = [
  // Market homepages
  { path: '/us',  tier: 'full' },
  { path: '/uk',  tier: 'full' },
  { path: '/ca',  tier: 'full' },
  { path: '/au',  tier: 'full' },

  // Category hub / pillar pages
  // Note: '/us/trading' is basic over CDN (Cloudflare may JS-challenge "trading" keyword
  // from GH Actions IPs). The origin smoke test (Step 11c) runs FULL checks via SSH→localhost.
  { path: '/us/trading',          tier: 'basic' },
  { path: '/us/ai-tools',         tier: 'full'  },
  { path: '/uk/personal-finance', tier: 'full'  },
  { path: '/au/superannuation',   tier: 'full'  },
  { path: '/ca/forex',            tier: 'full'  },

  // Individual review pages (leaf pages — most likely to break on bad deploy)
  { path: '/us/trading/etoro-review',         tier: 'full' },
  // UK eToro review: slug is 'etoro-review' (not 'etoro-review-uk').
  // The -uk suffix is used inconsistently (nordvpn, marcus) but not for eToro.
  { path: '/uk/trading/etoro-review',         tier: 'full' },
  { path: '/us/cybersecurity/nordvpn-review', tier: 'full' },

  // Tool pages — no canonical tag by design (no generateMetadata canonical set)
  { path: '/tools/trading-cost-calculator', tier: 'basic' },
  { path: '/tools/broker-finder',           tier: 'basic' },

  // Static / legal pages — no JSON-LD by design
  { path: '/affiliate-disclosure', tier: 'basic' },
];

const TIMEOUT_MS = 15_000;

// ANSI helpers
const GREEN  = '\x1b[32m';
const RED    = '\x1b[31m';
const YELLOW = '\x1b[33m';
const RESET  = '\x1b[0m';
const BOLD   = '\x1b[1m';

let passed = 0;
let failed = 0;
const failures = [];

// ── Fetch ─────────────────────────────────────────────────────────────────────
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

// ── Checks ────────────────────────────────────────────────────────────────────

/**
 * Canonical check: verifies HTTPS + correct hostname + path matches request path.
 * The live site uses symmetric /{market}/... routing for all markets (including US).
 * No market-prefix normalization — canonical must match the requested path exactly.
 */
function checkCanonical(html, expectedPath) {
  const match =
    html.match(/<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']+)["']/i) ||
    html.match(/<link[^>]+href=["']([^"']+)["'][^>]*rel=["']canonical["']/i);
  if (!match) return { ok: false, detail: 'Missing canonical tag' };

  const canonical = match[1];
  try {
    const parsedCanonical = new URL(canonical);
    const parsedBase      = new URL(BASE_URL);

    // 1. Must be HTTPS
    if (parsedCanonical.protocol !== 'https:') {
      return { ok: false, detail: `Canonical not HTTPS: ${canonical}` };
    }
    // 2. Host must match deployment target (no accidental cross-domain canonicals)
    if (parsedCanonical.hostname !== parsedBase.hostname) {
      return {
        ok: false,
        detail: `Canonical host mismatch: got ${parsedCanonical.hostname}, want ${parsedBase.hostname}`,
      };
    }
    // 3. Path must match the tested path exactly (catches silent wrong-page canonicals)
    const canonicalPath = parsedCanonical.pathname.replace(/\/$/, '') || '/';
    const expectedNorm  = expectedPath.replace(/\/$/, '') || '/';
    if (canonicalPath !== expectedNorm) {
      return {
        ok: false,
        detail: `Canonical path mismatch: got ${canonicalPath}, want ${expectedNorm}`,
      };
    }
    return { ok: true, detail: canonical };
  } catch {
    return { ok: false, detail: `Invalid canonical URL: ${canonical}` };
  }
}

function checkNoIndex(html) {
  const match =
    html.match(/<meta[^>]+name=["']robots["'][^>]*content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]*name=["']robots["']/i);
  if (!match) return { ok: true, detail: 'No robots meta (default = index)' };
  const content = match[1].toLowerCase();
  if (content.includes('noindex')) {
    return { ok: false, detail: `robots contains "noindex": ${match[1]}` };
  }
  return { ok: true, detail: match[1] };
}

function checkSchema(html) {
  return html.includes('application/ld+json')
    ? { ok: true,  detail: 'JSON-LD found' }
    : { ok: false, detail: 'Missing JSON-LD schema' };
}

function checkTitle(html) {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (!match || !match[1].trim()) return { ok: false, detail: 'Missing or empty <title>' };
  return { ok: true, detail: match[1].trim().slice(0, 80) };
}

// ── Runner ───────────────────────────────────────────────────────────────────
async function smokeTest({ path, tier }) {
  const url = `${BASE_URL}${path}`;
  let html  = '';

  // Build active check map based on tier
  const checks = {
    status:    null,
    ...(tier === 'full' ? { canonical: null } : {}),
    noindex:   null,
    ...(tier === 'full' ? { schema: null }    : {}),
    title:     null,
  };

  try {
    const res = await fetchWithTimeout(url, TIMEOUT_MS);
    checks.status = { ok: res.status === 200, detail: `HTTP ${res.status}` };

    if (res.status === 200) {
      html = await res.text();
      if (tier === 'full') {
        checks.canonical = checkCanonical(html, path);
        checks.schema    = checkSchema(html);
      }
      checks.noindex = checkNoIndex(html);
      checks.title   = checkTitle(html);
    } else {
      // Non-200: mark all content checks failed
      if (tier === 'full') {
        checks.canonical = { ok: false, detail: 'Skipped (non-200)' };
        checks.schema    = { ok: false, detail: 'Skipped (non-200)' };
      }
      checks.noindex = { ok: false, detail: 'Skipped (non-200)' };
      checks.title   = { ok: false, detail: 'Skipped (non-200)' };
    }
  } catch (err) {
    const msg = err.name === 'AbortError'
      ? `Timeout after ${TIMEOUT_MS}ms`
      : String(err.message || err);
    checks.status = { ok: false, detail: msg };
    const skipped = { ok: false, detail: 'Skipped (fetch error)' };
    if (tier === 'full') { checks.canonical = skipped; checks.schema = skipped; }
    checks.noindex = skipped;
    checks.title   = skipped;
  }

  const allOk = Object.values(checks).every((c) => c.ok);
  const tierLabel = tier === 'basic' ? ` ${YELLOW}[basic]${RESET}` : '';

  if (allOk) {
    passed++;
    console.log(`${GREEN}✅ PASS${RESET}${tierLabel} ${path}`);
    console.log(`       Status: ${checks.status.detail} | Title: ${checks.title.detail}`);
  } else {
    failed++;
    const failedChecks = Object.entries(checks)
      .filter(([, v]) => !v.ok)
      .map(([k, v]) => `${k}=${v.detail}`)
      .join(' | ');
    console.log(`${RED}❌ FAIL${RESET}${tierLabel} ${path}`);
    console.log(`       ${RED}${failedChecks}${RESET}`);
    failures.push({ path, tier, failedChecks });
  }

  return allOk;
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function run() {
  const fullCount  = CRITICAL_URLS.filter((u) => u.tier === 'full').length;
  const basicCount = CRITICAL_URLS.filter((u) => u.tier === 'basic').length;

  console.log(`\n${BOLD}🔥 SmartFinPro Post-Deploy Smoke Test${RESET}`);
  console.log(`   Target:  ${BOLD}${BASE_URL}${RESET}`);
  console.log(`   URLs:    ${CRITICAL_URLS.length} pages (${fullCount} full · ${basicCount} basic)`);
  console.log(`   Timeout: ${TIMEOUT_MS}ms per request\n`);
  console.log('─'.repeat(60));

  // Sequential — avoids hammering the server immediately post-deploy
  for (const entry of CRITICAL_URLS) {
    await smokeTest(entry);
  }

  console.log('─'.repeat(60));
  console.log(
    `\n${BOLD}Results:${RESET} ${GREEN}${passed} passed${RESET} / ` +
    `${failed > 0 ? RED : GREEN}${failed} failed${RESET} / ${CRITICAL_URLS.length} total\n`
  );

  if (failures.length > 0) {
    console.log(`${RED}${BOLD}Failed URLs:${RESET}`);
    for (const f of failures) {
      console.log(`  ${RED}→${RESET} ${f.path} [${f.tier}]`);
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
