import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';
import { AnalyticsProvider } from '@/components/providers/analytics-provider';

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
    'Discover AI-powered tools, cybersecurity solutions, and trading platforms trusted by 50,000+ finance professionals.',
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
      'Discover AI-powered tools, cybersecurity solutions, and trading platforms trusted by 50,000+ finance professionals.',
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
  verification: {
    google: 'your-google-verification-code',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <AnalyticsProvider>
          {children}
        </AnalyticsProvider>
        <Toaster />
      </body>
    </html>
  );
}
