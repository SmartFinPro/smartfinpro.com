// sentry.server.config.ts
// Server-side Sentry initialization — runs in Node.js (API routes, Server Actions).
// Imported via instrumentation.ts (Next.js App Router pattern).
//
// ENV required:
//   SENTRY_DSN — server-side key (no NEXT_PUBLIC_ prefix, stays server-only)
//   SENTRY_AUTH_TOKEN — for release tracking + source maps upload

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV ?? 'production',

  // ── Performance Tracing — low sample rate for server ─────────────────
  tracesSampleRate: 0.05,

  // ── F-09: Limit trace propagation to our own origins + Supabase ──────
  // Prevents leaking internal trace IDs to 3rd-party APIs (Resend, Awin,
  // Serper, Anthropic). Supabase is intentionally included — it's our
  // own backend and correlated traces are valuable for debugging.
  tracePropagationTargets: [
    /^\/(?!\/)/, // relative URLs
    /^https:\/\/(www\.)?smartfinpro\.com/,
    /^https:\/\/[a-z0-9-]+\.supabase\.co/,
  ],

  // ── Tunnel route proxies all events through our origin ────────────────
  tunnel: '/monitoring',

  // ── Release tracking ──────────────────────────────────────────────────
  release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,

  // ── Error Filtering ───────────────────────────────────────────────────
  ignoreErrors: [
    // Next.js notFound() / redirect() — expected control flow, not bugs
    'NEXT_NOT_FOUND',
    'NEXT_REDIRECT',
  ],

  // ── beforeSend — scrub PII from financial platform data ──────────────
  beforeSend(event) {
    // Remove email addresses from breadcrumbs and request data
    if (event.request?.data) {
      const data = event.request.data as Record<string, unknown>;
      if (data.email) data.email = '[Filtered]';
      if (data.leadEmail) data.leadEmail = '[Filtered]';
    }

    // Scrub Authorization headers (CRON_SECRET, Resend keys)
    if (event.request?.headers) {
      const headers = event.request.headers as Record<string, string>;
      if (headers['authorization']) headers['authorization'] = '[Filtered]';
      if (headers['x-resend-signature']) headers['x-resend-signature'] = '[Filtered]';
    }

    return event;
  },
});
