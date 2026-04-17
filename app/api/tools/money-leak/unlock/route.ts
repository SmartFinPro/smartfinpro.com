// app/api/tools/money-leak/unlock/route.ts
// POST — Gate full results behind email capture + send personalized PDF-style report.

import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { render } from '@react-email/components';
import { validate, MoneyLeakUnlockSchema } from '@/lib/validation';
import { logger } from '@/lib/logging';
import { createServiceClient } from '@/lib/supabase/server';
import { matchRecommendations } from '@/lib/money-leak/recommend';
import { sendEmail } from '@/lib/email/resend';
import { MoneyLeakReportEmail } from '@/lib/email/templates/money-leak-report';
import { scanLimiter } from '@/lib/security/rate-limit';
import { getClientIp } from '@/lib/security/client-ip';
import type {
  LeakResult,
  LeakCategoryResult,
  UnlockResponse,
} from '@/lib/money-leak/types';
import type { Market } from '@/types';

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!scanLimiter.check(ip)) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': '60' } },
    );
  }

  try {
    const parsed = validate(MoneyLeakUnlockSchema, await request.json());
    if (!parsed.ok) return parsed.error;

    const { scanId, email } = parsed.data;

    const supabase = createServiceClient();

    // Load the scan row
    const { data: scan, error: loadErr } = await supabase
      .from('leak_scanner_results')
      .select('*')
      .eq('id', scanId)
      .single();

    if (loadErr || !scan) {
      return NextResponse.json({ error: 'Scan not found' }, { status: 404 });
    }

    const market = scan.market as Market;
    const currency = scan.currency as string;

    const result: LeakResult = {
      totalMonthlyLeak: Number(scan.total_monthly_leak),
      totalAnnualLeak: Number(scan.total_annual_leak),
      categories: (scan.categories as LeakCategoryResult[]) ?? [],
      topLeaks: (scan.top_leaks as LeakResult['topLeaks']) ?? [],
      overallSeverity: scan.overall_severity as LeakResult['overallSeverity'],
    };

    // Match recommendations now (not earlier) — keeps scan fast + uses latest registry
    const recommendations = await matchRecommendations(result, market, 3);

    // Persist email + recommendations on the row (idempotent via update)
    const { error: updateErr } = await supabase
      .from('leak_scanner_results')
      .update({
        email,
        email_captured_at: new Date().toISOString(),
        recommended_products: recommendations,
      })
      .eq('id', scanId);

    if (updateErr) {
      logger.error('[money-leak/unlock] update failed:', updateErr.message);
      // Non-fatal — we still return the report to the user
    }

    // Upsert into global subscribers for nurture sequence (best-effort, non-fatal)
    try {
      await supabase
        .from('subscribers')
        .upsert(
          {
            email,
            market,
            lead_magnet: 'money-leak-scanner',
            source_page: '/tools/money-leak-scanner',
            subscribed_at: new Date().toISOString(),
          },
          { onConflict: 'email', ignoreDuplicates: false },
        );
    } catch (err) {
      logger.warn('[money-leak/unlock] subscriber upsert failed (non-fatal):', err);
    }

    // Fire-and-forget email (don't block response on SMTP latency)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://smartfinpro.com';
    const unsubscribeToken = Buffer.from(email).toString('base64').slice(0, 16);
    const unsubscribeUrl = `${baseUrl}/unsubscribe?email=${encodeURIComponent(email)}&token=${unsubscribeToken}`;

    queueMicrotask(async () => {
      try {
        const html = await render(
          MoneyLeakReportEmail({
            result,
            recommendations,
            currency,
            baseUrl,
            scanId,
            unsubscribeUrl,
          }),
        );
        const annual = result.totalAnnualLeak.toLocaleString('en-US', {
          style: 'currency',
          currency,
          maximumFractionDigits: 0,
        });
        await sendEmail({
          to: email,
          subject: `Your Money Leak Report — ${annual}/year in recoverable savings`,
          html,
        });
      } catch (err) {
        Sentry.captureException(err);
        logger.error('[money-leak/unlock] email send failed:', err);
      }
    });

    const response: UnlockResponse = {
      ok: true,
      result,
      recommendations,
    };
    return NextResponse.json(response);
  } catch (err) {
    Sentry.captureException(err);
    logger.error('[money-leak/unlock] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
