// components/reviews/best-for-not-for.tsx — V2 "Best for / Not for" columns (T9)
// ============================================================
// Server Component. Pure display of hand-verified verdict.bestFor /
// verdict.notFor (lib/reviews/verdict-frontmatter.ts). T0d source-of-truth:
// these come from hand-verified frontmatter — never the unaudited DB
// `best_for`/`pros`/`cons` fields.
//
// Two columns (Konzept §8), max 3 entries each — already enforced by
// VerdictBlockSchema, sliced defensively here too so a future
// schema-bypassing caller can't overflow the layout.
// ============================================================

import type { VerdictBlock } from '@/lib/reviews/verdict-frontmatter';

export interface BestForNotForProps {
  bestFor: VerdictBlock['bestFor'];
  notFor: VerdictBlock['notFor'];
}

const EYEBROW_STYLE = {
  fontSize: '10.5px',
  letterSpacing: '0.14em',
  textTransform: 'uppercase' as const,
  color: 'var(--sfp-slate)',
  fontWeight: 600,
  marginBottom: '10px',
};

const LIST_STYLE = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column' as const,
  gap: '6px',
};

const ITEM_STYLE = {
  display: 'flex',
  gap: '8px',
  fontSize: '14px',
  lineHeight: 1.5,
  color: 'var(--sfp-ink)',
};

export function BestForNotFor({ bestFor, notFor }: BestForNotForProps) {
  const best = bestFor.slice(0, 3);
  const not = notFor.slice(0, 3);
  if (best.length === 0 && not.length === 0) return null;

  return (
    <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2" style={{ fontFamily: 'var(--font-primary)' }}>
      {best.length > 0 && (
        <div>
          <div style={EYEBROW_STYLE}>Best for</div>
          <ul style={LIST_STYLE}>
            {best.map((item, i) => (
              <li key={`${i}-${item}`} style={ITEM_STYLE}>
                <span aria-hidden="true" style={{ color: 'var(--sfp-green)', fontWeight: 700 }}>
                  ✓
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
      {not.length > 0 && (
        <div>
          <div style={EYEBROW_STYLE}>Not for</div>
          <ul style={LIST_STYLE}>
            {not.map((item, i) => (
              <li key={`${i}-${item}`} style={ITEM_STYLE}>
                <span aria-hidden="true" style={{ color: 'var(--sfp-red)', fontWeight: 700 }}>
                  ✕
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
