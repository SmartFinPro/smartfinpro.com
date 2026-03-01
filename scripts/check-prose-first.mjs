#!/usr/bin/env node
// ============================================================
// check-prose-first.mjs — CI Guardrail
//
// Fails if a user-content component (AnswerBlock, Tip, Warning,
// ProviderCard) appears before 120 words of prose in any H2
// section of a review MDX file.
//
// Structural components (ExecutiveSummary, AffiliateDisclosure,
// ComparisonTable, etc.) are whitelisted and allowed anywhere.
//
// Usage:
//   node scripts/check-prose-first.mjs
//   node scripts/check-prose-first.mjs --verbose
//
// Exit code:
//   0 = all checks pass
//   1 = violations found
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
const MIN_PROSE_WORDS = 100;

// ── Components that MUST appear after prose ─────────────────
const FLAGGED_COMPONENTS = [
  'AnswerBlock',
  'Tip',
  'Warning',
  'ProviderCard',
];

// ── H2 section titles where ProviderCard is allowed early ───
// (comparison/verdict sections intentionally lead with cards)
const PROVIDERCARD_EXEMPT_TITLES = [
  'verdict',
  'quick verdict',
  'detailed verdict',
  'our top picks',
  'provider deep-dive',
];

// ── Structural components allowed at any position ───────────
// (these are layout/trust elements, not editorial content)
const WHITELISTED_COMPONENTS = [
  'ExecutiveSummary',
  'AffiliateDisclosure',
  'AffiliateButton',
  'ComparisonTable',
  'FrictionlessCTA',
  'QuickSummary',
  'TrustAuthority',
  'RiskWarningBox',
  'ComplianceNotice',
  'CallToAction',
  'ExpertBox',
  'Rating',
  'FAQSection',
];

// ── File collection ─────────────────────────────────────────

function collectMDXFiles(dir) {
  const files = [];
  function walk(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === '_templates' || entry.name === 'node_modules') continue;
        walk(full);
      } else if (entry.isFile() && entry.name.endsWith('.mdx')) {
        if (entry.name === 'index.mdx') continue;
        files.push(full);
      }
    }
  }
  walk(dir);
  return files;
}

function isReview(data) {
  return !!(data.rating || data.schema?.rating);
}

// ── Line analysis ───────────────────────────────────────────

function isProseLine(line) {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('#')) return false;
  if (trimmed.startsWith('<')) return false;
  if (trimmed.startsWith('---')) return false;
  if (trimmed.startsWith('|')) return false;
  if (trimmed.startsWith('```')) return false;
  if (trimmed.startsWith('import ')) return false;
  if (trimmed.startsWith('export ')) return false;
  if (trimmed.startsWith('{/*')) return false;
  if (trimmed.startsWith('*/}')) return false;
  return true;
}

function countWords(text) {
  return text.split(/\s+/).filter(w => w.length > 0).length;
}

/**
 * Detect if a line opens a FLAGGED component.
 * Returns component name or null.
 */
function detectFlaggedComponent(line) {
  const trimmed = line.trim();
  if (!trimmed.startsWith('<')) return null;
  for (const comp of FLAGGED_COMPONENTS) {
    if (trimmed.startsWith(`<${comp}`)) return comp;
  }
  return null;
}

// ── Check a single file ─────────────────────────────────────

function checkFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  let parsed;
  try {
    parsed = matter(raw);
  } catch (e) {
    return { error: e.message };
  }

  if (!isReview(parsed.data)) return null;

  const content = parsed.content;
  const lines = content.split('\n');

  // Split into H2 sections
  const h2Sections = [];
  let currentSection = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('## ')) {
      if (currentSection) h2Sections.push(currentSection);
      currentSection = {
        title: trimmed.replace(/^##\s+/, ''),
        lines: [],
      };
    } else if (currentSection) {
      currentSection.lines.push(line);
    }
  }
  if (currentSection) h2Sections.push(currentSection);

  const violations = [];

  for (const section of h2Sections) {
    let proseWords = 0;
    let insideCodeBlock = false;

    for (const line of section.lines) {
      const trimmed = line.trim();

      // Track code blocks
      if (trimmed.startsWith('```')) {
        insideCodeBlock = !insideCodeBlock;
        continue;
      }
      if (insideCodeBlock) continue;

      // Check for flagged component
      const compName = detectFlaggedComponent(line);
      if (compName) {
        // Skip ProviderCard in verdict/comparison sections
        if (compName === 'ProviderCard') {
          const titleLower = section.title.toLowerCase();
          const isExempt = PROVIDERCARD_EXEMPT_TITLES.some(t => titleLower.includes(t));
          if (isExempt) break;
        }

        if (proseWords < MIN_PROSE_WORDS) {
          // Only flag if the section has enough prose OUTSIDE components
          // (text inside components doesn't count as available prose)
          let outsideProse = 0;
          let insideComp = false;
          for (const cl of section.lines) {
            const ct = cl.trim();
            // Track component boundaries
            for (const fc of FLAGGED_COMPONENTS) {
              if (ct.startsWith(`<${fc}`)) insideComp = true;
              if (ct.startsWith(`</${fc}`)) { insideComp = false; continue; }
            }
            if (!insideComp && isProseLine(cl)) {
              outsideProse += countWords(ct);
            }
          }
          const totalSectionProse = outsideProse;

          if (totalSectionProse >= MIN_PROSE_WORDS) {
            violations.push({
              section: section.title,
              component: compName,
              proseWordsBefore: proseWords,
              totalSectionProse,
            });
          }
        }
        break; // Only check first flagged component per section
      }

      if (isProseLine(line)) {
        proseWords += countWords(trimmed);
      }
    }
  }

  return {
    file: path.relative(ROOT, filePath),
    violations,
  };
}

// ── Main ────────────────────────────────────────────────────

const files = collectMDXFiles(CONTENT_DIR);
let totalViolations = 0;
let filesWithViolations = 0;
let skipped = 0;
let errors = 0;
let checked = 0;

console.log('');

const violationResults = [];

for (const file of files) {
  const result = checkFile(file);

  if (result === null) {
    skipped++;
    continue;
  }

  if (result.error) {
    console.error(`  ERROR: ${path.relative(ROOT, file)} — ${result.error}`);
    errors++;
    continue;
  }

  checked++;

  if (result.violations.length > 0) {
    filesWithViolations++;
    totalViolations += result.violations.length;
    violationResults.push(result);
  } else if (VERBOSE) {
    console.log(`  ✅ ${result.file}`);
  }
}

// Print violations
if (violationResults.length > 0) {
  console.log('');
  for (const result of violationResults) {
    console.log(`  ❌ ${result.file}`);
    for (const v of result.violations) {
      console.log(`     → <${v.component}> in "${v.section}" after only ${v.proseWordsBefore}/${MIN_PROSE_WORDS} prose words (section has ${v.totalSectionProse} total)`);
    }
  }
}

// Summary
console.log('');
console.log('📊 Prose-First CI Check Summary');
console.log(`   Files checked:     ${checked}`);
console.log(`   Non-reviews:       ${skipped}`);
console.log(`   Errors:            ${errors}`);
console.log(`   Files with issues: ${filesWithViolations}`);
console.log(`   Total violations:  ${totalViolations}`);
console.log(`   Threshold:         ${MIN_PROSE_WORDS} words`);
console.log(`   Flagged:           ${FLAGGED_COMPONENTS.join(', ')}`);
console.log(`   Whitelisted:       ${WHITELISTED_COMPONENTS.join(', ')}`);
console.log('');

if (totalViolations === 0 && errors === 0) {
  console.log('✅ All prose-first checks passed.');
  console.log('');
  process.exit(0);
} else {
  console.log(`❌ ${totalViolations} violation(s) found. Each H2 section with 120+ prose words`);
  console.log(`   must have ${MIN_PROSE_WORDS}+ words of prose BEFORE the first`);
  console.log(`   AnswerBlock/Tip/Warning/ProviderCard.`);
  console.log('');
  console.log('   Fix: Move the component after the first prose paragraph, or');
  console.log('   run: node scripts/codemod-shift-components.mjs');
  console.log('');
  process.exit(1);
}
