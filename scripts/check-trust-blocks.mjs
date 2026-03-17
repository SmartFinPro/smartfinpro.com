#!/usr/bin/env node
// ============================================================
// check-trust-blocks.mjs — Validate EEAT trust elements in MDX
//
// Ensures review files have the required trust/EEAT elements
// in their frontmatter (reviewedBy, modifiedDate, rating range,
// pros, cons, bestFor, faqs, sections).
//
// Usage:
//   node scripts/check-trust-blocks.mjs          # check only
//   node scripts/check-trust-blocks.mjs --verbose # show all files
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

// ── Detect if file is a review (same logic as check-frontmatter.mjs)
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

// ── Collect all MDX files (same logic as check-frontmatter.mjs)
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

// ── Normalize legacy field names (same as check-frontmatter.mjs)
function normalizeFieldName(data) {
  const normalized = { ...data };

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
    normalized.affiliateDisclosure = !!normalized.affiliateUrl;
  }

  return normalized;
}

// ── Main ──────────────────────────────────────────────────
const files = collectMDXFiles(CONTENT_DIR);
let errors = 0;
let warnings = 0;
let reviewCount = 0;
let totalCount = 0;
const errorFiles = [];

for (const file of files) {
  const rel = path.relative(ROOT, file);
  const raw = fs.readFileSync(file, 'utf-8');
  totalCount++;

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
  const fileErrors = [];
  const fileWarnings = [];

  // ── Checks for ALL content files ────────────────────────
  if (!data.author) {
    fileWarnings.push('missing author');
  }

  // ── Checks for REVIEW files only ───────────────────────
  if (review) {
    reviewCount++;

    // ERRORS (critical for EEAT — cause exit code 1)
    if (!data.reviewedBy) {
      fileErrors.push('missing reviewedBy (critical for EEAT)');
    }
    if (!data.modifiedDate) {
      fileErrors.push('missing modifiedDate (critical for freshness signal)');
    }
    if (data.rating !== undefined && data.rating !== null) {
      const rating = Number(data.rating);
      if (isNaN(rating) || rating < 1.0 || rating > 5.0) {
        fileErrors.push(`rating ${data.rating} is not between 1.0 and 5.0`);
      }
    }

    // WARNINGS (recommended for trust but not blocking)
    if (!data.pros || (Array.isArray(data.pros) && data.pros.length < 3)) {
      const count = Array.isArray(data.pros) ? data.pros.length : 0;
      fileWarnings.push(`pros ${!data.pros ? 'missing' : `has only ${count} items`} (should have 3+)`);
    }
    if (!data.cons || (Array.isArray(data.cons) && data.cons.length < 3)) {
      const count = Array.isArray(data.cons) ? data.cons.length : 0;
      fileWarnings.push(`cons ${!data.cons ? 'missing' : `has only ${count} items`} (should have 3+)`);
    }
    if (!data.bestFor) {
      fileWarnings.push('missing bestFor');
    }
    if (!data.faqs || (Array.isArray(data.faqs) && data.faqs.length < 3)) {
      const count = Array.isArray(data.faqs) ? data.faqs.length : 0;
      fileWarnings.push(`faqs ${!data.faqs ? 'missing' : `has only ${count} items`} (should have 3+)`);
    }
    if (!data.sections || (Array.isArray(data.sections) && data.sections.length === 0)) {
      fileWarnings.push('missing sections');
    }
  }

  // ── Output ─────────────────────────────────────────────
  if (fileErrors.length > 0) {
    const type = review ? 'REVIEW' : 'CONTENT';
    console.error(`  ❌ ${type}: ${rel}`);
    for (const err of fileErrors) {
      console.error(`     ERROR: ${err}`);
    }
    errors++;
    errorFiles.push(rel);
  }

  if (fileWarnings.length > 0) {
    console.warn(`  ⚠️  WARN: ${rel}`);
    for (const warn of fileWarnings) {
      console.warn(`     ${warn}`);
    }
    warnings++;
  }

  if (fileErrors.length === 0 && fileWarnings.length === 0 && VERBOSE) {
    console.log(`  ✅ ${rel}`);
  }
}

// ── Summary ───────────────────────────────────────────────
console.log('');
console.log(`📊 EEAT Trust Block Validation Summary`);
console.log(`   Total files: ${totalCount}`);
console.log(`   Reviews:     ${reviewCount}`);
console.log(`   Errors:      ${errors}`);
console.log(`   Warnings:    ${warnings}`);

if (errors > 0) {
  console.log('');
  console.error(`❌ ${errors} file(s) have EEAT trust block errors.`);
  console.error(`   Fix these files:`);
  for (const f of errorFiles) {
    console.error(`     - ${f}`);
  }
  process.exit(1);
} else {
  console.log('');
  if (warnings > 0) {
    console.log(`⚠️  ${warnings} file(s) have trust block warnings (non-blocking).`);
  }
  console.log('✅ All EEAT trust block checks passed.');
  process.exit(0);
}
