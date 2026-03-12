// app/api/xray/result/[resultId]/route.ts
// GET — Fetch a persisted X-Ray Score™ result by its share ID.

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

const RESULT_ID_REGEX = /^r_[a-f0-9]{8,16}$/;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ resultId: string }> },
) {
  const { resultId } = await params;

  // Validate format
  if (!RESULT_ID_REGEX.test(resultId)) {
    return NextResponse.json(
      { error: 'Invalid result ID format' },
      { status: 400 },
    );
  }

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('xray_results')
      .select(
        'result_id, slug, market, category, inputs, fit_score, cost_score, risk_score, value_score, xray_score, annual_cost, top_risks, alternatives, decision_label, created_at',
      )
      .eq('result_id', resultId)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'Result not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      resultId: data.result_id,
      slug: data.slug,
      market: data.market,
      category: data.category,
      inputs: data.inputs,
      fitScore: Number(data.fit_score),
      costScore: Number(data.cost_score),
      riskScore: Number(data.risk_score),
      valueScore: Number(data.value_score),
      xrayScore: Number(data.xray_score),
      annualCost: Number(data.annual_cost),
      topRisks: data.top_risks,
      alternatives: data.alternatives,
      decisionLabel: data.decision_label,
      createdAt: data.created_at,
    });
  } catch (err) {
    console.error('[xray] Result fetch failed:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
