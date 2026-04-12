#!/usr/bin/env tsx
/**
 * scripts/check-claude-md-stats.ts
 *
 * Compares route/cron/action counts AND names in CLAUDE.md
 * against memory/generated/*.json (the source of truth).
 *
 * Fails (exit 1) if:
 *   - Counts in CLAUDE.md don't match reality
 *   - A cron route name exists in code but is NOT mentioned in CLAUDE.md
 *
 * Warns if:
 *   - A name in CLAUDE.md doesn't exist in code (stale entry)
 *
 * Run via: npm run check:claude-stats
 * Also runs as part of: npm run refresh:agent-context
 */

import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(process.cwd());
const CLAUDE_MD = path.join(ROOT, 'CLAUDE.md');
const GEN_DIR = path.join(ROOT, 'memory', 'generated');

interface CheckResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
}

function readJson<T>(file: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8')) as T;
  } catch {
    return null;
  }
}

function checkCronNames(claudeMd: string): CheckResult {
  const result: CheckResult = { ok: true, errors: [], warnings: [] };

  const cronIndex = readJson<{ count: number; jobs: Array<{ name: string }> }>(
    path.join(GEN_DIR, 'cron-index.json')
  );
  if (!cronIndex) {
    result.warnings.push('cron-index.json not found — run npm run refresh:agent-context first');
    return result;
  }

  const realNames = new Set(cronIndex.jobs.map(j => j.name));
  const realCount = cronIndex.count;

  // Extract count from CLAUDE.md: "## ⏰ Cron-Jobs (N aktiv)"
  const countMatch = claudeMd.match(/Cron-Jobs \((\d+) aktiv\)/);
  const docCount = countMatch ? parseInt(countMatch[1], 10) : null;

  if (docCount !== realCount) {
    result.errors.push(
      `Cron count mismatch: CLAUDE.md says "${docCount}" but ${realCount} found in code.\n` +
      `  → Update "## ⏰ Cron-Jobs (${realCount} aktiv)" in CLAUDE.md`
    );
    result.ok = false;
  }

  // Check each real cron name is mentioned in CLAUDE.md
  const missing: string[] = [];
  for (const name of realNames) {
    if (!claudeMd.includes(`\`${name}\``) && !claudeMd.includes(`/${name}`)) {
      missing.push(name);
    }
  }
  if (missing.length) {
    result.errors.push(
      `Cron jobs in code but NOT documented in CLAUDE.md:\n` +
      missing.map(n => `  - ${n}  (/api/cron/${n})`).join('\n')
    );
    result.ok = false;
  }

  // Reverse: check for stale cron names in CLAUDE.md
  // Extract all `/api/cron/X` mentions
  const cronMentions = [...claudeMd.matchAll(/`\/api\/cron\/([\w-]+)`/g)].map(m => m[1]);
  for (const name of cronMentions) {
    if (!realNames.has(name)) {
      result.warnings.push(`Stale cron in CLAUDE.md (not found in code): \`${name}\``);
    }
  }

  return result;
}

function checkKennzahlen(claudeMd: string): CheckResult {
  const result: CheckResult = { ok: true, errors: [], warnings: [] };

  // Check cron count in Kennzahlen table
  const cronIndex = readJson<{ count: number }>(path.join(GEN_DIR, 'cron-index.json'));
  const actionsIndex = readJson<{ count: number }>(path.join(GEN_DIR, 'lib-actions.json'));

  if (cronIndex) {
    const kennzahlCronMatch = claudeMd.match(/\| Cron Jobs\s+\| (\d+)/);
    const docCronCount = kennzahlCronMatch ? parseInt(kennzahlCronMatch[1], 10) : null;
    if (docCronCount !== null && docCronCount !== cronIndex.count) {
      result.errors.push(
        `Kennzahlen "Cron Jobs" = ${docCronCount} but reality = ${cronIndex.count}.\n` +
        `  → Update "| Cron Jobs | ${cronIndex.count} aktiv |" in Kennzahlen table`
      );
      result.ok = false;
    }
  }

  if (actionsIndex) {
    const actionsMatch = claudeMd.match(/Server Actions\s+\|\s+(\d+)/);
    const docActionsCount = actionsMatch ? parseInt(actionsMatch[1], 10) : null;
    if (docActionsCount !== null && Math.abs(docActionsCount - actionsIndex.count) > 2) {
      result.warnings.push(
        `Kennzahlen "Server Actions" = ${docActionsCount} but found ${actionsIndex.count} modules.\n` +
        `  → Consider updating the count (tolerance: ±2)`
      );
    }
  }

  return result;
}

function main() {
  console.log('🔍 Checking CLAUDE.md stats against generated indexes...\n');

  if (!fs.existsSync(CLAUDE_MD)) {
    console.error('❌ CLAUDE.md not found');
    process.exit(1);
  }

  const claudeMd = fs.readFileSync(CLAUDE_MD, 'utf-8');
  const allErrors: string[] = [];
  const allWarnings: string[] = [];

  // Run checks
  for (const check of [checkCronNames(claudeMd), checkKennzahlen(claudeMd)]) {
    allErrors.push(...check.errors);
    allWarnings.push(...check.warnings);
  }

  // Print warnings
  for (const w of allWarnings) {
    console.warn(`  ⚠️  ${w}`);
  }

  // Print errors
  if (allErrors.length > 0) {
    console.error('\n❌ CLAUDE.md is out of sync with the codebase:\n');
    for (const e of allErrors) {
      console.error(`  ✗ ${e}\n`);
    }
    console.error(`Run \`npm run refresh:agent-context\` and update CLAUDE.md to fix.\n`);
    process.exit(1);
  }

  console.log('✅ CLAUDE.md stats are in sync with the codebase.\n');
}

main();
