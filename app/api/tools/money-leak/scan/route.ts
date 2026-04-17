// app/api/tools/money-leak/scan/route.ts
// POST — Run the leak scoring engine, persist the result, return a preview + scanId.

import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import crypto from 'crypto';
import { validate, MoneyLeakScanSchema } from '@/lib/validation';
import { logger } from '@/lib/logging';
import { computeLeakScore } from '@/lib/money-leak/score-engine';
import { CATEGORY_DEFINITIONS } from '@/lib/money-leak/leak-categories';
import { matchRecommendations } from '@/lib/money-leak/recommend';
import { createServiceClient } from '@/lib/supabase/server';
import { scanLimiter } from '@/lib/security/rate-limit';
import { getClientIp } from '@/lib/security/client-ip';
import type { ScanResponse } from '@/lib/money-leak/types';

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!scanLimiter.check(ip)) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': '60' } },
    );
  }

  try {
    const parsed = validate(MoneyLeakScanSchema, await request.json());
    if (!parsed.ok) return parsed.error;

    const body = parsed.data;

    // Pure computation — deterministic
    const result = computeLeakScore({
      monthlyIncome: body.monthlyIncome,
      currency: body.currency,
      market: body.market,
      expenses: body.expenses,
      lifestyle: body.lifestyle,
    });

    // Hash IP for privacy
    const ipHash =
      ip === 'unknown' ? null : crypto.createHash('sha256').update(ip).digest('hex').slice(0, 32);

    const supabase = createServiceClient();
    const userAgent = request.headers.get('user-agent') || null;

    // Compute recommendations in parallel with the DB insert — shaves ~50ms
    // off the response time for live-calculator UX.
    const [recommendations, insertRes] = await Promise.all([
      matchRecommendations(result, body.market, 3),
      supabase
        .from('leak_scanner_results')
        .insert({
          session_id: body.sessionId,
          market: body.market,
          monthly_income: body.monthlyIncome,
          currency: body.currency,
          expenses: body.expenses,
          lifestyle: body.lifestyle,
          total_monthly_leak: result.totalMonthlyLeak,
          total_annual_leak: result.totalAnnualLeak,
          categories: result.categories,
          top_leaks: result.topLeaks,
          overall_severity: result.overallSeverity,
          recommended_products: [],
          user_agent: userAgent,
          ip_hash: ipHash,
        })
        .select('id')
        .single(),
    ]);

    if (insertRes.error || !insertRes.data) {
      logger.error('[money-leak/scan] insert failed:', insertRes.error?.message ?? 'no row');
      return NextResponse.json({ error: 'Failed to persist scan' }, { status: 500 });
    }

    const response: ScanResponse = {
      ok: true,
      scanId: insertRes.data.id as string,
      preview: {
        totalMonthlyLeak: result.totalMonthlyLeak,
        totalAnnualLeak: result.totalAnnualLeak,
        currency: body.currency,
        overallSeverity: result.overallSeverity,
        topLeaks: result.topLeaks.slice(0, 3).map((id) => {
          const cat = result.categories.find((c) => c.id === id)!;
          return {
            id,
            label: CATEGORY_DEFINITIONS[id].label,
            potentialSavings: cat.potentialSavings,
          };
        }),
      },
      recommendations,
    };

    return NextResponse.json(response);
  } catch (err) {
    Sentry.captureException(err);
    logger.error('[money-leak/scan] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
