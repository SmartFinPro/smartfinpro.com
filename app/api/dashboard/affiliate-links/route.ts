import { NextRequest, NextResponse } from 'next/server';
import {
  getAffiliateLinks,
  toggleAffiliateLinkStatus,
  deleteAffiliateLink,
} from '@/lib/actions/affiliate-links';

export async function GET() {
  try {
    const result = await getAffiliateLinks();
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    return NextResponse.json({ data: result.data });
  } catch (error) {
    console.error('[API] affiliate-links GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'toggleStatus': {
        const { id, active } = body;
        if (!id || typeof active !== 'boolean') {
          return NextResponse.json(
            { error: 'id and active (boolean) are required' },
            { status: 400 }
          );
        }
        const result = await toggleAffiliateLinkStatus(id, active);
        if (result.error) {
          return NextResponse.json({ error: result.error }, { status: 500 });
        }
        return NextResponse.json({ data: result.data });
      }

      case 'delete': {
        const { id } = body;
        if (!id) {
          return NextResponse.json(
            { error: 'id is required' },
            { status: 400 }
          );
        }
        const result = await deleteAffiliateLink(id);
        if (result.error) {
          return NextResponse.json({ error: result.error }, { status: 500 });
        }
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[API] affiliate-links POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
