// app/api/hub-partners/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getTopPartnersForHub } from '@/lib/actions/genesis';
import type { Market } from '@/lib/i18n/config';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const market = (searchParams.get('market') || 'us') as Market;
  const category = searchParams.get('category') || 'trading';
  const limit = parseInt(searchParams.get('limit') || '5', 10);
  const sortBy = (searchParams.get('sortBy') || 'cpa') as 'cpa' | 'rating';

  try {
    const partners = await getTopPartnersForHub(market, category, limit, sortBy);
    return NextResponse.json(partners);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
