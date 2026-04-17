// lib/security/client-ip.ts
// Resolves the real client IP behind Cloudflare → nginx → Next.js.
//
// Threat model: `x-forwarded-for` and `x-real-ip` are ATTACKER-CONTROLLED when
// the request did not traverse a trusted proxy we own. We must only trust
// headers set by proxies whose ingress is validated (Cloudflare IP check,
// nginx on localhost). Otherwise rate-limits, abuse tracking, and
// geo-routing can be bypassed by spoofing headers.
//
// Priority order:
//   1. cf-connecting-ip      → Set ONLY by Cloudflare edge. Trusted if the
//                              deployment sits behind Cloudflare (our case).
//   2. x-real-ip             → Set by nginx on the VPS. Trusted when TRUST_NGINX=true.
//   3. x-forwarded-for       → Multi-hop list. LAST value only (closest hop).
//                              Trusted when TRUST_XFF=true (e.g. behind an ALB).
//   4. Fallback: 'unknown'   → Never spoofable, but useless for rate-limit keys.
//
// Rationale: `x-forwarded-for.split(',')[0]` (the FIRST value) is the classic
// spoofing pitfall — attackers can prepend any value. We always take the
// rightmost trusted hop.

export function getClientIp(req: {
  headers: { get(name: string): string | null };
}): string {
  // 1. Cloudflare's cf-connecting-ip is set by the edge and cannot be spoofed
  //    by the origin client when Cloudflare is in front.
  const cf = req.headers.get('cf-connecting-ip');
  if (cf && isValidIp(cf)) return cf;

  // 2. nginx local proxy: use x-real-ip when TRUST_NGINX is enabled.
  if (process.env.TRUST_NGINX === 'true') {
    const real = req.headers.get('x-real-ip');
    if (real && isValidIp(real)) return real;
  }

  // 3. x-forwarded-for (opt-in): take the RIGHTMOST entry (= closest trusted
  //    hop), never the leftmost (= attacker-controlled).
  if (process.env.TRUST_XFF === 'true') {
    const xff = req.headers.get('x-forwarded-for');
    if (xff) {
      const parts = xff.split(',').map((s) => s.trim()).filter(Boolean);
      const last = parts[parts.length - 1];
      if (last && isValidIp(last)) return last;
    }
  }

  return 'unknown';
}

/** Lightweight IPv4/IPv6 validation — guards against junk injected by bad proxies */
function isValidIp(value: string): boolean {
  if (!value || value.length > 45) return false;
  // IPv4 (0-255 per octet)
  const v4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(value);
  if (v4) {
    for (let i = 1; i <= 4; i++) {
      const n = Number(v4[i]);
      if (!Number.isFinite(n) || n < 0 || n > 255) return false;
    }
    return true;
  }
  // IPv6 — conservative regex: at least one colon, hex only
  if (/^[0-9a-fA-F:]+$/.test(value) && value.includes(':')) return true;
  return false;
}
