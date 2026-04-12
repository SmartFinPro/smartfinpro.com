#!/usr/bin/env tsx
/**
 * scripts/generate-cron-index.ts
 *
 * Scans app/api/cron/** for route.ts files and writes
 * memory/generated/cron-index.json
 *
 * Run via: npm run refresh:agent-context
 */

import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(process.cwd());
const CRON_DIR = path.join(ROOT, 'app', 'api', 'cron');
const OUT_DIR = path.join(ROOT, 'memory', 'generated');
const OUT_FILE = path.join(OUT_DIR, 'cron-index.json');

interface CronEntry {
  name: string;       // e.g. "daily-strategy"
  route: string;      // e.g. "/api/cron/daily-strategy"
  file: string;       // relative path from project root
  hasAuth: boolean;   // has CRON_SECRET check
  hasLogCron: boolean; // has logCron() call
}

function findCronJobs(dir: string): CronEntry[] {
  const entries: CronEntry[] = [];

  if (!fs.existsSync(dir)) return entries;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Look for route.ts inside subdirectory
      const routeFile = path.join(fullPath, 'route.ts');
      if (fs.existsSync(routeFile)) {
        const content = fs.readFileSync(routeFile, 'utf-8');
        entries.push({
          name: entry.name,
          route: `/api/cron/${entry.name}`,
          file: path.relative(ROOT, routeFile),
          hasAuth: content.includes('CRON_SECRET'),
          hasLogCron: content.includes('logCron'),
        });
      } else {
        // Recurse
        entries.push(...findCronJobs(fullPath));
      }
    } else if (entry.name === 'route.ts') {
      const jobName = path.basename(dir);
      const content = fs.readFileSync(fullPath, 'utf-8');
      entries.push({
        name: jobName,
        route: `/api/cron/${jobName}`,
        file: path.relative(ROOT, fullPath),
        hasAuth: content.includes('CRON_SECRET'),
        hasLogCron: content.includes('logCron'),
      });
    }
  }

  return entries;
}

function main() {
  const jobs = findCronJobs(CRON_DIR).sort((a, b) => a.name.localeCompare(b.name));

  // Warn about jobs missing auth or logging
  const noAuth = jobs.filter(j => !j.hasAuth);
  const noLog = jobs.filter(j => !j.hasLogCron);

  if (noAuth.length) {
    console.warn(`⚠️  Cron jobs missing CRON_SECRET auth: ${noAuth.map(j => j.name).join(', ')}`);
  }
  if (noLog.length) {
    console.warn(`⚠️  Cron jobs missing logCron(): ${noLog.map(j => j.name).join(', ')}`);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const output = {
    _generated: true,
    _command: 'npm run refresh:agent-context',
    _do_not_edit: true,
    _generated_at: new Date().toISOString(),
    count: jobs.length,
    jobs,
    warnings: {
      missing_auth: noAuth.map(j => j.name),
      missing_log_cron: noLog.map(j => j.name),
    },
  };

  fs.writeFileSync(OUT_FILE, JSON.stringify(output, null, 2) + '\n');
  console.log(`✅ cron-index.json: ${jobs.length} cron jobs written to ${path.relative(ROOT, OUT_FILE)}`);
}

main();
