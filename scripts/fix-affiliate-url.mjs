// Add missing affiliateUrl: "" to the 12 guide files missing it
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const contentDir = './content';

const files = [
  'au/gold-investing/how-to-buy-gold-australia.mdx',
  'au/savings/high-yield-savings-accounts-au.mdx',
  'au/superannuation/best-super-funds-australia.mdx',
  'au/superannuation/division-296-tax-explained.mdx',
  'au/superannuation/self-managed-super-fund-setup.mdx',
  'ca/housing/first-time-home-buyer-grants-canada.mdx',
  'cross-market/ai-financial-coaching.mdx',
  'cross-market/green-finance-esg-guide.mdx',
  'uk/cost-of-living/how-to-reduce-energy-bills-uk.mdx',
  'uk/remortgaging/fixed-rate-ending-what-to-do.mdx',
  'us/ai-tools/ai-driven-finance-future.mdx',
  'us/trading/ai-crypto-investing.mdx',
];

for (const f of files) {
  const fp = join(contentDir, f);
  let raw = readFileSync(fp, 'utf8');

  // Check if affiliateUrl already exists
  if (/^affiliateUrl:/m.test(raw)) {
    console.log(`⏭ Already has affiliateUrl: ${f}`);
    continue;
  }

  // Insert affiliateUrl: "" after the description field (or before closing ---)
  // Find the end of the frontmatter and insert before it
  const fmEndRe = /^(---\s*\n[\s\S]*?)\n(---)/m;
  if (fmEndRe.test(raw)) {
    raw = raw.replace(/^(---\s*\n[\s\S]*?)(^---)/m, (_, fm, close) => {
      // Add affiliateUrl before the closing ---
      return fm + 'affiliateUrl: ""\n' + close;
    });
    writeFileSync(fp, raw, 'utf8');
    console.log(`✅ Added affiliateUrl to: ${f}`);
  } else {
    console.log(`❌ Could not find frontmatter in: ${f}`);
  }
}
