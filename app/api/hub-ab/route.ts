// app/api/hub-ab/route.ts
// API route for ComparisonHub A/B testing — replaces dynamic import of ab-testing.ts
import { NextRequest, NextResponse } from 'next/server';
import { getHubWinner, logHubImpression, logHubClick } from '@/lib/actions/ab-testing';
import type { AbVariant } from '@/lib/actions/ab-testing';

// GET — fetch hub winner (if test concluded)
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const category = searchParams.get('category') || 'trading';
  const market = searchParams.get('market') || 'us';

  try {
    const winner = await getHubWinner(category, market);
    return NextResponse.json({ winner }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch {
    return NextResponse.json({ winner: null }, { status: 200 });
  }
}

// POST — log impression or click
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, category, market, variant, sessionId, providerName } = body;

    if (action === 'impression') {
      await logHubImpression(category, market, variant as AbVariant, sessionId);
    } else if (action === 'click') {
      await logHubClick(category, market, variant as AbVariant, providerName, sessionId);
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    // Silent fail — analytics must never break UX
    return NextResponse.json({ ok: true });
  }
}
