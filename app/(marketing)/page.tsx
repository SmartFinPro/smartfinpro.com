// app/(marketing)/page.tsx
// Root homepage (/) — renders US market content directly.
// US uses clean URLs without /us prefix per architecture spec.
// This avoids Next.js dev-mode hydration issues with middleware rewrites.

import { Metadata } from 'next';
import { generateAlternates } from '@/lib/seo/hreflang';
import { generateOrganizationSchema, generateWebsiteSchema } from '@/lib/seo/schema';
import MarketHomePage from './[market]/page';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://smartfinpro.com';

export async function generateMetadata(): Promise<Metadata> {
  const alternates = generateAlternates('/');

  return {
    title: 'SmartFinPro - Financial Intelligence for Modern Professionals',
    description:
      'Discover AI-powered tools, cybersecurity solutions, and financial products for modern professionals. Expert reviews, comparisons, and guides across 4 global markets.',
    alternates: {
      canonical: `${BASE_URL}/`,
      languages: alternates,
    },
    openGraph: {
      locale: 'en_US',
    },
  };
}

export default async function RootHomePage() {
  // Render US market homepage at / (clean URL, no /us prefix)
  return (
    <>
      {/* Page-level JSON-LD: Organization + WebSite schema for homepage */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'SmartFinPro - Financial Intelligence for Modern Professionals',
            description: 'Discover AI-powered tools, cybersecurity solutions, and financial products for modern professionals. Expert reviews, comparisons, and guides across 4 global markets.',
            url: `${BASE_URL}/`,
            isPartOf: generateWebsiteSchema(),
            publisher: generateOrganizationSchema(),
          }),
        }}
      />
      {await MarketHomePage({ params: Promise.resolve({ market: 'us' }), searchParams: Promise.resolve({}) })}
    </>
  );
}
