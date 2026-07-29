// lib/research/deferred-navigation.ts
// The scheduling seam behind the fix in commit bed106f
// ("fix(research): stop losing the first filter-chip navigation") —
// components/research/ResearchHub.tsx's `pushUrl` calls this instead of
// inlining `setTimeout(() => router.push(href, { scroll: false }), 0)`
// itself, so the ONE thing that matters (the push is deferred by exactly
// one task, and only the push) can be pinned by a deterministic unit test
// (__tests__/unit/research-deferred-navigation.test.ts) with an injected
// scheduler — this repo's vitest runs in the `node` environment with no
// jsdom/RTL, so anything React/router-shaped has to live outside this file.
//
// Framework-free on purpose: no React import, no `next/navigation` import.
// `push` and `schedule` are both injected so the caller owns everything
// framework-specific (including the `{ scroll: false }` option — see below).
//
// What this function does NOT own: the `{ scroll: false }` passed to
// `router.push()` at the call site. That option is bound into the `push`
// callback ResearchHub.tsx hands in here — e.g.
// `(h) => router.push(h, { scroll: false })` — so it never has a
// representation in this file's signature and cannot be asserted by a test
// against this module. It is verified by reading ResearchHub.tsx's call
// site instead (see the audit report for this task).
//
// Why "exactly one push, never zero, never two" matters: a future edit that
// re-derives or re-invokes `schedule` (e.g. wrapping this call in a retry,
// or accidentally calling `schedulePush` twice per click) would silently
// double-navigate or drop the push again. The unit test guards both.
export function schedulePush(
  push: (href: string) => void,
  href: string,
  schedule: (fn: () => void) => void = (fn) => setTimeout(fn, 0),
): void {
  schedule(() => push(href));
}
