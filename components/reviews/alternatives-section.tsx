// components/reviews/alternatives-section.tsx — V2 "Alternatives" layout zone (T12)
// ============================================================
// Server Component. Layout-owned nav anchor ('alternatives' in
// lib/reviews/section-anchors.ts — REVIEW_V2_ANCHORS) — rendered by
// ReviewLayoutV2 directly, never by MDX (T0a: no doubling).
//
// Source-of-truth (T0d): `alternatives` (name/slug/whyInstead/facts) is
// hand-verified frontmatter (lib/reviews/verdict-frontmatter.ts
// AlternativesSchema, 2-3 entries) — never the unaudited DB `best_for`/
// `pros`/`cons`/`deep_dive`. `field`/`fieldCount`/`topicLabel`/`cockpitHref`
// are optional enrichment straight from DecisionBridgeData (lib/comparison/
// types.ts) — pure passthrough/aggregate, same discipline as
// components/marketing/decision-bridge.tsx.
//
// reviewHref-Muster: `/${market}/${category}/${slug}` — the same
// construction lib/comparison/cta.ts's reviewHrefFor() and lib/comparison/
// bridge.ts's field.reviewHref already use.
//
// Score/rank enrichment: an alternative's card shows a score badge only when
// its `name` case-insensitively matches a row in the optional `field` array
// (DecisionBridgeData has no `slug` on DecisionBridgeFieldRow to match on).
// Null-Degradation (plan Pflicht, tested): when `field` is absent, or none
// of the alternatives match a row, every card renders WITHOUT a score badge
// — never a fabricated or stale number.
//
// Comparison table ("Tabelle 3 von 3" — Konzept's 3-tables-per-page cap):
// built entirely from `alternatives[].facts` (frontmatter-only, optional per
// entry) — max 3 products (columns) x max 6 criteria (rows, first-seen
// order across the alternatives, capped). Hairline rows, first column left,
// numbers right — same idiom as the V15 `.subs`/`.strip` tables. Renders
// null when no alternative carries a `facts` array.
//
// "Which should you choose?" — REMOVED (2026-07-25, external design audit).
// The plan called for "Wenn-Dann-Zeilen aus Frontmatter", but
// AlternativeEntrySchema has no if/then field, only `whyInstead`. Reusing
// `whyInstead` verbatim avoided inventing prose — and produced a list that
// repeated, word for word, the card eight lines above it. Two further problems
// only showed once it was measured on the page: with final-decision.tsx doing
// the same thing, every `whyInstead` appeared THREE times; and the
// "Choose {name} instead if" prefix does not join to a standalone sentence, so
// it rendered as "Choose Fidelity instead if The category leader (9.6/10)…".
// The card at the top of this section is now the single rendering.
// ============================================================

import Link from 'next/link';
import { BUTTON_COMPARE } from './button-style';
import type { Market, Category } from '@/lib/i18n/config';
import type { AlternativeEntry } from '@/lib/reviews/verdict-frontmatter';
import type { DecisionBridgeFieldRow } from '@/lib/comparison/types';

const FONT_NUM = 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace';

/** Comparison-table cap (plan: "max 3 Produkte × max 6 Kriterien"). */
const MAX_TABLE_PRODUCTS = 3;
const MAX_TABLE_CRITERIA = 6;

export interface AlternativesSectionProps {
  /** The reviewed product's own display name (heading + "Choose {productName} instead of" framing). */
  productName: string;
  market: Market;
  category: Category;
  /** 2-3 entries, hand-verified frontmatter (lib/reviews/verdict-frontmatter.ts AlternativesSchema). */
  alternatives: AlternativeEntry[];
  /** Optional cockpit enrichment (T0d) — matched to each alternative by case-insensitive name; degrades silently (no score shown) on zero matches. */
  field?: DecisionBridgeFieldRow[] | null;
  fieldCount?: number;
  topicLabel?: string;
  /** Gold CTA target — omitted entirely (no CTA) when any of fieldCount/topicLabel/cockpitHref is missing. */
  cockpitHref?: string | null;
}

function matchFieldRow(name: string, field: DecisionBridgeFieldRow[] | null | undefined): DecisionBridgeFieldRow | null {
  if (!field || field.length === 0) return null;
  const normalized = name.trim().toLowerCase();
  return field.find((row) => row.name.trim().toLowerCase() === normalized) ?? null;
}

