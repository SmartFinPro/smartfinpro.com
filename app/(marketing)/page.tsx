// app/(marketing)/page.tsx
// Root homepage (/) — renders US market content directly.
// US uses clean URLs without /us prefix per architecture spec.
// This avoids Next.js dev-mode hydration issues with middleware rewrites.

import { Metadata } from 'next';
import { generateAlternates } from '@/lib/seo/hreflang';
import { generateComparisonItemListSchema } from '@/lib/seo/schema';
import { getBestXIndex } from '@/lib/comparison/loader';
import MarketHomePage from './[market]/page';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://smartfinpro.com';

const HOMEPAGE_TITLE = 'SmartFinPro - Financial Intelligence for Modern Professionals';
const HOMEPAGE_DESCRIPTION =
  'Discover AI-powered tools, cybersecurity solutions, and financial products for modern professionals. Expert reviews and comparisons across 4 global markets.';

export async function generateMetadata(): Promise<Metadata> {
  const alternates = generateAlternates('/');

  return {
    // `title: { absolute }` bypasses the root layout's `%s | SmartFinPro` template —
    // this title already leads with the brand, so the template would double it.
    title: { absolute: HOMEPAGE_TITLE },
    description: HOMEPAGE_DESCRIPTION,
    alternates: {
      canonical: `${BASE_URL}/`,
      languages: alternates,
    },
    // Page-level `openGraph` fully replaces (not merges with) the layout's
    // openGraph object in Next.js metadata resolution — every field needed
    // (image, url, type, siteName) must be repeated here.
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: `${BASE_URL}/`,
      siteName: 'SmartFinPro',
      title: HOMEPAGE_TITLE,
      description: HOMEPAGE_DESCRIPTION,
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: 'SmartFinPro',
        },
      ],
    },
  };
}

export default async function RootHomePage() {
  // Render US market homepage at / (clean URL, no /us prefix)
  const bestX = await getBestXIndex('us');
  const liveItems = bestX.filter(
    (item): item is typeof item & { href: string; winner: NonNullable<typeof item.winner> } =>
      item.status === 'live' && !!item.href && !!item.winner
  );
  const dateModified = liveItems
    .map((item) => item.verifiedAt)
    .filter((d): d is string => !!d)
    .sort()
    .at(-1);

  const itemListSchema = liveItems.length > 0
    ? generateComparisonItemListSchema({
        title: 'Best-Rated Financial Products — SmartFinPro Compare',
        description: 'Editorially reviewed, currently-leading providers across SmartFinPro\'s comparison categories.',
        url: `${BASE_URL}/`,
        products: liveItems.map((item) => ({
          name: item.winner.name,
          description: item.label,
          url: `${BASE_URL}${item.href}`,
        })),
      })
    : null;

  return (
    <>
      {/* Page-level JSON-LD: WebPage (referencing the layout-level Organization/WebSite
          nodes by @id instead of re-embedding full duplicate entities) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: HOMEPAGE_TITLE,
            description: HOMEPAGE_DESCRIPTION,
            url: `${BASE_URL}/`,
            ...(dateModified && { dateModified }),
            isPartOf: { '@id': `${BASE_URL}/#website` },
            publisher: { '@id': `${BASE_URL}/#organization` },
          }),
        }}
      />
      {itemListSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
        />
      )}
      {await MarketHomePage({ params: Promise.resolve({ market: 'us' }), searchParams: Promise.resolve({}) })}
    </>
  );
}
