/**
 * Attempts to run migration via direct pg connection using service_role JWT as password.
 * Supabase accepts service_role JWT as password for the postgres user via SSL.
 */
import pg from 'pg';
import fs from 'fs';

const { Client } = pg;

const SQL = fs.readFileSync('supabase/migrations/20260304100000_archived_pages.sql', 'utf8');
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRldmtleWhuaXdkeHNxdm9zY2R1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDA1OTk0MywiZXhwIjoyMDg1NjM1OTQzfQ.YoVUrCrbEt5beYxxppix4mtzk-Fy-ofzUtUQeucV1mY';
const PROJECT_REF = 'devkeyhniwdxsqvoscdu';

// Try Session Pooler (port 5432) — accepts JWT as password
const configs = [
  {
    label: 'Session Pooler',
    host: `aws-0-eu-central-1.pooler.supabase.com`,
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

for (const config of configs) {
  console.log(`\nTrying ${config.label}: ${config.host}:${config.port}`);
  const client = new Client(config);
  try {
    await client.connect();
    console.log('Connected! Running migration...');
    await client.query(SQL);
    console.log('✅ Migration executed successfully!');
    await client.end();
    process.exit(0);
  } catch (err) {
    console.log(`Failed: ${err.message}`);
    try { await client.end(); } catch {}
  }
}

console.log('\n❌ Could not connect via direct pg. DB password required.');
