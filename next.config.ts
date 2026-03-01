import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
    const ContentSecurityPolicy = `
      default-src 'self';
      script-src 'self' 'unsafe-inline' ${unsafeEval} https://plausible.io https://www.googletagmanager.com https://www.google-analytics.com;
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
      img-src 'self' data: blob: https:;
      font-src 'self' https://fonts.gstatic.com data:;
      connect-src 'self' https://*.supabase.co wss://*.supabase.co https://plausible.io https://www.google-analytics.com https://api.resend.com https://*.partnerstack.com https://*.awin.com https://*.financeads.net;
      frame-src 'self';
      frame-ancestors 'self';
      form-action 'self';
      base-uri 'self';
      object-src 'none';
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

      // Prevent clickjacking - only allow framing from same origin
      {
        key: 'X-Frame-Options',
        value: 'SAMEORIGIN',
      },

      // Prevent MIME type sniffing
      {
        key: 'X-Content-Type-Options',
        value: 'nosniff',
      },

      // Enable XSS filter in browsers (legacy, but still useful)
      {
        key: 'X-XSS-Protection',
        value: '1; mode=block',
      },

      // Control referrer information
      {
        key: 'Referrer-Policy',
        value: 'strict-origin-when-cross-origin',
      },

      // Permissions Policy - disable unnecessary browser features
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=(), interest-cohort=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()',
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
      // API Routes - No Caching, Security Headers
      // Pragma + Expires für HTTP/1.0 Proxy-Kompatibilität
      // (ältere Corporate Proxies, IE11).
      // ============================================================
      {
        source: '/api/:path*',
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
      // All Other Routes - Full Security Headers
      // ============================================================
      {
        source: '/:path*',
        headers: [
          ...securityHeaders,
          // Preconnect hints for critical external resources
          {
            key: 'Link',
            value: '<https://fonts.googleapis.com>; rel=preconnect, <https://fonts.gstatic.com>; rel=preconnect; crossorigin',
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
      {
        source: '/:path((?!api|_next|static|favicon).*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, no-cache, must-revalidate, proxy-revalidate, s-maxage=3600, stale-while-revalidate=86400, no-transform',
          },
          // HTTP/1.0 Fallback (Samsung Internet, IE11, Corporate Proxies)
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          // HTTP/1.0 Fallback (ältere Proxy-Server)
          {
            key: 'Expires',
            value: '0',
          },
          // Varnish/Fastly/Cloudways Reverse-Proxy Caching
          {
            key: 'Surrogate-Control',
            value: 'max-age=3600',
          },
          // Vary: Browser soll pro Encoding + Accept separaten Cache halten.
          // Verhindert dass gzip-Version für brotli-Client ausgeliefert wird.
          {
            key: 'Vary',
            value: 'Accept-Encoding, Accept',
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
};

export default nextConfig;
