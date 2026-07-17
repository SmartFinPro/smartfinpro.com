'use client';

// components/marketing/decision-bridge.tsx
// "Market Check" — the review-article → cockpit bridge that replaces
// <ExpertBox> (Task 5a, editorial integrity remediation). Visual contract:
// docs/superpowers/specs/assets/2026-07-17-market-check/market-check-v15.html
// (V15 section of docs/superpowers/specs/2026-07-17-cockpit-bridge-design.md
// overrides the UI sections above it; data contract/tracking/architecture
// there remain authoritative).
//
// The MDX tag is deliberately PROPLESS — <DecisionBridge /> — because props
// were exactly how the fabrication came in before
// (<ExpertBox name="…" credentials="[fabricated professional titles]" quote="…" />). Every value
// rendered here comes from DecisionBridgeContext, which server code populates
// from lib/comparison/bridge.ts. With no data, this renders null: no
// wrapper, no placeholder, no height — content/*.mdx that lack a cockpit
// (cross-market, us/credit-score) stay untouched by this component.
//
// Only computed numbers here — no invented prose. `best_for` / `pros` /
// `cons` / `deep_dive` are unaudited (Task 10 blocker) and are never read by
// this component or by lib/comparison/bridge.ts.

import { createContext, useContext, useState, type ReactNode } from 'react';
import Link from 'next/link';
import type { DecisionBridgeData, DecisionBridgeFieldRow } from '@/lib/comparison/types';
import { buildWeaknessClause } from '@/lib/comparison/verdict';
import { CockpitImpression } from '@/components/marketing/cockpit-impression';
import { useCockpitTracking } from '@/lib/analytics/cockpit-tracking';

const FONT_NUM = 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace';

const DecisionBridgeContext = createContext<DecisionBridgeData | null>(null);

