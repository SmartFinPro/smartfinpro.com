import { NextRequest, NextResponse } from 'next/server';
import { magicFind } from '@/lib/actions/genesis';

export async function POST(request: NextRequest) {
  const { query, market, category } = await request.json();
  if (!query || !market || !category) {
    return NextResponse.json({ success: false, error: 'Missing query, market, or category' }, { status: 400 });
  }
  const result = await magicFind(query, market, category);
  return NextResponse.json(result);
}
