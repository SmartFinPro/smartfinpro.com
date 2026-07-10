// app/(marketing)/page.tsx
// Root homepage (/) — renders US market content directly.
// US uses clean URLs without /us prefix per architecture spec.
// This avoids Next.js dev-mode hydration issues with middleware rewrites.

import { Metadata } from 'next';
import { generateAlternates } from '@/lib/seo/hreflang';
import { buildBestXItemListSchema } from '@/lib/seo/best-x-item-list';
import { getBestXIndex } from '@/lib/comparison/loader';
import MarketHomePage from './[market]/page';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://smartfinpro.com';

const HOMEPAGE_TITLE = 'SmartFinPro — Financial Product Reviews & Comparisons';
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
    // Page-level `openGraph`/`twitter` fully replace (not merge with) the layout's
    // objects in Next.js metadata resolution — every field needed must be repeated here.
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
    // Kept identical to `openGraph` so the messaging layer doesn't fork across
    // Facebook/LinkedIn (OG) vs. X (Twitter) previews.
    twitter: {
      card: 'summary_large_image',
      title: HOMEPAGE_TITLE,
      description: HOMEPAGE_DESCRIPTION,
      images: ['/og-image.png'],
      creator: '@smartfinpro',
    },
  };
}

export default async function RootHomePage() {
  // Render US market homepage at / (clean URL, no /us prefix)
  const bestX = await getBestXIndex('us');
  const itemList = buildBestXItemListSchema('us', bestX);
  const dateModified = itemList?.dateModified;

  return (
    <>
      {/* Page-level JSON-LD: WebPage (referencing the layout-level Organization/WebSite
          nodes by @id instead of re-embedding full duplicate entities). mainEntity
          links to the Best-X ItemList — the page's primary content. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            '@id': `${BASE_URL}/#webpage`,
            name: HOMEPAGE_TITLE,
            description: HOMEPAGE_DESCRIPTION,
            url: `${BASE_URL}/`,
            ...(dateModified && { dateModified }),
            isPartOf: { '@id': `${BASE_URL}/#website` },
            publisher: { '@id': `${BASE_URL}/#organization` },
            primaryImageOfPage: {
              '@type': 'ImageObject',
              url: `${BASE_URL}/og-image.png`,
              width: 1200,
              height: 630,
            },
            ...(itemList && { mainEntity: { '@id': itemList.id } }),
          }),
        }}
      />
      {itemList && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList.schema) }}
        />
      )}
      {await MarketHomePage({ params: Promise.resolve({ market: 'us' }), searchParams: Promise.resolve({}) })}
    </>
  );
}
