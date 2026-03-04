// app/api/archive-page/hard-delete/route.ts — Permanently delete an archived page
import { NextResponse } from 'next/server';
import { hardDeletePage } from '@/lib/actions/archived-pages';

export async function POST(request: Request) {
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
    console.error('[api/archive-page/hard-delete] Failed:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
