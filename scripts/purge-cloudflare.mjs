#!/usr/bin/env node
// scripts/purge-cloudflare.mjs
//
// Purges the Cloudflare cache for SmartFinPro after a deploy (or on demand).
//
// Why this exists:
//   On 2026-04-11 the homepage went down for ~7h because Cloudflare had cached
//   a Cloudways "One moment, please…" loading page (origin had hiccupped, CF
//   stored the error response with age=24863s). The site itself was healthy —
//   only the edge cache was poisoned. Purging via the dashboard fixed it
//   instantly. This script automates that purge so it never happens again.
//
// Usage:
//   node scripts/purge-cloudflare.mjs                  # purges critical URLs
//   node scripts/purge-cloudflare.mjs --everything     # purges entire zone
//   node scripts/purge-cloudflare.mjs https://x https://y   # purges specific URLs
//
// Required env:
//   CLOUDFLARE_API_TOKEN   – token with Zone.Cache Purge permission
//   CLOUDFLARE_ZONE_ID     – zone id of smartfinpro.com
//
// Exit codes:
//   0 – success
//   1 – missing env / API error
//   2 – Cloudflare returned success=false

const TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const ZONE  = process.env.CLOUDFLARE_ZONE_ID;

if (!TOKEN || !ZONE) {
  console.error('❌ CLOUDFLARE_API_TOKEN and CLOUDFLARE_ZONE_ID must be set');
  process.exit(1);
}

// Critical URLs that MUST be fresh after every deploy.
// Keep this short — purging too many URLs at once can cause origin load spikes.
// All four market homepages + sitemap + robots are the bare minimum.
const DEFAULT_URLS = [
  'https://smartfinpro.com/',
  'https://smartfinpro.com',
  'https://smartfinpro.com/us',   // redirects to / — purge prevents stale 200 cache
  'https://smartfinpro.com/uk/',
  'https://smartfinpro.com/uk',
  'https://smartfinpro.com/ca/',
  'https://smartfinpro.com/ca',
  'https://smartfinpro.com/au/',
  'https://smartfinpro.com/au',
  'https://smartfinpro.com/sitemap.xml',
  'https://smartfinpro.com/robots.txt',
  'https://smartfinpro.com/.well-known/security.txt',
];

const args = process.argv.slice(2);
const purgeEverything = args.includes('--everything');
const customUrls = args.filter((a) => a.startsWith('http'));

const body = purgeEverything
  ? { purge_everything: true }
  : { files: customUrls.length > 0 ? customUrls : DEFAULT_URLS };

const endpoint = `https://api.cloudflare.com/client/v4/zones/${ZONE}/purge_cache`;

console.log(`🌥  Cloudflare cache purge`);
console.log(`   Zone:   ${ZONE.slice(0, 8)}…`);
console.log(`   Mode:   ${purgeEverything ? 'EVERYTHING' : `${body.files.length} URLs`}`);
if (!purgeEverything) {
  body.files.forEach((u) => console.log(`     • ${u}`));
}

let res;
try {
  res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
} catch (err) {
  console.error(`❌ Network error: ${err.message}`);
  process.exit(1);
}

const json = await res.json().catch(() => ({}));

if (!res.ok || !json.success) {
  console.error(`❌ Purge failed (HTTP ${res.status})`);
  if (json.errors?.length) {
    json.errors.forEach((e) => console.error(`   • [${e.code}] ${e.message}`));
  } else {
    console.error(`   ${JSON.stringify(json)}`);
  }
  process.exit(2);
}

console.log(`✅ Purge successful (id: ${json.result?.id ?? 'n/a'})`);
