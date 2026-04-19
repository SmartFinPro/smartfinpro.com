import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logging';
import { createServiceClient } from '@/lib/supabase/server';
import crypto from 'crypto';
import { validate, TrackCtaSchema } from '@/lib/validation';
import { trackLimiter } from '@/lib/security/rate-limit';
import { getClientIp } from '@/lib/security/client-ip';

// ============================================================
// CTA Click Tracking API Route
// Client-safe endpoint that replaces the direct server action
// import in MDX components (fixes Turbopack module resolution).
// ============================================================

export async function POST(request: NextRequest) {
  // Rate limit: 120 req/min per IP — generous enough for rapid user interaction
  // but blocks abusive click-flood / pixel-firing attempts.
  const ip = getClientIp(request);
  if (!trackLimiter.check(ip)) {
    return NextResponse.json(
      { success: false, message: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': '60' } },
    );
  }

  try {
    // Bail out early if Supabase is not configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
      return NextResponse.json({ success: true, skipped: true });
    }

    const raw = await request.json();
    const parsed = validate(TrackCtaSchema, raw);
    if (!parsed.ok) return parsed.error;
    const body = parsed.data;

    if (!body.slug || !body.provider) {
      return NextResponse.json(
        { error: 'Missing required fields: slug, provider' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Extract device info from user-agent
    const userAgent = request.headers.get('user-agent') || '';
    const deviceType = getDeviceType(userAgent);

    // Privacy-safe IP hash (GDPR-compliant, truncated SHA-256)
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ip = forwardedFor?.split(',')[0] || realIp || 'unknown';
    const ipHash = crypto.createHash('sha256').update(ip).digest('hex').slice(0, 16);

    const { error } = await supabase.from('cta_analytics').insert({
      slug: body.slug,
      provider: body.provider,
      variant: body.variant || 'primary',
      market: body.market || 'us',
      session_id: body.sessionId || null,
      device_type: deviceType,
      ip_hash: ipHash,
    });

    if (error) {
      // Log but never fail — analytics must not affect UX
      if (process.env.NODE_ENV === 'development') {
        logger.warn('[CTA Track] Insert error:', error.message);
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    // Analytics should never return errors to the client
    return NextResponse.json({ success: true, skipped: true });
  }
}

// ============================================================
// Helper
// ============================================================

function getDeviceType(ua: string): 'desktop' | 'mobile' | 'tablet' | 'unknown' {
  if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
  if (/mobile|iphone|ipod|android.*mobile|blackberry|opera mini|iemobile/i.test(ua))
    return 'mobile';
  if (/windows|macintosh|linux/i.test(ua)) return 'desktop';
  return 'unknown';
}
