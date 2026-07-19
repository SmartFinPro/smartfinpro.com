// scripts/research/build-trading-research-sources.mjs
// REPRODUCIBLE generator: reads the audited Best-Trading-Platforms source-matrix
// and emits an UNAPPLIED migration that seeds product_attributes.research_sources
// (per-Tier-1-fact provenance) + methodology_version + a matrix-derived
// research_status intent. Run:  node scripts/research/build-trading-research-sources.mjs
//
// It does NOT touch the database. It only reads the matrix markdown and writes
// the migration SQL. Every emitted FieldSource is validated here (mirroring
// lib/research/types.ts FieldSourceSchema — the authoritative runtime boundary);
// the script exits non-zero if any included cell is malformed.
//
// Rules honored (source-matrix §7 / §133): cells with confidence 'low' (or the
// "offen — nicht verifiziert" marker) are NOT seeded — the corresponding
// research_sources key is omitted, which makes that row provisional at runtime
// (deriveResearchScore). Concretely this drops eToro's extended_hours cell.
//
// research_status here is an editorial INTENT derived reproducibly from the
// matrix (audited iff all 4 required Tier-1 keys are sourced high/medium; else
// provisional). It is subordinate to runtime degradation: a row also needs a
// confidence_reason etc. to actually render as audited (see review notes).

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const MATRIX = 'docs/superpowers/plans/2026-07-03-cockpit-trading-platforms-source-matrix.md';
const OUT = 'supabase/migrations/20260719130000_seed_trading_research_sources.sql';
const METHODOLOGY_VERSION = 'trading-platforms-v1';

// Matrix "Provider" display name -> product_attributes.slug (the 9 candidates).
const PROVIDER_TO_SLUG = {
  Fidelity: 'fidelity',
  'Charles Schwab': 'charles-schwab',
  'Interactive Brokers': 'interactive-brokers',
  Robinhood: 'robinhood',
  eToro: 'etoro',
  Webull: 'webull',
  'E*TRADE': 'etrade',
  tastytrade: 'tastytrade',
  'Merrill Edge': 'merrill-edge',
};

// Matrix attribute -> TopicConfig specColumn key (the visible Tier-1 facts).
const ATTR_TO_KEY = {
  options_contract_fee: 'optionsFee',
  account_minimum: 'minDeposit',
  extended_hours: 'extendedHours',
  tradingview_integration: 'tradingview',
};
const REQUIRED_KEYS = ['optionsFee', 'minDeposit', 'extendedHours', 'tradingview'];
const VALID_SOURCE_TYPES = new Set(['official', 'regulator', 'editorial', 'user_reviews']);

// FieldSource validation — mirrors lib/research/types.ts FieldSourceSchema.
const isHttpsUrl = (v) => {
  try {
    return new URL(v).protocol === 'https:';
  } catch {
    return false;
  }
};
const isIsoDate = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));

function parseMatrix(md) {
  // Collect { slug: { key: {cell} } } from the main 7-column table rows.
  const out = {};
  const malformed = [];
  for (const raw of md.split('\n')) {
    if (!raw.includes('|')) continue;
    const cells = raw.split('|').map((s) => s.trim());
    // "| Provider | Attribut | Wert | source_url | source_type | confidence | data_verified_at |"
    if (cells.length < 9 || cells[0] !== '') continue;
    const provider = cells[1].replace(/\\/g, '');
    const attribut = cells[2];
    const slug = PROVIDER_TO_SLUG[provider];
    const key = ATTR_TO_KEY[attribut];
    if (!slug || !key) continue; // not a target provider/attribute row
    // A well-formed 7-column row splits into exactly 9 parts (two empty ends).
    // More parts on a TARGET row means a '|' leaked into a cell value → the
    // source_url/type/date columns would shift silently. Fail loudly instead.
    if (cells.length !== 9) {
      malformed.push(`${slug}.${key}: unexpected column count ${cells.length} (a '|' in a cell value?)`);
      continue;
    }
    (out[slug] ??= {})[key] = {
      value: cells[3],
      sourceUrl: cells[4],
      sourceType: cells[5],
      confidence: cells[6],
      verifiedAt: cells[7],
    };
  }
  return { out, malformed };
}

