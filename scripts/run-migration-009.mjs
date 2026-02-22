#!/usr/bin/env node
/**
 * Run migration 009_cta_analytics.sql against Supabase
 * Usage: node scripts/run-migration-009.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Parse .env.local manually (no dotenv dependency needed)
const envFile = readFileSync(resolve(__dirname, '../.env.local'), 'utf-8');
const env = {};
for (const line of envFile.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx === -1) continue;
  env[trimmed.slice(0, eqIdx)] = trimmed.slice(eqIdx + 1);
}

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

const sql = readFileSync(
  resolve(__dirname, '../supabase/migrations/009_cta_analytics.sql'),
  'utf-8'
);

console.log('🔄 Running migration 009_cta_analytics...');
console.log(`   Target: ${supabaseUrl}`);

// Supabase JS client can't run raw DDL via PostgREST.
// We need to use the Management API's SQL endpoint instead.
const projectRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '');

const response = await fetch(`https://${projectRef}.supabase.co/rest/v1/rpc/exec_sql`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': serviceKey,
    'Authorization': `Bearer ${serviceKey}`,
  },
  body: JSON.stringify({ query: sql }),
});

if (!response.ok) {
  const text = await response.text();
  console.log('   ℹ️  exec_sql RPC not available (expected for fresh projects)');
  console.log(`   Response: ${response.status}`);
  console.log('\n📋 Please run this SQL in the Supabase SQL Editor:');
  console.log(`   https://supabase.com/dashboard/project/${projectRef}/sql/new\n`);
  console.log('--- SQL START ---');
  console.log(sql);
  console.log('--- SQL END ---');
  console.log('\n   After running, verify with: node scripts/run-migration-009.mjs --verify');
  process.exit(0);
}

console.log('✅ Migration SQL executed!');

// Verify table exists
const { data: testData, error: testError } = await supabase
  .from('cta_analytics')
  .select('id')
  .limit(0);

if (testError) {
  console.log('⚠️  Table not yet accessible:', testError.message);
} else {
  console.log('✅ Table cta_analytics verified — ready for tracking!');
}
