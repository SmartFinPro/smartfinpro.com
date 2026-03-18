// middleware.ts — Next.js Edge Middleware entry point
// Must be named exactly "middleware.ts" — Next.js does not recognise "proxy.ts".
// All logic lives in proxy.ts; re-exported here to keep a single source of truth.

export { proxy as middleware, config } from './proxy';
