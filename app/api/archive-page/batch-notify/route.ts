// app/api/archive-page/batch-notify/route.ts — Send batch archive summary to Telegram
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logging';
import { sendTelegramAlert } from '@/lib/alerts/telegram';
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
    const { totalCount, successCount, failedSlugs, reason } = body;

    if (!totalCount || !successCount) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const failedLine = failedSlugs?.length > 0
      ? `\n❌ Failed: ${failedSlugs.join(', ')}`
      : '';

    await sendTelegramAlert(
      `📦📦 <b>Batch Archive Complete</b>\n` +
      `✅ ${successCount}/${totalCount} pages archived${failedLine}\n` +
      `${reason ? `Reason: ${reason}` : ''}`
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[api/archive-page/batch-notify] Failed:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
