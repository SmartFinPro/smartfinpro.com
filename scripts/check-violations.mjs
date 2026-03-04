import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import matter from 'gray-matter';

const contentDir = './content';
const files = [
  'ca/business-banking/revolut-business-review.mdx',
  'ca/housing/index.mdx',
  'ca/tax-efficient-investing/index-new.mdx',
  'ca/tax-efficient-investing/index.mdx',
  'us/business-banking/revolut-business-review.mdx',
  'us/debt-relief/index.mdx',
  'us/forex/index.mdx',
  'uk/forex/index.mdx',
];

for (const f of files) {
  const fp = join(contentDir, f);
  if (!existsSync(fp)) { console.log('MISSING:', f); continue; }
  const raw = readFileSync(fp, 'utf8');
  const { data } = matter(raw);
  const title = (data.seoTitle || data.title || '').trim();
  const desc = (data.description || '').trim();
  console.log(f);
  console.log(`  title [${title.length}]: ${title}`);
  console.log(`  desc  [${desc.length}]: ${desc}`);
  console.log('');
}
