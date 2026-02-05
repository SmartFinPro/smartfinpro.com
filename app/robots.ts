import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://smartfinpro.com';

export default function robots(): MetadataRoute.Robots {
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
        ],
      },
      {
        // Googlebot-specific rules for optimal crawling
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/dashboard/',
          '/api/',
          '/_next/',
        ],
      },
      {
        // Bingbot-specific rules
        userAgent: 'Bingbot',
        allow: '/',
        disallow: [
          '/dashboard/',
          '/api/',
          '/_next/',
        ],
      },
      {
        // Block AI scrapers if desired (optional)
        userAgent: 'GPTBot',
        disallow: ['/'],
      },
      {
        userAgent: 'CCBot',
        disallow: ['/'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
