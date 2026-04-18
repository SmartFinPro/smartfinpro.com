// app/api/archive-page/hard-delete/route.ts — Permanently delete an archived page
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logging';
import { hardDeletePage } from '@/lib/actions/archived-pages';
import { isValidDashboardSessionValue } from '@/lib/auth/dashboard-session';
import { compareSecret } from '@/lib/security/timing-safe';

function isAuthed(request: NextRequest): boolean {
  // Allow bypass flag only in explicit dev override
  if (process.env.DASHBOARD_AUTH_DISABLED === 'true') return true;

  const dashSecret = process.env.DASHBOARD_SECRET;
  if (!dashSecret) return false;

  const cookie = request.cookies.get('sfp-dash-auth')?.value;
  const bearer = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

  return isValidDashboardSessionValue(cookie, dashSecret) || compareSecret(bearer, dashSecret);
}

export async function POST(request: NextRequest) {
  // ── Auth — destructive endpoint, must be dashboard-authenticated ────────
  if (!isAuthed(request)) {
    logger.warn('[archive-page/hard-delete] Unauthorized attempt', {
      ip: request.headers.get('x-forwarded-for') ?? 'unknown',
    });
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 },
    );
  }

  try {
    const body = await request.json();
    const { archivedPageId, confirmSlug } = body;

    if (!archivedPageId || !confirmSlug) {
      return NextResponse.json(
        { success: false, error: 'Missing archivedPageId or confirmSlug' },
        { status: 400 }
      );
    }

    const result = await hardDeletePage(archivedPageId, confirmSlug);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[api/archive-page/hard-delete] Failed:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
