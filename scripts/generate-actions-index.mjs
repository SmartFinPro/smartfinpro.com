#!/usr/bin/env node
/**
 * scripts/generate-actions-index.mjs
 *
 * Scans lib/actions/*.ts and extracts exported function names,
 * writes memory/generated/lib-actions.json
 *
 * Run via: npm run refresh:agent-context
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const ACTIONS_DIR = path.join(ROOT, 'lib', 'actions');
const OUT_DIR = path.join(ROOT, 'memory', 'generated');
const OUT_FILE = path.join(OUT_DIR, 'lib-actions.json');

function extractExports(content) {
  const exports = [];
  // Match: export async function foo, export function foo, export const foo =
  const patterns = [
    /export\s+async\s+function\s+(\w+)/g,
    /export\s+function\s+(\w+)/g,
    /export\s+(?:const|let)\s+(\w+)\s*=/g,
    /export\s+type\s+(\w+)/g,
    /export\s+interface\s+(\w+)/g,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      if (!exports.includes(match[1])) {
        exports.push(match[1]);
      }
    }
  }

  return exports.sort();
}

function main() {
  if (!fs.existsSync(ACTIONS_DIR)) {
    console.error(`❌ Actions dir not found: ${ACTIONS_DIR}`);
    process.exit(1);
  }

  const modules = [];

  for (const file of fs.readdirSync(ACTIONS_DIR).sort()) {
    if (!file.endsWith('.ts') || file.startsWith('_')) continue;

    const fullPath = path.join(ACTIONS_DIR, file);
    const content = fs.readFileSync(fullPath, 'utf-8');
    const name = path.basename(file, '.ts');

    modules.push({
      name,
      file: path.relative(ROOT, fullPath),
      exports: extractExports(content),
      hasUseServer: content.includes("'use server'") || content.includes('"use server"'),
      hasServerOnly: content.includes("'server-only'") || content.includes('"server-only"'),
    });
  }

  // Warn about actions missing use server
  const noUseServer = modules.filter(m => !m.hasUseServer);
  if (noUseServer.length) {
    console.warn(`⚠️  Actions missing 'use server': ${noUseServer.map(m => m.name).join(', ')}`);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const output = {
    _generated: true,
    _command: 'npm run refresh:agent-context',
    _do_not_edit: true,
    _generated_at: new Date().toISOString(),
    count: modules.length,
    modules,
    warnings: {
      missing_use_server: noUseServer.map(m => m.name),
    },
  };

  fs.writeFileSync(OUT_FILE, JSON.stringify(output, null, 2) + '\n');
  console.log(`✅ lib-actions.json: ${modules.length} modules written to ${path.relative(ROOT, OUT_FILE)}`);
}

main();
