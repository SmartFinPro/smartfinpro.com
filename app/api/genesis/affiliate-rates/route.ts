import { NextRequest, NextResponse } from 'next/server';
import { getAffiliateRatesForMarket } from '@/lib/actions/genesis';

export async function GET(request: NextRequest) {
  const market = request.nextUrl.searchParams.get('market');
  if (!market) {
    return NextResponse.json([], { status: 400 });
  }
  const result = await getAffiliateRatesForMarket(market);
  return NextResponse.json(result);
}
