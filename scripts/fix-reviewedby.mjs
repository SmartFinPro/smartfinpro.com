#!/usr/bin/env node
/**
 * fix-reviewedby.mjs
 * Updates all MDX reviewedBy fields to match the correct DB expert
 * for their market+category combination. This ensures the real bio
 * from Supabase is displayed instead of a generic fallback.
 *
 * Usage:
 *   node scripts/fix-reviewedby.mjs            # dry-run
 *   node scripts/fix-reviewedby.mjs --apply     # apply changes
 */

import fs from 'fs';
import path from 'path';
import { globSync } from 'fs';

// ── DB Expert Mapping (from supabase/migrations/020_experts.sql) ──

const CATEGORY_EXPERTS = {
  'us|trading':           'Robert Hayes, CMT, CFA',
  'us|cybersecurity':     'James Mitchell, CISSP, CISM',
  'us|personal-finance':  'Michael Torres, CFP, CFA',
  'us|business-banking':  'Michael Chen, CPA',
  'us|ai-tools':          'Dr. Sarah Chen, CPA, CFP',
  'uk|trading':           'James Blackwood, CFA, CISI',
  'ca|forex':             'Philippe Leblanc, CFA',
  'au|forex':             'James Liu, AFA',
};

const MARKET_DEFAULTS = {
  us: 'James Miller, CFA, CFP',
  uk: 'Sarah Thompson, CFA, CISI',
  ca: 'Marc Fontaine, CFA, CIM',
  au: 'Daniel Whitfield, CFA, AFA',
};

function getCorrectExpert(market, category) {
  const key = `${market}|${category}`;
  return CATEGORY_EXPERTS[key] || MARKET_DEFAULTS[market] || null;
}

function parseName(reviewedBy) {
  if (!reviewedBy) return null;
  return reviewedBy.split(',')[0].trim();
}

// ── Find all MDX files ──

const CONTENT_DIR = path.resolve('content');

function findMdxFiles(dir) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findMdxFiles(full));
    } else if (entry.name.endsWith('.mdx')) {
      results.push(full);
    }
  }
  return results;
}

// ── Parse frontmatter ──

function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;
  const fm = match[1];

  const getField = (field) => {
    // Handle both quoted and unquoted values
    const regex = new RegExp(`^${field}:\\s*['"]?([^'"\\n]+?)['"]?\\s*$`, 'm');
    const m = fm.match(regex);
    return m ? m[1].trim() : null;
  };

  return {
    market: getField('market'),
    category: getField('category'),
    reviewedBy: getField('reviewedBy'),
  };
}

// ── Main ──

const apply = process.argv.includes('--apply');
const verbose = process.argv.includes('--verbose');
const files = findMdxFiles(CONTENT_DIR);

let totalFiles = 0;
let matchCount = 0;
let fixedCount = 0;
let skippedCount = 0;
const changes = [];

for (const filePath of files) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const fm = parseFrontmatter(raw);
  if (!fm || !fm.market || !fm.category) continue;

  totalFiles++;

  // Skip files without reviewedBy or with "Editorial Board"
  if (!fm.reviewedBy || fm.reviewedBy.toLowerCase().includes('editorial')) {
    skippedCount++;
    continue;
  }

  const correctExpert = getCorrectExpert(fm.market, fm.category);
  if (!correctExpert) {
    skippedCount++;
    continue;
  }

  const currentName = parseName(fm.reviewedBy);
  const correctName = parseName(correctExpert);

  // Normalize for comparison
  const normalize = (n) => n?.toLowerCase().replace(/^dr\.?\s+/, '').replace(/\s+/g, ' ').trim();
  if (normalize(currentName) === normalize(correctName)) {
    matchCount++;
    if (verbose) {
      console.log(`  ✅ ${path.relative(CONTENT_DIR, filePath)} — ${fm.reviewedBy}`);
    }
    continue;
  }

  // Mismatch found
  const rel = path.relative(CONTENT_DIR, filePath);
  changes.push({
    file: filePath,
    rel,
    from: fm.reviewedBy,
    to: correctExpert,
  });

  if (apply) {
    // Replace the reviewedBy line in frontmatter
    // Handle various quoting styles
    const patterns = [
      new RegExp(`(reviewedBy:\\s*)['"]${escapeRegex(fm.reviewedBy)}['"]`, 'm'),
      new RegExp(`(reviewedBy:\\s*)${escapeRegex(fm.reviewedBy)}\\s*$`, 'm'),
    ];

    let updated = raw;
    let replaced = false;
    for (const pat of patterns) {
      if (pat.test(updated)) {
        updated = updated.replace(pat, `$1'${correctExpert}'`);
        replaced = true;
        break;
      }
    }

    if (!replaced) {
      // Fallback: match any reviewedBy line
      updated = updated.replace(
        /^(reviewedBy:\s*).+$/m,
        `$1'${correctExpert}'`
      );
    }

    // Also fix hardcoded reviewer mentions in JSX meta bars
    // Pattern: "Reviewed by <Name>, <Credentials>"
    if (currentName && updated.includes(`Reviewed by ${fm.reviewedBy}`)) {
      updated = updated.replace(
        `Reviewed by ${fm.reviewedBy}`,
        `Reviewed by ${correctExpert}`
      );
    }

    fs.writeFileSync(filePath, updated, 'utf8');
    fixedCount++;
  }
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ── Report ──

console.log('\n📊 reviewedBy Audit & Fix Report');
console.log(`   Total files scanned:  ${totalFiles}`);
console.log(`   Already matching:     ${matchCount}`);
console.log(`   Skipped (no/editorial): ${skippedCount}`);
console.log(`   Mismatches found:     ${changes.length}`);
if (apply) {
  console.log(`   Fixed:                ${fixedCount}`);
}
console.log('');

if (changes.length > 0) {
  console.log('Mismatches:');
  for (const c of changes) {
    console.log(`  ${c.rel}`);
    console.log(`    FROM: ${c.from}`);
    console.log(`    TO:   ${c.to}`);
  }
}

if (!apply && changes.length > 0) {
  console.log(`\n⚠️  Dry run — no files changed. Run with --apply to fix.`);
}

if (apply && fixedCount > 0) {
  console.log(`\n✅ ${fixedCount} files updated successfully.`);
}

if (changes.length === 0) {
  console.log('✅ All reviewedBy fields match their DB experts.');
}
