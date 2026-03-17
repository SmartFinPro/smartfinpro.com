// lib/bandit/thompson-sampling.ts
// P5: Pure TypeScript Thompson Sampling implementation
//
// Beta distribution sampling using the Jöhnk's algorithm.
// No external dependencies — works in both browser and Node.js.

/**
 * Sample from a Beta(alpha, beta) distribution.
 * Uses the ratio of gamma random variates method.
 */
export function betaSample(alpha: number, beta: number): number {
  // Degenerate cases
  if (alpha <= 0 || beta <= 0) return 0.5;

  const gammaA = gammaSample(alpha);
  const gammaB = gammaSample(beta);
  const sum = gammaA + gammaB;

  return sum > 0 ? gammaA / sum : 0.5;
}

/**
 * Sample from a Gamma(shape, 1) distribution.
 * Uses Marsaglia and Tsang's method for shape >= 1,
 * with a correction for shape < 1.
 */
function gammaSample(shape: number): number {
  if (shape < 1) {
    // For shape < 1, use the relation: Gamma(a) = Gamma(a+1) * U^(1/a)
    const u = Math.random();
    return gammaSample(shape + 1) * Math.pow(u, 1 / shape);
  }

  // Marsaglia and Tsang's method
  const d = shape - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);

  for (;;) {
    let x: number;
    let v: number;

    do {
      x = normalSample();
      v = 1 + c * x;
    } while (v <= 0);

    v = v * v * v;
    const u = Math.random();

    // Squeeze step
    if (u < 1 - 0.0331 * x * x * x * x) return d * v;
    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
  }
}

/** Standard normal sample via Box-Muller transform */
function normalSample(): number {
  const u1 = Math.random();
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

// ── Arm Selection ────────────────────────────────────────────────

export interface BanditArm {
  linkId: string;
  alpha: number;
  betaParam: number;
  totalShown: number;
}

/**
 * Select the arm with the highest Thompson Sample.
 * Returns the index of the selected arm.
 */
export function selectArm(arms: BanditArm[]): number {
  if (arms.length === 0) return -1;
  if (arms.length === 1) return 0;

  let bestIdx = 0;
  let bestSample = -1;

  for (let i = 0; i < arms.length; i++) {
    const sample = betaSample(arms[i].alpha, arms[i].betaParam);
    if (sample > bestSample) {
      bestSample = sample;
      bestIdx = i;
    }
  }

  return bestIdx;
}

// Minimum total_shown across ALL arms before trusting Thompson Sampling
export const BANDIT_WARMUP_THRESHOLD = 100;
