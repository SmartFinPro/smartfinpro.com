import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const contentDir = './content';

// Safe replacement that avoids $ sign issues by using function form
function safeReplaceFm(raw, field, newVal) {
  const escapedVal = newVal.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  const quoted = `${field}: "${escapedVal}"`;

  // Block scalar: field: >-\n  content...
  const blockRe = new RegExp(
    `^${field}:[ \\t]*[>|][\\-+]?[ \\t]*(#[^\\n]*)?\\r?\\n((?:[ \\t]+[^\\n]*\\r?\\n?)*)`,
    'm'
  );
  if (blockRe.test(raw)) {
    return raw.replace(blockRe, () => quoted + '\n');
  }
  // Double-quoted: field: "..."
  const dqRe = new RegExp(`^${field}:[ \\t]+"[^"]*"`, 'm');
  if (dqRe.test(raw)) {
    return raw.replace(dqRe, () => quoted);
  }
  // Single-quoted: field: '...'
  const sqRe = new RegExp(`^${field}:[ \\t]+'[^']*'`, 'm');
  if (sqRe.test(raw)) {
    return raw.replace(sqRe, () => quoted);
  }
  // Bare value: field: value
  const bareRe = new RegExp(`^${field}:[ \\t]+[^\\n]+`, 'm');
  if (bareRe.test(raw)) {
    return raw.replace(bareRe, () => quoted);
  }
  return raw;
}

const fixes = [
  {
    file: 'ca/business-banking/revolut-business-review.mdx',
    // title [35] → need 45-60
    seoTitle: 'Revolut Business Canada Review 2026: Full Analysis',
    // desc [159] is fine
  },
  {
    file: 'ca/housing/index.mdx',
    // title [38] → need 45-60
    seoTitle: 'Canadian Housing & Mortgage Guide 2026 for Buyers',
    // desc [163] → need ≤160
    description: 'Canadian housing and mortgage guide 2026. BoC rate 2.25%, CMHC limit $1.5M, OSFI stress test, FHSA, fixed vs variable. What homebuyers need to know.',
  },
  {
    file: 'ca/tax-efficient-investing/index-new.mdx',
    // title [41] → need 45-60
    seoTitle: 'Tax-Efficient Investing Canada 2026: Complete Guide',
    // desc [200] → need 140-160
    description: 'Tax-efficient investing for Canadian investors: FHSA, TFSA, RRSP sequencing, asset location, capital gains timing, and tax-loss harvesting strategies.',
  },
  {
    file: 'ca/tax-efficient-investing/index.mdx',
    // title [35] → need 45-60
    seoTitle: 'Tax-Efficient Investing Canada 2026: Expert Strategies',
    // desc [152] is fine
  },
  {
    file: 'us/business-banking/revolut-business-review.mdx',
    // title [61] → need ≤60
    seoTitle: 'Revolut Business 2026: Best for International Payments',
    // desc [151] is fine
  },
  {
    file: 'us/debt-relief/index.mdx',
    // title [72] → need ≤60
    seoTitle: 'Debt Relief Guide 2026: Consolidation & Settlement',
    // desc [170] → need 140-160
    description: 'Complete debt relief guide 2026: consolidation, settlement, bankruptcy alternatives, DIY payoff methods, costs, legal protections and state laws.',
  },
  {
    file: 'us/forex/index.mdx',
    // title [61] → need ≤60
    seoTitle: 'Best US Forex Brokers 2026: CFTC Regulated Platforms',
    // desc [160] is fine (exactly 160)
  },
  {
    file: 'uk/forex/index.mdx',
    // title [53] is fine
    // desc [163] → need ≤160
    description: 'Best forex brokers UK 2026 compared and ranked. FCA-regulated, FSCS-protected. Spreads, platforms & fees for Pepperstone, IG, CMC & more. Compare all.',
  },
];

// Validate char lengths before applying
function validateLengths(fixes) {
  let ok = true;
  for (const fix of fixes) {
    if (fix.seoTitle) {
      const len = fix.seoTitle.length;
      if (len < 45 || len > 60) {
        console.error(`❌ INVALID title [${len}]: "${fix.seoTitle}" in ${fix.file}`);
        ok = false;
      }
    }
    if (fix.description) {
      const len = fix.description.length;
      if (len < 140 || len > 160) {
        console.error(`❌ INVALID desc [${len}]: "${fix.description}" in ${fix.file}`);
        ok = false;
      }
    }
  }
  return ok;
}

console.log('=== Pre-flight length validation ===');
if (!validateLengths(fixes)) {
  console.error('Aborting — fix the lengths above first.');
  process.exit(1);
}
console.log('✅ All target lengths validated\n');

// Apply fixes
for (const fix of fixes) {
  const fp = join(contentDir, fix.file);
  let raw = readFileSync(fp, 'utf8');

  if (fix.seoTitle) {
    // Try seoTitle field first, fall back to title
    const hasSeoTitle = /^seoTitle:/m.test(raw);
    const field = hasSeoTitle ? 'seoTitle' : 'title';
    raw = safeReplaceFm(raw, field, fix.seoTitle);
  }

  if (fix.description) {
    raw = safeReplaceFm(raw, 'description', fix.description);
  }

  writeFileSync(fp, raw, 'utf8');
  console.log(`✅ Fixed: ${fix.file}`);
  if (fix.seoTitle) console.log(`   title → [${fix.seoTitle.length}] ${fix.seoTitle}`);
  if (fix.description) console.log(`   desc  → [${fix.description.length}] ${fix.description}`);
}

console.log('\nDone!');
