// instrumentation.ts
// Next.js App Router instrumentation hook — runs once per server startup.
// Used to initialize Sentry on the server side (Node.js + Edge runtimes).
// Docs: https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

// Note: onRequestError hook from @sentry/nextjs is available in Sentry SDK v9+.
// With SDK v10.42.x, errors from Server Actions and Route Handlers are captured
// automatically via the Sentry Next.js plugin without a manual hook.
