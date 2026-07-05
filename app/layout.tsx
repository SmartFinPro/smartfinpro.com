import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Toaster from '@/components/ui/sonner';
import AnalyticsProvider from '@/components/providers/analytics-provider';
import SiloClassProvider from '@/components/providers/silo-class-provider';
import DevCacheBuster from '@/components/providers/dev-cache-buster';
import ChunkRecoveryProvider from '@/components/providers/chunk-recovery-provider';
import { generateOrganizationSchema, generateWebsiteSchema } from '@/lib/seo/schema';
import WebVitalsReporter from '@/components/providers/web-vitals-reporter';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  verification: {
    google: 'LiEOc7kngm8lF2HFwxZQUe14t3imoM-q8lANKDYQfvM',
  },
  title: {
    default: 'SmartFinPro - Financial Intelligence for Modern Professionals',
    template: '%s | SmartFinPro',
  },
  description:
    'Compare AI-powered tools, cybersecurity solutions, and trading platforms across 4 global markets. Expert reviews and free calculators.',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || 'https://smartfinpro.com'
  ),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'SmartFinPro',
    title: 'SmartFinPro - Financial Intelligence for Modern Professionals',
    description:
      'Compare AI-powered tools, cybersecurity solutions, and trading platforms across 4 global markets. Expert reviews and free calculators.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'SmartFinPro',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SmartFinPro - Financial Intelligence for Modern Professionals',
    description:
      'Compare AI-powered tools, cybersecurity solutions, and trading platforms across 4 global markets. Expert reviews and free calculators.',
    images: ['/og-image.png'],
    creator: '@smartfinpro',
  },
  icons: {
    icon: [
      { url: '/icon.svg?v=20260314e', type: 'image/svg+xml' },
      { url: '/icon.png?v=20260314e', type: 'image/png', sizes: '512x512' },
      { url: '/favicon.ico?v=20260314e', type: 'image/x-icon', sizes: '16x16 32x32 48x48' },
    ],
    shortcut: ['/favicon.ico?v=20260314e'],
    apple: [{ url: '/apple-icon.png?v=20260314e', sizes: '180x180', type: 'image/png' }],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  // Add Google verification code when available:
  // verification: { google: 'ACTUAL-CODE-HERE' },
};

// F-06: The silo (market) CSS tint is applied client-side by <SiloClassProvider/>
// (body.silo-* classes, see globals.css). We deliberately DO NOT read the
// x-sfp-silo header here: a server-side headers() call is a Dynamic API that
// opts the ENTIRE route tree into dynamic rendering, defeating generateStaticParams
// for every static route. The body.silo-* fallback covers the tint; html[data-silo]
// is redundant. Removing it lets non-searchParams routes render statically again.
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect to image CDN for faster LCP */}
        <link rel="preconnect" href="https://images.smartfinpro.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://images.smartfinpro.com" />
        {/* Preconnect to Supabase DB for faster TTFB on SSR queries */}
        {process.env.NEXT_PUBLIC_SUPABASE_URL && (
          <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL} crossOrigin="anonymous" />
        )}
        {/* Preconnect to analytics */}
        <link rel="dns-prefetch" href="https://plausible.io" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateOrganizationSchema()),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateWebsiteSchema()),
          }}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <DevCacheBuster />
        <ChunkRecoveryProvider />
        <SiloClassProvider />
        <WebVitalsReporter />
        <AnalyticsProvider>
          {children}
        </AnalyticsProvider>
        <Toaster />
      </body>
    </html>
  );
}
