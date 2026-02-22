/**
 * Date Helpers — Shared utility functions for date calculations
 */

/**
 * Get the first Monday of the current month as ISO date string.
 * Used for dynamic "Last Fact-Checked" dates in ExpertVerifier.
 */
export function getFirstMondayOfMonth(): string {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const dayOfWeek = firstDay.getDay(); // 0=Sun, 1=Mon, ...6=Sat
  const daysUntilMonday = dayOfWeek <= 1 ? (1 - dayOfWeek) : (8 - dayOfWeek);
  const firstMonday = new Date(now.getFullYear(), now.getMonth(), 1 + daysUntilMonday);
  // Use local date parts to avoid UTC timezone shift
  const y = firstMonday.getFullYear();
  const m = String(firstMonday.getMonth() + 1).padStart(2, '0');
  const d = String(firstMonday.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
