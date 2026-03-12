import { NextRequest, NextResponse } from 'next/server';
import {
  getRealtimeRanking,
  getKeywordPositionTrend,
} from '@/lib/actions/ranking';
import type { Market } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'realtime-ranking': {
        const { keyword, market } = body as {
          action: string;
          keyword: string;
          market: Market;
        };
        if (!keyword || typeof keyword !== 'string') {
          return NextResponse.json(
            { error: 'keyword is required' },
            { status: 400 },
          );
        }
        const result = await getRealtimeRanking(keyword, market || 'us');
        return NextResponse.json(result);
      }

      case 'position-trend': {
        const { keyword, days } = body as {
          action: string;
          keyword: string;
          days?: number;
        };
        if (!keyword || typeof keyword !== 'string') {
          return NextResponse.json(
            { error: 'keyword is required' },
            { status: 400 },
          );
        }
        const data = await getKeywordPositionTrend(keyword, days || 30);
        return NextResponse.json(data);
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 },
        );
    }
  } catch (err) {
    console.error('[api/dashboard/ranking] Error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