export function DecisionBridgeProvider({
  data,
  children,
}: {
  data: DecisionBridgeData | null;
  children: ReactNode;
}) {
  return <DecisionBridgeContext.Provider value={data}>{children}</DecisionBridgeContext.Provider>;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** ISO YYYY-MM-DD → "3 Jul 2026". Manual parse (no `Date`) so this can never
 *  differ between server and client render depending on timezone. */
function formatVerifiedDate(iso: string): string | null {
  const parts = iso.split('-');
  if (parts.length !== 3) return null;
  const [y, m, d] = parts.map(Number);
  if (!y || !m || !d || m < 1 || m > 12) return null;
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

function humanizeSubScoreKey(key: string): string {
  if (key.toLowerCase() === 'ux') return 'UX';
  if (key.length === 0) return key;
  return key.charAt(0).toUpperCase() + key.slice(1);
}

function capitalize(s: string): string {
  return s.length === 0 ? s : s.charAt(0).toUpperCase() + s.slice(1);
}

/** Manifest label ("Best Trading Platforms") → CTA noun ("trading platforms"). */
function topicNounFromLabel(label: string): string {
  return label.replace(/^Best /, '').toLowerCase();
}

type StripPlanItem = { type: 'row'; row: DecisionBridgeFieldRow } | { type: 'gap'; count: number };

/**
 * Ranking-strip plan: top 3 always shown, the reviewed row and the
 * last-place row always shown, with a "N more between" gap wherever two
 * consecutively-shown ranks aren't adjacent. Naturally collapses to no gaps
 * for small fields, and de-dupes when the reviewed row IS top-3 or IS last.
 */
function buildStripPlan(field: DecisionBridgeFieldRow[], positionRank: number): StripPlanItem[] {
  if (!Array.isArray(field) || field.length === 0) return [];
  const lastIdx = field.length - 1;
  const topCount = Math.min(3, field.length);
  const indices = new Set<number>();
  for (let i = 0; i < topCount; i++) indices.add(i);
  if (positionRank >= 1 && positionRank <= field.length) indices.add(positionRank - 1);
  indices.add(lastIdx);

  const sorted = Array.from(indices).sort((a, b) => a - b);
  const plan: StripPlanItem[] = [];
  let prev = -1;
  for (const idx of sorted) {
    if (prev !== -1 && idx - prev > 1) plan.push({ type: 'gap', count: idx - prev - 1 });
    const row = field[idx];
    if (row) plan.push({ type: 'row', row });
    prev = idx;
  }
  return plan;
}

/** MDX-Tag. Bewusst PROPLOS — es gibt kein Feld, in das jemand etwas
 *  erfinden könnte. Alle Daten kommen serverseitig aus DecisionBridgeContext. */
export function DecisionBridge(): ReactNode {
  const data = useContext(DecisionBridgeContext);
  const tracking = useCockpitTracking({
    market: data?.market ?? '',
    category: data?.category ?? '',
    topic: data?.topic ?? '',
  });

  if (!data) return null;

  const topicNoun = topicNounFromLabel(data.topicLabel);
  const verifiedLabel = data.lastVerified ? formatVerifiedDate(data.lastVerified) : null;

  const handleCtaClick = () => {
    tracking.track(
      'cockpit_cta_click',
      {
        surface: 'body',
        ctaPosition: 'primary',
        ctaMode: 'cockpit',
        destinationType: 'internal_cockpit',
        productCount: data.fieldCount,
        ...(data.position
          ? { productSlug: data.position.slug, rank: data.position.rank, isTopPick: data.position.isTopPick }
          : {}),
      },
      { immediate: true },
    );
  };

  return (
    <CockpitImpression threshold={0.5} onImpress={() => tracking.viewOnce('body', { productCount: data.fieldCount })}>
      <div
        data-testid="decision-bridge"
        className="my-10"
        style={{
          borderBottom: '1px solid var(--sfp-hairline-strong)',
          background: '#fff',
          fontFamily: 'var(--font-primary)',
          color: 'var(--sfp-ink)',
          paddingBottom: '2px',
        }}
      >
        <div
          className="flex items-baseline justify-between"
          style={{ paddingBottom: '8px', borderBottom: '2px solid var(--sfp-navy)' }}
        >
          <span
            style={{
              fontFamily: 'var(--font-secondary)',
              fontSize: '17px',
              letterSpacing: '-0.01em',
              color: 'var(--sfp-ink)',
              fontWeight: 400,
            }}
          >
            {data.position ? `How ${data.position.name} compares` : 'How the field compares'}
          </span>
          <span
            style={{
              fontFamily: FONT_NUM,
              fontSize: '12.5px',
              color: 'var(--sfp-slate)',
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '0.02em',
              whiteSpace: 'nowrap',
            }}
          >
            {data.position ? (
              <>
                <b style={{ color: 'var(--sfp-ink)', fontWeight: 600 }}>#{data.position.rank}</b> of {data.fieldCount}
              </>
            ) : (
              <>
                <b style={{ color: 'var(--sfp-ink)', fontWeight: 600 }}>{data.fieldCount}</b> tracked
              </>
            )}
          </span>
        </div>

        {data.position ? (
          <StateA data={data} position={data.position} topicNoun={topicNoun} verifiedLabel={verifiedLabel} onCtaClick={handleCtaClick} />
        ) : (
          <StateB data={data} topicNoun={topicNoun} verifiedLabel={verifiedLabel} onCtaClick={handleCtaClick} />
        )}
      </div>
    </CockpitImpression>
  );
}

function CtaLink({
  href,
  fieldCount,
  topicNoun,
  onClick,
}: {
  href: string;
  fieldCount: number;
  topicNoun: string;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="inline-block transition-colors hover:[background-color:var(--sfp-gold-dark)] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[var(--sfp-navy)] focus-visible:outline-offset-2"
      style={{
        margin: '14px 0 4px',
        background: 'var(--sfp-gold)',
        color: '#3B2A05',
        fontWeight: 600,
        fontSize: '13.5px',
        padding: '9px 16px',
        textDecoration: 'none',
        fontFamily: 'var(--font-primary)',
      }}
    >
      Compare all {fieldCount} {topicNoun} →
    </Link>
  );
}

function StateA({
  data,
  position,
  topicNoun,
  verifiedLabel,
  onCtaClick,
}: {
  data: DecisionBridgeData;
  position: NonNullable<DecisionBridgeData['position']>;
  topicNoun: string;
  verifiedLabel: string | null;
  onCtaClick: () => void;
}) {
  const rawSubScores = position.subScores && typeof position.subScores === 'object' ? position.subScores : {};
  const subEntries = Object.entries(rawSubScores).filter(
    (entry): entry is [string, number] => typeof entry[1] === 'number' && Number.isFinite(entry[1]),
  );
  let strongest: [string, number] | null = null;
  let weakest: [string, number] | null = null;
  for (const entry of subEntries) {
    if (!strongest || entry[1] > strongest[1]) strongest = entry;
    if (!weakest || entry[1] < weakest[1]) weakest = entry;
  }

  const stripPlan = buildStripPlan(data.field, position.rank);
  const spread = data.scoreMax - data.scoreMin;
  const spreadSentence = `${spread.toFixed(1)} point${spread === 1 ? '' : 's'} separate the highest and lowest score among the ${data.fieldCount} provider${data.fieldCount === 1 ? '' : 's'} analysed.`;
  // Middle sentence of the operator-approved verdict ("Good for … . Consider
  // alternatives if … . The field is tight … ."). The first sentence stays
  // out until Task 10 audits `best_for`; this middle one is entirely
  // computed from `sub_scores` and only renders when the weakest dimension
  // is a real, nameable trade-off — see lib/comparison/verdict.ts.
  const weaknessClause = weakest ? buildWeaknessClause(weakest[0], weakest[1], data.fieldBestSubScores) : null;
  const verdictText = weaknessClause ? `${weaknessClause} ${spreadSentence}` : spreadSentence;

  const footItems: ReactNode[] = [];
  if (verifiedLabel) {
    footItems.push(
      <span key="verified">
        Verified{' '}
        <b style={{ color: 'var(--sfp-ink)', fontWeight: 600, fontFamily: FONT_NUM, fontVariantNumeric: 'tabular-nums' }}>
          {verifiedLabel}
        </b>
      </span>,
    );
  }
  if (data.officialSourceCount > 0) {
    footItems.push(
      <span key="sources">
        <b style={{ color: 'var(--sfp-ink)', fontWeight: 600, fontFamily: FONT_NUM, fontVariantNumeric: 'tabular-nums' }}>
          {data.officialSourceCount}
        </b>{' '}
        official sources
      </span>,
    );
  }
  if (position.confidence) {
    footItems.push(
      <span key="confidence">
        Data confidence: <span style={{ color: 'var(--sfp-slate)', fontWeight: 600 }}>{capitalize(position.confidence)}</span>
      </span>,
    );
  }
  if (footItems.length > 0) {
    footItems.push(
      <a key="methodology" href="/methodology" style={{ color: 'var(--sfp-navy)' }}>
        How we score
      </a>,
    );
  }

  return (
    <>
      {subEntries.length > 0 && strongest && weakest && (
        <div
          className="flex flex-wrap gap-7"
          style={{ fontSize: '12.5px', padding: '12px 0 10px', borderBottom: '1px solid var(--sfp-hairline)' }}
        >
          <span style={{ color: 'var(--sfp-slate)' }}>
            Strongest:{' '}
            <b style={{ color: 'var(--sfp-ink)', fontWeight: 600, fontFamily: FONT_NUM, fontVariantNumeric: 'tabular-nums' }}>
              {humanizeSubScoreKey(strongest[0])} {strongest[1].toFixed(1)}
            </b>
          </span>
          <span style={{ color: 'var(--sfp-slate)' }}>
            Weakest:{' '}
            <b style={{ color: 'var(--sfp-ink)', fontWeight: 600, fontFamily: FONT_NUM, fontVariantNumeric: 'tabular-nums' }}>
              {humanizeSubScoreKey(weakest[0])} {weakest[1].toFixed(1)}
            </b>
          </span>
        </div>
      )}

      {Array.isArray(stripPlan) && stripPlan.length > 0 && (
        <table className="w-full border-collapse" style={{ margin: '11px 0 2px', fontFamily: 'var(--font-primary)' }}>
          <tbody>
            {stripPlan.map((item, i) => {
              const isLast = i === stripPlan.length - 1;
              const rowBorder = isLast ? undefined : '1px solid var(--sfp-hairline-row)';
              if (item.type === 'gap') {
                return (
                  <tr key={`gap-${i}`}>
                    <td
                      style={{
                        padding: '3px 0',
                        fontFamily: FONT_NUM,
                        fontSize: '11.5px',
                        color: 'var(--sfp-slate)',
                        borderBottom: rowBorder,
                      }}
                    >
                      ⋯
                    </td>
                    <td colSpan={2} style={{ padding: '3px 0', fontSize: '11.5px', color: 'var(--sfp-slate)', borderBottom: rowBorder }}>
                      {item.count} more between
                    </td>
                  </tr>
                );
              }
              const row = item.row;
              const rowStyle = row.isYou ? { background: 'var(--sfp-sky)', fontWeight: 600 } : undefined;
              return (
                <tr key={row.rank} style={rowStyle}>
                  <td
                    style={{
                      padding: '5px 0',
                      width: '24px',
                      fontFamily: FONT_NUM,
                      fontSize: '11.5px',
                      color: row.isYou ? 'var(--sfp-navy)' : 'var(--sfp-slate)',
                      fontVariantNumeric: 'tabular-nums',
                      borderBottom: rowBorder,
                    }}
                  >
                    {row.rank}
                  </td>
                  <td style={{ padding: '5px 0', fontSize: '13.5px', verticalAlign: 'baseline', borderBottom: rowBorder }}>
                    {row.isYou || !row.reviewHref ? (
                      row.name
                    ) : (
                      <Link
                        href={row.reviewHref}
                        className="hover:[border-bottom-color:var(--sfp-navy)] hover:[color:var(--sfp-navy)]"
                        style={{ color: 'var(--sfp-ink)', textDecoration: 'none', borderBottom: '1px solid var(--sfp-hairline)' }}
                      >
                        {row.name}
                      </Link>
                    )}
                  </td>
                  <td
                    style={{
                      padding: '5px 9px 5px 0',
                      width: '52px',
                      textAlign: 'right',
                      fontFamily: FONT_NUM,
                      fontVariantNumeric: 'tabular-nums',
                      fontWeight: 600,
                      borderBottom: rowBorder,
                      boxShadow: row.isYou ? 'inset -2px 0 0 var(--sfp-navy)' : undefined,
                    }}
                  >
                    {row.score.toFixed(1)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <div
        style={{
          fontSize: '9.5px',
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: 'var(--sfp-navy)',
          fontWeight: 700,
          background: 'var(--sfp-gray)',
          borderLeft: '2px solid var(--sfp-navy)',
          padding: '9px 13px 0',
          marginTop: '12px',
        }}
      >
        Verdict
      </div>
      <div
        style={{
          fontFamily: 'var(--font-secondary)',
          fontSize: '14px',
          lineHeight: 1.5,
          background: 'var(--sfp-gray)',
          borderLeft: '2px solid var(--sfp-navy)',
          padding: '2px 13px 9px',
          color: 'var(--sfp-ink)',
        }}
      >
        {verdictText}
      </div>

      <CtaLink href={data.cockpitHref} fieldCount={data.fieldCount} topicNoun={topicNoun} onClick={onCtaClick} />

      {subEntries.length > 0 && (
        <ScoreDetails subEntries={subEntries} positionName={position.name} fieldBestSubScores={data.fieldBestSubScores} />
      )}

      {footItems.length > 0 && (
        <div style={{ fontSize: '11.5px', color: 'var(--sfp-slate)', padding: '8px 0 0', borderTop: '1px solid var(--sfp-hairline)' }}>
          {footItems.map((item, i) => (
            <span key={i}>
              {i > 0 && ' · '}
              {item}
            </span>
          ))}
        </div>
      )}
    </>
  );
}

function ScoreDetails({
  subEntries,
  positionName,
  fieldBestSubScores,
}: {
  subEntries: [string, number][];
  positionName: string;
  fieldBestSubScores: Record<string, number>;
}) {
  const [open, setOpen] = useState(false);
  const bestScores = fieldBestSubScores && typeof fieldBestSubScores === 'object' ? fieldBestSubScores : {};

  return (
    <div style={{ borderTop: '1px solid var(--sfp-hairline)', padding: '8px 0' }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--sfp-navy)] focus-visible:outline-offset-2"
        style={{ fontSize: '12px', color: 'var(--sfp-navy)', background: 'none', border: 'none', padding: '2px 0', display: 'block' }}
      >
        {open ? '▾' : '▸'} View score details
      </button>
      {open && (
        <table className="w-full border-collapse" style={{ margin: '8px 0 4px' }}>
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
                  padding: '5px 0',
                  borderBottom: '1px solid var(--sfp-hairline)',
                }}
              >
                Sub-score
              </th>
              <th
                style={{
                  textAlign: 'right',
                  fontSize: '9.5px',
                  letterSpacing: '0.11em',
                  textTransform: 'uppercase',
                  color: 'var(--sfp-slate)',
                  fontWeight: 600,
                  padding: '5px 0',
                  borderBottom: '1px solid var(--sfp-hairline)',
                  width: '60px',
                }}
              >
                {positionName}
              </th>
              <th
                style={{
                  textAlign: 'right',
                  fontSize: '9.5px',
                  letterSpacing: '0.11em',
                  textTransform: 'uppercase',
                  color: 'var(--sfp-slate)',
                  fontWeight: 600,
                  padding: '5px 0',
                  borderBottom: '1px solid var(--sfp-hairline)',
                  width: '60px',
                }}
              >
                Field best
              </th>
            </tr>
          </thead>
          <tbody>
            {subEntries.map(([key, value]) => {
              const best = typeof bestScores[key] === 'number' ? bestScores[key] : null;
              return (
                <tr key={key}>
                  <td style={{ padding: '5px 0', fontSize: '13px', borderBottom: '1px solid var(--sfp-hairline-row)' }}>
                    {humanizeSubScoreKey(key)}
                  </td>
                  <td
                    style={{
                      padding: '5px 0',
                      textAlign: 'right',
                      fontFamily: FONT_NUM,
                      fontVariantNumeric: 'tabular-nums',
                      fontSize: '13px',
                      borderBottom: '1px solid var(--sfp-hairline-row)',
                    }}
                  >
                    {value.toFixed(1)}
                  </td>
                  <td
                    style={{
                      padding: '5px 0',
                      textAlign: 'right',
                      fontFamily: FONT_NUM,
                      fontVariantNumeric: 'tabular-nums',
                      fontSize: '13px',
                      color: 'var(--sfp-slate)',
                      borderBottom: '1px solid var(--sfp-hairline-row)',
                    }}
                  >
                    {best !== null ? best.toFixed(1) : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

function StateB({
  data,
  topicNoun,
  verifiedLabel,
  onCtaClick,
}: {
  data: DecisionBridgeData;
  topicNoun: string;
  verifiedLabel: string | null;
  onCtaClick: () => void;
}) {
  const cellStyle: React.CSSProperties = { padding: '12px 14px 12px 0', borderRight: '1px solid var(--sfp-hairline)' };
  const emStyle: React.CSSProperties = {
    display: 'block',
    fontStyle: 'normal',
    fontSize: '9.5px',
    letterSpacing: '0.11em',
    textTransform: 'uppercase',
    color: 'var(--sfp-slate)',
    fontWeight: 600,
    marginBottom: '4px',
  };
  const bStyle: React.CSSProperties = {
    fontFamily: FONT_NUM,
    fontSize: '17px',
    fontVariantNumeric: 'tabular-nums',
    display: 'block',
    letterSpacing: '-0.02em',
  };
  const spanStyle: React.CSSProperties = { fontSize: '11.5px', color: 'var(--sfp-slate)' };

  const cells: ReactNode[] = [
    <div key="leader" style={cellStyle}>
      <em style={emStyle}>Leader</em>
      <b style={{ fontFamily: 'var(--font-secondary)', fontSize: '16px', display: 'block', letterSpacing: '-0.02em' }}>{data.leader.name}</b>
      <span style={spanStyle}>{data.leader.score.toFixed(1)}/10</span>
    </div>,
    <div key="spread" style={cellStyle}>
      <em style={emStyle}>Spread</em>
      <b style={bStyle}>
        {data.scoreMin.toFixed(1)} – {data.scoreMax.toFixed(1)}
      </b>
      <span style={spanStyle}>
        {data.fieldCount} {topicNoun}
      </span>
    </div>,
  ];
  if (verifiedLabel) {
    cells.push(
      <div key="verified" style={cellStyle}>
        <em style={emStyle}>Verified</em>
        <b style={bStyle}>{verifiedLabel}</b>
        <span style={spanStyle}>{data.officialSourceCount} official</span>
      </div>,
    );
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '16px', padding: '13px 0 2px' }}>
        <span style={{ fontFamily: 'var(--font-secondary)', fontSize: '21px', letterSpacing: '-0.015em' }}>
          {data.topicLabel} · {data.market.toUpperCase()}
        </span>
      </div>
      <div style={{ fontSize: '12.5px', color: 'var(--sfp-slate)', paddingBottom: '12px' }}>Field at a glance</div>

      <div
        className={cells.length === 3 ? 'grid grid-cols-1 sm:grid-cols-3' : 'grid grid-cols-1 sm:grid-cols-2'}
        style={{ borderBottom: '1px solid var(--sfp-hairline)' }}
      >
        {cells}
      </div>

      <CtaLink href={data.cockpitHref} fieldCount={data.fieldCount} topicNoun={topicNoun} onClick={onCtaClick} />
    </>
  );
}
