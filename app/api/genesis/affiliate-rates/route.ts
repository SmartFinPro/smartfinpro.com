import { NextRequest, NextResponse } from 'next/server';
import { getAffiliateRatesForMarket } from '@/lib/actions/genesis';
import { isValidMarket } from '@/lib/i18n/config';

export async function GET(request: NextRequest) {
  const market = request.nextUrl.searchParams.get('market');
  if (!market || !isValidMarket(market)) {
    return NextResponse.json([], { status: 400 });
  }
  const result = await getAffiliateRatesForMarket(market);
  return NextResponse.json(result);
}
