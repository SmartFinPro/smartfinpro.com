// scripts/generate-broker-v2-readiness.mts
// Generiert docs/reviews/broker-v2-readiness.yml — reiner Cockpit-Snapshot
// (Spec Rev. 2: keine redaktionellen Felder; die gehören in Triage/Dossiers).
// Read-only SELECT auf Prod product_attributes. Aufruf:
//   npx tsx --env-file=.env.local scripts/generate-broker-v2-readiness.mts [--check]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { BEST_X_MANIFEST } from '@/lib/comparison/topics/manifest';
import {
  deriveReadinessEntry,
  type CockpitRowLite,
  type ReadinessCandidate,
  type ReadinessEntry,
} from '@/lib/reviews/readiness';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const INVENTORY = path.join(ROOT, 'docs/reviews/broker-v2-inventory.json');
const OUT = path.join(ROOT, 'docs/reviews/broker-v2-readiness.yml');
const CHECK = process.argv.includes('--check');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_KEY;
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_KEY — run with --env-file=.env.local');
  process.exit(2);
}
const supabase = createClient(url, key);

interface InventoryFile {
  reviews: Array<{ path: string; market: string; category: string; slug: string }>;
}

function yamlEscape(v: string | number | null): string {
  if (v === null) return 'null';
  if (typeof v === 'number') return String(v);
  return /^[A-Za-z0-9_./-]+$/.test(v) ? v : JSON.stringify(v);
}

function emitYaml(entries: Map<string, ReadinessEntry>, generatedAt: string): string {
  const lines = [
    '# Generierter Cockpit-Snapshot — nicht von Hand editieren (npm run readiness:reviews).',
    '# empty-field = Row vorhanden, aber Felder/Prüfdatum/Score unvollständig.',
    'version: 1',
    `generatedAt: ${generatedAt}`,
    'reviews:',
  ];
  for (const [p, e] of [...entries.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    lines.push(`  ${p}:`);
    lines.push(`    status: ${e.status}`);
    lines.push(`    topic: ${yamlEscape(e.topic)}`);
    lines.push(`    productSlug: ${yamlEscape(e.productSlug)}`);
    lines.push(`    reviewSlug: ${yamlEscape(e.reviewSlug)}`);
    lines.push(`    rank: ${yamlEscape(e.rank)}`);
    lines.push(`    fieldCount: ${yamlEscape(e.fieldCount)}`);
    lines.push(`    dataVerifiedAt: ${yamlEscape(e.dataVerifiedAt)}`);
    lines.push(`    auditedAt: ${e.auditedAt}`);
  }
  return lines.join('\n') + '\n';
}

/** generatedAt + auditedAt sind Lauf-Zeitstempel, kein Sach-Drift — für --check beidseitig neutralisieren. */
const stripVolatile = (s: string) =>
  s
    .replace(/^generatedAt: .*$/m, 'generatedAt: <ignored>')
    .replace(/^( +)auditedAt: .*$/gm, '$1auditedAt: <ignored>');

async function main() {
  const inv: InventoryFile = JSON.parse(fs.readFileSync(INVENTORY, 'utf8'));
  const candidates: ReadinessCandidate[] = inv.reviews.map((r) => ({
    path: r.path, market: r.market, category: r.category, slug: r.slug,
  }));

  const auditedAt = new Date().toISOString().slice(0, 10);
  const generatedAt = new Date().toISOString();
  const entries = new Map<string, ReadinessEntry>();
  let hadAuditError = false;

  // Ein Query pro (market, category) — Topics kommen aus dem Manifest (pure data).
  const groups = new Map<string, ReadinessCandidate[]>();
  for (const c of candidates) {
    const k = `${c.market}/${c.category}`;
    groups.set(k, [...(groups.get(k) ?? []), c]);
  }

  for (const [k, group] of groups) {
    const [market, category] = k.split('/');
    const topics = BEST_X_MANIFEST
      .filter((e) => e.market === market && e.category === category)
      .map((e) => e.topic);

    const rowsByTopic = new Map<string, CockpitRowLite[]>();
    let auditError = false;
    if (topics.length > 0) {
      const { data, error } = await supabase
        .from('product_attributes')
        .select('market, category, topic, slug, review_slug, score, is_top_pick, data_verified_at, attributes')
        .eq('market', market)
        .eq('category', category)
        .in('topic', topics);
      if (error) {
        console.error(`[audit-error] ${k}: ${error.message}`);
        auditError = true;
        hadAuditError = true;
      } else {
        for (const row of (data ?? []) as CockpitRowLite[]) {
          rowsByTopic.set(row.topic, [...(rowsByTopic.get(row.topic) ?? []), row]);
        }
      }
    }

    for (const c of group) {
      entries.set(
        c.path,
        auditError
          ? { status: 'audit-error', topic: null, productSlug: null, reviewSlug: c.slug,
              rank: null, fieldCount: null, dataVerifiedAt: null, auditedAt }
          : deriveReadinessEntry(c, topics, rowsByTopic, auditedAt),
      );
    }
  }

  const yaml = emitYaml(entries, generatedAt);

  if (hadAuditError) {
    console.error('❌ audit-error bei mindestens einer (market, category)-Query — Snapshot unvollständig, nichts geschrieben.');
    process.exit(1);
  }

  if (CHECK) {
    const existing = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
    if (stripVolatile(existing) !== stripVolatile(yaml)) {
      console.error('❌ readiness drift — run: npx tsx --env-file=.env.local scripts/generate-broker-v2-readiness.mts');
      process.exit(1);
    }
    console.log('✓ broker-v2-readiness.yml is current');
    return;
  }

  fs.writeFileSync(OUT, yaml);
  const counts = [...entries.values()].reduce<Record<string, number>>(
    (acc, e) => ((acc[e.status] = (acc[e.status] ?? 0) + 1), acc), {});
  console.log('✓ wrote docs/reviews/broker-v2-readiness.yml', counts);
}

main().catch((err) => { console.error(err); process.exit(2); });
