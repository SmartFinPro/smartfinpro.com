#!/usr/bin/env node
// One-off runner for the Slice-3 trading-platforms migration. Snapshots the
// (expected-empty) target rows before writing (rollback safety per
// rollout-plan guardrail), then applies the migration via a direct Postgres
// connection (service_role JWT as password — the exec_sql RPC used by the
// Slice-1 script is not present in this project's schema cache).
// Usage: node --env-file=.env.local scripts/apply-trading-platforms-slice3.mjs

import fs from 'fs';
import pg from 'pg';

const { Client } = pg;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_KEY (run with --env-file=.env.local)');
  process.exit(1);
}
const PROJECT_REF = new URL(SUPABASE_URL).hostname.split('.')[0];

const configs = [
  {
    label: 'Session Pooler',
    host: 'aws-0-eu-central-1.pooler.supabase.com',
    port: 5432,
    user: `postgres.${PROJECT_REF}`,
    password: SERVICE_KEY,
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
  },
  {
    label: 'Direct DB',
    host: `db.${PROJECT_REF}.supabase.co`,
    port: 5432,
    user: 'postgres',
    password: SERVICE_KEY,
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
  },
];

async function connect() {
  for (const config of configs) {
    const client = new Client(config);
    try {
      await client.connect();
      console.log(`Connected via ${config.label} (${config.host}:${config.port})`);
      return client;
    } catch (err) {
      console.log(`${config.label} failed: ${err.message}`);
      try { await client.end(); } catch {}
    }
  }
  console.error('❌ Could not connect via any configured route.');
  process.exit(1);
}

const client = await connect();

// 1. Snapshot the target rows before the migration (expected empty — new topic).
const snapshotRes = await client.query(
  `select slug, market, category, topic from product_attributes where category = 'trading' and topic = 'trading-platforms';`,
);
fs.writeFileSync(
  'docs/superpowers/plans/data/2026-07-03-trading-platforms-pre-migration-snapshot.json',
  JSON.stringify(snapshotRes.rows, null, 2),
);
console.log(`✅ Snapshot written (${snapshotRes.rows.length} pre-existing rows — expected 0)`);

// 2. Apply the migration.
const seedSql = fs.readFileSync('supabase/migrations/20260703100000_seed_trading_platforms_us.sql', 'utf8');
await client.query(seedSql);
console.log('✅ 20260703100000_seed_trading_platforms_us.sql applied');

// 3. Verify.
const verify = await client.query(
  `select slug, category, market, topic, is_top_pick, display_order, score, rating, is_affiliate, review_slug, external_url from product_attributes where category = 'trading' and topic = 'trading-platforms' order by display_order;`,
);
console.table(verify.rows);

await client.end();
