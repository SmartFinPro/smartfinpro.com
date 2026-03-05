#!/usr/bin/env node
/**
 * run-migration.mjs
 * Executes a SQL migration file directly via Supabase REST API.
 * Usage: node scripts/run-migration.mjs supabase/migrations/20260304100000_archived_pages.sql
 */
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = 'https://devkeyhniwdxsqvoscdu.supabase.co';
const SERVICE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRldmtleWhuaXdkeHNxdm9zY2R1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDA1OTk0MywiZXhwIjoyMDg1NjM1OTQzfQ.YoVUrCrbEt5beYxxppix4mtzk-Fy-ofzUtUQeucV1mY';

const migrationFile = process.argv[2];
if (!migrationFile) {
  console.error('Usage: node scripts/run-migration.mjs <path-to-migration.sql>');
  process.exit(1);
}

const sql = fs.readFileSync(path.resolve(migrationFile), 'utf8');

console.log(`\nRunning migration: ${migrationFile}`);
console.log(`SQL length: ${sql.length} chars\n`);

const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SERVICE_KEY}`,
    'apikey': SERVICE_KEY,
  },
  body: JSON.stringify({ query: sql }),
});

if (!response.ok) {
  // Try the pg endpoint instead
  const response2 = await fetch(`${SUPABASE_URL}/pg/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'apikey': SERVICE_KEY,
    },
    body: JSON.stringify({ query: sql }),
  });
  const text2 = await response2.text();
  console.log(`pg/query status: ${response2.status}`);
  console.log(text2);
  process.exit(response2.ok ? 0 : 1);
}

const result = await response.json();
console.log('✅ Migration executed successfully');
console.log(JSON.stringify(result, null, 2));
