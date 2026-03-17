// app/api/widget/trust-badge/route.ts
// Embeddable Trust Widget — self-contained HTML page for iFrame embedding.
//
// Returns a compact 250×80 widget showing live audit certification status.
// Reads audit reports from filesystem (same gate logic as TrustSeal + AuditStatusWidget).
//
// Designed for external publishers to embed via <iframe>:
//   <iframe src="https://smartfinpro.com/api/widget/trust-badge" width="250" height="80"
//           style="border:none;overflow:hidden;border-radius:12px;" loading="lazy"
//           title="SmartFinPro Data Integrity Status"></iframe>
//
// Design: Clean Fintech — white bg, navy/emerald accents, NO glassmorphism.
// All CSS is inline (widget runs outside our Tailwind context).

import { NextResponse } from 'next/server';
import { readLatestAuditReport, isReportCertified } from '@/lib/audit/read-report';

export const dynamic = 'force-dynamic';

// ── Brand colors (hex — widget has no access to host CSS variables) ──────────

const NAVY      = '#1B4F8C';
const GOLD      = '#F5A623';
const GREEN     = '#1A6B3A';
const EMERALD   = '#059669';
const RED       = '#D64045';
const INK       = '#1A1A2E';
const SLATE     = '#555555';
const BORDER    = '#e5e7eb';
const WHITE     = '#ffffff';

// ── Shield SVG icon (inline, no external requests) ──────────────────────────

const shieldSvg = (color: string) => `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
  fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  <path d="m9 12 2 2 4-4"/>
</svg>`;

// ── HTML builder ─────────────────────────────────────────────────────────────

function buildCertifiedHtml(integPassed: number, integTotal: number): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>SmartFinPro Trust Badge</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box;}
  body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
    background:transparent;overflow:hidden;}
  a{text-decoration:none;color:inherit;display:block;}
  .widget{
    width:250px;height:80px;
    background:${WHITE};
    border:1px solid ${BORDER};
    border-radius:12px;
    overflow:hidden;
    transition:box-shadow .2s ease;
    cursor:pointer;
  }
  .widget:hover{box-shadow:0 2px 12px rgba(27,79,140,.12);}
  .bar{height:4px;background:linear-gradient(90deg,${NAVY} 0%,${GOLD} 100%);}
  .body{display:flex;align-items:center;gap:10px;padding:10px 14px;height:76px;}
  .icon{
    width:36px;height:36px;border-radius:50%;
    background:rgba(26,107,58,.08);
    display:flex;align-items:center;justify-content:center;
    flex-shrink:0;
  }
  .text{flex:1;min-width:0;}
  .label{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;
    color:${EMERALD};line-height:1.2;margin-bottom:2px;}
  .value{font-size:14px;font-weight:700;color:${NAVY};line-height:1.3;}
  .sub{font-size:9px;color:${SLATE};line-height:1.2;margin-top:1px;}
</style>
</head>
<body>
<a href="https://smartfinpro.com/integrity" target="_blank" rel="noopener noreferrer">
  <div class="widget">
    <div class="bar"></div>
    <div class="body">
      <div class="icon">${shieldSvg(GREEN)}</div>
      <div class="text">
        <div class="label">Live Data Integrity</div>
        <div class="value">${integPassed}/${integTotal} Passed</div>
        <div class="sub">Verified by SmartFinPro</div>
      </div>
    </div>
  </div>
</a>
</body>
</html>`;
}

function buildPendingHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>SmartFinPro Trust Badge</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box;}
  body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
    background:transparent;overflow:hidden;}
  a{text-decoration:none;color:inherit;display:block;}
  .widget{
    width:250px;height:80px;
    background:${WHITE};
    border:1px solid ${BORDER};
    border-radius:12px;
    overflow:hidden;
    transition:box-shadow .2s ease;
    cursor:pointer;
  }
  .widget:hover{box-shadow:0 2px 12px rgba(214,64,69,.12);}
  .bar{height:4px;background:linear-gradient(90deg,${RED} 0%,${GOLD} 100%);}
  .body{display:flex;align-items:center;gap:10px;padding:10px 14px;height:76px;}
  .icon{
    width:36px;height:36px;border-radius:50%;
    background:rgba(214,64,69,.08);
    display:flex;align-items:center;justify-content:center;
    flex-shrink:0;
  }
  .text{flex:1;min-width:0;}
  .label{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;
    color:${RED};line-height:1.2;margin-bottom:2px;}
  .value{font-size:14px;font-weight:700;color:${INK};line-height:1.3;}
  .sub{font-size:9px;color:${SLATE};line-height:1.2;margin-top:1px;}
</style>
</head>
<body>
<a href="https://smartfinpro.com/integrity" target="_blank" rel="noopener noreferrer">
  <div class="widget">
    <div class="bar"></div>
    <div class="body">
      <div class="icon">${shieldSvg(RED)}</div>
      <div class="text">
        <div class="label">Data Integrity</div>
        <div class="value">Audit Pending</div>
        <div class="sub">Verified by SmartFinPro</div>
      </div>
    </div>
  </div>
</a>
</body>
</html>`;
}

// ── Route handler ────────────────────────────────────────────────────────────

export async function GET() {
  const data = readLatestAuditReport();

  const integCertified = isReportCertified(data.integration);
  const unitCertified  = isReportCertified(data.unit);
  const isCertified    = integCertified && unitCertified;

  const html = isCertified && data.integration
    ? buildCertifiedHtml(data.integration.numPassedTests, data.integration.numTotalTests)
    : buildPendingHtml();

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=600, stale-while-revalidate=3600',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'X-Content-Type-Options': 'nosniff',
      // Prevent search engines from indexing the raw widget endpoint.
      'X-Robots-Tag': 'noindex, nofollow',
      // Permissive frame-ancestors — allows embedding on any site.
      // This overrides the global CSP 'frame-ancestors self' for this route.
      // GOVERNANCE NOTE: frame-ancestors * + CORS * is intentional for maximum
      // publisher adoption. Abuse risk (misleading third-party embedding) is
      // accepted — the widget links back to smartfinpro.com/integrity, so any
      // misuse still drives traffic to our domain for verification.
      'Content-Security-Policy': "frame-ancestors *; default-src 'none'; style-src 'unsafe-inline'; img-src data:;",
      // Intentionally omit X-Frame-Options — CSP frame-ancestors takes precedence
      // in all modern browsers. Setting SAMEORIGIN here would block embedding.
    },
  });
}
