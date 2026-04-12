#!/usr/bin/env node
/**
 * scripts/generate-route-index.mjs
 *
 * Scans app/api/** for route.ts files (excluding /cron/) and writes
 * memory/generated/api-routes.json
 *
 * Run via: npm run refresh:agent-context
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const API_DIR = path.join(ROOT, 'app', 'api');
const OUT_DIR = path.join(ROOT, 'memory', 'generated');
const OUT_FILE = path.join(OUT_DIR, 'api-routes.json');

function findRouteFiles(dir, base = '') {
  const entries = [];

  if (!fs.existsSync(dir)) return entries;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    const urlPath = base + '/' + entry.name;

    if (entry.isDirectory()) {
      // Skip cron directory — handled by generate-cron-index.mjs
      if (entry.name === 'cron') continue;
      entries.push(...findRouteFiles(fullPath, urlPath));
    } else if (entry.name === 'route.ts' || entry.name === 'route.js') {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
        .filter(m => content.includes(`export async function ${m}`) || content.includes(`export function ${m}`));

      entries.push({
        path: '/api' + base,
        file: path.relative(ROOT, fullPath),
        methods: methods.length ? methods : ['GET'],
      });
    }
  }

  return entries;
}

function main() {
  const routes = findRouteFiles(API_DIR).sort((a, b) => a.path.localeCompare(b.path));

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const output = {
    _generated: true,
    _command: 'npm run refresh:agent-context',
    _do_not_edit: true,
    _generated_at: new Date().toISOString(),
    count: routes.length,
    routes,
  };

  fs.writeFileSync(OUT_FILE, JSON.stringify(output, null, 2) + '\n');
  console.log(`✅ api-routes.json: ${routes.length} routes written to ${path.relative(ROOT, OUT_FILE)}`);
}

main();
