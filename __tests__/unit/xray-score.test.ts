// __tests__/unit/xray-score.test.ts
import { describe, it, expect } from 'vitest';
import {
  computeAnnualCost,
  computeFitScore,
  computeCostScore,
  computeRiskScore,
  computeValueScore,
  computeXRayScore,
  getDecisionLabel,
  getTopRisks,
  computeFullXRay,
  type ProductProfile,
  type UserInputs,
} from '@/lib/xray/score-engine';

// ── Fixtures ──────────────────────────────────────────────────────────

const BASE_PROFILE: ProductProfile = {
  basePriceMonthly: 49,
  seatPriceMonthly: 10,
  freeSeats: 1,
  usageOverageMonthly: 0,
  addonCostMonthly: 0,
  onboardingHours: 4,
  fitDimensions: {
    beginner: 0.9,
    advanced: 0.4,
    teams: 0.7,
    solo: 0.8,
    lowCost: 0.6,
    featureRich: 0.8,
    compliance: 0.5,
  },
  riskDimensions: {
    complianceGap: 0.2,
    lockinRisk: 0.3,
    supportRisk: 0.1,
    outageRisk: 0.05,
    policyRisk: 0.15,
  },
  expectedHoursSaved: 10,
};

const BASE_INPUTS: UserInputs = {
  experience: 'beginner',
  teamSize: 1,
  monthlyBudget: 50,
  priority: 'ease-of-use',
  hourlyValue: 50,
};

// ── Annual Cost ───────────────────────────────────────────────────────

describe('computeAnnualCost', () => {
  it('computes base price only for solo user', () => {
    const cost = computeAnnualCost(BASE_PROFILE, BASE_INPUTS);
    // 49 * 12 = 588 + onboarding (4h * $50 = 200) = 788
    expect(cost).toBe(788);
  });

  it('adds seat cost for team > freeSeats', () => {
    const cost = computeAnnualCost(BASE_PROFILE, { ...BASE_INPUTS, teamSize: 5 });
    // base: 49, extra seats: 4 * 10 = 40, monthly = 89, annual = 1068
    // + onboarding: 4 * 50 = 200 → 1268
    expect(cost).toBe(1268);
  });

  it('handles free tool (zero prices)', () => {
    const freeProfile = { ...BASE_PROFILE, basePriceMonthly: 0, seatPriceMonthly: 0, onboardingHours: 0 };
    expect(computeAnnualCost(freeProfile, BASE_INPUTS)).toBe(0);
  });

  it('includes overage and addon costs', () => {
    const p = { ...BASE_PROFILE, usageOverageMonthly: 15, addonCostMonthly: 5 };
    // monthly: 49 + 0 + 15 + 5 = 69, annual = 828 + onboarding 200 = 1028
    expect(computeAnnualCost(p, BASE_INPUTS)).toBe(1028);
  });
});

// ── Fit Score ─────────────────────────────────────────────────────────

describe('computeFitScore', () => {
  it('returns high score for beginner on beginner-friendly product', () => {
    const score = computeFitScore(BASE_PROFILE, BASE_INPUTS);
    // beginner=0.9*0.40 + solo=0.8*0.25 + ease=(0.6+0.8)/2*0.35 = 0.36+0.20+0.245 = 0.805 → 81
    expect(score).toBeGreaterThanOrEqual(75);
    expect(score).toBeLessThanOrEqual(85);
  });

  it('returns lower score for advanced user on beginner product', () => {
    const score = computeFitScore(BASE_PROFILE, { ...BASE_INPUTS, experience: 'advanced' });
    // advanced=0.4*0.40 = 0.16 (much lower)
    expect(score).toBeLessThan(70);
  });

  it('team-oriented score for large teams', () => {
    const score = computeFitScore(BASE_PROFILE, { ...BASE_INPUTS, teamSize: 10 });
    // teams=0.7*0.25 instead of solo=0.8*0.25
    expect(score).toBeLessThan(computeFitScore(BASE_PROFILE, BASE_INPUTS));
  });
});

// ── Cost Score ────────────────────────────────────────────────────────

describe('computeCostScore', () => {
  it('returns 100 when cost equals budget', () => {
    expect(computeCostScore(600, 50)).toBe(100); // 50*12=600
  });

  it('returns 100 when under budget', () => {
    expect(computeCostScore(300, 50)).toBe(100);
  });

  it('returns 0 when cost is 2× budget', () => {
    expect(computeCostScore(1200, 50)).toBe(0); // 2× → (1200-600)/600*100 = 100 → 100-100=0
  });

  it('returns ~50 when cost is 1.5× budget', () => {
    const score = computeCostScore(900, 50); // (900-600)/600*100 = 50 → 100-50 = 50
    expect(score).toBe(50);
  });

  it('handles zero budget gracefully', () => {
    expect(computeCostScore(100, 0)).toBe(0);
    expect(computeCostScore(0, 0)).toBe(100);
  });
});

// ── Risk Score ────────────────────────────────────────────────────────

