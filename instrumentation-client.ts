// instrumentation-client.ts
// Client-side Sentry initialization — runs in the browser.
// Loaded automatically by Next.js via the instrumentation-client convention.
//
// ENV required:
//   NEXT_PUBLIC_SENTRY_DSN — from Sentry project settings → Client Keys
//
// Sentry's SDK (@sentry/nextjs + its BrowserTracing instrumentation) is the
// single largest JS chunk on the homepage (~475KB uncompressed). Importing
// and initializing it synchronously on every page load was a major
// contributor to mobile Total Blocking Time (a PageSpeed audit measured
// 1,640ms TBT with this as the biggest chunk). Deferred here to browser idle
// time via a dynamic import — error monitoring still starts within a few
// seconds on any real device, but no longer competes with the critical
// rendering path. Trade-off: an error or router transition in the first
// idle window (before Sentry finishes loading) won't be captured — accepted
// as worth it given how rarely a crash happens in that window.

import type * as SentryNextjs from '@sentry/nextjs';

let sentryModule: typeof SentryNextjs | null = null;

function initSentry() {
  import('@sentry/nextjs').then((Sentry) => {
    sentryModule = Sentry;

    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NODE_ENV ?? 'production',

      // ── Performance Tracing ──────────────────────────────────────────────
      // 5% of sessions traced — enough for P75/P95 without cost explosion
      tracesSampleRate: 0.05,

      // ── F-09: Limit trace propagation to our own origins ─────────────────
      // Without this, Sentry adds sentry-trace + baggage headers to EVERY
      // outbound fetch — including 3rd-party endpoints (Resend, Awin, Plausible),
      // leaking internal trace IDs and potentially sensitive request metadata.
      // Only attach trace headers to SmartFinPro itself (same-origin API calls).
      tracePropagationTargets: [
        'localhost',
        /^\/(?!\/)/, // any relative URL starting with /
        /^https:\/\/(www\.)?smartfinpro\.com/,
      ],

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
  });
}

// Without a DSN the SDK initializes as a no-op client — but the browser
// still downloads the entire ~584KB (179KB gzip) Sentry chunk first, which
// PageSpeed flags as the single largest "unused JavaScript" item on every
// page. NEXT_PUBLIC_* vars are inlined at build time, so when the DSN isn't
// configured in the CI build env this whole branch compiles to `false` and
// the chunk is never fetched. Configuring the DSN re-enables loading with
// no further code change.
if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_SENTRY_DSN) {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(initSentry, { timeout: 4000 });
  } else {
    // Safari has no requestIdleCallback — short timeout still gets this
    // off the critical path without meaningfully delaying error capture.
    setTimeout(initSentry, 200);
  }
}

// ── Navigation tracing — required for Next.js 16 router transitions ──
// No-ops until the deferred Sentry load above has finished.
export function onRouterTransitionStart(href: string, navigationType: string) {
  sentryModule?.captureRouterTransitionStart(href, navigationType);
}
