#!/usr/bin/env node
// ============================================================
// check-content-freshness.mjs — CI gate for content staleness.
//
// Fails when any review/comparison MDX file has a
// `dataVerifiedDate` (or `modifiedDate`) older than MAX_AGE_DAYS.
//
// Usage:
//   node scripts/check-content-freshness.mjs              # default 90 days
//   node scripts/check-content-freshness.mjs --days=120   # custom threshold
//   node scripts/check-content-freshness.mjs --warn-only  # warn, don't fail
//
// Exit code:
//   0 — all content fresh
//   1 — stale content found (unless --warn-only)
// ============================================================

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const CONTENT_DIR = path.join(ROOT, 'content');

// ── CLI args ─────────────────────────────────────────────────
const daysArg = process.argv.find(a => a.startsWith('--days='));
const MAX_AGE_DAYS = daysArg ? parseInt(daysArg.split('=')[1], 10) : 90;
const WARN_ONLY = process.argv.includes('--warn-only');

const NOW = new Date();
const CUTOFF = new Date(NOW.getTime() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000);

// ── Helpers ──────────────────────────────────────────────────

function collectMDXFiles(dir) {
  const files = [];
  function walk(d) {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory() && !['_templates', 'node_modules'].includes(entry.name)) walk(full);
      else if (entry.isFile() && entry.name.endsWith('.mdx')) files.push(full);
    }
  }
  walk(dir);
  return files;
}

function isReview(data) {
  if (data.rating && data.reviewedBy) return true;
  if (data.type === 'review' || data.type === 'comparison') return true;
  return false;
}

function parseDate(val) {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

function daysSince(date) {
  return Math.floor((NOW.getTime() - date.getTime()) / (24 * 60 * 60 * 1000));
}

// ── Main ─────────────────────────────────────────────────────

const files = collectMDXFiles(CONTENT_DIR);
let staleCount = 0;
let checkedCount = 0;
const staleFiles = [];

for (const file of files) {
  const rel = path.relative(ROOT, file);
  const raw = fs.readFileSync(file, 'utf-8');

  let data;
  try {
    data = matter(raw).data;
  } catch {
    continue; // parse errors handled by check-frontmatter.mjs
  }

  if (!isReview(data)) continue;
  checkedCount++;

  // Prefer dataVerifiedDate, fall back to modifiedDate, then publishDate
  const verifiedDate = parseDate(data.dataVerifiedDate)
    || parseDate(data.modifiedDate)
    || parseDate(data.publishDate)
    || parseDate(data.date);

  if (!verifiedDate) {
    console.warn(`  ⚠️  NO DATE: ${rel} — no dataVerifiedDate/modifiedDate found`);
    staleCount++;
    staleFiles.push({ rel, age: '∞', date: 'none' });
    continue;
  }

  const age = daysSince(verifiedDate);

  if (verifiedDate < CUTOFF) {
    const icon = WARN_ONLY ? '⚠️ ' : '❌';
    console.error(`  ${icon} STALE (${age}d): ${rel} — last verified: ${verifiedDate.toISOString().split('T')[0]}`);
    staleCount++;
    staleFiles.push({ rel, age, date: verifiedDate.toISOString().split('T')[0] });
  }
}

// ── Summary ──────────────────────────────────────────────────
console.log('');
console.log('📊 Content Freshness Gate');
console.log(`   Reviews checked: ${checkedCount}`);
console.log(`   Max age:         ${MAX_AGE_DAYS} days`);
console.log(`   Cutoff date:     ${CUTOFF.toISOString().split('T')[0]}`);
console.log(`   Stale files:     ${staleCount}`);

if (staleCount > 0 && !WARN_ONLY) {
  console.log('');
  console.error(`❌ ${staleCount} file(s) exceed the ${MAX_AGE_DAYS}-day freshness threshold.`);
  console.error('   Update dataVerifiedDate after re-verifying claims:');
  for (const f of staleFiles) {
    console.error(`     - ${f.rel} (${f.age} days old, verified: ${f.date})`);
  }
  process.exit(1);
} else if (staleCount > 0 && WARN_ONLY) {
  console.log('');
  console.warn(`⚠️  ${staleCount} file(s) are stale (warn-only mode, not blocking).`);
  process.exit(0);
} else {
  console.log('');
  console.log('✅ All content within freshness threshold.');
  process.exit(0);
}
