import { NextRequest, NextResponse } from 'next/server';
import { processAndInsertImages } from '@/lib/actions/genesis';

export async function POST(request: NextRequest) {
  const { runId, imageData } = await request.json();
  if (!runId || !Array.isArray(imageData)) {
    return NextResponse.json({ success: false, error: 'Missing runId or imageData' }, { status: 400 });
  }
  const result = await processAndInsertImages(runId, imageData);
  return NextResponse.json(result);
}
