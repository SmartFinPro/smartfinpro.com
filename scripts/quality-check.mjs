#!/usr/bin/env node
/**
 * quality-check.mjs — Berechnet Quality-Scores für alle MDX content files
 * Formel: WordScore×0.30 + StructureScore×0.25 + LinkScore×0.20 + ComponentScore×0.25
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTENT = path.join(__dirname, '..', 'content');

function getAllMdxFiles(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) getAllMdxFiles(full, files);
    else if (entry.name.endsWith('.mdx')) files.push(full);
  }
  return files;
}

function countWords(text) {
  return text.replace(/---[\s\S]*?---/, '').replace(/<[^>]+>/g, ' ').replace(/[#*\[\](){}]/g, ' ').split(/\s+/).filter(Boolean).length;
}

function scoreWords(w) {
  if (w >= 4000) return 100;
  if (w >= 2000) return 50 + Math.round((w - 2000) / 2000 * 50);
  if (w >= 1000) return 30 + Math.round((w - 1000) / 1000 * 20);
  return Math.round(w / 1000 * 30);
}

function scoreStructure(text) {
  let s = 0;
  const h2 = (text.match(/^## /gm) || []).length;
  const h3 = (text.match(/^### /gm) || []).length;
  if (h2 >= 3) s += 30; else s += h2 * 10;
  if (h3 >= 4) s += 25; else s += h3 * 6;
  if (text.includes('| ')) s += 20;
  if (text.match(/^- /m)) s += 15;
  if (text.match(/^#{1,2} FAQ|FAQSection|## Frequently/m)) s += 10;
  return Math.min(s, 100);
}

function scoreLinks(text) {
  const internal = (text.match(/\[.*?\]\(\/[^)]+\)/g) || []).length;
  const external = (text.match(/\[.*?\]\(https?:\/\//g) || []).length;
  let s = 0;
  if (internal >= 3) s += 50; else s += internal * 17;
  if (external >= 2) s += 30; else s += external * 15;
  if (text.match(/## Further Resources|## Related|## More/m)) s += 20;
  return Math.min(s, 100);
}

function scoreComponents(text) {
  let s = 0;
  const comps = ['<ExpertVerifier', '<TrustAuthority', '<WinnerAtGlance', '<ComparisonTable',
    '<ProsCons', '<FAQSection', '<ExecutiveSummary', '<CollapsibleSection',
    '<NewsletterBox', '<AffiliateButton', '<AutoDisclaimer', '<RegionalHeroImage',
    'reviewedBy:', 'rating:', '<Rating'];
  for (const c of comps) { if (text.includes(c)) s += 7; }
  return Math.min(s, 100);
}

const allFiles = getAllMdxFiles(CONTENT);
const results = [];

for (const fp of allFiles) {
  const rel = path.relative(CONTENT, fp);
  const text = fs.readFileSync(fp, 'utf8');
  const words = countWords(text);
  const wScore = scoreWords(words);
  const sScore = scoreStructure(text);
  const lScore = scoreLinks(text);
  const cScore = scoreComponents(text);
  const overall = Math.round(wScore * 0.30 + sScore * 0.25 + lScore * 0.20 + cScore * 0.25);
  results.push({ rel, words, wScore, sScore, lScore, cScore, overall });
}

results.sort((a, b) => a.overall - b.overall);

const under90 = results.filter(r => r.overall < 90);
const under80 = results.filter(r => r.overall < 80);

console.log('\n=== PAGES UNDER 90 ===\n');
console.log('Score  Words   W    S    L    C   File');
console.log('─'.repeat(80));
for (const r of under90) {
  const flag = r.overall < 80 ? '🔴' : '🟡';
  console.log(`${flag} ${String(r.overall).padStart(3)}  ${String(r.words).padStart(5)}w  ${String(r.wScore).padStart(3)}  ${String(r.sScore).padStart(3)}  ${String(r.lScore).padStart(3)}  ${String(r.cScore).padStart(3)}  ${r.rel}`);
}

console.log(`\nUnder 80: ${under80.length} | Under 90: ${under90.length} | Total: ${results.length}`);
console.log(`Avg Quality: ${Math.round(results.reduce((s,r) => s+r.overall, 0)/results.length)}/100`);
