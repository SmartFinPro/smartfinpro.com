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
  // Replace empty affiliateUrl with placeholder
  raw = raw.replace(/^affiliateUrl: ""$/m, 'affiliateUrl: "#"');
  writeFileSync(fp, raw, 'utf8');
  const val = raw.match(/^affiliateUrl:\s*(.+)$/m)?.[1] || 'NOT FOUND';
  console.log(`✅ ${f}: affiliateUrl = ${val}`);
}
