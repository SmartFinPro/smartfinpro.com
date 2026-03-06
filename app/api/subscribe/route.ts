// app/api/subscribe/route.ts
// API proxy for newsletter subscription — keeps 'use server' actions
// out of the client bundle (prevents Turbopack/Webpack hydration crash).

import { NextRequest, NextResponse } from 'next/server';
import { subscribeWithEmail } from '@/lib/actions/newsletter';
import { validate, SubscribeSchema } from '@/lib/validation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = validate(SubscribeSchema, body);
    if (!parsed.ok) return parsed.error;

    const { email, leadMagnet, source } = parsed.data;
    const result = await subscribeWithEmail(email, leadMagnet, source);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[api/subscribe] Error:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred.' },
      { status: 500 },
    );
  }
}
