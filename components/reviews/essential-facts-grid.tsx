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
// desktop 3 columns (up to 2 rows), mobile 2 columns (up to 3 rows) — never
// a horizontally-scrolling table, both explicitly ruled out by the plan.
//
// Each fact requires `sourceHref` + `asOf` at the Zod schema layer (Konzept
// §9.3/§29.2: `asOf` alone is not enough without a citable source). This
// component does not re-validate that — validation is the frontmatter
// layer's job — but it always renders the sourceHref link when the field is
// present, and the "as of" micro-line only when `asOf` parses.
// ============================================================

import type { EssentialFact } from '@/lib/reviews/verdict-frontmatter';

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

  return (
    <div
      className="grid grid-cols-2 border-t border-l md:grid-cols-3"
      style={{ borderColor: 'var(--sfp-hairline)', fontFamily: 'var(--font-primary)' }}
    >
      {facts.map((fact, i) => {
        const asOfLabel = formatIsoDate(fact.asOf);
        return (
          <div key={i} className="border-b border-r" style={{ borderColor: 'var(--sfp-hairline)', padding: '14px 16px' }}>
            <div
              style={{
                fontSize: '9.5px',
                letterSpacing: '0.11em',
                textTransform: 'uppercase',
                color: 'var(--sfp-slate)',
                fontWeight: 600,
                marginBottom: '4px',
              }}
            >
              {fact.label}
            </div>
            <div
              style={{
                fontVariantNumeric: 'tabular-nums',
                fontSize: '17px',
                letterSpacing: '-0.02em',
                color: 'var(--sfp-ink)',
                marginBottom: fact.context ? '3px' : '6px',
              }}
            >
              {fact.value}
            </div>
            {fact.context && (
              <div style={{ fontSize: '11.5px', color: 'var(--sfp-slate)', marginBottom: '6px' }}>{fact.context}</div>
            )}
            <div style={{ fontSize: '10.5px', color: 'var(--sfp-slate)' }}>
              {asOfLabel ? <>as of {asOfLabel} · </> : null}
              <a href={fact.sourceHref} style={{ color: 'var(--sfp-navy)' }}>
                Source
              </a>
            </div>
          </div>
        );
      })}
    </div>
  );
}
