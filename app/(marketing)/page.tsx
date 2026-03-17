// app/(marketing)/page.tsx
// Root homepage (/) — renders US market content directly.
// US uses clean URLs without /us prefix per architecture spec.
// This avoids Next.js dev-mode hydration issues with middleware rewrites.

import { Metadata } from 'next';
import { generateAlternates } from '@/lib/seo/hreflang';
import MarketHomePage from './[market]/page';

export async function generateMetadata(): Promise<Metadata> {
  const alternates = generateAlternates('/');

  return {
    title: 'SmartFinPro - Financial Intelligence for Modern Professionals',
    description:
      'Discover AI-powered tools, cybersecurity solutions, and financial products for modern professionals. Expert reviews, comparisons, and guides across 4 global markets.',
    alternates: {
      canonical: '/',
      languages: alternates,
    },
    openGraph: {
      locale: 'en_US',
    },
  };
}

export default async function RootHomePage() {
  // Render US market homepage at / (clean URL, no /us prefix)
  return await MarketHomePage({ params: Promise.resolve({ market: 'us' }), searchParams: Promise.resolve({}) });
}