describe('computeRiskScore', () => {
  it('returns 100 for zero-risk product', () => {
    const safeProfile = {
      ...BASE_PROFILE,
      riskDimensions: { complianceGap: 0, lockinRisk: 0, supportRisk: 0, outageRisk: 0, policyRisk: 0 },
    };
    expect(computeRiskScore(safeProfile)).toBe(100);
  });

  it('returns 0 for maximum-risk product', () => {
    const riskyProfile = {
      ...BASE_PROFILE,
      riskDimensions: { complianceGap: 1, lockinRisk: 1, supportRisk: 1, outageRisk: 1, policyRisk: 1 },
    };
    expect(computeRiskScore(riskyProfile)).toBe(0);
  });

  it('weights compliance highest (35%)', () => {
    const a = { ...BASE_PROFILE, riskDimensions: { ...BASE_PROFILE.riskDimensions, complianceGap: 0.5 } };
    const b = { ...BASE_PROFILE, riskDimensions: { ...BASE_PROFILE.riskDimensions, outageRisk: 0.5 } };
    // compliance ×35 > outage ×15 → a has lower score (more penalty)
    expect(computeRiskScore(a)).toBeLessThan(computeRiskScore(b));
  });
});

// ── Value Score ───────────────────────────────────────────────────────

describe('computeValueScore', () => {
  it('returns 100 for free tool', () => {
    expect(computeValueScore(BASE_PROFILE, 0, BASE_INPUTS)).toBe(100);
  });

  it('high value when ROI ratio ≥ 2', () => {
    // 10h * $50 * 12 = $6000 saved, cost = $3000 → ratio 2.0 → 100
    expect(computeValueScore(BASE_PROFILE, 3000, BASE_INPUTS)).toBe(100);
  });

  it('50 when cost equals value saved', () => {
    // 10h * $50 * 12 = $6000 saved, cost = $6000 → ratio 1.0 → 50
    expect(computeValueScore(BASE_PROFILE, 6000, BASE_INPUTS)).toBe(50);
  });
});

// ── Composite X-Ray Score ─────────────────────────────────────────────

describe('computeXRayScore', () => {
  it('weights sum to 1.0 (100 across the board = 100)', () => {
    expect(computeXRayScore(100, 100, 100, 100)).toBe(100);
  });

  it('weights sum to 1.0 (0 across the board = 0)', () => {
    expect(computeXRayScore(0, 0, 0, 0)).toBe(0);
  });

  it('fit has most weight (40%)', () => {
    const highFit = computeXRayScore(100, 50, 50, 50);
    const highCost = computeXRayScore(50, 100, 50, 50);
    expect(highFit).toBeGreaterThan(highCost);
  });
});

// ── Decision Labels ───────────────────────────────────────────────────

describe('getDecisionLabel', () => {
  it('Strong Fit at 80+', () => expect(getDecisionLabel(80)).toBe('Strong Fit'));
  it('Strong Fit at 100', () => expect(getDecisionLabel(100)).toBe('Strong Fit'));
  it('Fit with Caveats at 65–79', () => expect(getDecisionLabel(79)).toBe('Fit with Caveats'));
  it('Trade-offs at 50–64', () => expect(getDecisionLabel(50)).toBe('Trade-offs'));
  it('Not Recommended below 50', () => expect(getDecisionLabel(49)).toBe('Not Recommended'));
});

// ── Top Risks ─────────────────────────────────────────────────────────

describe('getTopRisks', () => {
  it('returns max 2 risks sorted by severity', () => {
    const risks = getTopRisks(BASE_PROFILE);
    expect(risks.length).toBeLessThanOrEqual(2);
    if (risks.length === 2) {
      expect(risks[0].severity).toBeGreaterThanOrEqual(risks[1].severity);
    }
  });

  it('filters out low-severity risks (≤0.15)', () => {
    const lowRiskProfile = {
      ...BASE_PROFILE,
      riskDimensions: { complianceGap: 0.05, lockinRisk: 0.10, supportRisk: 0.05, outageRisk: 0.05, policyRisk: 0.05 },
    };
    expect(getTopRisks(lowRiskProfile)).toHaveLength(0);
  });
});

// ── Full Orchestration ────────────────────────────────────────────────

describe('computeFullXRay', () => {
  it('returns complete result object', () => {
    const result = computeFullXRay(BASE_PROFILE, BASE_INPUTS);
    expect(result.fitScore).toBeGreaterThanOrEqual(0);
    expect(result.fitScore).toBeLessThanOrEqual(100);
    expect(result.costScore).toBeGreaterThanOrEqual(0);
    expect(result.riskScore).toBeGreaterThanOrEqual(0);
    expect(result.valueScore).toBeGreaterThanOrEqual(0);
    expect(result.xrayScore).toBeGreaterThanOrEqual(0);
    expect(result.xrayScore).toBeLessThanOrEqual(100);
    expect(result.annualCost).toBeGreaterThanOrEqual(0);
    expect(typeof result.decisionLabel).toBe('string');
    expect(Array.isArray(result.topRisks)).toBe(true);
  });

  it('scores are consistent with individual computations', () => {
    const result = computeFullXRay(BASE_PROFILE, BASE_INPUTS);
    const expectedCost = computeAnnualCost(BASE_PROFILE, BASE_INPUTS);
    expect(result.annualCost).toBe(expectedCost);
    expect(result.xrayScore).toBe(
      computeXRayScore(result.fitScore, result.costScore, result.riskScore, result.valueScore),
    );
  });
});
