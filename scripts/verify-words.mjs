import fs from 'fs';
function countWords(text) {
  return text.replace(/---[\s\S]*?---/, '').replace(/<[^>]+>/g, ' ').replace(/[#*\[\](){}]/g, ' ').split(/\s+/).filter(Boolean).length;
}
const files = [
  'us/trading/index.mdx','us/ai-tools/index.mdx','us/cybersecurity/index.mdx',
  'us/business-banking/index.mdx','us/personal-finance/index.mdx','us/forex/index.mdx',
  'us/gold-investing/index.mdx','uk/trading/index.mdx','uk/ai-tools/index.mdx',
  'uk/cybersecurity/index.mdx','uk/business-banking/index.mdx','uk/forex/index.mdx',
  'uk/cost-of-living/index.mdx','ca/ai-tools/index.mdx','ca/cybersecurity/index.mdx',
  'ca/business-banking/index.mdx','ca/tax-efficient-investing/wealthsimple-vs-questrade.mdx',
  'au/trading/index.mdx','au/ai-tools/index.mdx','au/business-banking/index.mdx',
  'au/superannuation/index.mdx','cross-market/green-finance-esg-guide.mdx'
];
let ok=0, fail=0;
for (const f of files) {
  const fp = 'content/' + f;
  if (!fs.existsSync(fp)) { console.log('MISSING: ' + f); fail++; continue; }
  const w = countWords(fs.readFileSync(fp,'utf8'));
  const icon = w>=4000 ? '✅' : '❌';
  if (w>=4000) ok++; else fail++;
  console.log(icon + ' ' + f.padEnd(60) + w + 'w');
}
console.log('\nOK: ' + ok + ' | Under 4000: ' + fail);
