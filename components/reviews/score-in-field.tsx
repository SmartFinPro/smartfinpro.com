// components/reviews/score-in-field.tsx — V2 "score in field" distribution plot
// ============================================================
// Server Component (no 'use client', no state, no Framer Motion) — the whole
// graphic is declarative CSS/flex markup plus one hand-written inline SVG, so
// it ships inside the SSR HTML and is readable by AI crawlers, exactly like
// ScoreBreakdown and the rest of the V2 zones.
//
// WHY THIS EXISTS AND WHY IT IS NOT A SECOND RANKING TABLE
// --------------------------------------------------------
// The sidebar (components/reviews/review-sidebar.tsx → DecisionBridge) already
// prints the field as an ordered TABLE ("How eToro compares", 9.6 … 8.0) plus
// the spread sentence. A table answers "who is above me"; it cannot answer
// "how far above" — the reader has to subtract in their head. That subtraction
// carries the single most decision-relevant fact on the page: rank 8 of 9
// sounds like a rejection, but the entire field is 1.6 points wide, so #8 is
// not far from #1. This zone renders exactly that distance, from exactly the
// same audited numbers the table uses (DecisionBridgeData.field /
// .position) — so the two can never disagree.
//
// WHY TWO RAILS (context + detail), NOT ONE
// -----------------------------------------
// A single rail zoomed to [min, max] would be actively dishonest: it magnifies
// a 1.6-point spread to full width and makes last place look catastrophic —
// the opposite of the true statement. A single rail on the full 0-10 scale is
// honest but unreadable: nine marks crowd into 16% of the width. So:
//   Rail 1 — fixed 0-10 axis with integer ticks, the field's span highlighted
//            as one short solid bar. This is the "the field is tight"
//            statement, legible in a second.
//   Rail 2 — that same highlighted slice, magnified, with every provider as a
//            tick mark and this product as a labelled pin.
// The two rails are joined into ONE figure by an SVG "zoom lens" connector — a
// tinted cone opening from the ends of the highlighted band out to the full
// width of the detail axis (the standard print-graphics inset convention), and
// the detail axis carries a serif figure caption naming the span ("Inside that
// 1.6-point band, magnified"). Context → detail, one composition, not two
// stacked charts explaining each other.
//
// DESIGN LANGUAGE (deliberate, please do not "decorate" this back)
// ----------------------------------------------------------------
// The card is set like printed institutional research, not like a dashboard:
//   - No decorative accent bars, no uppercase letter-spaced eyebrow labels,
//     no monospace. Numerals are tabular figures in the house sans
//     (font-variant-numeric: tabular-nums). The headline is serif; the single
//     large display score is NOT — it is set exactly like BestXScore's in
//     verdict-card.tsx (sans, 700, clamp 34-40px), because it is the same
//     number as the one in the verdict panel and two different treatments of
//     one figure read as two different claims.
//   - Hairlines structure (masthead rule, figure/notes rule, axis lines);
//     nothing is ornamental. Gold is not used at all — as a graphical object
//     it is ~2.0:1 and as text 2.79:1, both below the WCAG bar, and an accent
//     bar carrying no information is exactly the template tic this design
//     removes.
//   - The prose restatements of the graphic live in a single footnote zone
//     under a rule ("notes to the figure"), not as captions glued beneath
//     each rail.
//   - Asymmetric masthead: headline left, the score as the focal figure right.
//
// HONESTY CONTRACT (this project ran a remediation over fabricated content —
// see memory: editorial-integrity-remediation-status)
//   - No value is ever invented. Missing `field` or `position` → renders null:
//     no placeholder, no em-dash, no estimated axis.
//   - No stars, no reviewCount, no aggregated user ratings.
//   - The detail-axis DOMAIN is derived from the rows actually plotted (plus
//     this product's own score), never from a padded or prettified range — the
//     ends of the rail are real observed scores, and an end is only labelled
//     with a provider NAME when that provider's score really is the extreme.
//   - Rank feeds only the rank line (via rankPhrase, which refuses pseudo-
//     precise percentiles below a field of 20). An absent/implausible rank
//     drops the line and leaves the distribution intact.
//
// DEGRADATION (tested in __tests__/unit/score-in-field.test.ts)
//   - position null / field missing / field empty / all scores non-finite → null
//   - spread ≈ 0 (identical scores, or a single-product field) → the magnified
//     rail is dropped entirely (a zoom of a zero-width band means nothing and
//     would divide by zero); only the 0-10 context rail plus a factual line
//     survives.
//
// ACCESSIBILITY (WCAG 2.2 AA is an acceptance criterion here)
//   - Every statement the graphic makes also exists as visible, selectable
//     text: the range line, the labelled rail ends, and the closing distance
//     sentence. Nothing is conveyed by colour alone — this product is marked
//     by size, shape (pin + stem + circle vs. plain tick) AND an adjacent text
//     label, not by hue.
//   - Only the non-textual rails/ticks/pin/connector carry aria-hidden; all
//     labels stay in the accessibility tree in a sane reading order.
//   - Text colours are --sfp-ink (#1A1A2E, 16.2:1) and --sfp-slate (#64748B,
//     4.8:1) on white — both clear 4.5:1 at every size used here, and slate
//     also clears the 3:1 floor for the non-text tick marks it fills.
// ============================================================

