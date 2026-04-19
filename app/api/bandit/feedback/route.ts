// app/api/bandit/feedback/route.ts
// P5: Bandit Feedback API — Posterior update after conversion events
//
// POST { linkId, market, category, deviceType, isReward }

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { updatePosterior } from '@/lib/actions/bandit';
import { trackLimiter } from '@/lib/security/rate-limit';
import { getClientIp } from '@/lib/security/client-ip';

const MARKETS = ['us', 'uk', 'ca', 'au'] as const;
const CATEGORIES = [
  'ai-tools',
  'cybersecurity',
  'trading',
  'forex',
  'personal-finance',
  'business-banking',
  'credit-repair',
  'debt-relief',
  'credit-score',
] as const;
const DEVICE_TYPES = ['mobile', 'tablet', 'desktop'] as const;

const FeedbackSchema = z.object({
  linkId:     z.string().uuid('linkId must be a valid UUID'),
  market:     z.enum(MARKETS),
  category:   z.enum(CATEGORIES),
  deviceType: z.enum(DEVICE_TYPES).optional().default('desktop'),
  isReward:   z.boolean().optional().default(false),
});

export async function POST(request: NextRequest) {
  // Rate limit: posterior updates are database writes, protect against flooding
  const ip = getClientIp(request);
  if (!trackLimiter.check(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': '60' } });
  }

  try {
    const body = await request.json();
    const parsed = FeedbackSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { linkId, market, category, deviceType, isReward } = parsed.data;

    await updatePosterior(linkId, market, category, deviceType, isReward);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to update posterior' }, { status: 500 });
  }
}
