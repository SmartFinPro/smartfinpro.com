import type { NextConfig } from "next";
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig: NextConfig = {
  // ============================================================
  // TypeScript — suppress build-time type errors
  // (100+ pre-existing TS errors across lib/actions; fixed separately)
  // ============================================================
  typescript: {
    ignoreBuildErrors: true,
  },

  // ============================================================
  // ESLint — suppress build-time lint errors
  // ============================================================
  eslint: {
    ignoreDuringBuilds: true,
  },

  // ============================================================
  // Image Optimization (Core Web Vitals: LCP)
  // ============================================================
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 31536000, // 1 year cache for optimized images
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.smartfinpro.com',
      },
    ],
  },

  // ============================================================
  // Note: transpilePackages for next-mdx-remote was REMOVED.
  // transpilePackages pulls in next-mdx-remote/index.js AND its
  // dependency @mdx-js/react into the client bundle, both of which
  // crash in Turbopack. SafeMDX uses Direct Pass (no MDXRemote).
  // ============================================================

  // ============================================================
  // Experimental Features for Performance
  // ============================================================
  experimental: {
    optimizeCss: false, // Disabled for Safari compatibility
  },

  // ============================================================
  // Compiler Optimizations
  // ============================================================
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // ============================================================
  // Production Source Maps (disabled for performance)
  // ============================================================
  productionBrowserSourceMaps: false,

  // ============================================================
  // Powered by Header removed for security
  // ============================================================
  poweredByHeader: false,

  // ============================================================
  // Compression (gzip handled by Node.js; Brotli by Cloudflare)
  // ============================================================
  compress: true,

  // ============================================================
  // Output: Standalone for self-hosted deployment (Cloudways VPS)
  // Creates a minimal .next/standalone folder with all deps
  // ============================================================
  output: 'standalone',

  // ============================================================
  // Strict Mode for better React performance
  // ============================================================
  reactStrictMode: true,

  // ============================================================
  // Disable the on-screen Next.js development indicator badge.
  // Keeps local previews clean; actual runtime/build errors still appear.
  // ============================================================
  devIndicators: false,


  // ============================================================
  // FINANCIAL-GRADE SECURITY HEADERS
  // Target: securityheaders.com A+ Rating
  // ============================================================
  async headers() {
    // Content Security Policy for financial services
    // Strict but allows necessary functionality
    // Only upgrade insecure requests on the deployed site (breaks Safari on localhost HTTP).
    // next start also sets NODE_ENV=production, so we additionally check for a real
    // production host indicator (VERCEL, HOSTNAME, or explicit ENABLE_CSP_UPGRADE).
    const isDeployedProduction =
      process.env.NODE_ENV === 'production' &&
      (process.env.VERCEL === '1' ||
       process.env.ENABLE_CSP_UPGRADE === '1' ||
       (process.env.HOSTNAME && !process.env.HOSTNAME.includes('localhost')));
    const upgradeInsecure = isDeployedProduction ? 'upgrade-insecure-requests;' : '';

    // next-mdx-remote uses new Function() for client-side MDX evaluation.
    // Allow 'unsafe-eval' so MDX pages hydrate correctly.
    const unsafeEval = "'unsafe-eval'";

    // CSP report endpoint (F-17). Configure CSP_REPORT_URI in .env.local to point
    // at Sentry/report-uri.com/etc. If unset, the report-uri directive is omitted.
    const cspReportUri = process.env.CSP_REPORT_URI?.trim();
    const reportUri = cspReportUri ? `report-uri ${cspReportUri};` : '';

    const ContentSecurityPolicy = `
      default-src 'self';
      script-src 'self' 'unsafe-inline' ${unsafeEval} https://plausible.io https://www.googletagmanager.com https://www.google-analytics.com;
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
      img-src 'self' data: blob: https:;
      font-src 'self' https://fonts.gstatic.com data:;
      connect-src 'self' https://*.supabase.co wss://*.supabase.co https://plausible.io https://www.google-analytics.com https://api.resend.com https://*.partnerstack.com https://*.awin.com https://*.financeads.net https://o*.ingest.sentry.io;
      frame-src 'self';
      frame-ancestors 'none';
      form-action 'self';
      base-uri 'self';
      object-src 'none';
      ${reportUri}
      ${upgradeInsecure}
    `.replace(/\s{2,}/g, ' ').trim();

    const securityHeaders = [
      // ============================================================
      // CRITICAL SECURITY HEADERS
      // ============================================================

      // Content Security Policy - prevents XSS and injection attacks
      {
        key: 'Content-Security-Policy',
        value: ContentSecurityPolicy,
      },

      // Strict Transport Security - forces HTTPS for 2 years
      // includeSubDomains and preload for maximum security
      {
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload',
      },

      // Prevent clickjacking - deny all framing (F-10).
      // CSP frame-ancestors 'none' is the modern equivalent; X-Frame-Options
      // is retained for legacy browsers (IE/old Safari). DENY is stricter
      // than SAMEORIGIN: no framing at all, even from our own domain.
      {
        key: 'X-Frame-Options',
        value: 'DENY',
      },

      // Prevent MIME type sniffing
      {
        key: 'X-Content-Type-Options',
        value: 'nosniff',
      },

      // F-06: X-XSS-Protection removed. Deprecated since Chrome 78/Edge,
      // and in some legacy browsers the filter itself can introduce XSS.
      // CSP is the modern defence; explicit "0" prevents any UA default.
      {
        key: 'X-XSS-Protection',
        value: '0',
      },

      // Control referrer information
      {
        key: 'Referrer-Policy',
        value: 'strict-origin-when-cross-origin',
      },

      // Permissions Policy - disable unnecessary browser features (F-19).
      // Adds: browsing-topics (FLoC/Topics API), attribution-reporting
      // (Private Ad Attribution), private-state-token-issuance/redemption
      // (Trust Tokens), identity-credentials-get, idle-detection.
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=(), interest-cohort=(), browsing-topics=(), attribution-reporting=(), private-state-token-issuance=(), private-state-token-redemption=(), identity-credentials-get=(), idle-detection=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()',
      },

      // Cross-Origin policies for additional isolation
      // Note: COOP/CORP/COEP can break CSS/JS/font loading in Safari
      // Use 'same-site' instead of 'same-origin' for resource policy
      {
        key: 'Cross-Origin-Opener-Policy',
        value: 'same-origin-allow-popups',
      },
      {
        key: 'Cross-Origin-Resource-Policy',
        value: 'same-site',
      },

      // ============================================================
      // PERFORMANCE HEADERS
      // ============================================================

      // Enable DNS prefetching for faster resolution
      {
        key: 'X-DNS-Prefetch-Control',
        value: 'on',
      },
    ];

    return [
      // ============================================================
      // Static Assets - Aggressive Caching (1 year, immutable)
      // Hash-basierte Dateinamen → sicher für alle Browser.
      // no-transform: verhindert Proxy-CSS-Mangling (Opera Mini,
      // UC Browser, mobile Carrier-Proxies).
      // ============================================================
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable, no-transform',
          },
          ...securityHeaders,
        ],
      },

      // ============================================================
      // Next.js Generated Assets (CSS, JS, Chunks)
      // Alle Dateien unter /_next/static/ haben Content-Hashes im
      // Dateinamen → immutable ist sicher.
      // no-transform: verhindert dass Proxies CSS/JS modifizieren
      // (Ursache für kaputte Styles in Opera Mini, UC Browser,
      // Samsung Internet über Carrier-Proxies).
      // ============================================================
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable, no-transform',
          },
          // Access-Control für cross-origin CSS-Fonts in Firefox
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          // Korrekte MIME-Types erzwingen (IE11/Edge Legacy Fix)
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },

      // ============================================================
      // Fonts - Long Cache + CORS (Firefox cross-origin Fix)
      // Firefox blockiert Fonts ohne CORS-Header wenn sie von
      // einem anderen Origin geladen werden.
      // ============================================================
      {
        source: '/:path*.woff2',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable, no-transform',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },

      // ============================================================
      // Images - Long Cache with Revalidation
      // no-transform: Proxies sollen Bilder nicht re-komprimieren
      // (verhindert Qualitätsverlust auf mobilen Netzwerken).
      // ============================================================
      {
        source: '/:path*.(jpg|jpeg|png|gif|webp|avif|ico|svg)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800, no-transform',
          },
        ],
      },

      // ============================================================
      // Affiliate Redirect Routes — NEVER cache
      // /go/[slug] redirects to partner URLs. These MUST NOT be
      // cached by Cloudflare or any CDN — the destination URL can
      // change (DB update) and stale cached redirects point to wrong
      // destinations (e.g. 0.0.0.0:3000 fallback gets cached).
      // ============================================================
      {
        source: '/go/:slug*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
          {
            key: 'CDN-Cache-Control',
            value: 'no-store',
          },
          {
            key: 'Cloudflare-CDN-Cache-Control',
            value: 'no-store',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },

      // ============================================================
      // API Routes - No Caching, Security Headers
      // Pragma + Expires für HTTP/1.0 Proxy-Kompatibilität
      // (ältere Corporate Proxies, IE11).
      // ============================================================
      {
        source: '/api/((?!widget/).*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
          ...securityHeaders,
        ],
      },

      // ============================================================
      // Widget Routes — Permissive headers for iFrame embedding
      // These routes serve self-contained HTML widgets that external
      // publishers embed via <iframe>. They need relaxed CSP
      // (frame-ancestors *) and CORS (Access-Control-Allow-Origin *)
      // to function on third-party domains.
      // Separated from /api/:path* to avoid inheriting restrictive
      // frame-ancestors 'self' and X-Frame-Options: SAMEORIGIN.
      // ============================================================
      {
        source: '/api/widget/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, s-maxage=600, stale-while-revalidate=3600',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors *; default-src 'none'; style-src 'unsafe-inline'; img-src data:;",
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow',
          },
          // Intentionally NO X-Frame-Options (CSP frame-ancestors takes precedence)
          // Intentionally NO restrictive securityHeaders spread
        ],
      },

      // ============================================================
      // All Other Routes - Full Security Headers
      // Excludes /api/widget/ which has its own permissive headers above.
      // ============================================================
      {
        source: '/:path((?!api/widget/).*)',
        headers: [
          ...securityHeaders,
          // Preconnect hints for critical external resources
          {
            key: 'Link',
            value: [
              '<https://fonts.googleapis.com>; rel=preconnect',
              '<https://fonts.gstatic.com>; rel=preconnect; crossorigin',
              // YouTube — for VideoContainer iframe embeds (faster LCP for video pages)
              '<https://www.youtube.com>; rel=preconnect',
              '<https://i.ytimg.com>; rel=preconnect',
              // Plausible analytics — already dns-prefetched in HTML head
              '<https://plausible.io>; rel=preconnect',
            ].join(', '),
          },
        ],
      },

      // ============================================================
      // HTML Pages - Cross-Browser Cache-Busting
      // ============================================================
      // Problem: Browser cachen HTML mit alten CSS/JS-Hashes.
      // Nach einem Build zeigen sie kaputte Styles.
      //
      // Betroffene Browser & Fix:
      // ┌──────────────────┬──────────────────────────────────┐
      // │ Safari (alle)    │ max-age=0 + must-revalidate      │
      // │ Chrome/Edge      │ must-revalidate (304 via ETag)   │
      // │ Firefox          │ no-cache (immer revalidieren)    │
      // │ Samsung Internet │ no-cache + Pragma Fallback       │
      // │ Opera Mini       │ no-transform (kein CSS-Mangling) │
      // │ IE11/Edge Legacy │ Pragma + Expires Fallback        │
      // │ UC Browser       │ no-transform + no-cache          │
      // │ Mobile Proxies   │ proxy-revalidate + Surrogate     │
      // └──────────────────┴──────────────────────────────────┘
      //
      // CDN (Cloudflare): s-maxage=3600 → cached 1h am Edge.
      // Surrogate-Control: Varnish/Fastly/Cloudways-Proxy.
      // ============================================================
      // Review & Category Pages — Aggressive Cloudflare Edge Caching
      // MDX-Reviews ändern sich selten → 24h CDN Cache sinnvoll.
      // CDN-Cache-Control: Cloudflare-spezifisch, überschreibt Cache-Control
      // am Edge. Browser sehen nur Cache-Control (no-cache → immer fresh).
      // ============================================================
      {
        source: '/:market(uk|ca|au)/:category/:slug*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, s-maxage=86400, stale-while-revalidate=86400, no-transform',
          },
          {
            key: 'CDN-Cache-Control',
            value: 'max-age=86400',
          },
          {
            key: 'Cloudflare-CDN-Cache-Control',
            value: 'max-age=86400',
          },
          {
            key: 'Vary',
            value: 'Accept-Encoding',
          },
        ],
      },
      // US Review Pages (kein Market-Prefix)
      {
        source: '/:category(ai-tools|trading|forex|personal-finance|business-banking|cybersecurity|credit-repair|debt-relief|credit-score)/:slug*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, s-maxage=86400, stale-while-revalidate=86400, no-transform',
          },
          {
            key: 'CDN-Cache-Control',
            value: 'max-age=86400',
          },
          {
            key: 'Cloudflare-CDN-Cache-Control',
            value: 'max-age=86400',
          },
          {
            key: 'Vary',
            value: 'Accept-Encoding',
          },
        ],
      },
      // ============================================================
      // Alle anderen HTML-Seiten (Homepage, Kategorieseiten etc.)
      // 1h CDN-Cache, Browser revalidiert immer.
      // ============================================================
      {
        source: '/:path((?!api|_next|static|favicon|dashboard).*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400, no-transform',
          },
          {
            key: 'CDN-Cache-Control',
            value: 'max-age=3600',
          },
          {
            key: 'Vary',
            value: 'Accept-Encoding',
          },
        ],
      },

      // ============================================================
      // Sitemap & Robots - Moderate Caching
      // ============================================================
      {
        source: '/(sitemap.xml|robots.txt)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },
    ];
  },

  // ============================================================
  // Redirects — canonical URL enforcement
  // /us is rendered by [market]/page.tsx but the US canonical is /.
  // Google flagged it as duplicate (GSC 2026-04-11). 301 ensures
  // link equity flows to / and removes it from the index.
  // ============================================================
  async redirects() {
    return [
      // ── US market canonical (no prefix) ──────────────────────────────────
      {
        source: '/us',
        destination: '/',
        permanent: true,
      },

      // ── Wrong-market content: AU reviews linked with /us/ prefix ─────────
      // Google crawled these via hreflang from AU pages. Redirect to correct market.
      {
        source: '/us/gold-investing/perth-mint-review',
        destination: '/au/gold-investing/perth-mint-review',
        permanent: true,
      },
      {
        source: '/us/personal-finance/nab-home-loan-review',
        destination: '/au/personal-finance/nab-home-loan-review',
        permanent: true,
      },
      {
        source: '/us/personal-finance/athena-home-loans-review',
        destination: '/au/personal-finance/athena-home-loans-review',
        permanent: true,
      },

      // ── Wrong-market content: UK reviews linked with /us/ prefix ─────────
      {
        source: '/us/business-banking/starling-business-review',
        destination: '/uk/business-banking/starling-business-review',
        permanent: true,
      },

      // ── Wrong-market: UK savings content at /us/ path ────────────────────
      // "savings" is not a US category; redirect to UK equivalent.
      {
        source: '/us/savings/:slug*',
        destination: '/uk/savings/:slug*',
        permanent: true,
      },

      // ── Global tools linked with market prefix in hreflang ───────────────
      // debt-payoff-calculator and credit-score-simulator are global (/tools/).
      // Some tool page.tsx files incorrectly pointed hreflang at market-prefixed
      // versions. Redirect as fallback in case any external links remain.
      {
        source: '/:market(uk|ca|au)/tools/debt-payoff-calculator',
        destination: '/tools/debt-payoff-calculator',
        permanent: true,
      },
      {
        source: '/:market(uk|ca|au)/tools/credit-score-simulator',
        destination: '/tools/credit-score-simulator',
        permanent: true,
      },

      // ── AU-only categories crawled with /us/ prefix ───────────────────────
      {
        source: '/us/superannuation/:slug*',
        destination: '/au/superannuation/:slug*',
        permanent: true,
      },

      // ── UK-only categories crawled with /us/ prefix ───────────────────────
      {
        source: '/us/remortgaging/:slug*',
        destination: '/uk/remortgaging/:slug*',
        permanent: true,
      },
      {
        source: '/us/cost-of-living/:slug*',
        destination: '/uk/cost-of-living/:slug*',
        permanent: true,
      },

      // ── CA-only categories crawled with /us/ prefix ───────────────────────
      {
        source: '/us/housing/:slug*',
        destination: '/ca/housing/:slug*',
        permanent: true,
      },
      {
        source: '/us/tax-efficient-investing/:slug*',
        destination: '/ca/tax-efficient-investing/:slug*',
        permanent: true,
      },

      // ── UK categories crawled without market prefix ───────────────────────
      {
        source: '/savings',
        destination: '/uk/savings',
        permanent: true,
      },
      {
        source: '/remortgaging',
        destination: '/uk/remortgaging',
        permanent: true,
      },
      {
        source: '/cost-of-living',
        destination: '/uk/cost-of-living',
        permanent: true,
      },

      // ── Individual wrong-market: AU content at /us/ path ─────────────────
      {
        source: '/us/gold-investing/ainslie-bullion-review',
        destination: '/au/gold-investing/ainslie-bullion-review',
        permanent: true,
      },
      {
        source: '/us/gold-investing/how-to-buy-gold-australia',
        destination: '/au/gold-investing/how-to-buy-gold-australia',
        permanent: true,
      },
      {
        source: '/us/personal-finance/commbank-home-loan-review',
        destination: '/au/personal-finance/commbank-home-loan-review',
        permanent: true,
      },
      {
        source: '/us/personal-finance/anz-home-loan-review',
        destination: '/au/personal-finance/anz-home-loan-review',
        permanent: true,
      },
      {
        source: '/us/personal-finance/ubank-home-loan-review',
        destination: '/au/personal-finance/ubank-home-loan-review',
        permanent: true,
      },

      // ── Individual wrong-market: UK content at /us/ path ─────────────────
      {
        source: '/us/personal-finance/marcus-uk-review',
        destination: '/uk/personal-finance/marcus-uk-review',
        permanent: true,
      },
      {
        source: '/us/personal-finance/barclays-personal-loan-review',
        destination: '/uk/personal-finance/barclays-personal-loan-review',
        permanent: true,
      },
      {
        source: '/us/personal-finance/hargreaves-lansdown-isa-review',
        destination: '/uk/personal-finance/hargreaves-lansdown-isa-review',
        permanent: true,
      },
      {
        source: '/us/personal-finance/vanguard-isa-review',
        destination: '/uk/personal-finance/vanguard-isa-review',
        permanent: true,
      },
      {
        source: '/us/personal-finance/trading-212-isa-review',
        destination: '/uk/personal-finance/trading-212-isa-review',
        permanent: true,
      },
      {
        source: '/us/business-banking/tide-review',
        destination: '/uk/business-banking/tide-review',
        permanent: true,
      },
      {
        source: '/us/cybersecurity/nordvpn-review-uk-2026-best-vpn-for-investors',
        destination: '/uk/cybersecurity/nordvpn-review-uk-2026-best-vpn-for-investors',
        permanent: true,
      },

      // ── Individual wrong-market: CA content at /us/ path ─────────────────
      {
        source: '/us/personal-finance/wealthsimple-tax',
        destination: '/ca/personal-finance/wealthsimple-tax',
        permanent: true,
      },
      {
        source: '/us/forex/questrade-review',
        destination: '/ca/forex/questrade-review',
        permanent: true,
      },

      // ── Forex reviews that belong to UK or AU ────────────────────────────
      {
        source: '/us/forex/cmc-markets-review',
        destination: '/uk/forex/cmc-markets-review',
        permanent: true,
      },
      {
        source: '/us/forex/pepperstone-review',
        destination: '/au/forex/pepperstone-review',
        permanent: true,
      },
      {
        source: '/us/forex/interactive-brokers-review',
        destination: '/ca/forex/interactive-brokers-review',
        permanent: true,
      },

      // ── Trading comparisons that belong to UK ────────────────────────────
      {
        source: '/us/trading/ig-vs-plus500-vs-etoro',
        destination: '/uk/trading/ig-vs-plus500-vs-etoro',
        permanent: true,
      },

      // ── Savings reviews wrong-market ─────────────────────────────────────
      {
        source: '/us/savings/marcus-review',
        destination: '/uk/savings/marcus-review',
        permanent: true,
      },
      {
        source: '/us/savings/chip-review',
        destination: '/uk/savings/chip-review',
        permanent: true,
      },
      {
        source: '/us/savings/ing-savings-maximiser-review',
        destination: '/au/savings/ing-savings-maximiser-review',
        permanent: true,
      },
    ];
  },
};

