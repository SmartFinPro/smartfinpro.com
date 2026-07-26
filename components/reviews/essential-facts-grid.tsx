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
    <div style={{ fontFamily: 'var(--font-primary)' }}>
      {/* Titel-Eyebrow — same idiom as the ScoreBreakdown / Best-for zone
          headings, gives the block a named identity instead of reading as a
          bare data table (Betreiber-Wunsch 2026-07-19: "prominenter, mehr
          enterprise premium"). */}
      <div
        style={{
          fontSize: '10.5px',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--sfp-slate)',
          fontWeight: 600,
          marginBottom: '12px',
        }}
      >
        Essential Facts
      </div>

      {/* Individual elevated stat cards with a gap (not a dense hairline
          table): rounded, hairline-strong frame, white bg, generous padding
          — the same card family as VerdictCard / the sidebar cards, so the
          block reads as a deliberate premium module. `items-stretch` +
          marginTop:auto on the source line keeps every card's source row
          bottom-aligned across a row. Empty trailing grid cells simply don't
          render (gap only sits between real items → no stray hairlines). */}
      <div className="grid grid-cols-2 items-stretch gap-3 md:grid-cols-3">
        {facts.map((fact, i) => {
          const asOfLabel = formatIsoDate(fact.asOf);
          return (
            <div
              key={i}
              // border + background as CLASSES (not inline style): an inline
              // `background`/`border` (specificity 1,0,0) would out-specify the
              // Tailwind hover utilities (0,2,0) and silently kill the hover —
              // same trap as the sidebar Visit button. Base white/hairline →
              // hover light-blue fill + navy border.
              className="flex flex-col rounded-[14px] border border-[var(--sfp-hairline-strong)] bg-white transition-colors duration-200 hover:border-[var(--sfp-navy)] hover:bg-[var(--sfp-sky)]"
              style={{ padding: '18px 20px' }}
            >
              <div
                style={{
                  fontSize: '9.5px',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--sfp-navy)',
                  fontWeight: 700,
                  marginBottom: '8px',
                }}
              >
                {fact.label}
              </div>
              <div
                style={{
                  fontVariantNumeric: 'tabular-nums',
                  fontSize: '20px',
                  fontWeight: 600,
                  letterSpacing: '-0.02em',
                  lineHeight: 1.2,
                  color: 'var(--sfp-ink)',
                  marginBottom: fact.context ? '6px' : '10px',
                }}
              >
                {fact.value}
              </div>
              {fact.context && (
                <div style={{ fontSize: '12px', lineHeight: 1.45, color: 'var(--sfp-slate)', marginBottom: '10px' }}>
                  {fact.context}
                </div>
              )}
              <div
                style={{
                  fontSize: '10.5px',
                  color: 'var(--sfp-slate)',
                  marginTop: 'auto',
                  paddingTop: '4px',
                }}
              >
                {asOfLabel ? <>as of {asOfLabel} · </> : null}
                <a href={fact.sourceHref} style={{ color: 'var(--sfp-navy)', fontWeight: 600 }}>
                  Source
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
