// lib/analytics/analytics-annotations.ts
//
// Datierte Marker für /dashboard/analytics/tools (Spec 0.5.3, bindend):
// vertikale ReferenceLines in den tool_v1-Zeitreihen, damit ein Betrachter
// UX-verändernde Merges sofort in den Metriken verorten kann. JEDER
// UX-verändernde Merge (2.2, 2.4, 3.2, 3.3, 5.2, 5.3a–d) MUSS seine
// Annotation hier im selben PR ergänzen.
//
// Status bei PR 1.4 (dieser PR): ABSICHTLICH LEER.
// Die beiden erwarteten initialen Einträge existieren zum Zeitpunkt dieses
// PRs noch nicht:
//   1. Baseline-Start — kommt aus TOOL_BASELINE_START in
//      lib/analytics/tool-events.ts, gesetzt beim Merge von PR 1.3. PR 1.3
//      läuft PARALLEL zu diesem PR (Welle 3) und ist noch nicht gemerged —
//      TOOL_BASELINE_START existiert im Code noch nicht. Datum wird beim
//      1.3-Merge gesetzt.
//   2. Session-Key-Konsolidierung — Merge-Datum von PR 1.2 (ebenfalls
//      parallel, noch nicht gemerged).
//
// Diese Datei bewusst NICHT von tool-events.ts importieren, solange
// TOOL_BASELINE_START dort nicht existiert (würde einen kaputten Import
// erzeugen). Struktur ist bereit; Fable trägt die beiden Einträge nach,
// sobald 1.2 + 1.3 gemerged sind:
//
//   { date: '<1.3-merge-date, ISO YYYY-MM-DD>', label: 'Baseline start (tool_v1)' }
//   { date: '<1.2-merge-date, ISO YYYY-MM-DD>', label: 'Session-key consolidation' }
//
// The dashboard tab (components/dashboard/tool-analytics.tsx) must render
// correctly with this array EMPTY — that is the real, current state.

export interface AnalyticsAnnotation {
  /** ISO calendar date, 'YYYY-MM-DD'. */
  date: string;
  label: string;
}

export const ANALYTICS_ANNOTATIONS: AnalyticsAnnotation[] = [];

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
