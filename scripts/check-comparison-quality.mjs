#!/usr/bin/env node
// ============================================================
// check-comparison-quality.mjs — Audit-grade quality gate for
// comparison & review MDX files.
//
// Two enforcement tiers:
//   STRICT (files WITH dataVerifiedDate) — errors block CI
//   LEGACY (files WITHOUT dataVerifiedDate) — warnings only
//
// MIGRATION PLAN → full strict enforcement:
//   Phase 1 (now):  New/updated files add dataVerifiedDate → strict tier
//   Phase 2 (Q2):   Batch-add dataVerifiedDate to all US market files
//   Phase 3 (Q3):   Batch-add to UK/CA/AU files
//   Phase 4 (Q4):   Flip default: run with --strict in CI (all files = errors)
//   Track progress:  node scripts/check-comparison-quality.mjs --verbose | grep STRICT
//
// Checks:
//   1. Forbidden claim patterns (unbacked performance promises)
//   2. Required disclaimers present (AffiliateDisclosure, Warning)
//   3. sections[].id ↔ <div id="..."/> anchor sync
//   4. Mandatory Integrity link present
//   5. dataVerifiedDate field exists for reviews
//
// Usage:
//   node scripts/check-comparison-quality.mjs          # all files
//   node scripts/check-comparison-quality.mjs --strict  # enforce on ALL files
//   node scripts/check-comparison-quality.mjs --verbose # show passing files
//
// Exit code 1 on any error in strict-tier files (blocks CI).
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
const FORCE_STRICT = process.argv.includes('--strict');

// ── Forbidden claim patterns ─────────────────────────────────
// Each: [regex, reason, negativeContextRegex?]
// negativeContextRegex: if this ALSO matches the same line, it's a false positive
// (e.g., "there are no guaranteed returns" is fine)

