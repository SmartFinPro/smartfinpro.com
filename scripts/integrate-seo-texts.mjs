#!/usr/bin/env node
/**
 * integrate-seo-texts.mjs
 * Integrates SEO text files into existing MDX index files to boost quality scores to ≥90.
 * Strategy: Insert cleaned SEO prose sections before "## Further Resources" in each MDX file.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const CONTENT = path.join(ROOT, 'content');
const SEO = path.join(ROOT, 'seo texte');

// Map: MDX file path → SEO text file path
const PAIRS = [
  ['us/trading/index.mdx',                             'us-trading/best-trading-platforms-2026.md'],
  ['us/ai-tools/index.mdx',                            'us-ai-tools/best-ai-tools-for-finance-2026.md'],
  ['us/cybersecurity/index.mdx',                       'us-cybersecurity/best-cybersecurity-us-2026.md'],
  ['us/business-banking/index.mdx',                    'us-business-banking/best-business-banking-us-2026.md'],
  ['us/personal-finance/index.mdx',                    'us-personal-finance/best-personal-finance-2026.md'],
  ['us/forex/index.mdx',                               'us-forex/best-forex-brokers-us-2026.md'],
  ['us/gold-investing/index.mdx',                      'us-gold-investing/best-gold-investing-2026.md'],
  ['uk/trading/index.mdx',                             'uk-trading/best-trading-platforms-uk-2026.md'],
  ['uk/ai-tools/index.mdx',                            'uk-ai-tools/best-ai-tools-uk-finance-professionals-2026.md'],
  ['uk/cybersecurity/index.mdx',                       'uk-cybersecurity/best-cybersecurity-uk-2026.md'],
  ['uk/business-banking/index.mdx',                    'uk-business-banking/best-business-banking-uk-2026.md'],
  ['uk/forex/index.mdx',                               'uk-forex/best-forex-brokers-uk-2026.md'],
  ['uk/cost-of-living/index.mdx',                      'uk-cost-of-living/cost-of-living-uk-2026.md'],
  ['ca/ai-tools/index.mdx',                            'ca-ai-tools/best-ai-tools-for-canadian-finance-2026.md'],
  ['ca/cybersecurity/index.mdx',                       'ca-cybersecurity/best-cybersecurity-canada-2026.md'],
  ['ca/business-banking/index.mdx',                    'ca-business-banking/best-business-banking-canada-2026.md'],
  ['ca/tax-efficient-investing/wealthsimple-vs-questrade.mdx', 'ca-tax-efficient-investing-wealthsimple-vs-questrade/wealthsimple-vs-questrade-2026.md'],
  ['au/trading/index.mdx',                             'au-trading/best-trading-platforms-australia-2026.md'],
  ['au/ai-tools/index.mdx',                            'au-ai-tools/best-ai-tools-australia-finance-2026.md'],
  ['au/business-banking/index.mdx',                    'au-business-banking/best-business-banking-australia-2026.md'],
  ['au/superannuation/index.mdx',                      'au-superannuation/best-superannuation-funds-australia-2026.md'],
  ['cross-market/green-finance-esg-guide.mdx',         'green-finance-esg-guide/green-finance-esg-investing-guide-2026.md'],
];

/**
 * Clean SEO text for MDX insertion:
 * - Remove H1 title line
 * - Remove "### Internal Links" section and its bullets
 * - Remove "### Related Articles" section
 * - Convert HTML comments to JSX comments
 * - Ensure no bare < > chars that would break JSX (inside prose text)
 * - Remove duplicate ## sections that already exist in the MDX
 */
function cleanSeoText(raw) {
  let text = raw;

  // Remove H1 title (first line starting with #)
  text = text.replace(/^# .+\n?/m, '');

  // Remove "### Internal Links" section and everything until next ## or end
  text = text.replace(/###\s+Internal Links[\s\S]*?(?=^##|$)/m, '');

  // Remove "### Related Articles" section
  text = text.replace(/###\s+Related Articles[\s\S]*?(?=^##|$)/m, '');

  // Convert HTML comments to JSX comments
  text = text.replace(/<!--([\s\S]*?)-->/g, '{/*$1*/}');

  // Remove lines that are just "---" (horizontal rules can cause MDX issues)
  text = text.replace(/^---+\s*$/gm, '');

  // Add section header to wrap the SEO content
  const wrapped = `\n---\n\n## In-Depth Analysis & Market Context\n\n${text.trim()}\n\n`;
  return wrapped;
}

function countWords(text) {
  return text.replace(/---[\s\S]*?---/, '').replace(/<[^>]+>/g, ' ').replace(/[#*\[\](){}]/g, ' ').split(/\s+/).filter(Boolean).length;
}

function findInsertionPoint(mdxContent) {
  // Try to find "## Further Resources" as insertion point
  const furtherIdx = mdxContent.indexOf('\n## Further Resources');
  if (furtherIdx !== -1) return furtherIdx;

  // Fallback: find <AutoDisclaimer
  const disclaimerIdx = mdxContent.indexOf('\n<AutoDisclaimer');
  if (disclaimerIdx !== -1) return disclaimerIdx;

  // Last fallback: end of file
  return mdxContent.length;
}

let successCount = 0;
let skipCount = 0;
const results = [];

for (const [mdxRel, seoRel] of PAIRS) {
  const mdxPath = path.join(CONTENT, mdxRel);
  const seoPath = path.join(SEO, seoRel);

  if (!fs.existsSync(mdxPath)) {
    results.push(`❌ MDX NOT FOUND: ${mdxRel}`);
    continue;
  }
  if (!fs.existsSync(seoPath)) {
    results.push(`❌ SEO NOT FOUND: ${seoRel}`);
    continue;
  }

  const mdxContent = fs.readFileSync(mdxPath, 'utf8');
  const seoRaw = fs.readFileSync(seoPath, 'utf8');

  const wordsBefore = countWords(mdxContent);

  // Skip if already ≥4000 words AND score would be ≥90
  // (au/superannuation special case: needs components, not words)
  if (wordsBefore >= 4000 && !mdxRel.includes('superannuation')) {
    results.push(`⏭️  SKIP (already ${wordsBefore}w): ${mdxRel}`);
    skipCount++;
    continue;
  }

  const seoClean = cleanSeoText(seoRaw);
  const insertAt = findInsertionPoint(mdxContent);

  const newContent = mdxContent.slice(0, insertAt) + seoClean + mdxContent.slice(insertAt);
  const wordsAfter = countWords(newContent);

  fs.writeFileSync(mdxPath, newContent, 'utf8');
  results.push(`✅ ${mdxRel}: ${wordsBefore}w → ${wordsAfter}w (+${wordsAfter - wordsBefore}w)`);
  successCount++;
}

console.log('\n=== SEO TEXT INTEGRATION RESULTS ===\n');
results.forEach(r => console.log(r));
console.log(`\n✅ Updated: ${successCount} | ⏭️  Skipped: ${skipCount} | Total: ${PAIRS.length}`);
