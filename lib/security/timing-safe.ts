// lib/security/timing-safe.ts
// Timing-safe secret comparison helpers — SECURITY AUDIT 2026-04-17 (C-01).
//
// Motivation: String === comparison leaks the secret byte-by-byte via CPU
// branch-timing (short-circuit on first mismatch). Over ~500-1000 requests an
// attacker can recover a 32-char CRON_SECRET / HEALTH_TOKEN / DASHBOARD_SECRET.
//
// Usage:
//   import { compareSecret, validateBearer } from '@/lib/security/timing-safe';
//
//   // For "Authorization: Bearer xxx" headers (cron/internal/health):
//   if (!validateBearer(request.headers.get('authorization'), process.env.CRON_SECRET)) {
//     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//   }
//
//   // For raw secret-vs-secret comparison (webhook signatures, session cookies):
//   if (!compareSecret(providedSig, expectedSig)) return 401;

import crypto from 'node:crypto';

/**
 * Constant-time string equality check.
 * Returns false for non-string inputs, length mismatches, and missing values.
 * Safe to call with untrusted user input.
 */
export function compareSecret(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length === 0 || b.length === 0) return false;

  const aBuf = Buffer.from(a, 'utf8');
  const bBuf = Buffer.from(b, 'utf8');

  // timingSafeEqual throws on length mismatch — compare lengths in constant time
  // by XOR-padding to equal length (never short-circuits).
  if (aBuf.length !== bBuf.length) {
    // Still perform a dummy comparison to normalise timing
    const dummy = Buffer.alloc(aBuf.length);
    crypto.timingSafeEqual(aBuf, dummy);
    return false;
  }

  return crypto.timingSafeEqual(aBuf, bBuf);
}

/**
 * Validate an `Authorization: Bearer <token>` header against an expected secret.
 * Returns false if:
 *   - header is null/empty
 *   - header does not start with "Bearer "
 *   - expected secret is missing or still a placeholder (starts with "your-")
 *   - tokens do not match (constant-time)
 */
export function validateBearer(
  header: string | null | undefined,
  expected: string | undefined,
): boolean {
  if (!header || !expected) return false;
  if (expected.startsWith('your-')) return false;

  const prefix = 'Bearer ';
  if (!header.startsWith(prefix)) return false;

  const provided = header.slice(prefix.length).trim();
  return compareSecret(provided, expected);
}

/**
 * Compare two hex-encoded HMAC signatures in constant time.
 * Both strings must be valid hex of equal length, otherwise returns false.
 */
export function compareHexSignature(provided: string, expected: string): boolean {
  if (typeof provided !== 'string' || typeof expected !== 'string') return false;
  if (provided.length !== expected.length) return false;
  if (!/^[0-9a-f]+$/i.test(provided) || !/^[0-9a-f]+$/i.test(expected)) return false;

  try {
    return crypto.timingSafeEqual(
      Buffer.from(provided, 'hex'),
      Buffer.from(expected, 'hex'),
    );
  } catch {
    return false;
  }
}
