// app/api/page-cta-partners/route.ts — API route for client-side CTA partner mutations
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logging';
import {
  setCtaPartnersForPage,
  getCtaPartnersForPage,
} from '@/lib/actions/page-cta-partners';
import type { PartnerAssignmentConfig } from '@/lib/types/page-cta';

// POST — Set all partners for a page
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { pageUrl, partners } = body as {
      pageUrl: string;
      partners?: PartnerAssignmentConfig[];
    };

    // Backward compat: old format { partnerIds: string[] } → new format
    if (!partners && Array.isArray(body.partnerIds)) {
      partners = (body.partnerIds as string[]).map((id: string) => ({
        id,
        placements: [1, 2, 3] as PartnerAssignmentConfig['placements'],
        display_type: 'single' as const,
      }));
    }

    if (!pageUrl || !Array.isArray(partners)) {
      return NextResponse.json(
        { error: 'pageUrl (string) and partners (PartnerAssignmentConfig[]) required' },
        { status: 400 }
      );
    }

    // Validate each partner config
    for (const p of partners) {
      if (!p.id || !Array.isArray(p.placements) || !p.display_type) {
        return NextResponse.json(
          { error: 'Each partner must have id, placements[], and display_type' },
          { status: 400 }
        );
      }
    }

    const result = await setCtaPartnersForPage(pageUrl, partners);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // Return updated assignments
    const updated = await getCtaPartnersForPage(pageUrl);
    return NextResponse.json({ partners: updated });
  } catch (err) {
    logger.error('[api/page-cta-partners] POST error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
