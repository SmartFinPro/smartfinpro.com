#!/usr/bin/env node
// scripts/check-evidence-images.mjs
// ============================================================
// Verify platform evidence screenshots referenced from MDX
//
// Background: review pages render <EvidenceCarousel> with captions
// claiming the shots were captured during our own live testing. If the
// asset is missing, /_next/image answers HTTP 400 and the page ships an
// unbacked evidence claim. Both failures must break the build, not prod.
//
// Rules:
// - Every /images/evidence/... path referenced in content/**/*.mdx must
//   exist under public/
// - MDX comments ({/* ... */}) are stripped first: commented-out
//   placeholder blocks never render, so they must not fail the build
//
// Usage: node scripts/check-evidence-images.mjs
// Exit code: 0 = pass, 1 = missing assets
// ============================================================

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT_DIR = join(ROOT, 'content');
const PUBLIC_DIR = join(ROOT, 'public');

/** Recursively collect every .mdx file under a directory. */
function collectMdx(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...collectMdx(full));
    else if (entry.endsWith('.mdx')) out.push(full);
  }
  return out;
}

/**
 * Strip MDX comments so commented-out carousels are ignored.
 * MDX comments are JSX expressions: {\/* ... *\/} — possibly multi-line.
 */
function stripMdxComments(src) {
  return src.replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '');
}

if (!existsSync(CONTENT_DIR)) {
  console.error(`❌ Missing directory: ${CONTENT_DIR}`);
  process.exit(1);
}

const EVIDENCE_REF = /\/images\/evidence\/[A-Za-z0-9._/-]+\.(?:jpg|jpeg|png|webp|avif)/g;

const missingByFile = new Map();
let refCount = 0;
let fileCount = 0;

for (const file of collectMdx(CONTENT_DIR)) {
  const src = stripMdxComments(readFileSync(file, 'utf8'));
  const refs = [...new Set(src.match(EVIDENCE_REF) ?? [])];
  if (refs.length === 0) continue;

  fileCount += 1;
  const missing = [];
  for (const ref of refs.sort()) {
    refCount += 1;
    if (!existsSync(join(PUBLIC_DIR, ref))) missing.push(ref);
  }
  if (missing.length > 0) missingByFile.set(relative(ROOT, file), missing);
}

if (missingByFile.size > 0) {
  const total = [...missingByFile.values()].reduce((n, m) => n + m.length, 0);
  console.error(`❌ ${total} referenced evidence image(s) missing from public/ in ${missingByFile.size} file(s):\n`);
  for (const [file, missing] of [...missingByFile].sort()) {
    console.error(`  ${file}`);
    for (const ref of missing) console.error(`    → ${ref}`);
  }
  console.error(
    '\nEvidence carousels assert the screenshots come from our own testing.',
  );
  console.error(
    'Either add the real assets under public/images/evidence/, or remove the',
  );
  console.error('carousel block — do not ship the claim without the evidence.');
  process.exit(1);
}

console.log(
  `✅ Evidence image verification passed (${refCount} reference(s) across ${fileCount} file(s)).`,
);
