// components/reviews/essential-facts-grid.tsx — V2 Essential Facts grid (T9)
// ============================================================
// Server Component. Layout pattern referenced from components/marketing/
// trust-blocks.tsx's TrustAuthority stat grid (that component itself is NOT
// modified — plan's T9 instruction: "TrustAuthority-Layoutmuster als
// Referenz, Komponente selbst NICHT anfassen") and the V15
// ".fld" field-grid in market-check-v15.html: uppercase Inter label,
// tabular-nums value, muted context line, hairline dividers instead of a
// boxed/shadowed card (the plan's "Hairlines statt Kästen" design
// language).
//
// 4-6 facts (lib/reviews/verdict-frontmatter.ts EssentialFactsSchema),
// desktop 3-up rows, mobile 2-up rows — never a horizontally-scrolling
// table, both explicitly ruled out by the plan. A partial last row fills
// the remaining width (flex grow) instead of leaving an empty cell.
//
// Each fact requires `sourceHref` + `asOf` at the Zod schema layer (Konzept
// §9.3/§29.2: `asOf` alone is not enough without a citable source). This
// component does not re-validate that — validation is the frontmatter
// layer's job — but it always renders the sourceHref link when the field is
// present, and the "as of" micro-line only when `asOf` parses.
// ============================================================

import type { EssentialFact } from '@/lib/reviews/verdict-frontmatter';
import { SECTION_LABEL } from '@/lib/reviews/callout-style';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * ISO YYYY-MM-DD → "18 Jul 2026". Manual parse (no `Date`) — same
 * deterministic technique as components/reviews/review-header.tsx and
 * components/marketing/decision-bridge.tsx.
 */
function formatIsoDate(iso: string): string | null {
  const parts = iso.split('-');
  if (parts.length !== 3) return null;
  const [y, m, d] = parts.map(Number);
  if (!y || !m || !d || m < 1 || m > 12 || d < 1 || d > 31) return null;
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

export interface EssentialFactsGridProps {
  facts: EssentialFact[];
}

export function EssentialFactsGrid({ facts }: EssentialFactsGridProps) {
  if (!facts || facts.length === 0) return null;

  // One shared date line instead of five. Only when EVERY fact really carries
  // the same parsed date — otherwise each fact keeps its own, because "as of"
  // is a per-fact claim and collapsing differing dates into one would assert
  // a freshness that some of the figures do not have.
  const dates = facts.map((f) => formatIsoDate(f.asOf));
  const sharedDate = dates.every((d) => d !== null && d === dates[0]) ? dates[0] : null;

  return (
    <div style={{ fontFamily: 'var(--font-primary)' }}>
      <div style={SECTION_LABEL}>
        Essential Facts
      </div>

      <dl style={{ margin: 0 }}>
        {facts.map((fact, i) => {
          const asOfLabel = dates[i];
          return (
            <div
              key={i}
              style={{
                paddingTop: i === 0 ? 0 : '11px',
                marginTop: i === 0 ? 0 : '11px',
                borderTop: i === 0 ? 'none' : '1px solid var(--sfp-hairline-row)',
              }}
            >
              <dt style={{ fontSize: '12px', lineHeight: 1.35, color: 'var(--sfp-slate)' }}>{fact.label}</dt>
              <dd
                style={{
                  margin: '2px 0 0',
                  fontVariantNumeric: 'tabular-nums',
                  fontSize: '15px',
                  fontWeight: 600,
                  lineHeight: 1.3,
                  color: 'var(--sfp-ink)',
                }}
              >
                {fact.value}
              </dd>
              {fact.context && (
                <div style={{ fontSize: '11.5px', lineHeight: 1.45, color: 'var(--sfp-slate)', marginTop: '3px' }}>
                  {fact.context}
                </div>
              )}
              <div style={{ fontSize: '11px', lineHeight: 1.4, color: 'var(--sfp-slate)', marginTop: '3px' }}>
                {/* Per-fact date only when the facts do NOT share one. */}
                {!sharedDate && asOfLabel ? <>as of {asOfLabel} · </> : null}
                <a href={fact.sourceHref} style={{ color: 'var(--sfp-navy)', fontWeight: 600 }}>
                  Source
                </a>
              </div>
            </div>
          );
        })}
      </dl>

      {sharedDate && (
        <p
          style={{
            fontSize: '11px',
            lineHeight: 1.4,
            color: 'var(--sfp-slate)',
            margin: '11px 0 0',
            paddingTop: '11px',
            borderTop: '1px solid var(--sfp-hairline-row)',
          }}
        >
          All figures as of {sharedDate}.
        </p>
      )}
    </div>
  );
}
