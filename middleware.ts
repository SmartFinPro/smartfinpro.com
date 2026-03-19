// middleware.ts — Next.js Edge Middleware Entry Point
// ============================================================
// This file is the required Next.js middleware entry point.
// The actual logic (dashboard auth, geo routing, market routing)
// lives in proxy.ts to keep this file thin and testable.
//
// Why a separate file?
//   Next.js requires the middleware to be in a file named
//   "middleware.ts" at the project root, exporting a function
//   named "middleware". The proxy.ts file exports "proxy" for
//   clarity, so we re-export it here with the correct name.
// ============================================================

export { proxy as middleware, config } from './proxy';
