#!/usr/bin/env node
// ============================================================
// inventory-broker-reviews.mjs — Generate broker review inventory
//
// Scans for all broker reviews matching the canonical definition:
// - Has numeric `rating` in YAML frontmatter
// - Category (2nd path segment) is `trading` or `forex`
// - Filename ends with `-review.mdx`
// - NOT under `content/_templates/`
//
// Outputs: docs/reviews/broker-v2-inventory.json
//
// Usage:
//   node scripts/inventory-broker-reviews.mjs          # generate file
//   node scripts/inventory-broker-reviews.mjs --check  # verify against committed JSON
// ============================================================

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const CONTENT_DIR = path.join(ROOT, 'content');
const OUTPUT_FILE = path.join(ROOT, 'docs', 'reviews', 'broker-v2-inventory.json');

const CHECK_MODE = process.argv.includes('--check');

// ── Collect all MDX files in content/ ─────────────────────
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

// ── Check if file matches canonical broker review definition ──
function isBrokerReview(filePath) {
  // Must end with -review.mdx
  if (!filePath.endsWith('-review.mdx')) return false;

  // Cannot be in _templates
  if (filePath.includes('/_templates/')) return false;

  // Parse the file to check for numeric rating
  const raw = fs.readFileSync(filePath, 'utf-8');
  let frontmatter;
  try {
    const parsed = matter(raw);
    frontmatter = parsed.data;
  } catch {
    return false;
  }

  // Must have numeric rating
  const rating = frontmatter.rating;
  if (typeof rating !== 'number' || Number.isNaN(rating)) {
    return false;
  }

  // Parse path to extract market and category
  // Expected: content/[market]/[category]/[slug].mdx
  const rel = path.relative(CONTENT_DIR, filePath);
  const parts = rel.split(path.sep);
  if (parts.length < 3) return false;

  const category = parts[1];
  // Category must be 'trading' or 'forex'
  if (category !== 'trading' && category !== 'forex') {
    return false;
  }

  return true;
}

// ── Extract H2 headings from body ────────────────────────────
function extractH2Headings(body) {
  const h2s = [];
  const lines = body.split('\n');
  for (const line of lines) {
    const match = line.match(/^##\s+(.+?)(?:\s*$|{|#)/);
    if (match) {
      h2s.push(match[1].trim());
    }
  }
  return h2s;
}

// ── Check for claim sections ─────────────────────────────────
function hasClaimSections(body) {
  const sectionMarkers = [
    '## Platform Evidence & Screenshots',
    '## Customer Support: Our Testing Results',
    '## Our 90-Day Testing Results'
  ];
  for (const marker of sectionMarkers) {
    if (body.includes(marker)) return true;
  }
  return false;
}

// ── Count words in body (rough estimate) ──────────────────────
function countWords(text) {
  return text.trim().split(/\s+/).length;
}

// ── Generate inventory for a broker review ───────────────────
function inventoryBrokerReview(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const parsed = matter(raw);
  const frontmatter = parsed.data;
  const body = parsed.content;

  // Parse path: content/[market]/[category]/[slug].mdx
  const rel = path.relative(ROOT, filePath);
  const parts = rel.split(path.sep);
  const market = parts[1];
  const category = parts[2];
  const slug = path.basename(filePath, '.mdx');

  return {
    path: rel.replace(/\\/g, '/'),
    market,
    category,
    slug,
    reviewLayout: frontmatter.reviewLayout || null,
    h2: extractH2Headings(body),
    hasClaimSections: hasClaimSections(body),
    wordCount: countWords(body)
  };
}

// ── Main ──────────────────────────────────────────────────────
const allFiles = collectMDXFiles(CONTENT_DIR);
const brokerReviews = allFiles.filter(isBrokerReview).sort();

console.log(`📊 Broker Review Inventory`);
console.log(`   Total files scanned: ${allFiles.length}`);
console.log(`   Broker reviews found: ${brokerReviews.length}`);

// Count v2 layouts
const v2Count = brokerReviews.reduce((count, filePath) => {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const parsed = matter(raw);
  if (parsed.data.reviewLayout === 'v2') count++;
  return count;
}, 0);

const candidates = brokerReviews.length - v2Count;

console.log(`   V2 layouts: ${v2Count}`);
console.log(`   Candidates (non-v2): ${candidates}`);

const inventory = {
  generatedFrom: 'scripts/inventory-broker-reviews.mjs',
  definition:
    'Broker review file with numeric rating in frontmatter, category is trading or forex, filename ends with -review.mdx, not under content/_templates/',
  totals: {
    brokerReviews: brokerReviews.length,
    v2: v2Count,
    candidates
  },
  reviews: brokerReviews.map(inventoryBrokerReview)
};

if (CHECK_MODE) {
  // Read committed file and compare
  if (!fs.existsSync(OUTPUT_FILE)) {
    console.log('');
    console.error(`❌ Committed file does not exist: ${path.relative(ROOT, OUTPUT_FILE)}`);
    process.exit(1);
  }

  const committed = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf-8'));
  const generated = JSON.stringify(inventory, null, 2);
  const committedStr = JSON.stringify(committed, null, 2);

  if (generated === committedStr) {
    console.log('');
    console.log('✅ Inventory matches committed file.');
    process.exit(0);
  }

  // Show diff
  console.log('');
  console.error('❌ Inventory mismatch.');
  console.log('');
  console.log('Generated totals:', inventory.totals);
  console.log('Committed totals:', committed.totals);

  if (inventory.totals.brokerReviews !== committed.totals.brokerReviews) {
    console.error(
      `   brokerReviews: ${inventory.totals.brokerReviews} (expected ${committed.totals.brokerReviews})`
    );
  }
  if (inventory.totals.v2 !== committed.totals.v2) {
    console.error(`   v2: ${inventory.totals.v2} (expected ${committed.totals.v2})`);
  }
  if (inventory.totals.candidates !== committed.totals.candidates) {
    console.error(`   candidates: ${inventory.totals.candidates} (expected ${committed.totals.candidates})`);
  }

  // Check for added/removed reviews
  const genPaths = new Set(inventory.reviews.map(r => r.path));
  const comPaths = new Set(committed.reviews.map(r => r.path));

  const added = [...genPaths].filter(p => !comPaths.has(p));
  const removed = [...comPaths].filter(p => !genPaths.has(p));

  if (added.length > 0) {
    console.log('');
    console.log('Added reviews:');
    for (const p of added) {
      console.log(`   + ${p}`);
    }
  }

  if (removed.length > 0) {
    console.log('');
    console.log('Removed reviews:');
    for (const p of removed) {
      console.log(`   - ${p}`);
    }
  }

  process.exit(1);
} else {
  // Write file
  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(inventory, null, 2) + '\n');

  console.log('');
  console.log(`✅ Inventory written: ${path.relative(ROOT, OUTPUT_FILE)}`);
  process.exit(0);
}
