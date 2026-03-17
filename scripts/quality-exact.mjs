#!/usr/bin/env node
/**
 * quality-exact.mjs — Exact replica of computeContentQuality() from lib/actions/content-hub.ts
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTENT = path.join(__dirname, '..', 'content');

const MDX_COMPONENTS = [
  '<TrustAuthority', '<ExpertBox', '<Rating', '<AffiliateButton',
  '<ExecutiveSummary', '<CollapsibleSection', '<ComparisonTable',
  '<SimpleComparison', '<BrokerComparison', '<EnterpriseTable',
  '<FAQ', '<Pros', '<Cons', '<Info', '<Warning', '<Tip',
  '<EvidenceCarousel', '<NewsletterBox', '<WinnerAtGlance',
];

function countWords(text) {
  const frontmatterStripped = text.replace(/^---[\s\S]*?---\n/, '');
  return frontmatterStripped.split(/\s+/).filter(Boolean).length;
}

function computeQuality(content) {
  const wordCount = countWords(content);

  // Word score
  let wordScore = 0;
  if (wordCount >= 4000 && wordCount <= 7000) wordScore = 100;
  else if (wordCount >= 3000 && wordCount < 4000) wordScore = 70;
  else if (wordCount > 7000 && wordCount <= 9000) wordScore = 80;
  else if (wordCount >= 2000 && wordCount < 3000) wordScore = 50;
  else if (wordCount > 9000) wordScore = 60;
  else if (wordCount >= 1000) wordScore = 30;
  else wordScore = 10;

  // Structure score
  const h2Count = (content.match(/^## /gm) || []).length;
  const h3Count = (content.match(/^### /gm) || []).length;
  const hasFaq = /(<FAQ|^## .*FAQ|^## .*Frequently Asked)/im.test(content);
  const hasProsCons = /<Pros|<Cons|^## .*Pros|^## .*Cons/im.test(content);
  let structureScore = 0;
  structureScore += Math.min(h2Count, 8) * 8;
  structureScore += Math.min(h3Count, 6) * 3;
  if (hasFaq) structureScore += 10;
  if (hasProsCons) structureScore += 8;
  structureScore = Math.min(structureScore, 100);

  // Link score
  const internalLinks = (content.match(/\]\(\//g) || []).length;
  const externalLinks = (content.match(/\]\(https?:\/\//g) || []).length;
  let linkScore = Math.min(internalLinks, 8) * 7 + Math.min(externalLinks, 6) * 7;
  linkScore = Math.min(linkScore, 100);

  // Component score
  let componentCount = 0;
  for (const comp of MDX_COMPONENTS) { if (content.includes(comp)) componentCount++; }
  const imageCount = (content.match(/!\[.*?\]/g) || []).length;
  let componentScore = Math.min(componentCount, 6) * 12 + Math.min(imageCount, 4) * 7;
  componentScore = Math.min(componentScore, 100);

  const score = Math.round(wordScore * 0.30 + structureScore * 0.25 + linkScore * 0.20 + componentScore * 0.25);
  return { score, wordCount, wordScore, structureScore, linkScore, componentScore, h2Count, h3Count, hasFaq, hasProsCons, componentCount, imageCount, internalLinks, externalLinks };
}

function getAllMdx(dir, files = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) getAllMdx(full, files);
    else if (e.name.endsWith('.mdx') && !full.includes('_templates')) files.push(full);
  }
  return files;
}

const results = getAllMdx(CONTENT).map(fp => {
  const rel = path.relative(CONTENT, fp);
  const content = fs.readFileSync(fp, 'utf8');
  return { rel, fp, content, ...computeQuality(content) };
}).sort((a, b) => a.score - b.score);

const yellow = results.filter(r => r.score < 80);
const blue   = results.filter(r => r.score >= 80 && r.score < 90);

console.log('\n🔴 YELLOW/AMBER (under 80) — needs fixing:\n');
console.log('Score  Words   W    S    L    C  comps imgs  File');
console.log('─'.repeat(90));
for (const r of yellow) {
  console.log(`  ${String(r.score).padStart(3)}  ${String(r.wordCount).padStart(5)}w  ${String(r.wordScore).padStart(3)}  ${String(r.structureScore).padStart(3)}  ${String(r.linkScore).padStart(3)}  ${String(r.componentScore).padStart(3)}  ${String(r.componentCount).padStart(4)}  ${String(r.imageCount).padStart(3)}   ${r.rel}`);
}

console.log(`\n🟡 BLUE/GOOD (80-89) — close to 90:\n`);
console.log('Score  Words   W    S    L    C  comps imgs  File');
console.log('─'.repeat(90));
for (const r of blue.slice(0, 20)) {
  console.log(`  ${String(r.score).padStart(3)}  ${String(r.wordCount).padStart(5)}w  ${String(r.wordScore).padStart(3)}  ${String(r.structureScore).padStart(3)}  ${String(r.linkScore).padStart(3)}  ${String(r.componentScore).padStart(3)}  ${String(r.componentCount).padStart(4)}  ${String(r.imageCount).padStart(3)}   ${r.rel}`);
}

console.log(`\n🔴 Yellow: ${yellow.length} | 🟡 Blue (80-89): ${blue.length} | Total MDX: ${results.length}`);
console.log(`Avg: ${Math.round(results.reduce((s,r) => s+r.score, 0)/results.length)}/100`);
