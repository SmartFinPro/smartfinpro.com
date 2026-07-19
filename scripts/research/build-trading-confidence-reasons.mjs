// scripts/research/build-trading-confidence-reasons.mjs
// REPRODUCIBLE generator: emits an UNAPPLIED migration that backfills
// attributes.confidence_reason for the trading-platform rows whose four Tier-1
// facts are fully sourced (confidence != low) in the source-matrix — i.e. the 8
// audited-intent rows. eToro is intentionally excluded (its extended_hours cell
// is low/open → not audited-intent; it already carries a T0b confidence_reason).
//
// This resolves the step-2 release-gate M1: with research_sources + methodology
// + confidence + data_verified_at (base seed) already present, the only missing
// audited invariant was confidence_reason. After this backfill, those rows
// satisfy every audited invariant and render with score + rank at runtime.
//
// The confidence_reason text is a FACTUAL provenance statement derived purely
// from the matrix (which facts, source class, verification date). It contains no
// person/qualification/testing claim — validated against
// lib/editorial/forbidden-claims.ts FORBIDDEN_CLAIM_PATTERNS by
// __tests__/unit/research-confidence-reasons-seed.test.ts.
//
// Run: node scripts/research/build-trading-confidence-reasons.mjs
// NOT auto-applied (deploy.yml runs no migrations). Manual, versioned-file only.

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const MATRIX = 'docs/superpowers/plans/2026-07-03-cockpit-trading-platforms-source-matrix.md';
const OUT = 'supabase/migrations/20260719140000_seed_trading_confidence_reasons.sql';

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
const ATTR_TO_KEY = {
  options_contract_fee: 'optionsFee',
  account_minimum: 'minDeposit',
  extended_hours: 'extendedHours',
  tradingview_integration: 'tradingview',
};
const REQUIRED_KEYS = ['optionsFee', 'minDeposit', 'extendedHours', 'tradingview'];
const FACT_LABEL = 'options contract fee, minimum deposit, extended-hours availability and TradingView integration';

// Local mirror of the forbidden-claim patterns (the authoritative set lives in
// lib/editorial/forbidden-claims.ts; the seed test checks the emitted SQL
// against it). Kept here so the generator itself fails closed.
const FORBIDDEN = [
  /\bexpert board\b/i,
  /distinguished specialists?/i,
  /expert[- ]fact[- ]checked/i,
  /hands[- ]on testing/i,
  /create real accounts/i,
  /\breviewedBy\b/i,
  /\bCFA\b/,
  /\bCFP\b/,
  /\bAFA\b/,
  /\[EXPERT NAME\]/i,
];

function parseMatrix(md) {
  const out = {};
  const malformed = [];
  for (const raw of md.split('\n')) {
    if (!raw.includes('|')) continue;
    const cells = raw.split('|').map((s) => s.trim());
    if (cells.length < 9 || cells[0] !== '') continue;
    const slug = PROVIDER_TO_SLUG[cells[1].replace(/\\/g, '')];
    const key = ATTR_TO_KEY[cells[2]];
    if (!slug || !key) continue;
    if (cells.length !== 9) {
      malformed.push(`${slug}.${key}: unexpected column count ${cells.length}`);
      continue;
    }
    (out[slug] ??= {})[key] = { sourceType: cells[5], confidence: cells[6], verifiedAt: cells[7], value: cells[3] };
  }
  return { out, malformed };
}

function build() {
  const md = readFileSync(resolve(MATRIX), 'utf8');
  const { out: parsed, malformed } = parseMatrix(md);
  const errors = [...malformed];
  const rows = [];

  for (const slug of Object.values(PROVIDER_TO_SLUG)) {
    const cells = parsed[slug] ?? {};
    // Audited-intent = all four Tier-1 keys present with confidence != low/open.
    const usable = REQUIRED_KEYS.every((k) => {
      const c = cells[k];
      return c && c.confidence !== 'low' && !/offen|nicht verifiziert/i.test(c.value);
    });
    if (!usable) continue; // e.g. eToro (extended_hours open) — skip

    const allOfficial = REQUIRED_KEYS.every((k) => cells[k].sourceType === 'official');
    const date = REQUIRED_KEYS.map((k) => cells[k].verifiedAt).sort().at(-1); // max verifiedAt
    const basis = allOfficial
      ? 'the official broker pricing pages'
      : 'official broker pricing pages and independent broker references';
    const reason = `All four compared facts — ${FACT_LABEL} — were verified against ${basis} on ${date}.`;

    const hit = FORBIDDEN.find((p) => p.test(reason));
    if (hit) errors.push(`${slug}: confidence_reason matches forbidden pattern ${hit}`);

    rows.push({ slug, reason });
  }

  if (rows.length !== 8) errors.push(`Expected 8 audited-intent rows, got ${rows.length}`);
  if (errors.length) {
    console.error('VALIDATION FAILED — no migration written:\n  ' + errors.join('\n  '));
    process.exit(1);
  }

  const stmts = rows
    .map((r) => {
      const jsonValue = JSON.stringify(r.reason).replace(/'/g, "''");
      return `UPDATE public.product_attributes
SET attributes = jsonb_set(attributes, '{confidence_reason}', '${jsonValue}'::jsonb, true)
WHERE slug = '${r.slug}' AND market = 'us' AND topic = 'trading-platforms';`;
    })
    .join('\n\n');

  const header = `-- GENERATED by scripts/research/build-trading-confidence-reasons.mjs — DO NOT EDIT BY HAND.
-- Backfills attributes.confidence_reason for the 8 fully-sourced (audited-intent)
-- us/trading/trading-platforms rows, resolving step-2 release-gate M1. The text
-- is a factual provenance statement derived from the source-matrix
--   ${MATRIX}
-- (no person/qualification/testing claim; checked against
-- lib/editorial/forbidden-claims.ts by the seed test).
--
-- eToro is deliberately NOT here: its extended_hours cell is low/open, so it is
-- not audited-intent and keeps its own T0b confidence_reason (stays provisional).
--
-- Apply AFTER 20260719130000_seed_trading_research_sources.sql. Together they
-- make these 8 rows satisfy every audited invariant → they render with score +
-- rank at runtime; eToro stays provisional.
--
-- APPLICATION: manual, ONLY via this versioned file (no service-key DML path).
-- NOT auto-applied. As of this commit: UNAPPLIED.
-- Regenerate with: node scripts/research/build-trading-confidence-reasons.mjs

BEGIN;

`;
  const rollback = `

COMMIT;

-- ── ROLLBACK (run manually) — removes only the keys this migration added ──
-- BEGIN;
-- UPDATE public.product_attributes
-- SET attributes = attributes - 'confidence_reason'
-- WHERE market = 'us' AND topic = 'trading-platforms'
--   AND slug IN (${rows.map((r) => `'${r.slug}'`).join(', ')});
-- COMMIT;
`;

  writeFileSync(resolve(OUT), header + stmts + rollback);
  console.log(`Wrote ${OUT}`);
  for (const r of rows) console.log(`  ${r.slug.padEnd(20)} ${r.reason}`);
  console.log(`\n${rows.length} rows backfilled. eToro excluded (provisional). All texts pass the forbidden-claim guard.`);
}

build();
