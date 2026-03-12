// app/api/dashboard/create-link/route.ts
// Proxy: client component → createAffiliateLink server action
// Fixes: 'use client' cannot import from '@/lib/actions/affiliate-links'

import { NextRequest, NextResponse } from 'next/server';
import { createAffiliateLink } from '@/lib/actions/affiliate-links';

export async function POST(request: NextRequest) {
  try {
    const linkData = await request.json();

    if (!linkData.partner_name || !linkData.slug || !linkData.destination_url) {
      return NextResponse.json(
        { error: 'Missing required fields: partner_name, slug, destination_url' },
        { status: 400 },
      );
    }

    const result = await createAffiliateLink(linkData);

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
