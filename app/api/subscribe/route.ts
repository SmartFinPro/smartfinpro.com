// app/api/subscribe/route.ts
// API proxy for newsletter subscription — keeps 'use server' actions
// out of the client bundle (prevents Turbopack/Webpack hydration crash).

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logging';
import { subscribeWithEmail } from '@/lib/actions/newsletter';
import { validate, SubscribeSchema } from '@/lib/validation';
import { subscribeLimiter } from '@/lib/security/rate-limit';

export async function POST(request: NextRequest) {
  // Rate-limit: 5 subscribe attempts per IP per minute (email-bombing prevention)
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (!subscribeLimiter.check(ip)) {
    return NextResponse.json(
      { success: false, message: 'Too many requests. Please wait a moment.' },
      { status: 429, headers: { 'Retry-After': '60' } },
    );
  }

  try {
    const body = await request.json();
    const parsed = validate(SubscribeSchema, body);
    if (!parsed.ok) return parsed.error;

    const { email, leadMagnet, source } = parsed.data;
    const result = await subscribeWithEmail(email, leadMagnet, source);
    return NextResponse.json(result);
  } catch (error) {
    logger.error('[api/subscribe] Error:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred.' },
      { status: 500 },
    );
  }
}
