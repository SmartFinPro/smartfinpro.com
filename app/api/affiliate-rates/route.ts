// app/api/affiliate-rates/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAffiliateRatesForMarket } from '@/lib/actions/genesis';
import type { Market } from '@/lib/i18n/config';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const market = (searchParams.get('market') || 'us') as Market;

  try {
    const rates = await getAffiliateRatesForMarket(market);
    return NextResponse.json(rates);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
