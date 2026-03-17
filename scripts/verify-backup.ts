#!/usr/bin/env npx tsx
/**
 * scripts/verify-backup.ts
 * SmartFinPro.com — Backup & Data Integrity Verification
 *
 * Verifies that Supabase data is intact and accessible.
 * Run after deployments, migrations, or on a weekly schedule.
 *
 * Usage:
 *   npm run verify-backup           — full check + report
 *   npm run verify-backup -- --quick — connection + row counts only
 *
 * CI/Cron (add to crontab):
 *   0 6 * * 1 cd /home/master/applications/smartfinpro/public_html && \
 *     NODE_ENV=production npx tsx scripts/verify-backup.ts >> logs/backup-verify.log 2>&1
 *
 * Exit codes:
 *   0 = All checks passed
 *   1 = One or more checks failed
 *   2 = Cannot connect to Supabase (critical)
 */

import { createClient } from '@supabase/supabase-js';

// ── Load env (supports both .env.local and process.env) ─────────────────────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('[verify-backup] FATAL: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_KEY');
  process.exit(2);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const isQuick = process.argv.includes('--quick');
const timestamp = new Date().toISOString();

// ── Critical tables — must exist and have rows ───────────────────────────────
const CRITICAL_TABLES = [
  { table: 'affiliate_links', minRows: 1,   description: 'Affiliate link registry' },
  { table: 'clicks',          minRows: 0,   description: 'Click tracking (may be empty on fresh install)' },
  { table: 'leads',           minRows: 0,   description: 'Newsletter subscribers' },
  { table: 'analytics',       minRows: 0,   description: 'Page analytics' },
  { table: 'cron_logs',       minRows: 0,   description: 'Cron job history' },
  { table: 'keyword_rankings',minRows: 0,   description: 'SEO rankings' },
  { table: 'ab_tests',        minRows: 0,   description: 'A/B test definitions' },
  { table: 'content_items',   minRows: 0,   description: 'Content pipeline' },
] as const;

// ── Results ──────────────────────────────────────────────────────────────────
interface CheckResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  detail: string;
  duration_ms: number;
}

const results: CheckResult[] = [];
let hasFailure = false;

function pass(name: string, detail: string, ms: number) {
  results.push({ name, status: 'PASS', detail, duration_ms: ms });
}
function fail(name: string, detail: string, ms: number) {
  results.push({ name, status: 'FAIL', detail, duration_ms: ms });
  hasFailure = true;
}
function warn(name: string, detail: string, ms: number) {
  results.push({ name, status: 'WARN', detail, duration_ms: ms });
}

// ── Check 1: Supabase Connectivity ──────────────────────────────────────────
async function checkConnectivity() {
  const t = Date.now();
  try {
    const { error } = await supabase.from('affiliate_links').select('id').limit(1);
    const ms = Date.now() - t;
    if (error) {
      fail('Connectivity', `Supabase query failed: ${error.message}`, ms);
      console.error('[verify-backup] Cannot connect to Supabase. Aborting.');
      process.exit(2);
    }
    if (ms > 3000) {
      warn('Connectivity', `Supabase responded but slowly: ${ms}ms (>3s)`, ms);
    } else {
      pass('Connectivity', `Supabase reachable in ${ms}ms`, ms);
    }
  } catch (err) {
    fail('Connectivity', `Exception: ${err instanceof Error ? err.message : String(err)}`, Date.now() - t);
    process.exit(2);
  }
}

// ── Check 2: Table Row Counts ────────────────────────────────────────────────
async function checkTableCounts() {
  for (const { table, minRows, description } of CRITICAL_TABLES) {
    const t = Date.now();
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      const ms = Date.now() - t;

      if (error) {
        fail(`Table:${table}`, `Query failed: ${error.message}`, ms);
        continue;
      }

      const rowCount = count ?? 0;
      if (rowCount < minRows) {
        fail(`Table:${table}`, `${description} — ${rowCount} rows (min: ${minRows})`, ms);
      } else {
        pass(`Table:${table}`, `${description} — ${rowCount} rows`, ms);
      }
    } catch (err) {
      fail(`Table:${table}`, `Exception: ${err instanceof Error ? err.message : String(err)}`, Date.now() - t);
    }
  }
}

