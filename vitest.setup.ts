// vitest.setup.ts
// Global mocks for Next.js internals so unit tests can import lib/ files
// without a real Next.js runtime.

import { vi } from 'vitest';

// ── Mock: next/server ─────────────────────────────────────────────────────
// validate() in lib/validation/index.ts calls NextResponse.json() on failure.
// We mock it to return a plain object so tests can inspect the result.
vi.mock('next/server', () => ({
  NextResponse: {
    json: (data: unknown, init?: { status?: number }) => ({
      __nextResponseMock: true,
      data,
      status: init?.status ?? 200,
    }),
  },
}));

// ── Mock: server-only ─────────────────────────────────────────────────────
// Some lib/ files import 'server-only' as a guard — noop in tests.
vi.mock('server-only', () => ({}));
