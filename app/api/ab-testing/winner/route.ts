// app/api/ab-testing/winner/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getHubWinner } from '@/lib/actions/ab-testing';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || '';
  const market = searchParams.get('market') || 'us';

  try {
    const winner = await getHubWinner(category, market);
    return NextResponse.json({ winner });
  } catch {
    return NextResponse.json({ winner: null }, { status: 200 });
  }
}
