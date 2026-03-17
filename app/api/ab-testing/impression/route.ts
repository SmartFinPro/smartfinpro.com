// app/api/ab-testing/impression/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { logHubImpression, logHubClick } from '@/lib/actions/ab-testing';
import type { AbVariant } from '@/lib/actions/ab-testing';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, category, market, variant, providerName, sessionId } = body;

    if (type === 'impression') {
      await logHubImpression(category, market, variant as AbVariant, sessionId);
    } else if (type === 'click') {
      await logHubClick(category, market, variant as AbVariant, providerName, sessionId);
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
