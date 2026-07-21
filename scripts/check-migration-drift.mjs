#!/usr/bin/env node
// scripts/check-migration-drift.mjs
// Detect migrations that never reached the production database.
//
// Usage:  npm run check:migrations
//         node scripts/check-migration-drift.mjs --verbose
//         node scripts/check-migration-drift.mjs --strict               (CI: no credentials ⇒ failure)
//         node scripts/check-migration-drift.mjs --fail-on-known-drift  (also fail on baselined drift)
//         node scripts/check-migration-drift.mjs --json
//
// Exit codes:
//   0  everything verified applied, or only baselined known-drift remains
//   1  NEW drift, a stale baseline entry, or (with --strict) nothing could be verified
//
// --strict is for CI: it turns "no credentials / could not verify" from a quiet
// skip into a hard failure, so a missing secret can never masquerade as a green
// check. It deliberately does NOT fail on baselined known-drift — that is what
// the baseline is for; use --fail-on-known-drift once every entry is remediated.
//
// Credentials (read from the environment, or from .env.local if present):
//   required  NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_KEY (or SUPABASE_SERVICE_ROLE_KEY)
//   optional  SUPABASE_DB_URL          → reads supabase_migrations.schema_migrations via pg
//   optional  SUPABASE_ACCESS_TOKEN    → same, via the Supabase Management API
//
// This replaces check-migration-drift.sh, which reported all 146 migrations as
// NOT APPLIED: it called a get_applied_migrations RPC that does not exist (404,
// swallowed by `curl -sf || echo ""`) and parsed the reply with GNU-only
// `grep -oP`, which fails outright on macOS. The result was a check that could
// only ever say "everything is broken", so nobody looked at it — and
// 20260306100000_blocked_ips.sql sat unapplied while lib/security/ip-blocklist.ts
// ran fail-open.

import fs from 'node:fs';
import path from 'node:path';
import { classifyMigrations } from './lib/migration-drift.mjs';

const argv = process.argv.slice(2);
const VERBOSE = argv.includes('--verbose') || argv.includes('-v');
const STRICT = argv.includes('--strict');
const FAIL_ON_KNOWN = argv.includes('--fail-on-known-drift');
const AS_JSON = argv.includes('--json');

const flag = (name, fallback) => {
  const hit = argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};

// Overridable so the check can be exercised against fixtures without touching
// the real migration history.
const MIGRATIONS_DIR = flag('migrations-dir', 'supabase/migrations');
const BASELINE_FILE = flag('baseline', 'scripts/migration-drift-baseline.json');

const log = (...args) => { if (!AS_JSON) console.log(...args); };

// ── Env ───────────────────────────────────────────────────────────────
// Fill from .env.local without ever overriding what the shell/CI already set.
function loadEnvFile(file = '.env.local') {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
    if (!m) continue;
    const key = m[1];
    if (process.env[key] !== undefined) continue;
    let value = m[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}
loadEnvFile();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const DB_URL = process.env.SUPABASE_DB_URL;
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

// ── Local migrations ──────────────────────────────────────────────────
function readMigrations() {
  if (!fs.existsSync(MIGRATIONS_DIR)) return [];
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort()
    .map((name) => ({ name, sql: fs.readFileSync(path.join(MIGRATIONS_DIR, name), 'utf8') }));
}

function readBaseline() {
  if (!fs.existsSync(BASELINE_FILE)) return { entries: [], reasons: {} };
  const parsed = JSON.parse(fs.readFileSync(BASELINE_FILE, 'utf8'));
  const known = parsed.known_drift || {};
  return { entries: Object.keys(known), reasons: known };
}

// ── Live schema (PostgREST OpenAPI: every exposed table/view + its columns) ──
async function fetchLiveSchema() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`PostgREST schema request failed: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
  }
  const spec = await res.json();
  const definitions = spec.definitions || {};
  const schema = {};
  for (const [table, def] of Object.entries(definitions)) {
    schema[table.toLowerCase()] = Object.keys(def.properties || {}).map((c) => c.toLowerCase());
  }
  if (Object.keys(schema).length === 0) {
    throw new Error('PostgREST returned an empty schema — refusing to report drift on no data');
  }
  return schema;
}

/**
 * Second opinion on a table the OpenAPI spec did not list.
 *
 * That listing is built from PostgREST's schema cache, which lags the database
 * until it reloads, so a table can be absent from the spec while already
 * existing. Reporting drift on that alone would produce exactly the kind of
 * false positive that made the previous check ignorable, so every "missing"
 * verdict is confirmed by a direct request first and the evidence is printed.
 *
 * @returns {Promise<{exists: boolean, status: number, code: string|null}>}
 */
async function probeTable(table) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${encodeURIComponent(table)}?select=*&limit=0`, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
  });
  if (res.ok) return { exists: true, status: res.status, code: null };
  let code = null;
  try { code = (JSON.parse(await res.text()) || {}).code ?? null; } catch { /* non-JSON body */ }
  return { exists: false, status: res.status, code };
}

