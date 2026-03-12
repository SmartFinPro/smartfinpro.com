// app/api/pre-qual/route.ts
// P3: Pre-Qual Quiz — Records segment data + generates redirect URL
//
// POST: { slug, market, category, answers, skipped, pageUrl }
// Returns: { redirectUrl, clickId }

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logging';
import { randomUUID } from 'crypto';

interface PreQualPayload {
  slug: string;
  market: string;
  category: string;
  answers: Record<string, string>;
  skipped: boolean;
  pageUrl?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as PreQualPayload;

    // Validate required fields
    if (!body.slug || !body.market || !body.category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const clickId = randomUUID().slice(0, 36);
    const supabase = createServiceClient();

    // Detect device type from user-agent
    const ua = request.headers.get('user-agent') || '';
    let deviceType = 'desktop';
    if (/mobile|android|iphone/i.test(ua)) deviceType = 'mobile';
    else if (/tablet|ipad/i.test(ua)) deviceType = 'tablet';

    // Look up affiliate link for link_id
    let linkId: string | null = null;
    const { data: link } = await supabase
      .from('affiliate_links')
      .select('id')
      .eq('slug', body.slug)
      .eq('active', true)
      .limit(1)
      .maybeSingle();

    if (link) linkId = link.id;

    // Insert click_segments record
    await supabase.from('click_segments').insert({
      click_id: clickId,
      link_id: linkId,
      market: body.market.slice(0, 4),
      category: body.category.slice(0, 50),
      experience_level: body.answers?.experience || null,
      investment_amount: body.answers?.amount || null,
      priority: body.answers?.priority || null,
      device_type: deviceType,
      answers: body.answers || {},
      skipped: body.skipped ?? false,
      page_url: body.pageUrl || null,
    });

    // Also track the CTA click via the existing tracking endpoint
    try {
      await fetch(new URL('/api/track-cta', request.url).toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: body.slug.replace(/[^a-z0-9/_-]/g, '').slice(0, 200),
          provider: body.slug,
          variant: 'pre_qual',
          market: body.market,
        }),
      });
    } catch {
      // Non-critical — CTA tracking failure shouldn't block redirect
    }

    const redirectUrl = `/go/${body.slug}/`;

    return NextResponse.json({ redirectUrl, clickId });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    logger.error('[pre-qual] Error processing quiz submission', { error: msg });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
