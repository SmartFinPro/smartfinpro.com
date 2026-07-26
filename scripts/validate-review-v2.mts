#!/usr/bin/env tsx
// ============================================================
// validate-review-v2.mts — CLI guard for docs/reviews/broker-v2-standard.md
//
// Thin wrapper around the pure `validateReviewV2()` (lib/reviews/
// validate-review-v2.ts): does file discovery, builds `knownReviewPaths`
// from the content tree, prints a readable report (house style of
// scripts/check-frontmatter.mjs), and sets the exit code.
//
// Scope (per the standard doc, section D): only files with
// `reviewLayout: 'v2'`, excluding content/_templates/ (which is covered by
// its own fixture test, __tests__/unit/validate-review-v2.test.ts, since a
// green guard run here does NOT prove the template is contract-valid).
//
// Usage:
//   npx tsx scripts/validate-review-v2.mts
// ============================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';

import { validateReviewV2 } from '../lib/reviews/validate-review-v2';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const CONTENT_DIR = path.join(ROOT, 'content');

// ── collect every .mdx file under content/, skipping _templates ─────────
function collectMDXFiles(dir: string): string[] {
  const files: string[] = [];

  function walk(currentDir: string) {
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

// content/{market}/{category}/{slug}.mdx -> "/{market}/{category}/{slug}".
// Files that don't fit this 2-level shape (content/_templates already
// excluded above; content/cross-market, content/research) simply don't
// resolve to a path here — they're not a market/category review target.
const CONTENT_PATH_RE = /content[\\/]([^\\/]+)[\\/]([^\\/]+)[\\/]([^\\/]+)\.mdx$/;

function toKnownPath(relPath: string): string | null {
  const match = relPath.replace(/\\/g, '/').match(CONTENT_PATH_RE);
  if (!match) return null;
  const [, market, category, slug] = match;
  return `/${market}/${category}/${slug}`;
}

// ── main ──────────────────────────────────────────────────────────────

const allFiles = collectMDXFiles(CONTENT_DIR);

const knownReviewPaths = new Set<string>();
for (const file of allFiles) {
  const rel = path.relative(ROOT, file);
  const known = toKnownPath(rel);
  if (known) knownReviewPaths.add(known);
}

interface FileResult {
  relPath: string;
  ok: boolean;
  issues: { path: string; message: string }[];
}

const results: FileResult[] = [];

for (const file of allFiles) {
  const rel = path.relative(ROOT, file);
  const raw = fs.readFileSync(file, 'utf-8');

  let data: Record<string, unknown>;
  let content: string;
  try {
    const parsed = matter(raw);
    data = parsed.data as Record<string, unknown>;
    content = parsed.content;
  } catch (e) {
    results.push({
      relPath: rel,
      ok: false,
      issues: [{ path: '(root)', message: `frontmatter parse error: ${(e as Error).message}` }],
    });
    continue;
  }

  if (data.reviewLayout !== 'v2') continue;

  const { ok, issues } = validateReviewV2({
    filePath: rel,
    frontmatter: data,
    body: content,
    knownReviewPaths,
  });

  results.push({ relPath: rel, ok, issues });
}

// ── output (house style of scripts/check-frontmatter.mjs) ──────────────
console.log('');
console.log('📊 Broker-V2 Publication Contract (docs/reviews/broker-v2-standard.md)');
console.log(`   Content root: ${path.relative(ROOT, CONTENT_DIR)}`);
console.log(`   V2 files checked: ${results.length}`);
console.log('');

let errorCount = 0;
for (const result of results) {
  if (result.ok) {
    console.log(`  ✅ ${result.relPath}`);
    continue;
  }
  errorCount++;
  console.error(`  ❌ ${result.relPath}`);
  for (const issue of result.issues) {
    console.error(`     - [${issue.path}] ${issue.message}`);
  }
}

console.log('');
console.log('📊 Summary');
console.log(`   V2 files checked: ${results.length}`);
console.log(`   Passing:          ${results.length - errorCount}`);
console.log(`   Failing:          ${errorCount}`);

if (errorCount > 0) {
  console.log('');
  console.error(`❌ ${errorCount} V2 review(s) violate the Broker-V2 publication contract.`);
  process.exit(1);
} else {
  console.log('');
  console.log('✅ All V2 reviews satisfy the Broker-V2 publication contract.');
  process.exit(0);
}
