// Pure Ableitung für docs/reviews/broker-v2-readiness.yml — das Cockpit-Vor-Gate
// aus docs/reviews/broker-v2-standard.md §E. Kein IO hier: der Generator
// (scripts/generate-broker-v2-readiness.mts) liefert Kandidaten + DB-Rows.
// Statuswerte sind die geschlossene Menge aus der Rollout-Spec (Rev. 2).

export type ReadinessStatus =
  | 'ready' | 'missing-topic' | 'missing-product' | 'empty-field' | 'audit-error';

export interface ReadinessCandidate {
  path: string;
  market: string;
  category: string;
  slug: string; // review slug, z. B. "interactive-brokers-review"
}

/** Schmaler Ausschnitt einer product_attributes-Row (Spaltennamen = DB). */
export interface CockpitRowLite {
  market: string;
  category: string;
  topic: string;
  slug: string;
  review_slug: string | null;
  score: number | null;
  is_top_pick: boolean | null;
  data_verified_at: string | null;
  attributes: Record<string, unknown> | null;
}

export interface ReadinessEntry {
  status: ReadinessStatus;
  topic: string | null;
  productSlug: string | null;
  reviewSlug: string;
  rank: number | null;
  fieldCount: number | null;
  dataVerifiedAt: string | null;
  auditedAt: string;
}

export function countFields(attributes: Record<string, unknown> | null): number {
  if (!attributes) return 0;
  return Object.values(attributes)
    .filter((v) => v !== null && v !== undefined && v !== '').length;
}

/**
 * Deterministische Snapshot-Ordnung: is_top_pick desc → score desc (nulls last)
 * → slug asc. Bewusst NICHT das Laufzeit-Smart-Ranking (das hängt an
 * Usage-Defaults); `rank` ist ein informatives Snapshot-Feld.
 */
export function rankRows(rows: CockpitRowLite[]): CockpitRowLite[] {
  return [...rows].sort((a, b) => {
    const pick = Number(!!b.is_top_pick) - Number(!!a.is_top_pick);
    if (pick !== 0) return pick;
    if (a.score !== b.score) {
      if (a.score === null) return 1;
      if (b.score === null) return -1;
      return b.score - a.score;
    }
    return a.slug.localeCompare(b.slug);
  });
}

export function deriveReadinessEntry(
  candidate: ReadinessCandidate,
  topicsForMarketCategory: string[],
  rowsByTopic: Map<string, CockpitRowLite[]>,
  auditedAt: string,
): ReadinessEntry {
  const base: ReadinessEntry = {
    status: 'missing-topic', topic: null, productSlug: null,
    reviewSlug: candidate.slug, rank: null, fieldCount: null,
    dataVerifiedAt: null, auditedAt,
  };
  if (topicsForMarketCategory.length === 0) return base;

  for (const topic of topicsForMarketCategory) {
    const rows = rowsByTopic.get(topic) ?? [];
    const match = rows.find((r) => r.review_slug === candidate.slug);
    if (!match) continue;

    const fieldCount = countFields(match.attributes);
    const complete = fieldCount > 0 && !!match.data_verified_at && match.score !== null;
    const rank = complete
      ? rankRows(rows).findIndex((r) => r.slug === match.slug) + 1
      : null;
    return {
      ...base,
      status: complete ? 'ready' : 'empty-field',
      topic,
      productSlug: match.slug,
      rank,
      fieldCount,
      dataVerifiedAt: match.data_verified_at,
    };
  }
  return { ...base, status: 'missing-product' };
}
