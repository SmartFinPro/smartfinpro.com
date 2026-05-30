// app/api/refresh-content-hub/route.ts — Invalidates Content Hub cache
import { revalidateTag } from 'next/cache';
import { logger } from '@/lib/logging';
import { NextRequest, NextResponse } from 'next/server';
import { isValidDashboardSessionValue } from '@/lib/auth/dashboard-session';
import { compareSecret } from '@/lib/security/timing-safe';

// Dashboard-session gate — this is triggered by the dashboard "refresh" button
// (same-origin, carries the cookie). Dev-bypass only outside production.
function isAuthed(request: NextRequest): boolean {
  if (process.env.NODE_ENV !== 'production' && process.env.DASHBOARD_AUTH_DISABLED === 'true') {
    return true;
  }
  const dashSecret = process.env.DASHBOARD_SECRET;
  if (!dashSecret) return false;
  const cookie = request.cookies.get('sfp-dash-auth')?.value;
  const bearer = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  return isValidDashboardSessionValue(cookie, dashSecret) || compareSecret(bearer, dashSecret);
}

export async function POST(request: NextRequest) {
  if (!isAuthed(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  try {
    revalidateTag('content-hub', {});
    return NextResponse.json({
      success: true,
      message: 'Content Hub cache invalidated — next load will scan fresh data.',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[refresh-content-hub] Failed to revalidate:', msg);
    return NextResponse.json(
      { success: false, message: msg },
      { status: 500 }
    );
  }
}
