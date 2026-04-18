// sentry.edge.config.ts
// Edge Runtime Sentry initialization (middleware, edge API routes).
// Minimal config — edge runtime has no Node.js APIs.

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV ?? 'production',
  tracesSampleRate: 0.02,
  tunnel: '/monitoring',
  // F-09: Limit trace header propagation to our own origin.
  tracePropagationTargets: [
    /^\/(?!\/)/,
    /^https:\/\/(www\.)?smartfinpro\.com/,
  ],
});
