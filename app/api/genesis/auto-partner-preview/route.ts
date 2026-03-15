import { NextRequest, NextResponse } from 'next/server';
import { getAutoTemplatePartnerPreview } from '@/lib/actions/genesis';
import { isValidMarket } from '@/lib/i18n/config';

export async function GET(request: NextRequest) {
  const market = request.nextUrl.searchParams.get('market');
  const category = request.nextUrl.searchParams.get('category');
  if (!market || !category || !isValidMarket(market)) {
    return NextResponse.json({ success: false, error: 'Missing or invalid market or category' }, { status: 400 });
  }
  const result = await getAutoTemplatePartnerPreview(market, category);
  return NextResponse.json(result);
}