// ── Optional: the migration ledger ────────────────────────────────────
const LEDGER_SQL = 'select version from supabase_migrations.schema_migrations order by version';

async function fetchLedgerViaPg() {
  const { default: pg } = await import('pg');
  const client = new pg.Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    const { rows } = await client.query(LEDGER_SQL);
    return rows.map((r) => String(r.version));
  } finally {
    await client.end();
  }
}

async function fetchLedgerViaManagementApi() {
  const ref = process.env.SUPABASE_PROJECT_REF
    || (SUPABASE_URL ? new URL(SUPABASE_URL).hostname.split('.')[0] : null);
  if (!ref) throw new Error('cannot derive project ref (set SUPABASE_PROJECT_REF)');
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: LEDGER_SQL }),
  });
  if (!res.ok) throw new Error(`Management API HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const rows = await res.json();
  return (Array.isArray(rows) ? rows : []).map((r) => String(r.version));
}

async function fetchLedger() {
  if (DB_URL) return { source: 'SUPABASE_DB_URL (pg)', versions: await fetchLedgerViaPg() };
  if (ACCESS_TOKEN) return { source: 'Management API', versions: await fetchLedgerViaManagementApi() };
  return null;
}

// ── Report ────────────────────────────────────────────────────────────
const ICON = {
  applied: '  [ok]',
  drift: '  [DRIFT]',
  'known-drift': '  [known]',
  superseded: '  [gone]',
  unverifiable: '  [ – ]',
};

async function main() {
  const migrations = readMigrations();
  if (migrations.length === 0) {
    log(`No migrations found in ${MIGRATIONS_DIR}/`);
    return 0;
  }
  const { entries: baseline, reasons } = readBaseline();

  if (!SUPABASE_URL || !SERVICE_KEY) {
    const msg = 'No Supabase credentials — set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY.';
    if (AS_JSON) console.log(JSON.stringify({ ok: !STRICT, skipped: true, reason: msg }));
    else {
      log('');
      log('═══════════════════════════════════════════════════════════════');
      log('  MIGRATION DRIFT CHECK SKIPPED — NOTHING WAS VERIFIED');
      log(`  ${msg}`);
      log(`  ${migrations.length} local migrations were not compared against anything.`);
      log('═══════════════════════════════════════════════════════════════');
      log('');
    }
    return STRICT ? 1 : 0;
  }

  const liveSchema = await fetchLiveSchema();
  let classified = classifyMigrations({ migrations, liveSchema, baseline });

  // Confirm every "missing table" verdict with a direct request before we call
  // it drift, so a stale schema cache cannot produce a false alarm.
  const suspects = [...new Set(
    classified.results.flatMap((r) => r.missing)
      .filter((m) => m.startsWith('table:'))
      .map((m) => m.slice('table:'.length)),
  )];
  const probes = await Promise.all(suspects.map(async (t) => [t, await probeTable(t)]));
  const cacheOnly = probes.filter(([, p]) => p.exists).map(([t]) => t);

  if (cacheOnly.length > 0) {
    for (const table of cacheOnly) liveSchema[table] = [];
    classified = classifyMigrations({
      migrations, liveSchema, baseline, unknownColumnTables: cacheOnly,
    });
  }
  const { results, summary, staleBaseline } = classified;

  let ledger = null;
  let ledgerError = null;
  try {
    ledger = await fetchLedger();
  } catch (err) {
    ledgerError = err.message;
  }

  if (AS_JSON) {
    console.log(JSON.stringify({
      ok: summary.drift === 0 && staleBaseline.length === 0,
      summary, staleBaseline, results,
      ledger: ledger ? { source: ledger.source, count: ledger.versions.length } : null,
      ledgerError,
    }, null, 2));
  } else {
    log('');
    log(`Migration drift check — ${migrations.length} local migrations vs. live schema`);
    log(`Live schema: ${Object.keys(liveSchema).length} tables/views exposed via PostgREST`);
    log('───────────────────────────────────────────────────────────────');

    for (const r of results) {
      const interesting = r.status === 'drift' || r.status === 'known-drift';
      if (!VERBOSE && !interesting) continue;
      const detail = r.missing.length ? `  ← missing: ${r.missing.join(', ')}` : '';
      log(`${ICON[r.status]} ${r.name}${detail}`);
      if (r.status === 'known-drift' && reasons[r.name]) log(`          baseline: ${reasons[r.name]}`);
    }

    if (probes.length > 0) {
      log('');
      log('Direct probe of every table reported missing:');
      for (const [table, p] of probes) {
        log(`  ${table} → HTTP ${p.status}${p.code ? ` (${p.code})` : ''}${p.exists ? '  — exists after all, schema cache was stale' : '  — confirmed absent'}`);
      }
    }

    log('───────────────────────────────────────────────────────────────');
    log(`  ${summary.applied} verified applied`);
    log(`  ${summary.drift} DRIFT`);
    log(`  ${summary.knownDrift} known drift (baselined)`);
    if (summary.superseded) log(`  ${summary.superseded} superseded by a later migration`);
    log(`  ${summary.unverifiable} not object-verifiable (seeds, RLS, indexes, functions)`);
    if (!VERBOSE) log('  (run with --verbose to list every migration)');

    if (ledger) {
      const localVersions = new Set(migrations.map((m) => m.name.replace(/\.sql$/, '')));
      const inLedger = new Set(ledger.versions);
      const notInLedger = [...localVersions].filter((v) => !inLedger.has(v));
      log('');
      log(`Migration ledger via ${ledger.source}: ${ledger.versions.length} entries`);
      log(`  ${notInLedger.length} local migrations are absent from the ledger.`);
      log('  (informational only — this project applies migrations outside the Supabase CLI,');
      log('   so ledger gaps are expected and do not fail the check)');
    } else {
      log('');
      log(`Migration ledger: not read (${ledgerError || 'set SUPABASE_DB_URL or SUPABASE_ACCESS_TOKEN to enable'})`);
    }
    log('');
  }

  let exitCode = 0;

  if (staleBaseline.length > 0) {
    exitCode = 1;
    log('STALE BASELINE — these entries no longer drift (or the file is gone).');
    log(`Remove them from ${BASELINE_FILE}:`);
    for (const name of staleBaseline) log(`  - ${name}`);
    log('');
  }

  if (summary.drift > 0) {
    exitCode = 1;
    log(`DRIFT DETECTED: ${summary.drift} migration(s) are not applied to production.`);
    log('Apply them to Supabase, then re-run this check.');
    log('');
  } else if (summary.knownDrift > 0) {
    log(`${summary.knownDrift} known-drift migration(s) are still unapplied — see ${BASELINE_FILE}.`);
    log('(baselined — tolerated so NEW drift stands out; not applied yet by design)');
    if (FAIL_ON_KNOWN) { exitCode = 1; log('--fail-on-known-drift: treating baselined drift as a failure.'); }
    log('');
  }

  if (exitCode === 0 && summary.drift === 0 && summary.knownDrift === 0) {
    log('No drift detected.');
    log('');
  }

  return exitCode;
}

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error(`\nmigration drift check failed: ${err.message}\n`);
    process.exit(1);
  });
