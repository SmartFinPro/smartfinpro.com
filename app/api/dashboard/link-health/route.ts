import { NextRequest, NextResponse } from 'next/server';
import { getOfferExpiryReport, runHealthChecks, bulkReplaceParam } from '@/lib/actions/link-health';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'getOfferExpiryReport': {
        const withinDays = body.withinDays ?? 14;
        const report = await getOfferExpiryReport(withinDays);
        return NextResponse.json(report);
      }

      case 'runHealthChecks': {
        const result = await runHealthChecks();
        return NextResponse.json(result);
      }

      case 'bulkReplaceParam': {
        const { paramKey, oldValue, newValue } = body;
        if (!paramKey || !oldValue || !newValue) {
          return NextResponse.json(
            { error: 'paramKey, oldValue, and newValue are required' },
            { status: 400 }
          );
        }
        const result = await bulkReplaceParam(paramKey, oldValue, newValue);
        return NextResponse.json(result);
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[API] link-health error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
