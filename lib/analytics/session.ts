// lib/analytics/session.ts
// Single source of truth for the first-party analytics session id.
// Used by lib/hooks/use-analytics.ts (pageviews) and
// lib/analytics/cockpit-tracking.ts (cockpit events) — do NOT reimplement
// the sfp_session_id logic anywhere else.

export const SESSION_STORAGE_KEY = 'sfp_session_id';

/**
 * Returns the per-tab analytics session id, creating it on first call.
 * SSR / blocked storage → null (callers no-op, tracking stays fail-soft).
 */
export function getOrCreateAnalyticsSessionId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    let sessionId = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId);
    }
    return sessionId;
  } catch {
    return null;
  }
}
