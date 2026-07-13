// lib/analytics/analytics-annotations.ts
//
// Datierte Marker für /dashboard/analytics/tools (Spec 0.5.3, bindend):
// vertikale ReferenceLines in den tool_v1-Zeitreihen, damit ein Betrachter
// UX-verändernde Merges sofort in den Metriken verorten kann. JEDER
// UX-verändernde Merge (2.2, 2.4, 3.2, 3.3, 5.2, 5.3a–d) MUSS seine
// Annotation hier im selben PR ergänzen.
//
// Status ab PR 1.3 (dieser Nachtrag): beide zum Zeitpunkt von PR 1.4 noch
// fehlenden initialen Einträge sind jetzt nachgetragen, weil sowohl PR 1.2
// (Session-Key-Konsolidierung) als auch PR 1.3 (Baseline-Start) gemerged
// sind. Der Import aus tool-events.ts war bei PR 1.4 noch verboten (hätte
// einen kaputten Import auf ein damals nicht-existentes Symbol erzeugt) —
// dieser Vorbehalt gilt nicht mehr, TOOL_BASELINE_START existiert jetzt.

import { TOOL_BASELINE_START } from '@/lib/analytics/tool-events';

export interface AnalyticsAnnotation {
  /** ISO calendar date, 'YYYY-MM-DD'. */
  date: string;
  label: string;
}

export const ANALYTICS_ANNOTATIONS: AnalyticsAnnotation[] = [
  // Label MUST stay exactly 'Baseline start (tool_v1)' — getBaselineWindow()
  // below finds day 0 of the baseline window by this exact string match.
  { date: TOOL_BASELINE_START, label: 'Baseline start (tool_v1)' },
  // PR 1.2 merge date (feat/fdl-1-2-tool-tracking-client, PR #88) — same-
  // session joins across the sfp_session_id/sfp_sid consolidation break at
  // this date (PR 1.2's acceptance criteria).
  { date: '2026-07-12', label: 'Session-key consolidation' },
];

/**
 * Length of the baseline window in days (Spec 0.5.1: "7-14 Tage"). Used to
 * render the baseline window as a hatched region once a start date is
 * known. We pick the upper bound (14) so the shaded region never UNDER-
 * represents how long the baseline is binding for.
 */
export const BASELINE_WINDOW_DAYS = 14;

/**
 * Convention: the annotation whose label is exactly 'Baseline start
 * (tool_v1)' marks day 0 of the baseline window. Returns null until that
 * entry exists (i.e. until PR 1.3 is merged and its date is appended above)
 * — callers must render "no baseline window yet" rather than crash.
 */
export function getBaselineWindow(
  annotations: AnalyticsAnnotation[] = ANALYTICS_ANNOTATIONS,
): { start: string; end: string } | null {
  const marker = annotations.find((a) => a.label === 'Baseline start (tool_v1)');
  if (!marker) return null;
  const start = new Date(marker.date);
  if (Number.isNaN(start.getTime())) return null;
  const end = new Date(start);
  end.setDate(end.getDate() + BASELINE_WINDOW_DAYS);
  return { start: marker.date, end: end.toISOString().slice(0, 10) };
}
