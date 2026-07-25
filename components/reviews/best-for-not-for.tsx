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
import { CheckCircleIcon, MinusCircleIcon } from '@/components/marketing/check-icon';

export interface BestForNotForProps {
  bestFor: VerdictBlock['bestFor'];
  notFor: VerdictBlock['notFor'];
}

/**
 * Sentence case in the article's serif, not an uppercase letter-spaced
 * eyebrow. Same reasoning as the table headers: capitals plus tracking read
 * as a different typeface and as dashboard chrome, which is exactly the look
 * this design has been moving away from. The label sits in the body's voice,
 * one step down in size and in slate, so it separates the lists without
 * announcing itself.
 */
const LABEL_STYLE = {
  fontFamily: 'var(--font-secondary)',
  fontSize: '15px',
  color: 'var(--sfp-slate)',
  fontWeight: 600,
  marginBottom: '8px',
};

const LIST_STYLE = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column' as const,
  gap: '6px',
};

// Serif at the article's running size. These are read as sentences, not
// scanned as data, so they belong to the same voice as the paragraphs and the
// callouts — they were 14px sans against 18px serif body, which is what made
// the page look like text with widgets dropped into it.
const ITEM_STYLE = {
  display: 'flex',
  alignItems: 'flex-start' as const,
  gap: '8px',
  fontFamily: 'var(--font-secondary)',
  fontSize: '18px',
  lineHeight: 1.55,
  color: 'var(--sfp-ink)',
};

const ICON_STYLE = { flexShrink: 0, marginTop: '4px' } as const;

/**
 * Both marks are navy, not green/red. The two lists are told apart by the
 * icon's SHAPE — a check against a minus — which is what an accessible
 * distinction requires anyway: colour alone may not carry meaning (WCAG
 * 1.4.1), and a red/green pair is the worst case for the most common form of
 * colour blindness. It also stops the block shouting in two accent colours
 * that the rest of the card does not use.
 */
const ICON_COLOR = 'var(--sfp-navy)';

export function BestForNotFor({ bestFor, notFor }: BestForNotForProps) {
  const best = bestFor.slice(0, 3);
  const not = notFor.slice(0, 3);
  if (best.length === 0 && not.length === 0) return null;

  return (
    // Stacked, not side by side. The block used to be a full-width band of its
    // own; inside the verdict card it lives in a ~440px column, and splitting
    // that into two ~200px columns put roughly 20 characters on a line — "Futures
    // traders (not offered on the US platform)" wrapped to three. The pro/con
    // symmetry is not worth that; the two eyebrow labels separate the lists
    // perfectly well one above the other.
    <div className="grid gap-y-5" style={{ fontFamily: 'var(--font-primary)' }}>
      {best.length > 0 && (
        <div>
          <div style={LABEL_STYLE}>Best for</div>
          <ul style={LIST_STYLE}>
            {best.map((item, i) => (
              <li key={`${i}-${item}`} style={ITEM_STYLE}>
                <CheckCircleIcon size={17} color={ICON_COLOR} style={ICON_STYLE} />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
      {not.length > 0 && (
        <div>
          <div style={LABEL_STYLE}>Not for</div>
          <ul style={LIST_STYLE}>
            {not.map((item, i) => (
              <li key={`${i}-${item}`} style={ITEM_STYLE}>
                <MinusCircleIcon size={17} color={ICON_COLOR} style={ICON_STYLE} />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
