// lib/tools/results/wealth-horizon-contribution-series.ts
// Wealth Horizon v3 signature visual (DESIGN-DIREKTIVE, item 4: "DAS Chart —
// gestapelte Jahres-Balken"). Pure, no React/DOM — splits an
// already-engine-computed balance path into "Your contributions" (linear,
// starting amount + monthly rate × elapsed years) and "Growth" (the
// remainder). `balance` is NEVER recomputed here — it always comes straight
// from the engine's own base-scenario accumulation rows (harte Regel: no
// second calc path for the balance itself). Only the CONTRIBUTIONS half is
// a UI-derived split, and growth is simply what's left over, floored at 0
// (early years can have `contributions > balance` by a cent or two from
// rounding, or — in an edited "what if I withdraw money" style scenario —
// meaningfully; either way the chart never draws a negative growth segment).

export interface ContributionGrowthPoint {
  age: number;
  balance: number;
  contributions: number;
  growth: number;
}

/**
 * @param rows base-scenario accumulation rows (age, balance), ascending by age — engine output, unmodified.
 * @param currentAge the projection's starting age (rows[0].age, by engine convention).
 * @param startingAmount the starting balance the user entered (Step 1).
 * @param monthlyContributionTotal combined monthly contribution rate (employee + employer, Step 2 + Advanced settings).
 */
export function buildContributionGrowthSeries(
  rows: { age: number; balance: number }[],
  currentAge: number,
  startingAmount: number,
  monthlyContributionTotal: number,
): ContributionGrowthPoint[] {
  return rows.map((row) => {
    const contributions = startingAmount + monthlyContributionTotal * 12 * (row.age - currentAge);
    const growth = Math.max(0, row.balance - contributions);
    return { age: row.age, balance: row.balance, contributions, growth };
  });
}
