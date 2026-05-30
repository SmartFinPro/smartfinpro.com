// lib/cohorts/aggregate.ts
// Pure, DB-free cohort / LTV aggregation. No 'server-only', no Supabase, no FX
// lookups — all inputs are already FX-normalised to USD by the caller. This
// keeps the core deterministic and unit-testable.
//
// Cohort model: acquisition cohort = the ISO week (Monday, UTC) of a click
// (link_clicks). Approved revenue events (conversion_events, event_type
// 'approved') are attributed to the cohort of their originating click via
// click_id, bucketed by age = whole weeks between click and event. Cumulative
// revenue per age ÷ cohort size = LTV per click.

export interface CohortClick {
  clickId: string;
  clickedAt: string; // ISO timestamp
}

export interface CohortRevenueEvent {
  clickId: string;
  receivedAt: string; // ISO timestamp
  valueUsd: number;   // already FX-normalised to USD
  eventType: string;  // canonical funnel stage; only APPROVED_EVENT_TYPES count
}

export interface CohortMatrixRow {
  cohort: string;                 // ISO date of the cohort week (Monday, UTC)
  size: number;                   // number of clicks in the cohort
  cumulativeRevenueUsd: number[]; // index = age in weeks (0..maxAgeWeeks), cumulative
  ltvPerClick: number[];          // cumulativeRevenueUsd[age] / size
}

export interface CohortResult {
  granularity: 'week';
  maxAgeWeeks: number;
  cohorts: CohortMatrixRow[];     // sorted ascending by cohort week
  kpis: {
    totalClicks: number;
    totalApprovedRevenueUsd: number;
    convertingClicks: number;     // distinct clicks with >=1 approved event
    conversionRate: number;       // convertingClicks / totalClicks
    avgLtvPerClick: number;       // totalApprovedRevenueUsd / totalClicks
    avgLtvPerClickAtW4: number;   // mean LTV/click at age 4 across mature cohorts
  };
}

export interface CohortOptions {
  maxAgeWeeks?: number; // matrix width (default 12); events older than this are dropped
  nowIso?: string;      // reference "now" for W4 maturity; if omitted, all cohorts count
  horizonWeeks?: number; // KPI horizon (default 4)
}

const APPROVED_EVENT_TYPES = new Set<string>(['approved']);
const WEEK_MS = 7 * 86_400_000;

/** ISO week start (Monday, UTC) as YYYY-MM-DD. */
export function weekStartUtc(iso: string): string {
  const d = new Date(iso);
  const day = d.getUTCDay(); // 0=Sun..6=Sat
  const diff = day === 0 ? -6 : 1 - day; // shift back to Monday
  const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + diff));
  return monday.toISOString().slice(0, 10);
}

/** Whole weeks elapsed between click and event (>=0). */
function ageInWeeks(clickedAt: string, receivedAt: string): number {
  const ms = new Date(receivedAt).getTime() - new Date(clickedAt).getTime();
  return Math.floor(ms / WEEK_MS);
}

export function computeCohorts(
  clicks: CohortClick[],
  events: CohortRevenueEvent[],
  opts: CohortOptions = {},
): CohortResult {
  const maxAgeWeeks = opts.maxAgeWeeks ?? 12;
  const horizon = opts.horizonWeeks ?? 4;

  // Index clicks by id; build per-cohort size + remember each click's metadata.
  const clickById = new Map<string, { clickedAt: string; cohort: string }>();
  const sizeByCohort = new Map<string, number>();
  for (const c of clicks) {
    const cohort = weekStartUtc(c.clickedAt);
    clickById.set(c.clickId, { clickedAt: c.clickedAt, cohort });
    sizeByCohort.set(cohort, (sizeByCohort.get(cohort) ?? 0) + 1);
  }

  // Per-cohort incremental revenue per age bucket (length maxAgeWeeks+1).
  const incByCohort = new Map<string, number[]>();
  const ensure = (cohort: string) => {
    let arr = incByCohort.get(cohort);
    if (!arr) {
      arr = new Array(maxAgeWeeks + 1).fill(0);
      incByCohort.set(cohort, arr);
    }
    return arr;
  };

  let totalApprovedRevenueUsd = 0;
  const convertingClicks = new Set<string>();

  for (const e of events) {
    if (!APPROVED_EVENT_TYPES.has(e.eventType)) continue; // only approved revenue
    const click = clickById.get(e.clickId);
    if (!click) continue; // event not attributable to a known click in window
    const age = ageInWeeks(click.clickedAt, e.receivedAt);
    if (age < 0 || age > maxAgeWeeks) continue; // outside the observation window
    ensure(click.cohort)[age] += e.valueUsd;
    totalApprovedRevenueUsd += e.valueUsd;
    convertingClicks.add(e.clickId);
  }

  // Build cumulative + LTV rows, sorted by cohort week ascending.
  const cohorts: CohortMatrixRow[] = Array.from(sizeByCohort.keys())
    .sort()
    .map((cohort) => {
      const size = sizeByCohort.get(cohort) ?? 0;
      const inc = incByCohort.get(cohort) ?? new Array(maxAgeWeeks + 1).fill(0);
      const cumulativeRevenueUsd: number[] = [];
      let running = 0;
      for (let age = 0; age <= maxAgeWeeks; age++) {
        running += inc[age];
        cumulativeRevenueUsd.push(running);
      }
      const ltvPerClick = cumulativeRevenueUsd.map((rev) => (size > 0 ? rev / size : 0));
      return { cohort, size, cumulativeRevenueUsd, ltvPerClick };
    });

  // KPIs.
  const totalClicks = clicks.length;
  const avgLtvPerClick = totalClicks > 0 ? totalApprovedRevenueUsd / totalClicks : 0;

  const ageIdx = Math.min(horizon, maxAgeWeeks);
  const now = opts.nowIso ? new Date(opts.nowIso).getTime() : null;
  const matureLtv: number[] = [];
  for (const row of cohorts) {
    if (row.size === 0) continue;
    // A cohort is "mature" for the horizon once horizon+1 weeks have elapsed
    // since its week start (so age `horizon` is fully observable). With no
    // nowIso reference, treat every cohort as mature.
    const mature =
      now === null ||
      new Date(row.cohort).getTime() + (horizon + 1) * WEEK_MS <= now;
    if (mature) matureLtv.push(row.ltvPerClick[ageIdx]);
  }
  const avgLtvPerClickAtW4 =
    matureLtv.length > 0 ? matureLtv.reduce((s, v) => s + v, 0) / matureLtv.length : 0;

  return {
    granularity: 'week',
    maxAgeWeeks,
    cohorts,
    kpis: {
      totalClicks,
      totalApprovedRevenueUsd,
      convertingClicks: convertingClicks.size,
      conversionRate: totalClicks > 0 ? convertingClicks.size / totalClicks : 0,
      avgLtvPerClick,
      avgLtvPerClickAtW4,
    },
  };
}
