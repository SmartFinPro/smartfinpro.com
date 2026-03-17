#!/usr/bin/env node
// ============================================================
// dedup-components.mjs — Remove duplicate component blocks
//
// Scans MDX files for consecutive identical component blocks
// (same opening tag + content + closing tag) and keeps only
// the first occurrence.
//
// Usage:
//   node scripts/dedup-components.mjs --dry-run
//   node scripts/dedup-components.mjs
// ============================================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const CONTENT_DIR = path.join(ROOT, 'content');
const DRY_RUN = process.argv.includes('--dry-run');

const DEDUP_COMPONENTS = ['AnswerBlock', 'Tip', 'Warning', 'ProviderCard'];

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
        files.push(full);
      }
    }
  }
  walk(dir);
  return files;
}

function processFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const lines = raw.split('\n');
  const result = [];
  let removedCount = 0;

  // Track seen component blocks (hash of content)
  const seenBlocks = new Set();
  let i = 0;

  while (i < lines.length) {
    const trimmed = lines[i].trim();

    // Check if this line starts a dedup-able component
    let compName = null;
    for (const comp of DEDUP_COMPONENTS) {
      if (trimmed.startsWith(`<${comp}`)) {
        compName = comp;
        break;
      }
    }

    if (compName) {
      // Extract the full component block
      const blockLines = [lines[i]];
      let endIdx = i;

      // Self-closing or single-line
      if (trimmed.includes('/>') || trimmed.includes(`</${compName}>`)) {
        endIdx = i;
      } else {
        // Multi-line: find closing tag
        for (let j = i + 1; j < lines.length; j++) {
          blockLines.push(lines[j]);
          endIdx = j;
          if (lines[j].trim().startsWith(`</${compName}`)) {
            break;
          }
        }
      }

      const blockHash = blockLines.map(l => l.trim()).join('\n');

      if (seenBlocks.has(blockHash)) {
        // Duplicate! Skip this block and any trailing blank line
        removedCount++;
        i = endIdx + 1;
        // Skip blank lines after removed block
        while (i < lines.length && lines[i].trim() === '') {
          i++;
        }
        continue;
      }

      seenBlocks.add(blockHash);
      // Keep the block
      for (const line of blockLines) {
        result.push(line);
      }
      i = endIdx + 1;
    } else {
      result.push(lines[i]);
      i++;
    }
  }

  if (removedCount === 0) return null;

  const newRaw = result.join('\n');

  if (!DRY_RUN) {
    fs.writeFileSync(filePath, newRaw, 'utf-8');
  }

  return removedCount;
}

// Main
console.log('');
console.log('='.repeat(80));
console.log('  DEDUP: Remove duplicate component blocks');
console.log(`  Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
console.log('='.repeat(80));
console.log('');

const files = collectMDXFiles(CONTENT_DIR);
let totalRemoved = 0;
let filesModified = 0;

for (const file of files) {
  const removed = processFile(file);
  if (removed !== null) {
    filesModified++;
    totalRemoved += removed;
    console.log(`  ${path.relative(ROOT, file)} — removed ${removed} duplicate(s)`);
  }
}

console.log('');
console.log('─'.repeat(80));
console.log(`  Files scanned:   ${files.length}`);
console.log(`  Files modified:  ${filesModified}`);
console.log(`  Blocks removed:  ${totalRemoved}`);
console.log('');

if (!DRY_RUN && filesModified > 0) {
  console.log('  Done! Run CI checks to verify.');
} else if (DRY_RUN && filesModified > 0) {
  console.log('  Run without --dry-run to apply.');
}
console.log('');
