// components/reviews/score-breakdown.tsx — V2 BEST-X sub-score breakdown (T8)
// ============================================================
// Server Component. Renders `position.subScores` as dezente horizontale
// Bars (V15 minibar-style: hairline rows, tabular-nums, no <table>, no
// donut/radial chart — both explicitly ruled out by the plan).
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
import { scoreLabel } from '@/lib/reviews/score-label';

/** Field size beyond which only the top N sub-scores are shown (plan: "max 5 sichtbar"). */
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
          fontSize: '10.5px',
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
        {visible.map(([key, value], index) => {
          const pct = Math.max(0, Math.min(100, (value / 10) * 100));
          const isLast = index === visible.length - 1;
          return (
            <div
              key={key}
              style={{
                borderBottom: isLast ? 'none' : '1px solid var(--sfp-hairline-row)',
                paddingBottom: '8px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '13px',
                  color: 'var(--sfp-ink)',
                  marginBottom: '5px',
                }}
              >
                <span>{humanizeSubScoreKey(key)}</span>
                <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                  {value.toFixed(1)} · {scoreLabel(value)}
                </span>
              </div>
              <div
                style={{
                  height: '4px',
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