function build() {
  const md = readFileSync(resolve(MATRIX), 'utf8');
  const { out: parsed, malformed } = parseMatrix(md);

  const errors = [...malformed];
  const rows = []; // { slug, researchSources, status, includedKeys, droppedLow }

  for (const [provider, slug] of Object.entries(PROVIDER_TO_SLUG)) {
    const cellsForSlug = parsed[slug];
    if (!cellsForSlug) {
      errors.push(`No matrix rows found for ${provider} (${slug})`);
      continue;
    }
    const researchSources = {};
    const droppedLow = [];
    for (const key of REQUIRED_KEYS) {
      const cell = cellsForSlug[key];
      if (!cell) {
        // Absent target cell — leave the key unsourced (row becomes provisional).
        continue;
      }
      if (cell.confidence === 'low' || /offen|nicht verifiziert/i.test(cell.value)) {
        droppedLow.push(key); // honesty rule: never seed a low/open cell
        continue;
      }
      // Validate the FieldSource we are about to seed.
      if (!isHttpsUrl(cell.sourceUrl)) errors.push(`${slug}.${key}: non-HTTPS sourceUrl "${cell.sourceUrl}"`);
      if (!VALID_SOURCE_TYPES.has(cell.sourceType)) errors.push(`${slug}.${key}: bad sourceType "${cell.sourceType}"`);
      if (!isIsoDate(cell.verifiedAt)) errors.push(`${slug}.${key}: bad verifiedAt "${cell.verifiedAt}"`);
      researchSources[key] = {
        sourceUrl: cell.sourceUrl,
        sourceType: cell.sourceType,
        verifiedAt: cell.verifiedAt,
      };
    }
    const includedKeys = Object.keys(researchSources);
    // Matrix-derived intent: audited only if every required Tier-1 key is sourced.
    const status = includedKeys.length === REQUIRED_KEYS.length ? 'audited' : 'provisional';
    rows.push({ slug, researchSources, status, includedKeys, droppedLow });
  }

  if (errors.length) {
    console.error('VALIDATION FAILED — no migration written:\n  ' + errors.join('\n  '));
    process.exit(1);
  }

  // Emit the migration (deterministic order = PROVIDER_TO_SLUG order).
  const stmts = rows
    .map((r) => {
      const json = JSON.stringify(r.researchSources).replace(/'/g, "''");
      return `-- ${r.slug}: ${r.status} (${r.includedKeys.length}/${REQUIRED_KEYS.length} Tier-1 facts sourced${
        r.droppedLow.length ? `; dropped low/open: ${r.droppedLow.join(', ')}` : ''
      })
UPDATE public.product_attributes
SET research_sources    = '${json}'::jsonb,
    methodology_version = '${METHODOLOGY_VERSION}',
    research_status     = '${r.status}'
WHERE slug = '${r.slug}' AND market = 'us' AND category = 'trading' AND topic = 'trading-platforms';`;
    })
    .join('\n\n');

  const header = `-- GENERATED by scripts/research/build-trading-research-sources.mjs — DO NOT EDIT BY HAND.
-- Seeds product_attributes.research_sources (per-Tier-1-fact provenance) +
-- methodology_version + a matrix-derived research_status intent, for
-- us/trading/trading-platforms, from the audited source-matrix
--   ${MATRIX}
--
-- research_status is an editorial INTENT (audited iff all ${REQUIRED_KEYS.length} required Tier-1
-- keys [${REQUIRED_KEYS.join(', ')}] are sourced with confidence != low). It is
-- SUBORDINATE to runtime degradation (lib/research/deriveResearchScore): a row
-- also needs confidence_reason + confidence to actually render as audited.
-- Low/open cells are intentionally NOT seeded (source-matrix §7/§133) — e.g.
-- eToro.extendedHours (confidence low, "offen — nicht verifiziert").
--
-- APPLICATION: manual, ONLY via this versioned file (no service-key DML path).
-- NOT auto-applied (deploy.yml runs no migrations). As of this commit: UNAPPLIED.
-- Regenerate with: node scripts/research/build-trading-research-sources.mjs

BEGIN;

`;
  const rollback = `

COMMIT;

-- ── ROLLBACK (run manually) ──
-- BEGIN;
-- UPDATE public.product_attributes
-- SET research_sources = NULL, methodology_version = NULL, research_status = NULL
-- WHERE market = 'us' AND category = 'trading' AND topic = 'trading-platforms'
--   AND slug IN (${rows.map((r) => `'${r.slug}'`).join(', ')});
-- COMMIT;
`;

  mkdirSync(dirname(resolve(OUT)), { recursive: true });
  writeFileSync(resolve(OUT), header + stmts + rollback);

  // Human-readable summary.
  console.log(`Wrote ${OUT}`);
  console.log('Provider'.padEnd(20), 'status'.padEnd(12), 'sourced');
  for (const r of rows) {
    console.log(
      r.slug.padEnd(20),
      r.status.padEnd(12),
      `${r.includedKeys.length}/${REQUIRED_KEYS.length}`,
      r.droppedLow.length ? `(dropped low/open: ${r.droppedLow.join(', ')})` : '',
    );
  }
  const audited = rows.filter((r) => r.status === 'audited').length;
  console.log(`\nSummary: ${audited} audited-intent, ${rows.length - audited} provisional. All FieldSources valid.`);
}

build();
