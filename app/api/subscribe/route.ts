// app/api/subscribe/route.ts
// API proxy for newsletter subscription — keeps 'use server' actions
// out of the client bundle (prevents Turbopack/Webpack hydration crash).

import { NextRequest, NextResponse } from 'next/server';
import { subscribeWithEmail } from '@/lib/actions/newsletter';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, leadMagnet, source } = body as {
      email?: string;
      leadMagnet?: string;
      source?: string;
    };

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 },
      );
    }

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
