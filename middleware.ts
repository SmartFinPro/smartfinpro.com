// middleware.ts
// Next.js REQUIRES this exact filename at the project root.
// The actual middleware logic lives in proxy.ts — we re-export it here.
// NEVER rename or delete this file — it IS the middleware entry point.

export { proxy as middleware, config } from './proxy';
