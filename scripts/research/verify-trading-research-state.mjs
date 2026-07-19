// scripts/research/verify-trading-research-state.mjs
// READ-ONLY verifier for the us/trading/trading-platforms rows. SELECT only —
// makes NO changes. Classifies each row exactly as lib/research/deriveResearchScore
// would (mirrored audited gate) and checks the runbook end-state:
//   • 9 rows present
//   • exactly 8 audited / 1 provisional
//   • eToro is the only provisional row
//   • no audited row is missing provenance (4/4 sources) or confidence_reason
// Exit code 0 only when ALL end-state checks pass.
//
// Run BEFORE apply (expect 9 provisional — nothing seeded yet) and AFTER apply
// (expect 8 audited / 1 provisional).
//   node --env-file=.env.local scripts/research/verify-trading-research-state.mjs

import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_KEY;
if (!url || !key) {
  console.error('Missing env — run with --env-file=.env.local');
  process.exit(1);
}

// The 4 visible Tier-1 fact keys (TopicConfig.specColumns for trading-platforms).
const REQUIRED_KEYS = ['optionsFee', 'minDeposit', 'extendedHours', 'tradingview'];
const isIsoDate = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));
const isHttpsUrl = (v) => {
  try {
    return new URL(v).protocol === 'https:';
  } catch {
    return false;
  }
};
const validFieldSource = (s) =>
  s && typeof s === 'object' && isHttpsUrl(s.sourceUrl) &&
  ['official', 'regulator', 'editorial', 'user_reviews'].includes(s.sourceType) && isIsoDate(s.verifiedAt);

// Mirror of deriveResearchScore's status gate (lib/research/types.ts).
function classify(row) {
  if (row.research_status === 'unavailable') return 'unavailable';
  const score = typeof row.score === 'number' && Number.isFinite(row.score) && row.score >= 0 && row.score <= 10 ? row.score : null;
  if (score === null) return 'unavailable';
  const fs = row.research_sources && typeof row.research_sources === 'object' ? row.research_sources : {};
  const everySourced = REQUIRED_KEYS.every((k) => validFieldSource(fs[k]));
  const reason = row.attributes && typeof row.attributes.confidence_reason === 'string' ? row.attributes.confidence_reason.trim() : '';
  const audited =
    row.research_status === 'audited' &&
    typeof row.methodology_version === 'string' && row.methodology_version.trim().length > 0 &&
    isIsoDate(row.data_verified_at) &&
    ['high', 'medium', 'low'].includes(row.confidence) &&
    reason.length > 0 &&
    everySourced;
  return audited ? 'audited' : 'provisional';
}

const supabase = createClient(url, key, { auth: { persistSession: false } });
const { data, error } = await supabase
  .from('product_attributes')
  .select('*')
  .eq('market', 'us').eq('category', 'trading').eq('topic', 'trading-platforms')
  .order('slug');
if (error) {
  console.error('Query failed:', error.message);
  process.exit(1);
}

const rows = data.map((r) => ({ slug: r.slug, status: classify(r), sources: Object.keys(r.research_sources ?? {}).length, hasReason: !!(r.attributes && r.attributes.confidence_reason) }));
console.log('slug'.padEnd(20), 'status'.padEnd(12), 'sources', 'reason');
for (const r of rows) console.log(r.slug.padEnd(20), r.status.padEnd(12), `${r.sources}/4`.padEnd(7), r.hasReason ? 'yes' : 'no');

const audited = rows.filter((r) => r.status === 'audited');
const provisional = rows.filter((r) => r.status === 'provisional');
const unavailable = rows.filter((r) => r.status === 'unavailable');
console.log(`\n${data.length} rows · ${audited.length} audited · ${provisional.length} provisional · ${unavailable.length} unavailable`);

const checks = [
  ['9 rows present', data.length === 9],
  ['exactly 8 audited', audited.length === 8],
  ['exactly 1 provisional', provisional.length === 1],
  ['eToro is the only provisional', provisional.length === 1 && provisional[0].slug === 'etoro'],
  ['no audited row missing 4/4 sources', audited.every((r) => r.sources === 4)],
  ['no audited row missing confidence_reason', audited.every((r) => r.hasReason)],
];
console.log('\nEnd-state checks:');
let allPass = true;
for (const [label, ok] of checks) {
  console.log(`  ${ok ? '✓' : '✗'} ${label}`);
  if (!ok) allPass = false;
}
console.log(allPass ? '\nALL END-STATE CHECKS PASS ✓' : '\nEND-STATE NOT YET REACHED (expected before apply; must pass after)');
process.exit(allPass ? 0 : 1);
