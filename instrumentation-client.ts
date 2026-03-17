// instrumentation-client.ts
// Client-side Sentry initialization — runs in the browser.
// Loaded automatically by Next.js via the instrumentation-client convention.
//
// ENV required:
//   NEXT_PUBLIC_SENTRY_DSN — from Sentry project settings → Client Keys

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV ?? 'production',

  // ── Performance Tracing ──────────────────────────────────────────────
  // 5% of sessions traced — enough for P75/P95 without cost explosion
  tracesSampleRate: 0.05,

  // ── Session Replay — disabled for privacy (financial platform) ───────
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,

  // ── Error Filtering ──────────────────────────────────────────────────
  // Suppress noisy browser errors that we can't fix
  ignoreErrors: [
    // Benign browser quirks
    'ResizeObserver loop limit exceeded',
    'ResizeObserver loop completed with undelivered notifications',
    // Network blips (user went offline mid-request)
    'Failed to fetch',
    'Load failed',
    'NetworkError',
    'Network request failed',
    // Safari-specific
    'Non-Error promise rejection captured',
    // Ad-blockers killing analytics scripts
    /^Script error\.?$/,
    // Hydration warnings (cosmetic, not bugs)
    'Hydration failed',
  ],

  // ── Denied URLs — don't capture errors from 3rd-party scripts ────────
  denyUrls: [
    /plausible\.io/,
    /googletagmanager\.com/,
    /google-analytics\.com/,
    /extensions\//i,
    /^chrome:\/\//i,
  ],

  // ── Tunnel route — avoids ad-blocker interference ────────────────────
  // All Sentry requests proxied through our own domain via /monitoring
  tunnel: '/monitoring',

  // ── Release tracking — set during CI/CD ─────────────────────────────
  release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,

  // ── Breadcrumbs — capture navigation + console errors ───────────────
  beforeBreadcrumb(breadcrumb) {
    // Don't log console.debug breadcrumbs (too noisy)
    if (breadcrumb.category === 'console' && breadcrumb.level === 'debug') {
      return null;
    }
    return breadcrumb;
  },
});

// ── Navigation tracing — required for Next.js 16 router transitions ──
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
