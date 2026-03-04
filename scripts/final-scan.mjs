import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import matter from 'gray-matter';

const contentDir = './content';
const violations = { titleShort: [], titleLong: [], descShort: [], descLong: [] };
let total = 0, ok = 0;

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!entry.name.startsWith('_') && !entry.name.startsWith('.')) {
        walk(join(dir, entry.name));
      }
    } else if (entry.name.endsWith('.mdx')) {
      total++;
      const filePath = join(dir, entry.name);
      const raw = readFileSync(filePath, 'utf8');
      const { data } = matter(raw);
      const title = (data.seoTitle || data.title || '').trim();
      const desc = (data.description || '').trim();
      const rel = filePath.replace(contentDir + '/', '');
      let hasIssue = false;
      if (title.length < 45) { violations.titleShort.push({ rel, len: title.length, val: title }); hasIssue = true; }
      else if (title.length > 60) { violations.titleLong.push({ rel, len: title.length, val: title }); hasIssue = true; }
      if (desc.length < 140) { violations.descShort.push({ rel, len: desc.length, val: desc.slice(0, 80) }); hasIssue = true; }
      else if (desc.length > 160) { violations.descLong.push({ rel, len: desc.length, val: desc.slice(0, 80) }); hasIssue = true; }
      if (!hasIssue) ok++;
    }
  }
}

walk(contentDir);

console.log('=== FINAL VERIFICATION SCAN ===');
console.log(`Total files: ${total}`);
console.log(`OK (no violations): ${ok}`);
console.log('');
console.log(`Title too short (<45): ${violations.titleShort.length}`);
violations.titleShort.forEach(v => console.log(`  [${v.len}] ${v.rel}: ${v.val}`));
console.log(`Title too long (>60): ${violations.titleLong.length}`);
violations.titleLong.forEach(v => console.log(`  [${v.len}] ${v.rel}: ${v.val}`));
console.log(`Desc too short (<140): ${violations.descShort.length}`);
violations.descShort.forEach(v => console.log(`  [${v.len}] ${v.rel}: ${v.val}`));
console.log(`Desc too long (>160): ${violations.descLong.length}`);
violations.descLong.forEach(v => console.log(`  [${v.len}] ${v.rel}: ${v.val}`));
console.log('');
const total_viol = violations.titleShort.length + violations.titleLong.length + violations.descShort.length + violations.descLong.length;
console.log(`TOTAL VIOLATIONS: ${total_viol}`);
if (total_viol === 0) console.log('✅ CLEAN — 0 violations across all ' + total + ' MDX files!');
else { console.log('❌ Still has violations!'); process.exit(1); }
