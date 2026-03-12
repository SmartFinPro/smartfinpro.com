import { NextRequest, NextResponse } from 'next/server';
import { getCtaHeatmapData } from '@/lib/actions/cta-analytics';
import type { Market } from '@/lib/supabase/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = (searchParams.get('timeRange') || '7d') as '24h' | '7d' | '30d';
    const market = searchParams.get('market') as Market | null;

    const result = await getCtaHeatmapData(
      timeRange,
      market || undefined
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('[API] cta-heatmap error:', error);
    return NextResponse.json(
      { success: false, data: null, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
