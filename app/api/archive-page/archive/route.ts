// app/api/archive-page/archive/route.ts — Soft-delete (archive) a page
import { NextResponse } from 'next/server';
import { archivePage } from '@/lib/actions/archived-pages';

export async function POST(request: Request) {
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
    console.error('[api/archive-page/archive] Failed:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
