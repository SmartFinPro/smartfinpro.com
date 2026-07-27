// scripts/research/snapshot-trading-rows.mjs
// READ-ONLY pre-apply snapshot of the 9 us/trading/trading-platforms rows.
// SELECT only — makes NO changes. Writes a JSON snapshot (rollback reference)
// and prints the pre-apply state + a linchpin check (does every row already
// carry confidence + data_verified_at, so the research seeds will yield audited).
//
// Run: node --env-file=.env.local scripts/research/snapshot-trading-rows.mjs

import { createClient } from '@supabase/supabase-js';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_KEY;
const OUT = 'docs/superpowers/plans/data/2026-07-19-trading-research-pre-apply-snapshot.json';

if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_KEY — run with --env-file=.env.local');
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

const { data, error } = await supabase
  .from('product_attributes')
  .select('*')
  .eq('market', 'us')
  .eq('category', 'trading')
  .eq('topic', 'trading-platforms')
  .order('slug');

if (error) {
  console.error('Query failed:', error.message);
  process.exit(1);
}

mkdirSync(dirname(resolve(OUT)), { recursive: true });
writeFileSync(resolve(OUT), JSON.stringify(data, null, 2));

console.log(`Wrote snapshot of ${data.length} rows → ${OUT}\n`);
console.log('slug'.padEnd(20), 'confidence'.padEnd(11), 'data_verified_at'.padEnd(18), 'research_status', 'has_conf_reason');
let linchpinOk = 0;
for (const r of data) {
  const hasReason = !!(r.attributes && r.attributes.confidence_reason);
  const ready = r.confidence != null && r.data_verified_at != null;
  if (ready) linchpinOk++;
  console.log(
    String(r.slug).padEnd(20),
    String(r.confidence ?? '—').padEnd(11),
    String(r.data_verified_at ?? '—').padEnd(18),
    String(r.research_status ?? '—').padEnd(15),
    hasReason ? 'yes' : 'no',
  );
}
console.log(`\nRow count: ${data.length} (expected 9)`);
console.log(`Linchpin (confidence + data_verified_at present): ${linchpinOk}/${data.length}`);
