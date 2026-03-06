import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import crypto from 'crypto';
import { validate, TrackSchema } from '@/lib/validation';

// Rate limiting: simple in-memory store (use Redis in production)
const rateLimitMap = new Map<string, { count: number; timestamp: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 100; // max requests per window

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now - record.timestamp > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { count: 1, timestamp: now });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return false;
  }

  record.count++;
  return true;
}

// ============================================================
// Track Endpoint - Client-side Analytics
// ============================================================

interface TrackPayload {
  type: 'pageview' | 'event' | 'scroll' | 'time_on_page';
  sessionId: string;
  data: Record<string, unknown>;
}

export async function POST(request: NextRequest) {
  try {
    // Bail out early if Supabase is not configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
      return NextResponse.json({ success: true, skipped: true });
    }

    // Get client IP
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ip = forwardedFor?.split(',')[0] || realIp || 'unknown';

    // Rate limiting
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const raw = await request.json();
    const parsed = validate(TrackSchema, raw);
    if (!parsed.ok) return parsed.error;
    const body = parsed.data;

    const supabase = createServiceClient();
    const userAgent = request.headers.get('user-agent') || '';
    const ipHash = crypto.createHash('sha256').update(ip).digest('hex').slice(0, 16);

    // Get geo data from Vercel headers
    const countryCode = request.headers.get('x-vercel-ip-country') || 'XX';
    const region = request.headers.get('x-vercel-ip-country-region') || null;
    const city = request.headers.get('x-vercel-ip-city') || null;

    // Parse device info
    const deviceInfo = parseUserAgent(userAgent);

    switch (body.type) {
      case 'pageview': {
        const { error } = await supabase.from('page_views').insert({
          session_id: body.sessionId,
          page_path: (body.data.pagePath as string) || '/',
          page_title: (body.data.pageTitle as string) || null,
          market: (body.data.market as string) || null,
          category: (body.data.category as string) || null,
          article_slug: (body.data.articleSlug as string) || null,
          referrer: (body.data.referrer as string) || null,
          referrer_domain: extractDomain(body.data.referrer as string),
          utm_source: (body.data.utmSource as string) || null,
          utm_medium: (body.data.utmMedium as string) || null,
          utm_campaign: (body.data.utmCampaign as string) || null,
          device_type: deviceInfo.deviceType,
          browser: deviceInfo.browser,
          os: deviceInfo.os,
          screen_width: (body.data.screenWidth as number) || null,
          screen_height: (body.data.screenHeight as number) || null,
          country_code: countryCode,
          region: region,
          city: city,
          user_agent: userAgent,
          ip_hash: ipHash,
        });

        if (error) {
          // Log but never fail — analytics must not affect UX
          if (process.env.NODE_ENV === 'development') console.warn('Analytics: pageview insert failed');
        }

        return NextResponse.json({ success: true });
      }

      case 'event': {
        const { error } = await supabase.from('analytics_events').insert({
          session_id: body.sessionId,
          event_name: (body.data.eventName as string) || 'unknown',
          event_category: (body.data.eventCategory as string) || null,
          event_action: (body.data.eventAction as string) || null,
          event_label: (body.data.eventLabel as string) || null,
          event_value: (body.data.eventValue as number) || null,
          page_path: (body.data.pagePath as string) || null,
          element_id: (body.data.elementId as string) || null,
          element_class: (body.data.elementClass as string) || null,
          element_text: (body.data.elementText as string) || null,
          properties: (body.data.properties as Record<string, unknown>) || {},
          device_type: deviceInfo.deviceType,
          country_code: countryCode,
        });

        if (error) {
          if (process.env.NODE_ENV === 'development') console.warn('Analytics: event insert failed');
        }

        return NextResponse.json({ success: true });
      }

      case 'scroll':
      case 'time_on_page': {
        // Supabase JS does NOT support .order().limit() on .update() — use SELECT first, then UPDATE by id
        const { data: existing } = await supabase
          .from('page_views')
          .select('id')
          .eq('session_id', body.sessionId)
          .eq('page_path', body.data.pagePath as string)
          .order('viewed_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (existing?.id) {
          const updatePayload: Record<string, unknown> = {};
          if (body.type === 'time_on_page') updatePayload.time_on_page = body.data.timeOnPage;
          if (body.type === 'scroll') updatePayload.scroll_depth = body.data.scrollDepth;

          const { error } = await supabase
            .from('page_views')
            .update(updatePayload)
            .eq('id', existing.id);

          if (error) {
            if (process.env.NODE_ENV === 'development') console.warn('Analytics: page view update failed');
          }
        }

        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: 'Unknown track type' }, { status: 400 });
    }
  } catch (error) {
    // Analytics should never return errors to the client
    return NextResponse.json({ success: true, skipped: true });
  }
}

// ============================================================
// Helper Functions
// ============================================================

interface DeviceInfo {
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  browser: string;
  os: string;
}

function parseUserAgent(ua: string): DeviceInfo {
  return {
    deviceType: getDeviceType(ua),
    browser: getBrowser(ua),
    os: getOS(ua),
  };
}

function getDeviceType(ua: string): DeviceInfo['deviceType'] {
  if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
  if (/mobile|iphone|ipod|android.*mobile|blackberry|opera mini|iemobile/i.test(ua))
    return 'mobile';
  if (/windows|macintosh|linux/i.test(ua)) return 'desktop';
  return 'unknown';
}

function getBrowser(ua: string): string {
  if (/edg/i.test(ua)) return 'Edge';
  if (/chrome/i.test(ua)) return 'Chrome';
  if (/safari/i.test(ua) && !/chrome/i.test(ua)) return 'Safari';
  if (/firefox/i.test(ua)) return 'Firefox';
  if (/opera|opr/i.test(ua)) return 'Opera';
  if (/msie|trident/i.test(ua)) return 'IE';
  return 'Other';
}

function getOS(ua: string): string {
  if (/windows/i.test(ua)) return 'Windows';
  if (/macintosh|mac os/i.test(ua)) return 'macOS';
  if (/linux/i.test(ua) && !/android/i.test(ua)) return 'Linux';
  if (/android/i.test(ua)) return 'Android';
  if (/iphone|ipad|ipod/i.test(ua)) return 'iOS';
  return 'Other';
}

function extractDomain(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}
