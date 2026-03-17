// lib/xray/score-engine.ts
// X-Ray Score™ engine — pure computation, zero side effects, zero imports.
// All functions are deterministic and trivially unit-testable.

// ── Types ─────────────────────────────────────────────────────────────

export interface ProductProfile {
  basePriceMonthly: number;
  seatPriceMonthly: number;
  freeSeats: number;
  usageOverageMonthly: number;
  addonCostMonthly: number;
  onboardingHours: number;
  fitDimensions: {
    beginner: number;     // 0–1
    advanced: number;
    teams: number;
    solo: number;
    lowCost: number;
    featureRich: number;
    compliance: number;
  };
  riskDimensions: {
    complianceGap: number;  // 0–1 (higher = more risk)
    lockinRisk: number;
    supportRisk: number;
    outageRisk: number;
    policyRisk: number;
  };
  expectedHoursSaved: number;  // monthly hours saved by using the tool
}

export interface UserInputs {
  experience: 'beginner' | 'intermediate' | 'advanced';
  teamSize: number;
  monthlyBudget: number;
  priority: 'low-cost' | 'features' | 'ease-of-use' | 'compliance';
  hourlyValue: number;   // user's hourly rate (for onboarding + value calc)
}

export interface RiskItem {
  label: string;
  severity: number;    // 0–1
}

export interface XRayResult {
  fitScore: number;      // 0–100
  costScore: number;     // 0–100
  riskScore: number;     // 0–100 (100 = safest)
  valueScore: number;    // 0–100
  xrayScore: number;     // 0–100 weighted composite
  annualCost: number;    // dollar amount
  topRisks: RiskItem[];
  decisionLabel: string;
}

// ── Helpers ───────────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// ── Core Computations ─────────────────────────────────────────────────

/**
 * Total annual cost including hidden costs (seats, onboarding time).
 * Formula: 12 × (base + extra_seats × seat_price + overage + addon)
 *          + onboarding_hours × hourly_value
 */
export function computeAnnualCost(
  profile: ProductProfile,
  inputs: UserInputs,
): number {
  const extraSeats = Math.max(0, inputs.teamSize - profile.freeSeats);
  const monthlyCost =
    profile.basePriceMonthly +
    extraSeats * profile.seatPriceMonthly +
    profile.usageOverageMonthly +
    profile.addonCostMonthly;

  const onboardingCost = profile.onboardingHours * inputs.hourlyValue;

  return monthlyCost * 12 + onboardingCost;
}

/**
 * How well does the product fit the user's profile? (0–100)
 * Weighted sum of relevant fit dimensions based on experience + priority.
 */
export function computeFitScore(
  profile: ProductProfile,
  inputs: UserInputs,
): number {
  const dims = profile.fitDimensions;

  // Experience mapping
  const experienceScore =
    inputs.experience === 'beginner'
      ? dims.beginner
      : inputs.experience === 'advanced'
        ? dims.advanced
        : (dims.beginner + dims.advanced) / 2; // intermediate = balanced

  // Team size mapping
  const teamScore = inputs.teamSize > 3 ? dims.teams : dims.solo;

  // Priority mapping
  const priorityScore =
    inputs.priority === 'low-cost'
      ? dims.lowCost
      : inputs.priority === 'features'
        ? dims.featureRich
        : inputs.priority === 'compliance'
          ? dims.compliance
          : (dims.lowCost + dims.featureRich) / 2; // ease-of-use = balanced

  // Weights: experience 40%, team 25%, priority 35%
  const raw = experienceScore * 0.40 + teamScore * 0.25 + priorityScore * 0.35;
  return clamp(Math.round(raw * 100), 0, 100);
}

/**
 * How does the real annual cost compare to the user's budget? (0–100)
 * At or under budget = 100, 2× budget = 0.
 */
export function computeCostScore(
  annualCost: number,
  monthlyBudget: number,
): number {
  const budgetAnnual = monthlyBudget * 12;
  if (budgetAnnual <= 0) return annualCost <= 0 ? 100 : 0;
  const raw = 100 - ((annualCost - budgetAnnual) / budgetAnnual) * 100;
  return clamp(Math.round(raw), 0, 100);
}

/**
 * Risk score (0–100, where 100 = safest).
 * Inverted penalty: compliance×35 + lockin×20 + support×15 + outage×15 + policy×15.
 */
export function computeRiskScore(profile: ProductProfile): number {
  const r = profile.riskDimensions;
  const penalty =
    r.complianceGap * 35 +
    r.lockinRisk * 20 +
    r.supportRisk * 15 +
    r.outageRisk * 15 +
    r.policyRisk * 15;
  return clamp(Math.round(100 - penalty), 0, 100);
}

/**
 * Value score — ROI proxy (0–100).
 * How much time-value does the tool return relative to its cost?
 */
export function computeValueScore(
  profile: ProductProfile,
  annualCost: number,
  inputs: UserInputs,
): number {
  if (annualCost <= 0) return 100; // free tool = max value
  const annualValueSaved = profile.expectedHoursSaved * inputs.hourlyValue * 12;
  const ratio = annualValueSaved / annualCost;
  // ratio 1.0 = 50 points, ratio 2.0 = 100 points
  return clamp(Math.round(ratio * 50), 0, 100);
}

/**
 * Composite X-Ray Score (0–100).
 * Weights: 40% fit, 25% cost, 20% risk, 15% value.
 */
export function computeXRayScore(
  fitScore: number,
  costScore: number,
  riskScore: number,
  valueScore: number,
): number {
  const raw =
    fitScore * 0.40 +
    costScore * 0.25 +
    riskScore * 0.20 +
    valueScore * 0.15;
  return clamp(Math.round(raw), 0, 100);
}

/**
 * Human-readable decision label.
 */
export function getDecisionLabel(xrayScore: number): string {
  if (xrayScore >= 80) return 'Strong Fit';
  if (xrayScore >= 65) return 'Fit with Caveats';
  if (xrayScore >= 50) return 'Trade-offs';
  return 'Not Recommended';
}

/**
 * Top 2 risk factors sorted by severity.
 */
export function getTopRisks(profile: ProductProfile): RiskItem[] {
  const r = profile.riskDimensions;
  const items: RiskItem[] = [
    { label: 'Compliance Gap', severity: r.complianceGap },
    { label: 'Vendor Lock-in', severity: r.lockinRisk },
    { label: 'Support Quality', severity: r.supportRisk },
    { label: 'Service Uptime', severity: r.outageRisk },
    { label: 'Policy Changes', severity: r.policyRisk },
  ];
  return items
    .filter((i) => i.severity > 0.15) // only flag meaningful risks
    .sort((a, b) => b.severity - a.severity)
    .slice(0, 2);
}

/**
 * Orchestrator — computes full X-Ray Result from profile + inputs.
 */
export function computeFullXRay(
  profile: ProductProfile,
  inputs: UserInputs,
): XRayResult {
  const annualCost = computeAnnualCost(profile, inputs);
  const fitScore = computeFitScore(profile, inputs);
  const costScore = computeCostScore(annualCost, inputs.monthlyBudget);
  const riskScore = computeRiskScore(profile);
  const valueScore = computeValueScore(profile, annualCost, inputs);
  const xrayScore = computeXRayScore(fitScore, costScore, riskScore, valueScore);
  const decisionLabel = getDecisionLabel(xrayScore);
  const topRisks = getTopRisks(profile);

  return {
    fitScore,
    costScore,
    riskScore,
    valueScore,
    xrayScore,
    annualCost,
    topRisks,
    decisionLabel,
  };
}
