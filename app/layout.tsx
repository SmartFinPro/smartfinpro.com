import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';
import { AnalyticsProvider } from '@/components/providers/analytics-provider';
import SiloClassProvider from '@/components/providers/silo-class-provider';
import { generateOrganizationSchema, generateWebsiteSchema } from '@/lib/seo/schema';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
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
      'Discover AI-powered tools, cybersecurity solutions, and trading platforms.',
    images: ['/og-image.png'],
    creator: '@smartfinpro',
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
        {/* Preconnect to analytics */}
        <link rel="dns-prefetch" href="https://plausible.io" />
        {/* Inline silo detection — sets html[data-silo] immediately (no body mutation = no hydration mismatch).
            CSS uses html[data-silo="uk"] selectors. SiloClassProvider adds body.silo-* after hydration for JS consumers. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var p=window.location.pathname;var m=p.startsWith('/uk')?'uk':p.startsWith('/ca')?'ca':p.startsWith('/au')?'au':'us';document.documentElement.dataset.silo=m})();`,
          }}
        />
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
        <SiloClassProvider />
        <AnalyticsProvider>
          {children}
        </AnalyticsProvider>
        <Toaster />
      </body>
    </html>
  );
}
