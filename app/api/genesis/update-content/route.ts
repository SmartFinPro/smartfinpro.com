import { NextRequest, NextResponse } from 'next/server';
import { updateGenesisContent } from '@/lib/actions/genesis';

export async function POST(request: NextRequest) {
  const { runId, fullMdx } = await request.json();
  if (!runId || typeof runId !== 'string' || typeof fullMdx !== 'string') {
    return NextResponse.json({ success: false, error: 'Missing runId or fullMdx' }, { status: 400 });
  }
  const result = await updateGenesisContent(runId, fullMdx);
  return NextResponse.json(result);
}
