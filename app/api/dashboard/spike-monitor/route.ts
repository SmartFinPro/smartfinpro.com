import { NextRequest, NextResponse } from 'next/server';
import { toggleMarketAlert, updateCtrThreshold } from '@/lib/actions/spike-monitor';
import type { Market } from '@/lib/supabase/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'toggleMarketAlert': {
        const { market, enabled } = body;
        if (!market || typeof enabled !== 'boolean') {
          return NextResponse.json(
            { error: 'market and enabled (boolean) are required' },
            { status: 400 }
          );
        }
        const result = await toggleMarketAlert(market as Market, enabled);
        return NextResponse.json(result);
      }

      case 'updateCtrThreshold': {
        const { market, threshold } = body;
        if (!market || typeof threshold !== 'number') {
          return NextResponse.json(
            { error: 'market and threshold (number) are required' },
            { status: 400 }
          );
        }
        const result = await updateCtrThreshold(market as Market, threshold);
        return NextResponse.json(result);
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[API] spike-monitor error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
