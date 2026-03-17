import { NextRequest, NextResponse } from 'next/server';
import { getRunDetail } from '@/lib/actions/genesis';

export async function GET(request: NextRequest) {
  const runId = request.nextUrl.searchParams.get('runId');
  if (!runId) {
    return NextResponse.json({ success: false, error: 'Missing runId' }, { status: 400 });
  }
  const result = await getRunDetail(runId);
  return NextResponse.json(result);
}
