#!/usr/bin/env node
// scripts/research/measure-route-js.mjs
// research-discovery-pr3 plan, Task 4 Step 3 — the honest JS-payload half of
// the release gate (spec §16 "Performance": Homepage-JavaScript-Delta
// höchstens 25 KB gzip). Fetches ONE already-running production URL (this
// script never builds or serves anything itself — `npm run build` +
// `next start` are the caller's job, so base and head are measured against
// their OWN real `.next/static` output, never a shared/stale one), extracts
// every unique local `<script src="/_next/static/...js">` reference from the
// raw server HTML, resolves each to its file under `.next/static`, and sums
// `gzipSync` byte lengths — the same compression Cloudflare/the CDN actually
// applies, not a raw-bytes proxy.
//
// Deliberately narrow: this is NOT a general bundle analyzer. It only counts
// scripts the SERVER ITSELF references in the initial HTML response for one
// route — precisely the "first-load JS" the DoD's 25 KB budget is about.
// Deferred/lazy chunks a route never references in its own HTML are outside
// this scope by construction (a crawler/first paint never pays for them
// either).
//
// SAFETY: a remote script host (any src that isn't a same-origin
// `/_next/static/...js` path) or a resolved chunk missing on disk is a HARD
// FAILURE (non-zero exit) — either would silently produce a wrong, and
// artificially LOW, number. A budget gate that can be silently gamed by a
// missing file is worse than no gate.
//
// Usage:
//   node scripts/research/measure-route-js.mjs <url> [--next-dir <path>]
//
//   node scripts/research/measure-route-js.mjs http://127.0.0.1:3012/
//   node scripts/research/measure-route-js.mjs http://127.0.0.1:3013/research \
//     --next-dir /path/to/other-worktree/.next
//
// Prints one JSON object to stdout: { url, chunks: string[] (sorted),
// rawBytes, gzipBytes }. `chunks` are the local pathnames only (e.g.
// "/_next/static/chunks/1234.js"), sorted for a stable, diffable report.

import { readFileSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join, normalize, sep } from 'node:path';

function fail(message) {
  console.error(`measure-route-js: ${message}`);
  process.exit(1);
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const url = args[0];
  if (!url) fail('missing required <url> argument');

  let nextDir = join(process.cwd(), '.next');
  for (let i = 1; i < args.length; i += 1) {
    if (args[i] === '--next-dir') {
      const value = args[i + 1];
      if (!value) fail('--next-dir requires a value');
      nextDir = value;
      i += 1;
    } else {
      fail(`unrecognized argument: ${args[i]}`);
    }
  }
  return { url, nextDir };
}

/** Every unique same-origin `/_next/static/...js` script src referenced in
 *  `html`, in first-seen order. Absolute (`https://host/_next/...`) or
 *  protocol-relative (`//host/_next/...`) srcs are returned AS-IS (untouched
 *  path text) so the remote-host rejection below can still catch them —
 *  normalizing them away here would hide the exact failure mode this script
 *  exists to catch. */
function extractScriptSrcs(html) {
  const srcs = new Set();
  const scriptTagPattern = /<script[^>]*\bsrc=(["'])(.*?)\1[^>]*>/gi;
  let match;
  while ((match = scriptTagPattern.exec(html)) !== null) {
    srcs.add(match[2]);
  }
  return [...srcs];
}

/** A local `/_next/static/...js` pathname. Anything else — a remote host, a
 *  protocol-relative URL, a non-static or non-.js path — is rejected by the
 *  caller, never silently dropped. */
function isLocalNextStaticJs(src) {
  if (!src.startsWith('/_next/static/')) return false;
  if (!src.endsWith('.js')) return false;
  // A same-origin path never starts with "//" (protocol-relative) and never
  // contains "://" (an accidental absolute URL slipping through the
  // startsWith check above via e.g. "/_next/static/../../evil://...").
  if (src.startsWith('//') || src.includes('://')) return false;
  return true;
}

/** Resolves a `/_next/static/...` request path to its file under
 *  `<nextDir>/static/...`, stripping any query string Next.js content-hash
 *  cache-busting appends. Rejects any resolved path that escapes `nextDir`
 *  (defence against a pathological `../` in a src) — belt-and-suspenders
 *  alongside the extension/prefix checks above. */
function resolveChunkFile(nextDir, src) {
  const withoutQuery = src.split('?')[0];
  const relative = withoutQuery.replace(/^\/_next\/static\//, '');
  const resolved = normalize(join(nextDir, 'static', relative));
  const staticRoot = normalize(join(nextDir, 'static')) + sep;
  if (!resolved.startsWith(staticRoot)) {
    fail(`resolved chunk path escapes .next/static: ${src}`);
  }
  return resolved;
}

async function main() {
  const { url, nextDir } = parseArgs(process.argv);

  let html;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      fail(`GET ${url} returned ${response.status} ${response.statusText}`);
    }
    html = await response.text();
  } catch (error) {
    fail(`failed to fetch ${url}: ${error instanceof Error ? error.message : String(error)}`);
  }

  const allSrcs = extractScriptSrcs(html);
  const remoteOrForeign = allSrcs.filter((src) => !isLocalNextStaticJs(src));
  if (remoteOrForeign.length > 0) {
    fail(
      `route references non-local/non-static script host(s), refusing to under-count:\n` +
        remoteOrForeign.map((src) => `  - ${src}`).join('\n'),
    );
  }

  const chunkPaths = [...allSrcs].sort();

  let rawBytes = 0;
  let gzipBytes = 0;
  for (const src of chunkPaths) {
    const file = resolveChunkFile(nextDir, src);
    let stat;
    try {
      stat = statSync(file);
    } catch {
      fail(`resolved chunk is missing on disk: ${src} -> ${file}`);
    }
    if (!stat.isFile()) {
      fail(`resolved chunk is not a regular file: ${src} -> ${file}`);
    }
    const buffer = readFileSync(file);
    rawBytes += buffer.byteLength;
    gzipBytes += gzipSync(buffer).byteLength;
  }

  console.log(
    JSON.stringify(
      {
        url,
        chunks: chunkPaths,
        rawBytes,
        gzipBytes,
      },
      null,
      2,
    ),
  );
}

main();
