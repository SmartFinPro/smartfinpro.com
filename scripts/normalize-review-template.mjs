#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import fg from 'fast-glob';
import matter from 'gray-matter';

const ROOT = process.cwd();
const WRITE = process.argv.includes('--write');

function slugify(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function getHeadingSections(content) {
  const lines = content.split('\n');
  const seen = new Set();
  const sections = [];

  for (const line of lines) {
    const m = line.match(/^##\s+(.+)$/);
    if (!m) continue;
    const raw = m[1].trim();
    if (!raw) continue;
    const title = raw.replace(/<[^>]+>/g, '').trim();
    let id = slugify(title);
    if (!id) continue;
    if (seen.has(id)) {
      let i = 2;
      while (seen.has(`${id}-${i}`)) i++;
      id = `${id}-${i}`;
    }
    seen.add(id);
    sections.push({ id, title });
  }

  return sections;
}

function inferAffiliateUrl(content) {
  const match = content.match(/\/go\/[a-z0-9-]+/i);
  return match ? match[0].toLowerCase() : '/go/[partner-slug]';
}

function isExpertReviewCandidate(file, data) {
  const base = path.basename(file).toLowerCase();
  if (!data || !data.reviewedBy || !data.category || !data.market) return false;

  if (
    data.rating !== undefined ||
    data.affiliateUrl !== undefined ||
    data.pros !== undefined ||
    data.cons !== undefined ||
    data.bestFor !== undefined ||
    data.pricing !== undefined
  ) {
    return true;
  }

  if (data.type === 'review') return true;
  return /review|comparison|\bvs\b|best-/.test(base);
}

const files = fg.sync(['content/{us,uk,ca,au}/**/*.mdx', '!**/index.mdx']);
const changed = [];

for (const rel of files) {
  const abs = path.join(ROOT, rel);
  const raw = fs.readFileSync(abs, 'utf8');
  const parsed = matter(raw);
  const data = parsed.data || {};

  if (!isExpertReviewCandidate(rel, data)) continue;

  let touched = false;

  if (data.affiliateDisclosure === undefined) {
    data.affiliateDisclosure = true;
    touched = true;
  }

  if (data.featured === undefined) {
    data.featured = false;
    touched = true;
  }

  if (data.guarantee === undefined) {
    data.guarantee = 'See provider terms.';
    touched = true;
  }

  if (data.rating === undefined) {
    data.rating = 4.5;
    touched = true;
  }

  if (data.reviewCount === undefined) {
    data.reviewCount = 0;
    touched = true;
  }

  if (data.affiliateUrl === undefined) {
    data.affiliateUrl = inferAffiliateUrl(parsed.content);
    touched = true;
  }

  if (!Array.isArray(data.sections) || data.sections.length === 0) {
    const sections = getHeadingSections(parsed.content);
    data.sections = sections.length > 0 ? sections : [
      { id: 'overview', title: 'Executive Summary' },
      { id: 'faqs', title: 'FAQs' },
    ];
    touched = true;
  }

  if (!Array.isArray(data.faqs)) {
    data.faqs = [];
    touched = true;
  }

  if (!touched) continue;

  const output = matter.stringify(parsed.content.trimStart(), data, { lineWidth: 0 });

  changed.push(rel);
  if (WRITE) {
    fs.writeFileSync(abs, output.endsWith('\n') ? output : `${output}\n`, 'utf8');
  }
}

if (!WRITE) {
  console.log(`Would update ${changed.length} files.`);
  changed.forEach((f) => console.log(f));
} else {
  console.log(`Updated ${changed.length} files.`);
  changed.forEach((f) => console.log(f));
}
