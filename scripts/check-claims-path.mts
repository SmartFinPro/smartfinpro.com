// scripts/check-claims-path.mts
// Prüft konkrete Dateien gegen FORBIDDEN_CLAIM_PATTERNS — das ausführbare
// forbidden-claims-Gate pro geändertem Pfad (Rollout-Spec Rev. 2). Aufruf:
//   npx tsx scripts/check-claims-path.mts content/...mdx [weitere Dateien]
import fs from 'node:fs';
import { FORBIDDEN_CLAIM_PATTERNS } from '@/lib/editorial/forbidden-claims';

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error('usage: check-claims-path.mts <file> ...');
  process.exit(2);
}

let failed = false;
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  for (const { pattern, reason } of FORBIDDEN_CLAIM_PATTERNS) {
    const re = new RegExp(pattern.source, pattern.flags.replace('g', '') + 'g');
    const hits = [...text.matchAll(re)];
    if (hits.length > 0) {
      failed = true;
      console.log(`✗ ${file}: ${hits.length}× /${pattern.source}/ — ${reason}`);
    }
  }
}
if (!failed) console.log(`✓ ${files.length} Datei(en) frei von forbidden claims`);
process.exit(failed ? 1 : 0);
