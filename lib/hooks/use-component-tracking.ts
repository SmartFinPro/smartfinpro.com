'use client';

import { useCallback, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

// ============================================================
// Component Interaction Tracking
// Tracks calculator interactions, CTA clicks, and form engagement
// ============================================================

interface TrackingEvent {
  type: 'calculator_interaction' | 'cta_click' | 'newsletter_signup' | 'component_view';
  component: string;
  action: string;
  value?: number | string;
  label?: string;
  properties?: Record<string, unknown>;
}

/**
 * Hook for tracking component-level interactions
 * Used for ROI calculators, CTAs, newsletter forms, etc.
 */
export function useComponentTracking(componentName: string) {
  const pathname = usePathname();
  const viewTracked = useRef(false);

  // Track component interaction
  const trackInteraction = useCallback(
    async (action: string, value?: number | string, properties?: Record<string, unknown>) => {
      if (typeof window === 'undefined') return;

      const sessionId = sessionStorage.getItem('sfp_session_id');
      if (!sessionId) return;

      const event: TrackingEvent = {
        type: 'calculator_interaction',
        component: componentName,
        action,
        value,
        properties: {
          ...properties,
          pagePath: pathname,
          timestamp: new Date().toISOString(),
        },
      };

      try {
        await fetch('/api/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'event',
            sessionId,
            data: {
              eventName: `${componentName}_${action}`,
              eventCategory: 'component_interaction',
              eventAction: action,
              eventValue: typeof value === 'number' ? value : undefined,
              eventLabel: typeof value === 'string' ? value : componentName,
              pagePath: pathname,
              properties: event.properties,
            },
          }),
        });

        // Also send to Google Analytics if available
        if ((window as unknown as { gtag?: (command: string, event: string, params: Record<string, unknown>) => void }).gtag) {
          (window as unknown as { gtag: (command: string, event: string, params: Record<string, unknown>) => void }).gtag('event', `${componentName}_${action}`, {
            event_category: 'Component Interaction',
            event_action: action,
            event_value: value,
            component_name: componentName,
          });
        }
      } catch (error) {
        console.error('Component tracking error:', error);
      }
    },
    [componentName, pathname]
  );

  // Track CTA clicks
  const trackCTAClick = useCallback(
    (ctaId: string, destination?: string) => {
      trackInteraction('cta_click', ctaId, { destination });
    },
    [trackInteraction]
  );

  // Track calculator value changes
  const trackCalculatorChange = useCallback(
    (field: string, value: number) => {
      trackInteraction('calculator_change', value, { field });
    },
    [trackInteraction]
  );

  // Track component view (for visibility tracking)
  const trackComponentView = useCallback(() => {
    if (!viewTracked.current) {
      viewTracked.current = true;
      trackInteraction('view');
    }
  }, [trackInteraction]);

  // Track form submission
  const trackFormSubmit = useCallback(
    (formId: string, success: boolean) => {
      trackInteraction('form_submit', formId, { success });
    },
    [trackInteraction]
  );

  return {
    trackInteraction,
    trackCTAClick,
    trackCalculatorChange,
    trackComponentView,
    trackFormSubmit,
  };
}

/**
 * Hook for tracking element visibility using Intersection Observer
 */
export function useVisibilityTracking(
  componentName: string,
  threshold = 0.5
) {
  const { trackComponentView } = useComponentTracking(componentName);
  const ref = useRef<HTMLDivElement>(null);
  const hasTracked = useRef(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || hasTracked.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasTracked.current) {
            hasTracked.current = true;
            trackComponentView();
            observer.disconnect();
          }
        });
      },
      { threshold }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [trackComponentView, threshold]);

  return ref;
}

/**
 * Hook specifically for tracking CTA performance
 */
export function useCTATracking(ctaName: string) {
  const { trackInteraction } = useComponentTracking(`cta_${ctaName}`);
  const impressionTracked = useRef(false);

  const trackImpression = useCallback(() => {
    if (!impressionTracked.current) {
      impressionTracked.current = true;
      trackInteraction('impression');
    }
  }, [trackInteraction]);

  const trackClick = useCallback(
    (destination: string) => {
      trackInteraction('click', destination);
    },
    [trackInteraction]
  );

  const trackHover = useCallback(() => {
    trackInteraction('hover');
  }, [trackInteraction]);

  return {
    trackImpression,
    trackClick,
    trackHover,
  };
}

/**
 * Hook for tracking calculator engagement metrics
 */
export function useCalculatorTracking(calculatorName: string) {
  const { trackInteraction } = useComponentTracking(`calculator_${calculatorName}`);
  const startTime = useRef<number>(0);
  const interactionCount = useRef(0);

  // Track calculator open
  const trackOpen = useCallback(() => {
    startTime.current = Date.now();
    trackInteraction('open');
  }, [trackInteraction]);

  // Track slider/input changes
  const trackSliderChange = useCallback(
    (field: string, value: number) => {
      interactionCount.current++;
      trackInteraction('slider_change', value, {
        field,
        interactionCount: interactionCount.current,
      });
    },
    [trackInteraction]
  );

  // Track result viewed
  const trackResultView = useCallback(
    (result: Record<string, number>) => {
      const timeSpent = startTime.current ? Date.now() - startTime.current : 0;
      trackInteraction('result_view', undefined, {
        ...result,
        timeSpentMs: timeSpent,
        totalInteractions: interactionCount.current,
      });
    },
    [trackInteraction]
  );

  // Track CTA click from calculator
  const trackCTAClick = useCallback(
    (ctaLabel: string) => {
      trackInteraction('cta_click', ctaLabel, {
        timeSpentMs: startTime.current ? Date.now() - startTime.current : 0,
        totalInteractions: interactionCount.current,
      });
    },
    [trackInteraction]
  );

  return {
    trackOpen,
    trackSliderChange,
    trackResultView,
    trackCTAClick,
  };
}

/**
 * Hook for tracking newsletter signup conversions
 */
export function useNewsletterTracking(formLocation: string) {
  const { trackInteraction } = useComponentTracking(`newsletter_${formLocation}`);

  const trackFormView = useCallback(() => {
    trackInteraction('form_view');
  }, [trackInteraction]);

  const trackFocus = useCallback(() => {
    trackInteraction('email_focus');
  }, [trackInteraction]);

  const trackSubmit = useCallback(
    (success: boolean, errorMessage?: string) => {
      trackInteraction('submit', success ? 'success' : 'error', {
        success,
        errorMessage,
      });
    },
    [trackInteraction]
  );

  return {
    trackFormView,
    trackFocus,
    trackSubmit,
  };
}