export function AlternativesSection({
  productName,
  market,
  category,
  alternatives,
  field,
  fieldCount,
  topicLabel,
  cockpitHref,
}: AlternativesSectionProps) {
  const items = alternatives.slice(0, 3);
  if (items.length === 0) return null;

  const showCta = Boolean(cockpitHref) && Boolean(fieldCount) && Boolean(topicLabel);

  return (
    <section aria-labelledby="alternatives-heading" style={{ fontFamily: 'var(--font-primary)' }}>
      <h2
        id="alternatives-heading"
        style={{
          fontFamily: 'var(--font-secondary)',
          fontSize: '22px',
          fontWeight: 400,
          letterSpacing: '-0.01em',
          color: 'var(--sfp-ink)',
          margin: '0 0 16px',
        }}
      >
        Alternatives to {productName}
      </h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" style={{ marginBottom: '24px' }}>
        {items.map((alt) => {
          const reviewHref = `/${market}/${category}/${alt.slug}`;
          const matched = matchFieldRow(alt.name, field);
          return (
            <div
              key={alt.slug}
              style={{ border: '1px solid var(--sfp-hairline)', borderRadius: '12px', padding: '18px 20px', background: '#fff' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}>
                <Link
                  href={reviewHref}
                  style={{
                    fontFamily: 'var(--font-secondary)',
                    fontSize: '17px',
                    color: 'var(--sfp-ink)',
                    textDecoration: 'none',
                    borderBottom: '1px solid var(--sfp-hairline)',
                  }}
                >
                  {alt.name}
                </Link>
                {matched && (
                  <span
                    style={{
                      fontFamily: FONT_NUM,
                      fontVariantNumeric: 'tabular-nums',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: 'var(--sfp-navy)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    #{matched.rank} · {matched.score.toFixed(1)}
                  </span>
                )}
              </div>
              <p style={{ fontSize: '13.5px', lineHeight: 1.5, color: 'var(--sfp-slate)', margin: 0 }}>{alt.whyInstead}</p>
            </div>
          );
        })}
      </div>

      <ComparisonFactsTable items={items} />

      {showCta && (
        <Link href={cockpitHref as string} className={BUTTON_COMPARE}>
          Compare all {fieldCount} {topicLabel} →
        </Link>
      )}
    </section>
  );
}

/** "Tabelle 3 von 3" — max 3 products x max 6 criteria, built only from frontmatter facts. Renders null when no alternative has a facts array. */
function ComparisonFactsTable({ items }: { items: AlternativeEntry[] }) {
  const withFacts = items.filter((item) => item.facts && item.facts.length > 0);
  if (withFacts.length === 0) return null;

  const columns = withFacts.slice(0, MAX_TABLE_PRODUCTS);

  const labels: string[] = [];
  for (const item of columns) {
    for (const fact of item.facts ?? []) {
      if (!labels.includes(fact.label)) labels.push(fact.label);
    }
  }
  const visibleLabels = labels.slice(0, MAX_TABLE_CRITERIA);

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', margin: '0 0 24px', fontFamily: 'var(--font-primary)' }}>
      <thead>
        <tr>
          <th
            style={{
              textAlign: 'left',
              fontSize: '9.5px',
              letterSpacing: '0.11em',
              textTransform: 'uppercase',
              color: 'var(--sfp-slate)',
              fontWeight: 600,
              padding: '6px 8px 6px 0',
              borderBottom: '1px solid var(--sfp-hairline)',
            }}
          />
          {columns.map((c) => (
            <th
              key={c.slug}
              style={{
                textAlign: 'right',
                fontSize: '9.5px',
                letterSpacing: '0.11em',
                textTransform: 'uppercase',
                color: 'var(--sfp-slate)',
                fontWeight: 600,
                padding: '6px 0',
                borderBottom: '1px solid var(--sfp-hairline)',
              }}
            >
              {c.name}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {visibleLabels.map((label) => (
          <tr key={label}>
            <td
              style={{
                padding: '6px 8px 6px 0',
                fontSize: '13px',
                color: 'var(--sfp-ink)',
                borderBottom: '1px solid var(--sfp-hairline-row)',
              }}
            >
              {label}
            </td>
            {columns.map((c) => {
              const fact = (c.facts ?? []).find((f) => f.label === label);
              return (
                <td
                  key={c.slug}
                  style={{
                    padding: '6px 0',
                    textAlign: 'right',
                    fontFamily: FONT_NUM,
                    fontVariantNumeric: 'tabular-nums',
                    fontSize: '13px',
                    color: 'var(--sfp-ink)',
                    borderBottom: '1px solid var(--sfp-hairline-row)',
                  }}
                >
                  {fact ? fact.value : '—'}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
