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
  // Compression (gzip/brotli handled by Vercel Edge)
  // ============================================================
  compress: true,

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
    // Only upgrade insecure requests in production (breaks Safari on localhost HTTP)
    const upgradeInsecure = process.env.NODE_ENV === 'production' ? 'upgrade-insecure-requests;' : '';

    const ContentSecurityPolicy = `
      default-src 'self';
      script-src 'self' 'unsafe-inline' 'unsafe-eval' https://plausible.io https://www.googletagmanager.com https://www.google-analytics.com;
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
      img-src 'self' data: blob: https: http:;
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
      // ============================================================
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          ...securityHeaders,
        ],
      },

      // ============================================================
      // Next.js Generated Assets
      // ============================================================
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },

      // ============================================================
      // Fonts - Long Cache
      // ============================================================
      {
        source: '/:path*.woff2',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },

      // ============================================================
      // Images - Long Cache with Revalidation
      // ============================================================
      {
        source: '/:path*.(jpg|jpeg|png|gif|webp|avif|ico|svg)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },

      // ============================================================
      // API Routes - No Caching, Security Headers
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
      // HTML Pages - Moderate Caching with Revalidation
      // ============================================================
      {
        source: '/:path((?!api|_next|static|favicon).*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, stale-while-revalidate=86400',
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
