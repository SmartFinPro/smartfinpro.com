'use server';

import { createServiceClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';
import crypto from 'crypto';

// ============================================================
// Click Tracking
// ============================================================

interface TrackClickParams {
  linkId: string;
  sessionId: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  referrer?: string;
  landingPage?: string;
  pageSlug?: string;
  buttonId?: string;
}

export async function trackClick(params: TrackClickParams) {
  try {
    const supabase = createServiceClient();
    const headersList = await headers();

    // Get user agent and IP
    const userAgent = headersList.get('user-agent') || '';
    const forwardedFor = headersList.get('x-forwarded-for');
    const realIp = headersList.get('x-real-ip');
    const ip = forwardedFor?.split(',')[0] || realIp || 'unknown';

    // Hash IP for privacy
    const ipHash = crypto.createHash('sha256').update(ip).digest('hex').slice(0, 16);

    // Parse device info from user agent
    const deviceInfo = parseUserAgent(userAgent);

    // Parse referrer domain
    const referrerDomain = params.referrer ? new URL(params.referrer).hostname : null;

    const { data, error } = await supabase
      .from('link_clicks')
      .insert({
        link_id: params.linkId,
        session_id: params.sessionId,
        utm_source: params.utmSource,
        utm_medium: params.utmMedium,
        utm_campaign: params.utmCampaign,
        utm_content: params.utmContent,
        utm_term: params.utmTerm,
        referrer: params.referrer,
        referrer_domain: referrerDomain,
        landing_page: params.landingPage,
        page_slug: params.pageSlug,
        button_id: params.buttonId,
        user_agent: userAgent,
        ip_hash: ipHash,
        device_type: deviceInfo.deviceType,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        country_code: 'XX', // Will be updated by geolocation service
      })
      .select()
      .single();

    if (error) {
      console.error('Error tracking click:', error);
      return { success: false, error: error.message };
    }

    return { success: true, clickId: data.id };
  } catch (error) {
    console.error('Error tracking click:', error);
    return { success: false, error: 'Failed to track click' };
  }
}

// ============================================================
// Page View Tracking
// ============================================================

interface TrackPageViewParams {
  sessionId: string;
  pagePath: string;
  pageTitle?: string;
  market?: string;
  category?: string;
  articleSlug?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  screenWidth?: number;
  screenHeight?: number;
}

export async function trackPageView(params: TrackPageViewParams) {
  try {
    const supabase = createServiceClient();
    const headersList = await headers();

    const userAgent = headersList.get('user-agent') || '';
    const forwardedFor = headersList.get('x-forwarded-for');
    const realIp = headersList.get('x-real-ip');
    const ip = forwardedFor?.split(',')[0] || realIp || 'unknown';
    const ipHash = crypto.createHash('sha256').update(ip).digest('hex').slice(0, 16);

    const deviceInfo = parseUserAgent(userAgent);
    const referrerDomain = params.referrer ? extractDomain(params.referrer) : null;

    const { error } = await supabase.from('page_views').insert({
      session_id: params.sessionId,
      page_path: params.pagePath,
      page_title: params.pageTitle,
      market: params.market,
      category: params.category,
      article_slug: params.articleSlug,
      referrer: params.referrer,
      referrer_domain: referrerDomain,
      utm_source: params.utmSource,
      utm_medium: params.utmMedium,
      utm_campaign: params.utmCampaign,
      user_agent: userAgent,
      ip_hash: ipHash,
      device_type: deviceInfo.deviceType,
      browser: deviceInfo.browser,
      os: deviceInfo.os,
      screen_width: params.screenWidth,
      screen_height: params.screenHeight,
    });

    if (error) {
      console.error('Error tracking page view:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error tracking page view:', error);
    return { success: false, error: 'Failed to track page view' };
  }
}

// ============================================================
// Event Tracking
// ============================================================

interface TrackEventParams {
  sessionId: string;
  eventName: string;
  eventCategory?: string;
  eventAction?: string;
  eventLabel?: string;
  eventValue?: number;
  pagePath?: string;
  elementId?: string;
  elementClass?: string;
  elementText?: string;
  properties?: Record<string, unknown>;
}

export async function trackEvent(params: TrackEventParams) {
  try {
    const supabase = createServiceClient();
    const headersList = await headers();

    const userAgent = headersList.get('user-agent') || '';
    const deviceInfo = parseUserAgent(userAgent);

    const { error } = await supabase.from('analytics_events').insert({
      session_id: params.sessionId,
      event_name: params.eventName,
      event_category: params.eventCategory,
      event_action: params.eventAction,
      event_label: params.eventLabel,
      event_value: params.eventValue,
      page_path: params.pagePath,
      element_id: params.elementId,
      element_class: params.elementClass,
      element_text: params.elementText,
      properties: params.properties || {},
      device_type: deviceInfo.deviceType,
    });

    if (error) {
      console.error('Error tracking event:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error tracking event:', error);
    return { success: false, error: 'Failed to track event' };
  }
}

// ============================================================
// Update Page View (for time on page, scroll depth)
// ============================================================

interface UpdatePageViewParams {
  sessionId: string;
  pagePath: string;
  timeOnPage?: number;
  scrollDepth?: number;
}

export async function updatePageView(params: UpdatePageViewParams) {
  try {
    const supabase = createServiceClient();

    const { error } = await supabase
      .from('page_views')
      .update({
        time_on_page: params.timeOnPage,
        scroll_depth: params.scrollDepth,
      })
      .eq('session_id', params.sessionId)
      .eq('page_path', params.pagePath)
      .order('viewed_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error updating page view:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating page view:', error);
    return { success: false, error: 'Failed to update page view' };
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
  const deviceType = getDeviceType(ua);
  const browser = getBrowser(ua);
  const os = getOS(ua);

  return { deviceType, browser, os };
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

function extractDomain(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}
