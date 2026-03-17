#!/usr/bin/env node
// ============================================================
// audit-content-rhythm.mjs — Analyze MDX reviews for 80/20
// prose-to-component ratio
//
// Flags violations in content rhythm: too many components,
// not enough prose, components before 150 words of prose
// in H2 sections.
//
// Usage:
//   node scripts/audit-content-rhythm.mjs
//   node scripts/audit-content-rhythm.mjs --verbose
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

// ── Known component names to track ─────────────────────────
const KNOWN_COMPONENTS = [
  'ExecutiveSummary',
  'AnswerBlock',
  'Tip',
  'Warning',
  'ProviderCard',
  'AffiliateButton',
  'FAQSection',
  'ComparisonTable',
  'AffiliateDisclosure',
  'FrictionlessCTA',
];

// ── Violation thresholds ───────────────────────────────────
const THRESHOLDS = {
  minProseRatio: 0.70,
  maxAnswerBlocks: 4,
  maxTips: 3,
  maxWarnings: 3,
  maxProviderCards: 2,
  minProseWordsBeforeComponent: 150,
};

// ── Detect if file is a review (has rating) ────────────────
function isReview(data) {
  if (data.rating) return true;
  if (data.schema?.rating) return true;
  return false;
}

// ── Collect all MDX files, skip _templates and index.mdx ───
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
        // Skip index.mdx files
        if (entry.name === 'index.mdx') continue;
        files.push(full);
      }
    }
  }

  walk(dir);
  return files;
}

// ── Check if a line is a known component line ──────────────
function isComponentLine(line) {
  const trimmed = line.trim();
  if (!trimmed.startsWith('<')) return false;

  // Check for known component names (opening, closing, or self-closing)
  for (const comp of KNOWN_COMPONENTS) {
    if (trimmed.startsWith(`<${comp}`) || trimmed.startsWith(`</${comp}`)) {
      return comp;
    }
  }
  return false;
}

// ── Check if a line is prose ───────────────────────────────
function isProseLine(line) {
  const trimmed = line.trim();
  if (!trimmed) return false;                          // empty line
  if (trimmed.startsWith('#')) return false;            // markdown header
  if (trimmed.startsWith('<')) return false;            // any JSX/HTML tag
  if (trimmed.startsWith('---')) return false;          // horizontal rule / frontmatter delimiter
  if (trimmed.startsWith('|')) return false;            // table row
  if (trimmed.startsWith('```')) return false;          // code fence
  if (trimmed.startsWith('import ')) return false;      // import statement
  if (trimmed.startsWith('export ')) return false;      // export statement
  return true;
}

// ── Count words in a string ────────────────────────────────
function countWords(text) {
  return text.split(/\s+/).filter(w => w.length > 0).length;
}