import type { CSSProperties } from 'react';

import type { DecisionBridgeData, DecisionBridgeFieldRow } from '@/lib/comparison/types';
import { rankPhrase, scoreLabel } from '@/lib/reviews/score-label';

/** The BEST-X editorial score scale (lib/comparison/types.ts: `score` is 0-10). */
const SCORE_SCALE_MAX = 10;

/**
 * Below this spread the field is treated as level. Chosen so the magnified
 * rail is never drawn with a label that reads "8.3 – 8.3": anything under half
 * a displayed decimal collapses to the same rendered number at toFixed(1).
 */
const LEVEL_SPREAD_EPSILON = 0.05;

/** Half the widest mark on the detail axis — the mark layer is inset by this
 *  much so a mark sitting at 0% or 100% is still fully on the rail instead of
 *  half clipped. */
const DOT_INSET_PX = 6;

/** Tabular lining figures in the house sans — the "numbers" voice of the card. */
const NUM: CSSProperties = { fontVariantNumeric: 'tabular-nums' };

/**
 * The card's type scale — four steps, and every piece of text uses one of them.
 *
 * This replaces eight ad-hoc sizes (11, 11.5, 12, 12.5, 13, 14, 19, 30), six of
 * which were crowded between 11px and 14px. Steps that close together do not
 * read as hierarchy; a half-pixel difference is not a level, it is a wobble,
 * and the accumulation of them is what made the card look unsettled rather than
 * composed. Each step here is a ROLE, so adding a size means adding a role and
 * having to justify it.
 *
 *   display — the score. Appears exactly once; it is the focal figure. Its
 *             size, weight and "/10" treatment are taken verbatim from
 *             BestXScore in verdict-card.tsx, because the two are the SAME
 *             number on the same page and were reading as two different
 *             claims: serif 30px here against sans 34-40px bold there.
 *   title   — the card headline.
 *   body    — everything that is read as language or as a primary datum:
 *             notes, figure caption, the pin label, the rail-end values, the
 *             rank line, the hover label.
 *   micro   — supporting marks that are scanned, not read: axis numerals, the
 *             provider names under the rail ends, the rank/score caveat.
 *
 * Line heights belong to the step, not to the call site, for the same reason.
 */
const TYPE = {
  display: { fontSize: 'clamp(34px, 4vw, 40px)', lineHeight: 1 },
  title: { fontSize: '19px', lineHeight: 1.25 },
  body: { fontSize: '13px', lineHeight: 1.55 },
  micro: { fontSize: '11px', lineHeight: 1.4 },
} as const satisfies Record<string, CSSProperties>;

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/** Position of `value` inside [min, max] as a 0-100 percentage, clamped. */
function toPercent(value: number, min: number, max: number): number {
  const span = max - min;
  if (span <= 0) return 50; // caller guards this; the 50% keeps a degenerate marker centred rather than NaN
  return Math.max(0, Math.min(100, ((value - min) / span) * 100));
}

