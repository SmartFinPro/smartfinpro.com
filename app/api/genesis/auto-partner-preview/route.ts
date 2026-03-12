import { NextRequest, NextResponse } from 'next/server';
import { getAutoTemplatePartnerPreview } from '@/lib/actions/genesis';

export async function GET(request: NextRequest) {
  const market = request.nextUrl.searchParams.get('market');
  const category = request.nextUrl.searchParams.get('category');
  if (!market || !category) {
    return NextResponse.json({ success: false, error: 'Missing market or category' }, { status: 400 });
  }
  const result = await getAutoTemplatePartnerPreview(market, category);
  return NextResponse.json(result);
}