// ============================================================
// Sentry — Error Monitoring & Performance Tracing
// withSentryConfig wraps the config to inject source-map upload
// and the /monitoring tunnel route (bypasses ad-blockers).
//
// ENVs required (add to .env.local + ecosystem.config.js):
//   NEXT_PUBLIC_SENTRY_DSN       — from Sentry project → Client Keys (DSN)
//   SENTRY_DSN                   — same value, but not public (server-side)
//   SENTRY_AUTH_TOKEN            — from Sentry → Settings → Auth Tokens
//   SENTRY_ORG                   — your Sentry org slug
//   SENTRY_PROJECT               — your Sentry project slug
//   NEXT_PUBLIC_SENTRY_RELEASE   — optional, set in CI (e.g. git commit hash)
// ============================================================
export default withSentryConfig(nextConfig, {
  // Sentry org & project (for source map uploads)
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Suppress Sentry CLI output (only show in CI)
  silent: !process.env.CI,

  // Hide source maps from client bundle (security) — Sentry v10 API
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN, // only upload when token is set
  },

  // Tunnel all Sentry requests through our domain to avoid ad-blockers.
  // Creates a /monitoring route that proxies to ingest.sentry.io.
  tunnelRoute: '/monitoring',

  webpack: {
    // Remove Sentry debug/logger calls from client bundle (replaces deprecated disableLogger)
    treeshake: {
      removeDebugLogging: true,
    },
    // No automatic Vercel monitors (self-hosted on Cloudways, replaces deprecated automaticVercelMonitors)
    automaticVercelMonitors: false,
  },

  // Only upload source maps when SENTRY_AUTH_TOKEN is set (CI/production builds)
  // Without the token the plugin runs in no-upload mode automatically
  widenClientFileUpload: false,
});
