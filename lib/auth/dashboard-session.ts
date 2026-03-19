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
  const hashed = createDashboardSessionToken(secret);
  // Accept both: current HMAC cookie and legacy plaintext secret cookie.
  return timingSafeCompare(sessionValue, hashed) || timingSafeCompare(sessionValue, secret);
}

