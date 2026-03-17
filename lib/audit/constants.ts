// lib/audit/constants.ts
// Shared audit constants — imported by both the integration tests and the dashboard widget.
// Single source of truth for production guard-rail configuration.

/**
 * Supabase project refs (subdomains) that are BLOCKED from integration test runs.
 * Add any production or staging project ref here to prevent accidental data mutation.
 *
 * Format: the subdomain part before `.supabase.co`
 * Example: for `devkeyhniwdxsqvoscdu.supabase.co`, add `'devkeyhniwdxsqvoscdu'`.
 */
export const BLOCKED_PROJECT_REFS = [
  'devkeyhniwdxsqvoscdu', // SmartFinPro production
] as const;

/** Number of blocked refs — used by AuditStatusWidget for dynamic display. */
export const BLOCKED_REF_COUNT = BLOCKED_PROJECT_REFS.length;
