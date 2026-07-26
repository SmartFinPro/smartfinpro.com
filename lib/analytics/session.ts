// lib/analytics/session.ts
// Single source of truth for the first-party analytics session id.
// Used by lib/hooks/use-analytics.ts (pageviews), lib/analytics/
// cockpit-tracking.ts (cockpit events), lib/analytics/tool-tracking.ts
// (tool_v1 events) and the marketing components that fire ad-hoc /api/track
// events (tracked-affiliate-link, trust-block-tracker, comparison-hub,
// xray-score) — do NOT reimplement the sfp_session_id logic anywhere else.
// (broker-finder-quiz.tsx keeps its own duplicate until PR 3.2 — documented there.)

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
