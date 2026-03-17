/**
 * Attempts to execute migration SQL via Supabase RPC (if exec function exists)
 * or via the query endpoint.
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = 'https://devkeyhniwdxsqvoscdu.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRldmtleWhuaXdkeHNxdm9zY2R1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDA1OTk0MywiZXhwIjoyMDg1NjM1OTQzfQ.YoVUrCrbEt5beYxxppix4mtzk-Fy-ofzUtUQeucV1mY';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
const sql = fs.readFileSync('supabase/migrations/20260304100000_archived_pages.sql', 'utf8');

// Strategy 1: Try pg_query (custom function some projects have)
console.log('Trying rpc pg_query...');
const { data: d1, error: e1 } = await supabase.rpc('pg_query', { query: sql });
if (!e1) { console.log('✅ pg_query worked!', d1); process.exit(0); }
console.log('pg_query failed:', e1.message);

// Strategy 2: Try exec_sql
console.log('Trying rpc exec_sql...');
const { data: d2, error: e2 } = await supabase.rpc('exec_sql', { sql_string: sql });
if (!e2) { console.log('✅ exec_sql worked!', d2); process.exit(0); }
console.log('exec_sql failed:', e2.message);

// Strategy 3: Check if tables already exist
console.log('\nChecking if tables already exist...');
const { data: d3, error: e3 } = await supabase.from('archived_pages').select('id').limit(1);
if (!e3) {
  console.log('✅ archived_pages table ALREADY EXISTS — migration already applied!');
  process.exit(0);
}
console.log('archived_pages check:', e3.message);

const { data: d4, error: e4 } = await supabase.from('archive_audit_log').select('id').limit(1);
if (!e4) {
  console.log('✅ archive_audit_log table ALREADY EXISTS');
} else {
  console.log('archive_audit_log check:', e4.message);
}

console.log('\n⚠️  Cannot execute DDL via REST API. Need manual SQL execution.');