// ── Analyze a single MDX review ────────────────────────────
function analyzeReview(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  let parsed;
  try {
    parsed = matter(raw);
  } catch (e) {
    return { error: `Parse error: ${e.message}` };
  }

  const data = parsed.data;
  if (!isReview(data)) return null; // Not a review

  const content = parsed.content;
  const lines = content.split('\n');

  let proseLines = 0;
  let componentLines = 0;
  let totalWordCount = 0;
  const componentCounts = {};
  const violations = [];

  // Initialize component counts
  for (const comp of KNOWN_COMPONENTS) {
    componentCounts[comp] = 0;
  }

  // Track component instances (only count opening tags, not closing)
  const componentInstanceRegex = new RegExp(
    `<(${KNOWN_COMPONENTS.join('|')})(?:\\s|>|\\/)`,
    'g'
  );

  // Count component instances in the full content
  let match;
  while ((match = componentInstanceRegex.exec(content)) !== null) {
    const compName = match[1];
    componentCounts[compName]++;
  }

  // ── H2 section analysis ────────────────────────────────
  // Split content into H2 sections and check prose before first component
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

  // Check each H2 section for 150 words of prose before first component
  for (const section of h2Sections) {
    let proseWordsBefore = 0;
    let foundComponentBeforeThreshold = false;

    for (const line of section.lines) {
      const compMatch = isComponentLine(line);
      if (compMatch) {
        if (proseWordsBefore < THRESHOLDS.minProseWordsBeforeComponent) {
          foundComponentBeforeThreshold = true;
          violations.push(
            `H2 "${section.title}" has <${compMatch}> after only ${proseWordsBefore} words of prose (need ${THRESHOLDS.minProseWordsBeforeComponent})`
          );
        }
        break; // Only check up to the first component
      }

      if (isProseLine(line)) {
        proseWordsBefore += countWords(line.trim());
      }
    }
  }

  // ── Line-by-line analysis ──────────────────────────────
  let insideFrontmatter = false;
  let frontmatterCount = 0;
  let insideCodeBlock = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Track code blocks
    if (trimmed.startsWith('```')) {
      insideCodeBlock = !insideCodeBlock;
      continue;
    }
    if (insideCodeBlock) continue;

    // Check if it's a component line
    if (isComponentLine(trimmed)) {
      componentLines++;
      continue;
    }

    // Also count closing tags and component content lines inside components
    // (lines starting with < that aren't known components are still component-related)
    if (trimmed.startsWith('<') || trimmed.startsWith('</')) {
      componentLines++;
      continue;
    }

    // Prose line
    if (isProseLine(line)) {
      proseLines++;
      totalWordCount += countWords(trimmed);
    }
  }

  // ── Calculate prose ratio ──────────────────────────────
  const totalContentLines = proseLines + componentLines;
  const proseRatio = totalContentLines > 0 ? proseLines / totalContentLines : 1;

  // ── Check threshold violations ─────────────────────────
  if (proseRatio < THRESHOLDS.minProseRatio) {
    violations.push(
      `Prose ratio ${(proseRatio * 100).toFixed(1)}% is below ${(THRESHOLDS.minProseRatio * 100).toFixed(0)}% threshold`
    );
  }

  if (componentCounts.AnswerBlock > THRESHOLDS.maxAnswerBlocks) {
    violations.push(
      `${componentCounts.AnswerBlock} AnswerBlocks (max ${THRESHOLDS.maxAnswerBlocks})`
    );
  }

  if (componentCounts.Tip > THRESHOLDS.maxTips) {
    violations.push(
      `${componentCounts.Tip} Tips (max ${THRESHOLDS.maxTips})`
    );
  }

  if (componentCounts.Warning > THRESHOLDS.maxWarnings) {
    violations.push(
      `${componentCounts.Warning} Warnings (max ${THRESHOLDS.maxWarnings})`
    );
  }

  if (componentCounts.ProviderCard > THRESHOLDS.maxProviderCards) {
    violations.push(
      `${componentCounts.ProviderCard} ProviderCards (max ${THRESHOLDS.maxProviderCards})`
    );
  }

  return {
    file: path.relative(ROOT, filePath),
    totalWordCount,
    proseLines,
    componentLines,
    proseRatio,
    componentCounts,
    violations,
    status: violations.length === 0 ? 'PASS' : 'NEEDS-REWRITE',
  };
}

// ── Main ──────────────────────────────────────────────────
const files = collectMDXFiles(CONTENT_DIR);
const results = [];
let skipped = 0;
let parseErrors = 0;

for (const file of files) {
  const result = analyzeReview(file);
  if (result === null) {
    skipped++;
    continue;
  }
  if (result.error) {
    console.error(`  ERROR: ${path.relative(ROOT, file)} — ${result.error}`);
    parseErrors++;
    continue;
  }
  results.push(result);
}

// Sort by violations count (most violations first), then by prose ratio ascending
results.sort((a, b) => {
  if (b.violations.length !== a.violations.length) {
    return b.violations.length - a.violations.length;
  }
  return a.proseRatio - b.proseRatio;
});

// ── Output ────────────────────────────────────────────────

console.log('');
console.log('='.repeat(140));
console.log('  CONTENT RHYTHM AUDIT — 80/20 Prose-to-Component Ratio');
console.log('='.repeat(140));
console.log('');

// Table header
const COL = {
  file: 52,
  words: 7,
  ratio: 7,
  ab: 4,
  tip: 4,
  warn: 4,
  pc: 4,
  aff: 4,
  viol: 5,
  status: 14,
};

const header =
  'File'.padEnd(COL.file) +
  'Words'.padStart(COL.words) +
  'Ratio'.padStart(COL.ratio) +
  ' AB'.padStart(COL.ab) +
  ' Tip'.padStart(COL.tip) +
  ' Wrn'.padStart(COL.warn) +
  ' PC'.padStart(COL.pc) +
  ' Aff'.padStart(COL.aff) +
  'Viol'.padStart(COL.viol) +
  '  Status'.padEnd(COL.status);

console.log(header);
console.log('-'.repeat(140));

let passCount = 0;
let failCount = 0;
let totalViolations = 0;

