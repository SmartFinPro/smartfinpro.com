#!/usr/bin/env tsx
// ============================================================
// check-rule-freshness.mts — freshness gate for lib/rules/* (SPEC 8.5).
//
// Walks every RuleEntry across RULE_PACKS and flags entries whose
// verifiedAt is older than the SLA for their category:
//   rate: 90 days · limit/tax: 400 days · assumption: 365 days
//
// Additionally warns when today is within 30 days of a market's next
// rule-change stichtag (US/CA: 1 Jan · UK: 6 Apr · AU: 1 Jul) and no
// future-dated entry exists yet for that stichtag — i.e. a cliff is
// coming and nobody has verified the new number.
//
// Modeled on scripts/check-content-freshness.mjs.
//
// Usage:
//   npx tsx scripts/check-rule-freshness.mts            # warn, exit 0
//   npx tsx scripts/check-rule-freshness.mts --strict    # exit 1 on warn
//
// Exit code:
//   0 — always, unless --strict AND at least one warning was found
// ============================================================

import { RULE_PACKS } from '../lib/rules';
import type { RuleCategory } from '../lib/rules/types';

const STRICT = process.argv.includes('--strict');

const SLA_DAYS: Record<RuleCategory, number> = {
  rate: 90,
  limit: 400,
  tax: 400,
  assumption: 365,
};

// Market -> next recurring rule-change stichtag, as { month, day } (1-indexed month).
const STICHTAG: Record<'us' | 'ca' | 'uk' | 'au', { month: number; day: number }> = {
  us: { month: 1, day: 1 },
  ca: { month: 1, day: 1 },
  uk: { month: 4, day: 6 },
  au: { month: 7, day: 1 },
};

const NOW = new Date();
const TODAY_ISO = NOW.toISOString().split('T')[0];

function daysSince(iso: string): number {
  const then = new Date(iso);
  return Math.floor((NOW.getTime() - then.getTime()) / (24 * 60 * 60 * 1000));
}

// Next occurrence of {month, day} on/after `now` (same year if not yet passed, else next year).
function nextStichtag(now: Date, month: number, day: number): Date {
  const year = now.getFullYear();
  const candidate = new Date(Date.UTC(year, month - 1, day));
  if (candidate.getTime() >= Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())) {
    return candidate;
  }
  return new Date(Date.UTC(year + 1, month - 1, day));
}

function daysUntil(target: Date): number {
  const startOfToday = Date.UTC(NOW.getFullYear(), NOW.getMonth(), NOW.getDate());
  return Math.round((target.getTime() - startOfToday) / (24 * 60 * 60 * 1000));
}

interface Row {
  market: string;
  key: string;
  verifiedAt: string;
  ageDays: number;
  sla: number;
  status: 'ok' | 'warn';
  reason?: string;
}

const rows: Row[] = [];

for (const [market, pack] of Object.entries(RULE_PACKS)) {
  for (const [key, entries] of Object.entries(pack)) {
    if (!entries.length) continue;

    // Freshness SLA check — based on the most recently verified entry for this key.
    const newest = [...entries].sort((a, b) => (a.verifiedAt < b.verifiedAt ? 1 : -1))[0];
    const ageDays = daysSince(newest.verifiedAt);
    const sla = SLA_DAYS[newest.category];
    let status: 'ok' | 'warn' = ageDays > sla ? 'warn' : 'ok';
    let reason = status === 'warn' ? `verifiedAt exceeds ${sla}d SLA for category '${newest.category}'` : undefined;

    // Stichtag check: only meaningful for market-specific packs (not applicable
    // to assumption keys, which aren't tied to a jurisdiction's tax-year cliff).
    if (status === 'ok' && (market === 'us' || market === 'ca' || market === 'uk' || market === 'au')) {
      const { month, day } = STICHTAG[market];
      const target = nextStichtag(NOW, month, day);
      const until = daysUntil(target);
      if (until >= 0 && until < 30) {
        const stichtagIso = target.toISOString().split('T')[0];
        const hasFutureEntry = entries.some((e) => e.effectiveFrom >= stichtagIso);
        if (!hasFutureEntry) {
          status = 'warn';
          reason = `stichtag ${stichtagIso} is in ${until}d and no future-dated entry exists for '${key}'`;
        }
      }
    }

    rows.push({ market, key, verifiedAt: newest.verifiedAt, ageDays, sla, status, reason });
  }
}

// ── Output ───────────────────────────────────────────────────
console.log('');
console.log('📊 Rule Freshness Gate (lib/rules/*)');
console.log(`   Checked at: ${TODAY_ISO}`);
console.log('');

const header = ['key', 'market', 'verifiedAt', 'ageDays', 'sla', 'status'];
const colWidths = header.map((h) => h.length);
for (const r of rows) {
  colWidths[0] = Math.max(colWidths[0], r.key.length);
  colWidths[1] = Math.max(colWidths[1], r.market.length);
  colWidths[2] = Math.max(colWidths[2], r.verifiedAt.length);
  colWidths[3] = Math.max(colWidths[3], String(r.ageDays).length);
  colWidths[4] = Math.max(colWidths[4], String(r.sla).length);
  colWidths[5] = Math.max(colWidths[5], r.status.length);
}
const pad = (s: string, w: number) => s.padEnd(w, ' ');
console.log(header.map((h, i) => pad(h, colWidths[i])).join(' | '));
console.log(colWidths.map((w) => '-'.repeat(w)).join('-|-'));
for (const r of rows.sort((a, b) => (a.market + a.key).localeCompare(b.market + b.key))) {
  const icon = r.status === 'warn' ? '⚠️ ' : '';
  console.log(
    [
      pad(r.key, colWidths[0]),
      pad(r.market, colWidths[1]),
      pad(r.verifiedAt, colWidths[2]),
      pad(String(r.ageDays), colWidths[3]),
      pad(String(r.sla), colWidths[4]),
      pad(r.status, colWidths[5]),
    ].join(' | ') + (r.reason ? `  ${icon}${r.reason}` : '')
  );
}

const warnCount = rows.filter((r) => r.status === 'warn').length;
console.log('');
console.log(`   Entries checked: ${rows.length}`);
console.log(`   Warnings:        ${warnCount}`);

if (warnCount > 0) {
  console.log('');
  console.warn(`⚠️  ${warnCount} rule(s) need attention (see 'warn' rows above).`);
  if (STRICT) {
    process.exit(1);
  }
  process.exit(0);
} else {
  console.log('');
  console.log('✅ All rules within freshness SLA, no upcoming stichtag gaps.');
  process.exit(0);
}