const FORBIDDEN_PATTERNS = [
  // Unsubstantiated performance promises
  [/averaging \d+-\d+% annual returns/i, 'Unbacked performance claim (averaging X-Y% returns)'],
  [/guaranteed returns/i, 'Guaranteed returns claim', /no guaranteed|not guaranteed|never guaranteed|aren't guaranteed/i],
  [/risk[- ]free/i, 'Risk-free claim', /no.{0,10}risk[- ]free|not risk[- ]free|isn't risk[- ]free|aren't risk[- ]free|never risk[- ]free/i],
  [/\bno risk\b/i, 'No-risk claim', /no risk[- ]free|there is no risk-free|no risk guarantee/i],
  [/you will (earn|make|profit)/i, 'Promissory earnings language'],

  // Hardcoded audit scores (should use "Certified" instead)
  [/audit.{0,10}(score|grade).{0,5}\d+\/\d+/i, 'Hardcoded audit score (use "Certified" status)'],

  // Unverifiable institutional claims
  [/former.{0,20}(goldman|morgan stanley|jpmorgan|blackrock)/i, 'Unverifiable institutional employment claim'],
  [/series [67]\/6[36]/i, 'Unverifiable license claim (Series 7/63/66)'],
];

// ── Required elements (strict-tier only) ─────────────────────

const REQUIRED_ELEMENTS = [
  { pattern: /<AffiliateDisclosure\b/, name: 'AffiliateDisclosure component' },
  { pattern: /<Warning\b/, name: 'Warning/Risk Disclosure component' },
  { pattern: /\/integrity/, name: 'Link to /integrity page' },
];

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

/** Check if a forbidden pattern is a false positive (appears in negative context) */
function isFalsePositive(content, regex, negativeContextRegex) {
  if (!negativeContextRegex) return false;
  // Check each line that matches the forbidden pattern
  const lines = content.split('\n');
  const matchingLines = lines.filter(line => regex.test(line));
  // If ALL matching lines also match the negative context, it's a false positive
  return matchingLines.length > 0 && matchingLines.every(line => negativeContextRegex.test(line));
}

// ── Main ─────────────────────────────────────────────────────

const files = collectMDXFiles(CONTENT_DIR);
let errorCount = 0;
let warnCount = 0;
let strictCount = 0;
let legacyCount = 0;
const errorFiles = [];

for (const file of files) {
  const rel = path.relative(ROOT, file);
  const raw = fs.readFileSync(file, 'utf-8');

  let data, content;
  try {
    const parsed = matter(raw);
    data = parsed.data;
    content = parsed.content;
  } catch (e) {
    console.error(`  ❌ PARSE ERROR: ${rel} — ${e.message}`);
    errorCount++;
    errorFiles.push(rel);
    continue;
  }

  if (!isReview(data)) {
    if (VERBOSE) console.log(`  ⏭  SKIP (not review): ${rel}`);
    continue;
  }

  // Strict tier: files with dataVerifiedDate (new quality standard)
  const isStrict = FORCE_STRICT || !!data.dataVerifiedDate;
  if (isStrict) strictCount++;
  else legacyCount++;

  const fileErrors = [];
  const fileWarns = [];

  // ── Check 1: Forbidden patterns (always enforced) ────────
  for (const entry of FORBIDDEN_PATTERNS) {
    const [regex, reason, negativeCtx] = entry;
    if (regex.test(content) && !isFalsePositive(content, regex, negativeCtx)) {
      if (isStrict) fileErrors.push(reason);
      else fileWarns.push(reason);
    }
  }

  // ── Check 2: Required elements (strict-tier only) ────────
  if (isStrict) {
    for (const { pattern, name } of REQUIRED_ELEMENTS) {
      if (!pattern.test(content)) {
        fileErrors.push(`Missing required: ${name}`);
      }
    }
  }

  // ── Check 3: sections[].id ↔ anchor sync (strict only) ──
  if (isStrict && Array.isArray(data.sections) && data.sections.length > 0) {
    for (const section of data.sections) {
      if (!section.id) continue;
      const anchorRegex = new RegExp(`id=["']${section.id}["']`);
      if (!anchorRegex.test(content)) {
        fileErrors.push(`Anchor missing for section "${section.id}"`);
      }
    }
  }

  // ── Check 4: dataVerifiedDate enforcement ─────────────────
  // All reviews SHOULD have dataVerifiedDate. Missing = warning
  // (promotes migration to strict tier over time).
  if (!data.dataVerifiedDate) {
    fileWarns.push('Missing frontmatter: dataVerifiedDate — add to enable strict quality enforcement');
  }

  // ── Report ───────────────────────────────────────────────
  if (fileErrors.length > 0) {
    console.error(`  ❌ [STRICT] ${rel}`);
    for (const e of fileErrors) console.error(`     ERROR: ${e}`);
    errorCount += fileErrors.length;
    if (!errorFiles.includes(rel)) errorFiles.push(rel);
  }
  if (fileWarns.length > 0) {
    // Legacy warnings are non-blocking — suppressed per-file, shown as summary only
    if (VERBOSE) {
      console.warn(`  ⚠️  [LEGACY] ${rel}`);
      for (const w of fileWarns) console.warn(`     WARN: ${w}`);
    }
    warnCount += fileWarns.length;
  }
  if (fileErrors.length === 0 && fileWarns.length === 0 && VERBOSE) {
    console.log(`  ✅ ${rel}`);
  }
}

// ── Summary ──────────────────────────────────────────────────
console.log('');
console.log('📊 Comparison Quality Gate Summary');
console.log(`   Strict-tier (with dataVerifiedDate): ${strictCount}`);
console.log(`   Legacy-tier (warnings only):         ${legacyCount}`);
console.log(`   Errors (blocking):                   ${errorCount}`);
console.log(`   Warnings (non-blocking):             ${warnCount}`);

if (errorCount > 0) {
  console.log('');
  console.error(`❌ ${errorCount} error(s) in strict-tier files. Fix before deploy:`);
  for (const f of errorFiles) console.error(`     - ${f}`);
  process.exit(1);
} else {
  console.log('');
  console.log('✅ All strict-tier quality checks passed.');
  if (warnCount > 0) {
    console.log(`   (${warnCount} warnings in legacy files — fix when updating those files)`);
  }
  process.exit(0);
}
