// app/api/health/route.ts
// PUBLIC Liveness endpoint — minimal payload, safe for load balancers and uptime monitors.
//
// Responds with { status: 'ok' | 'down' } and HTTP 200/503 only.
// No infrastructure details (no env, no cron names, no heap, no DB latency).
//
// For full health diagnostics use GET /api/internal/health with Bearer token.

import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

interface PublicHealthResponse {
  status: 'ok' | 'down';
  timestamp: string;
}

export async function GET(): Promise<NextResponse<PublicHealthResponse>> {
  // Minimal liveness check — single DB ping, no detail leaked.
  // SECURITY (H-05): bound the DB call with an AbortSignal so a hung backend
  // cannot wedge every health probe into a long-running request and exhaust
  // the connection pool or expose timing signals.
  try {
    const supabase = createServiceClient();
    const probe = supabase
      .from('affiliate_links')
      .select('id')
      .limit(1)
      .abortSignal(AbortSignal.timeout(3_000));
    const { error } = await probe;

    if (error) {
      return NextResponse.json(
        { status: 'down', timestamp: new Date().toISOString() },
        {
          status: 503,
          headers: { 'Cache-Control': 'no-store' },
        },
      );
    }

    return NextResponse.json(
      { status: 'ok', timestamp: new Date().toISOString() },
      {
        status: 200,
        // 60s CDN cache to reduce DB load from frequent LB probes + DoS mitigation
        headers: { 'Cache-Control': 'public, max-age=0, s-maxage=60' },
      },
    );
  } catch {
    return NextResponse.json(
      { status: 'down', timestamp: new Date().toISOString() },
      {
        status: 503,
        headers: { 'Cache-Control': 'no-store' },
      },
    );
  }
}
