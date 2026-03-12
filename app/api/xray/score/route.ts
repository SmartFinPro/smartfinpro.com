// app/api/xray/score/route.ts
// POST — Compute X-Ray Score™ for a product with user inputs.

import { NextRequest, NextResponse } from 'next/server';
import { validate, XRayScoreSchema } from '@/lib/validation';
import { resolveProductProfile } from '@/lib/xray/profile-resolver';
import { computeFullXRay, type UserInputs } from '@/lib/xray/score-engine';
import { findAlternatives } from '@/lib/xray/alternatives';
import { createServiceClient } from '@/lib/supabase/server';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const raw = await request.json();
    const parsed = validate(XRayScoreSchema, raw);
    if (!parsed.ok) return parsed.error;

    const body = parsed.data;

    // 1. Resolve product profile (DB → MDX fallback)
    const profile = await resolveProductProfile(body.slug, body.market);

    if (!profile) {
      return NextResponse.json(
        { error: 'Product profile not found', slug: body.slug, market: body.market },
        { status: 404 },
      );
    }

    // 2. Compute scores
    const inputs: UserInputs = {
      experience: body.experience,
      teamSize: body.teamSize,
      monthlyBudget: body.monthlyBudget,
      priority: body.priority,
      hourlyValue: body.hourlyValue,
    };

    const result = computeFullXRay(profile, inputs);

    // 3. Find alternatives in same category
    const alternatives = await findAlternatives(
      body.slug,
      body.market,
      body.category,
      inputs,
    );

    // 4. Generate shareable result ID (16 hex = 64-bit entropy)
    const resultId = `r_${randomUUID().replace(/-/g, '').slice(0, 16)}`;

    // 5. Persist to xray_results
    try {
      const supabase = createServiceClient();

      // Hash IP for rate limiting / analytics (privacy-safe)
      const forwarded = request.headers.get('x-forwarded-for');
      const ip = forwarded?.split(',')[0]?.trim() ?? 'unknown';
      const ipHash = ip
        .split('')
        .reduce((acc, c) => ((acc << 5) - acc + c.charCodeAt(0)) | 0, 0)
        .toString(16)
        .slice(0, 16);

      await supabase.from('xray_results').insert({
        result_id: resultId,
        session_id: body.sessionId ?? null,
        slug: body.slug,
        market: body.market,
        category: body.category,
        inputs: {
          experience: body.experience,
          teamSize: body.teamSize,
          monthlyBudget: body.monthlyBudget,
          priority: body.priority,
          hourlyValue: body.hourlyValue,
        },
        fit_score: result.fitScore,
        cost_score: result.costScore,
        risk_score: result.riskScore,
        value_score: result.valueScore,
        xray_score: result.xrayScore,
        annual_cost: result.annualCost,
        top_risks: result.topRisks,
        alternatives: alternatives,
        decision_label: result.decisionLabel,
        ip_hash: ipHash,
      });
    } catch {
      // DB insert non-critical — result still returned to user
      console.warn('[xray] Failed to persist result:', resultId);
    }

    // 6. Return full result
    return NextResponse.json({
      resultId,
      fitScore: result.fitScore,
      costScore: result.costScore,
      riskScore: result.riskScore,
      valueScore: result.valueScore,
      xrayScore: result.xrayScore,
      annualCost: result.annualCost,
      topRisks: result.topRisks,
      alternatives,
      decisionLabel: result.decisionLabel,
    });
  } catch (err) {
    console.error('[xray] Score computation failed:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
