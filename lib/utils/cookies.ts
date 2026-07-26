// lib/utils/cookies.ts
// Client-side cookie helpers (extracted from geo-suggest-banner.tsx).
//
// SSG-safe: no server imports, works in any 'use client' component.
// getCookie returns null on the server; setCookie must only be called
// from browser event handlers / effects.

export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.split('; ').find((c) => c.startsWith(`${name}=`));
  return match ? match.split('=')[1] : null;
}

export function setCookie(name: string, value: string, days: number) {
  const maxAge = days * 86_400;
  document.cookie = `${name}=${value}; max-age=${maxAge}; path=/; SameSite=Lax`;
}
