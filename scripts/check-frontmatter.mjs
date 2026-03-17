#!/usr/bin/env node
// ============================================================
// check-frontmatter.mjs — Validate MDX frontmatter fields
//
// Ensures review files have all required fields.
// Guides/indexes are checked with a lighter schema.
//
// Usage:
//   node scripts/check-frontmatter.mjs          # check only
//   node scripts/check-frontmatter.mjs --verbose # show all files
// ============================================================

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const CONTENT_DIR = path.join(ROOT, 'content');

const VERBOSE = process.argv.includes('--verbose');

// ── Required fields for review files ──────────────────────
const REVIEW_REQUIRED = [
  'title',
  'description',
  'author',
  'reviewedBy',
  'publishDate',
  'category',
  'market',
  'rating',
  'affiliateUrl',
  'affiliateDisclosure',
];

// ── Required fields for ALL content files ─────────────────
const BASE_REQUIRED = [
  'title',
  'description',
  'author',
  'category',
  'market',
];

// ── Detect if file is a review ────────────────────────────
function isReview(filePath, data) {
  const base = path.basename(filePath, '.mdx');

  // Explicit type flag
  if (data.type === 'review') return true;

  // Has review-specific fields
  if (data.reviewedBy && data.rating) return true;

  // Filename patterns
  if (/-review$/.test(base)) return true;
  if (/^best-/.test(base) && data.rating) return true;

  return false;
}

// ── Collect all MDX files ─────────────────────────────────
function collectMDXFiles(dir) {
  const files = [];

  function walk(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(currentDir, entry.name);
      if (entry.isDirectory() && entry.name !== '_templates' && entry.name !== 'node_modules') {
        walk(full);
      } else if (entry.isFile() && entry.name.endsWith('.mdx')) {
        files.push(full);
      }
    }
  }

  walk(dir);
  return files;
}

// ── Normalize legacy field names ──────────────────────────
function normalizeFieldName(data) {
  const normalized = { ...data };

  // Legacy → modern field mapping
  if (!normalized.publishDate && normalized.date) {
    normalized.publishDate = normalized.date;
  }
  if (!normalized.affiliateUrl && normalized.affiliate_link) {
    normalized.affiliateUrl = normalized.affiliate_link;
  }
  if (!normalized.rating && normalized.schema?.rating) {
    normalized.rating = normalized.schema.rating;
  }
  if (!normalized.reviewCount && normalized.schema?.review_count) {
    normalized.reviewCount = normalized.schema.review_count;
  }
  if (normalized.affiliateDisclosure === undefined) {
    // Default true if affiliate_link exists
    normalized.affiliateDisclosure = !!normalized.affiliateUrl;
  }

  return normalized;
}

// ── Main ──────────────────────────────────────────────────
const files = collectMDXFiles(CONTENT_DIR);
let errors = 0;
let warnings = 0;
let reviewCount = 0;
let guideCount = 0;
const errorFiles = [];

for (const file of files) {
  const rel = path.relative(ROOT, file);
  const raw = fs.readFileSync(file, 'utf-8');

  let data;
  try {
    const parsed = matter(raw);
    data = normalizeFieldName(parsed.data);
  } catch (e) {
    console.error(`  ❌ PARSE ERROR: ${rel} — ${e.message}`);
    errors++;
    errorFiles.push(rel);
    continue;
  }

  const review = isReview(file, data);
  const requiredFields = review ? REVIEW_REQUIRED : BASE_REQUIRED;
  const missing = [];

  if (review) reviewCount++;
  else guideCount++;

  for (const field of requiredFields) {
    const val = data[field];
    if (val === undefined || val === null || val === '') {
      missing.push(field);
    }
  }

  if (missing.length > 0) {
    const type = review ? 'REVIEW' : 'GUIDE';
    console.error(`  ❌ ${type}: ${rel}`);
    console.error(`     Missing: ${missing.join(', ')}`);
    errors++;
    errorFiles.push(rel);
  } else if (VERBOSE) {
    console.log(`  ✅ ${rel}`);
  }

  // Warnings for reviews missing recommended fields
  if (review) {
    const recommended = ['pros', 'cons', 'bestFor', 'pricing', 'faqs', 'sections'];
    const missingRecommended = recommended.filter(f => !data[f] || (Array.isArray(data[f]) && data[f].length === 0));
    if (missingRecommended.length > 0) {
      console.warn(`  ⚠️  WARN: ${rel} — missing recommended: ${missingRecommended.join(', ')}`);
      warnings++;
    }
  }
}

// ── Summary ───────────────────────────────────────────────
console.log('');
console.log(`📊 Frontmatter Validation Summary`);
console.log(`   Total files: ${files.length}`);
console.log(`   Reviews:     ${reviewCount}`);
console.log(`   Guides:      ${guideCount}`);
console.log(`   Errors:      ${errors}`);
console.log(`   Warnings:    ${warnings}`);

if (errors > 0) {
  console.log('');
  console.error(`❌ ${errors} file(s) have missing required frontmatter fields.`);
  console.error(`   Fix these files:`);
  for (const f of errorFiles) {
    console.error(`     - ${f}`);
  }
  process.exit(1);
} else {
  console.log('');
  console.log('✅ All frontmatter fields valid.');
  process.exit(0);
}
