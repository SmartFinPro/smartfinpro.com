import { NextRequest, NextResponse } from 'next/server';
import { getGenesisRunProgress } from '@/lib/actions/genesis';

export async function GET(request: NextRequest) {
  const runId = request.nextUrl.searchParams.get('runId');
  if (!runId) {
    return NextResponse.json(null, { status: 400 });
  }
  const result = await getGenesisRunProgress(runId);
  return NextResponse.json(result);
}
