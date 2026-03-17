#!/usr/bin/env node
// ============================================================
// codemod-shift-components.mjs
//
// Scans all MDX review files and shifts AnswerBlock/Tip/Warning
// components that appear before 120 words of prose in any H2
// section to after the first continuous prose block.
//
// Usage:
//   node scripts/codemod-shift-components.mjs --dry-run   # Preview
//   node scripts/codemod-shift-components.mjs              # Apply
//   node scripts/codemod-shift-components.mjs --verbose    # Details
// ============================================================

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const CONTENT_DIR = path.join(ROOT, 'content');

const DRY_RUN = process.argv.includes('--dry-run');
const VERBOSE = process.argv.includes('--verbose');
const MIN_PROSE_WORDS = 100;
const SHIFT_COMPONENTS = ['AnswerBlock', 'Tip', 'Warning'];

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

// ── Line analysis helpers ───────────────────────────────────

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
 * Detect if a line opens a shiftable component.
 * Returns component name or null.
 */
function detectShiftableComponent(line) {
  const trimmed = line.trim();
  if (!trimmed.startsWith('<')) return null;
  for (const comp of SHIFT_COMPONENTS) {
    if (trimmed.startsWith(`<${comp}`)) return comp;
  }
  return null;
}

/**
 * Extract a multi-line component block starting at startIdx.
 * Returns { compName, lines: string[], endIndex: number }
 */
function extractComponentBlock(allLines, startIdx) {
  const compName = detectShiftableComponent(allLines[startIdx]);
  if (!compName) return null;

  const firstLine = allLines[startIdx].trim();

  // Self-closing: <Tip /> or <Tip/>
  if (firstLine.endsWith('/>') || (firstLine.includes('/>') && !firstLine.includes(`</${compName}`))) {
    return { compName, lines: [allLines[startIdx]], endIndex: startIdx };
  }

  // Single-line: <Tip>content</Tip>
  if (firstLine.includes(`</${compName}>`)) {
    return { compName, lines: [allLines[startIdx]], endIndex: startIdx };
  }

  // Multi-line: find closing tag
  const block = [allLines[startIdx]];
  for (let i = startIdx + 1; i < allLines.length; i++) {
    block.push(allLines[i]);
    if (allLines[i].trim().startsWith(`</${compName}`)) {
      return { compName, lines: block, endIndex: i };
    }
  }

  // No closing tag found — return everything to end
  return { compName, lines: block, endIndex: allLines.length - 1 };
}

// ── Section processing ──────────────────────────────────────

/**
 * Process one H2 section:
 * 1. Identify shiftable components that appear before MIN_PROSE_WORDS
 * 2. Remove them from their current position
 * 3. Insert them after the first 120+ word prose block
 */
function processSection(title, lines) {
  const changes = [];
  const earlyComponents = [];
  const cleanedLines = [];
  let proseWords = 0;
  let foundLateComponent = false;

  // Pre-check: count total prose in section — skip if < MIN_PROSE_WORDS
  // (sections with too little prose can't satisfy the requirement)
  const totalSectionProse = lines
    .filter(l => isProseLine(l))
    .reduce((sum, l) => sum + countWords(l.trim()), 0);

  if (totalSectionProse < MIN_PROSE_WORDS) {
    return { modified: false, lines, changes: [] };
  }

  // Pass 1: Scan the section, remove early components
  let i = 0;
  while (i < lines.length) {
    const compName = detectShiftableComponent(lines[i]);

    if (compName && proseWords < MIN_PROSE_WORDS) {
      // This component appears too early — extract and save it
      const block = extractComponentBlock(lines, i);
      if (block) {
        earlyComponents.push(block);
        changes.push(
          `Shift <${compName}> in "${title}" — was after ${proseWords} prose words`
        );
        i = block.endIndex + 1;
        continue;
      }
    }

    if (compName && proseWords >= MIN_PROSE_WORDS) {
      // Component is after enough prose — no more shifting needed
      foundLateComponent = true;
    }

    if (isProseLine(lines[i])) {
      proseWords += countWords(lines[i].trim());
    }

    cleanedLines.push(lines[i]);
    i++;
  }

  if (earlyComponents.length === 0) {
    return { modified: false, lines, changes: [] };
  }

  // Pass 2: Find insertion point in cleanedLines (after MIN_PROSE_WORDS of prose)
  let insertIdx = cleanedLines.length; // fallback: end of section
  let proseCount = 0;

  for (let j = 0; j < cleanedLines.length; j++) {
    if (isProseLine(cleanedLines[j])) {
      proseCount += countWords(cleanedLines[j].trim());
    }

    if (proseCount >= MIN_PROSE_WORDS) {
      // Find end of this prose paragraph:
      // walk forward until we hit a blank line, a non-prose line, or end
      let endOfParagraph = j;
      for (let k = j + 1; k < cleanedLines.length; k++) {
        const nextTrimmed = cleanedLines[k].trim();
        if (nextTrimmed === '') {
          endOfParagraph = k;
          break;
        }
        if (!isProseLine(cleanedLines[k])) {
          endOfParagraph = k;
          break;
        }
        endOfParagraph = k;
      }
      insertIdx = endOfParagraph;

      // If we stopped at a blank line, insert after it
      if (cleanedLines[endOfParagraph]?.trim() === '') {
        insertIdx = endOfParagraph + 1;
      }
      break;
    }
  }

  // Pass 3: Rebuild section using splice for clean insertion
  const result = [...cleanedLines];
  const insertPos = Math.min(insertIdx, result.length);

  // Build the block to insert
  const insertBlock = [];
  for (const comp of earlyComponents) {
    insertBlock.push('');
    insertBlock.push(...comp.lines);
  }

  // Single insertion at the calculated position
  result.splice(insertPos, 0, ...insertBlock);

  return { modified: true, lines: result, changes };
}

