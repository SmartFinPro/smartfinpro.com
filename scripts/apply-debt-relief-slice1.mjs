#!/usr/bin/env node
// One-off runner for the Slice-1 debt-relief migrations. Snapshots affected
// rows before writing (rollback safety per rollout-plan guardrail), then
// applies both migration files via the Supabase REST SQL endpoint.
// Usage: node --env-file=.env.local scripts/apply-debt-relief-slice1.mjs

import fs from 'fs';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_KEY (run with --env-file=.env.local)');
  process.exit(1);
}

async function execSql(sql, label) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SERVICE_KEY}`,
      apikey: SERVICE_KEY,
    },
    body: JSON.stringify({ query: sql }),
  });
  const text = await res.text();
  if (!res.ok) {
    console.error(`❌ ${label} failed (${res.status}):`, text);
    process.exit(1);
  }
  console.log(`✅ ${label} ok`);
  return text;
}

// 1. Snapshot the affected affiliate_links row before the category fix.
const snapshot = await execSql(
  `select json_agg(t) from (select id, slug, market, category, destination_url, tracking_status, active from affiliate_links where slug = 'national-debt-relief' and market = 'us') t;`,
  'snapshot national-debt-relief (pre-migration)',
);
fs.writeFileSync(
  `docs/superpowers/plans/data/2026-07-03-national-debt-relief-pre-migration-snapshot.json`,
  snapshot,
);
console.log('Snapshot written to docs/superpowers/plans/data/2026-07-03-national-debt-relief-pre-migration-snapshot.json');

// 2. Apply both migrations in order.
const fixSql = fs.readFileSync('supabase/migrations/20260703090000_fix_ndr_category.sql', 'utf8');
await execSql(fixSql, '20260703090000_fix_ndr_category.sql');

const seedSql = fs.readFileSync('supabase/migrations/20260703090100_seed_debt_relief_us.sql', 'utf8');
await execSql(seedSql, '20260703090100_seed_debt_relief_us.sql');

// 3. Verify.
const verify = await execSql(
  `select slug, category, market, topic, is_top_pick, display_order, management_fee, rating from product_attributes where category = 'debt-relief' and topic = 'companies' order by display_order;`,
  'verify seeded rows',
);
console.log(verify);

const verifyLink = await execSql(
  `select slug, category, market, tracking_status, active from affiliate_links where slug = 'national-debt-relief';`,
  'verify affiliate_links fix',
);
console.log(verifyLink);