for (const r of results) {
  const shortFile = r.file.length > COL.file - 2
    ? '...' + r.file.slice(-(COL.file - 5))
    : r.file;

  const ratioStr = `${(r.proseRatio * 100).toFixed(0)}%`;
  const statusIcon = r.status === 'PASS' ? 'PASS' : 'NEEDS-REWRITE';

  const row =
    shortFile.padEnd(COL.file) +
    String(r.totalWordCount).padStart(COL.words) +
    ratioStr.padStart(COL.ratio) +
    String(r.componentCounts.AnswerBlock).padStart(COL.ab) +
    String(r.componentCounts.Tip).padStart(COL.tip) +
    String(r.componentCounts.Warning).padStart(COL.warn) +
    String(r.componentCounts.ProviderCard).padStart(COL.pc) +
    String(r.componentCounts.AffiliateButton).padStart(COL.aff) +
    String(r.violations.length).padStart(COL.viol) +
    '  ' + statusIcon;

  console.log(row);

  if (r.status === 'PASS') passCount++;
  else failCount++;
  totalViolations += r.violations.length;
}

console.log('-'.repeat(140));
console.log('');

// ── Violation Details ─────────────────────────────────────
if (failCount > 0) {
  console.log('');
  console.log('='.repeat(80));
  console.log('  VIOLATION DETAILS');
  console.log('='.repeat(80));

  for (const r of results) {
    if (r.violations.length === 0) continue;

    console.log('');
    console.log(`  ${r.file}`);
    console.log(`  ${'─'.repeat(r.file.length)}`);
    for (const v of r.violations) {
      console.log(`    - ${v}`);
    }
  }
}

// ── Summary ───────────────────────────────────────────────
console.log('');
console.log('='.repeat(80));
console.log('  SUMMARY');
console.log('='.repeat(80));
console.log(`  Total MDX files scanned:   ${files.length}`);
console.log(`  Non-review files skipped:  ${skipped}`);
console.log(`  Parse errors:              ${parseErrors}`);
console.log(`  Reviews analyzed:          ${results.length}`);
console.log(`  PASS:                      ${passCount}`);
console.log(`  NEEDS-REWRITE:             ${failCount}`);
console.log(`  Total violations:          ${totalViolations}`);
console.log('');

// ── Averages ──────────────────────────────────────────────
if (results.length > 0) {
  const avgWords = Math.round(results.reduce((s, r) => s + r.totalWordCount, 0) / results.length);
  const avgRatio = (results.reduce((s, r) => s + r.proseRatio, 0) / results.length * 100).toFixed(1);
  const avgViolations = (totalViolations / results.length).toFixed(1);

  console.log(`  Average word count:        ${avgWords}`);
  console.log(`  Average prose ratio:       ${avgRatio}%`);
  console.log(`  Average violations/file:   ${avgViolations}`);
  console.log('');
}

// ── Component Usage Stats ─────────────────────────────────
console.log('  Component usage across all reviews:');
const totals = {};
for (const comp of KNOWN_COMPONENTS) {
  totals[comp] = results.reduce((s, r) => s + r.componentCounts[comp], 0);
}
for (const comp of KNOWN_COMPONENTS) {
  if (totals[comp] > 0) {
    const avg = (totals[comp] / results.length).toFixed(1);
    console.log(`    ${comp.padEnd(24)} total: ${String(totals[comp]).padStart(4)}   avg: ${avg}/review`);
  }
}
console.log('');

// ── Verbose: show all violations inline ───────────────────
if (VERBOSE) {
  console.log('');
  console.log('='.repeat(80));
  console.log('  VERBOSE: Per-file breakdown');
  console.log('='.repeat(80));

  for (const r of results) {
    console.log('');
    console.log(`  ${r.file}`);
    console.log(`    Words: ${r.totalWordCount}  |  Prose lines: ${r.proseLines}  |  Component lines: ${r.componentLines}`);
    console.log(`    Prose ratio: ${(r.proseRatio * 100).toFixed(1)}%  |  Status: ${r.status}`);
    console.log('    Components:');
    for (const comp of KNOWN_COMPONENTS) {
      if (r.componentCounts[comp] > 0) {
        console.log(`      ${comp}: ${r.componentCounts[comp]}`);
      }
    }
    if (r.violations.length > 0) {
      console.log('    Violations:');
      for (const v of r.violations) {
        console.log(`      - ${v}`);
      }
    }
  }
}

// Exit code
process.exit(failCount > 0 ? 1 : 0);
