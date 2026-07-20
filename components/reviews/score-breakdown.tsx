// components/reviews/score-breakdown.tsx — V2 BEST-X sub-score breakdown (T8)
// ============================================================
// Server Component. Renders `position.subScores` as compact minibar rows —
// designed to live INSIDE VerdictCard's BestXScore panel (260px rail), not
// as a full-width standalone zone (Betreiber-Wunsch 2026-07-19: "score card
// kompakter, premium enterprise"). V15 idiom: hairline-row track,
// tabular-nums, navy fill, no <table>, no donut/radial chart — both
// explicitly ruled out by the plan.
//
// Per-row scoreLabel() words were deliberately dropped in the compact
// redesign — the headline score above already carries its band word; rows
// read label + number + bar. Row order is the subScores insertion order
// (DB-canonical), NEVER sorted by value: sorting descending would combine
// with the 5-row cap to systematically hide the weakest dimension.
//
// Dynamically iterates whatever keys are present in `subScores` — T0d:
// eToro has exactly 4 (fees/features/ux/support); a mortgage-broker cockpit
// has entirely different dimensions. Never hardcode a fixed key set. Caps
// at 5 visible rows regardless of how many keys the field actually has.
//
// Null-degradation (plan Pflicht, tested in
// __tests__/unit/score-breakdown.test.ts): no subScores (position is null,
// or a position whose subScores is missing/empty/not-an-object) renders
// `null` — no empty card, no placeholder bars.
// ============================================================

import type { SubScores } from '@/lib/comparison/types';

/** Field size beyond which only the first N sub-scores are shown (plan: "max 5 sichtbar"). */
const MAX_VISIBLE_SUBSCORES = 5;

function humanizeSubScoreKey(key: string): string {
  if (key.toLowerCase() === 'ux') return 'UX';
  if (key.length === 0) return key;
  return key.charAt(0).toUpperCase() + key.slice(1);
}

export interface ScoreBreakdownProps {
  subScores: SubScores | null | undefined;
}

export function ScoreBreakdown({ subScores }: ScoreBreakdownProps) {
  if (!subScores || typeof subScores !== 'object') return null;

  const entries = Object.entries(subScores).filter(
    (entry): entry is [string, number] => typeof entry[1] === 'number' && Number.isFinite(entry[1]),
  );
  if (entries.length === 0) return null;

  const visible = entries.slice(0, MAX_VISIBLE_SUBSCORES);

  return (
    <div style={{ fontFamily: 'var(--font-primary)' }}>
      <div
        style={{
          fontSize: '10px',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--sfp-slate)',
          fontWeight: 600,
          marginBottom: '10px',
        }}
      >
        Score Breakdown
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {visible.map(([key, value]) => {
          const pct = Math.max(0, Math.min(100, (value / 10) * 100));
          return (
            <div key={key}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  fontSize: '12px',
                  color: 'var(--sfp-ink)',
                  marginBottom: '4px',
                }}
              >
                <span>{humanizeSubScoreKey(key)}</span>
                <span
                  style={{
                    fontVariantNumeric: 'tabular-nums',
                    fontWeight: 600,
                    fontSize: '12.5px',
                  }}
                >
                  {value.toFixed(1)}
                </span>
              </div>
              <div
                style={{
                  height: '3px',
                  background: 'var(--sfp-hairline-row)',
                  borderRadius: '2px',
                  overflow: 'hidden',
                }}
              >
                <div style={{ width: `${pct}%`, height: '100%', background: 'var(--sfp-navy)' }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
