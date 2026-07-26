// lib/comparison/bridge.ts
// Server-only data layer for the DecisionBridge ("Market Check") — the
// review-article → cockpit bridge that replaces <ExpertBox> (Task 5a,
// editorial integrity remediation). See
// docs/superpowers/specs/2026-07-17-cockpit-bridge-design.md (V15 section for
// the visual contract; the data contract, topic-resolution ladder and
// architecture in the sections above it remain authoritative).
//
// Everything here is derived from `product_attributes` via the existing,
// already-validated `getCockpitData` loader (Zod-validated, attribution-gated,
// Smart-Rank ordered). This module invents no query, no sort order, and no
// prose — every DecisionBridgeData field is either a passthrough of one
// already-loaded ProductForComparison value or a plain numeric aggregate
// (max/min/count/filter) over the field. `bestFor` / `pros` / `cons` /
// `deepDive` are never read here — those fields are unaudited (Task 10 is the
// blocker before anything downstream of them can be trusted).

import 'server-only';

import { unstable_cache } from 'next/cache';
import type { Market, Category } from '@/lib/i18n/config';
import type { DecisionBridgeData, ProductForComparison } from './types';
import { BEST_X_MANIFEST, type BestXManifestEntry } from './topics/manifest';
import { getTopicConfig } from './topics/index';
import { getCockpitData } from './loader';

/**
 * Pure aggregation for one resolved topic: leader/spread/confidence stats
 * over the whole field, plus (if the article's product is in the field) its
 * position. No I/O — `products` must already be the getCockpitData-ordered
 * array for `entry.topic`.
 *
 * Returns null ("Zustand C" for this topic) when the field is empty, or when
 * the leader's own score is <= 0 (a loader coercion of a missing score to 0 —
 * treated as "no usable data" per spec, not as a real last-place score).
 */
function aggregateTopic(
  entry: BestXManifestEntry,
  products: ProductForComparison[],
  slug: string,
): DecisionBridgeData | null {
  if (!Array.isArray(products) || products.length === 0) return null;

  const leader = products[0];
  if (!(leader.score > 0)) return null;

  const scores = products.map((p) => p.score);
  const scoreMin = Math.min(...scores);
  const scoreMax = Math.max(...scores);

  const verifiedDates = products
    .map((p) => p.dataVerifiedAt)
    .filter((d): d is string => typeof d === 'string' && d.length > 0);
  const lastVerified = verifiedDates.length > 0 ? verifiedDates.slice().sort().at(-1)! : null;

  const officialSourceCount = products.filter((p) => p.sourceType === 'official').length;

  const confidenceMix = { high: 0, medium: 0, low: 0 };
  for (const p of products) {
    if (p.confidence === 'high') confidenceMix.high += 1;
    else if (p.confidence === 'medium') confidenceMix.medium += 1;
    else if (p.confidence === 'low') confidenceMix.low += 1;
  }

  const matchIdx = products.findIndex((p) => p.reviewSlug === slug);

  const fieldBestSubScores: Record<string, number> = {};
  for (const p of products) {
    if (!p.subScores || typeof p.subScores !== 'object') continue;
    for (const [key, value] of Object.entries(p.subScores)) {
      if (typeof value !== 'number' || !Number.isFinite(value)) continue;
      if (!(key in fieldBestSubScores) || value > fieldBestSubScores[key]) {
        fieldBestSubScores[key] = value;
      }
    }
  }

  const field = products.map((p, idx) => ({
    rank: idx + 1,
    name: p.displayName,
    score: p.score,
    reviewHref: p.reviewSlug ? `/${entry.market}/${entry.category}/${p.reviewSlug}` : null,
    isYou: idx === matchIdx,
  }));

  let position: DecisionBridgeData['position'] = null;
  if (matchIdx !== -1) {
    const p = products[matchIdx];
    // position.score <= 0 → degrade to "Zustand B" (position stays null);
    // the field-level stats above are still valid and get returned.
    if (p.score > 0) {
      position = {
        rank: matchIdx + 1,
        slug: p.slug,
        name: p.displayName,
        score: p.score,
        subScores: p.subScores && typeof p.subScores === 'object' ? p.subScores : {},
        confidence: p.confidence,
        dataVerifiedAt: p.dataVerifiedAt,
        isTopPick: p.isTopPick,
      };
    }
  }

  return {
    market: entry.market,
    category: entry.category,
    topic: entry.topic,
    topicLabel: entry.label,
    cockpitHref: `/${entry.market}/${entry.category}/best/${entry.topic}`,
    fieldCount: products.length,
    leader: { name: leader.displayName, score: leader.score },
    scoreMin,
    scoreMax,
    lastVerified,
    officialSourceCount,
    confidenceMix,
    field,
    fieldBestSubScores,
    position,
  };
}

