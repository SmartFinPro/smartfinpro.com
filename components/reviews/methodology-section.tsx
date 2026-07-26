// components/reviews/methodology-section.tsx — V2 "Methodology" layout zone (T12)
// ============================================================
// Server Component. Downstream layout zone — NOT one of the 7
// REVIEW_V2_ANCHORS nav entries (T0a: Final Decision/Methodology/FAQ are
// deliberately nav-less).
//
// Renders the mandatory methodology sentence VERBATIM — the exact same
// string components/reviews/verdict-card.tsx's BestXScore panel already
// uses, so the claim reads identically wherever it appears on a V2 page —
// plus links to /methodology, the frontmatter UpdateLog (real entries only,
// no synthetic date — plan Integritäts-Adaptionen row 1), and a
// deduplicated source list built from `essentialFacts[].sourceHref` (T0d:
// Essential Facts already require sourceHref+asOf at the schema layer; this
// reuses that, invents nothing new).
//
// CollapsibleSection reused from lib/mdx/components.tsx (exported in this
// same commit) rather than re-implemented — same accordion, same
// zero-JS-open/close <details>/<summary> pattern already used across the
// site's MDX content.
// ============================================================

import Link from 'next/link';
import { CollapsibleSection } from '@/lib/mdx/components';
import type { EssentialFact } from '@/lib/reviews/verdict-frontmatter';

const FONT_NUM = 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace';

/** Verbatim match with components/reviews/verdict-card.tsx's BestXScore sentence — one methodology claim, one wording, everywhere it appears. */
const METHODOLOGY_SENTENCE =
  'Calculated from verified data points from official sources. Commercial relationships do not affect the score.';

const EYEBROW_STYLE = {
  fontSize: '9.5px',
  letterSpacing: '0.11em',
  textTransform: 'uppercase' as const,
  color: 'var(--sfp-slate)',
  fontWeight: 600,
  marginBottom: '6px',
};

export interface MethodologyUpdateLogEntry {
  date: string;
  change: string;
}

export interface MethodologySectionProps {
  /** Same essentialFacts array components/reviews/essential-facts-grid.tsx renders — reused here only for its sourceHref values. */
  essentialFacts: EssentialFact[];
  /** ContentMeta.updateLog (lib/mdx/index.ts) — real entries only; entries missing a date or change are dropped, never backfilled. */
  updateLog?: MethodologyUpdateLogEntry[];
  methodologyHref?: string;
}

function dedupeSourceHrefs(facts: EssentialFact[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const fact of facts) {
    if (fact.sourceHref && !seen.has(fact.sourceHref)) {
      seen.add(fact.sourceHref);
      out.push(fact.sourceHref);
    }
  }
  return out;
}

export function MethodologySection({ essentialFacts, updateLog, methodologyHref = '/methodology' }: MethodologySectionProps) {
  const sources = dedupeSourceHrefs(essentialFacts ?? []);
  const entries = (updateLog ?? []).filter((entry) => Boolean(entry.date) && Boolean(entry.change));
  const hasDetails = sources.length > 0 || entries.length > 0;

  return (
    <section aria-labelledby="methodology-heading" style={{ fontFamily: 'var(--font-primary)' }}>
      <h2
        id="methodology-heading"
        style={{
          fontFamily: 'var(--font-secondary)',
          fontSize: '20px',
          fontWeight: 400,
          letterSpacing: '-0.01em',
          color: 'var(--sfp-ink)',
          margin: '0 0 12px',
        }}
      >
        Methodology
      </h2>

      <p style={{ fontSize: '13.5px', lineHeight: 1.6, color: 'var(--sfp-ink)', margin: '0 0 8px' }}>{METHODOLOGY_SENTENCE}</p>

      <p style={{ fontSize: '13px', color: 'var(--sfp-slate)', margin: hasDetails ? '0 0 16px' : 0 }}>
        <Link href={methodologyHref} style={{ color: 'var(--sfp-navy)' }}>
          How we score
        </Link>
        {' · '}
        <Link href={methodologyHref} style={{ color: 'var(--sfp-navy)' }}>
          View methodology
        </Link>
      </p>

      {hasDetails && (
        <CollapsibleSection title="Sources & updates">
          {sources.length > 0 && (
            <div style={{ marginBottom: entries.length > 0 ? '16px' : 0 }}>
              <div style={EYEBROW_STYLE}>Sources</div>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {sources.map((href) => (
                  <li key={href} style={{ fontSize: '12.5px', wordBreak: 'break-all' }}>
                    <a href={href} style={{ color: 'var(--sfp-navy)' }}>
                      {href}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {entries.length > 0 && (
            <div>
              <div style={EYEBROW_STYLE}>Update log</div>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {entries.map((entry, i) => (
                  <li key={`${i}-${entry.date}`} style={{ fontSize: '13px', color: 'var(--sfp-ink)' }}>
                    <span style={{ fontFamily: FONT_NUM, fontVariantNumeric: 'tabular-nums', color: 'var(--sfp-slate)' }}>
                      {entry.date}
                    </span>
                    {' — '}
                    {entry.change}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CollapsibleSection>
      )}
    </section>
  );
}
