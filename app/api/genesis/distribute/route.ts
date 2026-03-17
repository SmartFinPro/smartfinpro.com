import { NextRequest, NextResponse } from 'next/server';
import { distributeAndIndex } from '@/lib/actions/genesis';

export const maxDuration = 120;

export async function POST(request: NextRequest) {
  const { runId, affiliateMappings } = await request.json();
  if (!runId) {
    return NextResponse.json({ success: false, error: 'Missing runId' }, { status: 400 });
  }
  const result = await distributeAndIndex(runId, affiliateMappings || []);
  return NextResponse.json(result);
}