// ── File processing ─────────────────────────────────────────

function processFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');

  // Parse frontmatter for review detection only
  let parsed;
  try {
    parsed = matter(raw);
  } catch (e) {
    return { error: e.message };
  }

  if (!isReview(parsed.data)) return null;

  // Find frontmatter boundaries in raw text (preserve exact formatting)
  const fmMatch = raw.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n/);
  if (!fmMatch) return { error: 'Cannot find frontmatter boundaries' };

  const frontmatterBlock = fmMatch[0];
  const contentStr = raw.slice(frontmatterBlock.length);
  const contentLines = contentStr.split('\n');

  // Split into H2 sections
  const sections = [];
  let current = { title: '__preamble__', headerLine: null, lines: [] };

  for (const line of contentLines) {
    if (line.trim().startsWith('## ')) {
      sections.push(current);
      current = {
        title: line.trim().replace(/^##\s+/, ''),
        headerLine: line,
        lines: [],
      };
    } else {
      current.lines.push(line);
    }
  }
  sections.push(current);

  // Process each H2 section (skip preamble)
  let fileModified = false;
  const allChanges = [];

  for (const section of sections) {
    if (section.title === '__preamble__') continue;

    const result = processSection(section.title, section.lines);
    if (result.modified) {
      section.lines = result.lines;
      fileModified = true;
      allChanges.push(...result.changes);
    }
  }

  if (!fileModified) return { changes: [] };

  // Reassemble content
  const reassembled = [];
  for (const section of sections) {
    if (section.headerLine) {
      reassembled.push(section.headerLine);
    }
    reassembled.push(...section.lines);
  }

  const newContent = reassembled.join('\n');
  const newRaw = frontmatterBlock + newContent;

  // Clean up double blank lines (max 2 consecutive newlines)
  const cleaned = newRaw.replace(/\n{4,}/g, '\n\n\n');

  if (!DRY_RUN) {
    fs.writeFileSync(filePath, cleaned, 'utf-8');
  }

  return { changes: allChanges };
}

// ── Main ────────────────────────────────────────────────────

console.log('');
console.log('='.repeat(80));
console.log('  CODEMOD: Shift AnswerBlock/Tip/Warning after 120 words of prose');
console.log(`  Mode: ${DRY_RUN ? 'DRY RUN (no files written)' : 'LIVE (files will be modified)'}`);
console.log(`  Threshold: ${MIN_PROSE_WORDS} words of prose before first component`);
console.log('='.repeat(80));
console.log('');

const files = collectMDXFiles(CONTENT_DIR);
let modifiedCount = 0;
let skippedCount = 0;
let errorCount = 0;
let totalShifts = 0;

for (const file of files) {
  const result = processFile(file);

  if (result === null) {
    skippedCount++;
    continue;
  }

  if (result.error) {
    console.error(`  ERROR: ${path.relative(ROOT, file)} — ${result.error}`);
    errorCount++;
    continue;
  }

  if (result.changes.length > 0) {
    modifiedCount++;
    totalShifts += result.changes.length;
    console.log(`  MODIFIED: ${path.relative(ROOT, file)}`);
    for (const change of result.changes) {
      console.log(`    → ${change}`);
    }
  } else if (VERBOSE) {
    console.log(`  OK: ${path.relative(ROOT, file)}`);
  }
}

console.log('');
console.log('─'.repeat(80));
console.log(`  Files scanned:     ${files.length}`);
console.log(`  Non-reviews:       ${skippedCount}`);
console.log(`  Modified:          ${modifiedCount}`);
console.log(`  Total shifts:      ${totalShifts}`);
console.log(`  Errors:            ${errorCount}`);
console.log(`  Mode:              ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
console.log('');

if (DRY_RUN && modifiedCount > 0) {
  console.log('  Run without --dry-run to apply changes.');
  console.log('');
}

process.exit(errorCount > 0 ? 1 : 0);
