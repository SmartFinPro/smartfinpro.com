import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://smartfinpro.com';

export default function robots(): MetadataRoute.Robots {
  try {
    return {
      rules: [
        {
          userAgent: '*',
          allow: '/',
          disallow: [
            '/dashboard/',
            '/api/',
            '/go/',
            '/_next/',
            '/private/',
            '/sfp-mk-*',
          ],
        },
        {
          // Googlebot-specific rules for optimal crawling
          userAgent: 'Googlebot',
          allow: '/',
          disallow: [
            '/dashboard/',
            '/api/',
            '/go/',
            '/_next/',
            // F-18c: UA-specific groups do NOT inherit the '*' disallow — repeat private paths.
            '/private/',
            '/sfp-mk-*',
          ],
        },
        {
          // Bingbot-specific rules
          userAgent: 'Bingbot',
          allow: '/',
          disallow: [
            '/dashboard/',
            '/api/',
            '/go/',
            '/_next/',
            '/private/',
            '/sfp-mk-*',
          ],
        },
        // F-10: AEO/GEO — explicitly ALLOW answer-engine + LLM crawlers so content
        // is citable in ChatGPT, Perplexity, Google AI Overviews & Claude.
        // Public marketing pages only; /dashboard, /api, /go, /private stay blocked.
        {
          userAgent: 'GPTBot',
          allow: '/',
          disallow: ['/dashboard/', '/api/', '/go/', '/_next/', '/private/', '/sfp-mk-*'],
        },
        {
          userAgent: 'OAI-SearchBot',
          allow: '/',
          disallow: ['/dashboard/', '/api/', '/go/', '/_next/', '/private/', '/sfp-mk-*'],
        },
        {
          userAgent: 'ChatGPT-User',
          allow: '/',
          disallow: ['/dashboard/', '/api/', '/go/', '/_next/', '/private/', '/sfp-mk-*'],
        },
        {
          userAgent: 'PerplexityBot',
          allow: '/',
          disallow: ['/dashboard/', '/api/', '/go/', '/_next/', '/private/', '/sfp-mk-*'],
        },
        {
          userAgent: 'Google-Extended',
          allow: '/',
          disallow: ['/dashboard/', '/api/', '/go/', '/_next/', '/private/', '/sfp-mk-*'],
        },
        {
          userAgent: 'CCBot',
          allow: '/',
          disallow: ['/dashboard/', '/api/', '/go/', '/_next/', '/private/', '/sfp-mk-*'],
        },
        {
          userAgent: 'ClaudeBot',
          allow: '/',
          disallow: ['/dashboard/', '/api/', '/go/', '/_next/', '/private/', '/sfp-mk-*'],
        },
      ],
      sitemap: `${BASE_URL}/sitemap.xml`,
      host: BASE_URL,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown robots error';
    console.error('[robots] fallback robots emitted:', msg);
    return {
      rules: [{ userAgent: '*', allow: '/' }],
      sitemap: `${BASE_URL}/sitemap.xml`,
      host: BASE_URL,
    };
  }
}