export interface ScoreInFieldProps {
  /** Smart-Rank-ordered field from the cockpit bridge. Note this is RANK order,
   *  not score order (top pick is pinned), which is why the rail ends are found
   *  by score rather than by taking field[0] / field[last]. */
  field: DecisionBridgeFieldRow[] | null | undefined;
  /** The reviewed product's row. Null when the article's product is not part of
   *  this cockpit's field — in that case there is no "you are here" to draw and
   *  the component renders nothing. */
  position: DecisionBridgeData['position'] | null | undefined;
  /** Audited size of the whole field. Used only for the rank line's denominator;
   *  the plotted-provider count always comes from the rows actually drawn. */
  fieldCount?: number;
}

export function ScoreInField({ field, position, fieldCount }: ScoreInFieldProps) {
  if (!position || !Array.isArray(field)) return null;
  if (!isFiniteNumber(position.score)) return null;

  // Drop malformed rows instead of plotting a mark at a made-up coordinate.
  // `score > 0`, not merely finite: the cockpit loader's num() coerces a
  // missing or unparseable score to 0 (lib/comparison/loader.ts), so a product
  // whose score has not been captured yet arrives here as a perfectly finite
  // zero. Plotting it turns "not measured" into "scored 0.0", names that
  // provider as the worst in the field, and inverts this component's entire
  // claim — a 1.6-point spread renders as 9.6. lib/comparison/bridge.ts:45
  // already applies exactly this guard to the leader; the field rows need it
  // too. A field emptied by this degrades to null below, which is correct.
  const rows = field.filter(
    (row): row is DecisionBridgeFieldRow =>
      Boolean(row) &&
      isFiniteNumber(row.score) &&
      row.score > 0 &&
      typeof row.name === 'string' &&
      row.name.length > 0,
  );
  if (rows.length === 0) return null;

  const you = position.score;
  const name = typeof position.name === 'string' && position.name.length > 0 ? position.name : null;
  if (!name) return null;

  const rowScores = rows.map((row) => row.score);
  const rowMin = Math.min(...rowScores);
  const rowMax = Math.max(...rowScores);
  // Domain includes `you` so the pin is never clamped onto an end it does not
  // actually occupy — if position.score sits outside the plotted rows (stale
  // row set), the axis grows rather than the marker lying about its value.
  const domainMin = Math.min(rowMin, you);
  const domainMax = Math.max(rowMax, you);
  const spread = domainMax - domainMin;
  const isLevel = spread < LEVEL_SPREAD_EPSILON;

  // Plotted count, not `fieldCount`: the sentence describes the marks on
  // screen. In healthy data the two are identical (and therefore agree with
  // the sidebar's own "N providers analysed" line).
  const plotted = rows.length;

  // Rank line only when the rank is real AND plausible against the field size.
  // Also suppressed when rows were dropped: the prose then says "All 2
  // providers…" while the line would still say "Rank 2 of 3" and the sidebar a
  // third number. One card must not carry two counts of the same field — drop
  // the line and let the plotted reality speak.
  const total = isFiniteNumber(fieldCount) && fieldCount > 0 ? fieldCount : plotted;
  const rank = position.rank;
  const showRank = isFiniteNumber(rank) && rank >= 1 && rank <= total && plotted === total;

  // An end is named only when a real provider owns that extreme.
  const lowRow = rows.find((row) => row.score === rowMin) ?? null;
  const highRow = rows.find((row) => row.score === rowMax) ?? null;
  const lowName = !isLevel && lowRow && rowMin === domainMin ? lowRow.name : null;
  const highName = !isLevel && highRow && rowMax === domainMax ? highRow.name : null;

  const contextStartPct = toPercent(domainMin, 0, SCORE_SCALE_MAX);
  const contextEndPct = toPercent(domainMax, 0, SCORE_SCALE_MAX);
  const contextWidthPct = Math.max(contextEndPct - contextStartPct, 0.8); // floor keeps a level field visible as a mark, not a hairline
  const youContextPct = toPercent(you, 0, SCORE_SCALE_MAX);

  const youPct = isLevel ? 50 : toPercent(you, domainMin, domainMax);
  // The pin label is laid out in three zones rather than positioned exactly
  // over the pin. Exact positioning cannot be made safe here: the label's width
  // depends on the product name, the rail's width depends on the viewport, and
  // neither is knowable while rendering on the server — a threshold calibrated
  // on "eToro" (5 characters) puts "Charles Schwab Intelligent Portfolios" at
  // left: -45px on a 320px viewport, i.e. cut off. Real names in the field hit
  // this: Interactive Brokers, Merrill Edge Self-Directed, Vanguard Digital
  // Advisor. Three zones cost a little precision — the stem and pin still mark
  // the exact score — and cannot clip at any name length or viewport.
  const labelAlign: 'flex-start' | 'center' | 'flex-end' =
    youPct <= 33 ? 'flex-start' : youPct >= 67 ? 'flex-end' : 'center';

  const aboveLowest = you - domainMin;
  const belowHighest = domainMax - you;

  // Rank and score are not the same ordering. lib/comparison/ranking.ts scores
  // a "smart rank" (score minus cost, plus bonus and click weight) and then
  // pins the editorial top pick to #1 regardless of its score. For US trading
  // the two happen to coincide, so the rank line and the axis tell one story.
  // On a topic with a bonus or a cost term — business banking, credit cards —
  // they will not, and a reader who counts five marks to the right of a pin
  // labelled "Rank 3" sees a chart that looks wrong rather than one measuring
  // something else. Detected rather than assumed: the note appears only when
  // the two orderings actually disagree, so it never adds noise to a page
  // where they agree.
  const rankOrderMatchesScore = rows.every((r, i, all) => i === 0 || all[i - 1].score >= r.score);

  return (
    <section
      aria-labelledby="score-in-field-heading"
      className="p-4 sm:p-6"
      style={{
        border: '1px solid var(--sfp-hairline-strong)',
        borderRadius: '18px',
        background: '#fff',
        fontFamily: 'var(--font-primary)',
        color: 'var(--sfp-ink)',
      }}
    >
      {/* ---- Masthead: headline left, the score as the focal figure right ---- */}
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
        <h2
          id="score-in-field-heading"
          style={{
            fontFamily: 'var(--font-secondary)',
            ...TYPE.title,
            fontWeight: 400,
            letterSpacing: '-0.01em',
            lineHeight: 1.3,
            margin: 0,
          }}
        >
          Where {name} sits in the field
        </h2>
        <div style={{ textAlign: 'right' }}>
          <div
            style={{
              ...TYPE.display,
              fontFamily: 'var(--font-primary)',
              fontWeight: 700,
              color: 'var(--sfp-ink)',
              letterSpacing: '-0.02em',
              ...NUM,
            }}
          >
            {you.toFixed(1)}
            <span style={{ fontSize: '17px', fontWeight: 400, color: 'var(--sfp-slate)' }}>/10</span>
          </div>
          {showRank && (
            <div style={{ fontSize: '12.5px', margin: '7px 0 0', lineHeight: 1.4, whiteSpace: 'nowrap' }}>
              <span style={{ fontWeight: 600, color: 'var(--sfp-navy)' }}>{scoreLabel(you)}</span>
              <span style={{ color: 'var(--sfp-slate)' }}> &middot; {rankPhrase(rank, total)}</span>
            </div>
          )}
        </div>
      </div>

      {/* ---- The figure: 0-10 context axis, zoom connector, detail axis ---- */}
      <div style={{ marginTop: '14px', borderTop: '1px solid var(--sfp-hairline)', paddingTop: '16px' }}>
        {/* Axis numerals sit ABOVE the context rail so the connector below it
            can attach to the band without crossing a row of text. The three
            values land exactly at 0%, 50% and 100% via justify-between, which
            is where 0, 5 and 10 truly are on the axis. */}
        <div
          aria-hidden="true"
          className="flex justify-between"
          style={{ ...TYPE.micro, color: 'var(--sfp-slate)', marginBottom: '5px', ...NUM }}
        >
          <span>0</span>
          <span>5</span>
          <span>10</span>
        </div>
        <div aria-hidden="true" style={{ position: 'relative', height: '15px' }}>
          {/* Axis line + integer ticks — real chart furniture, not a track. */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: '7px',
              height: '1px',
              background: 'var(--sfp-hairline-strong)',
            }}
          />
          {Array.from({ length: SCORE_SCALE_MAX + 1 }, (_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${i * (100 / SCORE_SCALE_MAX)}%`,
                top: '7px',
                width: '1px',
                height: '5px',
                marginLeft: i === SCORE_SCALE_MAX ? '-1px' : 0,
                background: 'var(--sfp-hairline-strong)',
              }}
            />
          ))}
          {/* The field's span as one solid bar sitting on the axis. */}
          <div
            style={{
              position: 'absolute',
              top: '3px',
              height: '9px',
              left: `${contextStartPct}%`,
              width: `${contextWidthPct}%`,
              background: 'var(--sfp-navy)',
            }}
          />
          {/* This product inside the highlighted span — a light notch, so the
              span reads as "the field" and the notch as "me", without colour
              being the only cue (the pin on the detail axis carries the text
              label). Suppressed for a level field, where the span IS this
              product and a notch would only chop the ~1%-wide mark into two
              slivers. */}
          {!isLevel && (
            <div
              style={{
                position: 'absolute',
                top: '4px',
                height: '7px',
                left: `${youContextPct}%`,
                width: '2px',
                marginLeft: '-1px',
                background: '#fff',
              }}
            />
          )}
        </div>

        {/* ---- Detail axis: the highlighted band, magnified ----
            Dropped entirely for a level field: magnifying a zero-width band is
            meaningless and its percentage maths would divide by zero. */}
        {!isLevel && (
          <>
            {/* Zoom-lens connector: two hairlines from the band's ends down to
                the full width of the detail axis — the print convention for an
                inset magnification, and the reason the two rails read as one
                figure. preserveAspectRatio="none" stretches the 0-100 viewBox
                to the card width; non-scaling-stroke keeps the lines at 1px. */}
            <svg
              aria-hidden="true"
              viewBox="0 0 100 12"
              preserveAspectRatio="none"
              style={{ display: 'block', width: '100%', height: '26px' }}
            >
              {/* A filled cone, not two hairlines. The band can sit anywhere on
                  the 0-10 axis, and when it sits near one end — eToro's does,
                  at 78-96% — the far connector has to cross most of the width
                  over a few pixels of height. As a stroke that renders almost
                  horizontal and reads as a stray rule someone forgot to
                  delete, not as a link between two rails. Filled, the same
                  geometry reads instantly as "this narrow slice, opened up",
                  which is the print convention for an inset, and it works at
                  any band position. */}
              <polygon
                points={`${contextStartPct},0 ${contextEndPct},0 100,12 0,12`}
                fill="var(--sfp-sky)"
              />
            </svg>

            {/* Figure caption — serif italic, sentence case. Names the span so
                context → detail is explicit without an eyebrow label. */}
            <p
              style={{
                fontFamily: 'var(--font-secondary)',
                fontStyle: 'italic',
                ...TYPE.body,
                color: 'var(--sfp-slate)',
                textAlign: 'center',
                margin: '2px 0 0',
              }}
            >
              Inside that {spread.toFixed(1)}-point band, magnified
            </p>

            {/* Pin label sits in its own row above the rail so it can never
                collide with the tick marks, and comes first in DOM order so a
                screen reader hears "eToro 8.3" before the (hidden) rail. */}
            <div
              style={{
                display: 'flex',
                justifyContent: labelAlign,
                paddingLeft: `${DOT_INSET_PX}px`,
                paddingRight: `${DOT_INSET_PX}px`,
                minHeight: '20px',
                marginTop: '10px',
              }}
            >
              <span style={{ ...TYPE.body, fontWeight: 600, color: 'var(--sfp-navy)', textAlign: 'center' }}>
                {name} <span style={NUM}>{you.toFixed(1)}</span>
              </span>
            </div>

            <div aria-hidden="true" style={{ position: 'relative', height: '26px' }}>
              {/* Detail axis line */}
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: '15px',
                  height: '1px',
                  background: 'var(--sfp-hairline-strong)',
                }}
              />
              <div style={{ position: 'absolute', left: `${DOT_INSET_PX}px`, right: `${DOT_INSET_PX}px`, top: 0, bottom: 0 }}>
                {/* Competitors as strip-plot tick marks crossing the axis —
                    slate (4.8:1) rather than a pale hairline tone, which would
                    fall under the 3:1 floor for non-text marks. The white ring
                    keeps two near-identical scores readable as two marks
                    instead of one blob. */}
                {rows.map((row, i) => {
                  if (row.isYou) return null;
                  const pct = toPercent(row.score, domainMin, domainMax);
                  // Keep the flyout inside the rail at the extremes: anchor it
                  // by its left edge near the start, its right edge near the
                  // end, centred everywhere between. Without this the first and
                  // last competitor's label is half cut off by the card.
                  const anchor =
                    pct < 12 ? 'translateX(0)' : pct > 88 ? 'translateX(-100%)' : 'translateX(-50%)';
                  return (
                    <span
                      key={`${row.rank}-${row.name}-${i}`}
                      // The wrapper is the hit area: 22px, far wider than the
                      // 2px tick, because a 2px hover target is unusable in
                      // practice — the tick itself stays 2px.
                      // NOT focusable on purpose. This whole rail is aria-hidden,
                      // and a focusable element inside an aria-hidden subtree is
                      // a defect in itself; making it focusable properly would
                      // also add one tab stop per competitor. The hover label is
                      // a mouse-only enhancement, and every value it can reveal
                      // is available to assistive tech in the visually-hidden
                      // list below the rail.
                      className="group absolute"
                      style={{
                        left: `${pct}%`,
                        top: 0,
                        width: '22px',
                        height: '26px',
                        marginLeft: '-11px',
                        cursor: 'default',
                      }}
                    >
                      <span
                        aria-hidden="true"
                        style={{
                          position: 'absolute',
                          left: '50%',
                          top: '9px',
                          width: '2px',
                          height: '13px',
                          marginLeft: '-1px',
                          background: 'var(--sfp-slate)',
                          boxShadow: '0 0 0 1px #fff',
                        }}
                      />
                      {/* Name + score of the competitor behind this mark. Hidden
                          by opacity rather than display so it is laid out (and
                          therefore correctly positioned) before it is shown. */}
                      <span
                        // HOVERABLE (WCAG 1.4.13). The flyout is a CHILD of the
                        // hovered wrapper and keeps its pointer events, so moving
                        // the pointer onto it keeps the ancestor in :hover and the
                        // label stays up — someone at 200% zoom can actually read
                        // it. paddingBottom bridges the gap down to the mark so the
                        // pointer never crosses dead space on the way. An earlier
                        // pointer-events-none version failed this: the label
                        // vanished the moment you moved toward it.
                        // Dismissible is NOT met — that needs an Esc handler, and
                        // this is a Server Component with no client JS. The
                        // trade-off is deliberate and cheap here: every name and
                        // score the flyout can show is also visible in the
                        // sidebar's ranking table and present in the sr-only list
                        // below, so a user who cannot dismiss it loses nothing.
                        className="absolute opacity-0 transition-opacity duration-150 group-hover:opacity-100"
                        style={{
                          left: '50%',
                          bottom: '14px',
                          transform: anchor,
                          paddingBottom: '8px',
                          zIndex: 2,
                        }}
                      >
                        <span
                          style={{
                            display: 'block',
                            whiteSpace: 'nowrap',
                            ...TYPE.body,
                            fontWeight: 600,
                            color: '#fff',
                            background: 'var(--sfp-ink)',
                            padding: '4px 8px',
                            borderRadius: '6px',
                          }}
                        >
                          {row.name}{' '}
                          <span style={NUM}>{row.score.toFixed(1)}</span>
                        </span>
                      </span>
                    </span>
                  );
                })}
                {/* This product — a stem from its label down to a filled pin on
                    the axis. Shape and size carry the distinction (circle vs.
                    plain tick), so it survives greyscale. */}
                <span
                  style={{
                    position: 'absolute',
                    left: `${youPct}%`,
                    top: 0,
                    width: '2px',
                    height: '12px',
                    marginLeft: '-1px',
                    background: 'var(--sfp-navy)',
                  }}
                />
                <span
                  style={{
                    position: 'absolute',
                    left: `${youPct}%`,
                    top: '10px',
                    width: '12px',
                    height: '12px',
                    marginLeft: '-6px',
                    borderRadius: '50%',
                    background: 'var(--sfp-navy)',
                    boxShadow: '0 0 0 2px #fff',
                  }}
                />
              </div>
            </div>

            {/* The full field in text. The marks reveal each competitor's name
                and score on hover, which is a mouse-only affordance — this list
                makes exactly the same values available to screen readers,
                keyboard-only users and anyone on a touch device, so no one gets
                less than the mouse user does. `sr-only` rather than aria-label
                on each mark: the marks sit inside an aria-hidden rail, and one
                continuous list reads far better than nine isolated
                announcements. */}
            <ul className="sr-only">
              {rows.map((row, i) => (
                <li key={`sr-${row.rank}-${row.name}-${i}`}>
                  {row.name}: {row.score.toFixed(1)} out of 10
                  {row.isYou ? ' (the product reviewed on this page)' : ''}
                </li>
              ))}
            </ul>

            {/* Rail ends as real text — the axis labels stay in the a11y tree. */}
            <div className="flex items-start justify-between gap-4" style={{ marginTop: '6px' }}>
              <span style={{ ...TYPE.micro, color: 'var(--sfp-slate)' }}>
                <b
                  style={{
                    display: 'block',
                    ...TYPE.body,
                    fontWeight: 600,
                    color: 'var(--sfp-ink)',
                    ...NUM,
                  }}
                >
                  {domainMin.toFixed(1)}
                </b>
                {lowName ? `${lowName} · lowest` : 'lowest'}
              </span>
              <span style={{ ...TYPE.micro, color: 'var(--sfp-slate)', textAlign: 'right' }}>
                <b
                  style={{
                    display: 'block',
                    ...TYPE.body,
                    fontWeight: 600,
                    color: 'var(--sfp-ink)',
                    ...NUM,
                  }}
                >
                  {domainMax.toFixed(1)}
                </b>
                {highName ? `${highName} · highest` : 'highest'}
              </span>
            </div>
          </>
        )}
      </div>

      {/* ---- Notes to the figure — one footnote zone under a rule, in the
              print-research convention, instead of a caption glued beneath
              each rail. Every sentence here is the textual equivalent of a
              graphical statement above, visible to everyone. ---- */}
      <div style={{ marginTop: '16px', borderTop: '1px solid var(--sfp-hairline)', paddingTop: '12px' }}>
        <p style={{ ...TYPE.body, color: 'var(--sfp-slate)', margin: 0 }}>
          {isLevel ? (
            plotted === 1 ? (
              <>
                {name} is the only provider currently tracked in this field, scoring{' '}
                <b style={{ color: 'var(--sfp-ink)', fontWeight: 600, ...NUM }}>{you.toFixed(1)}</b> out of 10.
              </>
            ) : (
              <>
                All {plotted} providers score{' '}
                <b style={{ color: 'var(--sfp-ink)', fontWeight: 600, ...NUM }}>{you.toFixed(1)}</b> out of 10 —
                the field is completely level.
              </>
            )
          ) : (
            <>
              All {plotted} providers score between{' '}
              <b style={{ color: 'var(--sfp-ink)', fontWeight: 600, ...NUM }}>{domainMin.toFixed(1)}</b> and{' '}
              <b style={{ color: 'var(--sfp-ink)', fontWeight: 600, ...NUM }}>{domainMax.toFixed(1)}</b>, a{' '}
              {spread.toFixed(1)}-point spread on a 10-point scale.
            </>
          )}
        </p>

        {!isLevel && (
          <p style={{ ...TYPE.body, color: 'var(--sfp-slate)', margin: '6px 0 0' }}>
            {/* Exact equality against the axis end, not an epsilon. With an
                epsilon a product 0.02 behind the last-placed provider is called
                "the lowest in this field" while the axis label right above it
                still names that other provider as lowest — two contradicting
                statements inside one card. `product_attributes.score` is an
                unconstrained float, so this is reachable. Exact equality is the
                same test that decides whether an end gets a NAME at all. */}
            {you === domainMin ? (
              <>
                {name} scores {you.toFixed(1)}: the lowest in this field, {belowHighest.toFixed(1)} points below
                the highest score.
              </>
            ) : you === domainMax ? (
              <>
                {name} scores {you.toFixed(1)}: the highest in this field, {aboveLowest.toFixed(1)} points above
                the lowest score.
              </>
            ) : (
              <>
                {name} scores {you.toFixed(1)}: {aboveLowest.toFixed(1)} points above the lowest and{' '}
                {belowHighest.toFixed(1)} below the highest score in the field.
              </>
            )}
          </p>
        )}

        {!isLevel && showRank && !rankOrderMatchesScore && (
          <p style={{ ...TYPE.micro, color: 'var(--sfp-slate)', margin: '6px 0 0' }}>
            Positions on this rail are plotted by score. The rank also weighs cost and our editorial
            pick, so it can differ from the score order.
          </p>
        )}
      </div>
    </section>
  );
}