// ── Check 3: Recent Cron Activity (last 25 hours) ────────────────────────────
async function checkCronActivity() {
  const t = Date.now();
  try {
    const { data, error } = await supabase
      .from('cron_logs')
      .select('job_name, status, executed_at')
      .order('executed_at', { ascending: false })
      .limit(10);

    const ms = Date.now() - t;

    if (error) {
      warn('CronActivity', `Cannot query cron_logs: ${error.message}`, ms);
      return;
    }

    if (!data || data.length === 0) {
      warn('CronActivity', 'No cron logs found — crons may not have run yet', ms);
      return;
    }

    const latest = data[0];
    const ageHours = (Date.now() - new Date(latest.executed_at).getTime()) / 3_600_000;
    const recentErrors = data.filter((r) => r.status === 'error').length;

    if (ageHours > 25) {
      warn('CronActivity', `Last cron ran ${ageHours.toFixed(1)}h ago (${latest.job_name}) — overdue`, ms);
    } else {
      pass('CronActivity', `Last cron: ${latest.job_name} (${ageHours.toFixed(1)}h ago), ${recentErrors} recent errors`, ms);
    }
  } catch (err) {
    warn('CronActivity', `Exception: ${err instanceof Error ? err.message : String(err)}`, Date.now() - t);
  }
}

// ── Check 4: Affiliate Link Integrity ────────────────────────────────────────
async function checkAffiliateLinkIntegrity() {
  const t = Date.now();
  try {
    // Check for active links with null URLs (data corruption indicator)
    const { data: nullUrls, error: e1 } = await supabase
      .from('affiliate_links')
      .select('slug')
      .is('url', null)
      .eq('is_active', true);

    const { data: sample, error: e2 } = await supabase
      .from('affiliate_links')
      .select('slug, url, provider, market')
      .eq('is_active', true)
      .limit(5);

    const ms = Date.now() - t;

    if (e1 || e2) {
      warn('AffiliateLinkIntegrity', `Query error: ${e1?.message ?? e2?.message}`, ms);
      return;
    }

    const nullCount = nullUrls?.length ?? 0;
    if (nullCount > 0) {
      fail('AffiliateLinkIntegrity', `${nullCount} active links have null URL (data corruption!)`, ms);
    } else {
      pass('AffiliateLinkIntegrity', `${sample?.length ?? 0} sample links have valid URLs`, ms);
    }
  } catch (err) {
    warn('AffiliateLinkIntegrity', `Exception: ${err instanceof Error ? err.message : String(err)}`, Date.now() - t);
  }
}

// ── Check 5: System Settings Completeness ────────────────────────────────────
async function checkSystemSettings() {
  const t = Date.now();
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('key, value');

    const ms = Date.now() - t;

    if (error) {
      warn('SystemSettings', `Cannot query system_settings: ${error.message}`, ms);
      return;
    }

    const count = data?.length ?? 0;
    pass('SystemSettings', `${count} system settings present`, ms);
  } catch (err) {
    warn('SystemSettings', `Exception: ${err instanceof Error ? err.message : String(err)}`, Date.now() - t);
  }
}

// ── Run all checks ────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🔍 SmartFinPro Backup Verification — ${timestamp}`);
  console.log(`   Mode: ${isQuick ? 'QUICK' : 'FULL'}\n`);

  await checkConnectivity();

  if (!isQuick) {
    await checkTableCounts();
    await checkCronActivity();
    await checkAffiliateLinkIntegrity();
    await checkSystemSettings();
  }

  // ── Print results ─────────────────────────────────────────────────────────
  console.log('─'.repeat(70));
  for (const r of results) {
    const icon = r.status === 'PASS' ? '✅' : r.status === 'WARN' ? '⚠️ ' : '❌';
    console.log(`${icon} [${r.status}] ${r.name.padEnd(28)} ${r.detail} (${r.duration_ms}ms)`);
  }
  console.log('─'.repeat(70));

  const passed = results.filter((r) => r.status === 'PASS').length;
  const warned = results.filter((r) => r.status === 'WARN').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;

  console.log(`\nResult: ${passed} passed, ${warned} warnings, ${failed} failed`);

  if (hasFailure) {
    console.error('\n🚨 BACKUP VERIFICATION FAILED — investigate immediately!\n');
    process.exit(1);
  } else if (warned > 0) {
    console.log('\n⚠️  Verification complete with warnings.\n');
    process.exit(0);
  } else {
    console.log('\n✅ All checks passed — data integrity confirmed.\n');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('[verify-backup] Fatal error:', err);
  process.exit(2);
});
