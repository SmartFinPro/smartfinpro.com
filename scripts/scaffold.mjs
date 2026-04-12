#!/usr/bin/env node
/**
 * scripts/scaffold.mjs
 *
 * Generates boilerplate files for SmartFinPro with correct imports.
 *
 * Usage (interactive):
 *   npm run scaffold:api
 *   npm run scaffold:cron
 *   npm run scaffold:server-action
 *
 * Usage (non-interactive / CI):
 *   npm run scaffold:api -- --name my-route
 *   npm run scaffold:cron -- --name sync-offers --schedule "0 3 * * *"
 *   npm run scaffold:server-action -- --name get-offer-stats
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const TEMPLATES_DIR = path.join(__dirname, 'templates');

// ── Parse CLI args ───────────────────────────────────────────
const args = process.argv.slice(2);
const typeArg = getFlag('--type');
const nameArg = getFlag('--name');
const scheduleArg = getFlag('--schedule');

function getFlag(flag) {
  const idx = args.indexOf(flag);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : null;
}

function toPascalCase(str) {
  return str
    .split(/[-_]/)
    .map(s => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');
}

// ── Prompt helper ────────────────────────────────────────────
async function prompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// ── Template renderer ────────────────────────────────────────
function renderTemplate(templatePath, vars) {
  let content = fs.readFileSync(templatePath, 'utf-8');
  for (const [key, val] of Object.entries(vars)) {
    content = content.replaceAll(`{{${key}}}`, val);
  }
  return content;
}

// ── Scaffold types ────────────────────────────────────────────
async function scaffoldCron(name, schedule) {
  const outDir = path.join(ROOT, 'app', 'api', 'cron', name);
  const outFile = path.join(outDir, 'route.ts');

  if (fs.existsSync(outFile)) {
    console.error(`❌ Already exists: ${path.relative(ROOT, outFile)}`);
    process.exit(1);
  }

  const template = renderTemplate(
    path.join(TEMPLATES_DIR, 'cron-route.template.ts'),
    { NAME: name }
  );

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outFile, template);

  console.log(`\n✅ Created: ${path.relative(ROOT, outFile)}`);
  console.log(`\nNext steps:`);
  console.log(`  1. Implement core logic in the TODO section`);
  console.log(`  2. Add to cron-jobs.yml schedule:`);
  console.log(`     - cron: '${schedule || '0 2 * * *'}'`);
  console.log(`       name: ${name}`);
  console.log(`       url: https://smartfinpro.com/api/cron/${name}`);
  console.log(`  3. Run: npm run refresh:agent-context`);

  // Update generated index
  updateGeneratedIndex(name, `/api/cron/${name}`);
}

async function scaffoldApi(name) {
  const segments = name.split('/');
  const outDir = path.join(ROOT, 'app', 'api', ...segments);
  const outFile = path.join(outDir, 'route.ts');

  if (fs.existsSync(outFile)) {
    console.error(`❌ Already exists: ${path.relative(ROOT, outFile)}`);
    process.exit(1);
  }

  const template = renderTemplate(
    path.join(TEMPLATES_DIR, 'api-route.template.ts'),
    { NAME: name }
  );

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outFile, template);

  console.log(`\n✅ Created: ${path.relative(ROOT, outFile)}`);
  console.log(`   Route: /api/${name}`);
  console.log(`\nNext steps:`);
  console.log(`  1. Implement GET/POST logic in the TODO sections`);
  console.log(`  2. Run: npm run refresh:agent-context`);
}

async function scaffoldServerAction(name) {
  const outFile = path.join(ROOT, 'lib', 'actions', `${name}.ts`);

  if (fs.existsSync(outFile)) {
    console.error(`❌ Already exists: ${path.relative(ROOT, outFile)}`);
    process.exit(1);
  }

  const pascalName = toPascalCase(name);
  const template = renderTemplate(
    path.join(TEMPLATES_DIR, 'server-action.template.ts'),
    { NAME: name, PASCAL_NAME: pascalName }
  );

  fs.writeFileSync(outFile, template);

  console.log(`\n✅ Created: ${path.relative(ROOT, outFile)}`);
  console.log(`   Export: get${pascalName}(params)`);
  console.log(`\nNext steps:`);
  console.log(`  1. Replace TODO_TABLE_NAME with actual Supabase table`);
  console.log(`  2. Define params interface`);
  console.log(`  3. Run: npm run refresh:agent-context`);
}

function updateGeneratedIndex(name, route) {
  // Silently re-run cron generator to keep generated index fresh
  const cronIndexFile = path.join(ROOT, 'memory', 'generated', 'cron-index.json');
  if (!fs.existsSync(cronIndexFile)) return;
  try {
    const index = JSON.parse(fs.readFileSync(cronIndexFile, 'utf-8'));
    if (!index.jobs.find(j => j.name === name)) {
      index.jobs.push({ name, route, file: `app/api/cron/${name}/route.ts`, hasAuth: true, hasLogCron: true });
      index.jobs.sort((a, b) => a.name.localeCompare(b.name));
      index.count = index.jobs.length;
      index._generated_at = new Date().toISOString();
      fs.writeFileSync(cronIndexFile, JSON.stringify(index, null, 2) + '\n');
    }
  } catch { /* ignore */ }
}

// ── Main ─────────────────────────────────────────────────────
async function main() {
  let type = typeArg;
  let name = nameArg;

  if (!type) {
    // Infer type from npm script name if possible
    const scriptName = process.env.npm_lifecycle_event || '';
    if (scriptName.includes('cron')) type = 'cron';
    else if (scriptName.includes('server-action')) type = 'server-action';
    else if (scriptName.includes('api')) type = 'api';
  }

  if (!type) {
    type = await prompt('Type (api / cron / server-action): ');
  }

  if (!['api', 'cron', 'server-action'].includes(type)) {
    console.error(`❌ Unknown type: ${type}. Must be api, cron, or server-action.`);
    process.exit(1);
  }

  if (!name) {
    const examples = { api: 'e.g. "my-endpoint" or "dashboard/my-route"', cron: 'e.g. "sync-offers"', 'server-action': 'e.g. "get-offer-stats"' };
    name = await prompt(`Name (${examples[type]}): `);
  }

  if (!name) {
    console.error('❌ Name is required.');
    process.exit(1);
  }

  // Validate name format
  if (!/^[\w/-]+$/.test(name)) {
    console.error(`❌ Invalid name: "${name}". Use lowercase letters, numbers, hyphens.`);
    process.exit(1);
  }

  if (type === 'cron') {
    const schedule = scheduleArg || (nameArg ? '0 2 * * *' : await prompt('Schedule (default: 0 2 * * *): ') || '0 2 * * *');
    await scaffoldCron(name, schedule);
  } else if (type === 'api') {
    await scaffoldApi(name);
  } else if (type === 'server-action') {
    await scaffoldServerAction(name);
  }
}

main().catch(err => {
  console.error('❌ Scaffold failed:', err.message);
  process.exit(1);
});
