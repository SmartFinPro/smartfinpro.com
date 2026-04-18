// app/api/archive-page/archive/route.ts — Soft-delete (archive) a page
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logging';
import { archivePage } from '@/lib/actions/archived-pages';
import { isValidDashboardSessionValue } from '@/lib/auth/dashboard-session';
import { compareSecret } from '@/lib/security/timing-safe';

function isAuthed(request: NextRequest): boolean {
  if (process.env.DASHBOARD_AUTH_DISABLED === 'true') return true;
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
    const body = await request.json();
    const { pageUrl, filePath, market, category, slug, redirectTarget, reason } = body;

    if (!pageUrl || !filePath || !market || !category || !slug || !redirectTarget) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await archivePage({
      pageUrl,
      filePath,
      market,
      category,
      slug,
      redirectTarget,
      reason: reason || '',
    });

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[api/archive-page/archive] Failed:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
