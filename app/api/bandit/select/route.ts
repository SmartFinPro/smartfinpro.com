// app/api/bandit/select/route.ts
// P5: Bandit Selection API — Client requests optimal offer
//
// GET /api/bandit/select?market=us&category=trading&device=desktop
// Returns: { slug, method } or 204 if no data

import { NextRequest, NextResponse } from 'next/server';
import { selectOffer } from '@/lib/actions/bandit';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const market = searchParams.get('market') || 'us';
  const category = searchParams.get('category') || '';
  const device = searchParams.get('device') || 'desktop';

  if (!category) {
    return NextResponse.json({ error: 'category is required' }, { status: 400 });
  }

  const result = await selectOffer(market, category, device);

  if (!result) {
    return new NextResponse(null, { status: 204 });
  }

  return NextResponse.json(result);
}
