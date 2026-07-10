#!/usr/bin/env npx tsx
// scripts/validate-cockpit-rows.ts
// Cockpit seed-data gate (SEO addendum §12 "Provider-Rows validieren gegen Zod").
// The prod loader only LOGS-and-EXCLUDES rows whose `attributes` fail the topic's
// Zod schema (IS_DEV_THROW is off in prod) — a page can silently ship with <7
// providers. This script makes that failure loud BEFORE merge/deploy.
//
// Checks per (market, category, topic) combo:
//   1. A TopicConfig resolves for the combo's market (market-aware registry) —
//      a seeded combo without its market config is a hard stop condition.
//   2. Every active row's `attributes` passes the config's attributesSchema.
//   3. Every row has an `external_url` (visit-only CTA requirement for intl seeds).
//   4. Every `verdict.picks` slug exists among the combo's active rows.
//   5. Row count per combo is reported (target: 7).
//
// Usage (after applying seeds to prod):
//   npx tsx --env-file=.env.local scripts/validate-cockpit-rows.ts [market] [category] [topic]
//   — no args: validates ALL active non-US combos.
//   — with args: validates exactly one combo (e.g. au savings savings-accounts).

import { getTopicConfig } from '../lib/comparison/topics/index';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_KEY.\n' +
      'Run: node --env-file=.env.local ./node_modules/.bin/tsx scripts/validate-cockpit-rows.ts',
  );
  process.exit(1);
}

interface Row {
  market: string;
  category: string;
  topic: string | null;
  slug: string;
  active: boolean;
  is_affiliate: boolean;
  review_slug: string | null;
  external_url: string | null;
  source_url: string | null;
  data_verified_at: string | null;
  attributes: Record<string, unknown> | null;
}

async function fetchRows(filter: string): Promise<Row[]> {
  const url =
    `${SUPABASE_URL}/rest/v1/product_attributes` +
    `?select=market,category,topic,slug,active,is_affiliate,review_slug,external_url,source_url,data_verified_at,attributes` +
    `&active=eq.true&topic=not.is.null${filter}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${SERVICE_KEY}`, apikey: SERVICE_KEY! },
  });
  if (!res.ok) {
    console.error(`Supabase query failed (${res.status}): ${await res.text()}`);
    process.exit(1);
  }
  return (await res.json()) as Row[];
}

async function main(): Promise<void> {
  const [argMarket, argCategory, argTopic] = process.argv.slice(2);
  const filter =
    argMarket && argCategory && argTopic
      ? `&market=eq.${argMarket}&category=eq.${argCategory}&topic=eq.${argTopic}`
      : '&market=neq.us';

  const rows = await fetchRows(filter);
  if (rows.length === 0) {
    console.error(`No active rows found for filter "${filter}" — nothing to validate.`);
    process.exit(1);
  }

  // Group by combo.
  const combos = new Map<string, Row[]>();
  for (const row of rows) {
    const key = `${row.market}/${row.category}/${row.topic}`;
    combos.set(key, [...(combos.get(key) ?? []), row]);
  }

  let errors = 0;
  const fail = (msg: string) => {
    errors += 1;
    console.error(`  ❌ ${msg}`);
  };

  for (const [key, comboRows] of combos) {
    const [market, category, topic] = key.split('/');
    const before = errors;
    console.log(`\n▶ ${key} — ${comboRows.length} active row(s)${comboRows.length === 7 ? '' : ' (target: 7)'}`);

    const config = getTopicConfig(category, topic, market);
    if (!config) {
      fail(`no TopicConfig registered for '${market}:${category}/${topic}' — seeded rows would 404 (or is the registry key misspelled?)`);
      continue;
    }

    const slugs = new Set(comboRows.map((r) => r.slug));

    for (const row of comboRows) {
      const parsed = config.attributesSchema.safeParse(row.attributes ?? {});
      if (!parsed.success) {
        const issues = parsed.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`).join('; ');
        fail(`${row.slug}: attributes fail Zod — ${issues}`);
      }
      if (!row.external_url) {
        fail(`${row.slug}: external_url is NULL — visit-only CTA has no destination (stop condition)`);
      }
      if (!row.source_url) {
        fail(`${row.slug}: source_url is NULL — ranked-live rows need a primary source`);
      }
      if (!row.data_verified_at) {
        fail(`${row.slug}: data_verified_at is NULL — ranked-live rows need a verification date`);
      }
    }

    for (const pick of config.verdict.picks) {
      if (!slugs.has(pick.slug)) {
        fail(`verdict pick '${pick.slug}' has no matching active row — it would silently drop from the answer block`);
      }
    }

    if (errors === before) console.log('  ✅ all rows valid');
  }

  console.log(`\n${errors === 0 ? '✅ PASS' : `❌ FAIL — ${errors} error(s)`} across ${combos.size} combo(s), ${rows.length} row(s).`);
  process.exit(errors === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
