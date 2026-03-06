// app/api/web-vitals/route.ts
// AP-13 Phase 4 — Core Web Vitals RUM ingestion endpoint
// Called client-side via useReportWebVitals (next/web-vitals)

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { validate, WebVitalsSchema } from '@/lib/validation';

// Google's 2026 CWV thresholds
const THRESHOLDS: Record<string, [number, number]> = {
  LCP:  [2500, 4000],   // good < 2500ms, poor > 4000ms
  INP:  [200,  500],    // good < 200ms,  poor > 500ms  (replaces FID)
  CLS:  [0.1,  0.25],   // good < 0.1,    poor > 0.25
  FCP:  [1800, 3000],   // good < 1800ms, poor > 3000ms
  TTFB: [800,  1800],   // good < 800ms,  poor > 1800ms
  FID:  [100,  300],    // legacy (still tracked for old browsers)
};

function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const thresholds = THRESHOLDS[name];
  if (!thresholds) return 'needs-improvement';
  const [good, poor] = thresholds;
  if (value <= good) return 'good';
  if (value > poor)  return 'poor';
  return 'needs-improvement';
}

function inferMarket(pathname: string): string {
  if (pathname.startsWith('/uk')) return 'uk';
  if (pathname.startsWith('/ca')) return 'ca';
  if (pathname.startsWith('/au')) return 'au';
  return 'us';
}

export async function POST(request: NextRequest) {
  try {
    const raw = await request.json();
    const parsed = validate(WebVitalsSchema, raw);
    if (!parsed.ok) return parsed.error;

    const name  = parsed.data.name.toUpperCase();
    const value = parsed.data.value;
    const pageUrl = String(parsed.data.id ?? parsed.data.page_url ?? '').slice(0, 500);
    const rating  = parsed.data.rating || getRating(name, value);
    const market  = parsed.data.market ?? inferMarket(pageUrl);

    const supabase = createServiceClient();

    const { error } = await supabase.from('web_vitals').insert({
      name,
      value,
      rating,
      page_url:        pageUrl,
      market,
      delta:           parsed.data.delta ?? null,
      metric_id:       parsed.data.metric_id ?? null,
      navigation_type: parsed.data.navigationType ?? null,
    });

    // Silently ignore dedup conflicts (unique constraint on metric_id)
    if (error && !error.message.includes('unique')) {
      console.error('[web-vitals] insert error:', error.message);
    }

    return NextResponse.json({ ok: true }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (err) {
    console.error('[web-vitals] handler error:', (err as Error).message);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
