// app/api/refresh-content-hub/route.ts — Invalidates Content Hub cache
import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    revalidateTag('content-hub');
    return NextResponse.json({
      success: true,
      message: 'Content Hub cache invalidated — next load will scan fresh data.',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[refresh-content-hub] Failed to revalidate:', msg);
    return NextResponse.json(
      { success: false, message: msg },
      { status: 500 }
    );
  }
}
