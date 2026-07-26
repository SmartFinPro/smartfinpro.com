// scripts/review-quality.mts
// CLI um lib/reviews/content-quality.ts — das ausführbare "Score >= min"-Gate
// aus der Rollout-Spec (Rev. 2). Aufruf:
//   npx tsx scripts/review-quality.mts [--min 90] content/...mdx [weitere.mdx]
import fs from 'node:fs';
import matter from 'gray-matter';
import { computeContentQuality } from '@/lib/reviews/content-quality';

const args = process.argv.slice(2);
const minIdx = args.indexOf('--min');
const min = minIdx >= 0 ? Number(args[minIdx + 1]) : 90;
if (!Number.isFinite(min)) {
  console.error('--min braucht einen numerischen Wert, z. B. --min 90');
  process.exit(2);
}
const files = args.filter((a, i) => a !== '--min' && (minIdx < 0 || i !== minIdx + 1));
if (files.length === 0) {
  console.error('usage: review-quality.mts [--min N] <file.mdx> ...');
  process.exit(2);
}

let failed = false;
for (const file of files) {
  const raw = fs.readFileSync(file, 'utf8');
  const { data: fm, content } = matter(raw);
  const wordCount = content.split(/\s+/).filter(Boolean).length;
  const isV2 = fm.reviewLayout === 'v2';
  const q = computeContentQuality(content, wordCount, isV2, fm);
  const ok = q.score >= min;
  if (!ok) failed = true;
  console.log(`${ok ? '✓' : '✗'} ${file}  score=${q.score} (${q.breakdown})  v2=${isV2}`);
}
process.exit(failed ? 1 : 0);
