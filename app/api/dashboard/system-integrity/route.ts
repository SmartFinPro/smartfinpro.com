// app/api/dashboard/system-integrity/route.ts
// F-08: Serves REAL system-integrity metrics to the dashboard widget.
// Auth: gated by proxy.ts (/api/dashboard/* requires a valid session cookie).
import { NextResponse } from 'next/server';
import { getSystemIntegrity } from '@/lib/actions/system-integrity';
import { logger } from '@/lib/logging';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await getSystemIntegrity();
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    return NextResponse.json(result.data, {
      headers: { 'Cache-Control': 'private, max-age=30' },
    });
  } catch (error) {
    logger.error('system-integrity route failed', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
