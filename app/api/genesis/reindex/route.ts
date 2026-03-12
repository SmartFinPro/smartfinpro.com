import { NextRequest, NextResponse } from 'next/server';
import { instantIndexByRunId } from '@/lib/actions/genesis';

export async function POST(request: NextRequest) {
  const { runId } = await request.json();
  if (!runId || typeof runId !== 'string') {
    return NextResponse.json({ success: false, error: 'Missing runId' }, { status: 400 });
  }
  const result = await instantIndexByRunId(runId);
  return NextResponse.json(result);
}