/**
 * Pure "ladder + aggregation" core — no Supabase, no fetch. Unit-testable
 * with plain fixtures. `entries` is every BEST_X_MANIFEST row for the
 * article's market×category (legacy entries are filtered out here);
 * `productsByTopic` must already hold the getCockpitData result for every
 * non-legacy entry's topic (the async wrapper below loads all of them, at
 * most 4 today — only us/personal-finance has more than one topic).
 *
 * Resolution ladder (spec §"Topic-Auflösung"):
 *   1. Frontmatter override `cockpitTopic` — accepted only if it names a
 *      real (non-legacy) manifest entry for this market×category AND a
 *      registered TopicConfig exists. If accepted, its outcome (including
 *      null) is FINAL — no fallthrough to steps 2/3. If invalid, warn and
 *      fall through.
 *   2. Product match — first entry (manifest order) whose field contains a
 *      product with reviewSlug === slug wins.
 *   3. Unique topic — exactly one non-legacy entry has data → use it
 *      (position stays null; step 2 already proved no match there).
 *   4. Otherwise null.
 */
export function buildDecisionBridgeData(
  entries: BestXManifestEntry[],
  productsByTopic: Map<string, ProductForComparison[]>,
  slug: string,
  override?: string,
): DecisionBridgeData | null {
  const candidates = entries.filter((e) => !e.legacy);
  if (candidates.length === 0) return null;

  // Stufe 1 — Frontmatter-Override.
  if (override) {
    const entry = candidates.find((e) => e.topic === override);
    const validConfig = entry ? getTopicConfig(entry.category, entry.topic, entry.market) : null;
    if (entry && validConfig) {
      const products = productsByTopic.get(entry.topic) ?? [];
      return aggregateTopic(entry, products, slug);
    }
    console.warn(
      `[decision-bridge] invalid cockpitTopic override "${override}" for ${entries[0]?.market}/${entries[0]?.category} — falling back to auto-resolution`,
    );
  }

  // Stufe 2 — Produkt-Match (Manifest-Reihenfolge).
  const fetched: { entry: BestXManifestEntry; products: ProductForComparison[] }[] = [];
  for (const entry of candidates) {
    const products = productsByTopic.get(entry.topic) ?? [];
    fetched.push({ entry, products });
    if (products.some((p) => p.reviewSlug === slug)) {
      return aggregateTopic(entry, products, slug);
    }
  }

  // Stufe 3 — Eindeutiges Topic (genau ein Kandidat mit Daten).
  const withData = fetched.filter((f) => f.products.length > 0);
  if (withData.length === 1) {
    return aggregateTopic(withData[0].entry, withData[0].products, slug);
  }

  // Stufe 4 — kein eindeutiges Ergebnis.
  return null;
}

async function resolveDecisionBridgeData(
  market: Market,
  category: Category,
  slug: string,
  frontmatterTopic?: string,
): Promise<DecisionBridgeData | null> {
  const entries = BEST_X_MANIFEST.filter((e) => e.market === market && e.category === category);
  const candidates = entries.filter((e) => !e.legacy);
  if (candidates.length === 0) return null;

  // Bounded: at most 4 getCockpitData calls per page today (only
  // us/personal-finance has more than one non-legacy topic); everywhere else
  // this is exactly 1. Cost falls at build time — pages are SSG.
  const productsByTopic = new Map<string, ProductForComparison[]>();
  for (const entry of candidates) {
    productsByTopic.set(entry.topic, await getCockpitData(entry.market, entry.category, entry.topic));
  }

  return buildDecisionBridgeData(entries, productsByTopic, slug, frontmatterTopic);
}

const cachedResolveDecisionBridgeData = unstable_cache(
  resolveDecisionBridgeData,
  ['decision-bridge'],
  { revalidate: 3600, tags: ['comparison-index'] },
);

/**
 * Resolve the DecisionBridge payload for one review/guide article. Never
 * throws — a resolution failure degrades to null (no panel), it never takes
 * the page down with it.
 */
export async function getDecisionBridgeData(
  market: Market,
  category: Category,
  slug: string,
  frontmatterTopic?: string,
): Promise<DecisionBridgeData | null> {
  try {
    return await cachedResolveDecisionBridgeData(market, category, slug, frontmatterTopic);
  } catch (err) {
    console.warn('[decision-bridge] resolution failed, degrading to null', err);
    return null;
  }
}
