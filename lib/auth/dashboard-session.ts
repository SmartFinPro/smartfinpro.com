import { createHmac, timingSafeEqual } from 'node:crypto';

const SESSION_PAYLOAD = 'sfp-dash-session';

function timingSafeCompare(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

export function createDashboardSessionToken(secret: string): string {
  return createHmac('sha256', secret).update(SESSION_PAYLOAD).digest('hex');
}

export function isValidDashboardSessionValue(
  sessionValue: string | undefined,
  secret: string | undefined,
): boolean {
  if (!sessionValue || !secret) return false;
  // SECURITY (Welle 3a): legacy plaintext-secret cookie fallback removed.
  // Only HMAC-derived session tokens are accepted. Any existing legacy
  // cookies will fail validation and be re-issued on next login via
  // `createDashboardSessionToken()`.
  const hashed = createDashboardSessionToken(secret);
  return timingSafeCompare(sessionValue, hashed);
}

