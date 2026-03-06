// app/api/archive-page/restore/route.ts — Restore an archived page
import { NextResponse } from 'next/server';
import { logger } from '@/lib/logging';
import { restorePage } from '@/lib/actions/archived-pages';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { archivedPageId } = body;

    if (!archivedPageId) {
      return NextResponse.json(
        { success: false, error: 'Missing archivedPageId' },
        { status: 400 }
      );
    }

    const result = await restorePage(archivedPageId);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[api/archive-page/restore] Failed:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
