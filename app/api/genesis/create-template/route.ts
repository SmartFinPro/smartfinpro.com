import { NextRequest, NextResponse } from 'next/server';
import { createReviewFromTemplate } from '@/lib/actions/genesis';

export async function POST(request: NextRequest) {
  const body = await request.json();
  if (!body.market || !body.category || !body.title || !body.bodyContent) {
    return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
  }
  const result = await createReviewFromTemplate(body);
  return NextResponse.json(result);
}
