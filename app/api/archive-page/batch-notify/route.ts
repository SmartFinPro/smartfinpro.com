// app/api/archive-page/batch-notify/route.ts — Send batch archive summary to Telegram
import { NextResponse } from 'next/server';
import { sendTelegramAlert } from '@/lib/alerts/telegram';

export async function POST(request: Request) {
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
    console.error('[api/archive-page/batch-notify] Failed:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
