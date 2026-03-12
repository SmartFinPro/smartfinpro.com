import { NextRequest, NextResponse } from 'next/server';
import { generateLongFormAsset } from '@/lib/actions/genesis';

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const { runId, keyword, market, category, researchBrief } = await request.json();
  if (!runId || !keyword || !market || !category) {
    return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
  }
  const result = await generateLongFormAsset(runId, keyword, market, category, researchBrief || undefined);
  return NextResponse.json(result);
}
