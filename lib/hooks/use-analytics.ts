'use client';

import { useCallback, useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

// ============================================================
// Session Management
// ============================================================

function getSessionId(): string {
  if (typeof window === 'undefined') return '';

  let sessionId = sessionStorage.getItem('sfp_session_id');

  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem('sfp_session_id', sessionId);
  }

  return sessionId;
}

// ============================================================
// Analytics Hook
// ============================================================

interface UseAnalyticsOptions {
  trackPageViews?: boolean;
  trackScrollDepth?: boolean;
  trackTimeOnPage?: boolean;
}

export function useAnalytics(options: UseAnalyticsOptions = {}) {
  const { trackPageViews = true, trackScrollDepth = true, trackTimeOnPage = true } = options;

  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pageLoadTime = useRef<number>(0);
  const maxScrollDepth = useRef<number>(0);
  const hasTrackedPageview = useRef<boolean>(false);

  // Initialize pageLoadTime on mount (avoid impure function during render)
  useEffect(() => {
    if (pageLoadTime.current === 0) {
      pageLoadTime.current = Date.now();
    }
  }, []);

  // Track function
  const track = useCallback(
    async (
      type: 'pageview' | 'event' | 'scroll' | 'time_on_page',
      data: Record<string, unknown>
    ) => {
      if (typeof window === 'undefined') return;

      // Skip in development if needed
      // if (process.env.NODE_ENV === 'development') return;

      const sessionId = getSessionId();
      if (!sessionId) return;

      try {
        await fetch('/api/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type,
            sessionId,
            data: {
              ...data,
              pagePath: pathname,
            },
          }),
        });
      } catch {
        // Silently ignore analytics failures — they should never affect UX
      }
    },
    [pathname]
  );

  // Track page view
  const trackPageView = useCallback(() => {
    const utmSource = searchParams.get('utm_source');
    const utmMedium = searchParams.get('utm_medium');
    const utmCampaign = searchParams.get('utm_campaign');

    track('pageview', {
      pageTitle: document.title,
      referrer: document.referrer,
      utmSource,
      utmMedium,
      utmCampaign,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
    });
  }, [track, searchParams]);

  // Track custom event
  const trackEvent = useCallback(
    (
      eventName: string,
      options?: {
        category?: string;
        action?: string;
        label?: string;
        value?: number;
        elementId?: string;
        elementClass?: string;
        elementText?: string;
        properties?: Record<string, unknown>;
      }
    ) => {
      track('event', {
        eventName,
        eventCategory: options?.category,
        eventAction: options?.action,
        eventLabel: options?.label,
        eventValue: options?.value,
        elementId: options?.elementId,
        elementClass: options?.elementClass,
        elementText: options?.elementText,
        properties: options?.properties,
      });
    },
    [track]
  );

  // Track scroll depth
  const trackScroll = useCallback(
    (depth: number) => {
      if (depth > maxScrollDepth.current) {
        maxScrollDepth.current = depth;
        track('scroll', { scrollDepth: depth });
      }
    },
    [track]
  );

  // Track time on page
  const trackTime = useCallback(() => {
    const timeOnPage = Math.round((Date.now() - pageLoadTime.current) / 1000);
    track('time_on_page', { timeOnPage });
  }, [track]);

  // Auto-track page views on route change
  useEffect(() => {
    if (!trackPageViews) return;

    // Reset tracking state for new page
    hasTrackedPageview.current = false;
    pageLoadTime.current = Date.now();
    maxScrollDepth.current = 0;

    // Small delay to ensure page title is updated
    const timeoutId = setTimeout(() => {
      if (!hasTrackedPageview.current) {
        trackPageView();
        hasTrackedPageview.current = true;
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [pathname, trackPageViews, trackPageView]);

  // Auto-track scroll depth
  useEffect(() => {
    if (!trackScrollDepth || typeof window === 'undefined') return;

    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollTop = window.scrollY;
          const docHeight = document.documentElement.scrollHeight - window.innerHeight;
          const scrollPercent = Math.round((scrollTop / docHeight) * 100);

          // Only track at 25% intervals
          const milestone = Math.floor(scrollPercent / 25) * 25;
          if (milestone > 0 && milestone > maxScrollDepth.current) {
            trackScroll(milestone);
          }

          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [pathname, trackScrollDepth, trackScroll]);

  // Auto-track time on page (on unload)
  useEffect(() => {
    if (!trackTimeOnPage || typeof window === 'undefined') return;

    const handleUnload = () => {
      trackTime();
    };

    // Use visibilitychange as unload is unreliable on mobile
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        trackTime();
      }
    };

    window.addEventListener('beforeunload', handleUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [pathname, trackTimeOnPage, trackTime]);

  return {
    trackEvent,
    trackPageView,
    trackScroll,
    trackTime,
    sessionId: typeof window !== 'undefined' ? getSessionId() : '',
  };
}

// ============================================================
// Convenience Hooks
// ============================================================

/**
 * Track button clicks with element info
 */
export function useTrackClick() {
  const { trackEvent } = useAnalytics({ trackPageViews: false });

  return useCallback(
    (eventName: string, element?: HTMLElement | null, properties?: Record<string, unknown>) => {
      trackEvent(eventName, {
        category: 'interaction',
        action: 'click',
        elementId: element?.id,
        elementClass: element?.className,
        elementText: element?.textContent?.slice(0, 100),
        properties,
      });
    },
    [trackEvent]
  );
}

/**
 * Track affiliate link clicks
 */
export function useTrackAffiliateClick() {
  const { trackEvent } = useAnalytics({ trackPageViews: false });

  return useCallback(
    (slug: string, partnerName: string, buttonId?: string) => {
      trackEvent('affiliate_click', {
        category: 'affiliate',
        action: 'click',
        label: `${slug} - ${partnerName}`,
        properties: {
          slug,
          partnerName,
          buttonId,
        },
      });
    },
    [trackEvent]
  );
}

/**
 * Track form submissions
 */
export function useTrackFormSubmit() {
  const { trackEvent } = useAnalytics({ trackPageViews: false });

  return useCallback(
    (formName: string, success: boolean, properties?: Record<string, unknown>) => {
      trackEvent('form_submit', {
        category: 'form',
        action: success ? 'success' : 'error',
        label: formName,
        properties,
      });
    },
    [trackEvent]
  );
}
