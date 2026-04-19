// app/api/page-cta-partners/route.ts — API route for client-side CTA partner mutations
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logging';
import {
  setCtaPartnersForPage,
  getCtaPartnersForPage,
} from '@/lib/actions/page-cta-partners';
import type { PartnerAssignmentConfig } from '@/lib/types/page-cta';
import { isValidDashboardSessionValue } from '@/lib/auth/dashboard-session';
import { compareSecret } from '@/lib/security/timing-safe';
import { trackLimiter } from '@/lib/security/rate-limit';
import { getClientIp } from '@/lib/security/client-ip';

/**
 * SECURITY (Welle 3c): mutation endpoint — gate with dashboard session OR
 * bearer DASHBOARD_SECRET. The route is not under /api/dashboard/* so
 * proxy.ts does not gate it automatically.
 */
function isAuthed(request: NextRequest): boolean {
  if (process.env.DASHBOARD_AUTH_DISABLED === 'true') return true;
  const dashSecret = process.env.DASHBOARD_SECRET;
  if (!dashSecret) return false;
  const cookie = request.cookies.get('sfp-dash-auth')?.value;
  const bearer = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  return isValidDashboardSessionValue(cookie, dashSecret) || compareSecret(bearer, dashSecret);
}

// POST — Set all partners for a page
export async function POST(request: NextRequest) {
  if (!isAuthed(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const ip = getClientIp(request);
  if (!trackLimiter.check(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': '60' } });
  }

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
